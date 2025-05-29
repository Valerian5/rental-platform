import { supabase } from "./supabase"

export interface RentalFileData {
  id?: string
  tenant_id: string

  // Informations personnelles (reprises du compte)
  rental_type?: "alone" | "couple" | "colocation" | "family"
  number_of_tenants?: number
  tenants_info?: Array<{
    first_name: string
    last_name: string
    birth_date: string
    profession: string
    employment_status: string
    monthly_income: number
    company: string
  }>

  // Situation professionnelle principale
  employment_status?: string
  profession?: string
  company?: string
  monthly_income?: number
  additional_income?: number

  // Projet de location
  presentation_message?: string
  desired_move_date?: string
  rental_duration?: string

  // Documents justificatifs
  identity_document?: string
  proof_of_income?: string[] // 3 derniers bulletins de salaire
  employment_contract?: string
  tax_notice?: string // Avis d'imposition
  proof_of_domicile?: string
  bank_statements?: string[] // RIB + relevés
  insurance_certificate?: string

  // Garant
  has_guarantor?: boolean
  guarantor_type?: "physical" | "moral" | "visale"
  guarantor_info?: {
    type: "physical" | "moral" | "visale"
    first_name?: string
    last_name?: string
    company_name?: string
    profession?: string
    monthly_income?: number
    phone?: string
    email?: string
  }
  guarantor_documents?: string[]

  // Autres
  other_documents?: string[]
  completion_percentage?: number
  created_at?: string
  updated_at?: string
}

export interface RentalFileItem {
  name: string
  key: keyof RentalFileData
  required: boolean
  type: "single" | "multiple"
  description: string
  category: "personal" | "professional" | "financial" | "guarantor" | "other"
}

export const RENTAL_FILE_ITEMS: RentalFileItem[] = [
  // Documents personnels
  {
    name: "Pièce d'identité",
    key: "identity_document",
    required: true,
    type: "single",
    description: "Carte d'identité, passeport ou titre de séjour en cours de validité",
    category: "personal",
  },
  {
    name: "Justificatif de domicile",
    key: "proof_of_domicile",
    required: true,
    type: "single",
    description: "Facture d'électricité, gaz, eau ou téléphone de moins de 3 mois",
    category: "personal",
  },

  // Documents professionnels
  {
    name: "Justificatifs de revenus",
    key: "proof_of_income",
    required: true,
    type: "multiple",
    description: "3 derniers bulletins de salaire, ou justificatifs selon votre situation",
    category: "professional",
  },
  {
    name: "Contrat de travail",
    key: "employment_contract",
    required: true,
    type: "single",
    description: "Contrat de travail en cours ou attestation employeur",
    category: "professional",
  },

  // Documents financiers
  {
    name: "Avis d'imposition",
    key: "tax_notice",
    required: true,
    type: "single",
    description: "Dernier avis d'imposition ou de non-imposition",
    category: "financial",
  },
  {
    name: "Relevés bancaires",
    key: "bank_statements",
    required: true,
    type: "multiple",
    description: "RIB + 3 derniers relevés de compte",
    category: "financial",
  },

  // Assurance
  {
    name: "Attestation d'assurance",
    key: "insurance_certificate",
    required: false,
    type: "single",
    description: "Attestation d'assurance habitation (peut être fournie après signature)",
    category: "other",
  },

  // Documents garant
  {
    name: "Documents du garant",
    key: "guarantor_documents",
    required: false,
    type: "multiple",
    description: "Mêmes documents que le locataire pour le garant",
    category: "guarantor",
  },
]

export const EMPLOYMENT_STATUS_OPTIONS = [
  { value: "cdi", label: "CDI (Contrat à durée indéterminée)" },
  { value: "cdd", label: "CDD (Contrat à durée déterminée)" },
  { value: "interim", label: "Intérim" },
  { value: "freelance", label: "Travailleur indépendant" },
  { value: "student", label: "Étudiant" },
  { value: "apprentice", label: "Apprenti" },
  { value: "unemployed", label: "Demandeur d'emploi" },
  { value: "retired", label: "Retraité" },
  { value: "other", label: "Autre" },
]

export const GUARANTOR_TYPES = [
  { value: "physical", label: "Personne physique", description: "Un proche qui se porte garant" },
  { value: "moral", label: "Personne morale", description: "Entreprise, organisme, etc." },
  { value: "visale", label: "Garantie Visale", description: "Garantie gratuite d'Action Logement" },
]

