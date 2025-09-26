"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Building, MapPin, User, Euro } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { calculateDaysInYear } from "@/lib/date-utils"
import { YearSelector } from "@/components/YearSelector"
import { LeaseInfoCard } from "@/components/LeaseInfoCard"
import { ExpensesTable } from "@/components/ExpensesTable"
import { BalanceSummary } from "@/components/BalanceSummary"
import { ActionButtons } from "@/components/ActionButtons"

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
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [regularization, setRegularization] = useState<ChargeRegularization | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

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
      const transformedProperties = propertiesData.map(property => {
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
  }, [selectedPropertyId])

  // Charger le bail pour la propriété sélectionnée
  const loadLease = useCallback(async () => {
    if (!selectedPropertyId) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: lease, error } = await supabase
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
        .eq('property_id', selectedPropertyId)
        .eq('status', 'active')
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (lease) {
        setSelectedLease(lease)
      } else {
        setSelectedLease(null)
      }
    } catch (error) {
      console.error('Erreur chargement bail:', error)
      toast.error('Erreur lors du chargement du bail')
      setSelectedLease(null)
    }
  }, [selectedPropertyId])

  // Charger la régularisation pour l'année sélectionnée
  const loadRegularization = useCallback(async () => {
    if (!selectedLease) {
      console.log('🔍 loadRegularization - Pas de bail sélectionné')
      return
    }

    console.log('🔍 loadRegularization - Bail sélectionné:', selectedLease.id, 'Année:', selectedYear)
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Pour l'instant, créer directement une nouvelle régularisation
      // TODO: Implémenter la sauvegarde/chargement depuis la base de données
      console.log('🔍 loadRegularization - Création d\'une nouvelle régularisation')
      
      const daysOccupied = calculateDaysInYear(
        new Date(selectedLease.start_date),
        new Date(selectedLease.end_date),
        selectedYear
      )

      const newRegularization: ChargeRegularization = {
        id: `temp-${Date.now()}`,
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

      console.log('🔍 loadRegularization - Nouvelle régularisation créée:', newRegularization)
      setRegularization(newRegularization)
      
    } catch (error) {
      console.error('Erreur chargement régularisation:', error)
      toast.error('Erreur lors du chargement de la régularisation')
    } finally {
      setLoading(false)
    }
  }, [selectedLease, selectedYear])

  // Calculer les provisions pour l'année (sans prorata)
  const calculateProvisions = useCallback(async (): Promise<number> => {
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

      // Calculer les provisions mois par mois (sans prorata)
      for (let month = 1; month <= 12; month++) {
        const monthStart = new Date(selectedYear, month - 1, 1)

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
  }, [selectedLease, selectedYear])

  // Mettre à jour les calculs
  const updateCalculations = useCallback(async () => {
    if (!regularization) return

    const totalProvisions = await calculateProvisions()
    const totalQuotePart = regularization.expenses
      .filter((expense: ChargeExpense) => expense.is_recoverable)
      .reduce((sum: number, expense: ChargeExpense) => {
        const quotePart = expense.amount * (regularization.days_occupied / 365)
        return sum + quotePart
      }, 0)

    const balance = totalProvisions - totalQuotePart

    setRegularization((prev: ChargeRegularization | null) => prev ? {
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
      console.log('🔍 saveRegularization - Sauvegarde en cours...')
      console.log('🔍 saveRegularization - Données:', regularization)
      
      // Pour l'instant, simuler une sauvegarde réussie
      // TODO: Implémenter la vraie sauvegarde en base de données
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('Régularisation sauvegardée (mode démo)')
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
      console.log('🔍 generatePDF - Génération PDF en cours...')
      
      // Pour l'instant, simuler la génération PDF
      // TODO: Implémenter la vraie génération PDF
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('PDF généré (mode démo)')
    } catch (error) {
      console.error('Erreur génération PDF:', error)
      toast.error('Erreur lors de la génération du PDF')
    }
  }, [regularization, selectedLease, selectedYear])

  // Envoyer au locataire
  const sendToTenant = useCallback(async () => {
    if (!regularization || !selectedLease) return

    try {
      console.log('🔍 sendToTenant - Envoi au locataire en cours...')
      
      // Pour l'instant, simuler l'envoi
      // TODO: Implémenter le vrai envoi au locataire
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mettre à jour le statut
      setRegularization((prev: ChargeRegularization | null) => prev ? { ...prev, status: 'sent' } : null)

      toast.success('Régularisation envoyée au locataire (mode démo)')
    } catch (error) {
      console.error('Erreur envoi:', error)
      toast.error('Erreur lors de l\'envoi au locataire')
    }
  }, [regularization, selectedLease, selectedYear])

  // Gérer les changements de propriété
  const handlePropertyChange = (propertyId: string | null) => {
    setSelectedPropertyId(propertyId)
    setSelectedLease(null)
    setRegularization(null)
  }

  // Gérer les changements d'année
  const handleYearChange = (year: number) => {
    setSelectedYear(year)
  }

  // Gérer les changements de dépenses
  const handleExpensesChange = (expenses: ChargeExpense[]) => {
    console.log('🔍 Page - handleExpensesChange appelé:', expenses)
    try {
      setRegularization((prev: ChargeRegularization | null) => prev ? { ...prev, expenses } : null)
      console.log('🔍 Page - État regularization mis à jour')
    } catch (error) {
      console.error('❌ Page - Erreur handleExpensesChange:', error)
    }
  }

  // Gérer les changements de notes
  const handleNotesChange = (notes: string) => {
    setRegularization((prev: ChargeRegularization | null) => prev ? { ...prev, notes } : null)
  }

  // Effets
  useEffect(() => {
    loadProperties()
  }, [loadProperties])

  useEffect(() => {
    loadLease()
  }, [loadLease])

  useEffect(() => {
    loadRegularization()
  }, [loadRegularization])

  useEffect(() => {
    updateCalculations()
  }, [updateCalculations])

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
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleNotesChange(e.target.value)}
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