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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { authService } from "@/lib/auth-service"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { LeaseDocumentsManager } from "@/components/lease-documents-manager"

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
  complement_adresse_logement: string // NOUVEAU: 3ème étage, Batiment B, Appartement n°205
  identifiant_fiscal: string
  type_habitat_detail: string // NOUVEAU: immeuble_collectif ou individuel
  regime_juridique: string
  periode_construction: string
  surface_habitable: number | string
  nombre_pieces: number | string

  // Autres parties du logement - AMÉLIORÉ
  autres_parties_types: string[] // NOUVEAU: grenier, comble, terrasse, balcon, loggia, jardin, autres
  autres_parties_autres: string // NOUVEAU: champ libre si "autres"
  jardin_description: string // NOUVEAU: description du jardin
  jardin_surface: number | string // NOUVEAU: surface du jardin

  // Équipements du logement - AMÉLIORÉ
  equipements_types: string[] // NOUVEAU: installations_sanitaires, cuisine_equipee, autres
  equipements_autres: string // NOUVEAU: champ libre si "autres"
  installations_sanitaires_description: string // NOUVEAU: description installations sanitaires

  modalite_chauffage: string // MODIFIÉ: individuel/collectif
  modalite_eau_chaude: string // MODIFIÉ: individuelle/collective
  niveau_performance_dpe: string
  destination_locaux: string // MODIFIÉ: usage_habitation/usage_mixte

  // Locaux privatifs - NOUVEAU
  locaux_privatifs_types: string[] // cave, parking, garage, autres
  locaux_privatifs_autres: string // champ libre si "autres"
  cave_numero: string // numéro de la cave
  parking_numero: string // numéro de la place de parking
  garage_numero: string // numéro du garage

  // Locaux communs - AMÉLIORÉ
  locaux_communs_types: string[] // NOUVEAU: ascenseur, garage_velo, jardin_commun, local_poubelle, autres
  locaux_communs_autres: string // NOUVEAU: champ libre si "autres"

  // Équipements technologies - AMÉLIORÉ
  equipement_technologies_types: string[] // NOUVEAU: tv, internet, fibre
  equipement_technologies_autres: string // NOUVEAU: champ libre si "autres"

  // === FINANCIER COMPLET ===
  montant_loyer_mensuel: number | string
  montant_depot_garantie: number | string

  // Encadrement loyer - MODIFIÉ
  soumis_loyer_reference: boolean // RENOMMÉ depuis zone_encadree
  montant_loyer_reference: number | string
  montant_loyer_reference_majore: number | string
  complement_loyer: number | string
  complement_loyer_justification: string

  // Charges
  type_charges: string
  montant_provisions_charges: number | string
  modalite_reglement_charges: string
  modalites_revision_forfait: string

  // Assurance colocataires - MODIFIÉ
  assurance_colocataire: boolean // RENOMMÉ depuis assurance_colocataires
  assurance_colocataire_montant: number | string // RENOMMÉ
  assurance_colocataire_frequence: string // RENOMMÉ

  // Indexation du loyer
  trimestre_reference_irl: string
  date_revision_loyer: string
  date_revision_personnalisee: string
  evolution_loyer_relocation: boolean // NOUVEAU: zone tendue
  ancien_locataire_duree: string
  dernier_loyer_ancien: number | string
  date_dernier_loyer: Date | null
  date_revision_dernier_loyer: Date | null

  // Dépenses énergie
  montant_depenses_energie_min: number | string
  montant_depenses_energie_max: number | string
  annee_reference_prix_energie: string

  // Travaux - MODIFIÉ avec HTML
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

  // Travaux HTML - NOUVEAU
  travaux_bailleur_cours_html: string
  travaux_locataire_cours_html: string
  travaux_entre_locataires_html: string

  // === ÉCHÉANCES ===
  date_prise_effet: Date | null
  duree_contrat: number | string
  evenement_duree_reduite: string
  date_paiement_loyer: string
  paiement_avance_ou_terme: string
  lieu_paiement: string
  montant_premiere_echeance: number | string

  // === CLAUSES GÉNÉRIQUES - MODIFIÉ ===
  clause_resolutoire: boolean
  clause_solidarite: boolean
  visites_relouer_vendre: boolean
  mode_paiement_loyer: string
  mise_disposition_meubles: string

  // Clauses avec système personnalisable
  clause_animaux_domestiques_id: string // NOUVEAU: référence vers lease_clauses
  clause_entretien_appareils_id: string // NOUVEAU: référence vers lease_clauses
  clause_degradations_locataire_id: string // NOUVEAU: référence vers lease_clauses
  clauses_personnalisees: string // NOUVEAU: clauses libres additionnelles

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
    complement_adresse_logement: "",
    identifiant_fiscal: "",
    type_habitat_detail: "immeuble_collectif",
    regime_juridique: "Copropriété",
    periode_construction: "Après 1949",
    surface_habitable: "",
    nombre_pieces: "",

    // Autres parties du logement
    autres_parties_types: [],
    autres_parties_autres: "",
    jardin_description: "",
    jardin_surface: "",

    // Équipements du logement
    equipements_types: [],
    equipements_autres: "",
    installations_sanitaires_description: "",

    modalite_chauffage: "individuel",
    modalite_eau_chaude: "individuelle",
    niveau_performance_dpe: "D",
    destination_locaux: "usage_habitation",

    // Locaux privatifs
    locaux_privatifs_types: [],
    locaux_privatifs_autres: "",
    cave_numero: "",
    parking_numero: "",
    garage_numero: "",

    // Locaux communs
    locaux_communs_types: [],
    locaux_communs_autres: "",

    // Équipements technologies
    equipement_technologies_types: [],
    equipement_technologies_autres: "",

    // === FINANCIER COMPLET ===
    montant_loyer_mensuel: "",
    montant_depot_garantie: "",

    // Encadrement loyer
    soumis_loyer_reference: false,
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
    assurance_colocataire: false,
    assurance_colocataire_montant: "",
    assurance_colocataire_frequence: "mensuel",

    // Indexation du loyer
    trimestre_reference_irl: "",
    date_revision_loyer: "anniversaire",
    date_revision_personnalisee: "",
    evolution_loyer_relocation: false,
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

    // Travaux HTML
    travaux_bailleur_cours_html: "",
    travaux_locataire_cours_html: "",
    travaux_entre_locataires_html: "",

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

    // Clauses personnalisables
    clause_animaux_domestiques_id: "",
    clause_entretien_appareils_id: "",
    clause_degradations_locataire_id: "",
    clauses_personnalisees: "",

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

  const equipementsOptions = [
    { value: "installations_sanitaires", label: "Installations Sanitaires" },
    { value: "cuisine_equipee", label: "Cuisine équipée" },
    { value: "autres", label: "Autres" },
  ]

  const locauxPrivatifsOptions = [
    { value: "cave", label: "Cave" },
    { value: "parking", label: "Parking" },
    { value: "garage", label: "Garage" },
    { value: "autres", label: "Autres" },
  ]

  const locauxCommunsOptions = [
    { value: "ascenseur", label: "Ascenseur" },
    { value: "garage_velo", label: "Garage à vélo" },
    { value: "jardin_commun", label: "Jardin commun" },
    { value: "local_poubelle", label: "Local poubelle" },
    { value: "autres", label: "Autres" },
  ]

  const technologiesOptions = [
    { value: "tv", label: "Raccordement TV" },
    { value: "internet", label: "Raccordement Internet" },
    { value: "fibre", label: "Raccordement fibre optique" },
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
        const defaultClauses = clausesData.clauses?.filter((c: LeaseClause) => c.is_default) || []
        const defaultAnimaux = defaultClauses.find((c: LeaseClause) => c.category === "animaux_domestiques")
        const defaultEntretien = defaultClauses.find((c: LeaseClause) => c.category === "entretien_appareils")
        const defaultDegradations = defaultClauses.find((c: LeaseClause) => c.category === "degradations_locataire")

        setFormData((prev) => ({
          ...prev,
          clause_animaux_domestiques_id: defaultAnimaux?.id || "",
          clause_entretien_appareils_id: defaultEntretien?.id || "",
          clause_degradations_locataire_id: defaultDegradations?.id || "",
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
      localisation_logement: property?.address || "",
      complement_adresse_logement: property?.complement_address || "",
      type_habitat_detail: property?.building_type === "individual" ? "individuel" : "immeuble_collectif",
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
            newData.localisation_logement = selectedProperty.address || ""
            newData.complement_adresse_logement = selectedProperty.complement_address || ""
            newData.type_habitat_detail =
              selectedProperty.building_type === "individual" ? "individuel" : "immeuble_collectif"
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
        if (field === "assurance_colocataire_montant" && newData.assurance_colocataire_frequence === "mensuel") {
          // Si montant mensuel, calculer l'annuel
          const mensuel = Number.parseFloat(String(value)) || 0
          // Note: On pourrait ajouter un champ annuel si nécessaire
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
          ${formData.complement_adresse_logement ? `<p class="text-sm text-gray-600">${formData.complement_adresse_logement}</p>` : ""}
          <p class="text-sm text-gray-600">${formData.type_habitat_detail === "immeuble_collectif" ? "Immeuble collectif" : "Individuel"} - ${formData.surface_habitable || "[Surface]"} m² - ${formData.nombre_pieces || "[Pièces]"} pièces</p>
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
            formData.type_habitat_detail &&
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

      // Préparer les données pour l'API
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
        jardin_surface: formData.jardin_surface ? Number.parseFloat(String(formData.jardin_surface)) : null,
        montant_loyer_reference: formData.montant_loyer_reference
          ? Number.parseFloat(String(formData.montant_loyer_reference))
          : null,
        montant_loyer_reference_majore: formData.montant_loyer_reference_majore
          ? Number.parseFloat(String(formData.montant_loyer_reference_majore))
          : null,
        complement_loyer: formData.complement_loyer ? Number.parseFloat(String(formData.complement_loyer)) : null,
        assurance_colocataire_montant: formData.assurance_colocataire_montant
          ? Number.parseFloat(String(formData.assurance_colocataire_montant))
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
          form_version: "v8_comprehensive_with_clauses",
          created_from: "new_form_comprehensive_clauses",
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
                        <Label htmlFor="lease_type">Type de bail</Label>
                        <Select
                          value={formData.lease_type}
                          onValueChange={(value) => handleInputChange("lease_type", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unfurnished">Non meublé</SelectItem>
                            <SelectItem value="furnished">Meublé</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="bail_type">Type de location</Label>
                        <Select
                          value={formData.bail_type}
                          onValueChange={(value) => handleInputChange("bail_type", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">Individuelle</SelectItem>
                            <SelectItem value="couple">Couple</SelectItem>
                            <SelectItem value="room">Chambre</SelectItem>
                            <SelectItem value="colocation">Colocation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Étape 2: Parties */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Bailleur</h3>
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
                        <div className="md:col-span-2">
                          <Label htmlFor="bailleur_domicile">Domicile</Label>
                          <Input
                            id="bailleur_domicile"
                            value={formData.bailleur_domicile}
                            onChange={(e) => handleInputChange("bailleur_domicile", e.target.value)}
                            placeholder="123 rue de la Paix, 75001 Paris"
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
                        <div className="md:col-span-2">
                          <Label htmlFor="locataire_domicile">Domicile</Label>
                          <Input
                            id="locataire_domicile"
                            value={formData.locataire_domicile}
                            onChange={(e) => handleInputChange("locataire_domicile", e.target.value)}
                            placeholder="456 avenue des Champs, 75008 Paris"
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
                    </div>
                  </div>
                )}

                {/* Étape 3: Logement - VERSION COMPLÈTE */}
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

                    <div>
                      <Label htmlFor="complement_adresse_logement">Complément d'adresse</Label>
                      <Input
                        id="complement_adresse_logement"
                        value={formData.complement_adresse_logement}
                        onChange={(e) => handleInputChange("complement_adresse_logement", e.target.value)}
                        placeholder="3ème étage, Bâtiment B, Appartement n°205"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Précisions sur l'étage, le bâtiment, le numéro d'appartement, etc.
                      </p>
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
                        <Label htmlFor="type_habitat_detail">Type d'habitat *</Label>
                        <Select
                          value={formData.type_habitat_detail}
                          onValueChange={(value) => handleInputChange("type_habitat_detail", value)}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <SelectItem value="usage_mixte">Usage mixte professionnel et d'habitation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="modalite_chauffage">Production de chauffage</Label>
                        <Select
                          value={formData.modalite_chauffage}
                          onValueChange={(value) => handleInputChange("modalite_chauffage", value)}
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
                    </div>

                    <div>
                      <Label htmlFor="modalite_eau_chaude">Production Eau chaude Sanitaire</Label>
                      <Select
                        value={formData.modalite_eau_chaude}
                        onValueChange={(value) => handleInputChange("modalite_eau_chaude", value)}
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

                    {/* Autres parties du logement - AMÉLIORÉ */}
                    <div>
                      <Label>Autres parties du logement</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
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
                        <div className="mt-4">
                          <Label htmlFor="autres_parties_autres">Précisions</Label>
                          <Input
                            id="autres_parties_autres"
                            value={formData.autres_parties_autres}
                            onChange={(e) => handleInputChange("autres_parties_autres", e.target.value)}
                            placeholder="Autres parties du logement"
                          />
                        </div>
                      )}

                      {formData.autres_parties_types.includes("jardin") && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="jardin_description">Description du jardin</Label>
                            <Input
                              id="jardin_description"
                              value={formData.jardin_description}
                              onChange={(e) => handleInputChange("jardin_description", e.target.value)}
                              placeholder="Jardin privatif avec terrasse"
                            />
                          </div>
                          <div>
                            <Label htmlFor="jardin_surface">Surface du jardin (m²)</Label>
                            <Input
                              id="jardin_surface"
                              type="number"
                              value={formData.jardin_surface}
                              onChange={(e) => handleInputChange("jardin_surface", e.target.value)}
                              placeholder="50"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Équipements du logement - AMÉLIORÉ */}
                    <div>
                      <Label>Équipements du logement</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                        {equipementsOptions.map((option) => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`equipements_${option.value}`}
                              checked={formData.equipements_types.includes(option.value)}
                              onCheckedChange={(checked) =>
                                handleMultiSelectChange("equipements_types", option.value, checked as boolean)
                              }
                            />
                            <Label htmlFor={`equipements_${option.value}`} className="text-sm">
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </div>

                      {formData.equipements_types.includes("autres") && (
                        <div className="mt-4">
                          <Label htmlFor="equipements_autres">Autres équipements</Label>
                          <Input
                            id="equipements_autres"
                            value={formData.equipements_autres}
                            onChange={(e) => handleInputChange("equipements_autres", e.target.value)}
                            placeholder="Autres équipements du logement"
                          />
                        </div>
                      )}

                      {formData.equipements_types.includes("installations_sanitaires") && (
                        <div className="mt-4">
                          <Label htmlFor="installations_sanitaires_description">
                            Description des installations sanitaires
                          </Label>
                          <Input
                            id="installations_sanitaires_description"
                            value={formData.installations_sanitaires_description}
                            onChange={(e) => handleInputChange("installations_sanitaires_description", e.target.value)}
                            placeholder="WC et douche séparés"
                          />
                        </div>
                      )}
                    </div>

                    {/* Locaux privatifs - NOUVEAU */}
                    <div>
                      <Label>Équipements, locaux, services à usage privatif</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                        {locauxPrivatifsOptions.map((option) => (
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

                      {formData.locaux_privatifs_types.includes("autres") && (
                        <div className="mt-4">
                          <Label htmlFor="locaux_privatifs_autres">Autres locaux privatifs</Label>
                          <Input
                            id="locaux_privatifs_autres"
                            value={formData.locaux_privatifs_autres}
                            onChange={(e) => handleInputChange("locaux_privatifs_autres", e.target.value)}
                            placeholder="Autres locaux à usage privatif"
                          />
                        </div>
                      )}

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {formData.locaux_privatifs_types.includes("cave") && (
                          <div>
                            <Label htmlFor="cave_numero">Numéro de la cave</Label>
                            <Input
                              id="cave_numero"
                              value={formData.cave_numero}
                              onChange={(e) => handleInputChange("cave_numero", e.target.value)}
                              placeholder="Cave n°3"
                            />
                          </div>
                        )}

                        {formData.locaux_privatifs_types.includes("parking") && (
                          <div>
                            <Label htmlFor="parking_numero">Numéro de la place de parking</Label>
                            <Input
                              id="parking_numero"
                              value={formData.parking_numero}
                              onChange={(e) => handleInputChange("parking_numero", e.target.value)}
                              placeholder="Place n°10 au sous-sol"
                            />
                          </div>
                        )}

                        {formData.locaux_privatifs_types.includes("garage") && (
                          <div>
                            <Label htmlFor="garage_numero">Numéro du garage</Label>
                            <Input
                              id="garage_numero"
                              value={formData.garage_numero}
                              onChange={(e) => handleInputChange("garage_numero", e.target.value)}
                              placeholder="Box n°5"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Locaux communs - AMÉLIORÉ */}
                    <div>
                      <Label>Équipements, locaux, services à usage commun</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                        {locauxCommunsOptions.map((option) => (
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
                        <div className="mt-4">
                          <Label htmlFor="locaux_communs_autres">Autres locaux communs</Label>
                          <Input
                            id="locaux_communs_autres"
                            value={formData.locaux_communs_autres}
                            onChange={(e) => handleInputChange("locaux_communs_autres", e.target.value)}
                            placeholder="Autres locaux à usage commun"
                          />
                        </div>
                      )}
                    </div>

                    {/* Équipements technologies - AMÉLIORÉ */}
                    <div>
                      <Label>Équipements d'accès aux technologies de l'information et de la communication</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                        {technologiesOptions.map((option) => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`technologies_${option.value}`}
                              checked={formData.equipement_technologies_types.includes(option.value)}
                              onCheckedChange={(checked) =>
                                handleMultiSelectChange(
                                  "equipement_technologies_types",
                                  option.value,
                                  checked as boolean,
                                )
                              }
                            />
                            <Label htmlFor={`technologies_${option.value}`} className="text-sm">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="montant_loyer_mensuel">Loyer mensuel (€) *</Label>
                        <Input
                          id="montant_loyer_mensuel"
                          type="number"
                          value={formData.montant_loyer_mensuel}
                          onChange={(e) => handleInputChange("montant_loyer_mensuel", e.target.value)}
                          placeholder="1200"
                        />
                      </div>
                      <div>
                        <Label htmlFor="montant_depot_garantie">Dépôt de garantie (€) *</Label>
                        <Input
                          id="montant_depot_garantie"
                          type="number"
                          value={formData.montant_depot_garantie}
                          onChange={(e) => handleInputChange("montant_depot_garantie", e.target.value)}
                          placeholder="2400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <SelectItem value="provisions">Provisions sur charges</SelectItem>
                            <SelectItem value="forfait">Forfait de charges</SelectItem>
                            <SelectItem value="aucune">Aucune charge</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="montant_provisions_charges">Montant des charges (€)</Label>
                        <Input
                          id="montant_provisions_charges"
                          type="number"
                          value={formData.montant_provisions_charges}
                          onChange={(e) => handleInputChange("montant_provisions_charges", e.target.value)}
                          placeholder="150"
                        />
                      </div>
                    </div>

                    {/* Zone d'encadrement des loyers */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="soumis_loyer_reference"
                          checked={formData.soumis_loyer_reference}
                          onCheckedChange={(checked) => handleInputChange("soumis_loyer_reference", checked)}
                        />
                        <Label htmlFor="soumis_loyer_reference">
                          Le logement est situé en zone d'encadrement des loyers
                        </Label>
                      </div>

                      {formData.soumis_loyer_reference && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                          <div>
                            <Label htmlFor="montant_loyer_reference">Loyer de référence (€)</Label>
                            <Input
                              id="montant_loyer_reference"
                              type="number"
                              value={formData.montant_loyer_reference}
                              onChange={(e) => handleInputChange("montant_loyer_reference", e.target.value)}
                              placeholder="1000"
                            />
                          </div>
                          <div>
                            <Label htmlFor="montant_loyer_reference_majore">Loyer de référence majoré (€)</Label>
                            <Input
                              id="montant_loyer_reference_majore"
                              type="number"
                              value={formData.montant_loyer_reference_majore}
                              onChange={(e) => handleInputChange("montant_loyer_reference_majore", e.target.value)}
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
                            <Label htmlFor="complement_loyer_justification">Justification du complément de loyer</Label>
                            <Textarea
                              id="complement_loyer_justification"
                              value={formData.complement_loyer_justification}
                              onChange={(e) => handleInputChange("complement_loyer_justification", e.target.value)}
                              placeholder="Justification des caractéristiques exceptionnelles du logement"
                              rows={3}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Zone tendue */}
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="evolution_loyer_relocation"
                        checked={formData.evolution_loyer_relocation}
                        onCheckedChange={(checked) => handleInputChange("evolution_loyer_relocation", checked)}
                      />
                      <Label htmlFor="evolution_loyer_relocation">
                        Le logement est en zone tendue (l'évolution du loyer entre 2 locataires est plafonnée à l'IRL)
                      </Label>
                    </div>

                    {/* Assurance colocataires */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="assurance_colocataire"
                          checked={formData.assurance_colocataire}
                          onCheckedChange={(checked) => handleInputChange("assurance_colocataire", checked)}
                        />
                        <Label htmlFor="assurance_colocataire">
                          Le bailleur souscrit une assurance pour le compte des colocataires
                        </Label>
                      </div>

                      {formData.assurance_colocataire && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg">
                          <div>
                            <Label htmlFor="assurance_colocataire_montant">Montant récupérable (€)</Label>
                            <Input
                              id="assurance_colocataire_montant"
                              type="number"
                              value={formData.assurance_colocataire_montant}
                              onChange={(e) => handleInputChange("assurance_colocataire_montant", e.target.value)}
                              placeholder="120"
                            />
                          </div>
                          <div>
                            <Label htmlFor="assurance_colocataire_frequence">Fréquence de paiement</Label>
                            <Select
                              value={formData.assurance_colocataire_frequence}
                              onValueChange={(value) => handleInputChange("assurance_colocataire_frequence", value)}
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
                          placeholder="36"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {formData.lease_type === "furnished"
                            ? "12 mois minimum pour un meublé"
                            : "36 mois minimum pour un non meublé"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date_paiement_loyer">Date de paiement du loyer</Label>
                        <Select
                          value={formData.date_paiement_loyer}
                          onValueChange={(value) => handleInputChange("date_paiement_loyer", value)}
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
                        <Label htmlFor="paiement_avance_ou_terme">Paiement</Label>
                        <Select
                          value={formData.paiement_avance_ou_terme}
                          onValueChange={(value) => handleInputChange("paiement_avance_ou_terme", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="avance">À l'avance</SelectItem>
                            <SelectItem value="terme">À terme échu</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
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
                )}

                {/* Étape 6: Documents et finalisation */}
                {currentStep === 6 && (
                  <div className="space-y-6">
                    {/* Clauses personnalisables */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Clauses du contrat</h3>

                      <div className="space-y-4">
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

                        <div>
                          <Label htmlFor="clause_entretien_appareils_id">Entretien des appareils</Label>
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
                      </div>
                    </div>

                    {/* Travaux avec textes HTML personnalisables */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Travaux</h3>
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Ces sections permettent d'ajouter des clauses spécifiques concernant les travaux. Les textes
                          peuvent être personnalisés par l'administrateur.
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-4 mt-4">
                        <div>
                          <Label htmlFor="travaux_bailleur_cours_html">Travaux bailleur en cours de bail</Label>
                          <Textarea
                            id="travaux_bailleur_cours_html"
                            value={formData.travaux_bailleur_cours_html}
                            onChange={(e) => handleInputChange("travaux_bailleur_cours_html", e.target.value)}
                            placeholder="Clause concernant les travaux que le bailleur peut effectuer en cours de bail..."
                            rows={3}
                          />
                        </div>

                        <div>
                          <Label htmlFor="travaux_locataire_cours_html">Travaux locataire en cours de bail</Label>
                          <Textarea
                            id="travaux_locataire_cours_html"
                            value={formData.travaux_locataire_cours_html}
                            onChange={(e) => handleInputChange("travaux_locataire_cours_html", e.target.value)}
                            placeholder="Clause concernant les travaux que le locataire peut effectuer en cours de bail..."
                            rows={3}
                          />
                        </div>

                        <div>
                          <Label htmlFor="travaux_entre_locataires_html">Travaux entre deux locataires</Label>
                          <Textarea
                            id="travaux_entre_locataires_html"
                            value={formData.travaux_entre_locataires_html}
                            onChange={(e) => handleInputChange("travaux_entre_locataires_html", e.target.value)}
                            placeholder="Clause concernant les travaux effectués entre deux locataires..."
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Garants */}
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
                    </div>

                    {/* Conditions particulières */}
                    <div>
                      <Label htmlFor="clauses_personnalisees">Clauses personnalisées additionnelles</Label>
                      <Textarea
                        id="clauses_personnalisees"
                        value={formData.clauses_personnalisees}
                        onChange={(e) => handleInputChange("clauses_personnalisees", e.target.value)}
                        placeholder="Clauses particulières spécifiques à ce bail..."
                        rows={4}
                      />
                    </div>

                    {/* Documents et annexes */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Documents et annexes</h3>
                      <LeaseDocumentsManager
                        formData={formData}
                        onDocumentsChange={(docs) => handleInputChange("documents", docs)}
                        onAnnexesChange={(annexes) => {
                          Object.entries(annexes).forEach(([key, value]) => {
                            handleInputChange(key as keyof LeaseFormData, value)
                          })
                        }}
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
