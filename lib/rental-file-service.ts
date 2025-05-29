import { supabase } from "./supabase"

export interface TenantInfo {
  id?: string
  type: "main" | "cotenant" | "spouse"
  first_name: string
  last_name: string
  birth_date: string
  birth_place: string
  nationality: string
  situation: "student" | "employee" | "self_employed" | "unemployed" | "retired" | "other"
  monthly_income: number
  documents: {
    identity: string[]
    income_proof: string[]
    tax_notice: string
    domicile_proof?: string
    other?: string[]
  }
}

export interface GuarantorInfo {
  id?: string
  type: "physical" | "moral" | "visale"
  first_name?: string
  last_name?: string
  birth_date?: string
  company_name?: string
  monthly_income?: number
  documents: {
    identity?: string[]
    income_proof?: string[]
    tax_notice?: string
    other?: string[]
  }
}

export interface RentalFileData {
  id?: string
  tenant_id: string

  // Étape 1: Qui êtes-vous ?
  main_tenant: TenantInfo
  cotenants: TenantInfo[]
  rental_situation: "alone" | "couple" | "colocation" | "family"

  // Étape 2: Votre logement actuel
  current_housing: {
    type: "owner" | "tenant" | "hosted" | "student_housing" | "other"
    address?: string
    monthly_rent?: number
    departure_date?: string
  }

  // Étape 3: Vos garants
  guarantors: GuarantorInfo[]

  // Métadonnées
  status: "draft" | "in_progress" | "completed" | "validated"
  completion_percentage: number
  validation_score: number
  created_at?: string
  updated_at?: string
}

// Documents requis selon la situation
export const DOCUMENT_REQUIREMENTS = {
  student: {
    identity: { required: true, description: "Carte d'identité ou passeport" },
    student_card: { required: true, description: "Carte d'étudiant ou certificat de scolarité" },
    income_proof: { required: false, description: "Justificatifs de revenus (job étudiant, bourse...)" },
    tax_notice: { required: true, description: "Avis d'imposition des parents ou du foyer fiscal" },
    domicile_proof: { required: false, description: "Justificatif de domicile actuel" },
  },
  employee: {
    identity: { required: true, description: "Carte d'identité ou passeport" },
    income_proof: { required: true, description: "3 derniers bulletins de salaire" },
    employment_contract: { required: true, description: "Contrat de travail ou attestation employeur" },
    tax_notice: { required: true, description: "Dernier avis d'imposition" },
    domicile_proof: { required: true, description: "Justificatif de domicile de moins de 3 mois" },
  },
  self_employed: {
    identity: { required: true, description: "Carte d'identité ou passeport" },
    income_proof: { required: true, description: "Justificatifs de revenus (bilans, attestations...)" },
    business_registration: { required: true, description: "Extrait Kbis ou inscription auto-entrepreneur" },
    tax_notice: { required: true, description: "Dernier avis d'imposition" },
    domicile_proof: { required: true, description: "Justificatif de domicile de moins de 3 mois" },
  },
  unemployed: {
    identity: { required: true, description: "Carte d'identité ou passeport" },
    unemployment_proof: { required: true, description: "Attestation Pôle emploi" },
    income_proof: { required: false, description: "Justificatifs d'allocations" },
    tax_notice: { required: true, description: "Dernier avis d'imposition" },
    domicile_proof: { required: true, description: "Justificatif de domicile de moins de 3 mois" },
  },
  retired: {
    identity: { required: true, description: "Carte d'identité ou passeport" },
    pension_proof: { required: true, description: "Justificatif de pension de retraite" },
    tax_notice: { required: true, description: "Dernier avis d'imposition" },
    domicile_proof: { required: true, description: "Justificatif de domicile de moins de 3 mois" },
  },
}

export const SITUATION_OPTIONS = [
  { value: "student", label: "Étudiant", description: "Vous suivez des études" },
  { value: "employee", label: "Salarié", description: "Vous êtes employé (CDI, CDD, intérim...)" },
  { value: "self_employed", label: "Indépendant", description: "Vous travaillez à votre compte" },
  { value: "unemployed", label: "Sans emploi", description: "Vous recherchez un emploi" },
  { value: "retired", label: "Retraité", description: "Vous êtes à la retraite" },
  { value: "other", label: "Autre", description: "Autre situation" },
]

