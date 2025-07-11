import { supabase } from "./supabase"

export interface TenantInfo {
  id?: string
  type: "main" | "cotenant" | "spouse"
  first_name: string
  last_name: string
  birth_date: string
  birth_place: string
  nationality: string

  // Situation d'hébergement actuel
  current_housing_situation: "locataire" | "heberge" | "proprietaire"
  current_housing_documents: {
    quittances_loyer?: string[] // 3 dernières quittances
    attestation_bon_paiement?: string
    attestation_hebergement?: string
    avis_taxe_fonciere?: string
  }

  // Activité principale (avec profession et entreprise ajoutées)
  main_activity: "cdi" | "cdd" | "fonction_publique" | "independant" | "retraite" | "chomage" | "etudes" | "alternance"
  profession?: string // Ajouté ici
  company?: string // Ajouté ici
  activity_documents: string[] // Documents spécifiques à l'activité

  // Revenus détaillés
  income_sources: {
    work_income?: {
      type: "salarie" | "independant" | "intermittent" | "artiste_auteur"
      amount: number
      documents: string[]
    }
    social_aid?: Array<{
      type: "caf_msa" | "france_travail" | "apl_aah" | "autre"
      duration: "moins_3_mois" | "plus_3_mois" | "pas_encore"
      amount: number
      documents: string[]
    }>
    retirement_pension?: Array<{
      type: "retraite" | "pension_invalidite" | "pension_alimentaire"
      has_bulletin?: boolean
      duration?: "moins_3_mois" | "plus_3_mois" | "pas_encore"
      amount: number
      documents: string[]
    }>
    rent_income?: Array<{
      type: "revenus_locatifs" | "rente_viagere" | "autre_rente"
      has_receipt?: boolean
      amount: number
      documents: string[]
    }>
    scholarship?: {
      amount: number
      documents: string[]
    }
    no_income?: {
      explanation: string
      documents: string[]
    }
  }

  // Avis d'imposition
  tax_situation: {
    type: "own_notice" | "attached_to_parents" | "less_than_year" | "other"
    explanation?: string
    documents: string[]
  }

  // Documents d'identité
  identity_documents: string[]
}

export interface GuarantorInfo {
  id?: string
  type: "physical" | "organism" | "moral_person" | "none"

  // Pour personne physique - mêmes infos que TenantInfo
  personal_info?: TenantInfo

  // Pour organisme
  organism_type?: "visale" | "autre"
  organism_name?: string

  // Pour personne morale
  company_name?: string
  kbis_documents?: string[]
}

export interface RentalFileData {
  id?: string
  tenant_id: string

  // Étape 1: Locataire principal
  main_tenant: TenantInfo

  // Étape 2: Colocataires (selon situation) + Message de présentation
  rental_situation: "alone" | "couple" | "colocation"
  cotenants: TenantInfo[]
  presentation_message?: string // Ajouté ici

  // Étape 3: Garants
  guarantors: GuarantorInfo[]

  // Métadonnées
  status: "draft" | "in_progress" | "completed" | "validated"
  completion_percentage: number
  validation_score: number
  created_at?: string
  updated_at?: string
}

export interface RentalFile {
  id: string
  tenant_id: string
  monthly_income?: number
  profession?: string
  company?: string
  presentation_message?: string
  desired_move_date?: string
  guarantor_income?: number
  has_guarantor?: boolean
  professional_situation?: string
  contract_type?: string
  guarantor_profession?: string

  // Nouvelles colonnes pour stocker les données complètes
  main_tenant?: TenantInfo
  cotenants?: TenantInfo[]
  guarantors?: GuarantorInfo[]
  rental_situation?: "alone" | "couple" | "colocation"
  status?: "draft" | "in_progress" | "completed" | "validated"
  completion_percentage?: number
  validation_score?: number

  created_at: string
  updated_at: string
}

export interface CompatibilityResult {
  compatible: boolean
  score: number
  warnings: string[]
  recommendations: string[]
  details: {
    income_check: { passed: boolean; message: string }
    professional_situation_check: { passed: boolean; message: string }
    guarantor_check: { passed: boolean; message: string }
    documents_check: { passed: boolean; message: string }
  }
}

