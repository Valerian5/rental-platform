export interface ScoringPreferences {
  id?: string
  owner_id: string
  name: string
  description?: string
  model_type?: "strict" | "standard" | "flexible" | "custom"
  is_default: boolean
  is_system?: boolean
  system_preference_id?: string
  criteria: {
    income_ratio: {
      weight: number
      thresholds: {
        excellent: number
        good: number
        acceptable: number
        minimum: number
      }
      per_person_check: boolean
    }
    guarantor: {
      weight: number
      required_if_income_below: number
      types_accepted: {
        parent: boolean
        visale: boolean
        garantme: boolean
        other_physical: boolean
        company: boolean
      }
      minimum_income_ratio: number
      verification_required: boolean
    }
    professional_stability: {
      weight: number
      contract_scoring: {
        cdi_confirmed: number
        cdi_trial: number
        cdd_long: number
        cdd_short: number
        freelance: number
        student: number
        unemployed: number
        retired: number
        civil_servant: number
      }
      seniority_bonus: {
        enabled: boolean
        min_months: number
        bonus_points: number
      }
      trial_period_penalty: number
    }
    file_quality: {
      weight: number
      complete_documents_required: boolean
      verified_documents_required: boolean
      presentation_quality_weight: number
      coherence_check_weight: number
    }
    property_coherence: {
      weight: number
      household_size_vs_property: boolean
      colocation_structure_check: boolean
      location_relevance_check: boolean
      family_situation_coherence: boolean
    }
    income_distribution: {
      weight: number
      balance_check: boolean
      compensation_allowed: boolean
    }
  }
  exclusion_rules: {
    incomplete_file: boolean
    no_guarantor_when_required: boolean
    income_ratio_below_2: boolean
    unverified_documents: boolean
    manifest_incoherence: boolean
  }
  created_at?: string
  updated_at?: string
}

export interface ScoringResult {
  totalScore: number
  compatible: boolean
  breakdown: {
    income_ratio: { score: number; max: number; details: string }
    guarantor: { score: number; max: number; details: string }
    professional_stability: { score: number; max: number; details: string }
    file_quality: { score: number; max: number; details: string }
    property_coherence: { score: number; max: number; details: string }
    income_distribution: { score: number; max: number; details: string }
  }
  warnings: string[]
  recommendations: string[]
  exclusions: string[]
}

export interface ApplicationProfile {
  income: number
  contract_type: string
  profession: string
  company: string
  trial_period: boolean
  seniority_months: number
  has_guarantor: boolean
  guarantor_income: number
  guarantor_type: string
  file_complete: boolean
  has_verified_documents: boolean
  presentation: string
}

export interface Property {
  price: number
  rooms?: number
  type?: string
}

