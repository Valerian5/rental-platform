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
  mode_paiement_loyer: string // Déplacé ici depuis les clauses

  // === CLAUSES ===
  // Clauses avec toggle et texte modifiable
  clauses: {
    [key: string]: ClauseState
  }

  // Mise à disposition des meubles (si meublé)
  mise_disposition_meubles: string

  // Clauses optionnelles honoraires (avec checkbox)
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
    mode_paiement_loyer: "virement", // Déplacé ici

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

  // Catégories de clauses avec toggle - TOUTES LES CLAUSES
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

      // Charger les templates de bail
      const templatesResponse = await fetch("/api/admin/lease-templates")
      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json()
        setLeaseTemplates(templatesData.templates || [])
      }

      // Charger les clauses de bail
      const clausesResponse = await fetch("/api/lease-clauses")
      if (clausesResponse.ok) {
        const clausesData = await clausesResponse.json()
        setLeaseClauses(clausesData.clauses || [])

        // Initialiser les clauses avec les valeurs par défaut
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

        setFormData((prev) => ({
          ...prev,
          clauses: initialClauses,
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

  const handleClauseToggle = (categoryKey: string, enabled: boolean) => {
    setFormData((prev) => ({
      ...prev,
      clauses: {
        ...prev.clauses,
        [categoryKey]: {
          ...prev.clauses[categoryKey],
          enabled,
        },
      },
    }))
  }

  const handleClauseTextChange = (categoryKey: string, text: string) => {
    setFormData((prev) => ({
      ...prev,
      clauses: {
        ...prev.clauses,
        [categoryKey]: {
          ...prev.clauses[categoryKey],
          text,
        },
      },
    }))
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

  // Fonction pour générer le preview avec le template
  const generatePreview = useCallback(() => {
    // Trouver le template approprié
    const template = leaseTemplates.find((t) => t.lease_type === formData.lease_type && t.is_default && t.is_active)

    if (!template) {
      setPreviewContent(`
        <div class="p-6 bg-white">
          <div class="text-center text-gray-500">
            <p>Aucun template trouvé pour le type de bail sélectionné</p>
          </div>
        </div>
      `)
      return
    }

    // Préparer les données pour le template
const templateData: Record<string, any> = {
  // === PARTIES ===
  bailleur_nom_prenom: formData.bailleur_nom_prenom || "[Nom du bailleur]",
  bailleur_domicile: formData.bailleur_adresse || "[Adresse du bailleur]",
  bailleur_qualite: formData.bailleur_qualite || "Personne physique",
  bailleur_email: formData.bailleur_email || "[Email du bailleur]",
  bailleur_telephone: formData.bailleur_telephone || "[Téléphone du bailleur]",
  nom_bailleur: formData.bailleur_nom_prenom || "[Nom du bailleur]",
  nom_locataire: formData.locataires[0]?.prenom && formData.locataires[0]?.nom
    ? `${formData.locataires[0].prenom} ${formData.locataires[0].nom}` : "[Nom du locataire]",
  locataire_nom_prenom: formData.locataires[0]?.prenom && formData.locataires[0]?.nom
    ? `${formData.locataires[0].prenom} ${formData.locataires[0].nom}` : "[Nom du locataire]",
  locataire_email: formData.locataires[0]?.email || "[Email du locataire]",
  telephone_locataire: "", // à compléter si tu ajoutes ce champ
  locataire_domicile: "",  // à compléter si tu ajoutes ce champ

  // === LOGEMENT ===
  localisation_logement: formData.adresse_logement || "[Adresse du logement]",
  adresse_logement: formData.adresse_logement || "[Adresse du logement]",
  complement_adresse: formData.complement_adresse || "",
  code_postal: "", // à compléter si tu ajoutes ce champ
  ville: "", // à compléter si tu ajoutes ce champ
  type_logement: formData.type_logement || "",
  type_habitat: formData.type_habitat || "",
  regime_juridique: formData.regime_juridique || "",
  surface_habitable: formData.surface_habitable || "[Surface]",
  nombre_pieces: formData.nombre_pieces || "[Pièces]",
  modalite_eau_chaude: formData.modalite_eau_chaude || "",
  modalite_chauffage: formData.modalite_chauffage || "",
  autres_parties: (formData.autres_parties || []).join(", "),
  elements_equipements: (formData.equipements_logement || []).join(", "),
  locaux_accessoires: (formData.equipements_privatifs || []).join(", "),
  locaux_communs: (formData.equipements_communs || []).join(", "),
  equipement_technologies: (formData.equipements_technologies || []).join(", "),
  identifiant_fiscal: formData.identifiant_fiscal || "",
  periode_construction: formData.periode_construction || "",
  niveau_performance_dpe: formData.performance_dpe || "",
  destination_locaux: formData.destination_locaux || "",
  zone_geographique: "", // à compléter si tu ajoutes ce champ

  // === CONDITIONS FINANCIÈRES ===
  montant_loyer_mensuel: formData.loyer_mensuel || "[Loyer]",
  loyer: formData.loyer_mensuel || "[Loyer]",
  charges: formData.montant_charges || "0",
  loyer_cc: formData.loyer_mensuel && formData.montant_charges
    ? (parseFloat(formData.loyer_mensuel) + parseFloat(formData.montant_charges)).toString()
    : "",
  depot_garantie: formData.depot_garantie || "",
  montant_depot_garantie: formData.depot_garantie || "",
  montant_premiere_echeance: formData.loyer_mensuel && formData.montant_charges
    ? (parseFloat(formData.loyer_mensuel) + parseFloat(formData.montant_charges)).toString()
    : "",
  montant_provisions_charges: formData.montant_charges || "0",
  complement_loyer: formData.complement_loyer || "",
  montant_loyer_reference: formData.loyer_reference || "",
  montant_loyer_reference_majore: formData.loyer_reference_majore || "",
  soumis_decret_evolution: formData.zone_encadree ? "Oui" : "Non",
  soumis_loyer_reference: formData.zone_encadree ? "Oui" : "Non",
  infos_dernier_loyer: formData.dernier_loyer_ancien ? formData.dernier_loyer_ancien.toString() : "",
  date_revision: formData.date_revision_loyer || "",
  date_reference_irl: formData.trimestre_reference_irl || "",
  modalite_reglement_charges: formData.type_charges || "",
  modalites_revision_forfait: formData.modalite_revision_forfait || "",
  contribution_economies: "", // à compléter si tu ajoutes ce champ
  periodicite_paiement: "Mensuel", // ou à calculer depuis formData
  paiement_echeance: formData.paiement_avance ? "À échoir" : "À terme échu",
  date_paiement: `le ${formData.jour_paiement_loyer || "1"} de chaque mois`,
  lieu_paiement: formData.mode_paiement_loyer === "virement" ? "Virement bancaire" : formData.mode_paiement_loyer || "",
  reevaluation_loyer: "", // à compléter si tu ajoutes ce champ
  montant_depenses_energie: formData.estimation_depenses_energie_min && formData.estimation_depenses_energie_max
    ? `${formData.estimation_depenses_energie_min} - ${formData.estimation_depenses_energie_max} €/an`
    : "",

  // === DATES ET DURÉE ===
  date_prise_effet: formData.date_entree
    ? format(formData.date_entree, "dd/MM/yyyy", { locale: fr })
    : "[Date début]",
  date_debut: formData.date_entree
    ? format(formData.date_entree, "dd/MM/yyyy", { locale: fr })
    : "[Date début]",
  date_fin: formData.date_entree && formData.duree_contrat
    ? format(
        new Date(
          new Date(formData.date_entree).setMonth(
            new Date(formData.date_entree).getMonth() + parseInt(formData.duree_contrat + "")
          )
        ),
        "dd/MM/yyyy",
        { locale: fr }
      )
    : "[Date fin]",
  duree: formData.duree_contrat || "",
  duree_contrat: formData.duree_contrat || "",
  evenement_duree_reduite: formData.raison_duree_reduite || "",
  usage_prevu: "résidence principale",

  // === CLAUSES ===
  clause_solidarite: formData.clauses?.clause_solidarite?.enabled
    ? formData.clauses?.clause_solidarite?.text || "[Clause solidarité]"
    : "",
  clause_resolutoire: formData.clauses?.clause_resolutoire?.enabled
    ? formData.clauses?.clause_resolutoire?.text || "[Clause résolutoire]"
    : "",
  // Ajoute ici d'autres clauses si tu en as dans formData.clauses...

  clauses_particulieres: formData.clauses_particulieres || "",
  conditions_particulieres: formData.conditions_particulieres || "",
  travaux_amelioration: formData.travaux_amelioration || "",
  majoration_travaux: formData.majoration_travaux || "",
  diminution_travaux: formData.diminution_travaux || "",

  // === HONORAIRES ===
  plafond_honoraires_visite: formData.plafond_honoraires_locataire || "",
  plafond_honoraires_etat_lieux: formData.plafond_honoraires_etat_lieux || "",
  honoraires_bailleur: formData.honoraires_bailleur_visite || "",
  honoraires_locataire: formData.honoraires_locataire_visite || "",

  // === SIGNATURE ===
  ville_signature: formData.ville_signature || "",
  lieu_signature: formData.lieu_signature || formData.ville_signature || "",
  date_signature: formData.date_signature
    ? format(new Date(formData.date_signature), "dd/MM/yyyy", { locale: fr })
    : format(new Date(), "dd/MM/yyyy", { locale: fr }),

  // === ANNEXES ===
  annexe_reglement: formData.annexe_reglement ? "Oui" : "Non",
  annexe_dpe: formData.annexe_dpe ? "Oui" : "Non",
  annexe_plomb: formData.annexe_plomb ? "Oui" : "Non",
  annexe_amiante: formData.annexe_amiante ? "Oui" : "Non",
  annexe_electricite_gaz: formData.annexe_electricite || formData.annexe_gaz ? "Oui" : "Non",
  annexe_risques: formData.annexe_erp ? "Oui" : "Non",
  annexe_notice: formData.annexe_notice_information ? "Oui" : "Non",
  annexe_etat_lieux: formData.annexe_etat_lieux ? "Oui" : "Non",
  annexe_autorisation: formData.annexe_autorisation ? "Oui" : "Non",
  annexe_references_loyers: formData.annexe_references_loyers ? "Oui" : "Non",

      // === VARIABLES SUPPLÉMENTAIRES ===
      soumis_decret_evolution: "Non",
      mode_paiement_loyer:
        formData.payment_mode === "monthly"
          ? "virement mensuel"
          : formData.payment_mode === "quarterly"
            ? "virement trimestriel"
            : "virement",

      // === INFORMATIONS COMPLÉMENTAIRES ===
      complement_adresse: `${formData.postal_code} ${formData.city}`,
      zone_geographique: formData.zone || "[Zone]",
      type_logement:
        formData.property_type === "apartment"
          ? "Appartement"
          : formData.property_type === "house"
            ? "Maison"
            : formData.property_type === "studio"
              ? "Studio"
              : "Logement",

      // === CALCULS AUTOMATIQUES ===
      loyer: formData.rent_amount || "[Loyer]",
      charges: formData.charges_amount || "0",
      loyer_cc: formData.total_rent || "[Loyer CC]",
      depot_garantie: formData.deposit_amount || "[Dépôt]",
      nb_mois_depot: formData.deposit_months || "1",

      // === DATES FORMATÉES ===
      date_debut: formData.start_date
        ? format(new Date(formData.start_date), "dd/MM/yyyy", { locale: fr })
        : "[Date début]",
      date_fin: formData.end_date ? format(new Date(formData.end_date), "dd/MM/yyyy", { locale: fr }) : "[Date fin]",
      duree: `${formData.duration_months || "[Durée]"} mois`,

      // === ÉNERGIE ===
      annee_reference_energie: formData.energy_reference_year || new Date().getFullYear(),
      consommation_energie: formData.energy_consumption || "[Consommation]",
      classe_energie: formData.energy_class || "[Classe]",
      classe_ges: formData.ges_class || "[Classe GES]",
    }

    // Compiler le template
    let compiledContent = template.template_content

    // Remplacer les variables {{variable}}
    Object.entries(templateData).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g")
      compiledContent = compiledContent.replace(regex, String(value))
    })

    // Remplacer les conditions {{#if variable}}...{{/if}}
    compiledContent = compiledContent.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, content) => {
      const value = templateData[key]
      return value && value !== "" && value !== "Aucune" ? content : ""
    })

    // Convertir en HTML avec mise en forme
    const formattedHTML = compiledContent
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, "<br>")
      .replace(/^/, '<p class="mb-4">')
      .replace(/$/, "</p>")
      .replace(/<p class="mb-4"><\/p>/g, "")

    setPreviewContent(`
      <div class="prose prose-sm max-w-none p-6 bg-white">
        ${formattedHTML}
      </div>
    `)
  }, [formData, leaseTemplates, clauseCategories])

  // Générer le preview automatiquement quand les données changent
  useEffect(() => {
    if (formData.property_id && formData.tenant_id && leaseTemplates.length > 0) {
      generatePreview()
    }
  }, [formData, leaseTemplates, generatePreview])

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
        bail_type: formData.bail_type,
        owner_type: formData.owner_type,
        guarantee_type: formData.guarantee_type,

        // Parties
        bailleur_nom_prenom: formData.bailleur_nom_prenom,
        bailleur_email: formData.bailleur_email,
        bailleur_telephone: formData.bailleur_telephone,
        bailleur_adresse: formData.bailleur_adresse,
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
        sci_mandataire_activite: formData.sci_mandataire_activite,
        sci_mandataire_carte_pro: formData.sci_mandataire_carte_pro,
        personne_morale_denomination: formData.personne_morale_denomination,
        personne_morale_mandataire_nom: formData.personne_morale_mandataire_nom,
        personne_morale_mandataire_adresse: formData.personne_morale_mandataire_adresse,
        personne_morale_mandataire_activite: formData.personne_morale_mandataire_activite,
        personne_morale_mandataire_carte_pro: formData.personne_morale_mandataire_carte_pro,

        // Logement
        nombre_pieces: formData.nombre_pieces ? Number.parseInt(String(formData.nombre_pieces)) : null,
        surface_habitable: formData.surface_habitable ? Number.parseFloat(String(formData.surface_habitable)) : null,
        adresse_logement: formData.adresse_logement,
        complement_adresse: formData.complement_adresse,
        periode_construction: formData.periode_construction,
        performance_dpe: formData.performance_dpe,
        type_habitat: formData.type_habitat,
        regime_juridique: formData.regime_juridique,
        destination_locaux: formData.destination_locaux,
		modalite_chauffage: formData.production_chauffage === "collectif" ? "Collectif" : "Individuel",
		modalite_eau_chaude: formData.production_eau_chaude === "collective" ? "Collective" : "Individuelle",
        autres_parties: formData.autres_parties,
        equipements_logement: formData.equipements_logement,
        equipements_privatifs: formData.equipements_privatifs,
        equipements_communs: formData.equipements_communs,
        equipements_technologies: formData.equipements_technologies,
        identifiant_fiscal: formData.identifiant_fiscal,

        // Financier
        zone_encadree: formData.zone_encadree,
        loyer_reference: formData.loyer_reference ? Number.parseFloat(String(formData.loyer_reference)) : null,
        loyer_reference_majore: formData.loyer_reference_majore
          ? Number.parseFloat(String(formData.loyer_reference_majore))
          : null,
        complement_loyer: formData.complement_loyer ? Number.parseFloat(String(formData.complement_loyer)) : null,
        complement_loyer_justification: formData.complement_loyer_justification,
        zone_tendue: formData.zone_tendue,
        type_charges: formData.type_charges,
        modalite_revision_forfait: formData.modalite_revision_forfait,
        assurance_colocataires: formData.assurance_colocataires,
        assurance_montant: formData.assurance_montant ? Number.parseFloat(String(formData.assurance_montant)) : null,
        assurance_frequence: formData.assurance_frequence,
        trimestre_reference_irl: formData.trimestre_reference_irl,
        date_revision_loyer: formData.date_revision_loyer,
        date_revision_personnalisee: formData.date_revision_personnalisee,
        ancien_locataire_duree: formData.ancien_locataire_duree,
        dernier_loyer_ancien: formData.dernier_loyer_ancien
          ? Number.parseFloat(String(formData.dernier_loyer_ancien))
          : null,
        date_dernier_loyer: formData.date_dernier_loyer?.toISOString().split("T")[0],
        date_revision_dernier_loyer: formData.date_revision_dernier_loyer?.toISOString().split("T")[0],
        estimation_depenses_energie_min: formData.estimation_depenses_energie_min
          ? Number.parseFloat(String(formData.estimation_depenses_energie_min))
          : null,
        estimation_depenses_energie_max: formData.estimation_depenses_energie_max
          ? Number.parseFloat(String(formData.estimation_depenses_energie_max))
          : null,
        annee_reference_energie: formData.annee_reference_energie,

        // Durée
        duree_contrat: formData.duree_contrat ? Number.parseInt(String(formData.duree_contrat)) : null,
        contrat_duree_reduite: formData.contrat_duree_reduite,
        raison_duree_reduite: formData.raison_duree_reduite,
        jour_paiement_loyer: formData.jour_paiement_loyer,
        paiement_avance: formData.paiement_avance,
        mode_paiement_loyer: formData.mode_paiement_loyer,

        // Clauses
        mise_disposition_meubles: formData.mise_disposition_meubles,

        // Honoraires
        honoraires_professionnel: formData.honoraires_professionnel,
        honoraires_locataire_visite: formData.honoraires_locataire_visite
          ? Number.parseFloat(String(formData.honoraires_locataire_visite))
          : null,
        plafond_honoraires_locataire: formData.plafond_honoraires_locataire
          ? Number.parseFloat(String(formData.plafond_honoraires_locataire))
          : null,
        honoraires_bailleur_visite: formData.honoraires_bailleur_visite
          ? Number.parseFloat(String(formData.honoraires_bailleur_visite))
          : null,
        etat_lieux_professionnel: formData.etat_lieux_professionnel,
        honoraires_locataire_etat_lieux: formData.honoraires_locataire_etat_lieux
          ? Number.parseFloat(String(formData.honoraires_locataire_etat_lieux))
          : null,
        plafond_honoraires_etat_lieux: formData.plafond_honoraires_etat_lieux
          ? Number.parseFloat(String(formData.plafond_honoraires_etat_lieux))
          : null,
        honoraires_bailleur_etat_lieux: formData.honoraires_bailleur_etat_lieux
          ? Number.parseFloat(String(formData.honoraires_bailleur_etat_lieux))
          : null,
        autres_prestations: formData.autres_prestations,
        details_autres_prestations: formData.details_autres_prestations,
        honoraires_autres_prestations: formData.honoraires_autres_prestations
          ? Number.parseFloat(String(formData.honoraires_autres_prestations))
          : null,

        franchise_loyer: formData.franchise_loyer,
        clause_libre: formData.clause_libre,

        // Annexes
        annexe_surface_habitable: formData.annexe_surface_habitable,
        annexe_dpe: formData.annexe_dpe,
        annexe_plomb: formData.annexe_plomb,
        annexe_amiante: formData.annexe_amiante,
        annexe_electricite: formData.annexe_electricite,
        annexe_gaz: formData.annexe_gaz,
        annexe_erp: formData.annexe_erp,
        annexe_bruit: formData.annexe_bruit,
        annexe_autres: formData.annexe_autres,
        annexe_etat_lieux: formData.annexe_etat_lieux,
        annexe_notice_information: formData.annexe_notice_information,
        annexe_inventaire_meubles: formData.annexe_inventaire_meubles,
        annexe_liste_charges: formData.annexe_liste_charges,
        annexe_reparations_locatives: formData.annexe_reparations_locatives,
        annexe_grille_vetuste: formData.annexe_grille_vetuste,
        annexe_bail_parking: formData.annexe_bail_parking,
        annexe_actes_caution: formData.annexe_actes_caution,

        // Métadonnées avec clauses
        metadata: {
          form_version: "v11_complete_with_template_preview",
          created_from: "new_form_complete_clauses_template",
          total_fields: Object.keys(formData).length,
          locataires_count: formData.locataires.length,
          garants_count: formData.garants.length,
          locataires: formData.locataires,
          garants: formData.garants,
          clauses: formData.clauses, // Stocker les clauses dans les métadonnées
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
                              placeholder="Jean Dupont, gérant"
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
                              placeholder="Gestion immobilière"
                            />
                          </div>
                          <div>
                            <Label htmlFor="sci_mandataire_carte_pro">Numéro carte professionnelle</Label>
                            <Input
                              id="sci_mandataire_carte_pro"
                              value={formData.sci_mandataire_carte_pro}
                              onChange={(e) => handleInputChange("sci_mandataire_carte_pro", e.target.value)}
                              placeholder="CPI 7501 2023 000 000 001"
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
                            <Label htmlFor="personne_morale_denomination">Dénomination *</Label>
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
                              placeholder="Marie Martin, directrice"
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
                              placeholder="Gestion immobilière"
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
                              placeholder="CPI 7501 2023 000 000 001"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Locataires */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">Locataires</h3>
                        <Button type="button" variant="outline" size="sm" onClick={addLocataire}>
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter un locataire
                        </Button>
                      </div>

                      {formData.locataires.map((locataire, index) => (
                        <div key={index} className="p-4 border rounded-lg mb-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium">Locataire {index + 1}</h4>
                            {formData.locataires.length > 1 && (
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeLocataire(index)}>
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`locataire_prenom_${index}`}>Prénom *</Label>
                              <Input
                                id={`locataire_prenom_${index}`}
                                value={locataire.prenom}
                                onChange={(e) => updateLocataire(index, "prenom", e.target.value)}
                                placeholder="Jean"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`locataire_nom_${index}`}>Nom *</Label>
                              <Input
                                id={`locataire_nom_${index}`}
                                value={locataire.nom}
                                onChange={(e) => updateLocataire(index, "nom", e.target.value)}
                                placeholder="Dupont"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`locataire_email_${index}`}>Email *</Label>
                              <Input
                                id={`locataire_email_${index}`}
                                type="email"
                                value={locataire.email}
                                onChange={(e) => updateLocataire(index, "email", e.target.value)}
                                placeholder="jean.dupont@email.com"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`locataire_date_naissance_${index}`}>Date de naissance</Label>
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
                        </div>
                      ))}

                      {formData.locataires.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <p>Aucun locataire ajouté</p>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={addLocataire}
                            className="mt-2 bg-transparent"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter le premier locataire
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Étape 3: Logement */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Informations générales du logement</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="adresse_logement">Adresse du logement *</Label>
                          <Input
                            id="adresse_logement"
                            value={formData.adresse_logement}
                            onChange={(e) => handleInputChange("adresse_logement", e.target.value)}
                            placeholder="123 rue de la République, 75001 Paris"
                          />
                        </div>
                        <div>
                          <Label htmlFor="complement_adresse">Complément d'adresse</Label>
                          <Input
                            id="complement_adresse"
                            value={formData.complement_adresse}
                            onChange={(e) => handleInputChange("complement_adresse", e.target.value)}
                            placeholder="Appartement 3B, 2ème étage"
                          />
                        </div>
                        <div>
                          <Label htmlFor="nombre_pieces">Nombre de pièces *</Label>
                          <Input
                            id="nombre_pieces"
                            type="number"
                            value={formData.nombre_pieces}
                            onChange={(e) => handleInputChange("nombre_pieces", e.target.value)}
                            placeholder="3"
                          />
                        </div>
                        <div>
                          <Label htmlFor="surface_habitable">Surface habitable (m²) *</Label>
                          <Input
                            id="surface_habitable"
                            type="number"
                            step="0.01"
                            value={formData.surface_habitable}
                            onChange={(e) => handleInputChange("surface_habitable", e.target.value)}
                            placeholder="65.50"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-4">Caractéristiques du logement</h3>
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
                              <SelectItem value="Après 1949">Après 1949</SelectItem>
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
                              <SelectItem value="A">A</SelectItem>
                              <SelectItem value="B">B</SelectItem>
                              <SelectItem value="C">C</SelectItem>
                              <SelectItem value="D">D</SelectItem>
                              <SelectItem value="E">E</SelectItem>
                              <SelectItem value="F">F</SelectItem>
                              <SelectItem value="G">G</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
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
                              <SelectItem value="individuel">Maison individuelle</SelectItem>
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
                              <SelectItem value="copropriete">Copropriété</SelectItem>
                              <SelectItem value="monopropriete">Monopropriété</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="destination_locaux">Destination des locaux</Label>
                          <Select
                            value={formData.destination_locaux}
                            onValueChange={(value) => handleInputChange("destination_locaux", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="usage_habitation">Usage d'habitation</SelectItem>
                              <SelectItem value="usage_mixte">Usage mixte</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
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
                          <Label htmlFor="production_eau_chaude">Production d'eau chaude</Label>
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
                        <div>
                          <Label htmlFor="identifiant_fiscal">Identifiant fiscal</Label>
                          <Input
                            id="identifiant_fiscal"
                            value={formData.identifiant_fiscal}
                            onChange={(e) => handleInputChange("identifiant_fiscal", e.target.value)}
                            placeholder="123456789012345"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Autres parties du logement */}
                    <div>
                      <Label>Autres parties du logement</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
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
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
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

                    {/* Équipements privatifs */}
                    <div>
                      <Label>Équipements privatifs</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
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

                    {/* Équipements communs */}
                    <div>
                      <Label>Équipements communs</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
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

                    {/* Équipements technologies */}
                    <div>
                      <Label>Équipements technologies</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
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

                    {/* Annexes */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Annexes</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Diagnostics obligatoires</h4>
                          <div className="space-y-2">
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
                                checked={formData.annexe_dpe}
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
                                Installation électrique
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="annexe_gaz"
                                checked={formData.annexe_gaz}
                                onCheckedChange={(checked) => handleInputChange("annexe_gaz", checked)}
                              />
                              <Label htmlFor="annexe_gaz" className="text-sm">
                                Installation gaz
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="annexe_erp"
                                checked={formData.annexe_erp}
                                onCheckedChange={(checked) => handleInputChange("annexe_erp", checked)}
                              />
                              <Label htmlFor="annexe_erp" className="text-sm">
                                ERP (Risques et pollutions)
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
                                Autres diagnostics
                              </Label>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Documents contractuels</h4>
                          <div className="space-y-2">
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
                                Liste des charges
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
                                Réparations locatives
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
                                Bail de parking
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="annexe_actes_caution"
                                checked={formData.annexe_actes_caution}
                                onCheckedChange={(checked) => handleInputChange("annexe_actes_caution", checked)}
                              />
                              <Label htmlFor="annexe_actes_caution" className="text-sm">
                                Actes de caution
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
                <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Précédent
                </Button>
                <div className="flex gap-2">
                  {currentStep < 6 ? (
                    <Button type="button" onClick={nextStep}>
                      Suivant
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button type="button" onClick={handleSubmit} disabled={saving}>
                      {saving ? "Création..." : "Créer le bail"}
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          </div>

          {/* Preview */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Aperçu du bail
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
                      <p>Sélectionnez un bien et un locataire pour voir l'aperçu</p>
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
