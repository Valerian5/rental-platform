"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { ArrowLeft, ArrowRight, FileText, Info, Check } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { format } from "date-fns"
import fr from "date-fns/locale/fr"

interface Property {
  id: string
  title: string
  address: string
  postal_code: string
  city: string
  property_type: string
  surface_area: number
  rooms: number
  floor?: string
  zone?: string
}

interface Application {
  id: string
  tenant_id: string
  property_id: string
  tenant_name: string
  tenant_email: string
  tenant_phone?: string
  tenant_address?: string
  status: string
}

interface LeaseClause {
  id: string
  name: string
  category: string
  clause_text: string
  is_default: boolean
  is_active: boolean
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
  // Sélection
  property_id: string
  application_id: string
  template_id: string
  lease_type: "unfurnished" | "furnished"

  // Parties
  landlord_name: string
  landlord_address: string
  landlord_email: string
  landlord_phone: string
  tenant_name: string
  tenant_address: string
  tenant_email: string
  tenant_phone: string

  // Bien
  property_address: string
  postal_code: string
  city: string
  property_type: string
  surface_area: number
  rooms: number
  floor: string
  zone: string

  // Durée et modalités
  start_date: string
  end_date: string
  duration_months: number
  payment_mode: "monthly" | "quarterly" | "advance"
  payment_day: number

  // Financier
  rent_amount: number
  charges_amount: number
  total_rent: number
  deposit_amount: number
  deposit_months: number

  // Spécifique meublé
  mandatory_equipment: string[]
  additional_equipment: string[]
  intended_use: string

  // Énergie
  energy_reference_year: number
  energy_consumption: number
  energy_class: string
  ges_class: string

  // Clauses
  clause_resolutoire: boolean
  clause_solidarite: boolean
  visites_relouer_vendre: boolean
  animaux_domestiques: boolean
  entretien_appareils: boolean
  degradations_locataire: boolean
  renonciation_regularisation: boolean
  travaux_bailleur: boolean
  travaux_locataire: boolean
  travaux_entre_locataires: boolean
  custom_clauses: string

  // Signature
  signature_city: string
  signature_date: string
}

const STEPS = [
  { id: 1, title: "Sélection", description: "Propriété et candidature" },
  { id: 2, title: "Parties", description: "Bailleur et locataire" },
  { id: 3, title: "Bien", description: "Description du logement" },
  { id: 4, title: "Durée", description: "Durée et modalités" },
  { id: 5, title: "Financier", description: "Loyer et charges" },
  { id: 6, title: "Équipements", description: "Équipements (meublé)" },
  { id: 7, title: "Énergie", description: "Performance énergétique" },
  { id: 8, title: "Clauses", description: "Clauses particulières" },
  { id: 9, title: "Signature", description: "Lieu et date" },
]

