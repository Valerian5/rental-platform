"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Calendar, 
  Building, 
  MapPin, 
  User, 
  Euro, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Download, 
  Send,
  FileText,
  Upload,
  Check
} from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { calculateDaysInYear } from "@/lib/date-utils"

interface Property {
  id: string
  title: string
  address: string
  city: string
  postal_code: string
  has_lease: boolean
  lease?: {
    id: string
    start_date: string
    end_date: string
    monthly_rent: number
    charges: number
    status: string
    tenant: {
      first_name: string
      last_name: string
    }
  }
}

interface Lease {
  id: string
  start_date: string
  end_date: string
  monthly_rent: number
  charges: number
  property: {
    title: string
    address: string
    city: string
  }
  tenant: {
    first_name: string
    last_name: string
    email: string
  }
}

interface ChargeExpense {
  id: string
  category: string
  amount: number
  is_recoverable: boolean
  notes?: string
  supporting_documents: any[]
}

interface ChargeRegularization {
  id: string
  year: number
  days_occupied: number
  total_provisions: number
  total_quote_part: number
  balance: number
  calculation_method: string
  notes: string
  status: 'draft' | 'sent' | 'paid'
  expenses: ChargeExpense[]
}

export default function ChargeRegularizationPageV2() {
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [regularization, setRegularization] = useState<ChargeRegularization | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // États pour le popup d'ajout de dépense
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<ChargeExpense | null>(null)
  const [formData, setFormData] = useState({
    category: '',
    amount: 0,
    is_recoverable: true,
    notes: ''
  })

  // Charger les propriétés du propriétaire avec leurs baux
  const loadProperties = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: propertiesData, error } = await supabase
        .from('properties')
        .select(`
          id,
          title,
          address,
          city,
          postal_code,
          leases(
            id,
            start_date,
            end_date,
            monthly_rent,
            charges,
            status,
            tenant:users!leases_tenant_id_fkey(
              first_name,
              last_name
            )
          )
        `)
        .eq('owner_id', user.id)
        .order('title')

      if (error) throw error

      // Transformer les données pour inclure has_lease et le bail actif
      const transformedProperties = propertiesData.map((property: any) => {
        const leases = property.leases || []
        const activeLease = leases.find((lease: any) => lease.status === 'active')
        return {
          id: property.id,
          title: property.title,
          address: property.address,
          city: property.city,
          postal_code: property.postal_code,
          has_lease: leases.length > 0,
          lease: activeLease || leases[0] // Prendre le bail actif ou le premier disponible
        }
      })

      setProperties(transformedProperties)

      // Sélectionner automatiquement la première propriété si aucune n'est sélectionnée
      if (!selectedPropertyId && transformedProperties.length > 0) {
        setSelectedPropertyId(transformedProperties[0].id)
      }
    } catch (error) {
      console.error('Erreur chargement propriétés:', error)
      toast.error('Erreur lors du chargement des propriétés')
    }
  }, [])

  // Charger le bail pour la propriété sélectionnée
  const loadLease = useCallback(async (propertyId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: leases, error } = await supabase
        .from('leases')
        .select(`
          id,
          start_date,
          end_date,
          monthly_rent,
          charges,
          property:properties(
            title,
            address,
            city
          ),
          tenant:users!leases_tenant_id_fkey(
            first_name,
            last_name,
            email
          )
        `)
        .eq('property_id', propertyId)
        .eq('status', 'active')

      if (error) throw error

      if (leases && leases.length > 0) {
        setSelectedLease(leases[0])
      } else {
        setSelectedLease(null)
      }
    } catch (error) {
      console.error('Erreur chargement bail:', error)
      toast.error('Erreur lors du chargement du bail')
      setSelectedLease(null)
    }
  }, [])

  // Charger la régularisation pour l'année sélectionnée
  const loadRegularization = useCallback(async (lease: Lease, year: number) => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Pour l'instant, créer directement une nouvelle régularisation
      const daysOccupied = calculateDaysInYear(
        new Date(lease.start_date),
        new Date(lease.end_date),
        year
      )

      // Calculer les provisions pour cette année
      const totalProvisions = await calculateProvisions(lease, year)

      const newRegularization: ChargeRegularization = {
        id: `temp-${Date.now()}`,
        year: year,
        days_occupied: daysOccupied,
        total_provisions: totalProvisions,
        total_quote_part: 0,
        balance: totalProvisions, // Balance positive = trop-perçu
        calculation_method: 'Prorata jour exact',
        notes: '',
        status: 'draft',
        expenses: []
      }

      setRegularization(newRegularization)
      
    } catch (error) {
      console.error('Erreur chargement régularisation:', error)
      toast.error('Erreur lors du chargement de la régularisation')
    } finally {
      setLoading(false)
    }
  }, [])

  // Calculer les provisions pour l'année
  const calculateProvisions = useCallback(async (lease: Lease, year: number): Promise<number> => {
    try {
      const { data: receipts, error } = await supabase
        .from('receipts')
        .select('month, year, charges_amount')
        .eq('lease_id', lease.id)
        .eq('year', year)

      if (error) throw error

      const totalProvisions = receipts?.reduce((sum, receipt) => {
        const monthNumber = typeof receipt.month === 'string' 
          ? parseInt(receipt.month.split('-')[1] || receipt.month, 10)
          : receipt.month

        if (isNaN(monthNumber) || monthNumber < 1 || monthNumber > 12) return sum

        const receiptDate = new Date(year, monthNumber - 1, 1)
        const startDate = new Date(lease.start_date)
        const endDate = new Date(lease.end_date)

        // Vérifier si la quittance est dans la période d'occupation
        if (receiptDate >= startDate && receiptDate <= endDate) {
          return sum + (receipt.charges_amount || 0)
        }

        return sum
      }, 0) || 0

      return totalProvisions
    } catch (error) {
      console.error('Erreur calcul provisions:', error)
      return 0
    }
  }, [])

  // Mettre à jour les calculs
  const updateCalculations = useCallback(async (regularizationData: ChargeRegularization, lease: Lease, year: number) => {
    const totalProvisions = await calculateProvisions(lease, year)
    const totalQuotePart = regularizationData.expenses
      .filter((expense: ChargeExpense) => expense.is_recoverable)
      .reduce((sum: number, expense: ChargeExpense) => {
        const quotePart = expense.amount * (regularizationData.days_occupied / 365)
        return sum + quotePart
      }, 0)

    const balance = totalProvisions - totalQuotePart

    setRegularization(prev => prev ? {
      ...prev,
      total_provisions: totalProvisions,
      total_quote_part: totalQuotePart,
      balance: balance
    } : null)
  }, [calculateProvisions])

  // Gérer les changements de propriété
  const handlePropertyChange = (propertyId: string | null) => {
    setSelectedPropertyId(propertyId)
    setSelectedLease(null)
    setRegularization(null)
    if (propertyId) {
      loadLease(propertyId)
    }
  }

  // Gérer les changements d'année
  const handleYearChange = (year: number) => {
    setSelectedYear(year)
    if (selectedLease) {
      loadRegularization(selectedLease, year)
    }
  }

  // Gérer les changements de dépenses
  const handleExpensesChange = (expenses: ChargeExpense[]) => {
    setRegularization(prev => {
      if (!prev) return null
      const updated = { ...prev, expenses }
      
      // Recalculer les totaux immédiatement
      const totalQuotePart = updated.expenses
        .filter((expense: ChargeExpense) => expense.is_recoverable)
        .reduce((sum: number, expense: ChargeExpense) => {
          const quotePart = expense.amount * (updated.days_occupied / 365)
          return sum + quotePart
        }, 0)

      return {
        ...updated,
        total_quote_part: totalQuotePart,
        balance: updated.total_provisions - totalQuotePart
      }
    })
  }

  // Gérer les changements de notes
  const handleNotesChange = (notes: string) => {
    setRegularization(prev => prev ? { ...prev, notes } : null)
  }

  // Fonctions pour le popup d'ajout de dépense
  const handleAddExpense = () => {
    setEditingExpense(null)
    setFormData({
      category: '',
      amount: 0,
      is_recoverable: true,
      notes: ''
    })
    setIsDialogOpen(true)
  }

  const handleEditExpense = (expense: ChargeExpense) => {
    setEditingExpense(expense)
    setFormData({
      category: expense.category,
      amount: expense.amount,
      is_recoverable: expense.is_recoverable,
      notes: expense.notes || ''
    })
    setIsDialogOpen(true)
  }

  const handleDeleteExpense = (expenseId: string) => {
    if (!regularization) return
    const updatedExpenses = regularization.expenses.filter((expense: ChargeExpense) => expense.id !== expenseId)
    handleExpensesChange(updatedExpenses)
    toast.success('Dépense supprimée')
  }

  const handleSaveExpense = () => {
    if (!regularization) return
    
    if (!formData.category || formData.amount <= 0) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    const expenseData: ChargeExpense = {
      id: editingExpense?.id || `temp-${Date.now()}`,
      category: formData.category,
      amount: formData.amount,
      is_recoverable: formData.is_recoverable,
      notes: formData.notes,
      supporting_documents: editingExpense?.supporting_documents || []
    }

    if (editingExpense) {
      // Modifier
      const updatedExpenses = regularization.expenses.map((expense: ChargeExpense) =>
        expense.id === editingExpense.id ? expenseData : expense
      )
      handleExpensesChange(updatedExpenses)
      toast.success('Dépense modifiée')
    } else {
      // Ajouter
      handleExpensesChange([...regularization.expenses, expenseData])
      toast.success('Dépense ajoutée')
    }

    setIsDialogOpen(false)
  }

  // Sauvegarder la régularisation
  const saveRegularization = async () => {
    if (!regularization || !selectedLease) return

    setSaving(true)
    try {
      const response = await fetch('/api/revisions/charges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lease_id: selectedLease.id,
          year: selectedYear,
          days_occupied: regularization.days_occupied,
          total_provisions: regularization.total_provisions,
          total_quote_part: regularization.total_quote_part,
          balance: regularization.balance,
          calculation_method: regularization.calculation_method,
          notes: regularization.notes,
          expenses: regularization.expenses
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde')
      }

      toast.success('Régularisation sauvegardée avec succès')
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
      toast.error(`Erreur lors de la sauvegarde: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  // Générer le PDF
  const generatePDF = async () => {
    if (!regularization || !selectedLease) return

    try {
      const response = await fetch('/api/regularizations/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lease_id: selectedLease.id,
          year: selectedYear,
          regularization_data: regularization
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la génération du PDF')
      }

      // Télécharger le PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `regularisation-charges-${selectedYear}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('PDF généré et téléchargé')
    } catch (error) {
      console.error('Erreur génération PDF:', error)
      toast.error(`Erreur lors de la génération du PDF: ${error.message}`)
    }
  }

  // Envoyer au locataire
  const sendToTenant = async () => {
    if (!regularization || !selectedLease) return

    try {
      const response = await fetch('/api/regularizations/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lease_id: selectedLease.id,
          year: selectedYear,
          regularization_data: regularization
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de l\'envoi')
      }

      toast.success('Régularisation envoyée au locataire')
    } catch (error) {
      console.error('Erreur envoi:', error)
      toast.error(`Erreur lors de l'envoi: ${error.message}`)
    }
  }

  // Effets
  useEffect(() => {
    loadProperties()
  }, []) // Exécuté au montage une seule fois

  useEffect(() => {
    if (selectedPropertyId) {
      loadLease(selectedPropertyId)
    }
  }, [selectedPropertyId, loadLease]) // Exécuté seulement quand selectedPropertyId change

  useEffect(() => {
    if (selectedLease) {
      loadRegularization(selectedLease, selectedYear)
    }
  }, [selectedLease, selectedYear, loadRegularization]) // Exécuté quand selectedLease ou selectedYear changent

  useEffect(() => {
    if (regularization && selectedLease) {
      updateCalculations(regularization, selectedLease, selectedYear)
    }
  }, [regularization?.expenses, selectedLease, selectedYear, updateCalculations]) // Exécuté quand regularization.expenses, selectedLease ou selectedYear changent

  if (properties.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aucune propriété trouvée</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Régularisation des charges</h1>
          <p className="text-gray-600">Gestion des charges locatives par année</p>
        </div>
        <Badge className="text-sm">
          <Calendar className="h-4 w-4 mr-2" />
          {selectedYear}
        </Badge>
      </div>

      {/* Sélection du bien */}
      <Card>
        <CardHeader>
          <CardTitle>Sélection du bien</CardTitle>
          <CardDescription>
            Choisissez le bien pour lequel effectuer la régularisation des charges
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Propriété
            </label>
            <Select
              value={selectedPropertyId || ""}
              onValueChange={handlePropertyChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une propriété" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property: Property) => (
                  <SelectItem key={property.id} value={property.id}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4" />
                        <span>{property.title}</span>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {property.has_lease ? (
                          <Badge className="text-xs">
                            Bail
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Sans bail
                          </Badge>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPropertyId && selectedLease && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-medium text-gray-900">
                    {properties.find(p => p.id === selectedPropertyId)?.title}
                  </h3>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-1" />
                    {properties.find(p => p.id === selectedPropertyId)?.address}, {properties.find(p => p.id === selectedPropertyId)?.city} {properties.find(p => p.id === selectedPropertyId)?.postal_code}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {properties.find(p => p.id === selectedPropertyId)?.has_lease ? (
                    <Badge className="text-xs">
                      Bail actif
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Sans bail
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Locataire</div>
                    <div className="text-sm font-medium">
                      {selectedLease.tenant.first_name} {selectedLease.tenant.last_name}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Période</div>
                    <div className="text-sm font-medium">
                      {new Date(selectedLease.start_date).toLocaleDateString('fr-FR')} - {new Date(selectedLease.end_date).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Euro className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Loyer + Charges</div>
                    <div className="text-sm font-medium">
                      {selectedLease.monthly_rent.toFixed(2)} € + {selectedLease.charges.toFixed(2)} €
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Année de régularisation */}
      <Card>
        <CardHeader>
          <CardTitle>Année de régularisation</CardTitle>
          <CardDescription>
            Sélectionnez l'année pour laquelle effectuer la régularisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedYear.toString()} onValueChange={(value: string) => handleYearChange(parseInt(value))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2023, 2024, 2025, 2026].map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Dépenses réelles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Dépenses réelles</CardTitle>
              <CardDescription>
                Saisissez les montants payés annuellement pour chaque poste
              </CardDescription>
            </div>
            <Button onClick={handleAddExpense} size="sm" className="bg-black text-white hover:bg-gray-800">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une dépense
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!regularization || regularization.expenses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Aucune dépense enregistrée</p>
              <Button onClick={handleAddExpense} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter la première dépense
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* En-tête du tableau */}
              <div className="grid grid-cols-6 gap-4 p-3 bg-gray-50 rounded-lg font-medium text-sm text-gray-700">
                <div>Poste de dépense</div>
                <div>Montant payé (€)</div>
                <div>Récupérable</div>
                <div>Quote-part locataire (€)</div>
                <div>Justificatifs</div>
                <div>Actions</div>
              </div>
              
              {/* Lignes des dépenses */}
              {regularization.expenses.map((expense: ChargeExpense) => {
                const quotePart = expense.is_recoverable ? expense.amount * (regularization.days_occupied / 365) : 0
                return (
                  <div key={expense.id} className="grid grid-cols-6 gap-4 p-3 border rounded-lg items-center">
                    <div className="font-medium">{expense.category}</div>
                    <div>{expense.amount.toFixed(2)}</div>
                    <div className="flex items-center">
                      <Checkbox checked={expense.is_recoverable} disabled />
                    </div>
                    <div className="font-medium text-blue-600">{quotePart.toFixed(2)}</div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {expense.supporting_documents?.length || 0}
                      </span>
                      <Button variant="ghost" size="sm">
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditExpense(expense)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteExpense(expense.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
              
              {/* Totaux */}
              <div className="grid grid-cols-6 gap-4 p-3 bg-blue-50 rounded-lg font-medium">
                <div>Total dépenses</div>
                <div className="text-blue-600 font-bold">
                  {regularization.expenses.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2)} €
                </div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
              </div>
              
              <div className="grid grid-cols-6 gap-4 p-3 bg-green-50 rounded-lg font-medium">
                <div>Total récupérable</div>
                <div className="text-green-600 font-bold">
                  {regularization.expenses
                    .filter(expense => expense.is_recoverable)
                    .reduce((sum, expense) => sum + expense.amount, 0).toFixed(2)} €
                </div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
              </div>
              
              <div className="grid grid-cols-6 gap-4 p-3 bg-orange-50 rounded-lg font-medium">
                <div>Quote-part locataire</div>
                <div></div>
                <div></div>
                <div className="text-orange-600 font-bold">
                  {regularization.total_quote_part.toFixed(2)} €
                </div>
                <div></div>
                <div></div>
              </div>
            </div>
          )}

          {/* Dialog d'ajout/modification */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingExpense ? 'Modifier la dépense' : 'Ajouter une dépense'}
                </DialogTitle>
                <DialogDescription>
                  Saisissez les informations de la dépense
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category">Poste de dépense *</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Ex: Eau froide, Chauffage, Ascenseur..."
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Montant payé (€) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recoverable"
                    checked={formData.is_recoverable}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_recoverable: !!checked })}
                  />
                  <Label htmlFor="recoverable">Charge récupérable</Label>
                </div>
                <div>
                  <Label htmlFor="notes">Notes (optionnel)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Informations complémentaires..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSaveExpense}>
                  {editingExpense ? 'Modifier' : 'Ajouter'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Synthèse de la régularisation */}
      <Card>
        <CardHeader>
          <CardTitle>€ Résumé de la régularisation</CardTitle>
          <CardDescription>
            Calcul basé sur {regularization?.days_occupied || 0} jours d'occupation ({regularization ? ((regularization.days_occupied / 365) * 100).toFixed(1) : '0'}% de l'année)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informations principales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-2">Provisions versées</div>
              <div className="text-2xl font-bold text-gray-900">{regularization?.total_provisions.toFixed(2) || '0.00'} €</div>
              <div className="text-xs text-gray-500 mt-1">Montant total encaissé</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-2">Quote-part locataire</div>
              <div className="text-2xl font-bold text-blue-600">{regularization?.total_quote_part.toFixed(2) || '0.00'} €</div>
              <div className="text-xs text-gray-500 mt-1">Montant dû par le locataire</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-2">Balance</div>
              <div className="text-2xl font-bold text-red-600">{Math.abs(regularization?.balance || 0).toFixed(2)} €</div>
              <div className="text-xs text-gray-500 mt-1">Complément à réclamer</div>
            </div>
          </div>

          {/* Détail du calcul */}
          <div className="border-t pt-6">
            <h4 className="font-semibold text-gray-900 mb-4">Détail du calcul</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Provisions versées :</span>
                <span className="font-medium">{regularization?.total_provisions.toFixed(2) || '0.00'} €</span>
              </div>
              <div className="flex justify-between">
                <span>Quote-part locataire :</span>
                <span className="font-medium text-blue-600">-{regularization?.total_quote_part.toFixed(2) || '0.00'} €</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Balance :</span>
                <span className="text-red-600">-{Math.abs(regularization?.balance || 0).toFixed(2)} €</span>
              </div>
            </div>
            
            {/* Message explicatif */}
            <div className="mt-4 p-4 bg-red-50 rounded-lg">
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white mb-2">
                <Check className="h-4 w-4 mr-2" />
                Complément à réclamer
              </Button>
              <p className="text-sm text-red-800 text-center">
                <strong>Complément à réclamer :</strong> Le locataire doit verser {Math.abs(regularization?.balance || 0).toFixed(2)} € en complément des provisions déjà payées.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Méthode de calcul */}
      <Card>
        <CardHeader>
          <CardTitle>Méthode de calcul</CardTitle>
          <CardDescription>
            Expliquez votre méthode de calcul des charges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            className="w-full h-24"
            placeholder="Ex: Répartition au prorata de la surface + relevés fournisseurs..."
            value={regularization?.notes || ''}
            onChange={(e) => handleNotesChange(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Toutes les modifications sont sauvegardées automatiquement
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={saveRegularization}
              disabled={saving || !regularization}
              variant="outline"
            >
              <FileText className="h-4 w-4 mr-2" />
              Sauvegarder
            </Button>
            <Button 
              variant="outline" 
              disabled={!regularization}
              onClick={generatePDF}
            >
              <Download className="h-4 w-4 mr-2" />
              Générer PDF
            </Button>
            <Button 
              disabled={!regularization}
              onClick={sendToTenant}
              className="bg-black text-white hover:bg-gray-800"
            >
              <Send className="h-4 w-4 mr-2" />
              Envoyer au locataire
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}