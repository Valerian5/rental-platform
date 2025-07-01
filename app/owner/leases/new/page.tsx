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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
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
  Info,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { authService } from "@/lib/auth-service"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"

interface LeaseClause {
  id: string
  name: string
  category: string
  clause_text: string
  is_default: boolean
  is_active: boolean
}

interface LeaseFormData {
  // === SÉLECTION DE BASE ===
  property_id: string
  tenant_id: string
  lease_type: string // furnished/unfurnished
  bail_type: string // single/couple/colocation/room
  owner_type: string // individual/sci/company
  guarantee_type: string // guarantor/insurance/visale/none

  // === PARTIES - BAILLEUR ===
  // Personne physique
  bailleur_nom_prenom: string
  bailleur_email: string
  bailleur_telephone: string
  bailleur_adresse: string

  // Mandataire
  mandataire_represente: boolean
  mandataire_nom: string
  mandataire_adresse: string
  mandataire_activite: string
  mandataire_carte_pro: string
  mandataire_garant_nom: string
  mandataire_garant_adresse: string

  // SCI Familiale
  sci_denomination: string
  sci_mandataire_nom: string
  sci_mandataire_adresse: string
  sci_mandataire_activite: string
  sci_mandataire_carte_pro: string

  // Autre personne morale
  personne_morale_denomination: string
  personne_morale_mandataire_nom: string
  personne_morale_mandataire_adresse: string
  personne_morale_mandataire_activite: string
  personne_morale_mandataire_carte_pro: string

  // === PARTIES - LOCATAIRE ===
  locataires: Array<{
    prenom: string
    nom: string
    email: string
    date_naissance: Date | null
  }>

  // === LOGEMENT DÉTAILLÉ ===
  nombre_pieces: number | string
  surface_habitable: number | string
  adresse_logement: string
  complement_adresse: string
  periode_construction: string
  performance_dpe: string
  type_habitat: string // immeuble_collectif/individuel
  regime_juridique: string // monopropriete/copropriete
  destination_locaux: string // usage_habitation/usage_mixte
  production_chauffage: string // individuel/collectif
  production_eau_chaude: string // individuelle/collective

  // Autres parties du logement
  autres_parties: string[] // grenier, comble_amenage, etc.
  equipements_logement: string[] // installations_sanitaires, cuisine_equipee, autres
  equipements_privatifs: string[] // cave, parking, garage, autres
  equipements_communs: string[] // ascenseur, garage_velo, etc.
  equipements_technologies: string[] // tv, internet, fibre

  identifiant_fiscal: string

  // === FINANCIER ===
  loyer_mensuel: number | string
  depot_garantie: number | string

  // Zone encadrée
  zone_encadree: boolean
  loyer_reference: number | string
  loyer_reference_majore: number | string
  complement_loyer: number | string
  complement_loyer_justification: string

  zone_tendue: boolean

  // Charges
  type_charges: string // provisions/periodique/forfait/absence
  montant_charges: number | string
  modalite_revision_forfait: string

  // Assurance colocataires
  assurance_colocataires: boolean
  assurance_montant: number | string
  assurance_frequence: string // annuel/mensuel

  // Indexation
  trimestre_reference_irl: string
  date_revision_loyer: string // anniversaire/premier_mois/autre
  date_revision_personnalisee: string
  ancien_locataire_duree: string // moins_18_mois/plus_18_mois/premiere_location
  dernier_loyer_ancien: number | string
  date_dernier_loyer: Date | null
  date_revision_dernier_loyer: Date | null

  // Dépenses énergie
  estimation_depenses_energie_min: number | string
  estimation_depenses_energie_max: number | string
  annee_reference_energie: string

  // === DURÉE ===
  date_entree: Date | null
  duree_contrat: number | string
  contrat_duree_reduite: boolean
  raison_duree_reduite: string
  jour_paiement_loyer: string
  paiement_avance: boolean // true=avance, false=terme_echu

  // === CLAUSES ===
  // Clauses génériques
  clause_resolutoire: boolean
  clause_solidarite: boolean
  visites_relouer_vendre: boolean
  mode_paiement_loyer: string
  mise_disposition_meubles: string

  // Clauses sélectionnables
  clause_animaux_domestiques_id: string
  clause_entretien_appareils_id: string
  clause_degradations_locataire_id: string
  clause_travaux_bailleur_id: string
  clause_travaux_locataire_id: string
  clause_travaux_entre_locataires_id: string

  // Clauses optionnelles
  honoraires_professionnel: boolean
  honoraires_locataire_visite: number | string
  plafond_honoraires_locataire: number | string
  honoraires_bailleur_visite: number | string
  etat_lieux_professionnel: boolean
  honoraires_locataire_etat_lieux: number | string
  plafond_honoraires_etat_lieux: number | string
  honoraires_bailleur_etat_lieux: number | string
  autres_prestations: boolean
  details_autres_prestations: string
  honoraires_autres_prestations: number | string

  franchise_loyer: string
  clause_libre: string

  // === GARANTS ===
  garants: Array<{
    prenom: string
    nom: string
    adresse: string
    date_fin_engagement: Date | null
    montant_max_engagement: number | string
    pour_locataire: string
  }>

  // === ANNEXES ===
  annexe_surface_habitable: boolean
  annexe_dpe: boolean
  annexe_plomb: boolean
  annexe_amiante: boolean
  annexe_electricite: boolean
  annexe_gaz: boolean
  annexe_erp: boolean
  annexe_bruit: boolean
  annexe_autres: boolean

  // Documents gérés par admin
  annexe_etat_lieux: boolean
  annexe_notice_information: boolean
  annexe_inventaire_meubles: boolean
  annexe_liste_charges: boolean
  annexe_reparations_locatives: boolean
  annexe_grille_vetuste: boolean
  annexe_bail_parking: boolean
  annexe_actes_caution: boolean

  // === MÉTADONNÉES ===
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
  const [leaseClauses, setLeaseClauses] = useState<LeaseClause[]>([])

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
    bailleur_email: "",
    bailleur_telephone: "",
    bailleur_adresse: "",

    mandataire_represente: false,
    mandataire_nom: "",
    mandataire_adresse: "",
    mandataire_activite: "",
    mandataire_carte_pro: "",
    mandataire_garant_nom: "",
    mandataire_garant_adresse: "",

    sci_denomination: "",
    sci_mandataire_nom: "",
    sci_mandataire_adresse: "",
    sci_mandataire_activite: "",
    sci_mandataire_carte_pro: "",

    personne_morale_denomination: "",
    personne_morale_mandataire_nom: "",
    personne_morale_mandataire_adresse: "",
    personne_morale_mandataire_activite: "",
    personne_morale_mandataire_carte_pro: "",

    // === PARTIES - LOCATAIRE ===
    locataires: [],

    // === LOGEMENT DÉTAILLÉ ===
    nombre_pieces: "",
    surface_habitable: "",
    adresse_logement: "",
    complement_adresse: "",
    periode_construction: "Après 1949",
    performance_dpe: "D",
    type_habitat: "immeuble_collectif",
    regime_juridique: "copropriete",
    destination_locaux: "usage_habitation",
    production_chauffage: "individuel",
    production_eau_chaude: "individuelle",

    autres_parties: [],
    equipements_logement: [],
    equipements_privatifs: [],
    equipements_communs: [],
    equipements_technologies: [],

    identifiant_fiscal: "",

    // === FINANCIER ===
    loyer_mensuel: "",
    depot_garantie: "",

    zone_encadree: false,
    loyer_reference: "",
    loyer_reference_majore: "",
    complement_loyer: "",
    complement_loyer_justification: "",

    zone_tendue: false,

    type_charges: "provisions",
    montant_charges: "",
    modalite_revision_forfait: "",

    assurance_colocataires: false,
    assurance_montant: "",
    assurance_frequence: "annuel",

    trimestre_reference_irl: "",
    date_revision_loyer: "anniversaire",
    date_revision_personnalisee: "",
    ancien_locataire_duree: "plus_18_mois",
    dernier_loyer_ancien: "",
    date_dernier_loyer: null,
    date_revision_dernier_loyer: null,

    estimation_depenses_energie_min: "",
    estimation_depenses_energie_max: "",
    annee_reference_energie: new Date().getFullYear().toString(),

    // === DURÉE ===
    date_entree: null,
    duree_contrat: "",
    contrat_duree_reduite: false,
    raison_duree_reduite: "",
    jour_paiement_loyer: "1",
    paiement_avance: true,

