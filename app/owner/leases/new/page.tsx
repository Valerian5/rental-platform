"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
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

interface ClauseState {
  enabled: boolean
  text: string
  clauseId?: string
}

interface LeaseTemplate {
  id: string
  name: string
  lease_type: string
  template_content: string
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
  bailleur_nom_prenom: string
  bailleur_email: string
  bailleur_telephone: string
  bailleur_adresse: string

  mandataire_represente: boolean
  mandataire_nom: string
  mandataire_adresse: string
  mandataire_activite: string
  mandataire_carte_pro: string
  mandataire_garant_nom: string
  mandataire_garant_adresse: string

  sci_denomination: string
  sci_mandataire_nom: string
  sci_mandataire_adresse: string

  personne_morale_denomination: string
  personne_morale_mandataire_nom: string
  personne_morale_mandataire_adresse: string

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
  performance_dpe: string
  type_habitat: string // immeuble_collectif/individuel
  regime_juridique: string // monopropriete/copropriete
  destination_locaux: string // usage_habitation/usage_mixte
  production_chauffage: string // individuel/collectif
  production_eau_chaude: string // individuelle/collective

  autres_parties_types: string[]
  autres_parties_autres: string
  equipements_logement_types: string[]
  equipements_logement_autres: string
  locaux_privatifs_types: string[]
  cave_numero: string
  parking_numero: string
  garage_numero: string
  locaux_privatifs_autres: string
  locaux_communs_types: string[]
  locaux_communs_autres: string
  equipement_technologies_types: string[]

  identifiant_fiscal: string

  // === FINANCIER ===
  loyer_mensuel: number | string
  depot_garantie: number | string

  zone_encadree: boolean
  loyer_reference: number | string
  loyer_reference_majore: number | string
  complement_loyer: number | string
  complement_loyer_justification: string

  zone_tendue: boolean

  type_charges: string // provisions/periodique/forfait/absence
  montant_charges: number | string
  modalite_revision_forfait: string

  assurance_colocataires: boolean
  assurance_montant: number | string
  assurance_frequence: string // annuel/mensuel

  trimestre_reference_irl: string
  date_revision_loyer: string // anniversaire/premier_mois/autre
  date_revision_personnalisee: string
  ancien_locataire_duree: string // moins_18_mois/plus_18_mois/premiere_location
  dernier_loyer_ancien: number | string
  date_dernier_loyer: Date | null
  date_revision_dernier_loyer: Date | null

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
  mode_paiement_loyer: string

  // === CLAUSES ===
  clauses: {
    [key: string]: ClauseState
  }

  mise_disposition_meubles: string

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
  const [leaseTemplates, setLeaseTemplates] = useState<LeaseTemplate[]>([])

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

    personne_morale_denomination: "",
    personne_morale_mandataire_nom: "",
    personne_morale_mandataire_adresse: "",

    // === PARTIES - LOCATAIRE ===
    locataires: [],

    // === LOGEMENT DÉTAILLÉ ===
    nombre_pieces: "",
    surface_habitable: "",
    adresse_logement: "",
    complement_adresse: "",
    performance_dpe: "D",
    type_habitat: "immeuble_collectif",
    regime_juridique: "copropriete",
    destination_locaux: "usage_habitation",
    production_chauffage: "individuel",
    production_eau_chaude: "individuelle",

    autres_parties_types: [],
    autres_parties_autres: "",
    equipements_logement_types: [],
    equipements_logement_autres: "",
    locaux_privatifs_types: [],
    cave_numero: "",
    parking_numero: "",
    garage_numero: "",
    locaux_privatifs_autres: "",
    locaux_communs_types: [],
    locaux_communs_autres: "",
    equipement_technologies_types: [],

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
    mode_paiement_loyer: "virement",

    // === CLAUSES ===
    clauses: {},
    mise_disposition_meubles: "",

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
    { value: "autres", label: "Autres" },
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

  const trimestreIRLOptions = [
    { value: "2024-T1", label: "1er trimestre 2024 - 142,95" },
    { value: "2024-T2", label: "2e trimestre 2024 - 143,47" },
    { value: "2024-T3", label: "3e trimestre 2024 - 144,01" },
    { value: "2024-T4", label: "4e trimestre 2024 - 144,53" },
  ]

  const clauseCategories = [
    { key: "clause_resolutoire", label: "Clause résolutoire" },
    { key: "clause_solidarite", label: "Clause de solidarité" },
    { key: "visites_relouer_vendre", label: "Visites pour relouer ou vendre" },
    { key: "animaux_domestiques", label: "Animaux domestiques" },
    { key: "entretien_appareils", label: "Entretien annuel des appareils" },
    { key: "degradations_locataire", label: "Dégradations du locataire" },
    { key: "renonciation_regularisation", label: "Renonciation à la régularisation" },
    { key: "travaux_bailleur", label: "Travaux bailleur en cours de bail" },
    { key: "travaux_locataire", label: "Travaux locataire en cours de bail" },
    { key: "travaux_entre_locataires", label: "Travaux entre deux locataires" },
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

      const [templatesResponse, clausesResponse, propertiesResponse] = await Promise.all([
        fetch("/api/admin/lease-templates"),
        fetch("/api/lease-clauses"),
        fetch(`/api/properties/owner?owner_id=${currentUser.id}`),
      ])

      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json()
        setLeaseTemplates(templatesData.templates || [])
      }

      if (clausesResponse.ok) {
        const clausesData = await clausesResponse.json()
        setLeaseClauses(clausesData.clauses || [])
        const initialClauses: { [key: string]: ClauseState } = {}
        clauseCategories.forEach((category) => {
          const defaultClause = clausesData.clauses?.find(
            (c: LeaseClause) => c.category === category.key && c.is_default && c.is_active,
          )
          initialClauses[category.key] = {
            enabled: !!defaultClause,
            text: defaultClause?.clause_text || "",
            clauseId: defaultClause?.id,
          }
        })
        setFormData((prev) => ({ ...prev, clauses: initialClauses }))
      }

