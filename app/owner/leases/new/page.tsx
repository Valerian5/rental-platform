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
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  Eye,
  FileText,
  CheckCircle,
  User,
  Home,
  Euro,
  Clock,
  FileCheck,
  EyeOff,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { authService } from "@/lib/auth-service"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { LeaseDocumentsManager } from "@/components/lease-documents-manager"

interface LeaseFormData {
  // Sélection
  property_id: string
  tenant_id: string

  // Parties
  bailleur_nom_prenom: string
  bailleur_domicile: string
  bailleur_email: string
  bailleur_telephone: string
  bailleur_qualite: string

  locataire_nom_prenom: string
  locataire_domicile: string
  locataire_email: string
  locataire_telephone: string

  // Logement - COMPLET selon template
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

  // Financier - COMPLET
  montant_loyer_mensuel: number | string
  soumis_decret_evolution: string
  soumis_loyer_reference: string
  montant_provisions_charges: number | string
  modalite_reglement_charges: string
  montant_depot_garantie: number | string
  periodicite_paiement: string
  paiement_echeance: string
  date_paiement: string
  lieu_paiement: string
  montant_depenses_energie: string

  // Durée
  date_prise_effet: Date | null
  duree_contrat: number | string
  evenement_duree_reduite: string

  // Travaux
  montant_travaux_amelioration: string

  // Conditions particulières
  clause_solidarite: string
  clause_resolutoire: string
  usage_prevu: string

  // Honoraires
  honoraires_locataire: string
  plafond_honoraires_etat_lieux: string

  // Annexes
  annexe_dpe: boolean
  annexe_risques: boolean
  annexe_notice: boolean
  annexe_etat_lieux: boolean
  annexe_reglement: boolean
  annexe_plomb: boolean
  annexe_amiante: boolean
  annexe_electricite_gaz: boolean

  // Signature
  lieu_signature: string
  date_signature: Date | null

  // Métadonnées
  lease_type: string
  special_conditions: string
  documents: File[]
}

