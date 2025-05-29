import { supabase } from "./supabase"

export interface RentalFileData {
  id?: string
  tenant_id: string
  identity_document?: string
  proof_of_income?: string[]
  employment_contract?: string
  tax_notice?: string
  proof_of_domicile?: string
  bank_statements?: string[]
  guarantor_documents?: string[]
  insurance_certificate?: string
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
}

export const RENTAL_FILE_ITEMS: RentalFileItem[] = [
  {
    name: "Pièce d'identité",
    key: "identity_document",
    required: true,
    type: "single",
    description: "Carte d'identité, passeport ou titre de séjour",
  },
  {
    name: "Justificatifs de revenus",
    key: "proof_of_income",
    required: true,
    type: "multiple",
    description: "3 derniers bulletins de salaire",
  },
  {
    name: "Contrat de travail",
    key: "employment_contract",
    required: true,
    type: "single",
    description: "Contrat de travail en cours",
  },
  {
    name: "Avis d'imposition",
    key: "tax_notice",
    required: true,
    type: "single",
    description: "Dernier avis d'imposition",
  },
  {
    name: "Justificatif de domicile",
    key: "proof_of_domicile",
    required: true,
    type: "single",
    description: "Facture de moins de 3 mois",
  },
  {
    name: "Relevés bancaires",
    key: "bank_statements",
    required: true,
    type: "multiple",
    description: "3 derniers relevés bancaires",
  },
  {
    name: "Documents du garant",
    key: "guarantor_documents",
    required: false,
    type: "multiple",
    description: "Pièce d'identité et justificatifs de revenus du garant",
  },
  {
    name: "Attestation d'assurance",
    key: "insurance_certificate",
    required: false,
    type: "single",
    description: "Attestation d'assurance habitation",
  },
]

export const rentalFileService = {
  // Récupérer le dossier de location d'un locataire
  async getRentalFile(tenantId: string): Promise<RentalFileData | null> {
    console.log("📋 RentalFileService.getRentalFile", tenantId)

    try {
      const { data, error } = await supabase.from("rental_files").select("*").eq("tenant_id", tenantId).single()

      if (error) {
        if (error.code === "PGRST116") {
          // Pas de dossier trouvé, c'est normal
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
      // Calculer le pourcentage de complétion
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
    const requiredItems = RENTAL_FILE_ITEMS.filter((item) => item.required)
    let completedItems = 0

    requiredItems.forEach((item) => {
      const value = fileData[item.key]
      if (value) {
        if (item.type === "multiple") {
          if (Array.isArray(value) && value.length > 0) {
            completedItems++
          }
        } else {
          if (typeof value === "string" && value.trim() !== "") {
            completedItems++
          }
        }
      }
    })

    return Math.round((completedItems / requiredItems.length) * 100)
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
        if (typeof value !== "string" || value.trim() === "") {
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
    tenantIncome?: number,
  ): {
    compatible: boolean
    warnings: string[]
    score: number
  } {
    const warnings: string[] = []
    let score = 0

    if (!fileData) {
      return {
        compatible: false,
        warnings: ["Aucun dossier de location trouvé"],
        score: 0,
      }
    }

    // Vérifier le pourcentage de complétion
    if ((fileData.completion_percentage || 0) < 70) {
      warnings.push(`Dossier incomplet (${fileData.completion_percentage || 0}% complété)`)
    } else {
      score += 30
    }

    // Vérifier le ratio revenus/loyer
    if (tenantIncome && property.price) {
      const ratio = tenantIncome / property.price
      if (ratio >= 3) {
        score += 40
      } else if (ratio >= 2.5) {
        score += 25
        warnings.push("Vos revenus sont légèrement justes (recommandé: 3x le loyer)")
      } else if (ratio >= 2) {
        score += 15
        warnings.push("Vos revenus sont insuffisants selon les critères habituels")
      } else {
        warnings.push("Vos revenus sont très insuffisants (moins de 2x le loyer)")
      }
    } else {
      warnings.push("Revenus non renseignés")
    }

    // Vérifier la présence de documents essentiels
    if (fileData.identity_document) score += 10
    if (fileData.proof_of_income) score += 15
    if (fileData.employment_contract) score += 15

    // Bonus pour garant
    if (
      fileData.guarantor_documents &&
      Array.isArray(fileData.guarantor_documents) &&
      fileData.guarantor_documents.length > 0
    ) {
      score += 10
    }

    const compatible = score >= 50 && warnings.length < 3

    return {
      compatible,
      warnings,
      score: Math.min(score, 100),
    }
  },
}