    // === CLAUSES ===
    clause_resolutoire: true,
    clause_solidarite: true,
    visites_relouer_vendre: true,
    mode_paiement_loyer: "virement",
    mise_disposition_meubles: "",

    clause_animaux_domestiques_id: "",
    clause_entretien_appareils_id: "",
    clause_degradations_locataire_id: "",
    clause_travaux_bailleur_id: "",
    clause_travaux_locataire_id: "",
    clause_travaux_entre_locataires_id: "",

    honoraires_professionnel: false,
    honoraires_locataire_visite: "",
    plafond_honoraires_locataire: "",
    honoraires_bailleur_visite: "",
    etat_lieux_professionnel: false,
    honoraires_locataire_etat_lieux: "",
    plafond_honoraires_etat_lieux: "",
    honoraires_bailleur_etat_lieux: "",
    autres_prestations: false,
    details_autres_prestations: "",
    honoraires_autres_prestations: "",

    franchise_loyer: "",
    clause_libre: "",

    // === GARANTS ===
    garants: [],

    // === ANNEXES ===
    annexe_surface_habitable: true,
    annexe_dpe: true,
    annexe_plomb: false,
    annexe_amiante: false,
    annexe_electricite: false,
    annexe_gaz: false,
    annexe_erp: true,
    annexe_bruit: false,
    annexe_autres: false,

    annexe_etat_lieux: true,
    annexe_notice_information: true,
    annexe_inventaire_meubles: false,
    annexe_liste_charges: true,
    annexe_reparations_locatives: true,
    annexe_grille_vetuste: false,
    annexe_bail_parking: false,
    annexe_actes_caution: false,