export const RENTAL_SITUATIONS = [
  { value: "alone", label: "Je loue seul(e)", description: "Vous serez le seul locataire" },
  { value: "couple", label: "En couple", description: "Vous et votre conjoint(e)" },
  { value: "colocation", label: "En colocation", description: "Plusieurs colocataires" },
  { value: "family", label: "En famille", description: "Avec des enfants" },
]

export const CURRENT_HOUSING_TYPES = [
  { value: "tenant", label: "Locataire", description: "Vous louez actuellement un logement" },
  { value: "owner", label: "Propriétaire", description: "Vous êtes propriétaire de votre logement actuel" },
  { value: "hosted", label: "Hébergé", description: "Vous êtes hébergé chez quelqu'un" },
  { value: "student_housing", label: "Logement étudiant", description: "Résidence universitaire, CROUS..." },
  { value: "other", label: "Autre", description: "Autre situation" },
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

    // Informations du locataire principal (30 points)
    if (fileData.main_tenant) {
      totalPoints += 30
      if (fileData.main_tenant.first_name && fileData.main_tenant.last_name) earnedPoints += 5
      if (fileData.main_tenant.birth_date) earnedPoints += 5
      if (fileData.main_tenant.situation) earnedPoints += 10
      if (fileData.main_tenant.monthly_income) earnedPoints += 10
    }

    // Situation de location (10 points)
    if (fileData.rental_situation) {
      totalPoints += 10
      earnedPoints += 10
    }

    // Logement actuel (10 points)
    if (fileData.current_housing?.type) {
      totalPoints += 10
      earnedPoints += 10
    }

    // Documents du locataire principal (40 points)
    if (fileData.main_tenant?.documents) {
      totalPoints += 40
      const docs = fileData.main_tenant.documents
      if (docs.identity?.length > 0) earnedPoints += 10
      if (docs.income_proof?.length > 0) earnedPoints += 15
      if (docs.tax_notice) earnedPoints += 15
    }

    // Garants (10 points bonus)
    if (fileData.guarantors?.length > 0) {
      totalPoints += 10
      earnedPoints += 10
    }

    return Math.min(Math.round((earnedPoints / totalPoints) * 100), 100)
  },

  // Calculer le score de validation (qualité du dossier)
  calculateValidationScore(fileData: Partial<RentalFileData>): number {
    let score = 0

    if (!fileData.main_tenant) return 0

    const tenant = fileData.main_tenant

    // Score basé sur la situation professionnelle
    switch (tenant.situation) {
      case "employee":
        score += 40
        break
      case "retired":
        score += 35
        break
      case "self_employed":
        score += 25
        break
      case "student":
        score += 20
        break
      case "unemployed":
        score += 10
        break
      default:
        score += 15
    }

    // Score basé sur les revenus
    if (tenant.monthly_income) {
      if (tenant.monthly_income >= 3000) score += 25
      else if (tenant.monthly_income >= 2000) score += 20
      else if (tenant.monthly_income >= 1500) score += 15
      else score += 10
    }

    // Score basé sur les documents
    if (tenant.documents) {
      if (tenant.documents.identity?.length > 0) score += 10
      if (tenant.documents.income_proof?.length >= 3) score += 15
      if (tenant.documents.tax_notice) score += 10
    }

    // Bonus pour garant
    if (fileData.guarantors?.length > 0) {
      score += 15
    }

    return Math.min(score, 100)
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

    return {
      eligible: reasons.length === 0,
      reasons,
      recommendations,
    }
  },

  // Initialiser un dossier avec les données utilisateur
  async initializeFromUserData(tenantId: string, userData: any): Promise<RentalFileData> {
    const initialData: Partial<RentalFileData> = {
      tenant_id: tenantId,
      main_tenant: {
        type: "main",
        first_name: userData.first_name || "",
        last_name: userData.last_name || "",
        birth_date: "",
        birth_place: "",
        nationality: "française",
        situation: userData.employment_status || "employee",
        monthly_income: userData.monthly_income || 0,
        documents: {
          identity: [],
          income_proof: [],
          tax_notice: "",
        },
      },
      cotenants: [],
      rental_situation: userData.rental_type || "alone",
      current_housing: {
        type: "tenant",
      },
      guarantors: [],
      status: "draft",
      completion_percentage: 0,
      validation_score: 0,
    }

    return this.updateRentalFile(tenantId, initialData)
  },
}
