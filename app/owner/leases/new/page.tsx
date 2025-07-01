"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Check, User, Home, Euro, Clock, FileCheck } from "lucide-react"
import { authService } from "@/lib/auth-service"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"

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
          form_version: "v7_comprehensive_complete",
          created_from: "new_form_comprehensive",
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
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Aperçu */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Aperçu du contrat</CardTitle>
              </CardHeader>
              <CardContent>
                <div dangerouslySetInnerHTML={{ __html: previewContent }}></div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
                  {showPreview ? "Masquer l'aperçu" : "Afficher l'aperçu"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Navigation entre les étapes */}
        <div className="mt-6 flex justify-between">
          <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Étape précédente
          </Button>
          {currentStep < steps.length && (
            <Button onClick={nextStep}>
              Étape suivante
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          {currentStep === steps.length && (
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Création en cours..." : "Créer le bail"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
