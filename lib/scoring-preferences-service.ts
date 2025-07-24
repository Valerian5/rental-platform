// Interface pour les critères de scoring (nouvelle structure)
export interface ScoringCriteria {
  income_ratio: {
    weight: number
    thresholds: {
      excellent: number
      good: number
      acceptable: number
      minimum: number
    }
    points: {
      excellent: number
      good: number
      acceptable: number
      insufficient: number
    }
  }
  professional_stability: {
    weight: number
    contract_types: {
      cdi: number
      cdd: number
      freelance: number
      student: number
      unemployed: number
      retired: number
    }
    seniority_bonus: {
      enabled: boolean
      min_months: number
      bonus_points: number
    }
    trial_period_penalty: {
      enabled: boolean
      penalty_points: number
    }
  }
  guarantor: {
    weight: number
    presence_points: number
    income_ratio_bonus: {
      enabled: boolean
      threshold: number
      bonus_points: number
    }
    multiple_guarantors_bonus: {
      enabled: boolean
      bonus_per_additional: number
    }
  }
  application_quality: {
    weight: number
    presentation_length: {
      excellent: number
      good: number
      basic: number
    }
    completeness_bonus: {
      enabled: boolean
      bonus_points: number
    }
  }
}

export interface ScoringPreferences {
  id?: string
  owner_id: string
  name: string
  is_default: boolean
  criteria: ScoringCriteria
  created_at?: string
  updated_at?: string
}

// Interface pour le résultat du calcul de score
export interface ScoringResult {
  totalScore: number
  compatible: boolean
  breakdown: {
    income_ratio: {
      score: number
      details: string
      max: number
      compatible: boolean
    }
    professional_stability: {
      score: number
      details: string
      max: number
      compatible: boolean
    }
    guarantor: {
      score: number
      details: string
      max: number
      compatible: boolean
    }
    application_quality: {
      score: number
      details: string
      max: number
      compatible: boolean
    }
  }
  recommendations: string[]
  warnings: string[]
}

