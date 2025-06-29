"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon, ChevronLeft, CheckCircle, User, Home, Euro, FileCheck, Settings, Shield, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { authService } from "@/lib/auth-service"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { LeaseDocumentsManager } from "@/components/lease-documents-manager"
import { Progress } from "@/components/ui/progress"

interface LeaseFormData {
  // === SÉLECTION DE BASE ===
  property_id: string
  tenant_id: string
  lease_type: string // furnished/unfurnished
  bail_type: string // single/couple/room
  owner_type: string // individual/sci/company
  guarantee_type: string // guarantor/insurance/visale/none

  // === PARTIES - BAILLEUR ===
  bailleur_nom_prenom: string
  bailleur_domicile: string
  bailleur_email: string
  bailleur_telephone: string
  bailleur_qualite: string
  mandataire_nom: string
  mandataire_adresse: string
  mandataire_activite: string
  mandataire_carte_pro: string

  // === PARTIES - LOCATAIRE ===
  locataire_nom_prenom: string
  locataire_domicile: string
  locataire_email: string
  locataire_telephone: string
  locataire_date_naissance: Date | null

  // === LOGEMENT DÉTAILLÉ ===
  localisation_logement: string
  identifiant_fiscal: string
  type_habitat: string
  regime_juridique: string
  periode_construction: string
  surface_habitable: number | string
  nombre_pieces: number | string
  autres_parties: string
  elements_equipements: string
  modalite_chauffage: string
  modalite_eau_chaude: string
  niveau_performance_dpe: string
  destination_locaux: string
  locaux_accessoires: string
  locaux_communs: string
  equipement_technologies: string

  // === FINANCIER COMPLET ===
  montant_loyer_mensuel: number | string
  montant_depot_garantie: number | string

  // Encadrement loyer
  zone_encadree: boolean
  montant_loyer_reference: number | string
  montant_loyer_reference_majore: number | string
  complement_loyer: number | string

  // Charges
  type_charges: string // provisions/periodique/forfait/aucune
  montant_provisions_charges: number | string
  modalite_reglement_charges: string
  modalites_revision_forfait: string
  assurance_colocataires: boolean
  montant_assurance_colocataires: number | string
  frequence_assurance: string

  // Indexation
  trimestre_reference_irl: string
  date_revision_loyer: string
  zone_tendue: boolean
  ancien_locataire_duree: string
  dernier_loyer_ancien: number | string
  date_dernier_loyer: Date | null
  date_revision_dernier_loyer: Date | null

  // === ÉCHÉANCES ===
  date_prise_effet: Date | null
  duree_contrat: number | string
  evenement_duree_reduite: string
  date_paiement_loyer: string
  paiement_avance_ou_terme: string

  // === CLAUSES ===
  clause_resolutoire: boolean
  clause_solidarite: boolean
  visites_relouer_vendre: boolean
  mode_paiement_loyer: string
  mise_disposition_meubles: string
  animaux_domestiques: string
  entretien_appareils: string
  degradations_locataire: string

  // === HONORAIRES ===
  location_avec_professionnel: boolean
  honoraires_locataire_visite: number | string
  plafond_honoraires_locataire: number | string
  honoraires_bailleur_visite: number | string
  etat_lieux_professionnel: boolean
  honoraires_locataire_etat_lieux: number | string
  plafond_honoraires_etat_lieux: number | string
  honoraires_bailleur_etat_lieux: number | string
  autres_prestations: string
  honoraires_autres_prestations: number | string

  // === CLAUSES OPTIONNELLES ===
  franchise_loyer: string
  clause_libre: string
  travaux_bailleur_cours: string
  travaux_locataire_cours: string
  travaux_entre_locataires: string
  montant_depenses_energie: string

  // === ANNEXES ===
  annexe_dpe: boolean
  annexe_risques: boolean
  annexe_notice: boolean
  annexe_etat_lieux: boolean
  annexe_reglement: boolean
  annexe_plomb: boolean
  annexe_amiante: boolean
  annexe_electricite_gaz: boolean

  // === GARANTS ===
  garants: Array<{
    prenom: string
    nom: string
    adresse: string
    date_fin_engagement: Date | null
    montant_max_engagement: number | string
    pour_locataire: string
  }>

  // === SIGNATURE ===
  lieu_signature: string
  date_signature: Date | null

  // === MÉTADONNÉES ===
  special_conditions: string
  documents: File[]
}

