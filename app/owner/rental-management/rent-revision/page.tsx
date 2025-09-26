"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Calculator,
  TrendingUp,
  Building,
  User,
  Euro,
  FileText,
  Download,
  Send,
  Calendar,
  AlertTriangle,
  CheckCircle
} from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

interface Property {
  id: string
  title: string
  address: string
  city: string
}

interface Lease {
  id: string
  property_id: string
  tenant_id: string
  start_date: string
  end_date: string
  monthly_rent: number
  charges: number
  status: string
  property: Property
  tenant: {
    first_name: string
    last_name: string
    email: string
  }
  owner: {
    first_name: string
    last_name: string
    email: string
  }
  // Données IRL
  date_reference_irl?: string
  trimestre_reference_irl?: string
  loyer_reference?: number
}

interface IRLIndex {
  id: string
  year: number
  quarter: string
  value: number
  publication_date: string
}

interface RentRevision {
  id?: string
  lease_id: string
  property_id: string
  revision_year: number
  revision_date: string
  reference_irl_value: number
  new_irl_value: number
  irl_quarter: string
  old_rent_amount: number
  new_rent_amount: number
  rent_increase_amount: number
  rent_increase_percentage: number
  status: 'draft' | 'calculated' | 'validated' | 'sent' | 'signed'
  validation_date?: string
  sent_to_tenant_date?: string
  amendment_pdf_url?: string
  amendment_pdf_filename?: string
  calculation_method?: string
  legal_compliance_checked?: boolean
  compliance_notes?: string
  created_at?: string
  updated_at?: string
  created_by?: string
}