// Activités principales avec documents requis
export const MAIN_ACTIVITIES = [
  {
    value: "cdi",
    label: "CDI",
    description: "Contrat à durée indéterminée",
    required_documents: [
      "Contrat de travail complet et signé (toutes les pages)",
      "Ou attestation employeur de moins de 3 mois",
    ],
  },
  {
    value: "cdd",
    label: "CDD",
    description: "Contrat à durée déterminée",
    required_documents: [
      "Contrat de travail en cours ou à venir, complet et signé",
      "Ou attestation employeur de moins de 3 mois",
    ],
  },
  {
    value: "fonction_publique",
    label: "Fonction publique",
    description: "Agent de la fonction publique",
    required_documents: ["Arrêté de nomination en cours ou à venir", "Ou attestation employeur de moins de 3 mois"],
  },
  {
    value: "independant",
    label: "Indépendant",
    description: "Travailleur indépendant",
    required_documents: [
      "Carte professionnelle (profession libérale)",
      "Ou extrait K/Kbis de moins de 3 mois",
      "Ou avis de situation SIRENE de moins de 3 mois",
      "Ou fiche d'immatriculation RNE de moins de 3 mois",
    ],
  },
  {
    value: "retraite",
    label: "Retraite",
    description: "Retraité",
    required_documents: [
      "Bulletin de pension de moins de 2 ans",
      "Ou attestation de paiement de pension",
      "Ou titre de pension de retraite",
      "Ou dernier avis d'imposition complet",
    ],
  },
  {
    value: "chomage",
    label: "Chômage",
    description: "Demandeur d'emploi",
    required_documents: [
      "Avis de situation France Travail de moins de 3 mois",
      "Ou attestation d'ouverture de droits ARE",
    ],
  },
  {
    value: "etudes",
    label: "Études",
    description: "Étudiant",
    required_documents: ["Carte d'étudiant", "Ou certificat de scolarité", "Ou attestation d'inscription Parcoursup"],
  },
  {
    value: "alternance",
    label: "Alternance",
    description: "Contrat d'apprentissage ou de professionnalisation",
    required_documents: ["Contrat d'apprentissage ou de professionnalisation complet et signé"],
  },
]

export const WORK_INCOME_TYPES = [
  { value: "salarie", label: "Salarié", description: "Employé avec contrat de travail" },
  { value: "independant", label: "Indépendant", description: "Travailleur indépendant" },
  { value: "intermittent", label: "Intermittent", description: "Intermittent du spectacle" },
  { value: "artiste_auteur", label: "Artiste-auteur", description: "Artiste ou auteur" },
]

export const SOCIAL_AID_TYPES = [
  { value: "caf_msa", label: "Aide de la CAF ou MSA", description: "RSA, prime d'activité..." },
  { value: "france_travail", label: "Aide de France Travail", description: "Chômage, ARE..." },
  { value: "apl_aah", label: "APL / AAH", description: "Aide au logement ou allocation handicapés" },
  { value: "autre", label: "Autre aide", description: "Autre type d'aide sociale" },
]

export const DURATION_OPTIONS = [
  { value: "moins_3_mois", label: "Depuis moins de 3 mois" },
  { value: "plus_3_mois", label: "Depuis plus de 3 mois" },
  { value: "pas_encore", label: "Vous ne touchez pas encore l'aide" },
]

export const TAX_SITUATIONS = [
  { value: "own_notice", label: "Vous avez un avis d'imposition à votre nom" },
  { value: "attached_to_parents", label: "Vous êtes rattaché fiscalement à vos parents" },
  { value: "less_than_year", label: "Vous êtes en France depuis moins d'un an" },
  { value: "other", label: "Autre situation" },
]