export const scoringPreferencesService = {
  // Obtenir les préférences par défaut pour un propriétaire
  getDefaultPreferences(ownerId: string): ScoringPreferences {
    return {
      owner_id: ownerId,
      name: "Préférences par défaut",
      is_default: true,
      criteria: {
        income_ratio: {
          weight: 40,
          thresholds: {
            excellent: 3.5,
            good: 3.0,
            acceptable: 2.5,
            minimum: 2.0,
          },
          points: {
            excellent: 100,
            good: 75,
            acceptable: 50,
            insufficient: 0,
          },
        },
        professional_stability: {
          weight: 30,
          contract_types: {
            cdi: 100,
            cdd: 75,
            freelance: 50,
            student: 25,
            unemployed: 0,
            retired: 80,
          },
          seniority_bonus: {
            enabled: true,
            min_months: 12,
            bonus_points: 10,
          },
          trial_period_penalty: {
            enabled: true,
            penalty_points: 20,
          },
        },
        guarantor: {
          weight: 20,
          presence_points: 100,
          income_ratio_bonus: {
            enabled: true,
            threshold: 3.0,
            bonus_points: 20,
          },
          multiple_guarantors_bonus: {
            enabled: true,
            bonus_per_additional: 10,
          },
        },
        application_quality: {
          weight: 10,
          presentation_length: {
            excellent: 200,
            good: 100,
            basic: 50,
          },
          completeness_bonus: {
            enabled: true,
            bonus_points: 20,
          },
        },
      },
    }
  },

  // Calculer le score personnalisé
  calculateCustomScore(application: any, property: any, preferences: ScoringPreferences): ScoringResult {
    // Vérifier que les critères existent
    if (!preferences || !preferences.criteria) {
      console.error("Préférences ou critères manquants", preferences)
      preferences = this.getDefaultPreferences(preferences?.owner_id || "default")
    }

    const criteria = preferences.criteria

    // Vérifier que tous les critères nécessaires existent
    if (
      !criteria.income_ratio ||
      !criteria.professional_stability ||
      !criteria.guarantor ||
      !criteria.application_quality
    ) {
      console.error("Critères incomplets, utilisation des valeurs par défaut")
      criteria.income_ratio = criteria.income_ratio || this.getDefaultPreferences("default").criteria.income_ratio
      criteria.professional_stability =
        criteria.professional_stability || this.getDefaultPreferences("default").criteria.professional_stability
      criteria.guarantor = criteria.guarantor || this.getDefaultPreferences("default").criteria.guarantor
      criteria.application_quality =
        criteria.application_quality || this.getDefaultPreferences("default").criteria.application_quality
    }

    const result: ScoringResult = {
      totalScore: 0,
      compatible: false,
      breakdown: {
        income_ratio: { score: 0, max: criteria.income_ratio.weight, details: "", compatible: false },
        professional_stability: {
          score: 0,
          max: criteria.professional_stability.weight,
          details: "",
          compatible: false,
        },
        guarantor: { score: 0, max: criteria.guarantor.weight, details: "", compatible: false },
        application_quality: { score: 0, max: criteria.application_quality.weight, details: "", compatible: false },
      },
      recommendations: [],
      warnings: [],
    }

    // 1. Évaluation des revenus
    const income = application.income || 0
    const rent = property.price || 0

    if (income > 0 && rent > 0) {
      const ratio = income / rent

      if (ratio >= criteria.income_ratio.thresholds.excellent) {
        result.breakdown.income_ratio.score = Math.round(
          (criteria.income_ratio.points.excellent / 100) * criteria.income_ratio.weight,
        )
        result.breakdown.income_ratio.details = `Excellent ratio revenus/loyer (${ratio.toFixed(1)}x)`
        result.breakdown.income_ratio.compatible = true
      } else if (ratio >= criteria.income_ratio.thresholds.good) {
        result.breakdown.income_ratio.score = Math.round(
          (criteria.income_ratio.points.good / 100) * criteria.income_ratio.weight,
        )
        result.breakdown.income_ratio.details = `Bon ratio revenus/loyer (${ratio.toFixed(1)}x)`
        result.breakdown.income_ratio.compatible = true
      } else if (ratio >= criteria.income_ratio.thresholds.acceptable) {
        result.breakdown.income_ratio.score = Math.round(
          (criteria.income_ratio.points.acceptable / 100) * criteria.income_ratio.weight,
        )
        result.breakdown.income_ratio.details = `Ratio revenus/loyer acceptable (${ratio.toFixed(1)}x)`
        result.breakdown.income_ratio.compatible = true
      } else {
        result.breakdown.income_ratio.score = Math.round(
          (criteria.income_ratio.points.insufficient / 100) * criteria.income_ratio.weight,
        )
        result.breakdown.income_ratio.details = `Ratio revenus/loyer insuffisant (${ratio.toFixed(1)}x)`
        result.breakdown.income_ratio.compatible = false
        result.warnings.push(
          `Revenus insuffisants : ${ratio.toFixed(1)}x le loyer (minimum : ${criteria.income_ratio.thresholds.minimum}x)`,
        )
      }
    } else {
      result.breakdown.income_ratio.details = "Revenus ou loyer non spécifiés"
      result.warnings.push("Revenus non spécifiés")
    }

    // 2. Évaluation de la stabilité professionnelle
    const contractType = application.contract_type?.toLowerCase() || "unknown"
    const contractScore =
      criteria.professional_stability.contract_types[
        contractType as keyof typeof criteria.professional_stability.contract_types
      ] || 0

    result.breakdown.professional_stability.score = Math.round(
      (contractScore / 100) * criteria.professional_stability.weight,
    )
    result.breakdown.professional_stability.details = `Type de contrat: ${contractType.toUpperCase()} (${contractScore}%)`
    result.breakdown.professional_stability.compatible = contractScore >= 50

    // Bonus ancienneté
    if (
      criteria.professional_stability.seniority_bonus.enabled &&
      application.seniority_months >= criteria.professional_stability.seniority_bonus.min_months
    ) {
      const bonus = Math.round(
        (criteria.professional_stability.seniority_bonus.bonus_points / 100) * criteria.professional_stability.weight,
      )
      result.breakdown.professional_stability.score = Math.min(
        criteria.professional_stability.weight,
        result.breakdown.professional_stability.score + bonus,
      )
      result.breakdown.professional_stability.details += ` + bonus ancienneté`
    }

    // Pénalité période d'essai
    if (criteria.professional_stability.trial_period_penalty.enabled && application.trial_period) {
      const penalty = Math.round(
        (criteria.professional_stability.trial_period_penalty.penalty_points / 100) *
          criteria.professional_stability.weight,
      )
      result.breakdown.professional_stability.score = Math.max(
        0,
        result.breakdown.professional_stability.score - penalty,
      )
      result.breakdown.professional_stability.details += ` - pénalité période d'essai`
    }

    // 3. Évaluation des garants
    if (application.has_guarantor) {
      result.breakdown.guarantor.score = Math.round(
        (criteria.guarantor.presence_points / 100) * criteria.guarantor.weight,
      )
      result.breakdown.guarantor.details = "Garant présent"
      result.breakdown.guarantor.compatible = true

      // Bonus revenus garant
      if (criteria.guarantor.income_ratio_bonus.enabled && application.guarantor_income && rent > 0) {
        const guarantorRatio = application.guarantor_income / rent
        if (guarantorRatio >= criteria.guarantor.income_ratio_bonus.threshold) {
          const bonus = Math.round(
            (criteria.guarantor.income_ratio_bonus.bonus_points / 100) * criteria.guarantor.weight,
          )
          result.breakdown.guarantor.score = Math.min(
            criteria.guarantor.weight,
            result.breakdown.guarantor.score + bonus,
          )
          result.breakdown.guarantor.details += ` + bonus revenus garant (${guarantorRatio.toFixed(1)}x)`
        }
      }
    } else {
      result.breakdown.guarantor.score = 0
      result.breakdown.guarantor.details = "Pas de garant"
      result.breakdown.guarantor.compatible = false
    }

    // 4. Évaluation de la qualité du dossier
    const presentationLength = application.presentation?.length || 0

    if (presentationLength >= criteria.application_quality.presentation_length.excellent) {
      result.breakdown.application_quality.score = criteria.application_quality.weight
      result.breakdown.application_quality.details = `Présentation excellente (${presentationLength} caractères)`
      result.breakdown.application_quality.compatible = true
    } else if (presentationLength >= criteria.application_quality.presentation_length.good) {
      result.breakdown.application_quality.score = Math.round(criteria.application_quality.weight * 0.75)
      result.breakdown.application_quality.details = `Bonne présentation (${presentationLength} caractères)`
      result.breakdown.application_quality.compatible = true
    } else if (presentationLength >= criteria.application_quality.presentation_length.basic) {
      result.breakdown.application_quality.score = Math.round(criteria.application_quality.weight * 0.5)
      result.breakdown.application_quality.details = `Présentation basique (${presentationLength} caractères)`
      result.breakdown.application_quality.compatible = true
    } else {
      result.breakdown.application_quality.score = Math.round(criteria.application_quality.weight * 0.25)
      result.breakdown.application_quality.details = `Présentation insuffisante (${presentationLength} caractères)`
      result.breakdown.application_quality.compatible = false
    }

    // Calcul du score total
    result.totalScore = Math.min(
      100,
      result.breakdown.income_ratio.score +
        result.breakdown.professional_stability.score +
        result.breakdown.guarantor.score +
        result.breakdown.application_quality.score,
    )

    // Déterminer la compatibilité globale
    result.compatible =
      result.totalScore >= 60 &&
      result.breakdown.income_ratio.compatible &&
      result.breakdown.professional_stability.compatible

    // Ajouter des recommandations
    if (result.totalScore < 60) {
      result.recommendations.push("Améliorer le score global pour atteindre au moins 60/100")
    }
    if (!result.breakdown.income_ratio.compatible) {
      result.recommendations.push("Augmenter les revenus ou trouver un garant")
    }
    if (!result.breakdown.guarantor.compatible) {
      result.recommendations.push("Ajouter un garant pour sécuriser le dossier")
    }

    return result
  },

  // Valider les préférences
  validatePreferences(preferences: ScoringPreferences): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!preferences.criteria) {
      errors.push("Critères manquants")
      return { valid: false, errors }
    }

    const totalWeight =
      (preferences.criteria.income_ratio?.weight || 0) +
      (preferences.criteria.professional_stability?.weight || 0) +
      (preferences.criteria.guarantor?.weight || 0) +
      (preferences.criteria.application_quality?.weight || 0)

    if (totalWeight !== 100) {
      errors.push(`Le total des poids doit être égal à 100% (actuellement: ${totalWeight}%)`)
    }

    return { valid: errors.length === 0, errors }
  },
}