class ScoringPreferencesService {
  calculateScore(application: ApplicationProfile, property: Property, preferences: ScoringPreferences): ScoringResult {
    const result: ScoringResult = {
      totalScore: 0,
      compatible: true,
      breakdown: {
        income_ratio: { score: 0, max: 0, details: "" },
        guarantor: { score: 0, max: 0, details: "" },
        professional_stability: { score: 0, max: 0, details: "" },
        file_quality: { score: 0, max: 0, details: "" },
        property_coherence: { score: 0, max: 0, details: "" },
        income_distribution: { score: 0, max: 0, details: "" },
      },
      warnings: [],
      recommendations: [],
      exclusions: [],
    }

    // 1. Calcul du score revenus
    const incomeRatio = application.income / property.price
    const incomeScore = this.calculateIncomeScore(incomeRatio, preferences.criteria.income_ratio)
    result.breakdown.income_ratio = {
      score: incomeScore,
      max: preferences.criteria.income_ratio.weight,
      details: `Ratio ${incomeRatio.toFixed(1)}x`,
    }

    // 2. Calcul du score garant
    const guarantorScore = this.calculateGuarantorScore(application, property, preferences.criteria.guarantor)
    result.breakdown.guarantor = {
      score: guarantorScore,
      max: preferences.criteria.guarantor.weight,
      details: application.has_guarantor ? "Garant présent" : "Pas de garant",
    }

    // 3. Calcul du score stabilité professionnelle
    const professionalScore = this.calculateProfessionalScore(application, preferences.criteria.professional_stability)
    result.breakdown.professional_stability = {
      score: professionalScore,
      max: preferences.criteria.professional_stability.weight,
      details: application.contract_type.replace("_", " "),
    }

    // 4. Calcul du score qualité dossier
    const fileScore = this.calculateFileScore(application, preferences.criteria.file_quality)
    result.breakdown.file_quality = {
      score: fileScore,
      max: preferences.criteria.file_quality.weight,
      details: application.file_complete ? "Dossier complet" : "Dossier incomplet",
    }

    // 5. Calcul du score cohérence propriété (score par défaut)
    const coherenceScore = preferences.criteria.property_coherence.weight * 0.8
    result.breakdown.property_coherence = {
      score: Math.round(coherenceScore),
      max: preferences.criteria.property_coherence.weight,
      details: "Cohérence évaluée",
    }

    // 6. Calcul du score répartition revenus (score par défaut)
    const distributionScore = preferences.criteria.income_distribution.weight * 0.8
    result.breakdown.income_distribution = {
      score: Math.round(distributionScore),
      max: preferences.criteria.income_distribution.weight,
      details: "Répartition évaluée",
    }

    // Calcul du score total
    result.totalScore = Math.round(
      incomeScore + guarantorScore + professionalScore + fileScore + coherenceScore + distributionScore,
    )

    // Vérification des règles d'exclusion
    this.checkExclusionRules(application, property, preferences.exclusion_rules, result)

    // Génération des warnings et recommandations
    this.generateWarningsAndRecommendations(application, property, preferences, result)

    return result
  }

  private calculateIncomeScore(ratio: number, criteria: ScoringPreferences["criteria"]["income_ratio"]): number {
    const { weight, thresholds } = criteria

    if (ratio >= thresholds.excellent) return weight
    if (ratio >= thresholds.good) return Math.round(weight * 0.85)
    if (ratio >= thresholds.acceptable) return Math.round(weight * 0.65)
    if (ratio >= thresholds.minimum) return Math.round(weight * 0.4)
    return Math.round(weight * 0.2)
  }

  private calculateGuarantorScore(
    application: ApplicationProfile,
    property: Property,
    criteria: ScoringPreferences["criteria"]["guarantor"],
  ): number {
    const { weight, required_if_income_below, minimum_income_ratio } = criteria
    const incomeRatio = application.income / property.price

    if (application.has_guarantor) {
      const guarantorRatio = application.guarantor_income / property.price
      if (guarantorRatio >= minimum_income_ratio) {
        return weight
      } else {
        return Math.round(weight * 0.6)
      }
    } else {
      // Pas de garant
      if (incomeRatio >= required_if_income_below) {
        // Revenus suffisants, pas besoin de garant
        return Math.round(weight * 0.3)
      } else {
        // Revenus insuffisants et pas de garant
        return 0
      }
    }
  }

  private calculateProfessionalScore(
    application: ApplicationProfile,
    criteria: ScoringPreferences["criteria"]["professional_stability"],
  ): number {
    const { weight, contract_scoring, seniority_bonus, trial_period_penalty } = criteria

    const baseScore = contract_scoring[application.contract_type as keyof typeof contract_scoring] || 0

    // Normaliser le score sur le poids du critère
    let score = (baseScore / 20) * weight

    // Bonus ancienneté
    if (seniority_bonus.enabled && application.seniority_months >= seniority_bonus.min_months) {
      score += seniority_bonus.bonus_points
    }

    // Pénalité période d'essai
    if (application.trial_period) {
      score -= trial_period_penalty
    }

    return Math.max(0, Math.round(score))
  }