export const CURRENT_HOUSING_SITUATIONS = [
  {
    value: "locataire",
    label: "Locataire",
    description: "Vous louez actuellement un logement",
    options: [
      { value: "has_quittances", label: "Vous avez vos 3 dernières quittances de loyer" },
      { value: "has_attestation", label: "Vous avez une attestation de bon paiement des loyers" },
    ],
  },
  {
    value: "heberge",
    label: "Hébergé chez quelqu'un",
    description: "Vous êtes hébergé chez quelqu'un",
    options: [
      { value: "has_attestation", label: "Vous avez une attestation d'hébergement de moins de 3 mois" },
      { value: "no_attestation", label: "Vous n'avez pas d'attestation d'hébergement" },
    ],
  },
  {
    value: "proprietaire",
    label: "Propriétaire",
    description: "Vous êtes propriétaire de votre logement actuel",
    options: [{ value: "taxe_fonciere", label: "Avis de taxe foncière 2024" }],
  },
]

export const GUARANTOR_TYPES = [
  { value: "physical", label: "Une personne", description: "Un parent, un proche" },
  { value: "organism", label: "Un organisme", description: "Visale, autre organisme" },
  { value: "moral_person", label: "Une personne morale", description: "Une entreprise" },
  { value: "none", label: "Vous n'avez pas de garant", description: "Aucun garant" },
]

export const RENTAL_SITUATIONS = [
  { value: "alone", label: "seul", description: "Vous serez le seul locataire" },
  { value: "couple", label: "en couple", description: "Vous et votre conjoint(e)" },
  { value: "colocation", label: "en colocation", description: "Plusieurs colocataires" },
]

export const RETIREMENT_PENSION_TYPES = [
  { value: "retraite", label: "Une retraite", description: "Pension de retraite" },
  { value: "pension_invalidite", label: "Une pension d'invalidité", description: "Pension d'invalidité" },
  { value: "pension_alimentaire", label: "Une pension alimentaire", description: "Pension alimentaire" },
]

export const RENT_INCOME_TYPES = [
  { value: "revenus_locatifs", label: "Des revenus locatifs", description: "Revenus de location immobilière" },
  { value: "rente_viagere", label: "Une rente viagère", description: "Rente viagère" },
  { value: "autre_rente", label: "Autre type de rente", description: "Autre rente" },
]

