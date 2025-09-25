"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Calculator,
  RefreshCw,
  CheckCircle,
  FileText,
  Send,
  Download,
  Building,
  User,
  Euro,
  TrendingUp,
  TrendingDown,
  Calendar,
  Settings,
  History,
  Bell
} from "lucide-react"

import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { IRLSelector } from "@/components/IRLSelector"
import { ChargeSettingsManager } from "@/components/ChargeSettingsManager"
import { ChargeRegularizationTable } from "@/components/ChargeRegularizationTable"
import { ChargeRegularizationSummary } from "@/components/ChargeRegularizationSummary"

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
  montant_loyer_mensuel: number
  montant_provisions_charges: number
  date_revision_loyer: string
  trimestre_reference_irl: string
  property: Property
  tenant: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
}

interface IRLData {
  quarter: string
  value: number
  year: number
  quarter_number: number
}

export default function RevisionPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  
  // États de sélection
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("")
  const [selectedLeaseId, setSelectedLeaseId] = useState<string>("")
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  
  // Données
  const [properties, setProperties] = useState<Property[]>([])
  const [leases, setLeases] = useState<Lease[]>([])
  const [irlData, setIrlData] = useState<IRLData[]>([])
  const [revisions, setRevisions] = useState<any[]>([])
  const [regularizations, setRegularizations] = useState<any[]>([])
  
  // Données de révision de loyer
  const [rentRevisionData, setRentRevisionData] = useState({
    referenceIrlValue: 0,
    newIrlValue: 0,
    irlQuarter: '',
    oldRentAmount: 0,
    newRentAmount: 0,
    rentIncreaseAmount: 0,
    rentIncreasePercentage: 0,
    calculationMethod: 'Révision selon indice IRL INSEE',
    legalComplianceChecked: false,
    complianceNotes: ''
  })
  
  // Données de régularisation des charges
  const [chargeRegularizationData, setChargeRegularizationData] = useState({
    totalProvisionsCollected: 0,
    provisionsPeriodStart: `${currentYear}-01-01`,
    provisionsPeriodEnd: `${currentYear}-12-31`,
    totalRealCharges: 0,
    recoverableCharges: 0,
    nonRecoverableCharges: 0,
    tenantBalance: 0,
    balanceType: 'refund' as 'refund' | 'additional_payment',
    calculationMethod: '',
    calculationNotes: '',
    chargeBreakdown: [] as Array<{
      charge_category: string
      charge_name: string
      provision_amount: number
      real_amount: number
      difference: number
      is_recoverable: boolean
      is_exceptional: boolean
      notes?: string
    }>
  })

  // États pour les nouveaux composants
  const [chargeCategories, setChargeCategories] = useState<Array<{
    name: string
    category: string
    recoverable: boolean
    included_in_provisions: boolean
    default_amount: number
  }>>([])
  
  // Notes de calcul pour les charges
  const [calculationNotes, setCalculationNotes] = useState("Répartition au prorata de la surface + relevés fournisseurs.")

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedPropertyId) {
      loadLeasesForProperty()
    }
  }, [selectedPropertyId])

  useEffect(() => {
    if (selectedLeaseId) {
      loadLeaseData()
      loadExistingRevisions()
    }
  }, [selectedLeaseId])

  useEffect(() => {
    loadIRLData(currentYear)
  }, [currentYear])

  // Recalculer automatiquement les totaux quand les données changent
  useEffect(() => {
    if (chargeRegularizationData.chargeBreakdown.length > 0) {
      const totalRealCharges = chargeRegularizationData.chargeBreakdown.reduce((sum, charge) => sum + (charge.real_amount || 0), 0)
      const recoverableCharges = chargeRegularizationData.chargeBreakdown
        .filter(charge => charge.is_recoverable)
        .reduce((sum, charge) => sum + (charge.real_amount || 0), 0)
      const nonRecoverableCharges = totalRealCharges - recoverableCharges
      const tenantBalance = chargeRegularizationData.totalProvisionsCollected - recoverableCharges

      setChargeRegularizationData(prev => ({
        ...prev,
        totalRealCharges,
        recoverableCharges,
        nonRecoverableCharges,
        tenantBalance,
        balanceType: tenantBalance >= 0 ? 'refund' : 'additional_payment'
      }))
    }
  }, [chargeRegularizationData.chargeBreakdown, chargeRegularizationData.totalProvisionsCollected])

  const loadInitialData = async () => {
    try {
      setIsLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Utilisateur non connecté")
        return
      }

      // Charger les propriétés
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('id, title, address, city')
        .eq('owner_id', user.id)
        .order('title')

      if (propertiesError) {
        console.error("Erreur chargement propriétés:", propertiesError)
        toast.error("Erreur lors du chargement des propriétés")
        return
      }

      setProperties(propertiesData || [])

      // Charger les données IRL pour l'année courante
      await loadIRLData(currentYear)

    } catch (error) {
      console.error("Erreur chargement initial:", error)
      toast.error("Erreur lors du chargement")
    } finally {
      setIsLoading(false)
    }
  }

  const loadLeasesForProperty = async () => {
    if (!selectedPropertyId) return

    try {
      const { data: leasesData, error: leasesError } = await supabase
        .from('leases')
        .select(`
          id,
          property_id,
          tenant_id,
          montant_loyer_mensuel,
          montant_provisions_charges,
          date_revision_loyer,
          trimestre_reference_irl,
          property:properties(
            id,
            title,
            address,
            city
          ),
          tenant:users!leases_tenant_id_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('property_id', selectedPropertyId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (leasesError) {
        console.error("Erreur chargement baux:", leasesError)
        toast.error("Erreur lors du chargement des baux")
        return
      }

      setLeases(leasesData || [])
    } catch (error) {
      console.error("Erreur chargement baux:", error)
      toast.error("Erreur lors du chargement des baux")
    }
  }

  const loadLeaseData = async () => {
    if (!selectedLeaseId) return

    const lease = leases.find(l => l.id === selectedLeaseId)
    if (!lease) return

    setSelectedLease(lease)
    
    // Récupérer l'IRL de référence depuis l'API si disponible
    let referenceIrlValue = 0
    let referenceQuarter = ''
    
    if (lease.trimestre_reference_irl) {
      try {
        // Extraire l'année et le trimestre du format "2024-T3"
        const match = lease.trimestre_reference_irl.match(/(\d{4})-T(\d)/)
        if (match) {
          const year = parseInt(match[1])
          const quarter = parseInt(match[2])
          const quarterStr = `${year}-Q${quarter}`
          
          // Récupérer l'IRL de référence depuis la base de données
          const { data: irlData, error: irlError } = await supabase
            .from('irl_indices')
            .select('value')
            .eq('year', year)
            .eq('quarter', quarter)
            .eq('is_active', true)
            .single()
          
          if (!irlError && irlData) {
            referenceIrlValue = irlData.value
            referenceQuarter = quarterStr
          } else {
            console.error("Erreur récupération IRL de référence:", irlError)
            toast.error("Erreur lors de la récupération de l'IRL de référence")
          }
        }
      } catch (error) {
        console.error("Erreur récupération IRL de référence:", error)
        toast.error("Erreur lors de la récupération de l'IRL de référence")
      }
    }
    
    // Initialiser les données de révision
    setRentRevisionData({
      referenceIrlValue,
      newIrlValue: 0,
      irlQuarter: referenceQuarter,
      oldRentAmount: lease.montant_loyer_mensuel,
      newRentAmount: 0,
      rentIncreaseAmount: 0,
      rentIncreasePercentage: 0,
      calculationMethod: 'Révision selon indice IRL INSEE',
      legalComplianceChecked: false,
      complianceNotes: ''
    })
  }

  const loadExistingRevisions = async () => {
    if (!selectedLeaseId) return

    try {
      // Charger les révisions existantes
      const { data: revisionsData, error: revisionsError } = await supabase
        .from('lease_revisions')
        .select('*')
        .eq('lease_id', selectedLeaseId)
        .eq('revision_year', currentYear)

      if (revisionsError) {
        console.error("Erreur chargement révisions:", revisionsError)
        return
      }

      setRevisions(revisionsData || [])

      // Charger les régularisations existantes
      const { data: regularizationsData, error: regularizationsError } = await supabase
        .from('charge_regularizations')
        .select('*')
        .eq('lease_id', selectedLeaseId)
        .eq('regularization_year', currentYear)

      if (regularizationsError) {
        console.error("Erreur chargement régularisations:", regularizationsError)
        return
      }

      setRegularizations(regularizationsData || [])

      // Restaurer les données de régularisation si elles existent
      if (regularizationsData && regularizationsData.length > 0) {
        const latestRegularization = regularizationsData[0] // Prendre la plus récente
        
        setChargeRegularizationData({
          totalProvisionsCollected: parseFloat(latestRegularization.total_provisions_collected) || 0,
          provisionsPeriodStart: latestRegularization.provisions_period_start || '',
          provisionsPeriodEnd: latestRegularization.provisions_period_end || '',
          totalRealCharges: parseFloat(latestRegularization.total_real_charges) || 0,
          recoverableCharges: parseFloat(latestRegularization.recoverable_charges) || 0,
          nonRecoverableCharges: parseFloat(latestRegularization.non_recoverable_charges) || 0,
          tenantBalance: parseFloat(latestRegularization.tenant_balance) || 0,
          balanceType: latestRegularization.balance_type || 'refund',
          chargeBreakdown: [] // TODO: Charger le détail des charges
        })
        
        setCalculationNotes(latestRegularization.calculation_notes || '')
      }
    } catch (error) {
      console.error("Erreur chargement révisions existantes:", error)
    }
  }

  const loadIRLData = async (year: number) => {
    try {
      // Charger directement depuis la base de données
      const { data: irlData, error: irlError } = await supabase
        .from('irl_indices')
        .select('*')
        .eq('year', year)
        .eq('is_active', true)
        .order('quarter', { ascending: true })

      if (irlError) {
        console.error("Erreur chargement IRL:", irlError)
        toast.error("Erreur lors du chargement des données IRL")
        return
      }

      // Convertir au format attendu
      const formattedData = (irlData || []).map(item => ({
        quarter: `${item.year}-Q${item.quarter}`,
        value: item.value,
        year: item.year,
        quarter_number: item.quarter
      }))

      setIrlData(formattedData)
    } catch (error) {
      console.error("Erreur chargement IRL:", error)
      toast.error("Erreur lors du chargement des données IRL")
    }
  }

  const calculateRentRevision = () => {
    if (!rentRevisionData.referenceIrlValue || !rentRevisionData.newIrlValue) {
      toast.error("Veuillez sélectionner les valeurs IRL")
      return
    }

    const newRent = (rentRevisionData.oldRentAmount * rentRevisionData.newIrlValue) / rentRevisionData.referenceIrlValue
    const increase = newRent - rentRevisionData.oldRentAmount
    const percentage = (increase / rentRevisionData.oldRentAmount) * 100

    setRentRevisionData(prev => ({
      ...prev,
      newRentAmount: Math.round(newRent * 100) / 100,
      rentIncreaseAmount: Math.round(increase * 100) / 100,
      rentIncreasePercentage: Math.round(percentage * 100) / 100
    }))

    toast.success("Calcul de révision effectué")
  }

  const calculateChargeRegularization = async () => {
    if (!selectedLeaseId || !selectedLease) {
      toast.error("Veuillez sélectionner un bail")
      return
    }

    try {
      setIsCalculating(true)

      // Calculer automatiquement la période d'occupation
      const leaseStartDate = new Date(selectedLease.start_date)
      const leaseEndDate = selectedLease.end_date ? new Date(selectedLease.end_date) : null
      
      // Période de régularisation pour l'année courante
      const yearStart = new Date(currentYear, 0, 1) // 1er janvier
      const yearEnd = new Date(currentYear, 11, 31) // 31 décembre
      
      // Déterminer la période effective d'occupation
      const effectiveStart = leaseStartDate > yearStart ? leaseStartDate : yearStart
      const effectiveEnd = leaseEndDate && leaseEndDate < yearEnd ? leaseEndDate : yearEnd
      
      // Calculer le nombre de mois d'occupation
      const monthsDiff = (effectiveEnd.getFullYear() - effectiveStart.getFullYear()) * 12 + 
                        (effectiveEnd.getMonth() - effectiveStart.getMonth()) + 1
      
      // Mettre à jour les dates de période
      const provisionsPeriodStart = effectiveStart.toISOString().split('T')[0]
      const provisionsPeriodEnd = effectiveEnd.toISOString().split('T')[0]
      
      setChargeRegularizationData(prev => ({
        ...prev,
        provisionsPeriodStart,
        provisionsPeriodEnd
      }))

      const response = await fetch('/api/revisions/charges/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          leaseId: selectedLeaseId,
          year: currentYear,
          provisionsPeriodStart,
          provisionsPeriodEnd
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setChargeRegularizationData(prev => ({
          ...prev,
          totalProvisionsCollected: result.calculation.totalProvisionsCollected,
          calculationMethod: `Calcul basé sur ${monthsDiff} mois d'occupation (${provisionsPeriodStart} → ${provisionsPeriodEnd})`
        }))
        toast.success(`Calcul des provisions effectué pour ${monthsDiff} mois d'occupation`)
      } else {
        toast.error("Erreur lors du calcul")
      }
    } catch (error) {
      console.error("Erreur calcul régularisation:", error)
      toast.error("Erreur lors du calcul")
    } finally {
      setIsCalculating(false)
    }
  }

  const saveRentRevision = async () => {
    if (!selectedLeaseId || !selectedLease) {
      toast.error("Veuillez sélectionner un bail")
      return
    }

    try {
      setIsGenerating(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const response = await fetch('/api/revisions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          leaseId: selectedLeaseId,
          propertyId: selectedLease.property_id,
          revisionYear: currentYear,
          revisionDate: new Date().toISOString().split('T')[0],
          ...rentRevisionData
        })
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success("Révision de loyer sauvegardée")
        await loadExistingRevisions()
      } else {
        toast.error("Erreur lors de la sauvegarde")
      }
    } catch (error) {
      console.error("Erreur sauvegarde révision:", error)
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setIsGenerating(false)
    }
  }

  const saveChargeRegularization = async () => {
    if (!selectedLeaseId || !selectedLease) {
      toast.error("Veuillez sélectionner un bail")
      return
    }

    try {
      setIsGenerating(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Préparer les données pour l'API
      const apiData = {
        leaseId: selectedLeaseId,
        propertyId: selectedLease.property_id,
        regularizationYear: currentYear,
        regularizationDate: new Date().toISOString(),
        totalProvisionsCollected: chargeRegularizationData.totalProvisionsCollected,
        provisionsPeriodStart: chargeRegularizationData.provisionsPeriodStart,
        provisionsPeriodEnd: chargeRegularizationData.provisionsPeriodEnd,
        totalRealCharges: chargeRegularizationData.totalRealCharges,
        recoverableCharges: chargeRegularizationData.recoverableCharges,
        nonRecoverableCharges: chargeRegularizationData.nonRecoverableCharges,
        tenantBalance: chargeRegularizationData.tenantBalance,
        balanceType: chargeRegularizationData.balanceType,
        calculationMethod: 'prorata_surface', // Valeur par défaut
        calculationNotes: calculationNotes,
        chargeBreakdown: chargeRegularizationData.chargeBreakdown || []
      }

      console.log('Données envoyées à l\'API:', apiData)

      const response = await fetch('/api/revisions/charges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify(apiData)
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        toast.success("Régularisation des charges sauvegardée")
        await loadExistingRevisions()
        
        // Générer le PDF après sauvegarde
        await generateChargeStatementPDF(result.regularization)
      } else {
        console.error("Erreur API:", result)
        toast.error(`Erreur lors de la sauvegarde: ${result.error || 'Erreur inconnue'}`)
      }
    } catch (error) {
      console.error("Erreur sauvegarde régularisation:", error)
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setIsGenerating(false)
    }
  }

  const generateChargeStatementPDF = async (regularizationData: any) => {
    try {
      // Importer le générateur PDF
      const { RevisionPDFGenerator } = await import('@/lib/revision-pdf-generator')
      
      // Préparer les données pour le PDF
      const pdfData = {
        lease: {
          id: selectedLease!.id,
          property: {
            title: selectedLease!.property.title,
            address: selectedLease!.property.address,
            city: selectedLease!.property.city
          },
          tenant: {
            first_name: selectedLease!.tenant.first_name,
            last_name: selectedLease!.tenant.last_name,
            email: selectedLease!.tenant.email
          },
          owner: {
            first_name: selectedLease!.owner.first_name,
            last_name: selectedLease!.owner.last_name,
            email: selectedLease!.owner.email
          }
        },
        regularization: {
          regularization_year: currentYear,
          regularization_date: new Date().toISOString(),
          total_provisions_collected: chargeRegularizationData.totalProvisionsCollected,
          provisions_period_start: chargeRegularizationData.provisionsPeriodStart,
          provisions_period_end: chargeRegularizationData.provisionsPeriodEnd,
          total_real_charges: chargeRegularizationData.totalRealCharges,
          recoverable_charges: chargeRegularizationData.recoverableCharges,
          non_recoverable_charges: chargeRegularizationData.nonRecoverableCharges,
          tenant_balance: chargeRegularizationData.tenantBalance,
          balance_type: chargeRegularizationData.balanceType,
          calculation_method: 'prorata_surface',
          calculation_notes: calculationNotes
        },
        chargeBreakdown: chargeRegularizationData.chargeBreakdown || []
      }

      // Générer le PDF
      const generator = new RevisionPDFGenerator()
      const pdf = generator.generateChargeStatement(pdfData)
      
      // Télécharger le PDF
      const fileName = `decompte-charges-${selectedLease!.property.title.replace(/\s+/g, '-')}-${currentYear}.pdf`
      pdf.save(fileName)
      
      toast.success("PDF généré et téléchargé")
    } catch (error) {
      console.error("Erreur génération PDF:", error)
      toast.error("Erreur lors de la génération du PDF")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Révision annuelle</h1>
          <p className="text-muted-foreground">Gestion des révisions de loyer et régularisation des charges</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Chargement des données...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 text-gray-800 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* En-tête */}
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Régularisation des charges – {selectedLease?.property?.title || 'Sélectionnez un bail'}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Période : {chargeRegularizationData.provisionsPeriodStart ? 
              new Date(chargeRegularizationData.provisionsPeriodStart).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : 
              'Janvier'
            } → {chargeRegularizationData.provisionsPeriodEnd ? 
              new Date(chargeRegularizationData.provisionsPeriodEnd).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : 
              'Décembre'
            } {currentYear}
          </p>
        </header>

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
                      {lease.tenant.first_name} {lease.tenant.last_name} - {lease.montant_loyer_mensuel}€/mois
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="year-select">Année de révision</Label>
            <Select value={currentYear.toString()} onValueChange={(value) => setCurrentYear(parseInt(value))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={(currentYear - 1).toString()}>{currentYear - 1}</SelectItem>
                <SelectItem value={currentYear.toString()}>{currentYear}</SelectItem>
                <SelectItem value={(currentYear + 1).toString()}>{currentYear + 1}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contenu principal */}
      {selectedLeaseId && selectedLease && (
        <Tabs defaultValue="rent" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rent">Révision du loyer</TabsTrigger>
            <TabsTrigger value="charges">Régularisation des charges</TabsTrigger>
            <TabsTrigger value="validation">Validation & Envoi</TabsTrigger>
          </TabsList>

          {/* Étape 1: Révision du loyer */}
          <TabsContent value="rent" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Données IRL</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="reference-irl">IRL de référence</Label>
                    <Input
                      id="reference-irl"
                      type="number"
                      step="0.01"
                      value={rentRevisionData.referenceIrlValue}
                      onChange={(e) => setRentRevisionData(prev => ({
                        ...prev,
                        referenceIrlValue: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-irl">Nouvel IRL</Label>
                    <Select onValueChange={(value) => {
                      const irlValue = irlData.find(irl => irl.quarter === value)
                      if (irlValue) {
                        setRentRevisionData(prev => ({
                          ...prev,
                          newIrlValue: irlValue.value,
                          irlQuarter: value
                        }))
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le trimestre" />
                      </SelectTrigger>
                      <SelectContent>
                        {irlData.map(irl => (
                          <SelectItem key={irl.quarter} value={irl.quarter}>
                            {irl.quarter} - {irl.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={calculateRentRevision} className="w-full">
                    <Calculator className="h-4 w-4 mr-2" />
                    Calculer la révision
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Résultat du calcul</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Ancien loyer:</span>
                      <span className="font-semibold">{rentRevisionData.oldRentAmount.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Nouveau loyer:</span>
                      <span className="font-semibold text-green-600">{rentRevisionData.newRentAmount.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Augmentation:</span>
                      <span className={`font-semibold ${rentRevisionData.rentIncreaseAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {rentRevisionData.rentIncreaseAmount >= 0 ? '+' : ''}{rentRevisionData.rentIncreaseAmount.toFixed(2)} €
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pourcentage:</span>
                      <span className={`font-semibold ${rentRevisionData.rentIncreasePercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {rentRevisionData.rentIncreasePercentage >= 0 ? '+' : ''}{rentRevisionData.rentIncreasePercentage.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="compliance-notes">Notes de conformité</Label>
                    <Textarea
                      id="compliance-notes"
                      placeholder="Vérifications légales effectuées..."
                      value={rentRevisionData.complianceNotes}
                      onChange={(e) => setRentRevisionData(prev => ({
                        ...prev,
                        complianceNotes: e.target.value
                      }))}
                      rows={3}
                    />
                  </div>
                  
                  <Button onClick={saveRentRevision} disabled={isGenerating} className="w-full">
                    {isGenerating ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Sauvegarder la révision
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Étape 2: Régularisation des charges */}
          <TabsContent value="charges" className="space-y-6">
            {/* Paramétrage des charges */}
            <ChargeSettingsManager
              leaseId={selectedLeaseId}
              onSettingsChange={setChargeCategories}
              calculationNotes={calculationNotes}
              onCalculationNotesChange={setCalculationNotes}
            />

            {/* Période de régularisation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Période de régularisation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="period-start">Début de période</Label>
                    <Input
                      id="period-start"
                      type="date"
                      value={chargeRegularizationData.provisionsPeriodStart}
                      onChange={(e) => setChargeRegularizationData(prev => ({
                        ...prev,
                        provisionsPeriodStart: e.target.value
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="period-end">Fin de période</Label>
                    <Input
                      id="period-end"
                      type="date"
                      value={chargeRegularizationData.provisionsPeriodEnd}
                      onChange={(e) => setChargeRegularizationData(prev => ({
                        ...prev,
                        provisionsPeriodEnd: e.target.value
                      }))}
                    />
                  </div>
                </div>
                <Button 
                  onClick={calculateChargeRegularization} 
                  disabled={isCalculating}
                  className="w-full"
                >
                  {isCalculating ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Calculator className="h-4 w-4 mr-2" />
                  )}
                  Calculer les provisions
                </Button>
              </CardContent>
            </Card>

            {/* Tableau de saisie des charges */}
            {chargeCategories.length > 0 && (
              <ChargeRegularizationTable
                chargeCategories={chargeCategories}
                totalProvisionsCollected={chargeRegularizationData.totalProvisionsCollected}
                occupationMonths={(() => {
                  if (!chargeRegularizationData.provisionsPeriodStart || !chargeRegularizationData.provisionsPeriodEnd) return 0
                  const start = new Date(chargeRegularizationData.provisionsPeriodStart)
                  const end = new Date(chargeRegularizationData.provisionsPeriodEnd)
                  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1
                })()}
                onDataChange={(data) => setChargeRegularizationData(prev => ({
                  ...prev,
                  chargeBreakdown: data
                }))}
                onCalculationChange={(calculation) => setChargeRegularizationData(prev => ({
                  ...prev,
                  ...calculation
                }))}
              />
            )}

            {/* Résumé et actions */}
            <ChargeRegularizationSummary
              totalProvisionsCollected={chargeRegularizationData.totalProvisionsCollected}
              totalRealCharges={chargeRegularizationData.totalRealCharges}
              recoverableCharges={chargeRegularizationData.recoverableCharges}
              nonRecoverableCharges={chargeRegularizationData.nonRecoverableCharges}
              tenantBalance={chargeRegularizationData.tenantBalance}
              balanceType={chargeRegularizationData.balanceType}
              calculationNotes={calculationNotes}
              onNotesChange={setCalculationNotes}
              onGenerateStatement={saveChargeRegularization}
              onSendToTenant={() => {
                // TODO: Implémenter l'envoi au locataire
                toast.info("Fonctionnalité d'envoi au locataire à implémenter")
              }}
              isGenerating={isGenerating}
            />
          </TabsContent>

          {/* Étape 3: Validation & Envoi */}
          <TabsContent value="validation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Validation et envoi</CardTitle>
                <CardDescription>
                  Vérifiez les informations avant d'envoyer au locataire
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Fonctionnalité de validation et envoi à implémenter</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

        {/* Message si aucun bail sélectionné */}
        {!selectedLeaseId && (
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="text-center text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Sélectionnez un bail pour commencer la révision</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
