import { supabase } from "./supabase"

export interface ScoringCriteria {
  income_ratio: {
    weight: number // 0-100
    thresholds: {
      excellent: number // ex: 3.5
      good: number // ex: 3.0
      acceptable: number // ex: 2.5
      minimum: number // ex: 2.0
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
      excellent: number // caractères
      good: number
      basic: number
    }
    completeness_bonus: {
      enabled: boolean
      required_fields: string[]
      bonus_points: number
    }
    response_time_bonus: {
      enabled: boolean
      hours_threshold: number
      bonus_points: number
    }
  }
  additional_criteria: {
    age_preference: {
      enabled: boolean
      min_age: number
      max_age: number
      penalty_points: number
    }
    housing_situation: {
      enabled: boolean
      preferences: {
        first_time_renter: number
        current_tenant: number
        owner_selling: number
        living_with_parents: number
      }
    }
    location_proximity: {
      enabled: boolean
      work_distance_bonus: {
        max_km: number
        bonus_points: number
      }
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

export const scoringPreferencesService = {
  // Récupérer les préférences par défaut d'un propriétaire
  async getOwnerDefaultPreferences(ownerId: string): Promise<ScoringPreferences | null> {
    try {
      const { data, error } = await supabase
        .from("scoring_preferences")
        .select("*")
        .eq("owner_id", ownerId)
        .eq("is_default", true)
        .single()

      if (error && error.code !== "PGRST116") {
        throw error
      }

      return data || null
    } catch (error) {
      console.error("Erreur récupération préférences scoring:", error)
      return null
    }
  },

  // Récupérer toutes les préférences d'un propriétaire
  async getOwnerPreferences(ownerId: string): Promise<ScoringPreferences[]> {
    try {
      const { data, error } = await supabase
        .from("scoring_preferences")
        .select("*")
        .eq("owner_id", ownerId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Erreur récupération préférences:", error)
      return []
    }
  },

  // Sauvegarder les préférences
  async savePreferences(
    preferences: Omit<ScoringPreferences, "id" | "created_at" | "updated_at">,
  ): Promise<ScoringPreferences> {
    try {
      // Si c'est le profil par défaut, désactiver les autres
      if (preferences.is_default) {
        await supabase.from("scoring_preferences").update({ is_default: false }).eq("owner_id", preferences.owner_id)
      }

      const { data, error } = await supabase.from("scoring_preferences").insert(preferences).select().single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Erreur sauvegarde préférences:", error)
      throw error
    }
  },

  // Mettre à jour les préférences
  async updatePreferences(id: string, updates: Partial<ScoringPreferences>): Promise<ScoringPreferences> {
    try {
      // Si on définit comme défaut, désactiver les autres
      if (updates.is_default) {
        const { data: current } = await supabase.from("scoring_preferences").select("owner_id").eq("id", id).single()

        if (current) {
          await supabase.from("scoring_preferences").update({ is_default: false }).eq("owner_id", current.owner_id)
        }
      }

      const { data, error } = await supabase
        .from("scoring_preferences")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Erreur mise à jour préférences:", error)
      throw error
    }
  },

  // Supprimer des préférences
  async deletePreferences(id: string): Promise<void> {
    try {
      const { error } = await supabase.from("scoring_preferences").delete().eq("id", id)

      if (error) throw error
    } catch (error) {
      console.error("Erreur suppression préférences:", error)
      throw error
    }
  },

  // Calculer le score avec les préférences personnalisées
  calculateCustomScore(
    application: any,
    property: any,
    preferences: ScoringPreferences,
  ): {
    totalScore: number
    breakdown: any
  } {
    const criteria = preferences.criteria
    const breakdown = {
      income_ratio: { score: 0, max: criteria.income_ratio.weight, details: "" },
      professional_stability: { score: 0, max: criteria.professional_stability.weight, details: "" },
      guarantor: { score: 0, max: criteria.guarantor.weight, details: "" },
      application_quality: { score: 0, max: criteria.application_quality.weight, details: "" },
      additional_criteria: { score: 0, max: 0, details: "" },
    }

    // 1. Ratio revenus/loyer
    if (application.income && property.price) {
      const ratio = application.income / property.price
      const thresholds = criteria.income_ratio.thresholds
      const points = criteria.income_ratio.points

      if (ratio >= thresholds.excellent) {
        breakdown.income_ratio.score = (points.excellent / 100) * criteria.income_ratio.weight
        breakdown.income_ratio.details = `Excellent ratio (${ratio.toFixed(1)}x)`
      } else if (ratio >= thresholds.good) {
        breakdown.income_ratio.score = (points.good / 100) * criteria.income_ratio.weight
        breakdown.income_ratio.details = `Bon ratio (${ratio.toFixed(1)}x)`
      } else if (ratio >= thresholds.acceptable) {
        breakdown.income_ratio.score = (points.acceptable / 100) * criteria.income_ratio.weight
        breakdown.income_ratio.details = `Ratio acceptable (${ratio.toFixed(1)}x)`
      } else {
        breakdown.income_ratio.score = (points.insufficient / 100) * criteria.income_ratio.weight
        breakdown.income_ratio.details = `Ratio insuffisant (${ratio.toFixed(1)}x)`
      }
    }

    // 2. Stabilité professionnelle
    const contractType = application.contract_type?.toLowerCase() || "unknown"
    const contractPoints = criteria.professional_stability.contract_types[contractType] || 0
    breakdown.professional_stability.score = (contractPoints / 100) * criteria.professional_stability.weight
    breakdown.professional_stability.details = `Contrat: ${application.contract_type || "Non spécifié"}`

    // Bonus ancienneté
    if (criteria.professional_stability.seniority_bonus.enabled && application.seniority_months) {
      if (application.seniority_months >= criteria.professional_stability.seniority_bonus.min_months) {
        const bonus =
          (criteria.professional_stability.seniority_bonus.bonus_points / 100) * criteria.professional_stability.weight
        breakdown.professional_stability.score += bonus
        breakdown.professional_stability.details += ` + Bonus ancienneté`
      }
    }

    // Pénalité période d'essai
    if (criteria.professional_stability.trial_period_penalty.enabled && application.trial_period) {
      const penalty =
        (criteria.professional_stability.trial_period_penalty.penalty_points / 100) *
        criteria.professional_stability.weight
      breakdown.professional_stability.score -= penalty
      breakdown.professional_stability.details += ` - Période d'essai`
    }

    // 3. Garants
    if (application.has_guarantor) {
      breakdown.guarantor.score = (criteria.guarantor.presence_points / 100) * criteria.guarantor.weight
      breakdown.guarantor.details = "Garant présent"

      // Bonus ratio garant
      if (criteria.guarantor.income_ratio_bonus.enabled && application.guarantor_income && property.price) {
        const guarantorRatio = application.guarantor_income / property.price
        if (guarantorRatio >= criteria.guarantor.income_ratio_bonus.threshold) {
          const bonus = (criteria.guarantor.income_ratio_bonus.bonus_points / 100) * criteria.guarantor.weight
          breakdown.guarantor.score += bonus
          breakdown.guarantor.details += " + Revenus garant excellents"
        }
      }
    }

    // 4. Qualité candidature
    const presentationLength = (application.presentation || application.message || "").length
    const qualityThresholds = criteria.application_quality.presentation_length

    if (presentationLength >= qualityThresholds.excellent) {
      breakdown.application_quality.score = criteria.application_quality.weight
      breakdown.application_quality.details = "Présentation excellente"
    } else if (presentationLength >= qualityThresholds.good) {
      breakdown.application_quality.score = criteria.application_quality.weight * 0.7
      breakdown.application_quality.details = "Bonne présentation"
    } else if (presentationLength >= qualityThresholds.basic) {
      breakdown.application_quality.score = criteria.application_quality.weight * 0.4
      breakdown.application_quality.details = "Présentation basique"
    } else {
      breakdown.application_quality.score = criteria.application_quality.weight * 0.1
      breakdown.application_quality.details = "Présentation insuffisante"
    }

    // Bonus complétude
    if (criteria.application_quality.completeness_bonus.enabled) {
      const requiredFields = criteria.application_quality.completeness_bonus.required_fields
      const completedFields = requiredFields.filter((field) => application[field]).length
      if (completedFields === requiredFields.length) {
        const bonus =
          (criteria.application_quality.completeness_bonus.bonus_points / 100) * criteria.application_quality.weight
        breakdown.application_quality.score += bonus
        breakdown.application_quality.details += " + Dossier complet"
      }
    }

    const totalScore = Math.min(
      Object.values(breakdown).reduce((sum, item) => sum + item.score, 0),
      100,
    )

    return { totalScore, breakdown }
  },

  // Préférences par défaut
  getDefaultPreferences(ownerId: string): ScoringPreferences {
    return {
      owner_id: ownerId,
      name: "Profil équilibré",
      is_default: true,
      criteria: {
        income_ratio: {
          weight: 35,
          thresholds: {
            excellent: 3.5,
            good: 3.0,
            acceptable: 2.5,
            minimum: 2.0,
          },
          points: {
            excellent: 100,
            good: 85,
            acceptable: 70,
            insufficient: 30,
          },
        },
        professional_stability: {
          weight: 25,
          contract_types: {
            cdi: 100,
            cdd: 70,
            freelance: 60,
            student: 40,
            unemployed: 10,
            retired: 90,
          },
          seniority_bonus: {
            enabled: true,
            min_months: 12,
            bonus_points: 10,
          },
          trial_period_penalty: {
            enabled: true,
            penalty_points: 15,
          },
        },
        guarantor: {
          weight: 25,
          presence_points: 80,
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
          weight: 15,
          presentation_length: {
            excellent: 200,
            good: 100,
            basic: 50,
          },
          completeness_bonus: {
            enabled: true,
            required_fields: ["profession", "company", "move_in_date"],
            bonus_points: 20,
          },
          response_time_bonus: {
            enabled: false,
            hours_threshold: 24,
            bonus_points: 10,
          },
        },
        additional_criteria: {
          age_preference: {
            enabled: false,
            min_age: 18,
            max_age: 65,
            penalty_points: 10,
          },
          housing_situation: {
            enabled: false,
            preferences: {
              first_time_renter: 0,
              current_tenant: 10,
              owner_selling: 5,
              living_with_parents: -5,
            },
          },
          location_proximity: {
            enabled: false,
            work_distance_bonus: {
              max_km: 10,
              bonus_points: 5,
            },
          },
        },
      },
    }
  },
}