export default function NewLeasePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewContent, setPreviewContent] = useState("")

  // Data
  const [properties, setProperties] = useState<Property[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [leaseTemplates, setLeaseTemplates] = useState<LeaseTemplate[]>([])
  const [clauses, setClauses] = useState<LeaseClause[]>([])
  const [clauseCategories, setClauseCategories] = useState<{ key: string; label: string }[]>([])

  // Form data
  const [formData, setFormData] = useState<LeaseFormData>({
    // Sélection
    property_id: "",
    application_id: "",
    template_id: "",
    lease_type: "unfurnished",

    // Parties
    landlord_name: "",
    landlord_address: "",
    landlord_email: "",
    landlord_phone: "",
    tenant_name: "",
    tenant_address: "",
    tenant_email: "",
    tenant_phone: "",

    // Bien
    property_address: "",
    postal_code: "",
    city: "",
    property_type: "",
    surface_area: 0,
    rooms: 0,
    floor: "",
    zone: "",

    // Durée et modalités
    start_date: "",
    end_date: "",
    duration_months: 36,
    payment_mode: "monthly",
    payment_day: 1,

    // Financier
    rent_amount: 0,
    charges_amount: 0,
    total_rent: 0,
    deposit_amount: 0,
    deposit_months: 1,

    // Spécifique meublé
    mandatory_equipment: [],
    additional_equipment: [],
    intended_use: "résidence principale",

    // Énergie
    energy_reference_year: new Date().getFullYear(),
    energy_consumption: 0,
    energy_class: "",
    ges_class: "",

    // Clauses
    clause_resolutoire: true,
    clause_solidarite: false,
    visites_relouer_vendre: true,
    animaux_domestiques: true,
    entretien_appareils: true,
    degradations_locataire: true,
    renonciation_regularisation: false,
    travaux_bailleur: false,
    travaux_locataire: true,
    travaux_entre_locataires: false,
    custom_clauses: "",

    // Signature
    signature_city: "",
    signature_date: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    // Calculer le loyer total
    setFormData((prev) => ({
      ...prev,
      total_rent: prev.rent_amount + prev.charges_amount,
    }))
  }, [formData.rent_amount, formData.charges_amount])

  useEffect(() => {
    // Calculer le dépôt de garantie
    setFormData((prev) => ({
      ...prev,
      deposit_amount: prev.rent_amount * prev.deposit_months,
    }))
  }, [formData.rent_amount, formData.deposit_months])

  useEffect(() => {
    // Calculer la date de fin selon la durée
    if (formData.start_date && formData.duration_months) {
      const startDate = new Date(formData.start_date)
      const endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + formData.duration_months)
      setFormData((prev) => ({
        ...prev,
        end_date: endDate.toISOString().split("T")[0],
      }))
    }
  }, [formData.start_date, formData.duration_months])

  useEffect(() => {
    // Générer l'aperçu quand les données changent
    if (formData.template_id && formData.landlord_name && formData.tenant_name) {
      generatePreview()
    }
  }, [formData])

  const loadInitialData = async () => {
    try {
      setLoading(true)

      // Charger les propriétés du propriétaire
      const propertiesResponse = await fetch("/api/properties/owner")
      const propertiesData = await propertiesResponse.json()
      if (propertiesData.success) {
        setProperties(propertiesData.properties)
      }

      // Charger les candidatures acceptées
      const applicationsResponse = await fetch("/api/applications?status=accepted")
      const applicationsData = await applicationsResponse.json()
      if (applicationsData.success) {
        setApplications(applicationsData.applications)
      }

      // Charger les templates de bail
      const templatesResponse = await fetch("/api/admin/lease-templates?activeOnly=true")
      const templatesData = await templatesResponse.json()
      if (templatesData.success) {
        setLeaseTemplates(templatesData.templates)
      }

      // Charger les clauses
      const clausesResponse = await fetch("/api/lease-clauses?active=true")
      const clausesData = await clausesResponse.json()
      if (clausesData.success) {
        setClauses(clausesData.clauses)
        setClauseCategories(
          clausesData.clauses.reduce(
            (acc, clause) => {
              if (!acc.some((cat) => cat.key === clause.category)) {
                acc.push({ key: clause.category, label: clause.name })
              }
              return acc
            },
            [] as { key: string; label: string }[],
          ),
        )
      }
    } catch (error) {
      console.error("Erreur chargement données:", error)
      toast.error("Erreur lors du chargement des données")
    } finally {
      setLoading(false)
    }
  }

  const handlePropertyChange = (propertyId: string) => {
    const property = properties.find((p) => p.id === propertyId)
    if (property) {
      setFormData((prev) => ({
        ...prev,
        property_id: propertyId,
        property_address: property.address,
        postal_code: property.postal_code,
        city: property.city,
        property_type: property.property_type,
        surface_area: property.surface_area,
        rooms: property.rooms,
        floor: property.floor || "",
        zone: property.zone || "",
      }))
    }
  }

  const handleApplicationChange = (applicationId: string) => {
    const application = applications.find((a) => a.id === applicationId)
    if (application) {
      setFormData((prev) => ({
        ...prev,
        application_id: applicationId,
        tenant_name: application.tenant_name,
        tenant_email: application.tenant_email,
        tenant_phone: application.tenant_phone || "",
        tenant_address: application.tenant_address || "",
      }))
    }
  }

  const handleLeaseTypeChange = (leaseType: "unfurnished" | "furnished") => {
    setFormData((prev) => ({
      ...prev,
      lease_type: leaseType,
      duration_months: leaseType === "furnished" ? 12 : 36,
      deposit_months: leaseType === "furnished" ? 2 : 1,
    }))
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.property_id && formData.application_id && formData.template_id)
      case 2:
        return !!(
          formData.landlord_name &&
          formData.landlord_address &&
          formData.landlord_email &&
          formData.tenant_name &&
          formData.tenant_email
        )
      case 3:
        return !!(
          formData.property_address &&
          formData.postal_code &&
          formData.city &&
          formData.property_type &&
          formData.surface_area > 0 &&
          formData.rooms > 0
        )
      case 4:
        return !!(formData.start_date && formData.end_date && formData.duration_months > 0)
      case 5:
        return formData.rent_amount > 0
      case 6:
        return formData.lease_type === "unfurnished" || formData.mandatory_equipment.length > 0
      case 7:
        return formData.energy_reference_year > 0
      case 8:
        return true // Clauses optionnelles
      case 9:
        return !!(formData.signature_city && formData.signature_date)
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length))
    } else {
      toast.error("Veuillez remplir tous les champs obligatoires")
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }

    try {
      setSaving(true)

      const response = await fetch("/api/leases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Bail créé avec succès ! Vous pouvez maintenant ajouter les annexes.")
        router.push(`/owner/leases/${data.lease.id}`)
      } else {
        toast.error(data.error || "Erreur lors de la création du bail")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la création du bail")
    } finally {
      setSaving(false)
    }
  }

  const getClauseByCategory = (category: string): LeaseClause | undefined => {
    return clauses.find((clause) => clause.category === category && clause.is_default)
  }

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
      bailleur_nom_prenom: formData.landlord_name || "[Nom du bailleur]",
      bailleur_domicile: formData.landlord_address || "[Adresse du bailleur]",
      bailleur_email: formData.landlord_email || "[Email du bailleur]",
      bailleur_telephone: formData.landlord_phone || "[Téléphone du bailleur]",
      bailleur_qualite: "Propriétaire",

      locataire_nom_prenom: formData.tenant_name || "[Nom du locataire]",
      locataire_email: formData.tenant_email || "[Email du locataire]",

      // === LOGEMENT ===
      localisation_logement: formData.property_address || "[Adresse du logement]",
      identifiant_fiscal: "[Identifiant fiscal]",
      type_habitat:
        formData.property_type === "apartment"
          ? "Appartement"
          : formData.property_type === "house"
            ? "Maison"
            : formData.property_type === "studio"
              ? "Studio"
              : "Appartement",
      regime_juridique: "Copropriété",
      periode_construction: "Après 1949",
      surface_habitable: formData.surface_area || "[Surface]",
      surface_m2: formData.surface_area || "[Surface]",
      nombre_pieces: formData.rooms || "[Pièces]",
      autres_parties: "[Autres parties]",
      elements_equipements: formData.mandatory_equipment.join(", ") || "[Équipements]",
      modalite_chauffage: "[Chauffage individuel]",
      modalite_eau_chaude: "[Eau chaude individuelle]",
      niveau_performance_dpe: formData.energy_class || "D",
      destination_locaux: "Usage d'habitation exclusivement",
      locaux_accessoires: "[Locaux accessoires]",
      locaux_communs: "[Parties communes]",
      equipement_technologies: "[Accès internet]",

      // === DURÉE ===
      date_prise_effet: formData.start_date
        ? format(new Date(formData.start_date), "dd/MM/yyyy", { locale: fr })
        : "[Date début]",
      duree_contrat: `${formData.duration_months || "[Durée]"} mois`,
      evenement_duree_reduite: "[Aucun événement particulier]",

      // === FINANCIER ===
      montant_loyer_mensuel: formData.rent_amount || "[Loyer]",
      soumis_loyer_reference: "Non",
      montant_loyer_reference: "[Non applicable]",
      montant_loyer_reference_majore: "[Non applicable]",
      date_revision: "Annuelle selon IRL",
      date_reference_irl: "4ème trimestre de l'année précédente",
      modalite_reglement_charges: "Forfait",
      montant_provisions_charges: `${formData.charges_amount || "0"} €`,
      modalites_revision_forfait: "[Révision annuelle]",
      periodicite_paiement:
        formData.payment_mode === "monthly"
          ? "Mensuelle"
          : formData.payment_mode === "quarterly"
            ? "Trimestrielle"
            : "Mensuelle",
      paiement_echeance: "à terme échu",
      date_paiement: `le ${formData.payment_day || "1"} de chaque mois`,
      lieu_paiement: "Virement bancaire",
      montant_depenses_energie: "[Estimation DPE]",

      // === TRAVAUX ===
      travaux_amelioration: "[Aucun travaux récents]",

      // === GARANTIES ===
      montant_depot_garantie: `${formData.deposit_amount || "[Dépôt]"} €`,

      // === HONORAIRES ===
      honoraires_locataire: "[Selon barème en vigueur]",
      plafond_honoraires_etat_lieux: "[Selon barème en vigueur]",

      // === CLAUSES ===
      clause_solidarite: formData.clause_solidarite ? "Applicable" : "Non applicable",
      clause_resolutoire: formData.clause_resolutoire ? "Applicable" : "Non applicable",
      visites_relouer_vendre: formData.visites_relouer_vendre ? "Autorisées" : "Non autorisées",
      animaux_domestiques: formData.animaux_domestiques ? "Autorisés sous conditions" : "Interdits",
      entretien_appareils: formData.entretien_appareils ? "À la charge du locataire" : "À la charge du bailleur",
      degradations_locataire: formData.degradations_locataire ? "À la charge du locataire" : "Partagées",
      renonciation_regularisation: formData.renonciation_regularisation ? "Applicable" : "Non applicable",
      travaux_bailleur: formData.travaux_bailleur ? "Autorisés" : "Soumis à accord",
      travaux_locataire: formData.travaux_locataire ? "Autorisés sous conditions" : "Interdits",
      travaux_entre_locataires: formData.travaux_entre_locataires ? "Autorisés" : "Non autorisés",

      // === ÉQUIPEMENTS MEUBLÉ ===
      mise_disposition_meubles: formData.mandatory_equipment.join(", ") || "[Aucun équipement]",
      franchise_loyer: formData.intended_use || "Résidence principale",
      clause_libre: formData.custom_clauses || "[Aucune clause particulière]",

      // === SIGNATURE ===
      lieu_signature: formData.signature_city || "[Ville]",
      date_signature: formData.signature_date
        ? format(new Date(formData.signature_date), "dd/MM/yyyy", { locale: fr })
        : format(new Date(), "dd/MM/yyyy", { locale: fr }),

      // === ANNEXES ===
      annexe_dpe: "À fournir après création du bail",
      annexe_risques: "À fournir après création du bail",
      annexe_notice: "À fournir après création du bail",
      annexe_etat_lieux: "À établir lors de la remise des clés",
      annexe_reglement: "À fournir après création du bail",
      annexe_plomb: "[Si applicable]",
      annexe_amiante: "[Si applicable]",
      annexe_electricite_gaz: "À fournir après création du bail",

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

  return (
    <div className="container mx-auto py-6">
      <BreadcrumbNav
        items={[
          { label: "Propriétaire", href: "/owner" },
          { label: "Baux", href: "/owner/leases" },
          { label: "Nouveau bail", href: "/owner/leases/new" },
        ]}
      />

      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Créer un nouveau bail" description="Générez un contrat de location personnalisé" />
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  step.id === currentStep
                    ? "bg-blue-600 text-white"
                    : step.id < currentStep
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-600"
                }`}
              >
                {step.id < currentStep ? <Check className="h-4 w-4" /> : step.id}
              </div>
              {index < STEPS.length - 1 && (
                <div className={`w-12 h-1 mx-2 ${step.id < currentStep ? "bg-green-600" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          <h3 className="font-medium">{STEPS[currentStep - 1].title}</h3>
          <p className="text-sm text-muted-foreground">{STEPS[currentStep - 1].description}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {/* Étape 1: Sélection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="property">Propriété *</Label>
                <Select value={formData.property_id} onValueChange={handlePropertyChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une propriété" />
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
                <Label htmlFor="application">Candidature acceptée *</Label>
                <Select value={formData.application_id} onValueChange={handleApplicationChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une candidature" />
                  </SelectTrigger>
                  <SelectContent>
                    {applications
                      .filter((app) => !formData.property_id || app.property_id === formData.property_id)
                      .map((application) => (
                        <SelectItem key={application.id} value={application.id}>
                          {application.tenant_name} - {application.tenant_email}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="lease_type">Type de bail *</Label>
                <Select
                  value={formData.lease_type}
                  onValueChange={(value: "unfurnished" | "furnished") => handleLeaseTypeChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unfurnished">Bail vide</SelectItem>
                    <SelectItem value="furnished">Bail meublé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="template">Template de bail *</Label>
                <Select
                  value={formData.template_id}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, template_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un template" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaseTemplates
                      .filter((template) => template.lease_type === formData.lease_type)
                      .map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
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
                    <Label htmlFor="landlord_name">Nom complet *</Label>
                    <Input
                      id="landlord_name"
                      value={formData.landlord_name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, landlord_name: e.target.value }))}
                      placeholder="Nom et prénom du bailleur"
                    />
                  </div>
                  <div>
                    <Label htmlFor="landlord_email">Email *</Label>
                    <Input
                      id="landlord_email"
                      type="email"
                      value={formData.landlord_email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, landlord_email: e.target.value }))}
                      placeholder="email@exemple.com"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="landlord_address">Adresse complète *</Label>
                    <Textarea
                      id="landlord_address"
                      value={formData.landlord_address}
                      onChange={(e) => setFormData((prev) => ({ ...prev, landlord_address: e.target.value }))}
                      placeholder="Adresse complète du bailleur"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="landlord_phone">Téléphone</Label>
                    <Input
                      id="landlord_phone"
                      value={formData.landlord_phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, landlord_phone: e.target.value }))}
                      placeholder="01 23 45 67 89"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Locataire</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tenant_name">Nom complet *</Label>
                    <Input
                      id="tenant_name"
                      value={formData.tenant_name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, tenant_name: e.target.value }))}
                      placeholder="Nom et prénom du locataire"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tenant_email">Email *</Label>
                    <Input
                      id="tenant_email"
                      type="email"
                      value={formData.tenant_email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, tenant_email: e.target.value }))}
                      placeholder="email@exemple.com"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="tenant_address">Adresse complète</Label>
                    <Textarea
                      id="tenant_address"
                      value={formData.tenant_address}
                      onChange={(e) => setFormData((prev) => ({ ...prev, tenant_address: e.target.value }))}
                      placeholder="Adresse complète du locataire"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tenant_phone">Téléphone</Label>
                    <Input
                      id="tenant_phone"
                      value={formData.tenant_phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, tenant_phone: e.target.value }))}
                      placeholder="01 23 45 67 89"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Étape 3: Bien */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="property_address">Adresse du bien *</Label>
                  <Input
                    id="property_address"
                    value={formData.property_address}
                    onChange={(e) => setFormData((prev) => ({ ...prev, property_address: e.target.value }))}
                    placeholder="Adresse complète du bien"
                  />
                </div>
                <div>
                  <Label htmlFor="postal_code">Code postal *</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => setFormData((prev) => ({ ...prev, postal_code: e.target.value }))}
                    placeholder="75001"
                  />
                </div>
                <div>
                  <Label htmlFor="city">Ville *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                    placeholder="Paris"
                  />
                </div>
                <div>
                  <Label htmlFor="property_type">Type de bien *</Label>
                  <Select
                    value={formData.property_type}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, property_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Type de bien" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">Appartement</SelectItem>
                      <SelectItem value="house">Maison</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                      <SelectItem value="loft">Loft</SelectItem>
                      <SelectItem value="duplex">Duplex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="surface_area">Surface (m²) *</Label>
                  <Input
                    id="surface_area"
                    type="number"
                    value={formData.surface_area}
                    onChange={(e) => setFormData((prev) => ({ ...prev, surface_area: Number(e.target.value) }))}
                    placeholder="45"
                  />
                </div>
                <div>
                  <Label htmlFor="rooms">Nombre de pièces *</Label>
                  <Input
                    id="rooms"
                    type="number"
                    value={formData.rooms}
                    onChange={(e) => setFormData((prev) => ({ ...prev, rooms: Number(e.target.value) }))}
                    placeholder="2"
                  />
                </div>
                <div>
                  <Label htmlFor="floor">Étage</Label>
                  <Input
                    id="floor"
                    value={formData.floor}
                    onChange={(e) => setFormData((prev) => ({ ...prev, floor: e.target.value }))}
                    placeholder="3ème étage"
                  />
                </div>
                <div>
                  <Label htmlFor="zone">Zone géographique</Label>
                  <Input
                    id="zone"
                    value={formData.zone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, zone: e.target.value }))}
                    placeholder="Centre-ville"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Étape 4: Durée et modalités */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Date de début *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">Date de fin *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="duration_months">Durée (mois) *</Label>
                  <Input
                    id="duration_months"
                    type="number"
                    value={formData.duration_months}
                    onChange={(e) => setFormData((prev) => ({ ...prev, duration_months: Number(e.target.value) }))}
                    placeholder="36"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Modalités de paiement</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="payment_mode">Mode de paiement</Label>
                    <Select
                      value={formData.payment_mode}
                      onValueChange={(value: "monthly" | "quarterly" | "advance") =>
                        setFormData((prev) => ({ ...prev, payment_mode: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Mensuel</SelectItem>
                        <SelectItem value="quarterly">Trimestriel</SelectItem>
                        <SelectItem value="advance">Payé d'avance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="payment_day">Jour de paiement</Label>
                    <Input
                      id="payment_day"
                      type="number"
                      min="1"
                      max="31"
                      value={formData.payment_day}
                      onChange={(e) => setFormData((prev) => ({ ...prev, payment_day: Number(e.target.value) }))}
                      placeholder="1"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Étape 5: Financier */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rent_amount">Loyer hors charges (€) *</Label>
                  <Input
                    id="rent_amount"
                    type="number"
                    step="0.01"
                    value={formData.rent_amount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, rent_amount: Number(e.target.value) }))}
                    placeholder="1200"
                  />
                </div>
                <div>
                  <Label htmlFor="charges_amount">Charges (€)</Label>
                  <Input
                    id="charges_amount"
                    type="number"
                    step="0.01"
                    value={formData.charges_amount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, charges_amount: Number(e.target.value) }))}
                    placeholder="150"
                  />
                </div>
                <div>
                  <Label htmlFor="total_rent">Loyer charges comprises (€)</Label>
                  <Input id="total_rent" type="number" value={formData.total_rent} disabled />
                </div>
                <div>
                  <Label htmlFor="deposit_months">Dépôt de garantie (mois)</Label>
                  <Input
                    id="deposit_months"
                    type="number"
                    value={formData.deposit_months}
                    onChange={(e) => setFormData((prev) => ({ ...prev, deposit_months: Number(e.target.value) }))}
                    placeholder="1"
                  />
                </div>
                <div>
                  <Label htmlFor="deposit_amount">Montant du dépôt (€)</Label>
                  <Input id="deposit_amount" type="number" value={formData.deposit_amount} disabled />
                </div>
              </div>
            </div>
          )}

          {/* Étape 6: Équipements (meublé uniquement) */}
          {currentStep === 6 && (
            <div className="space-y-6">
              {formData.lease_type === "furnished" ? (
                <>
                  <div>
                    <Label htmlFor="mandatory_equipment">Équipements obligatoires *</Label>
                    <Textarea
                      id="mandatory_equipment"
                      value={formData.mandatory_equipment.join("\n")}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          mandatory_equipment: e.target.value.split("\n").filter((item) => item.trim()),
                        }))
                      }
                      placeholder="Literie avec couette&#10;Table et chaises&#10;Réfrigérateur&#10;Plaques de cuisson&#10;Vaisselle de base"
                      rows={6}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Un équipement par ligne</p>
                  </div>

                  <div>
                    <Label htmlFor="additional_equipment">Équipements supplémentaires</Label>
                    <Textarea
                      id="additional_equipment"
                      value={formData.additional_equipment.join("\n")}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          additional_equipment: e.target.value.split("\n").filter((item) => item.trim()),
                        }))
                      }
                      placeholder="Lave-linge&#10;Télévision&#10;Micro-ondes"
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Un équipement par ligne</p>
                  </div>

                  <div>
                    <Label htmlFor="intended_use">Usage prévu</Label>
                    <Select
                      value={formData.intended_use}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, intended_use: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="résidence principale">Résidence principale</SelectItem>
                        <SelectItem value="résidence secondaire">Résidence secondaire</SelectItem>
                        <SelectItem value="logement étudiant">Logement étudiant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>Cette étape ne s'applique qu'aux baux meublés.</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Étape 7: Énergie */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="energy_reference_year">Année de référence *</Label>
                  <Input
                    id="energy_reference_year"
                    type="number"
                    value={formData.energy_reference_year}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, energy_reference_year: Number(e.target.value) }))
                    }
                    placeholder="2024"
                  />
                </div>
                <div>
                  <Label htmlFor="energy_consumption">Consommation (kWh/m²/an)</Label>
                  <Input
                    id="energy_consumption"
                    type="number"
                    value={formData.energy_consumption}
                    onChange={(e) => setFormData((prev) => ({ ...prev, energy_consumption: Number(e.target.value) }))}
                    placeholder="150"
                  />
                </div>
                <div>
                  <Label htmlFor="energy_class">Classe énergétique</Label>
                  <Select
                    value={formData.energy_class}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, energy_class: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Classe énergétique" />
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
                  <Label htmlFor="ges_class">Classe GES</Label>
                  <Select
                    value={formData.ges_class}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, ges_class: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Classe GES" />
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
              </div>
            </div>
          )}

          {/* Étape 8: Clauses */}
          {currentStep === 8 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium mb-4">Clauses particulières</h3>
              <div className="space-y-4">
                {clauseCategories.map((clause) => {
                  const clauseData = getClauseByCategory(clause.key)
                  return (
                    <div key={clause.key} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={clause.key}
                            checked={formData[clause.key as keyof LeaseFormData] as boolean}
                            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, [clause.key]: checked }))}
                          />
                          <Label htmlFor={clause.key} className="font-medium">
                            {clause.label}
                          </Label>
                        </div>
                        {clauseData && (
                          <Badge variant="secondary" className="text-xs">
                            Configurable
                          </Badge>
                        )}
                      </div>
                      {clauseData && (
                        <p className="text-sm text-muted-foreground bg-gray-50 p-2 rounded border-l-4 border-blue-200">
                          {clauseData.clause_text}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>

              <div>
                <Label htmlFor="custom_clauses">Clauses personnalisées</Label>
                <Textarea
                  id="custom_clauses"
                  value={formData.custom_clauses}
                  onChange={(e) => setFormData((prev) => ({ ...prev, custom_clauses: e.target.value }))}
                  placeholder="Ajoutez ici des clauses personnalisées..."
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Étape 9: Signature */}
          {currentStep === 9 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="signature_city">Ville de signature *</Label>
                  <Input
                    id="signature_city"
                    value={formData.signature_city}
                    onChange={(e) => setFormData((prev) => ({ ...prev, signature_city: e.target.value }))}
                    placeholder="Paris"
                  />
                </div>
                <div>
                  <Label htmlFor="signature_date">Date de signature *</Label>
                  <Input
                    id="signature_date"
                    type="date"
                    value={formData.signature_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, signature_date: e.target.value }))}
                  />
                </div>
              </div>

              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Une fois le bail créé, vous pourrez ajouter les annexes et documents obligatoires depuis la page de
                  détail du bail.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      {previewContent && (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Aperçu du contrat</h3>
          <div
            className="border rounded-lg max-h-96 overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: previewContent }}
          />
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Précédent
        </Button>

        {currentStep < STEPS.length ? (
          <Button onClick={nextStep} disabled={!validateStep(currentStep)}>
            Suivant
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={saving || !validateStep(currentStep)}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Création...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Créer le bail
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