export default function NewLeasePageComplete() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const applicationId = searchParams.get("application")

  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [previewContent, setPreviewContent] = useState("")
  const [user, setUser] = useState<any>(null)
  const [properties, setProperties] = useState<any[]>([])
  const [tenants, setTenants] = useState<any[]>([])
  const [application, setApplication] = useState<any>(null)

  const [formData, setFormData] = useState<LeaseFormData>({
    // === SÉLECTION DE BASE ===
    property_id: "",
    tenant_id: "",
    lease_type: "unfurnished",
    bail_type: "single",
    owner_type: "individual",
    guarantee_type: "guarantor",

    // === PARTIES - BAILLEUR ===
    bailleur_nom_prenom: "",
    bailleur_domicile: "",
    bailleur_email: "",
    bailleur_telephone: "",
    bailleur_qualite: "Propriétaire",
    mandataire_nom: "",
    mandataire_adresse: "",
    mandataire_activite: "",
    mandataire_carte_pro: "",

    // === PARTIES - LOCATAIRE ===
    locataire_nom_prenom: "",
    locataire_domicile: "",
    locataire_email: "",
    locataire_telephone: "",
    locataire_date_naissance: null,

    // === LOGEMENT DÉTAILLÉ ===
    localisation_logement: "",
    identifiant_fiscal: "",
    type_habitat: "",
    regime_juridique: "Copropriété",
    periode_construction: "Après 1949",
    surface_habitable: "",
    nombre_pieces: "",
    autres_parties: "",
    elements_equipements: "",
    modalite_chauffage: "",
    modalite_eau_chaude: "",
    niveau_performance_dpe: "D",
    destination_locaux: "Usage d'habitation exclusivement",
    locaux_accessoires: "",
    locaux_communs: "",
    equipement_technologies: "",

    // === FINANCIER COMPLET ===
    montant_loyer_mensuel: "",
    montant_depot_garantie: "",

    // Encadrement loyer
    zone_encadree: false,
    montant_loyer_reference: "",
    montant_loyer_reference_majore: "",
    complement_loyer: "",

    // Charges
    type_charges: "provisions",
    montant_provisions_charges: "",
    modalite_reglement_charges: "Forfait",
    modalites_revision_forfait: "",
    assurance_colocataires: false,
    montant_assurance_colocataires: "",
    frequence_assurance: "mensuel",

    // Indexation
    trimestre_reference_irl: "",
    date_revision_loyer: "anniversaire",
    zone_tendue: false,
    ancien_locataire_duree: "plus_18_mois",
    dernier_loyer_ancien: "",
    date_dernier_loyer: null,
    date_revision_dernier_loyer: null,

    // === ÉCHÉANCES ===
    date_prise_effet: null,
    duree_contrat: "",
    evenement_duree_reduite: "",
    date_paiement_loyer: "1",
    paiement_avance_ou_terme: "avance",

    // === CLAUSES ===
    clause_resolutoire: true,
    clause_solidarite: true,
    visites_relouer_vendre: true,
    mode_paiement_loyer: "virement",
    mise_disposition_meubles: "",
    animaux_domestiques: "interdits",
    entretien_appareils: "locataire",
    degradations_locataire: "reparation",

    // === HONORAIRES ===
    location_avec_professionnel: false,
    honoraires_locataire_visite: "",
    plafond_honoraires_locataire: "",
    honoraires_bailleur_visite: "",
    etat_lieux_professionnel: false,
    honoraires_locataire_etat_lieux: "",
    plafond_honoraires_etat_lieux: "",
    honoraires_bailleur_etat_lieux: "",
    autres_prestations: "",
    honoraires_autres_prestations: "",

    // === CLAUSES OPTIONNELLES ===
    franchise_loyer: "",
    clause_libre: "",
    travaux_bailleur_cours: "",
    travaux_locataire_cours: "",
    travaux_entre_locataires: "",
    montant_depenses_energie: "",

    // === ANNEXES ===
    annexe_dpe: true,
    annexe_risques: true,
    annexe_notice: true,
    annexe_etat_lieux: false,
    annexe_reglement: false,
    annexe_plomb: false,
    annexe_amiante: false,
    annexe_electricite_gaz: false,

    // === GARANTS ===
    garants: [],

    // === SIGNATURE ===
    lieu_signature: "",
    date_signature: new Date(),

    // === MÉTADONNÉES ===
    special_conditions: "",
    documents: [],
  })

  useEffect(() => {
    checkAuthAndLoadData()
  }, [applicationId])

  const checkAuthAndLoadData = async () => {
    try {
      setLoading(true)
      const currentUser = await authService.getCurrentUser()

      if (!currentUser) {
        toast.error("Vous devez être connecté")
        router.push("/login")
        return
      }

      if (currentUser.user_type !== "owner") {
        toast.error("Accès réservé aux propriétaires")
        router.push("/")
        return
      }

      setUser(currentUser)

      // Charger les propriétés
      const propertiesResponse = await fetch(`/api/properties/owner?owner_id=${currentUser.id}`)
      if (propertiesResponse.ok) {
        const propertiesData = await propertiesResponse.json()
        setProperties(propertiesData.properties || [])
      }

      // Si application fournie, charger les détails
      if (applicationId) {
        const applicationResponse = await fetch(`/api/applications/${applicationId}`)
        if (applicationResponse.ok) {
          const applicationData = await applicationResponse.json()
          setApplication(applicationData.application)

          // Pré-remplir le formulaire
          if (applicationData.application) {
            const app = applicationData.application
            await prefillFormFromApplication(app, currentUser)
          }
        }
      } else {
        // Charger les locataires potentiels
        const tenantsResponse = await fetch(`/api/applications/tenant-owner?owner_id=${currentUser.id}`)
        if (tenantsResponse.ok) {
          const tenantsData = await tenantsResponse.json()
          setTenants(tenantsData.tenants || [])
        }
      }
    } catch (error) {
      console.error("Erreur initialisation:", error)
      toast.error("Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }

  const prefillFormFromApplication = async (app: any, currentUser: any) => {
    const property = app.property
    const tenant = app.tenant

    setFormData((prev) => ({
      ...prev,
      // Sélection
      property_id: app.property_id || "",
      tenant_id: app.tenant_id || "",

      // Parties - Bailleur
      bailleur_nom_prenom: `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim(),
      bailleur_domicile: currentUser.address || "",
      bailleur_email: currentUser.email || "",
      bailleur_telephone: currentUser.phone || "",

      // Parties - Locataire
      locataire_nom_prenom: `${tenant?.first_name || ""} ${tenant?.last_name || ""}`.trim(),
      locataire_domicile: tenant?.address || "",
      locataire_email: tenant?.email || "",
      locataire_telephone: tenant?.phone || "",

      // Logement
      localisation_logement: property?.address
        ? `${property.address}, ${property.postal_code || ""} ${property.city || ""}`.trim()
        : "",
      type_habitat: mapPropertyType(property?.property_type),
      surface_habitable: property?.surface || "",
      nombre_pieces: property?.rooms || "",

      // Financier
      montant_loyer_mensuel: property?.price || "",
      montant_provisions_charges: property?.charges_amount || "0",
      montant_depot_garantie: property?.security_deposit || property?.price || "",

      // Durée
      duree_contrat: prev.lease_type === "furnished" ? 12 : 36,

      // Signature
      lieu_signature: property?.city || "",
    }))

    // Utiliser directement les données du tenant depuis l'application
    if (tenant) {
      setTenants([tenant])
    }
  }

  const mapPropertyType = (type: string): string => {
    if (!type) return ""
    const typeMap: Record<string, string> = {
      apartment: "Appartement",
      house: "Maison",
      studio: "Studio",
      room: "Chambre",
    }
    return typeMap[type.toLowerCase()] || type.charAt(0).toUpperCase() + type.slice(1)
  }

  const handleInputChange = useCallback(
    (field: keyof LeaseFormData, value: any) => {
      setFormData((prev) => {
        const newData = { ...prev, [field]: value }

        // Auto-calculs
        if (field === "property_id") {
          const selectedProperty = properties.find((p) => p.id === value)
          if (selectedProperty) {
            newData.localisation_logement =
              `${selectedProperty.address}, ${selectedProperty.postal_code || ""} ${selectedProperty.city || ""}`.trim()
            newData.type_habitat = mapPropertyType(selectedProperty.property_type)
            newData.surface_habitable = selectedProperty.surface || ""
            newData.nombre_pieces = selectedProperty.rooms || ""
            newData.montant_loyer_mensuel = selectedProperty.price || ""
            newData.montant_provisions_charges = selectedProperty.charges_amount || "0"
            newData.montant_depot_garantie = selectedProperty.security_deposit || selectedProperty.price || ""
            newData.lieu_signature = selectedProperty.city || ""
          }
        }

        if (field === "tenant_id") {
          const selectedTenant = tenants.find((t) => t.id === value)
          if (selectedTenant) {
            newData.locataire_nom_prenom = `${selectedTenant.first_name || ""} ${selectedTenant.last_name || ""}`.trim()
            newData.locataire_domicile = selectedTenant.address || ""
            newData.locataire_email = selectedTenant.email || ""
            newData.locataire_telephone = selectedTenant.phone || ""
          }
        }

        if (field === "lease_type") {
          newData.duree_contrat = value === "furnished" ? 12 : 36
        }

        return newData
      })
    },
    [properties, tenants],
  )

  const addGarant = () => {
    setFormData((prev) => ({
      ...prev,
      garants: [
        ...prev.garants,
        {
          prenom: "",
          nom: "",
          adresse: "",
          date_fin_engagement: null,
          montant_max_engagement: "",
          pour_locataire: prev.locataire_nom_prenom,
        },
      ],
    }))
  }

  const removeGarant = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      garants: prev.garants.filter((_, i) => i !== index),
    }))
  }

  const updateGarant = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      garants: prev.garants.map((garant, i) => (i === index ? { ...garant, [field]: value } : garant)),
    }))
  }

  // Calculer le taux de complétion
  const calculateCompletionRate = useCallback(() => {
    const requiredFields = [
      "property_id",
      "tenant_id",
      "bailleur_nom_prenom",
      "locataire_nom_prenom",
      "localisation_logement",
      "montant_loyer_mensuel",
      "montant_depot_garantie",
      "date_prise_effet",
      "duree_contrat",
    ]

    const completedFields = requiredFields.filter((field) => {
      const value = formData[field as keyof LeaseFormData]
      return value !== "" && value !== null && value !== undefined
    })

    return Math.round((completedFields.length / requiredFields.length) * 100)
  }, [formData])

  const handleSubmit = useCallback(async () => {
    try {
      setSaving(true)

      // Validation finale
      const requiredFields = ["property_id", "tenant_id", "montant_loyer_mensuel", "date_prise_effet"]
      for (const field of requiredFields) {
        if (!formData[field as keyof LeaseFormData]) {
          toast.error(`Champ obligatoire manquant: ${field}`)
          return
        }
      }

      // Préparer les données pour l'API
      const leaseData = {
        // Champs de base
        property_id: formData.property_id,
        tenant_id: formData.tenant_id,
        owner_id: user.id,
        start_date: formData.date_prise_effet?.toISOString().split("T")[0],
        monthly_rent: Number.parseFloat(String(formData.montant_loyer_mensuel)),
        charges: Number.parseFloat(String(formData.montant_provisions_charges)) || 0,
        deposit_amount: Number.parseFloat(String(formData.montant_depot_garantie)) || 0,
        lease_type: formData.lease_type,
        application_id: applicationId || undefined,

        // TOUS les champs du formulaire complet
        ...formData,

        // Conversion des dates
        date_prise_effet: formData.date_prise_effet?.toISOString().split("T")[0],
        date_signature: formData.date_signature?.toISOString().split("T")[0],
        locataire_date_naissance: formData.locataire_date_naissance?.toISOString().split("T")[0],
        date_dernier_loyer: formData.date_dernier_loyer?.toISOString().split("T")[0],
        date_revision_dernier_loyer: formData.date_revision_dernier_loyer?.toISOString().split("T")[0],

        // Métadonnées
        metadata: {
          special_conditions: formData.special_conditions,
          documents_count: formData.documents.length,
          form_version: "v4_complete_smartloc",
          created_from: "new_form_complete_integrated",
          total_fields: Object.keys(formData).length,
          completion_rate: calculateCompletionRate(),
          garants_count: formData.garants.length,
        },
      }

      const response = await fetch("/api/leases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(leaseData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      toast.success("Bail créé avec succès")

      // Rediriger vers la page du bail
      router.push(`/owner/leases/${data.lease.id}`)
    } catch (error) {
      console.error("Erreur création bail:", error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de la création du bail")
    } finally {
      setSaving(false)
    }
  }, [formData, applicationId, router, user, calculateCompletionRate])

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </div>
    )
  }

  const completionRate = calculateCompletionRate()

  return (
    <div className="container mx-auto py-6">
      <BreadcrumbNav
        items={[
          { label: "Tableau de bord", href: "/owner/dashboard" },
          { label: "Baux", href: "/owner/leases" },
          { label: "Nouveau bail", href: "/owner/leases/new" },
        ]}
      />

      <PageHeader title="Création d'un nouveau bail" description="Formulaire complet selon les standards Smartloc" />

      <div className="mt-6">
        {/* Barre de progression */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Progression du formulaire</h3>
              <span className="text-2xl font-bold text-blue-600">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-3" />
            <p className="text-sm text-muted-foreground mt-2">
              Complétez tous les champs obligatoires pour créer le bail
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulaire principal */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Informations du bail</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="selection" className="w-full">
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="selection" className="text-xs">
                      <User className="h-4 w-4 mr-1" />
                      Sélection
                    </TabsTrigger>
                    <TabsTrigger value="parties" className="text-xs">
                      <User className="h-4 w-4 mr-1" />
                      Parties
                    </TabsTrigger>
                    <TabsTrigger value="logement" className="text-xs">
                      <Home className="h-4 w-4 mr-1" />
                      Logement
                    </TabsTrigger>
                    <TabsTrigger value="financier" className="text-xs">
                      <Euro className="h-4 w-4 mr-1" />
                      Financier
                    </TabsTrigger>
                    <TabsTrigger value="clauses" className="text-xs">
                      <Settings className="h-4 w-4 mr-1" />
                      Clauses
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="text-xs">
                      <FileCheck className="h-4 w-4 mr-1" />
                      Documents
                    </TabsTrigger>
                  </TabsList>

                  {/* ONGLET 1: SÉLECTION */}
                  <TabsContent value="selection" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="property">Bien immobilier *</Label>
                        <Select
                          value={formData.property_id}
                          onValueChange={(value) => handleInputChange("property_id", value)}
                          disabled={!!applicationId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un bien" />
                          </SelectTrigger>
                          <SelectContent>
                            {properties.map((property) => (
                              <SelectItem key={property.id} value={property.id}>
                                <div className="flex flex-col">
                                  <span>{property.title}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {property.address}, {property.city} - {property.price}€/mois
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="tenant">Locataire *</Label>
                        <Select
                          value={formData.tenant_id}
                          onValueChange={(value) => handleInputChange("tenant_id", value)}
                          disabled={!!applicationId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un locataire" />
                          </SelectTrigger>
                          <SelectContent>
                            {tenants.map((tenant) => (
                              <SelectItem key={tenant.id} value={tenant.id}>
                                <div className="flex flex-col">
                                  <span>
                                    {tenant.first_name} {tenant.last_name}
                                  </span>
                                  <span className="text-sm text-muted-foreground">{tenant.email}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="lease_type">Type de location *</Label>
                        <Select
                          value={formData.lease_type}
                          onValueChange={(value) => handleInputChange("lease_type", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unfurnished">Location vide</SelectItem>
                            <SelectItem value="furnished">Location meublée</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="bail_type">Type de bail</Label>
                        <Select
                          value={formData.bail_type}
                          onValueChange={(value) => handleInputChange("bail_type", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">Locataire seul</SelectItem>
                            <SelectItem value="couple">Couple ou colocation</SelectItem>
                            <SelectItem value="room">Location à la chambre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="owner_type">Type de propriétaire</Label>
                        <Select
                          value={formData.owner_type}
                          onValueChange={(value) => handleInputChange("owner_type", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="individual">Personne physique</SelectItem>
                            <SelectItem value="sci">SCI familiale</SelectItem>
                            <SelectItem value="company">Autre personne morale</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="guarantee_type">Type de garantie</Label>
                        <Select
                          value={formData.guarantee_type}
                          onValueChange={(value) => handleInputChange("guarantee_type", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="guarantor">Garant</SelectItem>
                            <SelectItem value="insurance">Assurance loyer impayé</SelectItem>
                            <SelectItem value="visale">Visale</SelectItem>
                            <SelectItem value="none">Pas de garantie</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  {/* ONGLET 2: PARTIES */}
                  <TabsContent value="parties" className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Bailleur (Propriétaire)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="bailleur_nom_prenom">Nom et prénom *</Label>
                          <Input
                            id="bailleur_nom_prenom"
                            value={formData.bailleur_nom_prenom}
                            onChange={(e) => handleInputChange("bailleur_nom_prenom", e.target.value)}
                            placeholder="Jean Dupont"
                          />
                        </div>
                        <div>
                          <Label htmlFor="bailleur_email">Email *</Label>
                          <Input
                            id="bailleur_email"
                            type="email"
                            value={formData.bailleur_email}
                            onChange={(e) => handleInputChange("bailleur_email", e.target.value)}
                            placeholder="jean.dupont@email.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="bailleur_telephone">Téléphone</Label>
                          <Input
                            id="bailleur_telephone"
                            value={formData.bailleur_telephone}
                            onChange={(e) => handleInputChange("bailleur_telephone", e.target.value)}
                            placeholder="01 23 45 67 89"
                          />
                        </div>
                        <div>
                          <Label htmlFor="bailleur_qualite">Qualité</Label>
                          <Select
                            value={formData.bailleur_qualite}
                            onValueChange={(value) => handleInputChange("bailleur_qualite", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Propriétaire">Propriétaire</SelectItem>
                              <SelectItem value="Mandataire">Mandataire</SelectItem>
                              <SelectItem value="Gérant">Gérant</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="mt-4">
                        <Label htmlFor="bailleur_domicile">Adresse complète *</Label>
                        <Textarea
                          id="bailleur_domicile"
                          value={formData.bailleur_domicile}
                          onChange={(e) => handleInputChange("bailleur_domicile", e.target.value)}
                          placeholder="123 rue de la Paix, 75001 Paris"
                          rows={2}
                        />
                      </div>

                      {/* Mandataire si applicable */}
                      {formData.bailleur_qualite === "Mandataire" && (
                        <div className="border-t pt-4">
                          <h4 className="font-medium mb-3">Informations du mandataire</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="mandataire_nom">Nom ou raison sociale</Label>
                              <Input
                                id="mandataire_nom"
                                value={formData.mandataire_nom}
                                onChange={(e) => handleInputChange("mandataire_nom", e.target.value)}
                                placeholder="Nom du mandataire"
                              />
                            </div>
                            <div>
                              <Label htmlFor="mandataire_activite">Activité exercée</Label>
                              <Input
                                id="mandataire_activite"
                                value={formData.mandataire_activite}
                                onChange={(e) => handleInputChange("mandataire_activite", e.target.value)}
                                placeholder="Président, membre SCI, gestionnaire..."
                              />
                            </div>
                          </div>
                          <div className="mt-4">
                            <Label htmlFor="mandataire_adresse">Adresse du mandataire</Label>
                            <Textarea
                              id="mandataire_adresse"
                              value={formData.mandataire_adresse}
                              onChange={(e) => handleInputChange("mandataire_adresse", e.target.value)}
                              placeholder="Adresse complète du mandataire"
                              rows={2}
                            />
                          </div>
                          <div className="mt-4">
                            <Label htmlFor="mandataire_carte_pro">Numéro carte professionnelle</Label>
                            <Input
                              id="mandataire_carte_pro"
                              value={formData.mandataire_carte_pro}
                              onChange={(e) => handleInputChange("mandataire_carte_pro", e.target.value)}
                              placeholder="Numéro et lieu de délivrance"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-4">Locataire</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="locataire_nom_prenom">Nom et prénom *</Label>
                          <Input
                            id="locataire_nom_prenom"
                            value={formData.locataire_nom_prenom}
                            onChange={(e) => handleInputChange("locataire_nom_prenom", e.target.value)}
                            placeholder="Marie Martin"
                          />
                        </div>
                        <div>
                          <Label htmlFor="locataire_email">Email *</Label>
                          <Input
                            id="locataire_email"
                            type="email"
                            value={formData.locataire_email}
                            onChange={(e) => handleInputChange("locataire_email", e.target.value)}
                            placeholder="marie.martin@email.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="locataire_telephone">Téléphone</Label>
                          <Input
                            id="locataire_telephone"
                            value={formData.locataire_telephone}
                            onChange={(e) => handleInputChange("locataire_telephone", e.target.value)}
                            placeholder="01 98 76 54 32"
                          />
                        </div>
                        <div>
                          <Label htmlFor="locataire_date_naissance">Date de naissance</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !formData.locataire_date_naissance && "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formData.locataire_date_naissance
                                  ? format(formData.locataire_date_naissance, "dd/MM/yyyy", { locale: fr })
                                  : "Sélectionner une date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={formData.locataire_date_naissance || undefined}
                                onSelect={(date) => handleInputChange("locataire_date_naissance", date)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      <div className="mt-4">
                        <Label htmlFor="locataire_domicile">Adresse complète</Label>
                        <Textarea
                          id="locataire_domicile"
                          value={formData.locataire_domicile}
                          onChange={(e) => handleInputChange("locataire_domicile", e.target.value)}
                          placeholder="456 avenue des Champs, 75008 Paris"
                          rows={2}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* ONGLET 3: LOGEMENT */}
                  <TabsContent value="logement" className="space-y-6">
                    <div>
                      <Label htmlFor="localisation_logement">Adresse du logement *</Label>
                      <Input
                        id="localisation_logement"
                        value={formData.localisation_logement}
                        onChange={(e) => handleInputChange("localisation_logement", e.target.value)}
                        placeholder="789 boulevard Saint-Germain, 75007 Paris"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="identifiant_fiscal">Identifiant fiscal du logement</Label>
                        <Input
                          id="identifiant_fiscal"
                          value={formData.identifiant_fiscal}
                          onChange={(e) => handleInputChange("identifiant_fiscal", e.target.value)}
                          placeholder="Référence cadastrale ou fiscale"
                        />
                      </div>
                      <div>
                        <Label htmlFor="type_habitat">Type d'habitat *</Label>
                        <Select
                          value={formData.type_habitat}
                          onValueChange={(value) => handleInputChange("type_habitat", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Appartement">Appartement</SelectItem>
                            <SelectItem value="Maison">Maison</SelectItem>
                            <SelectItem value="Studio">Studio</SelectItem>
                            <SelectItem value="Chambre">Chambre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="surface_habitable">Surface habitable (m²) *</Label>
                        <Input
                          id="surface_habitable"
                          type="number"
                          value={formData.surface_habitable}
                          onChange={(e) => handleInputChange("surface_habitable", e.target.value)}
                          placeholder="45"
                        />
                      </div>
                      <div>
                        <Label htmlFor="nombre_pieces">Nombre de pièces *</Label>
                        <Input
                          id="nombre_pieces"
                          type="number"
                          value={formData.nombre_pieces}
                          onChange={(e) => handleInputChange("nombre_pieces", e.target.value)}
                          placeholder="2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="niveau_performance_dpe">Performance DPE</Label>
                        <Select
                          value={formData.niveau_performance_dpe}
                          onValueChange={(value) => handleInputChange("niveau_performance_dpe", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A">A (Très économe)</SelectItem>
                            <SelectItem value="B">B (Économe)</SelectItem>
                            <SelectItem value="C">C (Assez économe)</SelectItem>
                            <SelectItem value="D">D (Assez énergivore)</SelectItem>
                            <SelectItem value="E">E (Énergivore)</SelectItem>
                            <SelectItem value="F">F (Très énergivore)</SelectItem>
                            <SelectItem value="G">G (Extrêmement énergivore)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="autres_parties">Autres parties du logement</Label>
                      <Textarea
                        id="autres_parties"
                        value={formData.autres_parties}
                        onChange={(e) => handleInputChange("autres_parties", e.target.value)}
                        placeholder="Balcon, terrasse, jardin, cave..."
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label htmlFor="locaux_accessoires">Locaux et équipements accessoires à usage privatif</Label>
                      <Textarea
                        id="locaux_accessoires"
                        value={formData.locaux_accessoires}
                        onChange={(e) => handleInputChange("locaux_accessoires", e.target.value)}
                        placeholder="Cave, parking, cellier..."
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label htmlFor="locaux_communs">Locaux, parties, équipements et accessoires à usage commun</Label>
                      <Textarea
                        id="locaux_communs"
                        value={formData.locaux_communs}
                        onChange={(e) => handleInputChange("locaux_communs", e.target.value)}
                        placeholder="Hall d'entrée, escaliers, ascenseur, jardin commun..."
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label htmlFor="equipement_technologies">
                        Équipement d'accès aux technologies de l'information
                      </Label>
                      <Textarea
                        id="equipement_technologies"
                        value={formData.equipement_technologies}
                        onChange={(e) => handleInputChange("equipement_technologies", e.target.value)}
                        placeholder="Fibre optique, ADSL, antenne TV..."
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="modalite_chauffage">Mode de chauffage</Label>
                        <Input
                          id="modalite_chauffage"
                          value={formData.modalite_chauffage}
                          onChange={(e) => handleInputChange("modalite_chauffage", e.target.value)}
                          placeholder="Chauffage central, électrique..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="modalite_eau_chaude">Mode d'eau chaude</Label>
                        <Input
                          id="modalite_eau_chaude"
                          value={formData.modalite_eau_chaude}
                          onChange={(e) => handleInputChange("modalite_eau_chaude", e.target.value)}
                          placeholder="Chauffe-eau électrique, gaz..."
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* ONGLET 4: FINANCIER */}
                  <TabsContent value="financier" className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Loyer et dépôt de garantie</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="montant_loyer_mensuel">Loyer mensuel hors charges (€) *</Label>
                          <Input
                            id="montant_loyer_mensuel"
                            type="number"
                            step="0.01"
                            value={formData.montant_loyer_mensuel}
                            onChange={(e) => handleInputChange("montant_loyer_mensuel", e.target.value)}
                            placeholder="850.00"
                          />
                        </div>
                        <div>
                          <Label htmlFor="montant_depot_garantie">Dépôt de garantie (€) *</Label>
                          <Input
                            id="montant_depot_garantie"
                            type="number"
                            step="0.01"
                            value={formData.montant_depot_garantie}
                            onChange={(e) => handleInputChange("montant_depot_garantie", e.target.value)}
                            placeholder="850.00"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Encadrement des loyers */}
                    <div>
                      <div className="flex items-center space-x-2 mb-4">
                        <Switch
                          id="zone_encadree"
                          checked={formData.zone_encadree}
                          onCheckedChange={(checked) => handleInputChange("zone_encadree", checked)}
                        />
                        <Label htmlFor="zone_encadree">Le logement est dans une zone où le loyer est encadré</Label>
                      </div>

                      {formData.zone_encadree && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-l-4 border-blue-500 pl-4">
                          <div>
                            <Label htmlFor="montant_loyer_reference">Loyer mensuel de référence (€/mois)</Label>
                            <Input
                              id="montant_loyer_reference"
                              type="number"
                              step="0.01"
                              value={formData.montant_loyer_reference}
                              onChange={(e) => handleInputChange("montant_loyer_reference", e.target.value)}
                              placeholder="800.00"
                            />
                          </div>
                          <div>
                            <Label htmlFor="montant_loyer_reference_majore">
                              Loyer mensuel de référence majoré (€/mois)
                            </Label>
                            <Input
                              id="montant_loyer_reference_majore"
                              type="number"
                              step="0.01"
                              value={formData.montant_loyer_reference_majore}
                              onChange={(e) => handleInputChange("montant_loyer_reference_majore", e.target.value)}
                              placeholder="960.00"
                            />
                          </div>
                          <div>
                            <Label htmlFor="complement_loyer">Complément de loyer (€)</Label>
                            <Input
                              id="complement_loyer"
                              type="number"
                              step="0.01"
                              value={formData.complement_loyer}
                              onChange={(e) => handleInputChange("complement_loyer", e.target.value)}
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Charges */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Charges</h3>
                      <div>
                        <Label htmlFor="type_charges">Type de charges</Label>
                        <Select
                          value={formData.type_charges}
                          onValueChange={(value) => handleInputChange("type_charges", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="provisions">
                              Provisions sur charges (avec régularisation annuelle)
                            </SelectItem>
                            <SelectItem value="periodique">Paiement périodique sans provisions</SelectItem>
                            <SelectItem value="forfait">Forfait de charges</SelectItem>
                            <SelectItem value="aucune">Absence de charge</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {(formData.type_charges === "provisions" || formData.type_charges === "forfait") && (
                        <div className="mt-4">
                          <Label htmlFor="montant_provisions_charges">Montant mensuel des charges (€/mois)</Label>
                          <Input
                            id="montant_provisions_charges"
                            type="number"
                            step="0.01"
                            value={formData.montant_provisions_charges}
                            onChange={(e) => handleInputChange("montant_provisions_charges", e.target.value)}
                            placeholder="100.00"
                          />
                        </div>
                      )}

                      {formData.type_charges === "forfait" && (
                        <div className="mt-4">
                          <Label htmlFor="modalites_revision_forfait">Modalité de révision du forfait de charges</Label>
                          <Select
                            value={formData.modalites_revision_forfait}
                            onValueChange={(value) => handleInputChange("modalites_revision_forfait", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="indexation_loyer">Indexation identique au loyer</SelectItem>
                              <SelectItem value="autre">À saisir</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {/* Dépenses énergie */}
                    <div>
                      <Label htmlFor="montant_depenses_energie">Montant estimé des dépenses annuelles d'énergie</Label>
                      <Input
                        id="montant_depenses_energie"
                        value={formData.montant_depenses_energie}
                        onChange={(e) => handleInputChange("montant_depenses_energie", e.target.value)}
                        placeholder="Entre 1200€ et 1800€ par an"
                      />
                    </div>

                    {/* Échéances */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Échéances</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="date_prise_effet">Date d'entrée *</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !formData.date_prise_effet && "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formData.date_prise_effet
                                  ? format(formData.date_prise_effet, "dd/MM/yyyy", { locale: fr })
                                  : "Sélectionner une date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={formData.date_prise_effet || undefined}
                                onSelect={(date) => handleInputChange("date_prise_effet", date)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div>
                          <Label htmlFor="duree_contrat">Durée du contrat (mois) *</Label>
                          <Input
                            id="duree_contrat"
                            type="number"
                            value={formData.duree_contrat}
                            onChange={(e) => handleInputChange("duree_contrat", e.target.value)}
                            placeholder={formData.lease_type === "furnished" ? "12" : "36"}
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <Label htmlFor="evenement_duree_reduite">Événement justifiant une durée réduite</Label>
                        <Textarea
                          id="evenement_duree_reduite"
                          value={formData.evenement_duree_reduite}
                          onChange={(e) => handleInputChange("evenement_duree_reduite", e.target.value)}
                          placeholder="Raison justifiant une durée inférieure à la durée légale..."
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <Label htmlFor="date_paiement_loyer">Le loyer est payé le</Label>
                          <Select
                            value={formData.date_paiement_loyer}
                            onValueChange={(value) => handleInputChange("date_paiement_loyer", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                                <SelectItem key={day} value={day.toString()}>
                                  Le {day} de chaque mois
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="paiement_avance_ou_terme">Modalité de paiement</Label>
                          <Select
                            value={formData.paiement_avance_ou_terme}
                            onValueChange={(value) => handleInputChange("paiement_avance_ou_terme", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="avance">En avance pour le mois à venir</SelectItem>
                              <SelectItem value="terme">Une fois le mois écoulé</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* ONGLET 5: CLAUSES */}
                  <TabsContent value="clauses" className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Clauses génériques</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="clause_resolutoire">Clause résolutoire</Label>
                          <Switch
                            id="clause_resolutoire"
                            checked={formData.clause_resolutoire}
                            onCheckedChange={(checked) => handleInputChange("clause_resolutoire", checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="clause_solidarite">Clause de solidarité</Label>
                          <Switch
                            id="clause_solidarite"
                            checked={formData.clause_solidarite}
                            onCheckedChange={(checked) => handleInputChange("clause_solidarite", checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="visites_relouer_vendre">Visites pour relouer ou vendre</Label>
                          <Switch
                            id="visites_relouer_vendre"
                            checked={formData.visites_relouer_vendre}
                            onCheckedChange={(checked) => handleInputChange("visites_relouer_vendre", checked)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <div>
                          <Label htmlFor="mode_paiement_loyer">Mode de paiement du loyer</Label>
                          <Select
                            value={formData.mode_paiement_loyer}
                            onValueChange={(value) => handleInputChange("mode_paiement_loyer", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="virement">Virement bancaire</SelectItem>
                              <SelectItem value="prelevement">Prélèvement automatique</SelectItem>
                              <SelectItem value="cheque">Chèque</SelectItem>
                              <SelectItem value="especes">Espèces</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="animaux_domestiques">Animaux domestiques</Label>
                          <Select
                            value={formData.animaux_domestiques}
                            onValueChange={(value) => handleInputChange("animaux_domestiques", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="interdits">Interdits</SelectItem>
                              <SelectItem value="autorises">Autorisés</SelectItem>
                              <SelectItem value="accord_prealable">Avec accord préalable</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Honoraires */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Honoraires d'agence</h3>
                      <div className="flex items-center space-x-2 mb-4">
                        <Switch
                          id="location_avec_professionnel"
                          checked={formData.location_avec_professionnel}
                          onCheckedChange={(checked) => handleInputChange("location_avec_professionnel", checked)}
                        />
                        <Label htmlFor="location_avec_professionnel">
                          La location a été réalisée avec l'entremise d'un professionnel mandaté
                        </Label>
                      </div>

                      {formData.location_avec_professionnel && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-l-4 border-blue-500 pl-4">
                          <div>
                            <Label htmlFor="honoraires_locataire_visite">Honoraires locataire (€)</Label>
                            <Input
                              id="honoraires_locataire_visite"
                              type="number"
                              step="0.01"
                              value={formData.honoraires_locataire_visite}
                              onChange={(e) => handleInputChange("honoraires_locataire_visite", e.target.value)}
                              placeholder="200.00"
                            />
                          </div>
                          <div>
                            <Label htmlFor="plafond_honoraires_locataire">Plafond honoraires (€/m²)</Label>
                            <Input
                              id="plafond_honoraires_locataire"
                              type="number"
                              step="0.01"
                              value={formData.plafond_honoraires_locataire}
                              onChange={(e) => handleInputChange("plafond_honoraires_locataire", e.target.value)}
                              placeholder="12.00"
                            />
                          </div>
                          <div>
                            <Label htmlFor="honoraires_bailleur_visite">Honoraires bailleur (€)</Label>
                            <Input
                              id="honoraires_bailleur_visite"
                              type="number"
                              step="0.01"
                              value={formData.honoraires_bailleur_visite}
                              onChange={(e) => handleInputChange("honoraires_bailleur_visite", e.target.value)}
                              placeholder="150.00"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-2 mt-4 mb-4">
                        <Switch
                          id="etat_lieux_professionnel"
                          checked={formData.etat_lieux_professionnel}
                          onCheckedChange={(checked) => handleInputChange("etat_lieux_professionnel", checked)}
                        />
                        <Label htmlFor="etat_lieux_professionnel">
                          L'état des lieux a été réalisé avec l'entremise d'un professionnel mandaté
                        </Label>
                      </div>

                      {formData.etat_lieux_professionnel && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-l-4 border-green-500 pl-4">
                          <div>
                            <Label htmlFor="honoraires_locataire_etat_lieux">
                              Honoraires locataire état des lieux (€)
                            </Label>
                            <Input
                              id="honoraires_locataire_etat_lieux"
                              type="number"
                              step="0.01"
                              value={formData.honoraires_locataire_etat_lieux}
                              onChange={(e) => handleInputChange("honoraires_locataire_etat_lieux", e.target.value)}
                              placeholder="100.00"
                            />
                          </div>
                          <div>
                            <Label htmlFor="plafond_honoraires_etat_lieux">
                              Plafond honoraires état des lieux (€/m²)
                            </Label>
                            <Input
                              id="plafond_honoraires_etat_lieux"
                              type="number"
                              step="0.01"
                              value={formData.plafond_honoraires_etat_lieux}
                              onChange={(e) => handleInputChange("plafond_honoraires_etat_lieux", e.target.value)}
                              placeholder="3.00"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Clauses optionnelles */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Clauses optionnelles</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="franchise_loyer">Franchise de loyer</Label>
                          <Textarea
                            id="franchise_loyer"
                            value={formData.franchise_loyer}
                            onChange={(e) => handleInputChange("franchise_loyer", e.target.value)}
                            placeholder="Période de gratuité accordée au locataire..."
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label htmlFor="clause_libre">Clause libre</Label>
                          <Textarea
                            id="clause_libre"
                            value={formData.clause_libre}
                            onChange={(e) => handleInputChange("clause_libre", e.target.value)}
                            placeholder="Clauses particulières spécifiques au bail..."
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label htmlFor="travaux_bailleur_cours">Travaux bailleur en cours de bail</Label>
                          <Textarea
                            id="travaux_bailleur_cours"
                            value={formData.travaux_bailleur_cours}
                            onChange={(e) => handleInputChange("travaux_bailleur_cours", e.target.value)}
                            placeholder="Travaux prévus par le bailleur pendant la location..."
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Garants */}
                    {formData.guarantee_type === "guarantor" && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium">Garants</h3>
                          <Button type="button" onClick={addGarant} variant="outline" size="sm">
                            <User className="h-4 w-4 mr-2" />
                            Ajouter un garant
                          </Button>
                        </div>

                        {formData.garants.map((garant, index) => (
                          <Card key={index} className="mb-4">
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-base">Garant {index + 1}</CardTitle>
                                <Button type="button" onClick={() => removeGarant(index)} variant="ghost" size="sm">
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor={`garant_prenom_${index}`}>Prénom du garant</Label>
                                  <Input
                                    id={`garant_prenom_${index}`}
                                    value={garant.prenom}
                                    onChange={(e) => updateGarant(index, "prenom", e.target.value)}
                                    placeholder="Jean"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`garant_nom_${index}`}>Nom du garant</Label>
                                  <Input
                                    id={`garant_nom_${index}`}
                                    value={garant.nom}
                                    onChange={(e) => updateGarant(index, "nom", e.target.value)}
                                    placeholder="Dupont"
                                  />
                                </div>
                              </div>
                              <div className="mt-4">
                                <Label htmlFor={`garant_adresse_${index}`}>Adresse du garant</Label>
                                <Textarea
                                  id={`garant_adresse_${index}`}
                                  value={garant.adresse}
                                  onChange={(e) => updateGarant(index, "adresse", e.target.value)}
                                  placeholder="123 rue de la Paix, 75001 Paris"
                                  rows={2}
                                />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                  <Label htmlFor={`garant_montant_${index}`}>Montant maximum d'engagement (€)</Label>
                                  <Input
                                    id={`garant_montant_${index}`}
                                    type="number"
                                    value={garant.montant_max_engagement}
                                    onChange={(e) => updateGarant(index, "montant_max_engagement", e.target.value)}
                                    placeholder="5000"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`garant_fin_${index}`}>Date de fin d'engagement</Label>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className={cn(
                                          "w-full justify-start text-left font-normal",
                                          !garant.date_fin_engagement && "text-muted-foreground",
                                        )}
                                      >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {garant.date_fin_engagement
                                          ? format(garant.date_fin_engagement, "dd/MM/yyyy", { locale: fr })
                                          : "Sélectionner une date"}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                      <Calendar
                                        mode="single"
                                        selected={garant.date_fin_engagement || undefined}
                                        onSelect={(date) => updateGarant(index, "date_fin_engagement", date)}
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* ONGLET 6: DOCUMENTS */}
                  <TabsContent value="documents" className="space-y-6">
                    <LeaseDocumentsManager
                      formData={formData}
                      onDocumentsChange={(documents) => handleInputChange("documents", documents)}
                      onAnnexesChange={(annexes) => {
                        Object.entries(annexes).forEach(([key, value]) => {
                          handleInputChange(key as keyof LeaseFormData, value)
                        })
                      }}
                    />

                    {/* Signature */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Signature</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="lieu_signature">Lieu de signature</Label>
                          <Input
                            id="lieu_signature"
                            value={formData.lieu_signature}
                            onChange={(e) => handleInputChange("lieu_signature", e.target.value)}
                            placeholder="Paris"
                          />
                        </div>
                        <div>
                          <Label htmlFor="date_signature">Date de signature</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !formData.date_signature && "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formData.date_signature
                                  ? format(formData.date_signature, "dd/MM/yyyy", { locale: fr })
                                  : "Sélectionner une date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={formData.date_signature || undefined}
                                onSelect={(date) => handleInputChange("date_signature", date)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      <div className="mt-4">
                        <Label htmlFor="special_conditions">Conditions particulières</Label>
                        <Textarea
                          id="special_conditions"
                          value={formData.special_conditions}
                          onChange={(e) => handleInputChange("special_conditions", e.target.value)}
                          placeholder="Conditions spéciales, clauses particulières..."
                          rows={4}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => router.back()}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
                <Button onClick={handleSubmit} disabled={saving} className="bg-green-600 hover:bg-green-700">
                  {saving ? "Création..." : "Créer le bail"}
                  <CheckCircle className="h-4 w-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Panneau latéral avec résumé */}
          <div className="space-y-6">
            {/* Résumé */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Résumé du bail</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">Type:</span>{" "}
                  <span className="text-muted-foreground">
                    {formData.lease_type === "furnished" ? "Meublé" : "Non meublé"}
                  </span>
                </div>
                {formData.localisation_logement && (
                  <div>
                    <span className="font-medium">Logement:</span>{" "}
                    <span className="text-muted-foreground">{formData.localisation_logement}</span>
                  </div>
                )}
                {formData.montant_loyer_mensuel && (
                  <div>
                    <span className="font-medium">Loyer:</span>{" "}
                    <span className="text-muted-foreground">{formData.montant_loyer_mensuel}€/mois</span>
                  </div>
                )}
                {formData.montant_provisions_charges && (
                  <div>
                    <span className="font-medium">Charges:</span>{" "}
                    <span className="text-muted-foreground">{formData.montant_provisions_charges}€/mois</span>
                  </div>
                )}
                {formData.date_prise_effet && (
                  <div>
                    <span className="font-medium">Début:</span>{" "}
                    <span className="text-muted-foreground">
                      {format(formData.date_prise_effet, "dd/MM/yyyy", { locale: fr })}
                    </span>
                  </div>
                )}
                {formData.duree_contrat && (
                  <div>
                    <span className="font-medium">Durée:</span>{" "}
                    <span className="text-muted-foreground">{formData.duree_contrat} mois</span>
                  </div>
                )}
                {formData.garants.length > 0 && (
                  <div>
                    <span className="font-medium">Garants:</span>{" "}
                    <span className="text-muted-foreground">{formData.garants.length}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progression par section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Progression</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Sélection</span>
                  <span className="text-green-600">{formData.property_id && formData.tenant_id ? "✓" : "○"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Parties</span>
                  <span className="text-green-600">
                    {formData.bailleur_nom_prenom && formData.locataire_nom_prenom ? "✓" : "○"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Logement</span>
                  <span className="text-green-600">
                    {formData.localisation_logement && formData.surface_habitable ? "✓" : "○"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Financier</span>
                  <span className="text-green-600">
                    {formData.montant_loyer_mensuel && formData.montant_depot_garantie ? "✓" : "○"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Documents</span>
                  <span className="text-green-600">
                    {formData.annexe_dpe && formData.annexe_risques && formData.annexe_notice ? "✓" : "○"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Aide contextuelle */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Aide
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <p>
                  <strong>Documents obligatoires :</strong> DPE, État des risques, Notice d'information
                </p>
                <p>
                  <strong>Durée légale :</strong> 3 ans (non meublé), 1 an (meublé)
                </p>
                <p>
                  <strong>Dépôt de garantie :</strong> Max 1 mois (non meublé), 2 mois (meublé)
                </p>
                <p>
                  <strong>Zone tendue :</strong> Évolution du loyer plafonnée à l'IRL
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