export const rentalFileService = {
  async getRentalFile(tenantId: string): Promise<RentalFile | null> {
    console.log("📋 RentalFileService.getRentalFile", tenantId)

    try {
      const { data, error } = await supabase.from("rental_files").select("*").eq("tenant_id", tenantId).single()

      if (error) {
        if (error.code === "PGRST116") {
          // Pas de dossier trouvé
          return null
        }
        console.error("❌ Erreur récupération dossier:", error)
        throw new Error(error.message)
      }

      console.log("✅ Dossier récupéré")
      return data as RentalFile
    } catch (error) {
      console.error("❌ Erreur dans getRentalFile:", error)
      return null
    }
  },

  checkCompatibility(rentalFileData: RentalFile | null, property: any): CompatibilityResult {
    console.log("🔍 Vérification compatibilité dossier avec critères propriétaire")

    const warnings: string[] = []
    const recommendations: string[] = []
    let score = 100

    // Utiliser les revenus du travail du dossier de location complet
    const workIncome = rentalFileData?.main_tenant?.income_sources?.work_income?.amount || 0
    const totalIncome = this.calculateTotalIncome(rentalFileData?.main_tenant?.income_sources || {})
    const rent = property.price || 0

    // Détails des vérifications
    const details = {
      income_check: { passed: false, message: "" },
      professional_situation_check: { passed: false, message: "" },
      guarantor_check: { passed: false, message: "" },
      documents_check: { passed: false, message: "" },
    }

    // 1. Vérification des revenus selon les critères du propriétaire
    if (property.min_income_required && totalIncome > 0) {
      if (totalIncome >= property.min_income_required) {
        details.income_check.passed = true
        details.income_check.message = `Revenus suffisants (${totalIncome}€ ≥ ${property.min_income_required}€ requis)`
      } else {
        score -= 40
        details.income_check.message = `Revenus insuffisants (${totalIncome}€ < ${property.min_income_required}€ requis)`
        warnings.push(`Revenus insuffisants : ${totalIncome}€ (minimum requis : ${property.min_income_required}€)`)

        // Vérifier si un garant peut compenser
        if (rentalFileData?.guarantors && rentalFileData.guarantors.length > 0) {
          const guarantor = rentalFileData.guarantors[0]
          if (guarantor.type === "physical" && guarantor.personal_info?.income_sources?.work_income?.amount) {
            const guarantorIncome = this.calculateTotalIncome(guarantor.personal_info.income_sources)
            const totalWithGuarantor = totalIncome + guarantorIncome
            if (totalWithGuarantor >= property.min_income_required) {
              score += 20
              details.income_check.passed = true
              details.income_check.message += ` - Compensé par le garant (total: ${totalWithGuarantor}€)`
              recommendations.push("Votre garant compense l'insuffisance de revenus")
            }
          }
        }
      }
    } else if (property.income_multiplier && rent > 0 && totalIncome > 0) {
      // Utiliser le multiplicateur de revenus (par défaut 3x le loyer)
      const requiredIncome = rent * property.income_multiplier
      if (totalIncome >= requiredIncome) {
        details.income_check.passed = true
        details.income_check.message = `Revenus suffisants (${totalIncome}€ ≥ ${requiredIncome}€ requis, soit ${property.income_multiplier}x le loyer)`
      } else {
        score -= 30
        details.income_check.message = `Revenus insuffisants (${totalIncome}€ < ${requiredIncome}€ requis, soit ${property.income_multiplier}x le loyer)`
        warnings.push(
          `Revenus insuffisants : ${totalIncome}€ (requis : ${property.income_multiplier}x le loyer = ${requiredIncome}€)`,
        )
      }
    } else if (totalIncome === 0) {
      score -= 30
      details.income_check.message = "Revenus non renseignés dans votre dossier de location"
      warnings.push("Revenus non renseignés dans votre dossier de location")
      recommendations.push("Complétez vos revenus dans votre dossier de location")
    } else {
      // Pas de critères spécifiques, utiliser la règle générale des 33%
      const ratio = (rent / totalIncome) * 100
      if (ratio <= 33) {
        details.income_check.passed = true
        details.income_check.message = `Ratio loyer/revenus acceptable (${ratio.toFixed(1)}%)`
      } else {
        score -= 20
        details.income_check.message = `Ratio loyer/revenus élevé (${ratio.toFixed(1)}%)`
        warnings.push(`Le loyer représente ${ratio.toFixed(1)}% de vos revenus (recommandé: max 33%)`)
      }
    }

    // 2. Vérification de la situation professionnelle
    if (property.accepted_professional_situations && property.accepted_professional_situations.length > 0) {
      const tenantSituation = rentalFileData?.main_tenant?.main_activity
      if (tenantSituation && property.accepted_professional_situations.includes(tenantSituation)) {
        details.professional_situation_check.passed = true
        details.professional_situation_check.message = `Situation professionnelle acceptée (${tenantSituation})`
      } else if (tenantSituation) {
        score -= 20
        details.professional_situation_check.message = `Situation professionnelle non préférée (${tenantSituation})`
        warnings.push(
          `Votre situation professionnelle (${tenantSituation}) n'est pas dans les préférences du propriétaire`,
        )
      } else {
        score -= 15
        details.professional_situation_check.message = "Situation professionnelle non renseignée"
        warnings.push("Situation professionnelle non renseignée")
        recommendations.push("Ajoutez votre situation professionnelle à votre dossier")
      }
    } else {
      // Vérification basique si pas de critères spécifiques
      if (rentalFileData?.main_tenant?.profession) {
        details.professional_situation_check.passed = true
        details.professional_situation_check.message = `Profession renseignée (${rentalFileData.main_tenant.profession})`
      } else {
        score -= 10
        details.professional_situation_check.message = "Profession non renseignée"
        warnings.push("Profession non renseignée")
        recommendations.push("Ajoutez votre profession à votre dossier")
      }
    }

    // 3. Vérification du garant
    if (property.guarantor_required) {
      if (rentalFileData?.guarantors && rentalFileData.guarantors.length > 0) {
        const guarantor = rentalFileData.guarantors[0]
        if (guarantor.type === "physical" && guarantor.personal_info) {
          const guarantorIncome = this.calculateTotalIncome(guarantor.personal_info.income_sources || {})
          if (property.min_guarantor_income && guarantorIncome >= property.min_guarantor_income) {
            details.guarantor_check.passed = true
            details.guarantor_check.message = `Garant avec revenus suffisants (${guarantorIncome}€ ≥ ${property.min_guarantor_income}€ requis)`
          } else if (guarantorIncome > 0) {
            details.guarantor_check.passed = true
            details.guarantor_check.message = "Garant présent avec revenus"
          } else {
            score -= 10
            details.guarantor_check.message = "Garant présent mais revenus non renseignés"
            recommendations.push("Complétez les revenus de votre garant")
          }
        } else {
          details.guarantor_check.passed = true
          details.guarantor_check.message = "Garant présent (organisme ou personne morale)"
        }
      } else {
        score -= 25
        details.guarantor_check.message = "Garant requis mais absent"
        warnings.push("Un garant est requis pour ce logement")
        recommendations.push("Ajoutez un garant à votre dossier")
      }
    } else {
      // Garant non requis mais peut être un plus
      if (rentalFileData?.guarantors && rentalFileData.guarantors.length > 0) {
        score += 10
        details.guarantor_check.passed = true
        details.guarantor_check.message = "Garant présent (bonus)"
        recommendations.push("Votre garant renforce votre dossier")
      } else {
        details.guarantor_check.passed = true
        details.guarantor_check.message = "Garant non requis"
      }
    }

    // 4. Vérification du message de présentation
    if (!rentalFileData?.presentation_message || rentalFileData.presentation_message.length < 50) {
      score -= 10
      details.documents_check.message = "Message de présentation incomplet"
      warnings.push("Message de présentation incomplet")
      recommendations.push("Rédigez un message de présentation détaillé dans votre dossier")
    } else {
      details.documents_check.passed = true
      details.documents_check.message = "Message de présentation complet"
    }

    // S'assurer que le score reste dans les limites
    score = Math.max(0, Math.min(100, score))

    const compatible = score >= 60

    return {
      compatible,
      score,
      warnings,
      recommendations,
      details,
    }
  },

  async createRentalFile(rentalFileData: Partial<RentalFile>): Promise<RentalFile> {
    console.log("📋 RentalFileService.createRentalFile")

    try {
      const { data, error } = await supabase
        .from("rental_files")
        .insert({
          ...rentalFileData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error("❌ Erreur création dossier:", error)
        throw new Error(error.message)
      }

      console.log("✅ Dossier créé")
      return data as RentalFile
    } catch (error) {
      console.error("❌ Erreur dans createRentalFile:", error)
      throw error
    }
  },

  async updateRentalFile(tenantId: string, updates: Partial<RentalFile>): Promise<RentalFile> {
    console.log("📋 RentalFileService.updateRentalFile")

    try {
      // Calculer le pourcentage de complétion si les données complètes sont fournies
      if (updates.main_tenant) {
        updates.completion_percentage = this.calculateCompletionPercentage(updates as any)
      }

      const { data, error } = await supabase
        .from("rental_files")
        .upsert({
          tenant_id: tenantId,
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error("❌ Erreur mise à jour dossier:", error)
        throw new Error(error.message)
      }

      console.log("✅ Dossier mis à jour")
      return data as RentalFile
    } catch (error) {
      console.error("❌ Erreur dans updateRentalFile:", error)
      throw error
    }
  },

  // Calculer le pourcentage de complétion
  calculateCompletionPercentage(fileData: Partial<RentalFile>): number {
    const diagnostic = this.getDiagnostic(fileData)
    const totalRequired = diagnostic.required.length
    const completed = diagnostic.required.filter((item) => item.completed).length

    return totalRequired > 0 ? Math.round((completed / totalRequired) * 100) : 0
  },

  getDiagnostic(fileData: Partial<RentalFile>): {
    required: Array<{
      category: string
      item: string
      completed: boolean
      description: string
    }>
    optional: Array<{
      category: string
      item: string
      completed: boolean
      description: string
    }>
  } {
    const required: any[] = []
    const optional: any[] = []

    if (!fileData.main_tenant) {
      required.push({
        category: "Locataire principal",
        item: "Profil complet",
        completed: false,
        description: "Créer le profil du locataire principal",
      })
      return { required, optional }
    }

    const tenant = fileData.main_tenant

    // Identité (obligatoire)
    required.push({
      category: "Identité",
      item: "Prénom",
      completed: !!tenant.first_name?.trim(),
      description: "Prénom du locataire",
    })

    required.push({
      category: "Identité",
      item: "Nom",
      completed: !!tenant.last_name?.trim(),
      description: "Nom du locataire",
    })

    required.push({
      category: "Identité",
      item: "Pièce d'identité",
      completed: !!(tenant.identity_documents?.length > 0),
      description: "Carte d'identité, passeport ou titre de séjour",
    })

    // Informations personnelles (optionnelles mais recommandées)
    optional.push({
      category: "Identité",
      item: "Date de naissance",
      completed: !!tenant.birth_date,
      description: "Date de naissance",
    })

    optional.push({
      category: "Identité",
      item: "Lieu de naissance",
      completed: !!tenant.birth_place,
      description: "Lieu de naissance",
    })

    // Logement actuel (obligatoire)
    required.push({
      category: "Logement actuel",
      item: "Situation d'hébergement",
      completed: !!tenant.current_housing_situation,
      description: "Votre situation d'hébergement actuelle",
    })

    // Documents logement selon situation
    if (tenant.current_housing_situation === "locataire") {
      required.push({
        category: "Logement actuel",
        item: "Quittances de loyer",
        completed: !!(tenant.current_housing_documents?.quittances_loyer?.length > 0),
        description: "3 dernières quittances de loyer",
      })
    } else if (tenant.current_housing_situation === "heberge") {
      required.push({
        category: "Logement actuel",
        item: "Attestation d'hébergement",
        completed: !!(tenant.current_housing_documents?.attestation_hebergement?.length > 0),
        description: "Attestation d'hébergement de moins de 3 mois",
      })
    } else if (tenant.current_housing_situation === "proprietaire") {
      required.push({
        category: "Logement actuel",
        item: "Taxe foncière",
        completed: !!(tenant.current_housing_documents?.avis_taxe_fonciere?.length > 0),
        description: "Avis de taxe foncière",
      })
    }

    // Activité professionnelle (obligatoire)
    required.push({
      category: "Activité professionnelle",
      item: "Activité principale",
      completed: !!tenant.main_activity,
      description: "Votre activité professionnelle principale",
    })

    // Profession et entreprise (optionnelles mais recommandées)
    optional.push({
      category: "Activité professionnelle",
      item: "Profession",
      completed: !!tenant.profession,
      description: "Votre profession exacte",
    })

    optional.push({
      category: "Activité professionnelle",
      item: "Entreprise",
      completed: !!tenant.company,
      description: "Nom de votre entreprise",
    })

    required.push({
      category: "Activité professionnelle",
      item: "Justificatifs d'activité",
      completed: !!(tenant.activity_documents?.length > 0),
      description: "Documents justifiant votre activité",
    })

    // Revenus (au moins une source obligatoire)
    const hasIncomeSource = tenant.income_sources && Object.keys(tenant.income_sources).length > 0
    required.push({
      category: "Revenus",
      item: "Source de revenus",
      completed: hasIncomeSource,
      description: "Au moins une source de revenus déclarée",
    })

    // Vérifier les justificatifs pour chaque source de revenus déclarée
    if (tenant.income_sources?.work_income) {
      required.push({
        category: "Revenus",
        item: "Justificatifs revenus travail",
        completed: !!(tenant.income_sources.work_income.documents?.length > 0),
        description: "Justificatifs des revenus du travail",
      })
    }

    if (tenant.income_sources?.social_aid?.length > 0) {
      tenant.income_sources.social_aid.forEach((aid: any, index: number) => {
        required.push({
          category: "Revenus",
          item: `Justificatifs aide sociale ${index + 1}`,
          completed: !!(aid.documents?.length > 0),
          description: `Justificatifs de l'aide sociale ${index + 1}`,
        })
      })
    }

    if (tenant.income_sources?.retirement_pension?.length > 0) {
      tenant.income_sources.retirement_pension.forEach((pension: any, index: number) => {
        required.push({
          category: "Revenus",
          item: `Justificatifs retraite/pension ${index + 1}`,
          completed: !!(pension.documents?.length > 0),
          description: `Justificatifs de la retraite/pension ${index + 1}`,
        })
      })
    }

    if (tenant.income_sources?.rent_income?.length > 0) {
      tenant.income_sources.rent_income.forEach((rent: any, index: number) => {
        required.push({
          category: "Revenus",
          item: `Justificatifs rente ${index + 1}`,
          completed: !!(rent.documents?.length > 0),
          description: `Justificatifs de la rente ${index + 1}`,
        })
      })
    }

    if (tenant.income_sources?.scholarship) {
      optional.push({
        category: "Revenus",
        item: "Justificatifs bourse",
        completed: !!(tenant.income_sources.scholarship.documents?.length > 0),
        description: "Justificatifs de bourse",
      })
    }

    // Fiscalité (obligatoire)
    required.push({
      category: "Fiscalité",
      item: "Situation fiscale",
      completed: !!tenant.tax_situation?.type,
      description: "Votre situation fiscale",
    })

    required.push({
      category: "Fiscalité",
      item: "Avis d'imposition",
      completed: !!(tenant.tax_situation?.documents?.length > 0),
      description: "Avis d'imposition ou justificatif fiscal",
    })

    // Situation de location (obligatoire)
    required.push({
      category: "Situation de location",
      item: "Type de location",
      completed: !!fileData.rental_situation,
      description: "Seul, en couple ou en colocation",
    })

    // Message de présentation (optionnel mais recommandé)
    optional.push({
      category: "Présentation",
      item: "Message de présentation",
      completed: !!(fileData.presentation_message && fileData.presentation_message.length >= 50),
      description: "Message de présentation pour les propriétaires",
    })

    // Colocataires (si applicable)
    if (fileData.rental_situation === "colocation" || fileData.rental_situation === "couple") {
      const expectedCotenants = fileData.rental_situation === "couple" ? 1 : 1 // Au moins 1
      const hasCotenants = fileData.cotenants && fileData.cotenants.length >= expectedCotenants

      required.push({
        category: "Colocataires",
        item: fileData.rental_situation === "couple" ? "Profil conjoint(e)" : "Profils colocataires",
        completed: hasCotenants,
        description: `Profil(s) des ${fileData.rental_situation === "couple" ? "conjoint(e)" : "colocataires"}`,
      })

      // Vérifier la complétude de chaque colocataire
      fileData.cotenants?.forEach((cotenant: any, index: number) => {
        const cotenantDiagnostic = this.getDiagnostic({ main_tenant: cotenant })
        cotenantDiagnostic.required.forEach((item) => {
          required.push({
            category: `${fileData.rental_situation === "couple" ? "Conjoint(e)" : `Colocataire ${index + 1}`}`,
            item: item.item,
            completed: item.completed,
            description: item.description,
          })
        })
      })
    }

    // Garants (optionnel mais recommandé)
    optional.push({
      category: "Garants",
      item: "Au moins un garant",
      completed: !!(fileData.guarantors && fileData.guarantors.length > 0),
      description: "Garant pour renforcer le dossier",
    })

    return { required, optional }
  },

  // Calculer le total des revenus
  calculateTotalIncome(incomeSources: any): number {
    let total = 0

    if (incomeSources?.work_income?.amount) {
      total += incomeSources.work_income.amount
    }

    if (incomeSources?.social_aid) {
      incomeSources.social_aid.forEach((aid: any) => {
        total += aid.amount || 0
      })
    }

    if (incomeSources?.retirement_pension) {
      incomeSources.retirement_pension.forEach((pension: any) => {
        total += pension.amount || 0
      })
    }

    if (incomeSources?.rent_income) {
      incomeSources.rent_income.forEach((rent: any) => {
        total += rent.amount || 0
      })
    }

    if (incomeSources?.scholarship?.amount) {
      total += incomeSources.scholarship.amount
    }

    return total
  },

  // Obtenir la liste des documents manquants
  getMissingDocuments(fileData: RentalFile | null): string[] {
    if (!fileData || !fileData.main_tenant) {
      return ["Dossier de location non créé"]
    }

    const missingDocs: string[] = []
    const tenant = fileData.main_tenant

    // Vérifier les documents d'identité
    if (!tenant.identity_documents?.length) {
      missingDocs.push("Pièce d'identité")
    }

    // Vérifier les documents d'activité
    if (!tenant.activity_documents?.length) {
      missingDocs.push("Documents justificatifs d'activité")
    }

    // Vérifier l'avis d'imposition
    if (!tenant.tax_situation?.documents?.length) {
      missingDocs.push("Avis d'imposition")
    }

    // Vérifier les justificatifs de revenus
    if (!tenant.income_sources || Object.keys(tenant.income_sources).length === 0) {
      missingDocs.push("Justificatifs de revenus")
    }

    return missingDocs
  },

  // Créer un profil vide
  createEmptyTenantProfile(type: "main" | "cotenant" | "spouse"): TenantInfo {
    return {
      type,
      first_name: "",
      last_name: "",
      birth_date: "",
      birth_place: "",
      nationality: "française",
      current_housing_situation: "locataire",
      current_housing_documents: {},
      main_activity: "cdi",
      profession: "", // Ajouté
      company: "", // Ajouté
      activity_documents: [],
      income_sources: {},
      tax_situation: {
        type: "own_notice",
        documents: [],
      },
      identity_documents: [],
    }
  },

  // Vérifier si le dossier est éligible pour candidature
  isEligibleForApplication(fileData: RentalFile | null): {
    eligible: boolean
    reasons: string[]
    recommendations: string[]
  } {
    const reasons: string[] = []
    const recommendations: string[] = []

    if (!fileData) {
      return {
        eligible: false,
        reasons: ["Aucun dossier de location"],
        recommendations: ["Créez votre dossier de location"],
      }
    }

    // Vérifications obligatoires
    if (!fileData.main_tenant?.identity_documents?.length) {
      reasons.push("Pièce d'identité manquante")
    }

    if (!fileData.main_tenant?.tax_situation?.documents?.length) {
      reasons.push("Avis d'imposition manquant")
    }

    if ((fileData.completion_percentage || 0) < 70) {
      reasons.push("Dossier incomplet")
      recommendations.push("Complétez votre dossier à au moins 70%")
    }

    return {
      eligible: reasons.length === 0,
      reasons,
      recommendations,
    }
  },

  // Initialiser un dossier avec les données utilisateur
  async initializeFromUserData(tenantId: string, userData: any): Promise<RentalFile> {
    const mainTenant = this.createEmptyTenantProfile("main")
    mainTenant.first_name = userData.first_name || ""
    mainTenant.last_name = userData.last_name || ""

    const initialData: Partial<RentalFile> = {
      tenant_id: tenantId,
      main_tenant: mainTenant,
      cotenants: [],
      guarantors: [],
      rental_situation: "alone",
      status: "draft",
      completion_percentage: 0,
      validation_score: 0,
    }

    return this.updateRentalFile(tenantId, initialData)
  },

  // Convertir les données du dossier complet vers le format simple pour les candidatures
  convertToSimpleFormat(fileData: RentalFile): Partial<RentalFile> {
    const totalIncome = this.calculateTotalIncome(fileData.main_tenant?.income_sources || {})

    return {
      tenant_id: fileData.tenant_id,
      monthly_income: totalIncome,
      profession: fileData.main_tenant?.profession,
      company: fileData.main_tenant?.company,
      presentation_message: fileData.presentation_message,
      professional_situation: fileData.main_tenant?.main_activity,
      has_guarantor: !!(fileData.guarantors && fileData.guarantors.length > 0),
      guarantor_income:
        fileData.guarantors?.[0]?.type === "physical"
          ? this.calculateTotalIncome(fileData.guarantors[0].personal_info?.income_sources || {})
          : undefined,
      guarantor_profession:
        fileData.guarantors?.[0]?.type === "physical" ? fileData.guarantors[0].personal_info?.profession : undefined,
    }
  },
}
