"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Calendar, Building, MapPin, User, Euro, Plus, Edit, Trash2 } from "lucide-react"
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
      setSelectedPropertyId((prev: string | null) => {
        if (!prev && transformedProperties.length > 0) {
          return transformedProperties[0].id
        }
        return prev
      })
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

      console.log('🔍 loadLease - Recherche bail pour property_id:', propertyId)

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

      console.log('🔍 loadLease - Résultat:', { leases, error })

      if (error) {
        console.error('❌ loadLease - Erreur:', error)
        throw error
      }

      if (leases && leases.length > 0) {
        setSelectedLease(leases[0])
        console.log('🔍 loadLease - Bail trouvé:', leases[0])
      } else {
        setSelectedLease(null)
        console.log('🔍 loadLease - Aucun bail actif trouvé')
      }
    } catch (error) {
      console.error('Erreur chargement bail:', error)
      toast.error('Erreur lors du chargement du bail')
      setSelectedLease(null)
    }
  }, [])

  // Charger la régularisation pour l'année sélectionnée
  const loadRegularization = useCallback(async (lease: Lease, year: number) => {
    console.log('🔍 loadRegularization - Bail sélectionné:', lease.id, 'Année:', year)
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Pour l'instant, créer directement une nouvelle régularisation
      console.log('🔍 loadRegularization - Création d\'une nouvelle régularisation')
      
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
        balance: totalProvisions,
        calculation_method: 'Prorata jour exact',
        notes: '',
        status: 'draft',
        expenses: []
      }

      console.log('🔍 loadRegularization - Nouvelle régularisation créée:', newRegularization)
      setRegularization(newRegularization)
      
    } catch (error) {
      console.error('Erreur chargement régularisation:', error)
      toast.error('Erreur lors du chargement de la régularisation')
    } finally {
      setLoading(false)
    }
  }, [])

  // Calculer les provisions pour l'année (sans prorata)
  const calculateProvisions = useCallback(async (lease: Lease, year: number): Promise<number> => {
    try {
      const leaseStartDate = new Date(lease.start_date)
      const leaseEndDate = new Date(lease.end_date)
      const yearStart = new Date(year, 0, 1)
      const yearEnd = new Date(year, 11, 31)

      // Période effective d'occupation dans l'année
      const effectiveStart = leaseStartDate > yearStart ? leaseStartDate : yearStart
      const effectiveEnd = leaseEndDate < yearEnd ? leaseEndDate : yearEnd

      let totalProvisions = 0
      const monthlyCharges = lease.charges || 0

      // Calculer les provisions mois par mois (sans prorata)
      for (let month = 1; month <= 12; month++) {
        const monthStart = new Date(year, month - 1, 1)

        // Vérifier si le mois est dans la période d'occupation
        if (monthStart >= effectiveStart && monthStart <= effectiveEnd) {
          // Montant complet du mois (pas de prorata)
          totalProvisions += monthlyCharges
        }
      }

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

    setRegularization((prev: ChargeRegularization | null) => prev ? {
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
    console.log('🔍 Page - handleExpensesChange appelé:', expenses)
    try {
      setRegularization((prev: ChargeRegularization | null) => {
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
      console.log('🔍 Page - État regularization mis à jour')
    } catch (error) {
      console.error('❌ Page - Erreur handleExpensesChange:', error)
    }
  }

  // Gérer les changements de notes
  const handleNotesChange = (notes: string) => {
    setRegularization((prev: ChargeRegularization | null) => prev ? { ...prev, notes } : null)
  }

  // Fonctions pour le popup d'ajout de dépense
  const handleAddExpense = () => {
    console.log('🔍 ExpensesTable - handleAddExpense appelé')
    try {
      setEditingExpense(null)
      setFormData({
        category: '',
        amount: 0,
        is_recoverable: true,
        notes: ''
      })
      console.log('🔍 ExpensesTable - État formData réinitialisé')
      setIsDialogOpen(true)
      console.log('🔍 ExpensesTable - Dialog ouvert')
    } catch (error) {
      console.error('❌ ExpensesTable - Erreur handleAddExpense:', error)
    }
  }

  const handleEditExpense = (expense: ChargeExpense) => {
    console.log('🔍 ExpensesTable - handleEditExpense appelé:', expense)
    try {
      setEditingExpense(expense)
      setFormData({
        category: expense.category,
        amount: expense.amount,
        is_recoverable: expense.is_recoverable,
        notes: expense.notes || ''
      })
      console.log('🔍 ExpensesTable - État formData mis à jour')
      setIsDialogOpen(true)
      console.log('🔍 ExpensesTable - Dialog ouvert pour édition')
    } catch (error) {
      console.error('❌ ExpensesTable - Erreur handleEditExpense:', error)
    }
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
      console.log('🔍 saveRegularization - Sauvegarde en cours...')
      console.log('🔍 saveRegularization - Données:', regularization)
      
      // Pour l'instant, simuler une sauvegarde réussie
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('Régularisation sauvegardée (mode démo)')
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  // Générer le PDF
  const generatePDF = async () => {
    if (!regularization || !selectedLease) return

    try {
      console.log('🔍 generatePDF - Génération en cours...')
      
      // Pour l'instant, simuler une génération réussie
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('PDF généré (mode démo)')
    } catch (error) {
      console.error('Erreur génération PDF:', error)
      toast.error('Erreur lors de la génération du PDF')
    }
  }

  // Envoyer au locataire
  const sendToTenant = async () => {
    if (!regularization || !selectedLease) return

    try {
      console.log('🔍 sendToTenant - Envoi en cours...')
      
      // Pour l'instant, simuler un envoi réussi
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('Envoyé au locataire (mode démo)')
    } catch (error) {
      console.error('Erreur envoi:', error)
      toast.error('Erreur lors de l\'envoi')
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

  if (!selectedPropertyId) {
  return (
    <div className="space-y-6">
        {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Régularisation des charges</h1>
            <p className="text-gray-600">Gestion des charges locatives par année</p>
          </div>
        </div>

        {/* Sélecteur de propriété */}
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
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!selectedLease) {
    return (
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Régularisation des charges</h1>
            <p className="text-gray-600">Gestion des charges locatives par année</p>
              </div>
            </div>

        {/* Sélecteur de propriété */}
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
                  {properties.map((property) => (
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
        </CardContent>
      </Card>

        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucun bail actif trouvé pour cette propriété</p>
          </div>
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

      {/* Sélecteur de propriété */}
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
                {properties.map((property) => (
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

          {selectedPropertyId && (
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

              {selectedLease && (
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
              )}
              </div>
            )}
        </CardContent>
      </Card>

      {/* Navigation par année */}
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

      {/* Informations du bail */}
      <Card>
        <CardHeader>
          <CardTitle>Informations du bail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Période d'occupation en {selectedYear}</div>
              <div className="text-lg font-semibold">{regularization?.days_occupied || 0} jours</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Charges mensuelles</div>
              <div className="text-lg font-semibold">{selectedLease.charges.toFixed(2)} €</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des dépenses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Dépenses réelles</CardTitle>
              <CardDescription>
                Saisissez les montants payés annuellement pour chaque poste
              </CardDescription>
            </div>
            <Button onClick={handleAddExpense} size="sm">
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
              {regularization.expenses.map((expense: ChargeExpense) => (
                <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">{expense.category}</div>
                    <div className="text-sm text-gray-600">
                      {expense.amount.toFixed(2)} € - {expense.is_recoverable ? 'Récupérable' : 'Non récupérable'}
                    </div>
                    {expense.notes && (
                      <div className="text-sm text-gray-500">{expense.notes}</div>
                    )}
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
              ))}
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
                <div>
                  <Label htmlFor="documents">Pièces jointes (optionnel)</Label>
                  <Input
                    id="documents"
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => {
                      const files = e.target.files
                      if (files) {
                        console.log('Fichiers sélectionnés:', files.length)
                        // Ici on pourrait traiter l'upload des fichiers
                      }
                    }}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formats acceptés: PDF, JPG, PNG, DOC, DOCX
                  </p>
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

      {/* Résumé et balance */}
      <Card>
        <CardHeader>
          <CardTitle>Synthèse de la régularisation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-500">Total provisions</div>
              <div className="text-2xl font-bold">{regularization?.total_provisions.toFixed(2) || '0.00'} €</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">Quote-part locataire</div>
              <div className="text-2xl font-bold text-blue-600">{regularization?.total_quote_part.toFixed(2) || '0.00'} €</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">Balance</div>
              <div className={`text-2xl font-bold ${(regularization?.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {regularization?.balance.toFixed(2) || '0.00'} €
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes et méthode de calcul */}
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
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <Button
              onClick={saveRegularization}
              disabled={saving || !regularization}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                disabled={!regularization}
                onClick={generatePDF}
              >
                Générer PDF
              </Button>
              <Button 
                variant="outline" 
                disabled={!regularization}
                onClick={sendToTenant}
              >
                Envoyer au locataire
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}