    // === MÉTADONNÉES ===
    documents: [],
  })

  // Options pour les sélections multiples
  const autresPartiesOptions = [
    { value: "grenier", label: "Grenier" },
    { value: "comble_amenage", label: "Comble aménagé" },
    { value: "comble_non_amenage", label: "Comble non aménagé" },
    { value: "terrasse", label: "Terrasse" },
    { value: "balcon", label: "Balcon" },
    { value: "loggia", label: "Loggia" },
    { value: "jardin", label: "Jardin" },
  ]

  const equipementsLogementOptions = [
    { value: "installations_sanitaires", label: "Installations Sanitaires" },
    { value: "cuisine_equipee", label: "Cuisine équipée" },
    { value: "autres", label: "Autres" },
  ]

  const equipementsPrivatifsOptions = [
    { value: "cave", label: "Cave" },
    { value: "parking", label: "Parking" },
    { value: "garage", label: "Garage" },
    { value: "autres", label: "Autres" },
  ]

  const equipementsCommunsOptions = [
    { value: "ascenseur", label: "Ascenseur" },
    { value: "garage_velo", label: "Garage à vélo" },
    { value: "jardin_commun", label: "Jardin commun" },
    { value: "local_poubelle", label: "Local poubelle" },
    { value: "autres", label: "Autres" },
  ]

  const equipementsTechnologiesOptions = [
    { value: "tv", label: "Raccordement TV" },
    { value: "internet", label: "Raccordement Internet" },
    { value: "fibre", label: "Raccordement fibre optique" },
  ]

  // Trimestres IRL avec valeurs réelles
  const trimestreIRLOptions = [
    { value: "2024-T1", label: "1er trimestre 2024 - 142,95" },
    { value: "2024-T2", label: "2e trimestre 2024 - 143,47" },
    { value: "2024-T3", label: "3e trimestre 2024 - 144,01" },
    { value: "2024-T4", label: "4e trimestre 2024 - 144,53" },
  ]

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

      // Charger les clauses de bail
      const clausesResponse = await fetch("/api/lease-clauses")
      if (clausesResponse.ok) {
        const clausesData = await clausesResponse.json()
        setLeaseClauses(clausesData.clauses || [])

        // Définir les clauses par défaut
        const defaultClauses = clausesData.clauses?.filter((c: LeaseClause) => c.is_default && c.is_active) || []

        setFormData((prev) => ({
          ...prev,
          clause_animaux_domestiques_id:
            defaultClauses.find((c: LeaseClause) => c.category === "animaux_domestiques")?.id || "",
          clause_entretien_appareils_id:
            defaultClauses.find((c: LeaseClause) => c.category === "entretien_appareils")?.id || "",
          clause_degradations_locataire_id:
            defaultClauses.find((c: LeaseClause) => c.category === "degradations_locataire")?.id || "",
          clause_travaux_bailleur_id:
            defaultClauses.find((c: LeaseClause) => c.category === "travaux_bailleur")?.id || "",
          clause_travaux_locataire_id:
            defaultClauses.find((c: LeaseClause) => c.category === "travaux_locataire")?.id || "",
          clause_travaux_entre_locataires_id:
            defaultClauses.find((c: LeaseClause) => c.category === "travaux_entre_locataires")?.id || "",
        }))
      }

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
      property_id: app.property_id || "",
      tenant_id: app.tenant_id || "",
      lease_type: property?.furnished ? "furnished" : "unfurnished",

      // Bailleur
      bailleur_nom_prenom: `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim(),
      bailleur_email: currentUser.email || "",
      bailleur_telephone: currentUser.phone || "",
      bailleur_adresse: currentUser.address || "",

      // Locataires
      locataires: tenant
        ? [
            {
              prenom: tenant.first_name || "",
              nom: tenant.last_name || "",
              email: tenant.email || "",
              date_naissance: tenant.birth_date ? new Date(tenant.birth_date) : null,
            },
          ]
        : [],

      // Logement
      nombre_pieces: property?.rooms || "",
      surface_habitable: property?.surface || "",
      adresse_logement: property?.address || "",
      complement_adresse: property?.complement_address || "",

      // Financier
      loyer_mensuel: property?.price || "",
      montant_charges: property?.charges_amount || "0",
      depot_garantie: property?.security_deposit || property?.price || "",

      // Durée
      duree_contrat: prev.lease_type === "furnished" ? 12 : 36,
    }))

    if (tenant) {
      setTenants([tenant])
    }
  }

  const handleInputChange = useCallback(
    (field: keyof LeaseFormData, value: any) => {
      setFormData((prev) => {
        const newData = { ...prev, [field]: value }

        // Auto-calculs et logique métier
        if (field === "property_id") {
          const selectedProperty = properties.find((p) => p.id === value)
          if (selectedProperty) {
            newData.adresse_logement = selectedProperty.address || ""
            newData.complement_adresse = selectedProperty.complement_address || ""
            newData.nombre_pieces = selectedProperty.rooms || ""
            newData.surface_habitable = selectedProperty.surface || ""
            newData.loyer_mensuel = selectedProperty.price || ""
            newData.montant_charges = selectedProperty.charges_amount || "0"
            newData.depot_garantie = selectedProperty.security_deposit || selectedProperty.price || ""
            newData.lease_type = selectedProperty.furnished ? "furnished" : "unfurnished"
          }
        }

        if (field === "tenant_id") {
          const selectedTenant = tenants.find((t) => t.id === value)
          if (selectedTenant) {
            newData.locataires = [
              {
                prenom: selectedTenant.first_name || "",
                nom: selectedTenant.last_name || "",
                email: selectedTenant.email || "",
                date_naissance: selectedTenant.birth_date ? new Date(selectedTenant.birth_date) : null,
              },
            ]
          }
        }

        if (field === "lease_type") {
          newData.duree_contrat = value === "furnished" ? 12 : 36
          // Ajuster les annexes selon le type
          if (value === "furnished") {
            newData.annexe_inventaire_meubles = true
          }
        }

        if (field === "owner_type") {
          // Réinitialiser les champs selon le type de propriétaire
          if (value === "individual") {
            newData.sci_denomination = ""
            newData.personne_morale_denomination = ""
          }
        }

        return newData
      })
    },
    [properties, tenants],
  )

  const handleMultiSelectChange = (field: keyof LeaseFormData, value: string, checked: boolean) => {
    setFormData((prev) => {
      const currentValues = (prev[field] as string[]) || []
      let newValues: string[]

      if (checked) {
        newValues = [...currentValues, value]
      } else {
        newValues = currentValues.filter((v) => v !== value)
      }

      return { ...prev, [field]: newValues }
    })
  }

  const addLocataire = () => {
    setFormData((prev) => ({
      ...prev,
      locataires: [
        ...prev.locataires,
        {
          prenom: "",
          nom: "",
          email: "",
          date_naissance: null,
        },
      ],
    }))
  }

  const removeLocataire = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      locataires: prev.locataires.filter((_, i) => i !== index),
    }))
  }

  const updateLocataire = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      locataires: prev.locataires.map((locataire, i) => (i === index ? { ...locataire, [field]: value } : locataire)),
    }))
  }

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
          pour_locataire: prev.locataires[0]?.prenom + " " + prev.locataires[0]?.nom || "",
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

  const validateStep = useCallback(
    (step: number): boolean => {
      switch (step) {
        case 1: // Sélection
          return !!(formData.property_id && formData.tenant_id)
        case 2: // Parties
          if (formData.owner_type === "individual") {
            return !!(formData.bailleur_nom_prenom && formData.bailleur_email)
          } else if (formData.owner_type === "sci") {
            return !!(formData.sci_denomination && formData.sci_mandataire_nom)
          } else if (formData.owner_type === "company") {
            return !!(formData.personne_morale_denomination && formData.personne_morale_mandataire_nom)
          }
          return false
        case 3: // Logement
          return !!(formData.adresse_logement && formData.nombre_pieces && formData.surface_habitable)
        case 4: // Financier
          return !!(formData.loyer_mensuel && formData.depot_garantie)
        case 5: // Durée
          return !!(formData.date_entree && formData.duree_contrat)
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
      for (let step = 1; step <= 5; step++) {
        if (!validateStep(step)) {
          toast.error(`Veuillez compléter l'étape ${step}`)
          setCurrentStep(step)
          return
        }
      }

      // Calculer la date de fin
      let endDate = null
      if (formData.date_entree && formData.duree_contrat) {
        const startDate = new Date(formData.date_entree)
        const durationMonths = Number.parseInt(String(formData.duree_contrat))
        endDate = new Date(startDate)
        endDate.setMonth(endDate.getMonth() + durationMonths)
      }

      // Préparer les données pour l'API
      const leaseData = {
        // Champs de base
        property_id: formData.property_id,
        tenant_id: formData.tenant_id,
        owner_id: user.id,
        start_date: formData.date_entree?.toISOString().split("T")[0],
        end_date: endDate?.toISOString().split("T")[0],
        monthly_rent: formData.loyer_mensuel ? Number.parseFloat(String(formData.loyer_mensuel)) : 0,
        charges: formData.montant_charges ? Number.parseFloat(String(formData.montant_charges)) : 0,
        deposit_amount: formData.depot_garantie ? Number.parseFloat(String(formData.depot_garantie)) : 0,
        lease_type: formData.lease_type,
        application_id: applicationId || undefined,

        // Tous les champs du formulaire
        ...formData,

        // Conversion des dates
        date_entree: formData.date_entree?.toISOString().split("T")[0],
        date_dernier_loyer: formData.date_dernier_loyer?.toISOString().split("T")[0],
        date_revision_dernier_loyer: formData.date_revision_dernier_loyer?.toISOString().split("T")[0],

        // Conversion des nombres
        nombre_pieces: formData.nombre_pieces ? Number.parseInt(String(formData.nombre_pieces)) : null,
        surface_habitable: formData.surface_habitable ? Number.parseFloat(String(formData.surface_habitable)) : null,
        duree_contrat: formData.duree_contrat ? Number.parseInt(String(formData.duree_contrat)) : null,
        loyer_reference: formData.loyer_reference ? Number.parseFloat(String(formData.loyer_reference)) : null,
        loyer_reference_majore: formData.loyer_reference_majore
          ? Number.parseFloat(String(formData.loyer_reference_majore))
          : null,
        complement_loyer: formData.complement_loyer ? Number.parseFloat(String(formData.complement_loyer)) : null,
        assurance_montant: formData.assurance_montant ? Number.parseFloat(String(formData.assurance_montant)) : null,
        dernier_loyer_ancien: formData.dernier_loyer_ancien
          ? Number.parseFloat(String(formData.dernier_loyer_ancien))
          : null,
        estimation_depenses_energie_min: formData.estimation_depenses_energie_min
          ? Number.parseFloat(String(formData.estimation_depenses_energie_min))
          : null,
        estimation_depenses_energie_max: formData.estimation_depenses_energie_max
          ? Number.parseFloat(String(formData.estimation_depenses_energie_max))
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
          form_version: "v9_complete_french_model",
          created_from: "new_form_complete",
          total_fields: Object.keys(formData).length,
          locataires_count: formData.locataires.length,
          garants_count: formData.garants.length,
          locataires: formData.locataires,
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
    { id: 1, title: "Sélection", icon: User, description: "Bien et type de bail" },
    { id: 2, title: "Parties", icon: User, description: "Bailleur et locataires" },
    { id: 3, title: "Logement", icon: Home, description: "Détails du bien" },
    { id: 4, title: "Financier", icon: Euro, description: "Loyer et charges" },
    { id: 5, title: "Durée", icon: Clock, description: "Période et échéances" },
    { id: 6, title: "Clauses", icon: FileCheck, description: "Clauses et annexes" },
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
                      <Label htmlFor="property_id">Bien immobilier *</Label>
                      <Select
                        value={formData.property_id}
                        onValueChange={(value) => handleInputChange("property_id", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un bien" />
                        </SelectTrigger>
                        <SelectContent>
                          {properties.map((property) => (
                            <SelectItem key={property.id} value={property.id}>
                              {property.title} - {property.address}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="tenant_id">Locataire *</Label>
                      <Select
                        value={formData.tenant_id}
                        onValueChange={(value) => handleInputChange("tenant_id", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un locataire" />
                        </SelectTrigger>
                        <SelectContent>
                          {tenants.map((tenant) => (
                            <SelectItem key={tenant.id} value={tenant.id}>
                              {tenant.first_name} {tenant.last_name} - {tenant.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                            <SelectItem value="unfurnished">Vide</SelectItem>
                            <SelectItem value="furnished">Meublée</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="bail_type">Type de bail *</Label>
                        <Select
                          value={formData.bail_type}
                          onValueChange={(value) => handleInputChange("bail_type", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">Locataire seul</SelectItem>
                            <SelectItem value="couple">Couple</SelectItem>
                            <SelectItem value="colocation">Colocation</SelectItem>
                            <SelectItem value="room">Location à la chambre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="owner_type">Qualité du bailleur *</Label>
                        <Select
                          value={formData.owner_type}
                          onValueChange={(value) => handleInputChange("owner_type", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="individual">Personne physique</SelectItem>
                            <SelectItem value="sci">SCI Familiale</SelectItem>
                            <SelectItem value="company">Autre personne morale</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="guarantee_type">Type de garantie *</Label>
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
                  </div>
                )}

                {/* Étape 2: Parties */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    {/* Bailleur - Personne physique */}
                    {formData.owner_type === "individual" && (
                      <div>
                        <h3 className="text-lg font-medium mb-4">Bailleur - Personne physique</h3>
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
                            <Label htmlFor="bailleur_adresse">Adresse</Label>
                            <Input
                              id="bailleur_adresse"
                              value={formData.bailleur_adresse}
                              onChange={(e) => handleInputChange("bailleur_adresse", e.target.value)}
                              placeholder="123 rue de la Paix, 75001 Paris"
                            />
                          </div>
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                              <div>
                                <Label htmlFor="mandataire_nom">Nom du mandataire</Label>
                                <Input
                                  id="mandataire_nom"
                                  value={formData.mandataire_nom}
                                  onChange={(e) => handleInputChange("mandataire_nom", e.target.value)}
                                  placeholder="Marie Martin"
                                />
                              </div>
                              <div>
                                <Label htmlFor="mandataire_adresse">Adresse du mandataire</Label>
                                <Input
                                  id="mandataire_adresse"
                                  value={formData.mandataire_adresse}
                                  onChange={(e) => handleInputChange("mandataire_adresse", e.target.value)}
                                  placeholder="456 avenue des Champs, 75008 Paris"
                                />
                              </div>
                              <div>
                                <Label htmlFor="mandataire_activite">Activité exercée</Label>
                                <Input
                                  id="mandataire_activite"
                                  value={formData.mandataire_activite}
                                  onChange={(e) => handleInputChange("mandataire_activite", e.target.value)}
                                  placeholder="Gestionnaire immobilier"
                                />
                              </div>
                              <div>
                                <Label htmlFor="mandataire_carte_pro">Numéro carte professionnelle</Label>
                                <Input
                                  id="mandataire_carte_pro"
                                  value={formData.mandataire_carte_pro}
                                  onChange={(e) => handleInputChange("mandataire_carte_pro", e.target.value)}
                                  placeholder="CPI 7501 2023 000 000 001"
                                />
                              </div>
                              <div>
                                <Label htmlFor="mandataire_garant_nom">Nom du garant du mandataire</Label>
                                <Input
                                  id="mandataire_garant_nom"
                                  value={formData.mandataire_garant_nom}
                                  onChange={(e) => handleInputChange("mandataire_garant_nom", e.target.value)}
                                  placeholder="Assurance Professionnelle XYZ"
                                />
                              </div>
                              <div>
                                <Label htmlFor="mandataire_garant_adresse">Adresse du garant</Label>
                                <Input
                                  id="mandataire_garant_adresse"
                                  value={formData.mandataire_garant_adresse}
                                  onChange={(e) => handleInputChange("mandataire_garant_adresse", e.target.value)}
                                  placeholder="789 boulevard Haussmann, 75009 Paris"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Bailleur - SCI Familiale */}
                    {formData.owner_type === "sci" && (
                      <div>
                        <h3 className="text-lg font-medium mb-4">Bailleur - SCI Familiale</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="sci_denomination">Dénomination de la SCI *</Label>
                            <Input
                              id="sci_denomination"
                              value={formData.sci_denomination}
                              onChange={(e) => handleInputChange("sci_denomination", e.target.value)}
                              placeholder="SCI Famille Dupont"
                            />
                          </div>
                          <div>
                            <Label htmlFor="sci_mandataire_nom">Mandataire représentant *</Label>
                            <Input
                              id="sci_mandataire_nom"
                              value={formData.sci_mandataire_nom}
                              onChange={(e) => handleInputChange("sci_mandataire_nom", e.target.value)}
                              placeholder="Jean Dupont, Président"
                            />
                          </div>
                          <div>
                            <Label htmlFor="sci_mandataire_adresse">Adresse du mandataire</Label>
                            <Input
                              id="sci_mandataire_adresse"
                              value={formData.sci_mandataire_adresse}
                              onChange={(e) => handleInputChange("sci_mandataire_adresse", e.target.value)}
                              placeholder="123 rue de la Paix, 75001 Paris"
                            />
                          </div>
                          <div>
                            <Label htmlFor="sci_mandataire_activite">Activité exercée</Label>
                            <Input
                              id="sci_mandataire_activite"
                              value={formData.sci_mandataire_activite}
                              onChange={(e) => handleInputChange("sci_mandataire_activite", e.target.value)}
                              placeholder="Président de la SCI"
                            />
                          </div>
                          <div>
                            <Label htmlFor="sci_mandataire_carte_pro">Numéro carte professionnelle</Label>
                            <Input
                              id="sci_mandataire_carte_pro"
                              value={formData.sci_mandataire_carte_pro}
                              onChange={(e) => handleInputChange("sci_mandataire_carte_pro", e.target.value)}
                              placeholder="Si applicable"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bailleur - Autre personne morale */}
                    {formData.owner_type === "company" && (
                      <div>
                        <h3 className="text-lg font-medium mb-4">Bailleur - Autre personne morale</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="personne_morale_denomination">Dénomination de la personne morale *</Label>
                            <Input
                              id="personne_morale_denomination"
                              value={formData.personne_morale_denomination}
                              onChange={(e) => handleInputChange("personne_morale_denomination", e.target.value)}
                              placeholder="SARL Immobilier Plus"
                            />
                          </div>
                          <div>
                            <Label htmlFor="personne_morale_mandataire_nom">Mandataire représentant *</Label>
                            <Input
                              id="personne_morale_mandataire_nom"
                              value={formData.personne_morale_mandataire_nom}
                              onChange={(e) => handleInputChange("personne_morale_mandataire_nom", e.target.value)}
                              placeholder="Marie Martin, Gérant"
                            />
                          </div>
                          <div>
                            <Label htmlFor="personne_morale_mandataire_adresse">Adresse du mandataire</Label>
                            <Input
                              id="personne_morale_mandataire_adresse"
                              value={formData.personne_morale_mandataire_adresse}
                              onChange={(e) => handleInputChange("personne_morale_mandataire_adresse", e.target.value)}
                              placeholder="456 avenue des Champs, 75008 Paris"
                            />
                          </div>
                          <div>
                            <Label htmlFor="personne_morale_mandataire_activite">Activité exercée</Label>
                            <Input
                              id="personne_morale_mandataire_activite"
                              value={formData.personne_morale_mandataire_activite}
                              onChange={(e) => handleInputChange("personne_morale_mandataire_activite", e.target.value)}
                              placeholder="Gérant de la SARL"
                            />
                          </div>
                          <div>
                            <Label htmlFor="personne_morale_mandataire_carte_pro">Numéro carte professionnelle</Label>
                            <Input
                              id="personne_morale_mandataire_carte_pro"
                              value={formData.personne_morale_mandataire_carte_pro}
                              onChange={(e) =>
                                handleInputChange("personne_morale_mandataire_carte_pro", e.target.value)
                              }
                              placeholder="CPI 7501 2023 000 000 002"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Locataires */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Locataires</h3>
                      {formData.locataires.length > 0 ? (
                        <div className="space-y-4">
                          {formData.locataires.map((locataire, index) => (
                            <Card key={index}>
                              <CardContent className="pt-4">
                                <div className="flex justify-between items-start mb-4">
                                  <h4 className="font-medium">Locataire {index + 1}</h4>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeLocataire(index)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label>Prénom</Label>
                                    <Input
                                      value={locataire.prenom}
                                      onChange={(e) => updateLocataire(index, "prenom", e.target.value)}
                                      placeholder="Marie"
                                    />
                                  </div>
                                  <div>
                                    <Label>Nom</Label>
                                    <Input
                                      value={locataire.nom}
                                      onChange={(e) => updateLocataire(index, "nom", e.target.value)}
                                      placeholder="Martin"
                                    />
                                  </div>
                                  <div>
                                    <Label>Email</Label>
                                    <Input
                                      type="email"
                                      value={locataire.email}
                                      onChange={(e) => updateLocataire(index, "email", e.target.value)}
                                      placeholder="marie.martin@email.com"
                                    />
                                  </div>
                                  <div>
                                    <Label>Date de naissance</Label>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !locataire.date_naissance && "text-muted-foreground",
                                          )}
                                        >
                                          <CalendarIcon className="mr-2 h-4 w-4" />
                                          {locataire.date_naissance
                                            ? format(locataire.date_naissance, "dd/MM/yyyy", { locale: fr })
                                            : "Sélectionner une date"}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0">
                                        <Calendar
                                          mode="single"
                                          selected={locataire.date_naissance || undefined}
                                          onSelect={(date) => updateLocataire(index, "date_naissance", date)}
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
                      ) : (
                        <p className="text-muted-foreground">Aucun locataire ajouté</p>
                      )}
                      <Button variant="outline" onClick={addLocataire} className="mt-4 bg-transparent">
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter un locataire
                      </Button>
                    </div>
                  </div>
                )}

                {/* Étape 3: Logement */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <Label htmlFor="identifiant_fiscal">Numéro fiscal du logement</Label>
                        <Input
                          id="identifiant_fiscal"
                          value={formData.identifiant_fiscal}
                          onChange={(e) => handleInputChange("identifiant_fiscal", e.target.value)}
                          placeholder="Référence cadastrale"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="adresse_logement">Adresse du logement *</Label>
                      <Input
                        id="adresse_logement"
                        value={formData.adresse_logement}
                        onChange={(e) => handleInputChange("adresse_logement", e.target.value)}
                        placeholder="789 boulevard Saint-Germain, 75007 Paris"
                      />
                    </div>

                    <div>
                      <Label htmlFor="complement_adresse">Complément d'adresse</Label>
                      <Input
                        id="complement_adresse"
                        value={formData.complement_adresse}
                        onChange={(e) => handleInputChange("complement_adresse", e.target.value)}
                        placeholder="3ème étage, Bâtiment B, Appartement n°205"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <div>
                        <Label htmlFor="performance_dpe">Performance DPE</Label>
                        <Select
                          value={formData.performance_dpe}
                          onValueChange={(value) => handleInputChange("performance_dpe", value)}
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="type_habitat">Type d'habitat</Label>
                        <Select
                          value={formData.type_habitat}
                          onValueChange={(value) => handleInputChange("type_habitat", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="immeuble_collectif">Immeuble collectif</SelectItem>
                            <SelectItem value="individuel">Individuel</SelectItem>
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
                            <SelectItem value="monopropriete">Monopropriété</SelectItem>
                            <SelectItem value="copropriete">Copropriété</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="destination_locaux">Destinations des locaux</Label>
                        <Select
                          value={formData.destination_locaux}
                          onValueChange={(value) => handleInputChange("destination_locaux", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="usage_habitation">Usage d'habitation</SelectItem>
                            <SelectItem value="usage_mixte">Usage mixte professionnel et d'habitation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="production_chauffage">Production de chauffage</Label>
                        <Select
                          value={formData.production_chauffage}
                          onValueChange={(value) => handleInputChange("production_chauffage", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="individuel">Individuel</SelectItem>
                            <SelectItem value="collectif">Collectif</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="production_eau_chaude">Production Eau chaude Sanitaire</Label>
                        <Select
                          value={formData.production_eau_chaude}
                          onValueChange={(value) => handleInputChange("production_eau_chaude", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="individuelle">Individuelle</SelectItem>
                            <SelectItem value="collective">Collective</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Autres parties du logement */}
                    <div>
                      <Label>Autres parties du logement</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                        {autresPartiesOptions.map((option) => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`autres_parties_${option.value}`}
                              checked={formData.autres_parties.includes(option.value)}
                              onCheckedChange={(checked) =>
                                handleMultiSelectChange("autres_parties", option.value, checked as boolean)
                              }
                            />
                            <Label htmlFor={`autres_parties_${option.value}`} className="text-sm">
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Équipements du logement */}
                    <div>
                      <Label>Équipements du logement</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                        {equipementsLogementOptions.map((option) => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`equipements_logement_${option.value}`}
                              checked={formData.equipements_logement.includes(option.value)}
                              onCheckedChange={(checked) =>
                                handleMultiSelectChange("equipements_logement", option.value, checked as boolean)
                              }
                            />
                            <Label htmlFor={`equipements_logement_${option.value}`} className="text-sm">
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Équipements, locaux, services à usage privatif */}
                    <div>
                      <Label>Équipements, locaux, services à usage privatif</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                        {equipementsPrivatifsOptions.map((option) => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`equipements_privatifs_${option.value}`}
                              checked={formData.equipements_privatifs.includes(option.value)}
                              onCheckedChange={(checked) =>
                                handleMultiSelectChange("equipements_privatifs", option.value, checked as boolean)
                              }
                            />
                            <Label htmlFor={`equipements_privatifs_${option.value}`} className="text-sm">
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Équipements, locaux, services à usage commun */}
                    <div>
                      <Label>Équipements, locaux, services à usage commun</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                        {equipementsCommunsOptions.map((option) => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`equipements_communs_${option.value}`}
                              checked={formData.equipements_communs.includes(option.value)}
                              onCheckedChange={(checked) =>
                                handleMultiSelectChange("equipements_communs", option.value, checked as boolean)
                              }
                            />
                            <Label htmlFor={`equipements_communs_${option.value}`} className="text-sm">
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Équipements d'accès aux technologies */}
                    <div>
                      <Label>Équipements d'accès aux technologies de l'information et de la communication</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                        {equipementsTechnologiesOptions.map((option) => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`equipements_technologies_${option.value}`}
                              checked={formData.equipements_technologies.includes(option.value)}
                              onCheckedChange={(checked) =>
                                handleMultiSelectChange("equipements_technologies", option.value, checked as boolean)
                              }
                            />
                            <Label htmlFor={`equipements_technologies_${option.value}`} className="text-sm">
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Étape 4: Financier */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    {/* Loyer */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Loyer</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="loyer_mensuel">Loyer mensuel hors charges (€/mois) *</Label>
                          <Input
                            id="loyer_mensuel"
                            type="number"
                            value={formData.loyer_mensuel}
                            onChange={(e) => handleInputChange("loyer_mensuel", e.target.value)}
                            placeholder="1200"
                          />
                        </div>
                        <div>
                          <Label htmlFor="depot_garantie">Dépôt de garantie (€) *</Label>
                          <Input
                            id="depot_garantie"
                            type="number"
                            value={formData.depot_garantie}
                            onChange={(e) => handleInputChange("depot_garantie", e.target.value)}
                            placeholder="2400"
                          />
                        </div>
                      </div>

                      {/* Zone encadrée */}
                      <div className="mt-6">
                        <div className="flex items-center space-x-2 mb-4">
                          <Switch
                            id="zone_encadree"
                            checked={formData.zone_encadree}
                            onCheckedChange={(checked) => handleInputChange("zone_encadree", checked)}
                          />
                          <Label htmlFor="zone_encadree">Le logement est dans une zone où le loyer est encadré ?</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              window.open("https://www.service-public.fr/particuliers/vosdroits/F1314", "_blank")
                            }
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>

                        {formData.zone_encadree && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                            <div>
                              <Label htmlFor="loyer_reference">Loyer mensuel de référence (€/mois)</Label>
                              <Input
                                id="loyer_reference"
                                type="number"
                                value={formData.loyer_reference}
                                onChange={(e) => handleInputChange("loyer_reference", e.target.value)}
                                placeholder="1000"
                              />
                            </div>
                            <div>
                              <Label htmlFor="loyer_reference_majore">Loyer mensuel de référence majoré (€/mois)</Label>
                              <Input
                                id="loyer_reference_majore"
                                type="number"
                                value={formData.loyer_reference_majore}
                                onChange={(e) => handleInputChange("loyer_reference_majore", e.target.value)}
                                placeholder="1200"
                              />
                            </div>
                            <div>
                              <Label htmlFor="complement_loyer">Complément de loyer (€)</Label>
                              <Input
                                id="complement_loyer"
                                type="number"
                                value={formData.complement_loyer}
                                onChange={(e) => handleInputChange("complement_loyer", e.target.value)}
                                placeholder="0"
                              />
                            </div>
                            <div className="md:col-span-3">
                              <Label htmlFor="complement_loyer_justification">
                                Justification du complément de loyer
                              </Label>
                              <Textarea
                                id="complement_loyer_justification"
                                value={formData.complement_loyer_justification}
                                onChange={(e) => handleInputChange("complement_loyer_justification", e.target.value)}
                                placeholder="À remplir si votre loyer est supérieur au loyer de référence majoré"
                                rows={3}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Zone tendue */}
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="zone_tendue"
                          checked={formData.zone_tendue}
                          onCheckedChange={(checked) => handleInputChange("zone_tendue", checked)}
                        />
                        <Label htmlFor="zone_tendue">
                          Le logement est en zone tendue (l'évolution du loyer entre 2 locataires est plafonnée à l'IRL)
                        </Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            window.open("https://www.service-public.fr/particuliers/vosdroits/F1317", "_blank")
                          }
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
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
                            <SelectItem value="absence">Absence de charge</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {(formData.type_charges === "provisions" || formData.type_charges === "forfait") && (
                        <div className="mt-4">
                          <Label htmlFor="montant_charges">Montant Mensuel des charges (€/mois)</Label>
                          <Input
                            id="montant_charges"
                            type="number"
                            value={formData.montant_charges}
                            onChange={(e) => handleInputChange("montant_charges", e.target.value)}
                            placeholder="150"
                          />
                        </div>
                      )}

                      {formData.type_charges === "forfait" && (
                        <div className="mt-4">
                          <Label htmlFor="modalite_revision_forfait">Modalité de révision du forfait de charges</Label>
                          <Select
                            value={formData.modalite_revision_forfait}
                            onValueChange={(value) => handleInputChange("modalite_revision_forfait", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="indexation_loyer">Indexation identique au loyer</SelectItem>
                              <SelectItem value="autre">Autre modalité à saisir</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {formData.type_charges === "absence" && (
                        <Alert className="mt-4">
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            Attention : vous ne pourrez pas demander la taxe d'ordures ménagères au locataire.
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Assurance colocataires */}
                      <div className="mt-6">
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
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg">
                            <div>
                              <Label htmlFor="assurance_montant">Montant récupérable</Label>
                              <Input
                                id="assurance_montant"
                                type="number"
                                value={formData.assurance_montant}
                                onChange={(e) => handleInputChange("assurance_montant", e.target.value)}
                                placeholder="120"
                              />
                            </div>
                            <div>
                              <Label htmlFor="assurance_frequence">Fréquence de paiement</Label>
                              <Select
                                value={formData.assurance_frequence}
                                onValueChange={(value) => handleInputChange("assurance_frequence", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="annuel">Annuellement</SelectItem>
                                  <SelectItem value="mensuel">Mensuellement</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Indexation du loyer */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Indexation du loyer</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="trimestre_reference_irl">Trimestre de référence pour l'IRL</Label>
                          <Select
                            value={formData.trimestre_reference_irl}
                            onValueChange={(value) => handleInputChange("trimestre_reference_irl", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choisir un trimestre" />
                            </SelectTrigger>
                            <SelectContent>
                              {trimestreIRLOptions.map((trimestre) => (
                                <SelectItem key={trimestre.value} value={trimestre.value}>
                                  {trimestre.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="flex items-center mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open("https://www.insee.fr/fr/statistiques/2015067", "_blank")}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Lien vers les valeurs d'IRL sur le site de l'INSEE
                            </Button>
                          </div>
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
                              <SelectItem value="premier_mois">1er du mois suivant l'anniversaire</SelectItem>
                              <SelectItem value="autre">Autre date</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {formData.date_revision_loyer === "autre" && (
                          <div>
                            <Label htmlFor="date_revision_personnalisee">Indiquer le jour et le mois de révision</Label>
                            <Input
                              id="date_revision_personnalisee"
                              value={formData.date_revision_personnalisee}
                              onChange={(e) => handleInputChange("date_revision_personnalisee", e.target.value)}
                              placeholder="15 janvier"
                            />
                          </div>
                        )}

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
                              <SelectItem value="non_renseigne">Je ne souhaite pas remplir ce champ</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {formData.ancien_locataire_duree === "moins_18_mois" && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-yellow-50 rounded-lg">
                            <div>
                              <Label htmlFor="dernier_loyer_ancien">
                                Dernier loyer versé par l'ancien locataire (€/mois)
                              </Label>
                              <Input
                                id="dernier_loyer_ancien"
                                type="number"
                                value={formData.dernier_loyer_ancien}
                                onChange={(e) => handleInputChange("dernier_loyer_ancien", e.target.value)}
                                placeholder="1100"
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
                                      : "Sélectionner une date"}
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
                                      : "Sélectionner une date"}
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

                    {/* Dépenses d'énergie */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Dépenses d'énergie</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="estimation_depenses_energie_min">
                            Estimation min des dépenses annuelles (€)
                          </Label>
                          <Input
                            id="estimation_depenses_energie_min"
                            type="number"
                            value={formData.estimation_depenses_energie_min}
                            onChange={(e) => handleInputChange("estimation_depenses_energie_min", e.target.value)}
                            placeholder="800"
                          />
                        </div>
                        <div>
                          <Label htmlFor="estimation_depenses_energie_max">
                            Estimation max des dépenses annuelles (€)
                          </Label>
                          <Input
                            id="estimation_depenses_energie_max"
                            type="number"
                            value={formData.estimation_depenses_energie_max}
                            onChange={(e) => handleInputChange("estimation_depenses_energie_max", e.target.value)}
                            placeholder="1200"
                          />
                        </div>
                        <div>
                          <Label htmlFor="annee_reference_energie">Année de référence</Label>
                          <Input
                            id="annee_reference_energie"
                            type="number"
                            value={formData.annee_reference_energie}
                            onChange={(e) => handleInputChange("annee_reference_energie", e.target.value)}
                            placeholder="2024"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Étape 5: Durée */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date_entree">Date d'entrée *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !formData.date_entree && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.date_entree
                                ? format(formData.date_entree, "dd/MM/yyyy", { locale: fr })
                                : "Sélectionner une date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={formData.date_entree || undefined}
                              onSelect={(date) => handleInputChange("date_entree", date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <Label htmlFor="duree_contrat">Durée du contrat (en mois) *</Label>
                        <Input
                          id="duree_contrat"
                          type="number"
                          value={formData.duree_contrat}
                          onChange={(e) => handleInputChange("duree_contrat", e.target.value)}
                          placeholder="36"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {formData.lease_type === "furnished"
                            ? "12 mois minimum pour un meublé"
                            : "36 mois minimum pour un non meublé"}
                        </p>
                      </div>
                    </div>

                    {/* Contrat durée réduite */}
                    <div>
                      <div className="flex items-center space-x-2 mb-4">
                        <Switch
                          id="contrat_duree_reduite"
                          checked={formData.contrat_duree_reduite}
                          onCheckedChange={(checked) => handleInputChange("contrat_duree_reduite", checked)}
                        />
                        <Label htmlFor="contrat_duree_reduite">Contrat inférieur à la durée légale</Label>
                      </div>

                      {formData.contrat_duree_reduite && (
                        <div>
                          <Label htmlFor="raison_duree_reduite">
                            Raison justifiant la réduction de la durée du bail
                          </Label>
                          <Textarea
                            id="raison_duree_reduite"
                            value={formData.raison_duree_reduite}
                            onChange={(e) => handleInputChange("raison_duree_reduite", e.target.value)}
                            placeholder="Motif professionnel, familial ou autre justification légale..."
                            rows={3}
                          />
                        </div>
                      )}
                    </div>

                    {/* Paiement du loyer */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Paiement du loyer</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="jour_paiement_loyer">Le loyer est payé le</Label>
                          <Select
                            value={formData.jour_paiement_loyer}
                            onValueChange={(value) => handleInputChange("jour_paiement_loyer", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1er du mois</SelectItem>
                              <SelectItem value="5">5 du mois</SelectItem>
                              <SelectItem value="10">10 du mois</SelectItem>
                              <SelectItem value="15">15 du mois</SelectItem>
                              <SelectItem value="30">30 du mois</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Modalité de paiement</Label>
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="paiement_avance"
                                name="paiement_modalite"
                                checked={formData.paiement_avance}
                                onChange={() => handleInputChange("paiement_avance", true)}
                              />
                              <Label htmlFor="paiement_avance">En avance pour le mois à venir</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="paiement_terme_echu"
                                name="paiement_modalite"
                                checked={!formData.paiement_avance}
                                onChange={() => handleInputChange("paiement_avance", false)}
                              />
                              <Label htmlFor="paiement_terme_echu">Une fois le mois écoulé</Label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Étape 6: Clauses */}
                {currentStep === 6 && (
                  <div className="space-y-6">
                    {/* Clauses Génériques */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Clauses Génériques</h3>
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
                        {formData.lease_type === "furnished" && (
                          <div>
                            <Label htmlFor="mise_disposition_meubles">Mise à disposition des meubles</Label>
                            <Textarea
                              id="mise_disposition_meubles"
                              value={formData.mise_disposition_meubles}
                              onChange={(e) => handleInputChange("mise_disposition_meubles", e.target.value)}
                              placeholder="Conditions de mise à disposition et d'entretien des meubles..."
                              rows={3}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Clauses sélectionnables */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Clauses spécifiques</h3>
                      <div className="space-y-6">
                        {/* Animaux domestiques */}
                        <div>
                          <Label htmlFor="clause_animaux_domestiques_id">Animaux domestiques</Label>
                          <Select
                            value={formData.clause_animaux_domestiques_id}
                            onValueChange={(value) => handleInputChange("clause_animaux_domestiques_id", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une clause" />
                            </SelectTrigger>
                            <SelectContent>
                              {leaseClauses
                                .filter((clause) => clause.category === "animaux_domestiques" && clause.is_active)
                                .map((clause) => (
                                  <SelectItem key={clause.id} value={clause.id}>
                                    {clause.name}
                                    {clause.is_default && (
                                      <Badge variant="secondary" className="ml-2">
                                        Par défaut
                                      </Badge>
                                    )}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          {formData.clause_animaux_domestiques_id && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-md">
                              <p className="text-sm text-gray-700">
                                {leaseClauses.find((c) => c.id === formData.clause_animaux_domestiques_id)?.clause_text}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Entretien annuel des appareils */}
                        <div>
                          <Label htmlFor="clause_entretien_appareils_id">Entretien annuel des appareils</Label>
                          <Select
                            value={formData.clause_entretien_appareils_id}
                            onValueChange={(value) => handleInputChange("clause_entretien_appareils_id", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une clause" />
                            </SelectTrigger>
                            <SelectContent>
                              {leaseClauses
                                .filter((clause) => clause.category === "entretien_appareils" && clause.is_active)
                                .map((clause) => (
                                  <SelectItem key={clause.id} value={clause.id}>
                                    {clause.name}
                                    {clause.is_default && (
                                      <Badge variant="secondary" className="ml-2">
                                        Par défaut
                                      </Badge>
                                    )}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          {formData.clause_entretien_appareils_id && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-md">
                              <p className="text-sm text-gray-700">
                                {leaseClauses.find((c) => c.id === formData.clause_entretien_appareils_id)?.clause_text}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Dégradations du locataire */}
                        <div>
                          <Label htmlFor="clause_degradations_locataire_id">Dégradations du locataire</Label>
                          <Select
                            value={formData.clause_degradations_locataire_id}
                            onValueChange={(value) => handleInputChange("clause_degradations_locataire_id", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une clause" />
                            </SelectTrigger>
                            <SelectContent>
                              {leaseClauses
                                .filter((clause) => clause.category === "degradations_locataire" && clause.is_active)
                                .map((clause) => (
                                  <SelectItem key={clause.id} value={clause.id}>
                                    {clause.name}
                                    {clause.is_default && (
                                      <Badge variant="secondary" className="ml-2">
                                        Par défaut
                                      </Badge>
                                    )}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          {formData.clause_degradations_locataire_id && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-md">
                              <p className="text-sm text-gray-700">
                                {
                                  leaseClauses.find((c) => c.id === formData.clause_degradations_locataire_id)
                                    ?.clause_text
                                }
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Travaux bailleur */}
                        <div>
                          <Label htmlFor="clause_travaux_bailleur_id">Travaux bailleur en cours de bail</Label>
                          <Select
                            value={formData.clause_travaux_bailleur_id}
                            onValueChange={(value) => handleInputChange("clause_travaux_bailleur_id", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une clause" />
                            </SelectTrigger>
                            <SelectContent>
                              {leaseClauses
                                .filter((clause) => clause.category === "travaux_bailleur" && clause.is_active)
                                .map((clause) => (
                                  <SelectItem key={clause.id} value={clause.id}>
                                    {clause.name}
                                    {clause.is_default && (
                                      <Badge variant="secondary" className="ml-2">
                                        Par défaut
                                      </Badge>
                                    )}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          {formData.clause_travaux_bailleur_id && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-md">
                              <p className="text-sm text-gray-700">
                                {leaseClauses.find((c) => c.id === formData.clause_travaux_bailleur_id)?.clause_text}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Travaux locataire */}
                        <div>
                          <Label htmlFor="clause_travaux_locataire_id">Travaux locataire en cours de bail</Label>
                          <Select
                            value={formData.clause_travaux_locataire_id}
                            onValueChange={(value) => handleInputChange("clause_travaux_locataire_id", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une clause" />
                            </SelectTrigger>
                            <SelectContent>
                              {leaseClauses
                                .filter((clause) => clause.category === "travaux_locataire" && clause.is_active)
                                .map((clause) => (
                                  <SelectItem key={clause.id} value={clause.id}>
                                    {clause.name}
                                    {clause.is_default && (
                                      <Badge variant="secondary" className="ml-2">
                                        Par défaut
                                      </Badge>
                                    )}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          {formData.clause_travaux_locataire_id && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-md">
                              <p className="text-sm text-gray-700">
                                {leaseClauses.find((c) => c.id === formData.clause_travaux_locataire_id)?.clause_text}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Travaux entre locataires */}
                        <div>
                          <Label htmlFor="clause_travaux_entre_locataires_id">Travaux entre deux locataires</Label>
                          <Select
                            value={formData.clause_travaux_entre_locataires_id}
                            onValueChange={(value) => handleInputChange("clause_travaux_entre_locataires_id", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une clause" />
                            </SelectTrigger>
                            <SelectContent>
                              {leaseClauses
                                .filter((clause) => clause.category === "travaux_entre_locataires" && clause.is_active)
                                .map((clause) => (
                                  <SelectItem key={clause.id} value={clause.id}>
                                    {clause.name}
                                    {clause.is_default && (
                                      <Badge variant="secondary" className="ml-2">
                                        Par défaut
                                      </Badge>
                                    )}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          {formData.clause_travaux_entre_locataires_id && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-md">
                              <p className="text-sm text-gray-700">
                                {
                                  leaseClauses.find((c) => c.id === formData.clause_travaux_entre_locataires_id)
                                    ?.clause_text
                                }
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Clauses Optionnelles */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Clauses Optionnelles</h3>
                      <div className="space-y-6">
                        {/* Honoraires d'agence */}
                        <div>
                          <div className="flex items-center space-x-2 mb-4">
                            <Switch
                              id="honoraires_professionnel"
                              checked={formData.honoraires_professionnel}
                              onCheckedChange={(checked) => handleInputChange("honoraires_professionnel", checked)}
                            />
                            <Label htmlFor="honoraires_professionnel">
                              La location a été réalisée avec l'entremise d'un professionnel mandaté
                            </Label>
                          </div>

                          {formData.honoraires_professionnel && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                              <div>
                                <Label htmlFor="honoraires_locataire_visite">Honoraires locataire (€)</Label>
                                <Input
                                  id="honoraires_locataire_visite"
                                  type="number"
                                  value={formData.honoraires_locataire_visite}
                                  onChange={(e) => handleInputChange("honoraires_locataire_visite", e.target.value)}
                                  placeholder="500"
                                />
                                <p className="text-xs text-muted-foreground">Visites, dossier, bail</p>
                              </div>
                              <div>
                                <Label htmlFor="plafond_honoraires_locataire">Plafond honoraires (€/m²)</Label>
                                <Input
                                  id="plafond_honoraires_locataire"
                                  type="number"
                                  value={formData.plafond_honoraires_locataire}
                                  onChange={(e) => handleInputChange("plafond_honoraires_locataire", e.target.value)}
                                  placeholder="12"
                                />
                              </div>
                              <div>
                                <Label htmlFor="honoraires_bailleur_visite">Honoraires bailleur (€)</Label>
                                <Input
                                  id="honoraires_bailleur_visite"
                                  type="number"
                                  value={formData.honoraires_bailleur_visite}
                                  onChange={(e) => handleInputChange("honoraires_bailleur_visite", e.target.value)}
                                  placeholder="300"
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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-green-50 rounded-lg">
                              <div>
                                <Label htmlFor="honoraires_locataire_etat_lieux">Honoraires locataire (€)</Label>
                                <Input
                                  id="honoraires_locataire_etat_lieux"
                                  type="number"
                                  value={formData.honoraires_locataire_etat_lieux}
                                  onChange={(e) => handleInputChange("honoraires_locataire_etat_lieux", e.target.value)}
                                  placeholder="150"
                                />
                              </div>
                              <div>
                                <Label htmlFor="plafond_honoraires_etat_lieux">Plafond honoraires (€/m²)</Label>
                                <Input
                                  id="plafond_honoraires_etat_lieux"
                                  type="number"
                                  value={formData.plafond_honoraires_etat_lieux}
                                  onChange={(e) => handleInputChange("plafond_honoraires_etat_lieux", e.target.value)}
                                  placeholder="3"
                                />
                              </div>
                              <div>
                                <Label htmlFor="honoraires_bailleur_etat_lieux">Honoraires bailleur (€)</Label>
                                <Input
                                  id="honoraires_bailleur_etat_lieux"
                                  type="number"
                                  value={formData.honoraires_bailleur_etat_lieux}
                                  onChange={(e) => handleInputChange("honoraires_bailleur_etat_lieux", e.target.value)}
                                  placeholder="150"
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex items-center space-x-2 mt-4 mb-4">
                            <Switch
                              id="autres_prestations"
                              checked={formData.autres_prestations}
                              onCheckedChange={(checked) => handleInputChange("autres_prestations", checked)}
                            />
                            <Label htmlFor="autres_prestations">
                              D'autres prestations que la recherche du locataire et l'état des lieux sont facturées au
                              bailleur
                            </Label>
                          </div>

                          {formData.autres_prestations && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-yellow-50 rounded-lg">
                              <div>
                                <Label htmlFor="details_autres_prestations">Détails des prestations</Label>
                                <Textarea
                                  id="details_autres_prestations"
                                  value={formData.details_autres_prestations}
                                  onChange={(e) => handleInputChange("details_autres_prestations", e.target.value)}
                                  placeholder="Gestion locative, entretien, etc."
                                  rows={3}
                                />
                              </div>
                              <div>
                                <Label htmlFor="honoraires_autres_prestations">Honoraires bailleur (€)</Label>
                                <Input
                                  id="honoraires_autres_prestations"
                                  type="number"
                                  value={formData.honoraires_autres_prestations}
                                  onChange={(e) => handleInputChange("honoraires_autres_prestations", e.target.value)}
                                  placeholder="200"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Franchise de loyer */}
                        <div>
                          <Label htmlFor="franchise_loyer">Franchise de loyer</Label>
                          <Textarea
                            id="franchise_loyer"
                            value={formData.franchise_loyer}
                            onChange={(e) => handleInputChange("franchise_loyer", e.target.value)}
                            placeholder="Conditions de franchise de loyer si applicable..."
                            rows={3}
                          />
                        </div>

                        {/* Clause libre */}
                        <div>
                          <Label htmlFor="clause_libre">Clause libre</Label>
                          <Textarea
                            id="clause_libre"
                            value={formData.clause_libre}
                            onChange={(e) => handleInputChange("clause_libre", e.target.value)}
                            placeholder="Clauses particulières spécifiques à ce bail..."
                            rows={4}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Garants */}
                    {formData.guarantee_type === "guarantor" && (
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
                                      <Select
                                        value={garant.pour_locataire}
                                        onValueChange={(value) => updateGarant(index, "pour_locataire", value)}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Sélectionner un locataire" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {formData.locataires.map((locataire, locIndex) => (
                                            <SelectItem key={locIndex} value={`${locataire.prenom} ${locataire.nom}`}>
                                              {locataire.prenom} {locataire.nom}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
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
                    )}

                    {/* Annexes */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Annexes</h3>
                      <div className="space-y-6">
                        {/* Annexes à ajouter par le propriétaire */}
                        <div>
                          <h4 className="font-medium mb-3">Annexes à ajouter par le propriétaire</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="annexe_surface_habitable"
                                checked={formData.annexe_surface_habitable}
                                onCheckedChange={(checked) => handleInputChange("annexe_surface_habitable", checked)}
                              />
                              <Label htmlFor="annexe_surface_habitable" className="text-sm">
                                Surface habitable
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="annexe_dpe"
                                checke={formData.annexe_dpe}
                                onCheckedChange={(checked) => handleInputChange("annexe_dpe", checked)}
                              />
                              <Label htmlFor="annexe_dpe" className="text-sm">
                                DPE
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="annexe_plomb"
                                checked={formData.annexe_plomb}
                                onCheckedChange={(checked) => handleInputChange("annexe_plomb", checked)}
                              />
                              <Label htmlFor="annexe_plomb" className="text-sm">
                                Plomb
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="annexe_amiante"
                                checked={formData.annexe_amiante}
                                onCheckedChange={(checked) => handleInputChange("annexe_amiante", checked)}
                              />
                              <Label htmlFor="annexe_amiante" className="text-sm">
                                Amiante
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="annexe_electricite"
                                checked={formData.annexe_electricite}
                                onCheckedChange={(checked) => handleInputChange("annexe_electricite", checked)}
                              />
                              <Label htmlFor="annexe_electricite" className="text-sm">
                                Électricité
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="annexe_gaz"
                                checked={formData.annexe_gaz}
                                onCheckedChange={(checked) => handleInputChange("annexe_gaz", checked)}
                              />
                              <Label htmlFor="annexe_gaz" className="text-sm">
                                Gaz
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="annexe_erp"
                                checked={formData.annexe_erp}
                                onCheckedChange={(checked) => handleInputChange("annexe_erp", checked)}
                              />
                              <Label htmlFor="annexe_erp" className="text-sm">
                                ERP
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="annexe_bruit"
                                checked={formData.annexe_bruit}
                                onCheckedChange={(checked) => handleInputChange("annexe_bruit", checked)}
                              />
                              <Label htmlFor="annexe_bruit" className="text-sm">
                                Bruit
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="annexe_autres"
                                checked={formData.annexe_autres}
                                onCheckedChange={(checked) => handleInputChange("annexe_autres", checked)}
                              />
                              <Label htmlFor="annexe_autres" className="text-sm">
                                Autres
                              </Label>
                            </div>
                          </div>
                        </div>

                        {/* Documents gérés par l'admin */}
                        <div>
                          <h4 className="font-medium mb-3">Documents gérés par l'admin</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="annexe_etat_lieux"
                                checked={formData.annexe_etat_lieux}
                                onCheckedChange={(checked) => handleInputChange("annexe_etat_lieux", checked)}
                              />
                              <Label htmlFor="annexe_etat_lieux" className="text-sm">
                                État des lieux
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="annexe_notice_information"
                                checked={formData.annexe_notice_information}
                                onCheckedChange={(checked) => handleInputChange("annexe_notice_information", checked)}
                              />
                              <Label htmlFor="annexe_notice_information" className="text-sm">
                                Notice d'information
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="annexe_inventaire_meubles"
                                checked={formData.annexe_inventaire_meubles}
                                onCheckedChange={(checked) => handleInputChange("annexe_inventaire_meubles", checked)}
                              />
                              <Label htmlFor="annexe_inventaire_meubles" className="text-sm">
                                Inventaire des meubles
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="annexe_liste_charges"
                                checked={formData.annexe_liste_charges}
                                onCheckedChange={(checked) => handleInputChange("annexe_liste_charges", checked)}
                              />
                              <Label htmlFor="annexe_liste_charges" className="text-sm">
                                Liste des charges récupérables
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="annexe_reparations_locatives"
                                checked={formData.annexe_reparations_locatives}
                                onCheckedChange={(checked) =>
                                  handleInputChange("annexe_reparations_locatives", checked)
                                }
                              />
                              <Label htmlFor="annexe_reparations_locatives" className="text-sm">
                                Liste des réparations locatives
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="annexe_grille_vetuste"
                                checked={formData.annexe_grille_vetuste}
                                onCheckedChange={(checked) => handleInputChange("annexe_grille_vetuste", checked)}
                              />
                              <Label htmlFor="annexe_grille_vetuste" className="text-sm">
                                Grille de vétusté
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="annexe_bail_parking"
                                checked={formData.annexe_bail_parking}
                                onCheckedChange={(checked) => handleInputChange("annexe_bail_parking", checked)}
                              />
                              <Label htmlFor="annexe_bail_parking" className="text-sm">
                                Modèle de bail parking
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="annexe_actes_caution"
                                checked={formData.annexe_actes_caution}
                                onCheckedChange={(checked) => handleInputChange("annexe_actes_caution", checked)}
                              />
                              <Label htmlFor="annexe_actes_caution" className="text-sm">
                                Actes de caution solidaire
                              </Label>
                            </div>
                          </div>
                        </div>
                      </div>
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
                    <Button onClick={handleSubmit} disabled={saving}>
                      {saving ? "Création..." : "Créer le bail"}
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
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Aperçu</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)}>
                    {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              {showPreview && (
                <CardContent>
                  <div className="space-y-4 text-sm">
                    {/* Résumé des informations saisies */}
                    {formData.property_id && (
                      <div>
                        <h4 className="font-medium text-blue-600">Bien sélectionné</h4>
                        <p className="text-muted-foreground">
                          {properties.find((p) => p.id === formData.property_id)?.title}
                        </p>
                      </div>
                    )}

                    {formData.tenant_id && (
                      <div>
                        <h4 className="font-medium text-blue-600">Locataire</h4>
                        <p className="text-muted-foreground">
                          {tenants.find((t) => t.id === formData.tenant_id)?.first_name}{" "}
                          {tenants.find((t) => t.id === formData.tenant_id)?.last_name}
                        </p>
                      </div>
                    )}

                    {formData.loyer_mensuel && (
                      <div>
                        <h4 className="font-medium text-blue-600">Loyer mensuel</h4>
                        <p className="text-muted-foreground">{formData.loyer_mensuel} €</p>
                      </div>
                    )}

                    {formData.date_entree && (
                      <div>
                        <h4 className="font-medium text-blue-600">Date d'entrée</h4>
                        <p className="text-muted-foreground">
                          {format(formData.date_entree, "dd/MM/yyyy", { locale: fr })}
                        </p>
                      </div>
                    )}

                    {formData.duree_contrat && (
                      <div>
                        <h4 className="font-medium text-blue-600">Durée</h4>
                        <p className="text-muted-foreground">{formData.duree_contrat} mois</p>
                      </div>
                    )}

                    {/* Progression */}
                    <div className="pt-4 border-t">
                      <h4 className="font-medium text-blue-600 mb-2">Progression</h4>
                      <div className="space-y-2">
                        {steps.map((step) => (
                          <div key={step.id} className="flex items-center gap-2">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                validateStep(step.id)
                                  ? "bg-green-500"
                                  : currentStep === step.id
                                    ? "bg-blue-500"
                                    : "bg-gray-300"
                              }`}
                            />
                            <span
                              className={`text-xs ${
                                validateStep(step.id)
                                  ? "text-green-600"
                                  : currentStep === step.id
                                    ? "text-blue-600"
                                    : "text-gray-500"
                              }`}
                            >
                              {step.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
