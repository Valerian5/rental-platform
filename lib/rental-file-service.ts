import { supabase } from "./supabase"

export interface PersonProfile {
  id?: string
  type: "main_tenant" | "cotenant" | "guarantor"

  // Informations personnelles
  first_name: string
  last_name: string
  birth_date: string
  birth_place: string
  nationality: string

  // Activité principale
  main_activity: "cdi" | "cdd" | "fonction_publique" | "independant" | "retraite" | "chomage" | "etudes" | "alternance"

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

  // Documents de domicile (pour locataire principal uniquement)
  domicile_documents?: string[]
}

export interface GuarantorProfile extends PersonProfile {
  guarantor_type: "person" | "organism" | "moral_person"
  organism_name?: string
  moral_person_name?: string
  kbis_documents?: string[]
}

export interface RentalFileData {
  id?: string
  tenant_id: string

  // Profils
  main_tenant: PersonProfile
  cotenants: PersonProfile[]
  guarantors: GuarantorProfile[]

  // Situation de location
  rental_situation: "alone" | "couple" | "colocation" | "family"

  // Logement actuel
  current_housing: {
    type: "owner" | "tenant" | "hosted" | "student_housing" | "other"
    address?: string
    monthly_rent?: number
    departure_date?: string
  }

  // Métadonnées
  status: "draft" | "in_progress" | "completed" | "validated"
  completion_percentage: number
  validation_score: number
  created_at?: string
  updated_at?: string
}

