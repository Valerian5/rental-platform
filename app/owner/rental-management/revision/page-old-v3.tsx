"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar, Building, User, Euro, FileText, Send } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { calculateDaysInYear } from "@/lib/date-utils"
import { YearSelector } from "@/components/YearSelector"
import { LeaseInfoCard } from "@/components/LeaseInfoCard"
import { ExpensesTable } from "@/components/ExpensesTable"
import { BalanceSummary } from "@/components/BalanceSummary"
import { ActionButtons } from "@/components/ActionButtons"

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
  const loadRegularization = useCallback(async () => {
    if (!selectedLease) return

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
        .eq('lease_id', selectedLease.id)
        .eq('year', selectedYear)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (regularizationData) {
        setRegularization(regularizationData)
      } else {
        // Créer une nouvelle régularisation
        const daysOccupied = calculateDaysInYear(
          new Date(selectedLease.start_date),
          new Date(selectedLease.end_date),
          selectedYear
        )

        const newRegularization: ChargeRegularization = {
          id: '',
          year: selectedYear,
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
  }, [selectedLease, selectedYear])

  // Calculer les provisions pour l'année avec prorata
  const calculateProvisions = useCallback(async () => {
    if (!selectedLease) return 0

    try {
      const leaseStartDate = new Date(selectedLease.start_date)
      const leaseEndDate = new Date(selectedLease.end_date)
      const yearStart = new Date(selectedYear, 0, 1)
      const yearEnd = new Date(selectedYear, 11, 31)

      // Période effective d'occupation dans l'année
      const effectiveStart = leaseStartDate > yearStart ? leaseStartDate : yearStart
      const effectiveEnd = leaseEndDate < yearEnd ? leaseEndDate : yearEnd

      let totalProvisions = 0
      const monthlyCharges = selectedLease.charges || 0

      // Calculer les provisions mois par mois
      for (let month = 1; month <= 12; month++) {
        const monthStart = new Date(selectedYear, month - 1, 1)
        const monthEnd = new Date(selectedYear, month, 0) // Dernier jour du mois

        // Vérifier si le mois est dans la période d'occupation
        if (monthStart >= effectiveStart && monthStart <= effectiveEnd) {
          // Si c'est le premier mois d'occupation, appliquer le prorata
          if (monthStart.getTime() === effectiveStart.getTime()) {
            const daysInMonth = monthEnd.getDate()
            const daysOccupied = Math.min(
              daysInMonth - effectiveStart.getDate() + 1,
              daysInMonth
            )
            const prorata = daysOccupied / daysInMonth
            totalProvisions += monthlyCharges * prorata
          } else {
            // Mois complets
            totalProvisions += monthlyCharges
          }
        }
      }

      return totalProvisions
    } catch (error) {
      console.error('Erreur calcul provisions:', error)
      return 0
    }
  }, [selectedLease, selectedYear])

  // Mettre à jour les calculs
  const updateCalculations = useCallback(async () => {
    if (!regularization) return

    const totalProvisions = await calculateProvisions()
    const totalQuotePart = regularization.expenses
      .filter(expense => expense.is_recoverable)
      .reduce((sum, expense) => {
        const quotePart = expense.amount * (regularization.days_occupied / 365)
        return sum + quotePart
      }, 0)

    const balance = totalProvisions - totalQuotePart

    setRegularization(prev => prev ? {
      ...prev,
      total_provisions: totalProvisions,
      total_quote_part: totalQuotePart,
      balance: balance
    } : null)
  }, [regularization, calculateProvisions])

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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const response = await fetch('/api/regularizations/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          regularizationId: regularization.id,
          leaseId: selectedLease.id,
          year: selectedYear
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur génération PDF')
      }

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
      toast.error('Erreur lors de la génération du PDF')
    }
  }, [regularization, selectedLease, selectedYear])

  // Envoyer au locataire
  const sendToTenant = useCallback(async () => {
    if (!regularization || !selectedLease) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const response = await fetch('/api/regularizations/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          regularizationId: regularization.id,
          leaseId: selectedLease.id,
          year: selectedYear
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur envoi au locataire')
      }

      // Mettre à jour le statut
      setRegularization(prev => prev ? { ...prev, status: 'sent' } : null)

      toast.success('Régularisation envoyée au locataire')
    } catch (error) {
      console.error('Erreur envoi:', error)
      toast.error('Erreur lors de l\'envoi au locataire')
    }
  }, [regularization, selectedLease, selectedYear])

  // Gérer les changements d'année
  const handleYearChange = (year: number) => {
    setSelectedYear(year)
  }

  // Gérer les changements de dépenses
  const handleExpensesChange = (expenses: ChargeExpense[]) => {
    setRegularization(prev => prev ? { ...prev, expenses } : null)
  }

  // Gérer les changements de notes
  const handleNotesChange = (notes: string) => {
    setRegularization(prev => prev ? { ...prev, notes } : null)
  }

  // Effets
  useEffect(() => {
    loadLeases()
  }, [loadLeases])

  useEffect(() => {
    loadRegularization()
  }, [loadRegularization])

  useEffect(() => {
    updateCalculations()
  }, [updateCalculations])

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
        <Badge variant="outline" className="text-sm">
          <Calendar className="h-4 w-4 mr-2" />
          {selectedYear}
        </Badge>
      </div>

      {/* Navigation par année */}
      <YearSelector
        value={selectedYear}
        onChange={handleYearChange}
        leaseStartDate={selectedLease.start_date}
        leaseEndDate={selectedLease.end_date}
      />

      {/* Informations du bail */}
      <LeaseInfoCard
        lease={selectedLease}
        year={selectedYear}
        daysOccupied={regularization?.days_occupied || 0}
      />

      {/* Tableau des dépenses */}
      <ExpensesTable
        expenses={regularization?.expenses || []}
        daysOccupied={regularization?.days_occupied || 0}
        onExpensesChange={handleExpensesChange}
        loading={loading}
      />

      {/* Résumé et balance */}
      <BalanceSummary
        totalProvisions={regularization?.total_provisions || 0}
        totalQuotePart={regularization?.total_quote_part || 0}
        balance={regularization?.balance || 0}
        daysOccupied={regularization?.days_occupied || 0}
      />

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
      <ActionButtons
        onSave={saveRegularization}
        onGeneratePDF={generatePDF}
        onSend={sendToTenant}
        saving={saving}
        disabled={!regularization}
      />
    </div>
  )
}