export default function RentRevisionPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("")
  const [leases, setLeases] = useState<Lease[]>([])
  const [selectedLeaseId, setSelectedLeaseId] = useState<string>("")
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null)
  const [irlIndices, setIRLIndices] = useState<IRLIndex[]>([])
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [revision, setRevision] = useState<RentRevision | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Charger les propriétés
  const loadProperties = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: propertiesData, error } = await supabase
        .from('properties')
        .select('id, title, address, city')
        .eq('owner_id', user.id)
        .order('title')

      if (error) throw error
      setProperties(propertiesData || [])
    } catch (error) {
      console.error('Erreur chargement propriétés:', error)
      toast.error('Erreur lors du chargement des propriétés')
    }
  }, [])

  // Charger les baux d'une propriété
  const loadLeases = useCallback(async (propertyId: string) => {
    if (!propertyId) return

    try {
      const { data: leasesData, error } = await supabase
        .from('leases')
        .select(`
          id,
          property_id,
          tenant_id,
          start_date,
          end_date,
          monthly_rent,
          charges,
          status,
          date_reference_irl,
          trimestre_reference_irl,
          loyer_reference,
          property:properties(
            id,
            title,
            address,
            city
          ),
          tenant:users!leases_tenant_id_fkey(
            first_name,
            last_name,
            email
          ),
          owner:users!leases_owner_id_fkey(
            first_name,
            last_name,
            email
          )
        `)
        .eq('property_id', propertyId)
        .eq('status', 'active')
        .order('start_date', { ascending: false })

      if (error) throw error
      setLeases(leasesData || [])
    } catch (error) {
      console.error('Erreur chargement baux:', error)
      toast.error('Erreur lors du chargement des baux')
    }
  }, [])

  // Charger les indices IRL
  const loadIRLIndices = useCallback(async (year: number) => {
    try {
      const { data: irlData, error } = await supabase
        .from('irl_indices')
        .select('*')
        .eq('year', year)
        .order('quarter')

      if (error) throw error
      setIRLIndices(irlData || [])
    } catch (error) {
      console.error('Erreur chargement IRL:', error)
      toast.error('Erreur lors du chargement des indices IRL')
    }
  }, [])

  // Récupérer l'indice IRL de référence depuis le bail
  const getReferenceIRLValue = useCallback(async (trimestreReference: string) => {
    if (!trimestreReference) return 0

    try {
      // Parser le trimestre (ex: "2025-T1" -> year: 2025, quarter: 1)
      const match = trimestreReference.match(/(\d{4})-T(\d)/)
      if (!match) return 0

      const year = parseInt(match[1])
      const quarter = parseInt(match[2])

      const { data: irlData, error } = await supabase
        .from('irl_indices')
        .select('value')
        .eq('year', year)
        .eq('quarter', quarter)
        .single()

      if (error || !irlData) return 0
      return irlData.value
    } catch (error) {
      console.error('Erreur récupération IRL référence:', error)
      return 0
    }
  }, [])

  // Charger la révision existante
  const loadExistingRevision = useCallback(async (leaseId: string, year: number) => {
    try {
      // Utiliser une requête différente pour éviter l'erreur 406
      const { data: revisionData, error } = await supabase
        .from('lease_revisions')
        .select('*')
        .eq('lease_id', leaseId)
        .eq('revision_year', year)
        .maybeSingle()

      if (error) {
        console.error('Erreur chargement révision:', error)
        throw error
      }

      if (revisionData) {
        setRevision(revisionData)
      } else {
        // Récupérer l'indice IRL de référence
        const referenceIRLValue = selectedLease?.trimestre_reference_irl 
          ? await getReferenceIRLValue(selectedLease.trimestre_reference_irl)
          : 0

        // Créer une nouvelle révision
        const newRevision: RentRevision = {
          lease_id: leaseId,
          property_id: selectedLease?.property_id || '',
          revision_year: year,
          revision_date: new Date().toISOString().split('T')[0],
          reference_irl_value: referenceIRLValue,
          new_irl_value: 0,
          irl_quarter: selectedLease?.trimestre_reference_irl || '',
          old_rent_amount: selectedLease?.monthly_rent || 0,
          new_rent_amount: 0,
          rent_increase_amount: 0,
          rent_increase_percentage: 0,
          status: 'draft'
        }
        setRevision(newRevision)
      }
    } catch (error) {
      console.error('Erreur chargement révision:', error)
      toast.error('Erreur lors du chargement de la révision')
    }
  }, [selectedLease, getReferenceIRLValue])

  // Calculer la révision
  const calculateRevision = useCallback((oldRent: number, referenceIRL: number, newIRL: number) => {
    if (referenceIRL === 0 || newIRL === 0) return {
      newRent: oldRent,
      increaseAmount: 0,
      increasePercentage: 0
    }
    
    const newRent = (oldRent * newIRL) / referenceIRL
    const roundedNewRent = Math.round(newRent * 100) / 100
    const increaseAmount = roundedNewRent - oldRent
    const increasePercentage = (increaseAmount / oldRent) * 100
    
    return {
      newRent: roundedNewRent,
      increaseAmount: Math.round(increaseAmount * 100) / 100,
      increasePercentage: Math.round(increasePercentage * 100) / 100
    }
  }, [])

  // Sauvegarder la révision
  const saveRevision = useCallback(async () => {
    if (!revision || !selectedLease) return

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const revisionData = {
        ...revision,
        created_by: user.id,
        updated_at: new Date().toISOString()
      }

      if (revision.id) {
        // Mettre à jour
        const { error } = await supabase
          .from('lease_revisions')
          .update(revisionData)
          .eq('id', revision.id)

        if (error) throw error
      } else {
        // Créer
        const { data, error } = await supabase
          .from('lease_revisions')
          .insert(revisionData)
          .select()
          .single()

        if (error) throw error
        setRevision({ ...revision, id: data.id })
      }

      toast.success('Révision sauvegardée')
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }, [revision, selectedLease])

  // Générer le PDF
  const generatePDF = useCallback(async () => {
    if (!revision || !selectedLease || !revision.id) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const response = await fetch('/api/revisions/rent/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          revisionId: revision.id,
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
      a.download = `revision-loyer-${selectedYear}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('PDF généré et téléchargé')
    } catch (error) {
      console.error('Erreur génération PDF:', error)
      toast.error('Erreur lors de la génération du PDF')
    }
  }, [revision, selectedLease, selectedYear])

  // Envoyer au locataire
  const sendToTenant = useCallback(async () => {
    if (!revision || !selectedLease) return

    try {
      // TODO: Implémenter l'envoi au locataire
      setRevision(prev => prev ? { ...prev, status: 'sent' } : null)
      toast.success('Révision envoyée au locataire (fonctionnalité à implémenter)')
    } catch (error) {
      console.error('Erreur envoi:', error)
      toast.error('Erreur lors de l\'envoi')
    }
  }, [revision, selectedLease])

  // Effets
  useEffect(() => {
    loadProperties()
  }, [loadProperties])

  useEffect(() => {
    if (selectedPropertyId) {
      loadLeases(selectedPropertyId)
    }
  }, [selectedPropertyId, loadLeases])

  useEffect(() => {
    if (selectedLeaseId) {
      const lease = leases.find(l => l.id === selectedLeaseId)
      setSelectedLease(lease || null)
    }
  }, [selectedLeaseId, leases])

  useEffect(() => {
    loadIRLIndices(selectedYear)
  }, [selectedYear, loadIRLIndices])

  useEffect(() => {
    if (selectedLeaseId && selectedYear) {
      loadExistingRevision(selectedLeaseId, selectedYear)
    }
  }, [selectedLeaseId, selectedYear, loadExistingRevision])

  // Mise à jour du calcul automatique
  useEffect(() => {
    if (revision && revision.reference_irl_value > 0 && revision.new_irl_value > 0) {
      const calculation = calculateRevision(revision.old_rent_amount, revision.reference_irl_value, revision.new_irl_value)
      setRevision(prev => prev ? { 
        ...prev, 
        new_rent_amount: calculation.newRent,
        rent_increase_amount: calculation.increaseAmount,
        rent_increase_percentage: calculation.increasePercentage
      } : null)
    }
  }, [revision?.reference_irl_value, revision?.new_irl_value, revision?.old_rent_amount, calculateRevision])

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
          <h1 className="text-2xl font-bold text-gray-900">Révision de loyer</h1>
          <p className="text-gray-600">Calculer la révision selon l'indice INSEE IRL</p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Calendar className="h-4 w-4 mr-2" />
          {selectedYear}
        </Badge>
      </div>

      {/* Sélection du bail */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Sélection du bail
          </CardTitle>
          <CardDescription>
            Choisissez d'abord un logement, puis sélectionnez le bail correspondant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="property-select">Logement</Label>
            <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner un logement" />
              </SelectTrigger>
              <SelectContent>
                {properties.map(property => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.title} - {property.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedPropertyId && (
            <div>
              <Label htmlFor="lease-select">Bail</Label>
              <Select value={selectedLeaseId} onValueChange={setSelectedLeaseId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner un bail" />
                </SelectTrigger>
                <SelectContent>
                  {leases.map(lease => (
                    <SelectItem key={lease.id} value={lease.id}>
                      {lease.tenant.first_name} {lease.tenant.last_name} - {lease.monthly_rent}€/mois
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedLease && revision && (
        <>
          {/* Encart de récapitulatif */}
          {revision.new_rent_amount > 0 && (
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <TrendingUp className="h-5 w-5" />
                  Récapitulatif de la révision
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Ancien loyer */}
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Ancien loyer</div>
                    <div className="text-2xl font-bold text-gray-800">{revision.old_rent_amount}€</div>
                    <div className="text-xs text-gray-500">par mois</div>
                  </div>
                  
                  {/* Nouveau loyer */}
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Nouveau loyer</div>
                    <div className="text-2xl font-bold text-green-600">{revision.new_rent_amount}€</div>
                    <div className="text-xs text-gray-500">par mois</div>
                  </div>
                  
                  {/* Augmentation */}
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Augmentation</div>
                    <div className="text-2xl font-bold text-blue-600">
                      +{revision.rent_increase_amount}€
                    </div>
                    <div className="text-xs text-gray-500">
                      (+{revision.rent_increase_percentage}%)
                    </div>
                  </div>
                </div>
                
                {/* Détails du calcul */}
                <div className="mt-4 p-3 bg-white rounded-lg border">
                  <div className="text-sm text-gray-600 mb-2">Calcul :</div>
                  <div className="text-sm font-mono">
                    {revision.old_rent_amount}€ × ({revision.new_irl_value} ÷ {revision.reference_irl_value}) = {revision.new_rent_amount}€
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calcul de révision */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Calcul de révision
                </CardTitle>
                <CardDescription>
                  Révision pour {selectedLease.tenant.first_name} {selectedLease.tenant.last_name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Loyer actuel */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Loyer actuel</h3>
                  <div className="text-2xl font-bold text-blue-600">{revision.old_rent_amount}€</div>
                  <div className="text-sm text-gray-600">+ {selectedLease.charges}€ de charges</div>
                </div>

                {/* Indice de référence */}
                <div>
                  <Label htmlFor="reference-irl">Indice IRL de référence</Label>
                  <Input
                    id="reference-irl"
                    type="number"
                    step="0.01"
                    value={revision.reference_irl_value}
                    onChange={(e) => setRevision(prev => prev ? { 
                      ...prev, 
                      reference_irl_value: parseFloat(e.target.value) || 0 
                    } : null)}
                    placeholder="Ex: 130.52"
                  />
                <p className="text-xs text-gray-500 mt-1">
                  Indice au moment de la signature du bail
                  {selectedLease?.trimestre_reference_irl && (
                    <span className="block text-blue-600">
                      Trimestre de référence: {selectedLease.trimestre_reference_irl}
                      {revision.reference_irl_value > 0 && (
                        <span className="block text-green-600">
                          ✓ Valeur récupérée: {revision.reference_irl_value}
                        </span>
                      )}
                    </span>
                  )}
                </p>
                </div>

                {/* Nouvel indice */}
                <div>
                  <Label htmlFor="new-irl">Nouvel indice IRL</Label>
                  <Select
                    value={revision.new_irl_value.toString()}
                    onValueChange={(value) => setRevision(prev => prev ? { 
                      ...prev, 
                      new_irl_value: parseFloat(value) || 0 
                    } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un indice" />
                    </SelectTrigger>
                    <SelectContent>
                      {irlIndices.map(index => (
                        <SelectItem key={index.id} value={index.value.toString()}>
                          {index.quarter} {index.year} - {index.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Dernier indice publié par l'INSEE
                  </p>
                </div>

                {/* Date de révision */}
                <div>
                  <Label htmlFor="revision-date">Date de révision</Label>
                  <Input
                    id="revision-date"
                    type="date"
                    value={revision.revision_date}
                    onChange={(e) => setRevision(prev => prev ? { 
                      ...prev, 
                      revision_date: e.target.value 
                    } : null)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions et statut */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Statut */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Statut</span>
                  <Badge variant={
                    revision.status === 'signed' ? 'default' : 
                    revision.status === 'sent' ? 'secondary' : 
                    'outline'
                  }>
                    {revision.status === 'signed' ? 'Signé' : 
                     revision.status === 'sent' ? 'Envoyé' : 
                     revision.status === 'calculated' ? 'Calculé' :
                     'Brouillon'}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Button 
                    onClick={saveRevision} 
                    className="w-full"
                    disabled={saving}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                  </Button>

                  <Button 
                    onClick={generatePDF} 
                    variant="outline" 
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Générer PDF
                  </Button>

                  <Button 
                    onClick={sendToTenant} 
                    variant="outline" 
                    className="w-full"
                    disabled={revision.status === 'sent' || revision.status === 'signed'}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer au locataire
                  </Button>
                </div>

                {/* Informations légales */}
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    La révision de loyer doit respecter les plafonds légaux et être notifiée au locataire 
                    dans les délais prévus par la loi.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}