export const rentalFileService = {
  // Récupérer le dossier de location d'un locataire
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

  // Créer ou mettre à jour le dossier de location
  async updateRentalFile(tenantId: string, fileData: Partial<RentalFileData>): Promise<RentalFileData> {
    console.log("💾 RentalFileService.updateRentalFile", tenantId)

    try {
      const completionPercentage = this.calculateCompletionPercentage(fileData)

      const dataToUpdate = {
        ...fileData,
        tenant_id: tenantId,
        completion_percentage: completionPercentage,
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
    let totalWeight = 0
    let completedWeight = 0

    // Informations personnelles (20%)
    if (fileData.rental_type && fileData.number_of_tenants) completedWeight += 5
    if (fileData.presentation_message) completedWeight += 5
    if (fileData.desired_move_date) completedWeight += 5
    if (fileData.rental_duration) completedWeight += 5
    totalWeight += 20

    // Situation professionnelle (25%)
    if (fileData.employment_status) completedWeight += 8
    if (fileData.profession) completedWeight += 8
    if (fileData.monthly_income) completedWeight += 9
    totalWeight += 25

    // Documents requis (45%)
    const requiredDocs = RENTAL_FILE_ITEMS.filter((item) => item.required)
    const docWeight = 45 / requiredDocs.length

    requiredDocs.forEach((item) => {
      const value = fileData[item.key]
      if (value) {
        if (item.type === "multiple") {
          if (Array.isArray(value) && value.length > 0) {
            completedWeight += docWeight
          }
        } else {
          if (typeof value === "string" && value.trim() !== "") {
            completedWeight += docWeight
          }
        }
      }
    })
    totalWeight += 45

    // Garant (10% bonus si présent)
    if (fileData.has_guarantor && fileData.guarantor_info) {
      completedWeight += 10
    }
    totalWeight += 10

    return Math.min(Math.round((completedWeight / totalWeight) * 100), 100)
  },

  // Obtenir les documents manquants
  getMissingDocuments(fileData: Partial<RentalFileData> | null): string[] {
    if (!fileData) {
      return RENTAL_FILE_ITEMS.filter((item) => item.required).map((item) => item.name)
    }

    const missingDocs: string[] = []

    RENTAL_FILE_ITEMS.filter((item) => item.required).forEach((item) => {
      const value = fileData[item.key]
      if (!value) {
        missingDocs.push(item.name)
      } else if (item.type === "multiple") {
        if (!Array.isArray(value) || value.length === 0) {
          missingDocs.push(item.name)
        }
      } else {
        if (typeof value !== "string" || value.trim === "") {
          missingDocs.push(item.name)
        }
      }
    })

    return missingDocs
  },

  // Vérifier la compatibilité du dossier avec une propriété
  checkCompatibility(
    fileData: RentalFileData | null,
    property: any,
  ): {
    compatible: boolean
    warnings: string[]
    recommendations: string[]
    score: number
  } {
    const warnings: string[] = []
    const recommendations: string[] = []
    let score = 0

    if (!fileData) {
      return {
        compatible: false,
        warnings: ["Aucun dossier de location trouvé"],
        recommendations: ["Créez votre dossier de location pour postuler"],
        score: 0,
      }
    }

    // Vérifier le pourcentage de complétion
    const completion = fileData.completion_percentage || 0
    if (completion >= 90) {
      score += 30
    } else if (completion >= 70) {
      score += 20
      recommendations.push("Complétez votre dossier pour améliorer vos chances")
    } else {
      score += 10
      warnings.push(`Dossier incomplet (${completion}% complété)`)
    }

    // Vérifier le ratio revenus/loyer
    if (fileData.monthly_income && property.price) {
      const ratio = fileData.monthly_income / property.price
      if (ratio >= 3) {
        score += 40
      } else if (ratio >= 2.5) {
        score += 30
        recommendations.push("Vos revenus respectent les critères habituels")
      } else if (ratio >= 2) {
        score += 20
        warnings.push("Vos revenus sont légèrement justes (recommandé: 3x le loyer)")
      } else {
        score += 5
        warnings.push("Vos revenus sont insuffisants selon les critères habituels")
      }
    } else {
      warnings.push("Revenus non renseignés")
    }

    // Vérifier la situation professionnelle
    if (fileData.employment_status) {
      if (["cdi", "retired"].includes(fileData.employment_status)) {
        score += 15
      } else if (["cdd", "freelance"].includes(fileData.employment_status)) {
        score += 10
        recommendations.push("Votre situation professionnelle est acceptable")
      } else if (["student", "apprentice"].includes(fileData.employment_status)) {
        score += 5
        recommendations.push("Un garant pourrait renforcer votre dossier")
      }
    }

    // Bonus pour garant
    if (fileData.has_guarantor && fileData.guarantor_info) {
      score += 15
      if (fileData.guarantor_type === "visale") {
        recommendations.push("La garantie Visale est un atout pour votre dossier")
      }
    } else if (fileData.monthly_income && property.price && fileData.monthly_income / property.price < 3) {
      recommendations.push("Un garant pourrait compenser des revenus justes")
    }

    const compatible = score >= 60

    return {
      compatible,
      warnings,
      recommendations,
      score: Math.min(score, 100),
    }
  },

  // Initialiser un dossier avec les données du compte utilisateur
  async initializeFromUserData(tenantId: string, userData: any): Promise<RentalFileData> {
    const initialData: Partial<RentalFileData> = {
      tenant_id: tenantId,
      rental_type: userData.rental_type || "alone",
      number_of_tenants: userData.number_of_tenants || 1,
      employment_status: userData.employment_status,
      profession: userData.profession,
      company: userData.company,
      monthly_income: userData.monthly_income,
      presentation_message: userData.presentation_message,
      desired_move_date: userData.desired_move_date,
      rental_duration: userData.rental_duration,
    }

    return this.updateRentalFile(tenantId, initialData)
  },
}
