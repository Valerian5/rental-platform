"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  Eye,
  User,
  Home,
  Euro,
  Clock,
  FileCheck,
  EyeOff,
  X,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { authService } from "@/lib/auth-service"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { LeaseDocumentsManager } from "@/components/lease-documents-manager"

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

  // Mandataire
  mandataire_represente: boolean
  mandataire_nom: string
  mandataire_adresse: string
  mandataire_activite: string
  mandataire_carte_pro: string
  mandataire_garant_nom: string
  mandataire_garant_adresse: string

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
  complement_loyer_justification: string

  // Charges
  type_charges: string // provisions/periodique/forfait/aucune
  montant_provisions_charges: number | string
  modalite_reglement_charges: string
  modalites_revision_forfait: string

  // Assurance colocataires
  assurance_colocataires: boolean
  montant_assurance_colocataires_annuel: number | string
  montant_assurance_colocataires_mensuel: number | string
  frequence_assurance: string

  // Indexation du loyer
  trimestre_reference_irl: string
  date_revision_loyer: string
  date_revision_personnalisee: string
  zone_tendue: boolean
  ancien_locataire_duree: string
  dernier_loyer_ancien: number | string
  date_dernier_loyer: Date | null
  date_revision_dernier_loyer: Date | null

  // Dépenses énergie
  montant_depenses_energie_min: number | string
  montant_depenses_energie_max: number | string
  annee_reference_prix_energie: string

  // Travaux
  travaux_amelioration_montant: number | string
  travaux_amelioration_nature: string
  travaux_majoration_loyer: boolean
  travaux_majoration_nature: string
  travaux_majoration_modalites: string
  travaux_majoration_delai: string
  travaux_majoration_montant: number | string
  travaux_diminution_loyer: boolean
  travaux_diminution_duree: string
  travaux_diminution_modalites: string

  // === ÉCHÉANCES ===
  date_prise_effet: Date | null
  duree_contrat: number | string
  evenement_duree_reduite: string
  date_paiement_loyer: string
  paiement_avance_ou_terme: string
  lieu_paiement: string
  montant_premiere_echeance: number | string

  // === CLAUSES GÉNÉRIQUES ===
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

  // === ANNEXES ===
  annexe_dpe: boolean
  annexe_risques: boolean
  annexe_notice: boolean
  annexe_etat_lieux: boolean
  annexe_reglement: boolean
  annexe_plomb: boolean
  annexe_amiante: boolean
  annexe_electricite_gaz: boolean
  annexe_autorisation: boolean
  annexe_references_loyers: boolean

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

    // Mandataire
    mandataire_represente: false,
    mandataire_nom: "",
    mandataire_adresse: "",
    mandataire_activite: "",
    mandataire_carte_pro: "",
    mandataire_garant_nom: "",
    mandataire_garant_adresse: "",

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
    complement_loyer_justification: "",

    // Charges
    type_charges: "provisions",
    montant_provisions_charges: "",
    modalite_reglement_charges: "Forfait",
    modalites_revision_forfait: "",

    // Assurance colocataires
    assurance_colocataires: false,
    montant_assurance_colocataires_annuel: "",
    montant_assurance_colocataires_mensuel: "",
    frequence_assurance: "mensuel",

    // Indexation du loyer
    trimestre_reference_irl: "",
    date_revision_loyer: "anniversaire",
    date_revision_personnalisee: "",
    zone_tendue: false,
    ancien_locataire_duree: "plus_18_mois",
    dernier_loyer_ancien: "",
    date_dernier_loyer: null,
    date_revision_dernier_loyer: null,

    // Dépenses énergie
    montant_depenses_energie_min: "",
    montant_depenses_energie_max: "",
    annee_reference_prix_energie: new Date().getFullYear().toString(),

    // Travaux
    travaux_amelioration_montant: "",
    travaux_amelioration_nature: "",
    travaux_majoration_loyer: false,
    travaux_majoration_nature: "",
    travaux_majoration_modalites: "",
    travaux_majoration_delai: "",
    travaux_majoration_montant: "",
    travaux_diminution_loyer: false,
    travaux_diminution_duree: "",
    travaux_diminution_modalites: "",

    // === ÉCHÉANCES ===
    date_prise_effet: null,
    duree_contrat: "",
    evenement_duree_reduite: "",
    date_paiement_loyer: "1",
    paiement_avance_ou_terme: "avance",
    lieu_paiement: "Virement bancaire",
    montant_premiere_echeance: "",

    // === CLAUSES GÉNÉRIQUES ===
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

    // === ANNEXES ===
    annexe_dpe: true,
    annexe_risques: true,
    annexe_notice: true,
    annexe_etat_lieux: false,
    annexe_reglement: false,
    annexe_plomb: false,
    annexe_amiante: false,
    annexe_electricite_gaz: false,
    annexe_autorisation: false,
    annexe_references_loyers: false,

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

    // Récupérer les infos détaillées du propriétaire et locataire
    let ownerProfile = null
    let tenantProfile = null

    try {
      // Charger le profil du propriétaire
      const ownerResponse = await fetch(`/api/users/${currentUser.id}`)
      if (ownerResponse.ok) {
        const ownerData = await ownerResponse.json()
        ownerProfile = ownerData.user
      }

      // Charger le profil du locataire
      const tenantResponse = await fetch(`/api/users/${tenant.id}`)
      if (tenantResponse.ok) {
        const tenantData = await tenantResponse.json()
        tenantProfile = tenantData.user
      }
    } catch (error) {
      console.error("Erreur chargement profils:", error)
    }

    setFormData((prev) => ({
      ...prev,
      // Sélection - récupérer depuis les profils
      property_id: app.property_id || "",
      tenant_id: app.tenant_id || "",
      lease_type: property?.furnished ? "furnished" : "unfurnished",
      bail_type: tenantProfile?.rental_type || "single",
      owner_type: ownerProfile?.owner_type || "individual",
      guarantee_type: tenantProfile?.guarantee_type || "guarantor",

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
      locataire_date_naissance: tenant?.birth_date ? new Date(tenant.birth_date) : null,

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
            newData.lease_type = selectedProperty.furnished ? "furnished" : "unfurnished"
          }
        }

        if (field === "tenant_id") {
          const selectedTenant = tenants.find((t) => t.id === value)
          if (selectedTenant) {
            newData.locataire_nom_prenom = `${selectedTenant.first_name || ""} ${selectedTenant.last_name || ""}`.trim()
            newData.locataire_domicile = selectedTenant.address || ""
            newData.locataire_email = selectedTenant.email || ""
            newData.locataire_telephone = selectedTenant.phone || ""
            newData.bail_type = selectedTenant.rental_type || "single"
            newData.guarantee_type = selectedTenant.guarantee_type || "guarantor"
          }
        }

        if (field === "lease_type") {
          newData.duree_contrat = value === "furnished" ? 12 : 36
        }

        // Auto-calcul assurance colocataires
        if (field === "montant_assurance_colocataires_annuel") {
          const annuel = Number.parseFloat(String(value)) || 0
          newData.montant_assurance_colocataires_mensuel = (annuel / 12).toFixed(2)
        }

        if (field === "montant_assurance_colocataires_mensuel") {
          const mensuel = Number.parseFloat(String(value)) || 0
          newData.montant_assurance_colocataires_annuel = (mensuel * 12).toFixed(2)
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

      // Calculer la date de fin
      let endDate = null
      if (formData.date_prise_effet && formData.duree_contrat) {
        const startDate = new Date(formData.date_prise_effet)
        const durationMonths = Number.parseInt(String(formData.duree_contrat))
        endDate = new Date(startDate)
        endDate.setMonth(endDate.getMonth() + durationMonths)
      }

      // Préparer les données pour l'API - CORRECTION DES TYPES
      const leaseData = {
        // Champs de base
        property_id: formData.property_id,
        tenant_id: formData.tenant_id,
        owner_id: user.id,
        start_date: formData.date_prise_effet?.toISOString().split("T")[0],
        end_date: endDate?.toISOString().split("T")[0],
        monthly_rent: formData.montant_loyer_mensuel ? Number.parseFloat(String(formData.montant_loyer_mensuel)) : 0,
        charges: formData.montant_provisions_charges
          ? Number.parseFloat(String(formData.montant_provisions_charges))
          : 0,
        deposit_amount: formData.montant_depot_garantie
          ? Number.parseFloat(String(formData.montant_depot_garantie))
          : 0,
        lease_type: formData.lease_type,
        application_id: applicationId || undefined,

        // TOUS LES CHAMPS DU FORMULAIRE COMPLET
        ...formData,

        // Conversion des dates
        date_prise_effet: formData.date_prise_effet?.toISOString().split("T")[0],
        date_signature: formData.date_signature?.toISOString().split("T")[0],
        locataire_date_naissance: formData.locataire_date_naissance?.toISOString().split("T")[0],
        date_dernier_loyer: formData.date_dernier_loyer?.toISOString().split("T")[0],
        date_revision_dernier_loyer: formData.date_revision_dernier_loyer?.toISOString().split("T")[0],

        // Conversion des nombres
        surface_habitable: formData.surface_habitable ? Number.parseFloat(String(formData.surface_habitable)) : null,
        nombre_pieces: formData.nombre_pieces ? Number.parseInt(String(formData.nombre_pieces)) : null,
        duree_contrat: formData.duree_contrat ? Number.parseInt(String(formData.duree_contrat)) : null,
        montant_loyer_reference: formData.montant_loyer_reference
          ? Number.parseFloat(String(formData.montant_loyer_reference))
          : null,
        montant_loyer_reference_majore: formData.montant_loyer_reference_majore
          ? Number.parseFloat(String(formData.montant_loyer_reference_majore))
          : null,
        complement_loyer: formData.complement_loyer ? Number.parseFloat(String(formData.complement_loyer)) : null,
        montant_assurance_colocataires_annuel: formData.montant_assurance_colocataires_annuel
          ? Number.parseFloat(String(formData.montant_assurance_colocataires_annuel))
          : null,
        montant_assurance_colocataires_mensuel: formData.montant_assurance_colocataires_mensuel
          ? Number.parseFloat(String(formData.montant_assurance_colocataires_mensuel))
          : null,
        dernier_loyer_ancien: formData.dernier_loyer_ancien
          ? Number.parseFloat(String(formData.dernier_loyer_ancien))
          : null,
        montant_depenses_energie_min: formData.montant_depenses_energie_min
          ? Number.parseFloat(String(formData.montant_depenses_energie_min))
          : null,
        montant_depenses_energie_max: formData.montant_depenses_energie_max
          ? Number.parseFloat(String(formData.montant_depenses_energie_max))
          : null,
        travaux_amelioration_montant: formData.travaux_amelioration_montant
          ? Number.parseFloat(String(formData.travaux_amelioration_montant))
          : null,
        travaux_majoration_montant: formData.travaux_majoration_montant
          ? Number.parseFloat(String(formData.travaux_majoration_montant))
          : null,
        montant_premiere_echeance: formData.montant_premiere_echeance
          ? Number.parseFloat(String(formData.montant_premiere_echeance))
          : null,
        honoraires_locataire_visite: formData.honoraires_locataire_visite
          ? Number.parseFloat(String(formData.honoraires_locataire_visite))
          : null,
        plafond_honoraires_locataire: formData.plafond_honoraires_locataire
          ? Number.parseFloat(String(formData.plafond_honoraires_locataire))
          : null,
        honoraires_bailleur_visite: formData.honoraires_bailleur_visite
          ? Number.parseFloat(String(formData.honoraires_bailleur_visite))
          : null,
        honoraires_locataire_etat_lieux: formData.honoraires_locataire_etat_lieux
          ? Number.parseFloat(String(formData.honoraires_locataire_etat_lieux))
          : null,
        plafond_honoraires_etat_lieux: formData.plafond_honoraires_etat_lieux
          ? Number.parseFloat(String(formData.plafond_honoraires_etat_lieux))
          : null,
        honoraires_bailleur_etat_lieux: formData.honoraires_bailleur_etat_lieux
          ? Number.parseFloat(String(formData.honoraires_bailleur_etat_lieux))
          : null,
        honoraires_autres_prestations: formData.honoraires_autres_prestations
          ? Number.parseFloat(String(formData.honoraires_autres_prestations))
          : null,

        // Métadonnées
        metadata: {
          special_conditions: formData.special_conditions,
          documents_count: formData.documents.length,
          form_version: "v6_complete_smartloc_fixed",
          created_from: "new_form_complete_integrated",
          total_fields: Object.keys(formData).length,
          garants_count: formData.garants.length,
          garants: formData.garants,
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
  }, [formData, applicationId, router, user, validateStep])

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

  // Trimestres IRL avec valeurs (exemple)
  const trimestreIRL = [
    { value: "2024-T1", label: "1er trimestre 2024 - 142,95", url: "https://www.insee.fr/fr/statistiques/2015067" },
    { value: "2024-T2", label: "2e trimestre 2024 - 143,47", url: "https://www.insee.fr/fr/statistiques/2015067" },
    { value: "2024-T3", label: "3e trimestre 2024 - 144,01", url: "https://www.insee.fr/fr/statistiques/2015067" },
    { value: "2024-T4", label: "4e trimestre 2024 - 144,53", url: "https://www.insee.fr/fr/statistiques/2015067" },
  ]

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
                        <p className="text-xs text-muted-foreground mt-1">Récupéré depuis l'annonce du bien</p>
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
                        <p className="text-xs text-muted-foreground mt-1">
                          Récupéré depuis le dossier de location du locataire
                        </p>
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
                        <p className="text-xs text-muted-foreground mt-1">Récupéré depuis votre profil propriétaire</p>
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
                        <p className="text-xs text-muted-foreground mt-1">
                          Récupéré depuis le dossier de location du locataire
                        </p>
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

                      {/* Mandataire */}
                      <div className="mt-6">
                        <div className="flex items-center space-x-2 mb-4">
                          <Switch
                            id="mandataire_represente"
                            checked={formData.mandataire_represente}
                            onCheckedChange={(checked) => handleInputChange("mandataire_represente", checked)}
                          />
                          <Label htmlFor="mandataire_represente">
                            Propriétaire représenté par un mandataire pour la signature
                          </Label>
                        </div>

                        {formData.mandataire_represente && (
                          <div className="border-l-4 border-blue-500 pl-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="mandataire_nom">Nom ou raison sociale du mandataire</Label>
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
                            <div>
                              <Label htmlFor="mandataire_adresse">Adresse du mandataire</Label>
                              <Textarea
                                id="mandataire_adresse"
                                value={formData.mandataire_adresse}
                                onChange={(e) => handleInputChange("mandataire_adresse", e.target.value)}
                                placeholder="Adresse complète du mandataire"
                                rows={2}
                              />
                            </div>
                            <div>
                              <Label htmlFor="mandataire_carte_pro">
                                Numéro et lieu de délivrance carte professionnelle
                              </Label>
                              <Input
                                id="mandataire_carte_pro"
                                value={formData.mandataire_carte_pro}
                                onChange={(e) => handleInputChange("mandataire_carte_pro", e.target.value)}
                                placeholder="Numéro et lieu de délivrance"
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="mandataire_garant_nom">Nom du garant du mandataire</Label>
                                <Input
                                  id="mandataire_garant_nom"
                                  value={formData.mandataire_garant_nom}
                                  onChange={(e) => handleInputChange("mandataire_garant_nom", e.target.value)}
                                  placeholder="Nom du garant"
                                />
                              </div>
                              <div>
                                <Label htmlFor="mandataire_garant_adresse">Adresse du garant du mandataire</Label>
                                <Input
                                  id="mandataire_garant_adresse"
                                  value={formData.mandataire_garant_adresse}
                                  onChange={(e) => handleInputChange("mandataire_garant_adresse", e.target.value)}
                                  placeholder="Adresse du garant"
                                />
                              </div>
                            </div>
                          </div>
                        )}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <div>
                        <Label htmlFor="periode_construction">Période de construction</Label>
                        <Select
                          value={formData.periode_construction}
                          onValueChange={(value) => handleInputChange("periode_construction", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Avant 1949">Avant 1949</SelectItem>
                            <SelectItem value="1949-1974">1949-1974</SelectItem>
                            <SelectItem value="1975-1989">1975-1989</SelectItem>
                            <SelectItem value="1990-2005">1990-2005</SelectItem>
                            <SelectItem value="Après 2005">Après 2005</SelectItem>
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
                      <Label htmlFor="elements_equipements">Éléments d'équipements du logement</Label>
                      <Textarea
                        id="elements_equipements"
                        value={formData.elements_equipements}
                        onChange={(e) => handleInputChange("elements_equipements", e.target.value)}
                        placeholder="Cuisine équipée, salle de bain avec douche, placards..."
                        rows={3}
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
                  </div>
                )}

                {/* Étape 4: Financier */}
                {currentStep === 4 && (
                  <div className="space-y-6">
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

                    <div>
                      <h3 className="text-lg font-medium mb-4">Encadrement des loyers</h3>
                      <div className="flex items-center space-x-2 mb-4">
                        <Switch
                          id="zone_encadree"
                          checked={formData.zone_encadree}
                          onCheckedChange={(checked) => handleInputChange("zone_encadree", checked)}
                        />
                        <Label htmlFor="zone_encadree">Le logement est situé en zone d'encadrement des loyers</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open("https://www.service-public.fr/particuliers/vosdroits/F1314", "_blank")
                          }
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>

                      {formData.zone_encadree && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-l-4 border-blue-500 pl-4">
                          <div>
                            <Label htmlFor="montant_loyer_reference">Loyer de référence (€/m²)</Label>
                            <Input
                              id="montant_loyer_reference"
                              type="number"
                              step="0.01"
                              value={formData.montant_loyer_reference}
                              onChange={(e) => handleInputChange("montant_loyer_reference", e.target.value)}
                              placeholder="20.00"
                            />
                          </div>
                          <div>
                            <Label htmlFor="montant_loyer_reference_majore">Loyer de référence majoré (€/m²)</Label>
                            <Input
                              id="montant_loyer_reference_majore"
                              type="number"
                              step="0.01"
                              value={formData.montant_loyer_reference_majore}
                              onChange={(e) => handleInputChange("montant_loyer_reference_majore", e.target.value)}
                              placeholder="24.00"
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
                              placeholder="50.00"
                            />
                          </div>
                          {formData.complement_loyer && (
                            <div className="md:col-span-3">
                              <Label htmlFor="complement_loyer_justification">
                                Justification du complément de loyer
                              </Label>
                              <Textarea
                                id="complement_loyer_justification"
                                value={formData.complement_loyer_justification}
                                onChange={(e) => handleInputChange("complement_loyer_justification", e.target.value)}
                                placeholder="Caractéristiques exceptionnelles du logement justifiant le complément..."
                                rows={2}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-4">Charges</h3>
                      <div className="space-y-4">
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

                        {formData.type_charges !== "aucune" && (
                          <div>
                            <Label htmlFor="montant_provisions_charges">Montant mensuel des charges (€)</Label>
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
                          <div>
                            <Label htmlFor="modalites_revision_forfait">
                              Modalité de révision du forfait de charges
                            </Label>
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

                        {/* Assurance colocataires */}
                        {formData.bail_type === "couple" && (
                          <div className="border-t pt-4">
                            <div className="flex items-center space-x-2 mb-4">
                              <Switch
                                id="assurance_colocataires"
                                checked={formData.assurance_colocataires}
                                onCheckedChange={(checked) => handleInputChange("assurance_colocataires", checked)}
                              />
                              <Label htmlFor="assurance_colocataires">
                                Le bailleur souscrit une assurance pour le compte des colocataires
                              </Label>
                            </div>

                            {formData.assurance_colocataires && (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <Label htmlFor="montant_assurance_colocataires_annuel">
                                    Montant récupérable (€/an)
                                  </Label>
                                  <Input
                                    id="montant_assurance_colocataires_annuel"
                                    type="number"
                                    step="0.01"
                                    value={formData.montant_assurance_colocataires_annuel}
                                    onChange={(e) =>
                                      handleInputChange("montant_assurance_colocataires_annuel", e.target.value)
                                    }
                                    placeholder="120.00"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="montant_assurance_colocataires_mensuel">
                                    Montant récupérable (€/mois)
                                  </Label>
                                  <Input
                                    id="montant_assurance_colocataires_mensuel"
                                    type="number"
                                    step="0.01"
                                    value={formData.montant_assurance_colocataires_mensuel}
                                    onChange={(e) =>
                                      handleInputChange("montant_assurance_colocataires_mensuel", e.target.value)
                                    }
                                    placeholder="10.00"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="frequence_assurance">Fréquence de paiement</Label>
                                  <Select
                                    value={formData.frequence_assurance}
                                    onValueChange={(value) => handleInputChange("frequence_assurance", value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="mensuel">Mensuellement</SelectItem>
                                      <SelectItem value="annuel">Annuellement</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-4">Indexation du loyer</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="trimestre_reference_irl">Trimestre de référence pour l'IRL</Label>
                          <div className="flex gap-2">
                            <Select
                              value={formData.trimestre_reference_irl}
                              onValueChange={(value) => handleInputChange("trimestre_reference_irl", value)}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Sélectionner un trimestre" />
                              </SelectTrigger>
                              <SelectContent>
                                {trimestreIRL.map((trimestre) => (
                                  <SelectItem key={trimestre.value} value={trimestre.value}>
                                    {trimestre.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open("https://www.insee.fr/fr/statistiques/2015067", "_blank")}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Lien vers les valeurs d'IRL sur le site de l'INSEE
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="date_revision_loyer">Date de révision du loyer</Label>
                          <Select
                            value={formData.date_revision_loyer}
                            onValueChange={(value) => handleInputChange("date_revision_loyer", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="anniversaire">Date d'anniversaire du bail</SelectItem>
                              <SelectItem value="premier_mois_suivant">1er du mois suivant l'anniversaire</SelectItem>
                              <SelectItem value="autre">Autre date</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {formData.date_revision_loyer === "autre" && (
                          <div>
                            <Label htmlFor="date_revision_personnalisee">Jour et mois de révision</Label>
                            <Input
                              id="date_revision_personnalisee"
                              value={formData.date_revision_personnalisee}
                              onChange={(e) => handleInputChange("date_revision_personnalisee", e.target.value)}
                              placeholder="15 janvier"
                            />
                          </div>
                        )}

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="zone_tendue"
                            checked={formData.zone_tendue}
                            onCheckedChange={(checked) => handleInputChange("zone_tendue", checked)}
                          />
                          <Label htmlFor="zone_tendue">
                            Le logement est en zone tendue (l'évolution du loyer entre 2 locataires est plafonnée à
                            l'IRL)
                          </Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open("https://www.service-public.fr/particuliers/vosdroits/F1314", "_blank")
                            }
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>

                        <div>
                          <Label htmlFor="ancien_locataire_duree">
                            Le précédent locataire a quitté le logement depuis :
                          </Label>
                          <Select
                            value={formData.ancien_locataire_duree}
                            onValueChange={(value) => handleInputChange("ancien_locataire_duree", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="moins_18_mois">Moins de 18 mois</SelectItem>
                              <SelectItem value="plus_18_mois">Plus de 18 mois</SelectItem>
                              <SelectItem value="premiere_location">Première location</SelectItem>
                              <SelectItem value="ne_souhaite_pas">Je ne souhaite pas remplir ce champ</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {formData.ancien_locataire_duree === "moins_18_mois" && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-l-4 border-orange-500 pl-4">
                            <div>
                              <Label htmlFor="dernier_loyer_ancien">
                                Dernier loyer versé par l'ancien locataire (€/mois)
                              </Label>
                              <Input
                                id="dernier_loyer_ancien"
                                type="number"
                                step="0.01"
                                value={formData.dernier_loyer_ancien}
                                onChange={(e) => handleInputChange("dernier_loyer_ancien", e.target.value)}
                                placeholder="800.00"
                              />
                            </div>
                            <div>
                              <Label htmlFor="date_dernier_loyer">Date de versement du dernier loyer</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !formData.date_dernier_loyer && "text-muted-foreground",
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {formData.date_dernier_loyer
                                      ? format(formData.date_dernier_loyer, "dd/MM/yyyy", { locale: fr })
                                      : "Sélectionner"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <Calendar
                                    mode="single"
                                    selected={formData.date_dernier_loyer || undefined}
                                    onSelect={(date) => handleInputChange("date_dernier_loyer", date)}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                            <div>
                              <Label htmlFor="date_revision_dernier_loyer">Date de révision du dernier loyer</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !formData.date_revision_dernier_loyer && "text-muted-foreground",
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {formData.date_revision_dernier_loyer
                                      ? format(formData.date_revision_dernier_loyer, "dd/MM/yyyy", { locale: fr })
                                      : "Sélectionner"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <Calendar
                                    mode="single"
                                    selected={formData.date_revision_dernier_loyer || undefined}
                                    onSelect={(date) => handleInputChange("date_revision_dernier_loyer", date)}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-4">Dépenses d'énergie</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="montant_depenses_energie_min">Montant estimé minimum (€/an)</Label>
                          <Input
                            id="montant_depenses_energie_min"
                            type="number"
                            step="1"
                            value={formData.montant_depenses_energie_min}
                            onChange={(e) => handleInputChange("montant_depenses_energie_min", e.target.value)}
                            placeholder="800"
                          />
                        </div>
                        <div>
                          <Label htmlFor="montant_depenses_energie_max">Montant estimé maximum (€/an)</Label>
                          <Input
                            id="montant_depenses_energie_max"
                            type="number"
                            step="1"
                            value={formData.montant_depenses_energie_max}
                            onChange={(e) => handleInputChange("montant_depenses_energie_max", e.target.value)}
                            placeholder="1000"
                          />
                        </div>
                        <div>
                          <Label htmlFor="annee_reference_prix_energie">Année de référence des prix</Label>
                          <Input
                            id="annee_reference_prix_energie"
                            type="number"
                            value={formData.annee_reference_prix_energie}
                            onChange={(e) => handleInputChange("annee_reference_prix_energie", e.target.value)}
                            placeholder="2024"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-4">Travaux</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="travaux_amelioration_montant">Montant des travaux d'amélioration (€)</Label>
                            <Input
                              id="travaux_amelioration_montant"
                              type="number"
                              step="0.01"
                              value={formData.travaux_amelioration_montant}
                              onChange={(e) => handleInputChange("travaux_amelioration_montant", e.target.value)}
                              placeholder="5000.00"
                            />
                          </div>
                          <div>
                            <Label htmlFor="travaux_amelioration_nature">Nature des travaux d'amélioration</Label>
                            <Input
                              id="travaux_amelioration_nature"
                              value={formData.travaux_amelioration_nature}
                              onChange={(e) => handleInputChange("travaux_amelioration_nature", e.target.value)}
                              placeholder="Rénovation cuisine, salle de bain..."
                            />
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="travaux_majoration_loyer"
                            checked={formData.travaux_majoration_loyer}
                            onCheckedChange={(checked) => handleInputChange("travaux_majoration_loyer", checked)}
                          />
                          <Label htmlFor="travaux_majoration_loyer">
                            Majoration du loyer en cours de bail consécutive à des travaux d'amélioration
                          </Label>
                        </div>

                        {formData.travaux_majoration_loyer && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-l-4 border-green-500 pl-4">
                            <div>
                              <Label htmlFor="travaux_majoration_nature">Nature des travaux</Label>
                              <Input
                                id="travaux_majoration_nature"
                                value={formData.travaux_majoration_nature}
                                onChange={(e) => handleInputChange("travaux_majoration_nature", e.target.value)}
                                placeholder="Description des travaux"
                              />
                            </div>
                            <div>
                              <Label htmlFor="travaux_majoration_modalites">Modalités d'exécution</Label>
                              <Input
                                id="travaux_majoration_modalites"
                                value={formData.travaux_majoration_modalites}
                                onChange={(e) => handleInputChange("travaux_majoration_modalites", e.target.value)}
                                placeholder="Modalités d'exécution"
                              />
                            </div>
                            <div>
                              <Label htmlFor="travaux_majoration_delai">Délai de réalisation</Label>
                              <Input
                                id="travaux_majoration_delai"
                                value={formData.travaux_majoration_delai}
                                onChange={(e) => handleInputChange("travaux_majoration_delai", e.target.value)}
                                placeholder="6 mois"
                              />
                            </div>
                            <div>
                              <Label htmlFor="travaux_majoration_montant">Montant de la majoration (€)</Label>
                              <Input
                                id="travaux_majoration_montant"
                                type="number"
                                step="0.01"
                                value={formData.travaux_majoration_montant}
                                onChange={(e) => handleInputChange("travaux_majoration_montant", e.target.value)}
                                placeholder="50.00"
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="travaux_diminution_loyer"
                            checked={formData.travaux_diminution_loyer}
                            onCheckedChange={(checked) => handleInputChange("travaux_diminution_loyer", checked)}
                          />
                          <Label htmlFor="travaux_diminution_loyer">
                            Diminution de loyer en cours de bail consécutive à des travaux entrepris par le locataire
                          </Label>
                        </div>

                        {formData.travaux_diminution_loyer && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-l-4 border-red-500 pl-4">
                            <div>
                              <Label htmlFor="travaux_diminution_duree">Durée de cette diminution</Label>
                              <Input
                                id="travaux_diminution_duree"
                                value={formData.travaux_diminution_duree}
                                onChange={(e) => handleInputChange("travaux_diminution_duree", e.target.value)}
                                placeholder="3 mois"
                              />
                            </div>
                            <div>
                              <Label htmlFor="travaux_diminution_modalites">Modalités de dédommagement</Label>
                              <Input
                                id="travaux_diminution_modalites"
                                value={formData.travaux_diminution_modalites}
                                onChange={(e) => handleInputChange("travaux_diminution_modalites", e.target.value)}
                                placeholder="En cas de départ anticipé"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Étape 5: Durée et clauses */}
                {currentStep === 5 && (
                  <div className="space-y-6">
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
                            placeholder="36"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {formData.lease_type === "furnished"
                              ? "12 mois minimum pour meublé"
                              : "36 mois minimum pour vide"}
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="evenement_duree_reduite">
                          Événement justifiant une durée réduite (si applicable)
                        </Label>
                        <Textarea
                          id="evenement_duree_reduite"
                          value={formData.evenement_duree_reduite}
                          onChange={(e) => handleInputChange("evenement_duree_reduite", e.target.value)}
                          placeholder="Mutation professionnelle, études..."
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                              <SelectItem value="1">Le 1er de chaque mois</SelectItem>
                              <SelectItem value="5">Le 5 de chaque mois</SelectItem>
                              <SelectItem value="10">Le 10 de chaque mois</SelectItem>
                              <SelectItem value="15">Le 15 de chaque mois</SelectItem>
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
                              <SelectItem value="Espèces">Espèces</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="montant_premiere_echeance">
                          Montant total dû à la première échéance (€) - optionnel
                        </Label>
                        <Input
                          id="montant_premiere_echeance"
                          type="number"
                          step="0.01"
                          value={formData.montant_premiere_echeance}
                          onChange={(e) => handleInputChange("montant_premiere_echeance", e.target.value)}
                          placeholder="950.00"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Somme du loyer, charges, contribution économies et assurance colocataires
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-4">Clauses génériques</h3>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="clause_resolutoire"
                            checked={formData.clause_resolutoire}
                            onCheckedChange={(checked) => handleInputChange("clause_resolutoire", checked)}
                          />
                          <Label htmlFor="clause_resolutoire">Clause résolutoire</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="clause_solidarite"
                            checked={formData.clause_solidarite}
                            onCheckedChange={(checked) => handleInputChange("clause_solidarite", checked)}
                          />
                          <Label htmlFor="clause_solidarite">Clause de solidarité</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="visites_relouer_vendre"
                            checked={formData.visites_relouer_vendre}
                            onCheckedChange={(checked) => handleInputChange("visites_relouer_vendre", checked)}
                          />
                          <Label htmlFor="visites_relouer_vendre">Visites pour relouer ou vendre</Label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <SelectItem value="avec_accord">Avec accord préalable</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {formData.lease_type === "furnished" && (
                          <div>
                            <Label htmlFor="mise_disposition_meubles">Mise à disposition des meubles</Label>
                            <Textarea
                              id="mise_disposition_meubles"
                              value={formData.mise_disposition_meubles}
                              onChange={(e) => handleInputChange("mise_disposition_meubles", e.target.value)}
                              placeholder="Modalités de mise à disposition et d'entretien des meubles..."
                              rows={2}
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="entretien_appareils">Entretien annuel des appareils</Label>
                            <Select
                              value={formData.entretien_appareils}
                              onValueChange={(value) => handleInputChange("entretien_appareils", value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="locataire">À la charge du locataire</SelectItem>
                                <SelectItem value="bailleur">À la charge du bailleur</SelectItem>
                                <SelectItem value="partage">Partagé</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="degradations_locataire">Dégradations du locataire</Label>
                            <Select
                              value={formData.degradations_locataire}
                              onValueChange={(value) => handleInputChange("degradations_locataire", value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="reparation">Réparation à la charge du locataire</SelectItem>
                                <SelectItem value="retenue_depot">Retenue sur dépôt de garantie</SelectItem>
                                <SelectItem value="expertise">Expertise contradictoire</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>

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
                            <p className="text-xs text-muted-foreground">Visites, dossier, bail</p>
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
                            <p className="text-xs text-muted-foreground">Visites, dossier, bail</p>
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
                            <p className="text-xs text-muted-foreground">Visites, dossier, bail</p>
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-l-4 border-green-500 pl-4">
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
                          <div>
                            <Label htmlFor="honoraires_bailleur_etat_lieux">
                              Honoraires bailleur état des lieux (€)
                            </Label>
                            <Input
                              id="honoraires_bailleur_etat_lieux"
                              type="number"
                              step="0.01"
                              value={formData.honoraires_bailleur_etat_lieux}
                              onChange={(e) => handleInputChange("honoraires_bailleur_etat_lieux", e.target.value)}
                              placeholder="100.00"
                            />
                          </div>
                        </div>
                      )}

                      <div className="mt-4">
                        <Label htmlFor="autres_prestations">Autres prestations facturées au bailleur</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Textarea
                            id="autres_prestations"
                            value={formData.autres_prestations}
                            onChange={(e) => handleInputChange("autres_prestations", e.target.value)}
                            placeholder="Détails des prestations..."
                            rows={2}
                          />
                          <div>
                            <Label htmlFor="honoraires_autres_prestations">Honoraires autres prestations (€)</Label>
                            <Input
                              id="honoraires_autres_prestations"
                              type="number"
                              step="0.01"
                              value={formData.honoraires_autres_prestations}
                              onChange={(e) => handleInputChange("honoraires_autres_prestations", e.target.value)}
                              placeholder="50.00"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

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
                        <div>
                          <Label htmlFor="travaux_locataire_cours">Travaux locataire en cours de bail</Label>
                          <Textarea
                            id="travaux_locataire_cours"
                            value={formData.travaux_locataire_cours}
                            onChange={(e) => handleInputChange("travaux_locataire_cours", e.target.value)}
                            placeholder="Travaux autorisés pour le locataire..."
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label htmlFor="travaux_entre_locataires">Travaux entre deux locataires</Label>
                          <Textarea
                            id="travaux_entre_locataires"
                            value={formData.travaux_entre_locataires}
                            onChange={(e) => handleInputChange("travaux_entre_locataires", e.target.value)}
                            placeholder="Travaux effectués entre deux locations..."
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Étape 6: Documents et finalisation */}
                {currentStep === 6 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Garants</h3>
                      {formData.garants.length > 0 ? (
                        <div className="space-y-4">
                          {formData.garants.map((garant, index) => (
                            <Card key={index}>
                              <CardContent className="pt-4">
                                <div className="flex justify-between items-start mb-4">
                                  <h4 className="font-medium">Garant {index + 1}</h4>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeGarant(index)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label>Prénom du garant</Label>
                                    <Input
                                      value={garant.prenom}
                                      onChange={(e) => updateGarant(index, "prenom", e.target.value)}
                                      placeholder="Jean"
                                    />
                                  </div>
                                  <div>
                                    <Label>Nom du garant</Label>
                                    <Input
                                      value={garant.nom}
                                      onChange={(e) => updateGarant(index, "nom", e.target.value)}
                                      placeholder="Dupont"
                                    />
                                  </div>
                                  <div className="md:col-span-2">
                                    <Label>Adresse du garant</Label>
                                    <Input
                                      value={garant.adresse}
                                      onChange={(e) => updateGarant(index, "adresse", e.target.value)}
                                      placeholder="123 rue de la Paix, 75001 Paris"
                                    />
                                  </div>
                                  <div>
                                    <Label>Date de fin d'engagement</Label>
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
                                  <div>
                                    <Label>Montant maximum d'engagement (€)</Label>
                                    <Input
                                      type="number"
                                      value={garant.montant_max_engagement}
                                      onChange={(e) => updateGarant(index, "montant_max_engagement", e.target.value)}
                                      placeholder="5000"
                                    />
                                  </div>
                                  <div className="md:col-span-2">
                                    <Label>Le garant se porte caution pour</Label>
                                    <Input
                                      value={garant.pour_locataire}
                                      onChange={(e) => updateGarant(index, "pour_locataire", e.target.value)}
                                      placeholder="Nom du locataire"
                                    />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Aucun garant ajouté</p>
                      )}
                      <Button variant="outline" onClick={addGarant} className="mt-4 bg-transparent">
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter un garant
                      </Button>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-4">Annexes obligatoires</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="annexe_dpe"
                            checked={formData.annexe_dpe}
                            onCheckedChange={(checked) => handleInputChange("annexe_dpe", checked)}
                          />
                          <Label htmlFor="annexe_dpe">Diagnostic de performance énergétique (DPE)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="annexe_risques"
                            checked={formData.annexe_risques}
                            onCheckedChange={(checked) => handleInputChange("annexe_risques", checked)}
                          />
                          <Label htmlFor="annexe_risques">État des risques et pollutions</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="annexe_notice"
                            checked={formData.annexe_notice}
                            onCheckedChange={(checked) => handleInputChange("annexe_notice", checked)}
                          />
                          <Label htmlFor="annexe_notice">Notice d'information</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="annexe_etat_lieux"
                            checked={formData.annexe_etat_lieux}
                            onCheckedChange={(checked) => handleInputChange("annexe_etat_lieux", checked)}
                          />
                          <Label htmlFor="annexe_etat_lieux">État des lieux d'entrée</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="annexe_reglement"
                            checked={formData.annexe_reglement}
                            onCheckedChange={(checked) => handleInputChange("annexe_reglement", checked)}
                          />
                          <Label htmlFor="annexe_reglement">Règlement de copropriété</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="annexe_plomb"
                            checked={formData.annexe_plomb}
                            onCheckedChange={(checked) => handleInputChange("annexe_plomb", checked)}
                          />
                          <Label htmlFor="annexe_plomb">Constat de risque d'exposition au plomb</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="annexe_amiante"
                            checked={formData.annexe_amiante}
                            onCheckedChange={(checked) => handleInputChange("annexe_amiante", checked)}
                          />
                          <Label htmlFor="annexe_amiante">État amiante</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="annexe_electricite_gaz"
                            checked={formData.annexe_electricite_gaz}
                            onCheckedChange={(checked) => handleInputChange("annexe_electricite_gaz", checked)}
                          />
                          <Label htmlFor="annexe_electricite_gaz">État installation électricité/gaz</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="annexe_autorisation"
                            checked={formData.annexe_autorisation}
                            onCheckedChange={(checked) => handleInputChange("annexe_autorisation", checked)}
                          />
                          <Label htmlFor="annexe_autorisation">Autorisation préalable de mise en location</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="annexe_references_loyers"
                            checked={formData.annexe_references_loyers}
                            onCheckedChange={(checked) => handleInputChange("annexe_references_loyers", checked)}
                          />
                          <Label htmlFor="annexe_references_loyers">Références aux loyers du voisinage</Label>
                        </div>
                      </div>
                    </div>

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
                    </div>

                    <div>
                      <Label htmlFor="special_conditions">Conditions particulières</Label>
                      <Textarea
                        id="special_conditions"
                        value={formData.special_conditions}
                        onChange={(e) => handleInputChange("special_conditions", e.target.value)}
                        placeholder="Conditions particulières spécifiques à ce bail..."
                        rows={4}
                      />
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-4">Documents</h3>
                      <LeaseDocumentsManager
                        documents={formData.documents}
                        onDocumentsChange={(docs) => handleInputChange("documents", docs)}
                      />
                    </div>
                  </div>
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
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Création...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Créer le bail
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          </div>

          {/* Panneau de prévisualisation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Aperçu du bail
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-muted-foreground"
                  >
                    {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </CardTitle>
              </CardHeader>
              {showPreview && (
                <CardContent className="max-h-[600px] overflow-y-auto">
                  {previewContent ? (
                    <div
                      className="prose prose-sm max-w-none text-xs"
                      dangerouslySetInnerHTML={{ __html: previewContent }}
                    />
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>L'aperçu s'affichera une fois les informations de base renseignées</p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}