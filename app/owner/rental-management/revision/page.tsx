"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar, Building, User, Euro, FileText, Send, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { calculateDaysInYear } from "@/lib/date-utils"

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

interface ChargeExpense {
  id: string
  category: string
  amount: number
  is_recoverable: boolean
  notes?: string
  supporting_documents: SupportingDocument[]
}

interface SupportingDocument {
  id: string
  file_name: string
  file_url: string
  file_size?: number
  file_type?: string
}

export default function ChargeRegularizationPageV2() {
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [regularization, setRegularization] = useState<ChargeRegularization | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Charger les baux du propriétaire
  const loadLeases = useCallback(async () => {
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
        .eq('owner_id', user.id)
        .eq('status', 'active')

      if (error) throw error

      if (leases && leases.length > 0) {
        setSelectedLease(leases[0])
      }
    } catch (error) {
      console.error('Erreur chargement baux:', error)
      toast.error('Erreur lors du chargement des baux')
    }
  }, [])

  // Charger la régularisation pour l'année sélectionnée
  const loadRegularization = useCallback(async (lease: Lease, year: number) => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: regularizationData, error } = await supabase
        .from('charge_regularizations_v2')
        .select(`
          *,
          expenses:charge_expenses(
            *,
            supporting_documents:charge_supporting_documents(*)
          )
        `)
        .eq('lease_id', lease.id)
        .eq('year', year)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (regularizationData) {
        setRegularization(regularizationData)
      } else {
        // Créer une nouvelle régularisation
        const daysOccupied = calculateDaysInYear(
          new Date(lease.start_date),
          new Date(lease.end_date),
          year
        )

        const newRegularization: ChargeRegularization = {
          id: '',
          year: year,
          days_occupied: daysOccupied,
          total_provisions: 0,
          total_quote_part: 0,
          balance: 0,
          calculation_method: 'Prorata jour exact',
          notes: '',
          status: 'draft',
          expenses: []
        }

        setRegularization(newRegularization)
      }
    } catch (error) {
      console.error('Erreur chargement régularisation:', error)
      toast.error('Erreur lors du chargement de la régularisation')
    } finally {
      setLoading(false)
    }
  }, [])

  // Calculer les provisions pour l'année
  const calculateProvisions = useCallback(async (lease: Lease, year: number) => {
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
      .filter(expense => expense.is_recoverable)
      .reduce((sum, expense) => {
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

  // Sauvegarder la régularisation
  const saveRegularization = useCallback(async () => {
    if (!regularization || !selectedLease) return

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const regularizationData = {
        lease_id: selectedLease.id,
        year: selectedYear,
        days_occupied: regularization.days_occupied,
        total_provisions: regularization.total_provisions,
        total_quote_part: regularization.total_quote_part,
        balance: regularization.balance,
        calculation_method: regularization.calculation_method,
        notes: regularization.notes,
        status: regularization.status,
        created_by: user.id
      }

      let regularizationId = regularization.id

      if (regularizationId) {
        // Mettre à jour
        const { error } = await supabase
          .from('charge_regularizations_v2')
          .update(regularizationData)
          .eq('id', regularizationId)

        if (error) throw error
      } else {
        // Créer
        const { data, error } = await supabase
          .from('charge_regularizations_v2')
          .insert(regularizationData)
          .select()
          .single()

        if (error) throw error
        regularizationId = data.id
      }

      // Sauvegarder les dépenses
      if (regularization.expenses.length > 0) {
        // Supprimer les anciennes dépenses
        await supabase
          .from('charge_expenses')
          .delete()
          .eq('regularization_id', regularizationId)

        // Insérer les nouvelles dépenses
        const expensesData = regularization.expenses.map(expense => ({
          regularization_id: regularizationId,
          category: expense.category,
          amount: expense.amount,
          is_recoverable: expense.is_recoverable,
          notes: expense.notes
        }))

        const { error: expensesError } = await supabase
          .from('charge_expenses')
          .insert(expensesData)

        if (expensesError) throw expensesError
      }

      toast.success('Régularisation sauvegardée')
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }, [regularization, selectedLease, selectedYear])

  // Générer le PDF
  const generatePDF = useCallback(async () => {
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
  }, [regularization, selectedLease, selectedYear])

  // Envoyer au locataire
  const sendToTenant = useCallback(async () => {
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
  }, [regularization, selectedLease, selectedYear])

  // Fonction de rafraîchissement
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await loadLeases()
      if (selectedLease) {
        await loadRegularization(selectedLease, selectedYear)
      }
      toast.success("Données mises à jour")
    } catch (error) {
      console.error("Erreur lors du rafraîchissement:", error)
      toast.error("Erreur lors de la mise à jour")
    } finally {
      setIsRefreshing(false)
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
        .filter(expense => expense.is_recoverable)
        .reduce((sum, expense) => {
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

  // Effets
  useEffect(() => {
    loadLeases()
  }, []) // Exécuté au montage une seule fois

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

  if (!selectedLease) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aucun bail actif trouvé</p>
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
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-sm">
            <Calendar className="h-4 w-4 mr-2" />
            {selectedYear}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Navigation par année */}
      <Card>
        <CardHeader>
          <CardTitle>Année de régularisation</CardTitle>
          <CardDescription>
            Sélectionnez l'année pour laquelle effectuer la régularisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedYear.toString()} onValueChange={(value) => handleYearChange(parseInt(value))}>
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
            <Button onClick={() => {/* TODO: Ajouter dépense */}} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une dépense
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!regularization || regularization.expenses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Aucune dépense enregistrée</p>
              <Button onClick={() => {/* TODO: Ajouter dépense */}} variant="outline">
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
                      <input type="checkbox" checked={expense.is_recoverable} disabled className="mr-2" />
                    </div>
                    <div className="font-medium">{quotePart.toFixed(2)}</div>
                    <div className="text-sm text-gray-500">
                      {expense.supporting_documents?.length || 0} fichier(s)
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
              
              {/* Totaux */}
              <div className="grid grid-cols-6 gap-4 p-3 bg-blue-50 rounded-lg font-medium">
                <div>Total dépenses</div>
                <div className="text-blue-600">
                  {regularization.expenses.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2)} €
                </div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
              </div>
              
              <div className="grid grid-cols-6 gap-4 p-3 bg-green-50 rounded-lg font-medium">
                <div>Total récupérable</div>
                <div className="text-green-600">
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
                <div className="text-orange-600">
                  {regularization.total_quote_part.toFixed(2)} €
                </div>
                <div></div>
                <div></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Résumé et balance */}
      <Card>
        <CardHeader>
          <CardTitle>Résumé de la régularisation</CardTitle>
          <CardDescription>
            Calcul basé sur {regularization?.days_occupied || 0} jours d'occupation ({regularization ? ((regularization.days_occupied / 365) * 100).toFixed(1) : '0'}% de l'année)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informations principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Provisions versées</span>
                <span className="text-lg font-bold">{regularization?.total_provisions.toFixed(2) || '0.00'} €</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="font-medium">Montant total encaissé</span>
                <span className="text-lg font-bold text-blue-600">{regularization?.total_provisions.toFixed(2) || '0.00'} €</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="font-medium">Quote-part locataire</span>
                <span className="text-lg font-bold text-orange-600">{regularization?.total_quote_part.toFixed(2) || '0.00'} €</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="font-medium">Montant dû par le locataire</span>
                <span className="text-lg font-bold text-red-600">{Math.abs(regularization?.balance || 0).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-medium">Balance</span>
                <span className={`text-lg font-bold ${(regularization?.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {regularization?.balance.toFixed(2) || '0.00'} €
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="font-medium">{(regularization?.balance || 0) >= 0 ? 'Trop-perçu' : 'Complément à réclamer'}</span>
                <span className={`text-lg font-bold ${(regularization?.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(regularization?.balance || 0).toFixed(2)} €
                </span>
              </div>
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
                <span className="font-medium text-red-600">-{regularization?.total_quote_part.toFixed(2) || '0.00'} €</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Balance :</span>
                <span className={regularization?.balance && regularization.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {regularization?.balance.toFixed(2) || '0.00'} €
                </span>
              </div>
            </div>
            
            {/* Message explicatif */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>{(regularization?.balance || 0) >= 0 ? 'Trop-perçu' : 'Complément à réclamer'}</strong> : 
                {(regularization?.balance || 0) >= 0 
                  ? ` Le propriétaire doit rembourser ${Math.abs(regularization?.balance || 0).toFixed(2)} € au locataire.`
                  : ` Le locataire doit verser ${Math.abs(regularization?.balance || 0).toFixed(2)} € en complément des provisions déjà payées.`
                }
              </p>
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
          <textarea
            className="w-full h-24 p-3 border border-gray-300 rounded-md resize-none"
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
                <FileText className="h-4 w-4 mr-2" />
                Générer PDF
              </Button>
              <Button 
                variant="outline" 
                disabled={!regularization}
                onClick={sendToTenant}
              >
                <Send className="h-4 w-4 mr-2" />
                Envoyer au locataire
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}