import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Cache pour les préférences
const preferencesCache = new Map<string, any>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

interface ScoringCriteria {
  income_ratio: {
    weight: number
    min_ratio?: number
    ideal_ratio?: number
  }
  professional_stability: {
    weight: number
    preferred_contracts?: string[]
    min_seniority_months?: number
  }
  guarantor: {
    weight: number
    required?: boolean
    min_guarantor_ratio?: number
  }
  file_quality: {
    weight: number
    required_documents?: string[]
  }
}

interface ScoringPreferences {
  id?: string
  owner_id: string
  name: string
  description?: string
  criteria: ScoringCriteria
  is_default: boolean
  exclusion_rules?: {
    min_income_ratio?: number
    required_guarantor_if_ratio_below?: number
    forbidden_contract_types?: string[]
  }
  created_at?: string
  updated_at?: string
}

export const scoringPreferencesService = {
  // Récupérer les préférences d'un propriétaire
  async getOwnerPreferences(ownerId: string, useCache = true): Promise<ScoringPreferences> {
    const cacheKey = `prefs_${ownerId}`

    if (useCache && preferencesCache.has(cacheKey)) {
      const cached = preferencesCache.get(cacheKey)
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data
      }
    }

    try {
      const { data, error } = await supabase
        .from("scoring_preferences")
        .select("*")
        .eq("owner_id", ownerId)
        .eq("is_default", true)
        .single()

      if (error || !data) {
        // Retourner les préférences par défaut
        const defaultPrefs = this.getDefaultPreferences(ownerId)
        if (useCache) {
          preferencesCache.set(cacheKey, {
            data: defaultPrefs,
            timestamp: Date.now(),
          })
        }
        return defaultPrefs
      }

      if (useCache) {
        preferencesCache.set(cacheKey, {
          data,
          timestamp: Date.now(),
        })
      }

      return data
    } catch (error) {
      console.error("Erreur récupération préférences:", error)
      return this.getDefaultPreferences(ownerId)
    }
  },

  // Préférences par défaut
  getDefaultPreferences(ownerId: string): ScoringPreferences {
    return {
      owner_id: ownerId,
      name: "Modèle standard",
      description: "Critères de scoring par défaut",
      criteria: {
        income_ratio: {
          weight: 40,
          min_ratio: 2.5,
          ideal_ratio: 3.5,
        },
        professional_stability: {
          weight: 25,
          preferred_contracts: ["cdi"],
          min_seniority_months: 6,
        },
        guarantor: {
          weight: 20,
          required: false,
          min_guarantor_ratio: 2.5,
        },
        file_quality: {
          weight: 15,
          required_documents: ["identity", "payslip", "tax_notice"],
        },
      },
      is_default: true,
      exclusion_rules: {
        min_income_ratio: 1.5,
        required_guarantor_if_ratio_below: 2.5,
      },
    }
  },

  // Calculer le score d'une candidature
  async calculateScore(
    application: any,
    property: any,
    ownerId: string,
    useCache = true,
  ): Promise<{
    totalScore: number
    breakdown: any
    compatible: boolean
    model_used: string
    recommendations: string[]
    warnings: string[]
    exclusions: string[]
  }> {
    try {
      const preferences = await this.getOwnerPreferences(ownerId, useCache)

      const result = {
        totalScore: 0,
        breakdown: {},
        compatible: true,
        model_used: preferences.name,
        recommendations: [],
        warnings: [],
        exclusions: [],
      }

      // 1. Ratio revenus/loyer
      const incomeRatio = this.calculateIncomeRatio(application, property, preferences)
      result.breakdown.income_ratio = incomeRatio
      result.totalScore += incomeRatio.score

      // 2. Stabilité professionnelle
      const professionalStability = this.calculateProfessionalStability(application, preferences)
      result.breakdown.professional_stability = professionalStability
      result.totalScore += professionalStability.score

      // 3. Garants
      const guarantorScore = this.calculateGuarantorScore(application, property, preferences)
      result.breakdown.guarantor = guarantorScore
      result.totalScore += guarantorScore.score

      // 4. Qualité du dossier
      const fileQuality = this.calculateFileQuality(application, preferences)
      result.breakdown.file_quality = fileQuality
      result.totalScore += fileQuality.score

      // Vérifier les règles d'exclusion
      const exclusions = this.checkExclusionRules(application, property, preferences)
      result.exclusions = exclusions

      // Déterminer la compatibilité
      result.compatible = exclusions.length === 0 && result.totalScore >= 60

      // Générer recommandations et avertissements
      result.recommendations = this.generateRecommendations(result.breakdown, preferences)
      result.warnings = this.generateWarnings(result.breakdown, exclusions)

      return result
    } catch (error) {
      console.error("Erreur calcul score:", error)
      return {
        totalScore: 50,
        breakdown: {},
        compatible: false,
        model_used: "Erreur",
        recommendations: ["Erreur lors du calcul"],
        warnings: ["Impossible de calculer le score"],
        exclusions: [],
      }
    }
  },

  // Calcul ratio revenus/loyer
  calculateIncomeRatio(application: any, property: any, preferences: ScoringPreferences) {
    const maxScore = preferences.criteria.income_ratio.weight
    const income = application.income || 0
    const rent = property.price || 0

    if (!income || !rent) {
      return {
        score: 0,
        max: maxScore,
        ratio: 0,
        compatible: false,
        details: "Revenus ou loyer non spécifiés",
      }
    }

    const ratio = income / rent
    const minRatio = preferences.criteria.income_ratio.min_ratio || 2.5
    const idealRatio = preferences.criteria.income_ratio.ideal_ratio || 3.5

    let score = 0
    let compatible = ratio >= minRatio

    if (ratio >= idealRatio) {
      score = maxScore
    } else if (ratio >= minRatio) {
      score = Math.round(((ratio - minRatio) / (idealRatio - minRatio)) * maxScore)
    } else {
      score = Math.round((ratio / minRatio) * maxScore * 0.5)
      compatible = false
    }

    return {
      score: Math.min(score, maxScore),
      max: maxScore,
      ratio: Math.round(ratio * 10) / 10,
      compatible,
      details: `Ratio ${ratio.toFixed(1)}x (min: ${minRatio}x, idéal: ${idealRatio}x)`,
    }
  },

  // Calcul stabilité professionnelle
  calculateProfessionalStability(application: any, preferences: ScoringPreferences) {
    const maxScore = preferences.criteria.professional_stability.weight
    const contractType = application.contract_type?.toLowerCase() || ""
    const preferredContracts = preferences.criteria.professional_stability.preferred_contracts || ["cdi"]

    let score = 0
    let compatible = true

    if (preferredContracts.includes(contractType)) {
      score = maxScore
    } else if (contractType === "cdd") {
      score = Math.round(maxScore * 0.7)
    } else if (contractType === "freelance" || contractType === "indépendant") {
      score = Math.round(maxScore * 0.5)
    } else {
      score = Math.round(maxScore * 0.3)
      compatible = false
    }

    // Bonus/malus selon l'ancienneté
    const seniority = application.seniority_months || 0
    const minSeniority = preferences.criteria.professional_stability.min_seniority_months || 6

    if (seniority < minSeniority) {
      score = Math.round(score * 0.8)
      compatible = false
    }

    return {
      score: Math.min(score, maxScore),
      max: maxScore,
      compatible,
      details: `${contractType.toUpperCase()} avec ${seniority} mois d'ancienneté`,
    }
  },

  // Calcul score garants
  calculateGuarantorScore(application: any, property: any, preferences: ScoringPreferences) {
    const maxScore = preferences.criteria.guarantor.weight
    const hasGuarantor = application.has_guarantor || false
    const guarantorIncome = application.guarantor_income || 0
    const rent = property.price || 0
    const required = preferences.criteria.guarantor.required || false
    const minGuarantorRatio = preferences.criteria.guarantor.min_guarantor_ratio || 2.5

    let score = 0
    const compatible = true

    if (required && !hasGuarantor) {
      return {
        score: 0,
        max: maxScore,
        compatible: false,
        details: "Garant requis mais absent",
      }
    }

    if (hasGuarantor) {
      if (guarantorIncome && rent) {
        const guarantorRatio = guarantorIncome / rent
        if (guarantorRatio >= minGuarantorRatio) {
          score = maxScore
        } else {
          score = Math.round((guarantorRatio / minGuarantorRatio) * maxScore)
        }
      } else {
        score = Math.round(maxScore * 0.7) // Garant présent mais revenus non vérifiés
      }
    } else {
      // Pas de garant mais pas requis
      score = Math.round(maxScore * 0.3)
    }

    return {
      score: Math.min(score, maxScore),
      max: maxScore,
      compatible,
      details: hasGuarantor
        ? `Garant avec revenus ${guarantorIncome ? `de ${guarantorIncome}€` : "non spécifiés"}`
        : "Aucun garant",
    }
  },

  // Calcul qualité du dossier
  calculateFileQuality(application: any, preferences: ScoringPreferences) {
    const maxScore = preferences.criteria.file_quality.weight
    const documentsComplete = application.documents_complete || false
    const hasVerifiedDocuments = application.has_verified_documents || false

    let score = 0

    if (documentsComplete && hasVerifiedDocuments) {
      score = maxScore
    } else if (documentsComplete) {
      score = Math.round(maxScore * 0.8)
    } else {
      score = Math.round(maxScore * 0.4)
    }

    return {
      score,
      max: maxScore,
      compatible: documentsComplete,
      details: documentsComplete
        ? hasVerifiedDocuments
          ? "Dossier complet et vérifié"
          : "Dossier complet"
        : "Dossier incomplet",
    }
  },

  // Vérifier les règles d'exclusion
  checkExclusionRules(application: any, property: any, preferences: ScoringPreferences): string[] {
    const exclusions = []
    const rules = preferences.exclusion_rules || {}

    // Ratio minimum absolu
    if (rules.min_income_ratio) {
      const income = application.income || 0
      const rent = property.price || 0
      if (income && rent) {
        const ratio = income / rent
        if (ratio < rules.min_income_ratio) {
          exclusions.push(`Ratio revenus/loyer insuffisant: ${ratio.toFixed(1)}x < ${rules.min_income_ratio}x`)
        }
      }
    }

    // Garant requis si ratio faible
    if (rules.required_guarantor_if_ratio_below) {
      const income = application.income || 0
      const rent = property.price || 0
      if (income && rent) {
        const ratio = income / rent
        if (ratio < rules.required_guarantor_if_ratio_below && !application.has_guarantor) {
          exclusions.push(`Garant requis pour un ratio de ${ratio.toFixed(1)}x`)
        }
      }
    }

    // Types de contrats interdits
    if (rules.forbidden_contract_types?.length) {
      const contractType = application.contract_type?.toLowerCase() || ""
      if (rules.forbidden_contract_types.includes(contractType)) {
        exclusions.push(`Type de contrat non accepté: ${contractType}`)
      }
    }

    return exclusions
  },

  // Générer des recommandations
  generateRecommendations(breakdown: any, preferences: ScoringPreferences): string[] {
    const recommendations = []

    if (breakdown.income_ratio?.score < breakdown.income_ratio?.max * 0.8) {
      recommendations.push("Vérifier les revenus complémentaires du candidat")
    }

    if (breakdown.guarantor?.score < breakdown.guarantor?.max * 0.8) {
      recommendations.push("Demander des informations sur le garant")
    }

    if (breakdown.file_quality?.score < breakdown.file_quality?.max * 0.8) {
      recommendations.push("Demander les documents manquants")
    }

    return recommendations
  },

  // Générer des avertissements
  generateWarnings(breakdown: any, exclusions: string[]): string[] {
    const warnings = []

    if (exclusions.length > 0) {
      warnings.push("Ce dossier ne respecte pas les critères d'exclusion")
    }

    if (breakdown.professional_stability?.compatible === false) {
      warnings.push("Situation professionnelle instable")
    }

    return warnings
  },

  // Invalider le cache
  invalidateCache(ownerId?: string) {
    if (ownerId) {
      preferencesCache.delete(`prefs_${ownerId}`)
    } else {
      preferencesCache.clear()
    }
  },
}
