"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Calculator,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Euro,
  Calendar,
  Download,
  Send,
  RefreshCw,
  Plus,
  Minus,
  CheckCircle,
  XCircle,
  Clock,
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  Receipt,
  FileCheck,
  History,
  Bell,
  Settings
} from "lucide-react"

import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

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

interface RevisionData {
  id: string
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
  status: string
  amendment_pdf_url?: string
  created_at: string
}

interface ChargeRegularizationData {
  id: string
  lease_id: string
  property_id: string
  regularization_year: number
  regularization_date: string
  total_provisions_collected: number
  provisions_period_start: string
  provisions_period_end: string
  total_real_charges: number
  recoverable_charges: number
  non_recoverable_charges: number
  tenant_balance: number
  balance_type: 'refund' | 'additional_payment'
  status: string
  statement_pdf_url?: string
  created_at: string
}

export default function RevisionPage() {
  const [currentStep, setCurrentStep] = useState<'rent' | 'charges' | 'validation'>('rent')
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("")
  const [selectedLeaseId, setSelectedLeaseId] = useState<string>("")
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  
  // Données
  const [properties, setProperties] = useState<Property[]>([])
  const [leases, setLeases] = useState<Lease[]>([])
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null)
  const [irlData, setIrlData] = useState<IRLData[]>([])
  const [revisions, setRevisions] = useState<RevisionData[]>([])
  const [regularizations, setRegularizations] = useState<ChargeRegularizationData[]>([])
  
  // État de chargement
  const [isLoading, setIsLoading] = useState(true)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Données de révision de loyer
  const [rentRevisionData, setRentRevisionData] = useState({
    referenceIrlValue: 0,
    newIrlValue: 0,
    irlQuarter: '',
    oldRentAmount: 0,
    newRentAmount: 0,
    rentIncreaseAmount: 0,
    rentIncreasePercentage: 0,
    calculationMethod: '',
    legalComplianceChecked: false,
    complianceNotes: ''
  })
  
  // Données de régularisation des charges
  const [chargeRegularizationData, setChargeRegularizationData] = useState({
    totalProvisionsCollected: 0,
    provisionsPeriodStart: '',
    provisionsPeriodEnd: '',
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
  }, [selectedLeaseId, currentYear])

  const loadInitialData = async () => {
    try {
      setIsLoading(true)
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        toast.error("Session expirée, veuillez vous reconnecter")
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
    
    // Initialiser les données de révision
    setRentRevisionData({
      referenceIrlValue: parseFloat(lease.trimestre_reference_irl) || 0,
      newIrlValue: 0,
      irlQuarter: '',
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
    } catch (error) {
      console.error("Erreur chargement révisions existantes:", error)
    }
  }

  const loadIRLData = async (year: number) => {
    try {
      const response = await fetch(`/api/revisions/irl?year=${year}`)
      const result = await response.json()
      
      if (result.success) {
        setIrlData(result.data)
      } else {
        toast.error("Erreur lors du chargement des données IRL")
      }
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
    const increaseAmount = newRent - rentRevisionData.oldRentAmount
    const increasePercentage = (increaseAmount / rentRevisionData.oldRentAmount) * 100

    setRentRevisionData(prev => ({
      ...prev,
      newRentAmount: Math.round(newRent * 100) / 100,
      rentIncreaseAmount: Math.round(increaseAmount * 100) / 100,
      rentIncreasePercentage: Math.round(increasePercentage * 100) / 100
    }))

    toast.success("Calcul de révision effectué")
  }

  const calculateChargeRegularization = async () => {
    if (!selectedLeaseId) {
      toast.error("Veuillez sélectionner un bail")
      return
    }

    try {
      setIsCalculating(true)

      const response = await fetch('/api/revisions/charges/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          leaseId: selectedLeaseId,
          year: currentYear,
          provisionsPeriodStart: chargeRegularizationData.provisionsPeriodStart,
          provisionsPeriodEnd: chargeRegularizationData.provisionsPeriodEnd
        })
      })

      const result = await response.json()
      
      if (result.success) {
        const calculation = result.calculation
        setChargeRegularizationData(prev => ({
          ...prev,
          totalProvisionsCollected: calculation.totalProvisionsCollected,
          chargeBreakdown: calculation.chargeCategories.map((cat: any) => ({
            charge_category: cat.category,
            charge_name: cat.name,
            provision_amount: calculation.averageMonthlyProvision,
            real_amount: 0,
            difference: 0,
            is_recoverable: cat.recoverable,
            is_exceptional: false
          }))
        }))
        toast.success("Calcul des charges effectué")
      } else {
        toast.error("Erreur lors du calcul des charges")
      }
    } catch (error) {
      console.error("Erreur calcul charges:", error)
      toast.error("Erreur lors du calcul des charges")
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
        setCurrentStep('charges')
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

      const response = await fetch('/api/revisions/charges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          leaseId: selectedLeaseId,
          propertyId: selectedLease.property_id,
          regularizationYear: currentYear,
          regularizationDate: new Date().toISOString().split('T')[0],
          ...chargeRegularizationData
        })
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success("Régularisation des charges sauvegardée")
        await loadExistingRevisions()
        setCurrentStep('validation')
      } else {
        toast.error("Erreur lors de la sauvegarde")
      }
    } catch (error) {
      console.error("Erreur sauvegarde régularisation:", error)
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setIsGenerating(false)
    }
  }

  const generatePDF = async (type: 'amendment' | 'statement') => {
    try {
      setIsGenerating(true)
      
      // Ici, vous implémenteriez la génération PDF
      // Pour l'instant, on simule
      toast.success(`PDF ${type === 'amendment' ? 'd\'avenant' : 'de décompte'} généré`)
    } catch (error) {
      console.error("Erreur génération PDF:", error)
      toast.error("Erreur lors de la génération PDF")
    } finally {
      setIsGenerating(false)
    }
  }

  const sendToTenant = async (type: 'amendment' | 'statement') => {
    try {
      setIsGenerating(true)
      
      // Ici, vous implémenteriez l'envoi par email
      // Pour l'instant, on simule
      toast.success(`Document ${type === 'amendment' ? 'd\'avenant' : 'de décompte'} envoyé au locataire`)
    } catch (error) {
      console.error("Erreur envoi document:", error)
      toast.error("Erreur lors de l'envoi")
    } finally {
      setIsGenerating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Révision annuelle</h1>
          <p className="text-muted-foreground">Gestion des révisions de loyer et régularisations de charges</p>
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
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Révision annuelle</h1>
          <p className="text-muted-foreground">Gestion des révisions de loyer et régularisations de charges</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
            <SelectTrigger className="w-64">
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
          <Select value={currentYear.toString()} onValueChange={(value) => setCurrentYear(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Année" />
            </SelectTrigger>
            <SelectContent>
              {[currentYear - 1, currentYear, currentYear + 1].map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sélection du bail */}
      {selectedPropertyId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Sélection du bail
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      {/* Assistant de révision */}
      {selectedLeaseId && selectedLease && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Assistant de révision {currentYear}
            </CardTitle>
            <CardDescription>
              {selectedLease.property.title} - {selectedLease.tenant.first_name} {selectedLease.tenant.last_name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={currentStep} onValueChange={(value) => setCurrentStep(value as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="rent" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Révision loyer
                </TabsTrigger>
                <TabsTrigger value="charges" className="flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Régularisation charges
                </TabsTrigger>
                <TabsTrigger value="validation" className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4" />
                  Validation & envoi
                </TabsTrigger>
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
                          <span className="font-semibold text-blue-600">
                            {rentRevisionData.rentIncreaseAmount.toFixed(2)} € ({rentRevisionData.rentIncreasePercentage.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                      
                      <div className="pt-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="compliance"
                            checked={rentRevisionData.legalComplianceChecked}
                            onCheckedChange={(checked) => setRentRevisionData(prev => ({
                              ...prev,
                              legalComplianceChecked: checked as boolean
                            }))}
                          />
                          <Label htmlFor="compliance">Conformité légale vérifiée</Label>
                        </div>
                      </div>

                      <Button 
                        onClick={saveRentRevision} 
                        disabled={!rentRevisionData.legalComplianceChecked || isGenerating}
                        className="w-full"
                      >
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Période de régularisation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                        Calculer les charges
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Résumé des charges</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Provisions encaissées:</span>
                          <span className="font-semibold">{chargeRegularizationData.totalProvisionsCollected.toFixed(2)} €</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Charges réelles:</span>
                          <span className="font-semibold">{chargeRegularizationData.totalRealCharges.toFixed(2)} €</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Charges récupérables:</span>
                          <span className="font-semibold text-green-600">{chargeRegularizationData.recoverableCharges.toFixed(2)} €</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Solde locataire:</span>
                          <span className={`font-semibold ${chargeRegularizationData.tenantBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {chargeRegularizationData.tenantBalance.toFixed(2)} €
                          </span>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="calculation-notes">Méthode de calcul</Label>
                        <Textarea
                          id="calculation-notes"
                          placeholder="Décrivez votre méthode de calcul des charges..."
                          value={chargeRegularizationData.calculationNotes}
                          onChange={(e) => setChargeRegularizationData(prev => ({
                            ...prev,
                            calculationNotes: e.target.value
                          }))}
                        />
                      </div>

                      <Button 
                        onClick={saveChargeRegularization} 
                        disabled={isGenerating}
                        className="w-full"
                      >
                        {isGenerating ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Sauvegarder la régularisation
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Étape 3: Validation et envoi */}
              <TabsContent value="validation" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Documents générés</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => generatePDF('amendment')}
                          disabled={isGenerating}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Générer avenant de bail (PDF)
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => generatePDF('statement')}
                          disabled={isGenerating}
                        >
                          <Receipt className="h-4 w-4 mr-2" />
                          Générer décompte de charges (PDF)
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Envoi au locataire</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => sendToTenant('amendment')}
                          disabled={isGenerating}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Envoyer avenant par email
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => sendToTenant('statement')}
                          disabled={isGenerating}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Envoyer décompte par email
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Historique des révisions */}
      {(revisions.length > 0 || regularizations.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historique des révisions {currentYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="revisions" className="space-y-4">
              <TabsList>
                <TabsTrigger value="revisions">Révisions de loyer</TabsTrigger>
                <TabsTrigger value="regularizations">Régularisations de charges</TabsTrigger>
              </TabsList>

              <TabsContent value="revisions" className="space-y-4">
                {revisions.map(revision => (
                  <div key={revision.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-semibold">
                        Révision {revision.revision_year} - {revision.irl_quarter}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {revision.old_rent_amount.toFixed(2)}€ → {revision.new_rent_amount.toFixed(2)}€ 
                        (+{revision.rent_increase_percentage.toFixed(2)}%)
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={revision.status === 'sent' ? 'default' : 'secondary'}>
                        {revision.status}
                      </Badge>
                      {revision.amendment_pdf_url && (
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="regularizations" className="space-y-4">
                {regularizations.map(regularization => (
                  <div key={regularization.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-semibold">
                        Régularisation {regularization.regularization_year}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Provisions: {regularization.total_provisions_collected.toFixed(2)}€ | 
                        Réel: {regularization.total_real_charges.toFixed(2)}€ | 
                        Solde: {regularization.tenant_balance.toFixed(2)}€
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={regularization.status === 'sent' ? 'default' : 'secondary'}>
                        {regularization.status}
                      </Badge>
                      {regularization.statement_pdf_url && (
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}