export const MAIN_ACTIVITIES = [
  { value: "cdi", label: "CDI", description: "Contrat à durée indéterminée" },
  { value: "cdd", label: "CDD", description: "Contrat à durée déterminée" },
  { value: "fonction_publique", label: "Fonction publique", description: "Agent de la fonction publique" },
  { value: "independant", label: "Indépendant", description: "Travailleur indépendant" },
  { value: "retraite", label: "Retraite", description: "Retraité" },
  { value: "chomage", label: "Chômage", description: "Demandeur d'emploi" },
  { value: "etudes", label: "Études", description: "Étudiant" },
  { value: "alternance", label: "Alternance", description: "Contrat d'apprentissage ou de professionnalisation" },
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

export const TAX_SITUATIONS = [
  { value: "own_notice", label: "Vous avez un avis d'imposition à votre nom" },
  { value: "attached_to_parents", label: "Vous êtes rattaché fiscalement à vos parents" },
  { value: "less_than_year", label: "Vous êtes en France depuis moins d'un an" },
  { value: "other", label: "Autre situation" },
]

export const GUARANTOR_TYPES = [
  { value: "person", label: "Une personne", description: "Un parent, un proche" },
  { value: "organism", label: "Un organisme", description: "Visale, autre organisme" },
  { value: "moral_person", label: "Une personne morale", description: "Une entreprise" },
]

export const rentalFileService = {
  // Récupérer le dossier de location
  async getRentalFile(tenantId: string): Promise<RentalFileData | null> {
    console.log("📋 RentalFileService.getRentalFile", tenantId)

    try {
      const { data, error } = await supabase.from("rental_files").select("*").eq("tenant_id", tenantId).single()

      if (error) {
        if (error.code === "PGRST116") {
          console.log("ℹ️ Aucun dossier de location trouvé")
          return null
        }
        console.error("❌ Erreur récupération dossier:", error)
        throw new Error(error.message)
      }

      console.log("✅ Dossier de location récupéré:", data)
      return data
    } catch (error) {
      console.error("❌ Erreur dans getRentalFile:", error)
      throw error
    }
  },

  // Créer ou mettre à jour le dossier
  async updateRentalFile(tenantId: string, fileData: Partial<RentalFileData>): Promise<RentalFileData> {
    console.log("💾 RentalFileService.updateRentalFile", tenantId)

    try {
      const completionPercentage = this.calculateCompletionPercentage(fileData)
      const validationScore = this.calculateValidationScore(fileData)

      const dataToUpdate = {
        ...fileData,
        tenant_id: tenantId,
        completion_percentage: completionPercentage,
        validation_score: validationScore,
        status: completionPercentage >= 100 ? "completed" : "in_progress",
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from("rental_files")
        .upsert(dataToUpdate, { onConflict: "tenant_id" })
        .select()
        .single()

      if (error) {
        console.error("❌ Erreur mise à jour dossier:", error)
        throw new Error(error.message)
      }

      console.log("✅ Dossier mis à jour:", data)
      return data
    } catch (error) {
      console.error("❌ Erreur dans updateRentalFile:", error)
      throw error
    }
  },

  // Calculer le pourcentage de complétion
  calculateCompletionPercentage(fileData: Partial<RentalFileData>): number {
    let totalPoints = 0
    let earnedPoints = 0

    // Locataire principal (40 points)
    if (fileData.main_tenant) {
      totalPoints += 40
      const tenant = fileData.main_tenant

      if (tenant.first_name && tenant.last_name) earnedPoints += 5
      if (tenant.birth_date && tenant.birth_place) earnedPoints += 5
      if (tenant.main_activity) earnedPoints += 10
      if (tenant.income_sources && Object.keys(tenant.income_sources).length > 0) earnedPoints += 10
      if (tenant.tax_situation?.type) earnedPoints += 5
      if (tenant.identity_documents?.length > 0) earnedPoints += 5
    }

    // Situation de location (10 points)
    if (fileData.rental_situation) {
      totalPoints += 10
      earnedPoints += 10
    }

    // Colocataires (20 points si applicable)
    if (fileData.rental_situation === "colocation" || fileData.rental_situation === "couple") {
      totalPoints += 20
      if (fileData.cotenants && fileData.cotenants.length > 0) {
        earnedPoints += 20
      }
    }

    // Garants (30 points)
    totalPoints += 30
    if (fileData.guarantors && fileData.guarantors.length > 0) {
      earnedPoints += 30
    }

    return Math.min(Math.round((earnedPoints / totalPoints) * 100), 100)
  },

  // Calculer le score de validation
  calculateValidationScore(fileData: Partial<RentalFileData>): number {
    let score = 0

    if (!fileData.main_tenant) return 0

    const tenant = fileData.main_tenant

    // Score basé sur l'activité principale
    switch (tenant.main_activity) {
      case "cdi":
      case "fonction_publique":
        score += 40
        break
      case "cdd":
      case "alternance":
        score += 30
        break
      case "retraite":
        score += 35
        break
      case "independant":
        score += 25
        break
      case "etudes":
        score += 20
        break
      case "chomage":
        score += 15
        break
      default:
        score += 10
    }

    // Score basé sur les revenus
    const totalIncome = this.calculateTotalIncome(tenant.income_sources)
    if (totalIncome >= 3000) score += 25
    else if (totalIncome >= 2000) score += 20
    else if (totalIncome >= 1500) score += 15
    else if (totalIncome > 0) score += 10

    // Score basé sur les documents
    if (tenant.identity_documents?.length > 0) score += 10
    if (tenant.tax_situation?.documents?.length > 0) score += 10

    // Bonus pour garants
    if (fileData.guarantors && fileData.guarantors.length > 0) {
      score += 15
    }

    return Math.min(score, 100)
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

  // Créer un profil vide
  createEmptyProfile(type: "main_tenant" | "cotenant" | "guarantor"): PersonProfile | GuarantorProfile {
    const baseProfile: PersonProfile = {
      type,
      first_name: "",
      last_name: "",
      birth_date: "",
      birth_place: "",
      nationality: "française",
      main_activity: "cdi",
      income_sources: {},
      tax_situation: {
        type: "own_notice",
        documents: [],
      },
      identity_documents: [],
    }

    if (type === "guarantor") {
      return {
        ...baseProfile,
        guarantor_type: "person",
      } as GuarantorProfile
    }

    return baseProfile
  },

  // Initialiser un dossier avec les données utilisateur
  async initializeFromUserData(tenantId: string, userData: any): Promise<RentalFileData> {
    const mainTenant = this.createEmptyProfile("main_tenant") as PersonProfile
    mainTenant.first_name = userData.first_name || ""
    mainTenant.last_name = userData.last_name || ""

    const initialData: Partial<RentalFileData> = {
      tenant_id: tenantId,
      main_tenant: mainTenant,
      cotenants: [],
      guarantors: [],
      rental_situation: "alone",
      current_housing: {
        type: "tenant",
      },
      status: "draft",
      completion_percentage: 0,
      validation_score: 0,
    }

    return this.updateRentalFile(tenantId, initialData)
  },

  // Vérifier si le dossier est éligible pour candidature
  isEligibleForApplication(fileData: RentalFileData | null): {
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

    if (fileData.completion_percentage < 70) {
      reasons.push("Dossier incomplet")
      recommendations.push("Complétez votre dossier à au moins 70%")
    }

    if (fileData.validation_score < 40) {
      recommendations.push("Ajoutez un garant pour renforcer votre dossier")
    }

    return {
      eligible: reasons.length === 0,
      reasons,
      recommendations,
    }
  },

  // Obtenir les documents requis selon la situation
  getRequiredDocuments(situation: string): any {
    return DOCUMENT_REQUIREMENTS[situation as keyof typeof DOCUMENT_REQUIREMENTS] || DOCUMENT_REQUIREMENTS.employee
  },

  // Vérifier si le dossier est éligible pour candidature
  isEligibleForApplication(fileData: RentalFileData | null): {
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
    if (!fileData.main_tenant?.documents?.identity?.length) {
      reasons.push("Pièce d'identité manquante")
    }

    if (!fileData.main_tenant?.documents?.tax_notice) {
      reasons.push("Avis d'imposition manquant")
    }

    if (fileData.completion_percentage < 70) {
      reasons.push("Dossier incomplet")
      recommendations.push("Complétez votre dossier à au moins 70%")
    }

    if (fileData.validation_score < 40) {
      recommendations.push("Ajoutez un garant pour renforcer votre dossier")
    }
}