  private calculateFileScore(
    application: ApplicationProfile,
    criteria: ScoringPreferences["criteria"]["file_quality"],
  ): number {
    const { weight, complete_documents_required, verified_documents_required, presentation_quality_weight } = criteria

    let score = 0

    // Score de base pour complétude
    if (application.file_complete) {
      score += weight * 0.4
    } else if (complete_documents_required) {
      return 0 // Exclusion si dossier incomplet requis
    }

    // Score pour documents vérifiés
    if (application.has_verified_documents) {
      score += weight * 0.3
    } else if (verified_documents_required) {
      score *= 0.5 // Pénalité si vérification requise
    }

    // Score pour présentation
    const presentationScore = (presentation_quality_weight / 20) * weight
    if (application.presentation.length > 50) {
      score += presentationScore
    } else {
      score += presentationScore * 0.3
    }

    return Math.round(score)
  }

  private checkExclusionRules(
    application: ApplicationProfile,
    property: Property,
    rules: ScoringPreferences["exclusion_rules"],
    result: ScoringResult,
  ): void {
    const incomeRatio = application.income / property.price

    if (rules.incomplete_file && !application.file_complete) {
      result.compatible = false
      result.exclusions.push("Dossier incomplet")
    }

    if (rules.no_guarantor_when_required && !application.has_guarantor && incomeRatio < 3.0) {
      result.compatible = false
      result.exclusions.push("Garant requis")
    }

    if (rules.income_ratio_below_2 && incomeRatio < 2.0) {
      result.compatible = false
      result.exclusions.push("Revenus insuffisants")
    }

    if (rules.unverified_documents && !application.has_verified_documents) {
      result.compatible = false
      result.exclusions.push("Documents non vérifiés")
    }
  }

  private generateWarningsAndRecommendations(
    application: ApplicationProfile,
    property: Property,
    preferences: ScoringPreferences,
    result: ScoringResult,
  ): void {
    const incomeRatio = application.income / property.price

    // Warnings
    if (incomeRatio < 3.0) {
      result.warnings.push("Ratio revenus/loyer faible")
    }

    if (application.trial_period) {
      result.warnings.push("Candidat en période d'essai")
    }

    if (!application.file_complete) {
      result.warnings.push("Dossier incomplet")
    }

    // Recommandations
    if (result.totalScore < 60) {
      result.recommendations.push("Score faible - Examiner attentivement")
    } else if (result.totalScore >= 80) {
      result.recommendations.push("Excellent profil - Candidature recommandée")
    } else {
      result.recommendations.push("Profil correct - Candidature acceptable")
    }
  }

  async getSystemPreferences(): Promise<ScoringPreferences[]> {
    try {
      const response = await fetch("/api/admin/scoring-preferences")
      if (!response.ok) throw new Error("Erreur réseau")

      const data = await response.json()
      return data.preferences || []
    } catch (error) {
      console.error("Erreur chargement préférences système:", error)
      return []
    }
  }

  async getUserPreferences(ownerId: string): Promise<ScoringPreferences[]> {
    try {
      const response = await fetch(`/api/scoring-preferences?owner_id=${ownerId}`)
      if (!response.ok) throw new Error("Erreur réseau")

      const data = await response.json()
      return data.preferences || []
    } catch (error) {
      console.error("Erreur chargement préférences utilisateur:", error)
      return []
    }
  }

  async savePreferences(preferences: Partial<ScoringPreferences>): Promise<ScoringPreferences> {
    try {
      const response = await fetch("/api/scoring-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      })

      if (!response.ok) throw new Error("Erreur sauvegarde")

      const data = await response.json()
      return data.preference || data.preferences
    } catch (error) {
      console.error("Erreur sauvegarde préférences:", error)
      throw error
    }
  }

  async useSystemPreference(ownerId: string, systemPreferenceId: string): Promise<ScoringPreferences> {
    try {
      const response = await fetch("/api/scoring-preferences/use-system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_id: ownerId,
          system_preference_id: systemPreferenceId,
        }),
      })

      if (!response.ok) throw new Error("Erreur application modèle")

      const data = await response.json()
      return data.preference
    } catch (error) {
      console.error("Erreur application modèle système:", error)
      throw error
    }
  }
}

export const scoringPreferencesService = new ScoringPreferencesService()