      if (propertiesResponse.ok) {
        const propertiesData = await propertiesResponse.json()
        setProperties(propertiesData.properties || [])
      }

      if (applicationId) {
        const applicationResponse = await fetch(`/api/applications/${applicationId}`)
        if (applicationResponse.ok) {
          const applicationData = await applicationResponse.json()
          setApplication(applicationData.application)
          if (applicationData.application) {
            await prefillFormFromApplication(applicationData.application, currentUser)
          }
        }
      } else {
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
      bailleur_nom_prenom: `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim(),
      bailleur_email: currentUser.email || "",
      bailleur_telephone: currentUser.phone || "",
      bailleur_adresse: currentUser.address || "",
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
      nombre_pieces: property?.rooms || "",
      surface_habitable: property?.surface || "",
      adresse_logement: property?.address || "",
      complement_adresse: property?.complement_address || "",
      loyer_mensuel: property?.price || "",
      montant_charges: property?.charges_amount || "0",
      depot_garantie: property?.security_deposit || property?.price || "",
      duree_contrat: property?.furnished ? 12 : 36,
    }))

    if (tenant) {
      setTenants([tenant])
    }
  }

  const handleInputChange = useCallback(
    (field: keyof LeaseFormData, value: any) => {
      setFormData((prev) => {
        const newData = { ...prev, [field]: value }
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
        }
        return newData
      })
    },
    [properties, tenants],
  )

  const handleMultiSelectChange = (field: keyof LeaseFormData, value: string, checked: boolean) => {
    setFormData((prev) => {
      const currentValues = (prev[field] as string[]) || []
      const newValues = checked ? [...currentValues, value] : currentValues.filter((v) => v !== value)
      return { ...prev, [field]: newValues }
    })
  }

  const handleClauseToggle = (categoryKey: string, enabled: boolean) => {
    setFormData((prev) => ({
      ...prev,
      clauses: { ...prev.clauses, [categoryKey]: { ...prev.clauses[categoryKey], enabled } },
    }))
  }

  const handleClauseTextChange = (categoryKey: string, text: string) => {
    setFormData((prev) => ({
      ...prev,
      clauses: { ...prev.clauses, [categoryKey]: { ...prev.clauses[categoryKey], text } },
    }))
  }

  const addLocataire = () => {
    setFormData((prev) => ({
      ...prev,
      locataires: [...prev.locataires, { prenom: "", nom: "", email: "", date_naissance: null }],
    }))
  }

  const removeLocataire = (index: number) => {
    setFormData((prev) => ({ ...prev, locataires: prev.locataires.filter((_, i) => i !== index) }))
  }

  const updateLocataire = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      locataires: prev.locataires.map((loc, i) => (i === index ? { ...loc, [field]: value } : loc)),
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
          pour_locataire: prev.locataires[0] ? `${prev.locataires[0].prenom} ${prev.locataires[0].nom}` : "",
        },
      ],
    }))
  }

  const removeGarant = (index: number) => {
    setFormData((prev) => ({ ...prev, garants: prev.garants.filter((_, i) => i !== index) }))
  }

  const updateGarant = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      garants: prev.garants.map((g, i) => (i === index ? { ...g, [field]: value } : g)),
    }))
  }

  const generatePreview = useCallback(() => {
    const template = leaseTemplates.find((t) => t.lease_type === formData.lease_type && t.is_default && t.is_active)
    if (!template) {
      setPreviewContent(`<div class="p-6 bg-white text-center text-gray-500"><p>Aucun template trouvé.</p></div>`)
      return
    }

    const formatList = (types: string[], details: { [key: string]: string }, autres: string) => {
      const list = types.map((type) => {
        if (details[type]) return `${type.charAt(0).toUpperCase() + type.slice(1)} (N° ${details[type]})`
        return type.charAt(0).toUpperCase() + type.slice(1)
      })
      if (types.includes("autres") && autres) list.push(autres)
      return list.join(", ") || "N/A"
    }

    const templateData: Record<string, any> = {
      bailleur_nom_prenom: formData.bailleur_nom_prenom || "[Nom bailleur]",
      bailleur_domicile: formData.bailleur_adresse || "[Adresse bailleur]",
      bailleur_email: formData.bailleur_email || "[Email bailleur]",
      bailleur_telephone: formData.bailleur_telephone || "[Tél bailleur]",
      locataire_nom_prenom: formData.locataires.map((l) => `${l.prenom} ${l.nom}`).join(", ") || "[Nom locataire]",
      locataire_email: formData.locataires.map((l) => l.email).join(", ") || "[Email locataire]",
      localisation_logement: formData.adresse_logement || "[Adresse logement]",
      complement_adresse: formData.complement_adresse || "",
      surface_habitable: formData.surface_habitable || "[Surface]",
      nombre_pieces: formData.nombre_pieces || "[Pièces]",
      autres_parties: formatList(formData.autres_parties_types, {}, formData.autres_parties_autres),
      elements_equipements: formatList(formData.equipements_logement_types, {}, formData.equipements_logement_autres),
      locaux_accessoires: formatList(
        formData.locaux_privatifs_types,
        {
          cave: formData.cave_numero,
          parking: formData.parking_numero,
          garage: formData.garage_numero,
        },
        formData.locaux_privatifs_autres,
      ),
      locaux_communs: formatList(formData.locaux_communs_types, {}, formData.locaux_communs_autres),
      equipement_technologies: formData.equipement_technologies_types.join(", ") || "N/A",
      date_prise_effet: formData.date_entree
        ? format(formData.date_entree, "dd/MM/yyyy", { locale: fr })
        : "[Date début]",
      duree_contrat: `${formData.duree_contrat || "[Durée]"} mois`,
      montant_loyer_mensuel: formData.loyer_mensuel || "[Loyer]",
      montant_provisions_charges: formData.montant_charges || "0",
      montant_depot_garantie: formData.depot_garantie || "[Dépôt]",
      ...Object.fromEntries(
        Object.entries(formData.clauses).map(([key, value]) => [key, value.enabled ? value.text : ""]),
      ),
    }

    let compiledContent = template.template_content
    Object.entries(templateData).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g")
      compiledContent = compiledContent.replace(regex, String(value))
    })
    compiledContent = compiledContent.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, content) =>
      templateData[key] ? content : "",
    )
    const formattedHTML = compiledContent
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, "<br>")
      .replace(/^/, '<p class="mb-4">')
      .replace(/$/, "</p>")
      .replace(/<p class="mb-4"><\/p>/g, "")
    setPreviewContent(`<div class="prose prose-sm max-w-none p-6 bg-white">${formattedHTML}</div>`)
  }, [formData, leaseTemplates])

  useEffect(() => {
    if (formData.property_id && formData.locataires.length > 0 && leaseTemplates.length > 0) {
      generatePreview()
    }
  }, [formData, leaseTemplates, generatePreview])

  const validateStep = useCallback(
    (step: number): boolean => {
      switch (step) {
        case 1:
          return !!(formData.property_id && formData.tenant_id)
        case 2:
          if (formData.owner_type === "individual") return !!(formData.bailleur_nom_prenom && formData.bailleur_email)
          if (formData.owner_type === "sci") return !!(formData.sci_denomination && formData.sci_mandataire_nom)
          if (formData.owner_type === "company")
            return !!(formData.personne_morale_denomination && formData.personne_morale_mandataire_nom)
          return false
        case 3:
          return !!(formData.adresse_logement && formData.nombre_pieces && formData.surface_habitable)
        case 4:
          return !!(formData.loyer_mensuel && formData.depot_garantie)
        case 5:
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
      for (let step = 1; step <= 5; step++) {
        if (!validateStep(step)) {
          toast.error(`Veuillez compléter l'étape ${step}`)
          setCurrentStep(step)
          return
        }
      }

      const endDate =
        formData.date_entree && formData.duree_contrat
          ? new Date(
              new Date(formData.date_entree).setMonth(
                new Date(formData.date_entree).getMonth() + Number(formData.duree_contrat),
              ),
            )
          : null

      const leaseData = {
        property_id: formData.property_id,
        tenant_id: formData.tenant_id,
        owner_id: user.id,
        start_date: formData.date_entree?.toISOString().split("T")[0],
        end_date: endDate?.toISOString().split("T")[0],
        monthly_rent: Number(formData.loyer_mensuel) || 0,
        charges: Number(formData.montant_charges) || 0,
        deposit_amount: Number(formData.depot_garantie) || 0,
        lease_type: formData.lease_type,
        application_id: applicationId || undefined,
        bailleur_nom_prenom: formData.bailleur_nom_prenom,
        bailleur_email: formData.bailleur_email,
        bailleur_telephone: formData.bailleur_telephone,
        bailleur_domicile: formData.bailleur_adresse,
        mandataire_represente: formData.mandataire_represente,
        mandataire_nom: formData.mandataire_nom,
        mandataire_adresse: formData.mandataire_adresse,
        mandataire_activite: formData.mandataire_activite,
        mandataire_carte_pro: formData.mandataire_carte_pro,
        mandataire_garant_nom: formData.mandataire_garant_nom,
        mandataire_garant_adresse: formData.mandataire_garant_adresse,
        sci_denomination: formData.sci_denomination,
        sci_mandataire_nom: formData.sci_mandataire_nom,
        sci_mandataire_adresse: formData.sci_mandataire_adresse,
        personne_morale_denomination: formData.personne_morale_denomination,
        personne_morale_mandataire_nom: formData.personne_morale_mandataire_nom,
        personne_morale_mandataire_adresse: formData.personne_morale_mandataire_adresse,
        nombre_pieces: Number(formData.nombre_pieces) || null,
        surface_habitable: Number(formData.surface_habitable) || null,
        adresse_logement: formData.adresse_logement,
        complement_adresse: formData.complement_adresse,
        performance_dpe: formData.performance_dpe,
        type_habitat: formData.type_habitat,
        regime_juridique: formData.regime_juridique,
        destination_locaux: formData.destination_locaux,
        production_chauffage: formData.production_chauffage,
        production_eau_chaude: formData.production_eau_chaude,
        autres_parties_types: formData.autres_parties_types,
        autres_parties_autres: formData.autres_parties_autres,
        equipements_logement_types: formData.equipements_logement_types,
        equipements_logement_autres: formData.equipements_logement_autres,
        locaux_privatifs_types: formData.locaux_privatifs_types,
        cave_numero: formData.cave_numero,
        parking_numero: formData.parking_numero,
        garage_numero: formData.garage_numero,
        locaux_privatifs_autres: formData.locaux_privatifs_autres,
        locaux_communs_types: formData.locaux_communs_types,
        locaux_communs_autres: formData.locaux_communs_autres,
        equipement_technologies_types: formData.equipement_technologies_types,
        identifiant_fiscal: formData.identifiant_fiscal,
        zone_encadree: formData.zone_encadree,
        loyer_reference: Number(formData.loyer_reference) || null,
        loyer_reference_majore: Number(formData.loyer_reference_majore) || null,
        complement_loyer: Number(formData.complement_loyer) || null,
        complement_loyer_justification: formData.complement_loyer_justification,
        zone_tendue: formData.zone_tendue,
        type_charges: formData.type_charges,
        modalite_revision_forfait: formData.modalite_revision_forfait,
        assurance_colocataires: formData.assurance_colocataires,
        assurance_montant: Number(formData.assurance_montant) || null,
        assurance_frequence: formData.assurance_frequence,
        trimestre_reference_irl: formData.trimestre_reference_irl,
        date_revision_loyer: formData.date_revision_loyer,
        date_revision_personnalisee: formData.date_revision_personnalisee,
        ancien_locataire_duree: formData.ancien_locataire_duree,
        dernier_loyer_ancien: Number(formData.dernier_loyer_ancien) || null,
        date_dernier_loyer: formData.date_dernier_loyer?.toISOString().split("T")[0],
        date_revision_dernier_loyer: formData.date_revision_dernier_loyer?.toISOString().split("T")[0],
        estimation_depenses_energie_min: Number(formData.estimation_depenses_energie_min) || null,
        estimation_depenses_energie_max: Number(formData.estimation_depenses_energie_max) || null,
        annee_reference_energie: formData.annee_reference_energie,
        duree_contrat: Number(formData.duree_contrat) || null,
        contrat_duree_reduite: formData.contrat_duree_reduite,
        raison_duree_reduite: formData.raison_duree_reduite,
        jour_paiement_loyer: formData.jour_paiement_loyer,
        paiement_avance: formData.paiement_avance,
        mode_paiement_loyer: formData.mode_paiement_loyer,
        mise_disposition_meubles: formData.mise_disposition_meubles,
        honoraires_professionnel: formData.honoraires_professionnel,
        honoraires_locataire_visite: Number(formData.honoraires_locataire_visite) || null,
        plafond_honoraires_locataire: Number(formData.plafond_honoraires_locataire) || null,
        honoraires_bailleur_visite: Number(formData.honoraires_bailleur_visite) || null,
        etat_lieux_professionnel: formData.etat_lieux_professionnel,
        honoraires_locataire_etat_lieux: Number(formData.honoraires_locataire_etat_lieux) || null,
        plafond_honoraires_etat_lieux: Number(formData.plafond_honoraires_etat_lieux) || null,
        honoraires_bailleur_etat_lieux: Number(formData.honoraires_bailleur_etat_lieux) || null,
        autres_prestations: formData.autres_prestations,
        details_autres_prestations: formData.details_autres_prestations,
        honoraires_autres_prestations: Number(formData.honoraires_autres_prestations) || null,
        franchise_loyer: formData.franchise_loyer,
        clause_libre: formData.clause_libre,
        metadata: {
          form_version: "v12_dynamic_fields",
          locataires: formData.locataires,
          garants: formData.garants,
          clauses: formData.clauses,
        },
      }

      const response = await fetch("/api/leases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leaseData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Erreur ${response.status}`)
      }

      const data = await response.json()
      toast.success("Bail créé avec succès ! Vous pouvez maintenant ajouter les annexes.")
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
      <div className="container mx-auto py-6 flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const steps = [
    { id: 1, title: "Sélection", icon: User, description: "Bien et type de bail" },
    { id: 2, title: "Parties", icon: User, description: "Bailleur et locataires" },
    { id: 3, title: "Logement", icon: Home, description: "Détails du bien" },
    { id: 4, title: "Financier", icon: Euro, description: "Loyer et charges" },
    { id: 5, title: "Durée", icon: Clock, description: "Période et échéances" },
    { id: 6, title: "Clauses", icon: FileCheck, description: "Clauses du contrat" },
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
      <div/>
      <PageHeader title="Création d'un nouveau bail" description="Assistant de création de contrat de location" />

      <div className="mt-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step) => (
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
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {currentStepData && <currentStepData.icon className="h-5 w-5" />}
                  {currentStepData?.title} - {currentStepData?.description}
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                          {properties.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.title} - {p.address}
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
                          {tenants.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.first_name} {t.last_name} - {t.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
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
                    <div className="grid md:grid-cols-2 gap-4">
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
                {currentStep === 2 && (
                  <div className="space-y-6">
                    {formData.owner_type === "individual" && (
                      <div>
                        <h3 className="text-lg font-medium mb-4">Bailleur - Personne physique</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          <Input
                            value={formData.bailleur_nom_prenom}
                            onChange={(e) => handleInputChange("bailleur_nom_prenom", e.target.value)}
                            placeholder="Nom et prénom *"
                          />
                          <Input
                            type="email"
                            value={formData.bailleur_email}
                            onChange={(e) => handleInputChange("bailleur_email", e.target.value)}
                            placeholder="Email *"
                          />
                          <Input
                            value={formData.bailleur_telephone}
                            onChange={(e) => handleInputChange("bailleur_telephone", e.target.value)}
                            placeholder="Téléphone"
                          />
                          <Input
                            value={formData.bailleur_adresse}
                            onChange={(e) => handleInputChange("bailleur_adresse", e.target.value)}
                            placeholder="Adresse"
                          />
                        </div>
                      </div>
                    )}
                    {formData.owner_type === "sci" && (
                      <div>
                        <h3 className="text-lg font-medium mb-4">Bailleur - SCI Familiale</h3>
                        <div className="space-y-4">
                          <Input
                            value={formData.sci_denomination}
                            onChange={(e) => handleInputChange("sci_denomination", e.target.value)}
                            placeholder="Dénomination de la SCI *"
                          />
                          <Input
                            value={formData.sci_mandataire_nom}
                            onChange={(e) => handleInputChange("sci_mandataire_nom", e.target.value)}
                            placeholder="Mandataire représentant *"
                          />
                          <Input
                            value={formData.sci_mandataire_adresse}
                            onChange={(e) => handleInputChange("sci_mandataire_adresse", e.target.value)}
                            placeholder="Adresse du mandataire"
                          />
                        </div>
                      </div>
                    )}
                    {formData.owner_type === "company" && (
                      <div>
                        <h3 className="text-lg font-medium mb-4">Bailleur - Autre personne morale</h3>
                        <div className="space-y-4">
                          <Input
                            value={formData.personne_morale_denomination}
                            onChange={(e) => handleInputChange("personne_morale_denomination", e.target.value)}
                            placeholder="Dénomination *"
                          />
                          <Input
                            value={formData.personne_morale_mandataire_nom}
                            onChange={(e) => handleInputChange("personne_morale_mandataire_nom", e.target.value)}
                            placeholder="Mandataire représentant *"
                          />
                          <Input
                            value={formData.personne_morale_mandataire_adresse}
                            onChange={(e) => handleInputChange("personne_morale_mandataire_adresse", e.target.value)}
                            placeholder="Adresse du mandataire"
                          />
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">Locataires</h3>
                        <Button type="button" variant="outline" size="sm" onClick={addLocataire}>
                          <Plus className="h-4 w-4 mr-2" /> Ajouter
                        </Button>
                      </div>
                      {formData.locataires.map((loc, index) => (
                        <div key={index} className="p-4 border rounded-lg mb-4">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-medium">Locataire {index + 1}</h4>
                            {formData.locataires.length > 1 && (
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeLocataire(index)}>
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <Input
                              value={loc.prenom}
                              onChange={(e) => updateLocataire(index, "prenom", e.target.value)}
                              placeholder="Prénom *"
                            />
                            <Input
                              value={loc.nom}
                              onChange={(e) => updateLocataire(index, "nom", e.target.value)}
                              placeholder="Nom *"
                            />
                            <Input
                              type="email"
                              value={loc.email}
                              onChange={(e) => updateLocataire(index, "email", e.target.value)}
                              placeholder="Email *"
                            />
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !loc.date_naissance && "text-muted-foreground",
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {loc.date_naissance
                                    ? format(loc.date_naissance, "dd/MM/yyyy", { locale: fr })
                                    : "Date de naissance"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={loc.date_naissance || undefined}
                                  onSelect={(date) => updateLocataire(index, "date_naissance", date)}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        value={formData.adresse_logement}
                        onChange={(e) => handleInputChange("adresse_logement", e.target.value)}
                        placeholder="Adresse du logement *"
                      />
                      <Input
                        value={formData.complement_adresse}
                        onChange={(e) => handleInputChange("complement_adresse", e.target.value)}
                        placeholder="Complément d'adresse"
                      />
                      <Input
                        type="number"
                        value={formData.nombre_pieces}
                        onChange={(e) => handleInputChange("nombre_pieces", e.target.value)}
                        placeholder="Nombre de pièces *"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.surface_habitable}
                        onChange={(e) => handleInputChange("surface_habitable", e.target.value)}
                        placeholder="Surface habitable (m²) *"
                      />
                    </div>
                    <div>
                      <Label>Autres parties du logement</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                        {autresPartiesOptions.map((option) => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`autres_parties_${option.value}`}
                              checked={formData.autres_parties_types.includes(option.value)}
                              onCheckedChange={(checked) =>
                                handleMultiSelectChange("autres_parties_types", option.value, checked as boolean)
                              }
                            />
                            <Label htmlFor={`autres_parties_${option.value}`} className="text-sm">
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {formData.autres_parties_types.includes("autres") && (
                        <Input
                          className="mt-2"
                          value={formData.autres_parties_autres}
                          onChange={(e) => handleInputChange("autres_parties_autres", e.target.value)}
                          placeholder="Précisions (Autres parties)"
                        />
                      )}
                    </div>
                    <div>
                      <Label>Équipements du logement</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                        {equipementsLogementOptions.map((option) => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`equipements_logement_${option.value}`}
                              checked={formData.equipements_logement_types.includes(option.value)}
                              onCheckedChange={(checked) =>
                                handleMultiSelectChange("equipements_logement_types", option.value, checked as boolean)
                              }
                            />
                            <Label htmlFor={`equipements_logement_${option.value}`} className="text-sm">
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {formData.equipements_logement_types.includes("autres") && (
                        <Input
                          className="mt-2"
                          value={formData.equipements_logement_autres}
                          onChange={(e) => handleInputChange("equipements_logement_autres", e.target.value)}
                          placeholder="Autres équipements"
                        />
                      )}
                    </div>
                    <div>
                      <Label>Équipements, locaux, services à usage privatif</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                        {equipementsPrivatifsOptions.map((option) => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`locaux_privatifs_${option.value}`}
                              checked={formData.locaux_privatifs_types.includes(option.value)}
                              onCheckedChange={(checked) =>
                                handleMultiSelectChange("locaux_privatifs_types", option.value, checked as boolean)
                              }
                            />
                            <Label htmlFor={`locaux_privatifs_${option.value}`} className="text-sm">
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {formData.locaux_privatifs_types.includes("cave") && (
                        <Input
                          className="mt-2"
                          value={formData.cave_numero}
                          onChange={(e) => handleInputChange("cave_numero", e.target.value)}
                          placeholder="Numéro de la cave"
                        />
                      )}
                      {formData.locaux_privatifs_types.includes("parking") && (
                        <Input
                          className="mt-2"
                          value={formData.parking_numero}
                          onChange={(e) => handleInputChange("parking_numero", e.target.value)}
                          placeholder="Numéro de la place de parking"
                        />
                      )}
                      {formData.locaux_privatifs_types.includes("garage") && (
                        <Input
                          className="mt-2"
                          value={formData.garage_numero}
                          onChange={(e) => handleInputChange("garage_numero", e.target.value)}
                          placeholder="Numéro du garage"
                        />
                      )}
                      {formData.locaux_privatifs_types.includes("autres") && (
                        <Input
                          className="mt-2"
                          value={formData.locaux_privatifs_autres}
                          onChange={(e) => handleInputChange("locaux_privatifs_autres", e.target.value)}
                          placeholder="Autres locaux privatifs"
                        />
                      )}
                    </div>
                    <div>
                      <Label>Équipements, locaux, services à usage commun</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                        {equipementsCommunsOptions.map((option) => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`locaux_communs_${option.value}`}
                              checked={formData.locaux_communs_types.includes(option.value)}
                              onCheckedChange={(checked) =>
                                handleMultiSelectChange("locaux_communs_types", option.value, checked as boolean)
                              }
                            />
                            <Label htmlFor={`locaux_communs_${option.value}`} className="text-sm">
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {formData.locaux_communs_types.includes("autres") && (
                        <Input
                          className="mt-2"
                          value={formData.locaux_communs_autres}
                          onChange={(e) => handleInputChange("locaux_communs_autres", e.target.value)}
                          placeholder="Autres locaux communs"
                        />
                      )}
                    </div>
                  </div>
                )}
               {/* Étape 4: Financier */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Loyer et charges</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="loyer_mensuel">Loyer mensuel (€) *</Label>
                          <Input
                            id="loyer_mensuel"
                            type="number"
                            step="0.01"
                            value={formData.loyer_mensuel}
                            onChange={(e) => handleInputChange("loyer_mensuel", e.target.value)}
                            placeholder="1200.00"
                          />
                        </div>
                        <div>
                          <Label htmlFor="montant_charges">Charges (€)</Label>
                          <Input
                            id="montant_charges"
                            type="number"
                            step="0.01"
                            value={formData.montant_charges}
                            onChange={(e) => handleInputChange("montant_charges", e.target.value)}
                            placeholder="150.00"
                          />
                        </div>
                        <div>
                          <Label htmlFor="depot_garantie">Dépôt de garantie (€) *</Label>
                          <Input
                            id="depot_garantie"
                            type="number"
                            step="0.01"
                            value={formData.depot_garantie}
                            onChange={(e) => handleInputChange("depot_garantie", e.target.value)}
                            placeholder="1200.00"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Zone encadrée */}
                    <div>
                      <div className="flex items-center space-x-2 mb-4">
                        <Switch
                          id="zone_encadree"
                          checked={formData.zone_encadree}
                          onCheckedChange={(checked) => handleInputChange("zone_encadree", checked)}
                        />
                        <Label htmlFor="zone_encadree">Logement situé en zone d'encadrement des loyers</Label>
                      </div>

                      {formData.zone_encadree && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                          <div>
                            <Label htmlFor="loyer_reference">Loyer de référence (€)</Label>
                            <Input
                              id="loyer_reference"
                              type="number"
                              step="0.01"
                              value={formData.loyer_reference}
                              onChange={(e) => handleInputChange("loyer_reference", e.target.value)}
                              placeholder="1000.00"
                            />
                          </div>
                          <div>
                            <Label htmlFor="loyer_reference_majore">Loyer de référence majoré (€)</Label>
                            <Input
                              id="loyer_reference_majore"
                              type="number"
                              step="0.01"
                              value={formData.loyer_reference_majore}
                              onChange={(e) => handleInputChange("loyer_reference_majore", e.target.value)}
                              placeholder="1200.00"
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
                          <div>
                            <Label htmlFor="complement_loyer_justification">Justification du complément</Label>
                            <Textarea
                              id="complement_loyer_justification"
                              value={formData.complement_loyer_justification}
                              onChange={(e) => handleInputChange("complement_loyer_justification", e.target.value)}
                              placeholder="Caractéristiques exceptionnelles du logement..."
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
                      <Label htmlFor="zone_tendue">Logement situé en zone tendue</Label>
                    </div>

                    {/* Type de charges */}
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
                          <SelectItem value="provisions">Provisions pour charges</SelectItem>
                          <SelectItem value="periodique">Règlement périodique</SelectItem>
                          <SelectItem value="forfait">Forfait de charges</SelectItem>
                          <SelectItem value="absence">Absence de charges</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.type_charges === "forfait" && (
                      <div>
                        <Label htmlFor="modalite_revision_forfait">Modalité de révision du forfait</Label>
                        <Textarea
                          id="modalite_revision_forfait"
                          value={formData.modalite_revision_forfait}
                          onChange={(e) => handleInputChange("modalite_revision_forfait", e.target.value)}
                          placeholder="Modalités de révision du forfait de charges..."
                        />
                      </div>
                    )}

                    {/* Assurance colocataires */}
                    {formData.bail_type === "colocation" && (
                      <div>
                        <div className="flex items-center space-x-2 mb-4">
                          <Switch
                            id="assurance_colocataires"
                            checked={formData.assurance_colocataires}
                            onCheckedChange={(checked) => handleInputChange("assurance_colocataires", checked)}
                          />
                          <Label htmlFor="assurance_colocataires">Assurance pour les colocataires</Label>
                        </div>

                        {formData.assurance_colocataires && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                            <div>
                              <Label htmlFor="assurance_montant">Montant de l'assurance (€)</Label>
                              <Input
                                id="assurance_montant"
                                type="number"
                                step="0.01"
                                value={formData.assurance_montant}
                                onChange={(e) => handleInputChange("assurance_montant", e.target.value)}
                                placeholder="50.00"
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
                                  <SelectItem value="mensuel">Mensuel</SelectItem>
                                  <SelectItem value="annuel">Annuel</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Indexation */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Indexation du loyer</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="trimestre_reference_irl">Trimestre de référence IRL</Label>
                          <Select
                            value={formData.trimestre_reference_irl}
                            onValueChange={(value) => handleInputChange("trimestre_reference_irl", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un trimestre" />
                            </SelectTrigger>
                            <SelectContent>
                              {trimestreIRLOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                              <SelectItem value="anniversaire">À l'anniversaire du contrat</SelectItem>
                              <SelectItem value="premier_mois">Le 1er du mois</SelectItem>
                              <SelectItem value="autre">Autre date</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {formData.date_revision_loyer === "autre" && (
                        <div className="mt-4">
                          <Label htmlFor="date_revision_personnalisee">Date de révision personnalisée</Label>
                          <Input
                            id="date_revision_personnalisee"
                            value={formData.date_revision_personnalisee}
                            onChange={(e) => handleInputChange("date_revision_personnalisee", e.target.value)}
                            placeholder="Le 15 de chaque mois"
                          />
                        </div>
                      )}
                    </div>

                    {/* Ancien locataire */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Ancien locataire</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="ancien_locataire_duree">Durée d'occupation de l'ancien locataire</Label>
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
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="dernier_loyer_ancien">Dernier loyer de l'ancien locataire (€)</Label>
                          <Input
                            id="dernier_loyer_ancien"
                            type="number"
                            step="0.01"
                            value={formData.dernier_loyer_ancien}
                            onChange={(e) => handleInputChange("dernier_loyer_ancien", e.target.value)}
                            placeholder="1100.00"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <Label htmlFor="date_dernier_loyer">Date du dernier loyer</Label>
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
                    </div>

                    {/* Dépenses énergie */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Estimation des dépenses d'énergie</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="estimation_depenses_energie_min">Montant minimum (€/an)</Label>
                          <Input
                            id="estimation_depenses_energie_min"
                            type="number"
                            step="0.01"
                            value={formData.estimation_depenses_energie_min}
                            onChange={(e) => handleInputChange("estimation_depenses_energie_min", e.target.value)}
                            placeholder="800.00"
                          />
                        </div>
                        <div>
                          <Label htmlFor="estimation_depenses_energie_max">Montant maximum (€/an)</Label>
                          <Input
                            id="estimation_depenses_energie_max"
                            type="number"
                            step="0.01"
                            value={formData.estimation_depenses_energie_max}
                            onChange={(e) => handleInputChange("estimation_depenses_energie_max", e.target.value)}
                            placeholder="1200.00"
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
                    <div>
                      <h3 className="text-lg font-medium mb-4">Durée du contrat</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="date_entree">Date d'entrée dans les lieux *</Label>
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
                          <Label htmlFor="duree_contrat">Durée du contrat (mois) *</Label>
                          <Input
                            id="duree_contrat"
                            type="number"
                            value={formData.duree_contrat}
                            onChange={(e) => handleInputChange("duree_contrat", e.target.value)}
                            placeholder={formData.lease_type === "furnished" ? "12" : "36"}
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            {formData.lease_type === "furnished"
                              ? "Durée standard pour un logement meublé : 12 mois"
                              : "Durée standard pour un logement vide : 36 mois"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Contrat à durée réduite */}
                    <div>
                      <div className="flex items-center space-x-2 mb-4">
                        <Switch
                          id="contrat_duree_reduite"
                          checked={formData.contrat_duree_reduite}
                          onCheckedChange={(checked) => handleInputChange("contrat_duree_reduite", checked)}
                        />
                        <Label htmlFor="contrat_duree_reduite">Contrat à durée réduite</Label>
                      </div>

                      {formData.contrat_duree_reduite && (
                        <div>
                          <Label htmlFor="raison_duree_reduite">Raison de la durée réduite</Label>
                          <Textarea
                            id="raison_duree_reduite"
                            value={formData.raison_duree_reduite}
                            onChange={(e) => handleInputChange("raison_duree_reduite", e.target.value)}
                            placeholder="Motif justifiant la durée réduite du contrat..."
                          />
                        </div>
                      )}
                    </div>

                    {/* Modalités de paiement - DÉPLACÉ ICI */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Modalités de paiement</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="jour_paiement_loyer">Jour de paiement du loyer</Label>
                          <Select
                            value={formData.jour_paiement_loyer}
                            onValueChange={(value) => handleInputChange("jour_paiement_loyer", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Le 1er du mois</SelectItem>
                              <SelectItem value="5">Le 5 du mois</SelectItem>
                              <SelectItem value="10">Le 10 du mois</SelectItem>
                              <SelectItem value="15">Le 15 du mois</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="paiement_avance">Modalité de paiement</Label>
                          <Select
                            value={formData.paiement_avance ? "avance" : "terme_echu"}
                            onValueChange={(value) => handleInputChange("paiement_avance", value === "avance")}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="avance">Payable d'avance</SelectItem>
                              <SelectItem value="terme_echu">Payable à terme échu</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Mode de paiement - DÉPLACÉ ICI */}
                      <div className="mt-4">
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
                            <SelectItem value="cheque">Chèque</SelectItem>
                            <SelectItem value="prelevement">Prélèvement automatique</SelectItem>
                            <SelectItem value="especes">Espèces</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Garants */}
                    {formData.guarantee_type === "guarantor" && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium">Garants</h3>
                          <Button type="button" variant="outline" size="sm" onClick={addGarant}>
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter un garant
                          </Button>
                        </div>

                        {formData.garants.map((garant, index) => (
                          <div key={index} className="p-4 border rounded-lg mb-4">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-medium">Garant {index + 1}</h4>
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeGarant(index)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor={`garant_prenom_${index}`}>Prénom</Label>
                                <Input
                                  id={`garant_prenom_${index}`}
                                  value={garant.prenom}
                                  onChange={(e) => updateGarant(index, "prenom", e.target.value)}
                                  placeholder="Marie"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`garant_nom_${index}`}>Nom</Label>
                                <Input
                                  id={`garant_nom_${index}`}
                                  value={garant.nom}
                                  onChange={(e) => updateGarant(index, "nom", e.target.value)}
                                  placeholder="Martin"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`garant_adresse_${index}`}>Adresse</Label>
                                <Input
                                  id={`garant_adresse_${index}`}
                                  value={garant.adresse}
                                  onChange={(e) => updateGarant(index, "adresse", e.target.value)}
                                  placeholder="456 avenue des Champs, 75008 Paris"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`garant_pour_locataire_${index}`}>Pour le locataire</Label>
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
                              <div>
                                <Label htmlFor={`garant_date_fin_${index}`}>Date de fin d'engagement</Label>
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
                                <Label htmlFor={`garant_montant_max_${index}`}>Montant max d'engagement (€)</Label>
                                <Input
                                  id={`garant_montant_max_${index}`}
                                  type="number"
                                  step="0.01"
                                  value={garant.montant_max_engagement}
                                  onChange={(e) => updateGarant(index, "montant_max_engagement", e.target.value)}
                                  placeholder="5000.00"
                                />
                              </div>
                            </div>
                          </div>
                        ))}

                        {formData.garants.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <p>Aucun garant ajouté</p>
                            <Button type="button" variant="outline" onClick={addGarant} className="mt-2 bg-transparent">
                              <Plus className="h-4 w-4 mr-2" />
                              Ajouter le premier garant
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Étape 6: Clauses */}
                {currentStep === 6 && (
                  <div className="space-y-6">
                    {/* Clauses avec toggle et texte modifiable - TOUTES LES CLAUSES */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Clauses du contrat</h3>
                      <div className="space-y-4">
                        {clauseCategories.map((category) => {
                          const clause = formData.clauses[category.key] || { enabled: false, text: "" }

                          return (
                            <div key={category.key} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <Label htmlFor={`clause_${category.key}`} className="font-medium">
                                    {category.label}
                                  </Label>
                                </div>
                                <Switch
                                  id={`clause_${category.key}`}
                                  checked={clause.enabled}
                                  onCheckedChange={(checked) => handleClauseToggle(category.key, checked)}
                                />
                              </div>

                              {clause.enabled ? (
                                <div className="mt-3">
                                  <Label htmlFor={`clause_text_${category.key}`} className="text-sm">
                                    Texte de la clause
                                  </Label>
                                  <Textarea
                                    id={`clause_text_${category.key}`}
                                    value={clause.text}
                                    onChange={(e) => handleClauseTextChange(category.key, e.target.value)}
                                    placeholder={`Saisir le texte pour ${category.label.toLowerCase()}...`}
                                    className="mt-1"
                                    rows={3}
                                  />
                                </div>
                              ) : (
                                <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-500">Aucune</div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Mise à disposition des meubles (si meublé) */}
                    {formData.lease_type === "furnished" && (
                      <div>
                        <Label htmlFor="mise_disposition_meubles">Mise à disposition des meubles</Label>
                        <Textarea
                          id="mise_disposition_meubles"
                          value={formData.mise_disposition_meubles}
                          onChange={(e) => handleInputChange("mise_disposition_meubles", e.target.value)}
                          placeholder="Modalités de mise à disposition des meubles et équipements..."
                        />
                      </div>
                    )}

                    {/* Honoraires d'agence */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Honoraires d'agence</h3>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="honoraires_professionnel"
                            checked={formData.honoraires_professionnel}
                            onCheckedChange={(checked) => handleInputChange("honoraires_professionnel", checked)}
                          />
                          <Label htmlFor="honoraires_professionnel">
                            Honoraires dus par un professionnel de l'immobilier
                          </Label>
                        </div>

                        {formData.honoraires_professionnel && (
                          <div className="p-4 bg-blue-50 rounded-lg space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="honoraires_locataire_visite">
                                  Honoraires locataire - visite et constitution dossier (€)
                                </Label>
                                <Input
                                  id="honoraires_locataire_visite"
                                  type="number"
                                  step="0.01"
                                  value={formData.honoraires_locataire_visite}
                                  onChange={(e) => handleInputChange("honoraires_locataire_visite", e.target.value)}
                                  placeholder="100.00"
                                />
                              </div>
                              <div>
                                <Label htmlFor="plafond_honoraires_locataire">
                                  Plafond honoraires locataire (€/m²)
                                </Label>
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
                                <Label htmlFor="honoraires_bailleur_visite">
                                  Honoraires bailleur - visite et constitution dossier (€)
                                </Label>
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

                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="etat_lieux_professionnel"
                                checked={formData.etat_lieux_professionnel}
                                onCheckedChange={(checked) => handleInputChange("etat_lieux_professionnel", checked)}
                              />
                              <Label htmlFor="etat_lieux_professionnel">
                                État des lieux réalisé par un professionnel
                              </Label>
                            </div>

                            {formData.etat_lieux_professionnel && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="honoraires_locataire_etat_lieux">
                                    Honoraires locataire - état des lieux (€)
                                  </Label>
                                  <Input
                                    id="honoraires_locataire_etat_lieux"
                                    type="number"
                                    step="0.01"
                                    value={formData.honoraires_locataire_etat_lieux}
                                    onChange={(e) =>
                                      handleInputChange("honoraires_locataire_etat_lieux", e.target.value)
                                    }
                                    placeholder="80.00"
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
                                    Honoraires bailleur - état des lieux (€)
                                  </Label>
                                  <Input
                                    id="honoraires_bailleur_etat_lieux"
                                    type="number"
                                    step="0.01"
                                    value={formData.honoraires_bailleur_etat_lieux}
                                    onChange={(e) =>
                                      handleInputChange("honoraires_bailleur_etat_lieux", e.target.value)
                                    }
                                    placeholder="120.00"
                                  />
                                </div>
                              </div>
                            )}

                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="autres_prestations"
                                checked={formData.autres_prestations}
                                onCheckedChange={(checked) => handleInputChange("autres_prestations", checked)}
                              />
                              <Label htmlFor="autres_prestations">Autres prestations</Label>
                            </div>

                            {formData.autres_prestations && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="details_autres_prestations">Détails des autres prestations</Label>
                                  <Textarea
                                    id="details_autres_prestations"
                                    value={formData.details_autres_prestations}
                                    onChange={(e) => handleInputChange("details_autres_prestations", e.target.value)}
                                    placeholder="Description des autres prestations..."
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="honoraires_autres_prestations">
                                    Honoraires autres prestations (€)
                                  </Label>
                                  <Input
                                    id="honoraires_autres_prestations"
                                    type="number"
                                    step="0.01"
                                    value={formData.honoraires_autres_prestations}
                                    onChange={(e) => handleInputChange("honoraires_autres_prestations", e.target.value)}
                                    placeholder="200.00"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Franchise de loyer */}
                    <div>
                      <Label htmlFor="franchise_loyer">Franchise de loyer</Label>
                      <Textarea
                        id="franchise_loyer"
                        value={formData.franchise_loyer}
                        onChange={(e) => handleInputChange("franchise_loyer", e.target.value)}
                        placeholder="Conditions de franchise de loyer (ex: 1 mois gratuit)..."
                      />
                    </div>

                    {/* Clause libre */}
                    <div>
                      <Label htmlFor="clause_libre">Clause libre</Label>
                      <Textarea
                        id="clause_libre"
                        value={formData.clause_libre}
                        onChange={(e) => handleInputChange("clause_libre", e.target.value)}
                        placeholder="Clause libre personnalisée..."
                      />
                    </div>
					)}
					
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1}>
                  <ChevronLeft className="h-4 w-4 mr-2" /> Précédent
                </Button>
                {currentStep < 6 ? (
                  <Button type="button" onClick={nextStep}>
                    Suivant <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button type="button" onClick={handleSubmit} disabled={saving}>
                    {saving ? "Création..." : "Créer le bail"}
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" /> Aperçu
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)}>
                    {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              {showPreview && (
                <CardContent className="max-h-[600px] overflow-y-auto">
                  {previewContent ? (
                    <div className="text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: previewContent }} />
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <p>L'aperçu s'affichera ici.</p>
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