export default function NewLeasePageImproved() {
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
    // Sélection
    property_id: "",
    tenant_id: "",

    // Parties
    bailleur_nom_prenom: "",
    bailleur_domicile: "",
    bailleur_email: "",
    bailleur_telephone: "",
    bailleur_qualite: "Propriétaire",

    locataire_nom_prenom: "",
    locataire_domicile: "",
    locataire_email: "",
    locataire_telephone: "",

    // Logement - COMPLET
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

    // Financier - COMPLET
    montant_loyer_mensuel: "",
    soumis_decret_evolution: "Non",
    soumis_loyer_reference: "Non",
    montant_provisions_charges: "",
    modalite_reglement_charges: "Forfait",
    montant_depot_garantie: "",
    periodicite_paiement: "Mensuelle",
    paiement_echeance: "À terme échu",
    date_paiement: "1",
    lieu_paiement: "Virement bancaire",
    montant_depenses_energie: "",

    // Durée
    date_prise_effet: null,
    duree_contrat: "",
    evenement_duree_reduite: "",

    // Travaux
    montant_travaux_amelioration: "",

    // Conditions
    clause_solidarite: "Applicable",
    clause_resolutoire: "Applicable",
    usage_prevu: "Résidence principale",

    // Honoraires
    honoraires_locataire: "",
    plafond_honoraires_etat_lieux: "",

    // Annexes
    annexe_dpe: true,
    annexe_risques: true,
    annexe_notice: true,
    annexe_etat_lieux: false,
    annexe_reglement: false,
    annexe_plomb: false,
    annexe_amiante: false,
    annexe_electricite_gaz: false,

    // Signature
    lieu_signature: "",
    date_signature: new Date(),

    // Métadonnées
    lease_type: "unfurnished",
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

  const generatePreview = useCallback(async () => {
    try {
      const response = await fetch("/api/lease-templates/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leaseType: formData.lease_type,
          formData: formData,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setPreviewContent(data.preview)
      } else {
        generateSimplePreview()
      }
    } catch (error) {
      generateSimplePreview()
    }
  }, [formData])

  const generateSimplePreview = useCallback(() => {
    const preview = `
      <div class="space-y-6 p-6 bg-white">
        <div class="text-center border-b pb-4">
          <h1 class="text-2xl font-bold">CONTRAT DE LOCATION</h1>
          <p class="text-gray-600">Logement ${formData.lease_type === "furnished" ? "meublé" : "non meublé"}</p>
        </div>
        
        <div class="grid grid-cols-2 gap-6">
          <div>
            <h3 class="font-semibold mb-2 text-blue-600">BAILLEUR</h3>
            <p class="font-medium">${formData.bailleur_nom_prenom || "[Nom du bailleur]"}</p>
            <p class="text-sm text-gray-600">${formData.bailleur_domicile || "[Adresse du bailleur]"}</p>
            <p class="text-sm text-gray-600">${formData.bailleur_email || "[Email du bailleur]"}</p>
          </div>
          <div>
            <h3 class="font-semibold mb-2 text-blue-600">LOCATAIRE</h3>
            <p class="font-medium">${formData.locataire_nom_prenom || "[Nom du locataire]"}</p>
            <p class="text-sm text-gray-600">${formData.locataire_domicile || "[Adresse du locataire]"}</p>
            <p class="text-sm text-gray-600">${formData.locataire_email || "[Email du locataire]"}</p>
          </div>
        </div>
        
        <div>
          <h3 class="font-semibold mb-2 text-blue-600">LOGEMENT</h3>
          <p class="font-medium">${formData.localisation_logement || "[Adresse du logement]"}</p>
          <p class="text-sm text-gray-600">${formData.type_habitat || "[Type]"} - ${formData.surface_habitable || "[Surface]"} m² - ${formData.nombre_pieces || "[Pièces]"} pièces</p>
        </div>
        
        <div>
          <h3 class="font-semibold mb-2 text-blue-600">CONDITIONS FINANCIÈRES</h3>
          <div class="bg-gray-50 p-3 rounded">
            <p>Loyer mensuel : <span class="font-medium">${formData.montant_loyer_mensuel || "[Montant]"} €</span></p>
            <p>Charges : <span class="font-medium">${formData.montant_provisions_charges || "0"} €</span></p>
            <p>Dépôt de garantie : <span class="font-medium">${formData.montant_depot_garantie || "[Dépôt]"} €</span></p>
          </div>
        </div>
        
        <div>
          <h3 class="font-semibold mb-2 text-blue-600">DURÉE</h3>
          <p>Date de prise d'effet : <span class="font-medium">${
            formData.date_prise_effet
              ? format(formData.date_prise_effet, "dd/MM/yyyy", { locale: fr })
              : "[Date de début]"
          }</span></p>
          <p>Durée : <span class="font-medium">${formData.duree_contrat || "[Durée]"} mois</span></p>
        </div>
      </div>
    `
    setPreviewContent(preview)
  }, [formData])

  // Générer le preview automatiquement quand les données changent
  useEffect(() => {
    if (formData.property_id && formData.tenant_id) {
      generatePreview()
    }
  }, [formData, generatePreview])

  const validateStep = useCallback(
    (step: number): boolean => {
      switch (step) {
        case 1:
          return !!(formData.property_id && formData.tenant_id)
        case 2:
          return !!(
            formData.bailleur_nom_prenom &&
            formData.locataire_nom_prenom &&
            formData.bailleur_email &&
            formData.locataire_email
          )
        case 3:
          return !!(
            formData.localisation_logement &&
            formData.type_habitat &&
            formData.surface_habitable &&
            formData.nombre_pieces
          )
        case 4:
          return !!(formData.montant_loyer_mensuel && formData.montant_depot_garantie)
        case 5:
          return !!(formData.date_prise_effet && formData.duree_contrat)
        default:
          return true
      }
    },
    [formData],
  )

  const nextStep = useCallback(() => {
    if (!validateStep(currentStep)) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }
    setCurrentStep((prev) => Math.min(prev + 1, 6))
  }, [currentStep, validateStep])

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }, [])

  const handleSubmit = useCallback(async () => {
    try {
      setSaving(true)

      // Validation finale
      if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4) || !validateStep(5)) {
        toast.error("Veuillez remplir tous les champs obligatoires")
        return
      }

      // Préparer les données pour l'API
      const leaseData = {
        // Champs de base
        property_id: formData.property_id,
        tenant_id: formData.tenant_id,
        start_date: formData.date_prise_effet?.toISOString().split("T")[0],
        end_date: formData.date_prise_effet
          ? new Date(formData.date_prise_effet.getTime() + Number(formData.duree_contrat) * 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0]
          : null,
        monthly_rent: Number.parseFloat(String(formData.montant_loyer_mensuel)),
        charges: Number.parseFloat(String(formData.montant_provisions_charges)) || 0,
        deposit: Number.parseFloat(String(formData.montant_depot_garantie)) || 0,
        lease_type: formData.lease_type,
        application_id: applicationId || undefined,

        // TOUS les champs du formulaire
        ...formData,

        // Conversion des dates
        date_prise_effet: formData.date_prise_effet?.toISOString().split("T")[0],
        date_signature: formData.date_signature?.toISOString().split("T")[0],

        metadata: {
          special_conditions: formData.special_conditions,
          documents_count: formData.documents.length,
          form_version: "v3_complete_template",
          created_from: "new_form_complete",
          total_fields: Object.keys(formData).length,
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
  }, [formData, applicationId, router, validateStep])

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

  const steps = [
    { id: 1, title: "Sélection", icon: User, description: "Bien et locataire" },
    { id: 2, title: "Parties", icon: User, description: "Informations des parties" },
    { id: 3, title: "Logement", icon: Home, description: "Détails du bien" },
    { id: 4, title: "Financier", icon: Euro, description: "Conditions financières" },
    { id: 5, title: "Durée", icon: Clock, description: "Période du bail" },
    { id: 6, title: "Documents", icon: FileCheck, description: "Documents et finalisation" },
  ]

  const currentStepData = steps.find((s) => s.id === currentStep)

  return (
    <div className="container mx-auto py-6">
      <BreadcrumbNav
        items={[
          { label: "Tableau de bord", href: "/owner/dashboard" },
          { label: "Baux", href: "/owner/leases" },
          { label: "Nouveau bail", href: "/owner/leases/new" },
        ]}
      />

      <PageHeader title="Création d'un nouveau bail" description="Assistant de création de contrat de location" />

      <div className="mt-6">
        {/* Indicateur d'étapes */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex flex-col items-center ${currentStep >= step.id ? "text-blue-600" : "text-gray-400"}`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                    currentStep >= step.id
                      ? "bg-blue-100 border-2 border-blue-600"
                      : "bg-gray-100 border border-gray-300"
                  }`}
                >
                  {currentStep > step.id ? <Check className="h-6 w-6" /> : <step.icon className="h-6 w-6" />}
                </div>
                <span className="text-xs font-medium text-center">{step.title}</span>
                <span className="text-xs text-muted-foreground text-center">{step.description}</span>
              </div>
            ))}
          </div>
          <div className="relative mt-4">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200"></div>
            <div
              className="absolute top-0 left-0 h-1 bg-blue-600 transition-all duration-300"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulaire principal */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {currentStepData && <currentStepData.icon className="h-5 w-5" />}
                  {currentStepData?.title} - {currentStepData?.description}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Étape 1: Sélection */}
                {currentStep === 1 && (
                  <div className="space-y-6">
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

                    <div>
                      <Label htmlFor="lease_type">Type de bail *</Label>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div
                          className={`flex flex-col items-center justify-center rounded-md border-2 p-4 cursor-pointer ${
                            formData.lease_type === "unfurnished"
                              ? "border-blue-600 bg-blue-50"
                              : "border-muted bg-popover hover:bg-accent"
                          }`}
                          onClick={() => handleInputChange("lease_type", "unfurnished")}
                        >
                          <span className="font-medium">Non meublé</span>
                          <span className="text-xs text-muted-foreground">Bail de 3 ans</span>
                        </div>
                        <div
                          className={`flex flex-col items-center justify-center rounded-md border-2 p-4 cursor-pointer ${
                            formData.lease_type === "furnished"
                              ? "border-blue-600 bg-blue-50"
                              : "border-muted bg-popover hover:bg-accent"
                          }`}
                          onClick={() => handleInputChange("lease_type", "furnished")}
                        >
                          <span className="font-medium">Meublé</span>
                          <span className="text-xs text-muted-foreground">Bail de 1 an</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Étape 2: Parties */}
                {currentStep === 2 && (
                  <div className="space-y-6">
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
                  </div>
                )}

                {/* Étape 3: Logement */}
                {currentStep === 3 && (
                  <div className="space-y-6">
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
                      <div>
                        <Label htmlFor="regime_juridique">Régime juridique</Label>
                        <Select
                          value={formData.regime_juridique}
                          onValueChange={(value) => handleInputChange("regime_juridique", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Copropriété">Copropriété</SelectItem>
                            <SelectItem value="Monopropriété">Monopropriété</SelectItem>
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
                      <Label htmlFor="elements_equipements">Éléments d'équipement</Label>
                      <Textarea
                        id="elements_equipements"
                        value={formData.elements_equipements}
                        onChange={(e) => handleInputChange("elements_equipements", e.target.value)}
                        placeholder="Cuisine équipée, salle de bain avec douche, placards..."
                        rows={3}
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
                  </div>
                )}

                {/* Étape 4: Financier */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="montant_loyer_mensuel">Loyer mensuel (€) *</Label>
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
                        <Label htmlFor="montant_provisions_charges">Provisions charges (€)</Label>
                        <Input
                          id="montant_provisions_charges"
                          type="number"
                          step="0.01"
                          value={formData.montant_provisions_charges}
                          onChange={(e) => handleInputChange("montant_provisions_charges", e.target.value)}
                          placeholder="100.00"
                        />
                      </div>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="periodicite_paiement">Périodicité de paiement</Label>
                        <Select
                          value={formData.periodicite_paiement}
                          onValueChange={(value) => handleInputChange("periodicite_paiement", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Mensuelle">Mensuelle</SelectItem>
                            <SelectItem value="Trimestrielle">Trimestrielle</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="paiement_echeance">Échéance de paiement</Label>
                        <Select
                          value={formData.paiement_echeance}
                          onValueChange={(value) => handleInputChange("paiement_echeance", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="À terme échu">À terme échu</SelectItem>
                            <SelectItem value="À terme à échoir">À terme à échoir</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date_paiement">Date de paiement</Label>
                        <Select
                          value={formData.date_paiement}
                          onValueChange={(value) => handleInputChange("date_paiement", value)}
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
                        <Label htmlFor="lieu_paiement">Mode de paiement</Label>
                        <Select
                          value={formData.lieu_paiement}
                          onValueChange={(value) => handleInputChange("lieu_paiement", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Virement bancaire">Virement bancaire</SelectItem>
                            <SelectItem value="Prélèvement automatique">Prélèvement automatique</SelectItem>
                            <SelectItem value="Chèque">Chèque</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="soumis_decret_evolution">Soumis au décret d'évolution</Label>
                        <Select
                          value={formData.soumis_decret_evolution}
                          onValueChange={(value) => handleInputChange("soumis_decret_evolution", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Oui">Oui</SelectItem>
                            <SelectItem value="Non">Non</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="modalite_reglement_charges">Modalité charges</Label>
                        <Select
                          value={formData.modalite_reglement_charges}
                          onValueChange={(value) => handleInputChange("modalite_reglement_charges", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Forfait">Forfait</SelectItem>
                            <SelectItem value="Provisions avec régularisation">
                              Provisions avec régularisation
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Étape 5: Durée */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date_prise_effet">Date de prise d'effet *</Label>
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
                      <Label htmlFor="usage_prevu">Usage prévu</Label>
                      <Select
                        value={formData.usage_prevu}
                        onValueChange={(value) => handleInputChange("usage_prevu", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Résidence principale">Résidence principale</SelectItem>
                          <SelectItem value="Résidence secondaire">Résidence secondaire</SelectItem>
                          <SelectItem value="Logement étudiant">Logement étudiant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
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
                )}

                {/* Étape 6: Documents */}
                {currentStep === 6 && (
                  <LeaseDocumentsManager
                    formData={formData}
                    onDocumentsChange={(documents) => handleInputChange("documents", documents)}
                    onAnnexesChange={(annexes) => {
                      Object.entries(annexes).forEach(([key, value]) => {
                        handleInputChange(key as keyof LeaseFormData, value)
                      })
                    }}
                  />
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Précédent
                </Button>
                <div className="flex gap-2">
                  {currentStep < 6 ? (
                    <Button onClick={nextStep} disabled={!validateStep(currentStep)}>
                      Suivant
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button onClick={handleSubmit} disabled={saving} className="bg-green-600 hover:bg-green-700">
                      {saving ? "Création..." : "Créer le bail"}
                      <CheckCircle className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          </div>

          {/* Panneau latéral avec preview en temps réel */}
          <div className="space-y-6">
            {/* Résumé */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Résumé</CardTitle>
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
              </CardContent>
            </Card>

            {/* Aperçu en temps réel */}
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Eye className="h-4 w-4" />
                  Aperçu du contrat
                  <div className="ml-auto flex items-center gap-2">
                    <Switch checked={showPreview} onCheckedChange={setShowPreview} size="sm" />
                    {showPreview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {showPreview && formData.property_id && formData.tenant_id ? (
                  <div
                    className="text-xs space-y-3 max-h-96 overflow-y-auto border rounded p-3 bg-white"
                    dangerouslySetInnerHTML={{ __html: previewContent }}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      {!formData.property_id || !formData.tenant_id
                        ? "Sélectionnez un bien et un locataire pour voir l'aperçu"
                        : "Activez l'aperçu pour voir le contrat"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
