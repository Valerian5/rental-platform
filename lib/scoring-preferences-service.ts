// Interface pour les critères de scoring
export interface ScoringCriteria {
  income_ratio: {
    weight: number // 0-20 points
    thresholds: {
      excellent: number // >= 3.5x
      good: number // >= 3x
      acceptable: number // >= 2.5x
      minimum: number // >= 2x
    }
    per_person_check: boolean
    use_guarantor_income_for_students: boolean // Nouvelle option pour étudiants
  }
  guarantor: {
    weight: number // 0-20 points
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
    weight: number // 0-20 points
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
    weight: number // 0-20 points
    complete_documents_required: boolean
    verified_documents_required: boolean
    presentation_quality_weight: number
    coherence_check_weight: number
  }
  property_coherence: {
    weight: number // 0-20 points
    household_size_vs_property: boolean
    colocation_structure_check: boolean
    location_relevance_check: boolean
    family_situation_coherence: boolean
  }
  income_distribution: {
    weight: number // 0-20 points (spécifique colocation)
    balance_check: boolean
    compensation_allowed: boolean
  }
}

export interface ScoringPreferences {
  id?: string
  owner_id: string
  name: string
  description?: string
  is_default: boolean
  model_type: "custom" | "strict" | "standard" | "flexible"
  criteria: ScoringCriteria
  exclusion_rules: {
    incomplete_file: boolean
    no_guarantor_when_required: boolean
    income_ratio_below_2: boolean
    unverified_documents: boolean
    manifest_incoherence: boolean
  }
  system_preference_id?: string
  is_system?: boolean
  created_at?: string
  updated_at?: string
  version?: number
}

export interface ScoringResult {
  totalScore: number
  compatible: boolean
  model_used: string
  model_version?: number
  calculated_at?: string
  breakdown: {
    income_ratio: {
      score: number
      max: number
      details: string
      compatible: boolean
      ratio?: number
    }
    guarantor: {
      score: number
      max: number
      details: string
      compatible: boolean
      guarantor_count?: number
    }
    professional_stability: {
      score: number
      max: number
      details: string
      compatible: boolean
      contract_type?: string
    }
    file_quality: {
      score: number
      max: number
      details: string
      compatible: boolean
    }
    property_coherence: {
      score: number
      max: number
      details: string
      compatible: boolean
    }
    income_distribution?: {
      score: number
      max: number
      details: string
      compatible: boolean
    }
  }
  exclusions: string[]
  recommendations: string[]
  warnings: string[]
  household_type: "single" | "couple" | "colocation"
}

// Cache centralisé pour les préférences
class PreferencesCache {
  private cache = new Map<string, { preferences: ScoringPreferences; timestamp: number }>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  get(ownerId: string): ScoringPreferences | null {
    const cached = this.cache.get(ownerId)
    if (!cached) return null

    const now = Date.now()
    if (now - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(ownerId)
      return null
    }

    return cached.preferences
  }

  set(ownerId: string, preferences: ScoringPreferences): void {
    this.cache.set(ownerId, {
      preferences,
      timestamp: Date.now(),
    })
  }

  invalidate(ownerId: string): void {
    this.cache.delete(ownerId)
  }

  clear(): void {
    this.cache.clear()
  }
}

// Cache pour les scores calculés
class ScoreCache {
  private cache = new Map<string, { result: ScoringResult; timestamp: number }>()
  private readonly CACHE_TTL = 2 * 60 * 1000 // 2 minutes

  private getKey(applicationId: string, propertyPrice: number, preferencesVersion: number): string {
    return `${applicationId}-${propertyPrice}-${preferencesVersion}`
  }

  get(applicationId: string, propertyPrice: number, preferencesVersion: number): ScoringResult | null {
    const key = this.getKey(applicationId, propertyPrice, preferencesVersion)
    const cached = this.cache.get(key)
    if (!cached) return null

    const now = Date.now()
    if (now - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key)
      return null
    }

    return cached.result
  }

  set(applicationId: string, propertyPrice: number, preferencesVersion: number, result: ScoringResult): void {
    const key = this.getKey(applicationId, propertyPrice, preferencesVersion)
    this.cache.set(key, {
      result: { ...result, calculated_at: new Date().toISOString() },
      timestamp: Date.now(),
    })
  }

  invalidateForOwner(ownerId: string): void {
    // Invalider tous les scores (simplification)
    this.cache.clear()
  }
}

// Instances globales des caches
const preferencesCache = new PreferencesCache()
const scoreCache = new ScoreCache()

export const scoringPreferencesService = {
  // Modèles prédéfinis avec scoring cohérent
  getStrictModel(): ScoringPreferences {
    return {
      owner_id: "",
      name: "Strict (GLI)",
      description: "Critères stricts inspirés des assurances GLI",
      is_default: true,
      model_type: "strict",
      criteria: {
        income_ratio: {
          weight: 20,
          thresholds: { excellent: 4.0, good: 3.5, acceptable: 3.0, minimum: 2.5 },
          per_person_check: true,
          use_guarantor_income_for_students: false,
        },
        guarantor: {
          weight: 20,
          required_if_income_below: 3.5,
          types_accepted: { parent: true, visale: true, garantme: true, other_physical: true, company: true },
          minimum_income_ratio: 3.5,
          verification_required: true,
        },
        professional_stability: {
          weight: 20,
          contract_scoring: {
            cdi_confirmed: 20,
            cdi_trial: 12,
            cdd_long: 10,
            cdd_short: 6,
            freelance: 4,
            student: 2,
            unemployed: 0,
            retired: 18,
            civil_servant: 20,
          },
          seniority_bonus: { enabled: true, min_months: 12, bonus_points: 3 },
          trial_period_penalty: 5,
        },
        file_quality: {
          weight: 20,
          complete_documents_required: true,
          verified_documents_required: true,
          presentation_quality_weight: 5,
          coherence_check_weight: 10,
        },
        property_coherence: {
          weight: 10,
          household_size_vs_property: true,
          colocation_structure_check: true,
          location_relevance_check: true,
          family_situation_coherence: true,
        },
        income_distribution: {
          weight: 10,
          balance_check: true,
          compensation_allowed: false,
        },
      },
      exclusion_rules: {
        incomplete_file: true,
        no_guarantor_when_required: true,
        income_ratio_below_2: true,
        unverified_documents: true,
        manifest_incoherence: true,
      },
    }
  },

  getStandardModel(): ScoringPreferences {
    return {
      owner_id: "",
      name: "Standard (Agence)",
      description: "Pratiques standards d'agence immobilière",
      is_default: true,
      model_type: "standard",
      criteria: {
        income_ratio: {
          weight: 18,
          thresholds: { excellent: 3.5, good: 3.0, acceptable: 2.5, minimum: 2.0 },
          per_person_check: true,
          use_guarantor_income_for_students: false,
        },
        guarantor: {
          weight: 17,
          required_if_income_below: 3.0,
          types_accepted: { parent: true, visale: true, garantme: true, other_physical: true, company: true },
          minimum_income_ratio: 3.0,
          verification_required: true,
        },
        professional_stability: {
          weight: 17,
          contract_scoring: {
            cdi_confirmed: 17,
            cdi_trial: 14,
            cdd_long: 12,
            cdd_short: 9,
            freelance: 8,
            student: 6,
            unemployed: 0,
            retired: 15,
            civil_servant: 17,
          },
          seniority_bonus: { enabled: true, min_months: 6, bonus_points: 2 },
          trial_period_penalty: 3,
        },
        file_quality: {
          weight: 16,
          complete_documents_required: true,
          verified_documents_required: false,
          presentation_quality_weight: 6,
          coherence_check_weight: 8,
        },
        property_coherence: {
          weight: 16,
          household_size_vs_property: true,
          colocation_structure_check: true,
          location_relevance_check: false,
          family_situation_coherence: true,
        },
        income_distribution: {
          weight: 16,
          balance_check: true,
          compensation_allowed: true,
        },
      },
      exclusion_rules: {
        incomplete_file: false,
        no_guarantor_when_required: true,
        income_ratio_below_2: false,
        unverified_documents: false,
        manifest_incoherence: true,
      },
    }
  },

  getFlexibleModel(): ScoringPreferences {
    return {
      owner_id: "",
      name: "Souple (Particulier)",
      description: "Approche humaine et flexible pour particuliers",
      is_default: true,
      model_type: "flexible",
      criteria: {
        income_ratio: {
          weight: 15,
          thresholds: { excellent: 3.0, good: 2.5, acceptable: 2.0, minimum: 1.8 },
          per_person_check: false,
          use_guarantor_income_for_students: true, // Option activée pour les étudiants
        },
        guarantor: {
          weight: 15,
          required_if_income_below: 2.5,
          types_accepted: { parent: true, visale: true, garantme: true, other_physical: true, company: false },
          minimum_income_ratio: 2.5,
          verification_required: false,
        },
        professional_stability: {
          weight: 15,
          contract_scoring: {
            cdi_confirmed: 15,
            cdi_trial: 13,
            cdd_long: 12,
            cdd_short: 10,
            freelance: 12,
            student: 10, // Score plus élevé pour les étudiants
            unemployed: 3,
            retired: 13,
            civil_servant: 15,
          },
          seniority_bonus: { enabled: false, min_months: 0, bonus_points: 0 },
          trial_period_penalty: 1,
        },
        file_quality: {
          weight: 15,
          complete_documents_required: false,
          verified_documents_required: false,
          presentation_quality_weight: 8,
          coherence_check_weight: 5,
        },
        property_coherence: {
          weight: 20,
          household_size_vs_property: false,
          colocation_structure_check: false,
          location_relevance_check: false,
          family_situation_coherence: true,
        },
        income_distribution: {
          weight: 20,
          balance_check: false,
          compensation_allowed: true,
        },
      },
      exclusion_rules: {
        incomplete_file: false,
        no_guarantor_when_required: false,
        income_ratio_below_2: false,
        unverified_documents: false,
        manifest_incoherence: false,
      },
    }
  },

  // Obtenir les préférences par défaut
  getDefaultPreferences(ownerId: string): ScoringPreferences {
    const standardModel = this.getStandardModel()
    return {
      ...standardModel,
      owner_id: ownerId,
      name: "Préférences par défaut",
      version: 1,
    }
  },

  // Obtenir les préférences avec cache
  async getOwnerPreferences(ownerId: string, useCache = true): Promise<ScoringPreferences> {
    if (useCache) {
      const cached = preferencesCache.get(ownerId)
      if (cached) {
        console.log("🎯 Préférences récupérées depuis le cache:", cached.name)
        return cached
      }
    }

    try {
      const response = await fetch(`/api/scoring-preferences?owner_id=${ownerId}&default_only=true`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.preferences && data.preferences.length > 0) {
          const preferences = data.preferences[0]
          preferencesCache.set(ownerId, preferences)
          console.log("🎯 Préférences chargées:", preferences.name)
          return preferences
        }
      }

      // Fallback vers les préférences par défaut
      const defaultPrefs = this.getDefaultPreferences(ownerId)
      preferencesCache.set(ownerId, defaultPrefs)
      return defaultPrefs
    } catch (error) {
      console.error("❌ Erreur chargement préférences:", error)
      const defaultPrefs = this.getDefaultPreferences(ownerId)
      preferencesCache.set(ownerId, defaultPrefs)
      return defaultPrefs
    }
  },

  // FONCTION PRINCIPALE DE CALCUL DE SCORE - UNIFIÉE
  async calculateScore(application: any, property: any, ownerId: string, useCache = true): Promise<ScoringResult> {
    console.log("📊 Calcul de score unifié pour:", {
      applicationId: application.id,
      propertyId: property.id,
      propertyPrice: property.price,
      ownerId,
    })

    const preferences = await this.getOwnerPreferences(ownerId, useCache)
    const preferencesVersion = preferences.version || 1

    // Vérifier le cache
    if (useCache && application.id && property.price) {
      const cachedScore = scoreCache.get(application.id, property.price, preferencesVersion)
      if (cachedScore) {
        console.log("📊 Score récupéré depuis le cache:", cachedScore.totalScore)
        return cachedScore
      }
    }

    // Calculer le nouveau score
    const result = this.performScoreCalculation(application, property, preferences)

    // Mettre en cache
    if (useCache && application.id && property.price) {
      scoreCache.set(application.id, property.price, preferencesVersion, result)
    }

    console.log("📊 Score calculé:", {
      totalScore: result.totalScore,
      compatible: result.compatible,
      model: result.model_used,
    })

    return result
  },

  // Calcul effectif du score - LOGIQUE UNIFIÉE
  performScoreCalculation(application: any, property: any, preferences: ScoringPreferences): ScoringResult {
    console.log("🔍 Données d'entrée pour le calcul:", {
      application: {
        id: application.id,
        income: application.income,
        has_guarantor: application.has_guarantor,
        contract_type: application.contract_type,
        profession: application.profession,
      },
      property: {
        id: property.id,
        price: property.price,
        title: property.title,
      },
      preferences: {
        name: preferences.name,
        model_type: preferences.model_type,
      },
    })

    // Vérifier que les données nécessaires sont présentes
    if (!application || !property || !property.price) {
      console.error("❌ Données manquantes pour le calcul de score")
      return this.getDefaultResult(preferences.name)
    }

    // Extraire les candidats (principal + colocataires)
    const applicants = this.extractApplicants(application)
    const householdType = this.determineHouseholdType(applicants)

    console.log("👥 Analyse du foyer:", {
      type: householdType,
      candidats: applicants.length,
      revenus_total: applicants.reduce((sum, app) => sum + (app.income || 0), 0),
    })

    const result: ScoringResult = {
      totalScore: 0,
      compatible: true,
      model_used: preferences.name,
      model_version: preferences.version || 1,
      household_type: householdType,
      breakdown: {
        income_ratio: { score: 0, max: preferences.criteria.income_ratio.weight, details: "", compatible: true },
        guarantor: { score: 0, max: preferences.criteria.guarantor.weight, details: "", compatible: true },
        professional_stability: {
          score: 0,
          max: preferences.criteria.professional_stability.weight,
          details: "",
          compatible: true,
        },
        file_quality: { score: 0, max: preferences.criteria.file_quality.weight, details: "", compatible: true },
        property_coherence: {
          score: 0,
          max: preferences.criteria.property_coherence.weight,
          details: "",
          compatible: true,
        },
      },
      exclusions: [],
      recommendations: [],
      warnings: [],
    }

    // Ajouter income_distribution pour les colocations
    if (householdType === "colocation") {
      result.breakdown.income_distribution = {
        score: 0,
        max: preferences.criteria.income_distribution.weight,
        details: "",
        compatible: true,
      }
    }

    // 1. Évaluation des revenus
    this.evaluateIncomeRatio(result, applicants, property, preferences, householdType)

    // 2. Évaluation des garants
    this.evaluateGuarantors(result, applicants, property, preferences)

    // 3. Évaluation de la stabilité professionnelle
    this.evaluateProfessionalStability(result, applicants, preferences)

    // 4. Évaluation de la qualité du dossier
    this.evaluateFileQuality(result, application, preferences)

    // 5. Évaluation de la cohérence avec le bien
    this.evaluatePropertyCoherence(result, applicants, property, preferences, householdType)

    // 6. Évaluation de la répartition des revenus (colocation uniquement)
    if (householdType === "colocation") {
      this.evaluateIncomeDistribution(result, applicants, property, preferences)
    }

    // Calcul du score total
    result.totalScore = Math.min(
      100,
      Object.values(result.breakdown).reduce((sum, item) => sum + item.score, 0),
    )

    // Vérification des règles d'exclusion
    this.checkExclusionRules(result, application, preferences)

    // Génération des recommandations
    this.generateRecommendations(result, preferences)

    console.log("📊 Résultat final du calcul:", {
      totalScore: result.totalScore,
      compatible: result.compatible,
      breakdown: Object.entries(result.breakdown).map(([key, value]) => ({
        critere: key,
        score: value.score,
        max: value.max,
      })),
    })

    return result
  },

  // Extraire les candidats du dossier
  extractApplicants(application: any): any[] {
    const applicants = []

    // Candidat principal
    const mainApplicant = {
      type: "main",
      income: application.income || 0,
      contract_type: application.contract_type || "unknown",
      profession: application.profession || "",
      company: application.company || "",
      trial_period: application.trial_period || false,
      seniority_months: application.seniority_months || 0,
      has_guarantor: application.has_guarantor || false,
      guarantor_income: application.guarantor_income || 0,
      guarantor_type: application.guarantor_type || "parent",
    }

    // Enrichir avec les données du rental_file si disponibles
    if (application.rental_file_main_tenant) {
      const mainTenant = application.rental_file_main_tenant
      mainApplicant.income = mainTenant.income_sources?.work_income?.amount || mainApplicant.income
      mainApplicant.contract_type = mainTenant.main_activity || mainApplicant.contract_type
      mainApplicant.profession = mainTenant.profession || mainApplicant.profession
      mainApplicant.company = mainTenant.company || mainApplicant.company
    }

    applicants.push(mainApplicant)

    // Colocataires (si présents)
    if (application.rental_file_guarantors) {
      application.rental_file_guarantors.forEach((cotenant: any, index: number) => {
        applicants.push({
          type: "cotenant",
          index: index,
          income: cotenant.income_sources?.work_income?.amount || 0,
          contract_type: cotenant.main_activity || "unknown",
          profession: cotenant.profession || "",
          company: cotenant.company || "",
          trial_period: cotenant.professional_info?.trial_period || false,
          seniority_months: cotenant.professional_info?.seniority_months || 0,
        })
      })
    }

    return applicants
  },

  // Déterminer le type de foyer
  determineHouseholdType(applicants: any[]): "single" | "couple" | "colocation" {
    if (applicants.length === 1) return "single"
    if (applicants.length === 2) return "couple"
    return "colocation"
  },

  // Évaluation du ratio revenus/loyer
  evaluateIncomeRatio(
    result: ScoringResult,
    applicants: any[],
    property: any,
    preferences: ScoringPreferences,
    householdType: string,
  ) {
    const totalIncome = applicants.reduce((sum, app) => sum + (app.income || 0), 0)
    const rent = property?.price || 0
    const criteria = preferences.criteria.income_ratio

    if (totalIncome === 0 || rent === 0) {
      result.breakdown.income_ratio.details = "Revenus ou loyer non spécifiés"
      result.breakdown.income_ratio.compatible = false
      result.warnings.push("Revenus ou loyer manquants")
      return
    }

    // Option spéciale pour les étudiants : utiliser les revenus du garant
    let effectiveIncome = totalIncome
    const mainApplicant = applicants[0]
    const isStudent =
      (mainApplicant?.contract_type || "").toLowerCase().includes("étudiant") ||
      (mainApplicant?.contract_type || "").toLowerCase().includes("student")

    if (
      isStudent &&
      criteria.use_guarantor_income_for_students &&
      mainApplicant?.has_guarantor &&
      mainApplicant?.guarantor_income > 0
    ) {
      effectiveIncome = mainApplicant.guarantor_income
      console.log("🎓 Étudiant détecté - Utilisation des revenus du garant:", effectiveIncome)
    }

    const globalRatio = effectiveIncome / rent
    result.breakdown.income_ratio.ratio = globalRatio

    // Score basé sur le ratio global
    if (globalRatio >= criteria.thresholds.excellent) {
      result.breakdown.income_ratio.score = criteria.weight
      result.breakdown.income_ratio.details = `Excellent ratio (${globalRatio.toFixed(1)}x)`
    } else if (globalRatio >= criteria.thresholds.good) {
      result.breakdown.income_ratio.score = Math.round(criteria.weight * 0.85)
      result.breakdown.income_ratio.details = `Bon ratio (${globalRatio.toFixed(1)}x)`
    } else if (globalRatio >= criteria.thresholds.acceptable) {
      result.breakdown.income_ratio.score = Math.round(criteria.weight * 0.65)
      result.breakdown.income_ratio.details = `Ratio acceptable (${globalRatio.toFixed(1)}x)`
    } else if (globalRatio >= criteria.thresholds.minimum) {
      result.breakdown.income_ratio.score = Math.round(criteria.weight * 0.4)
      result.breakdown.income_ratio.details = `Ratio faible (${globalRatio.toFixed(1)}x)`
      result.warnings.push(`Ratio revenus/loyer faible: ${globalRatio.toFixed(1)}x`)
    } else {
      result.breakdown.income_ratio.score = Math.round(criteria.weight * 0.2)
      result.breakdown.income_ratio.details = `Ratio insuffisant (${globalRatio.toFixed(1)}x)`
      result.breakdown.income_ratio.compatible = false
      result.warnings.push(`Ratio revenus/loyer insuffisant: ${globalRatio.toFixed(1)}x`)
    }
  },

  // Évaluation des garants
  evaluateGuarantors(result: ScoringResult, applicants: any[], property: any, preferences: ScoringPreferences) {
    const criteria = preferences.criteria.guarantor
    const rent = property?.price || 0
    const mainApplicant = applicants[0]

    const hasGuarantor = mainApplicant?.has_guarantor || false
    const guarantorIncome = mainApplicant?.guarantor_income || 0
    const guarantorCount = hasGuarantor ? 1 : 0

    result.breakdown.guarantor.guarantor_count = guarantorCount

    // Vérifier si des garants sont requis
    const totalIncome = applicants.reduce((sum, app) => sum + (app.income || 0), 0)
    const globalRatio = rent > 0 ? totalIncome / rent : 0
    const guarantorRequired = globalRatio < criteria.required_if_income_below

    if (guarantorRequired && guarantorCount === 0) {
      result.breakdown.guarantor.details = "Garant requis mais absent"
      result.breakdown.guarantor.compatible = false
      result.warnings.push("Garant obligatoire manquant")
      return
    }

    if (guarantorCount === 0) {
      result.breakdown.guarantor.details = "Aucun garant (non requis)"
      result.breakdown.guarantor.score = Math.round(criteria.weight * 0.3)
      return
    }

    // Évaluation du garant
    if (hasGuarantor && guarantorIncome > 0) {
      const guarantorRatio = guarantorIncome / rent
      if (guarantorRatio >= criteria.minimum_income_ratio) {
        result.breakdown.guarantor.score = criteria.weight
        result.breakdown.guarantor.details = `Excellent garant (${guarantorRatio.toFixed(1)}x)`
      } else if (guarantorRatio >= 2.0) {
        result.breakdown.guarantor.score = Math.round(criteria.weight * 0.7)
        result.breakdown.guarantor.details = `Bon garant (${guarantorRatio.toFixed(1)}x)`
      } else {
        result.breakdown.guarantor.score = Math.round(criteria.weight * 0.4)
        result.breakdown.guarantor.details = `Garant limité (${guarantorRatio.toFixed(1)}x)`
        result.warnings.push(`Revenus du garant insuffisants: ${guarantorRatio.toFixed(1)}x`)
      }
    } else {
      result.breakdown.guarantor.score = Math.round(criteria.weight * 0.5)
      result.breakdown.guarantor.details = "Garant présent (revenus non spécifiés)"
    }
  },

  // Évaluation de la stabilité professionnelle
  evaluateProfessionalStability(result: ScoringResult, applicants: any[], preferences: ScoringPreferences) {
    const criteria = preferences.criteria.professional_stability
    const mainApplicant = applicants[0]
    const contractType = (mainApplicant?.contract_type || "unknown").toLowerCase()

    result.breakdown.professional_stability.contract_type = contractType

    // Score de base selon le type de contrat
    let contractScore = 0
    if (contractType.includes("cdi")) {
      contractScore = mainApplicant?.trial_period
        ? criteria.contract_scoring.cdi_trial
        : criteria.contract_scoring.cdi_confirmed
    } else if (contractType.includes("cdd")) {
      contractScore = criteria.contract_scoring.cdd_long // Simplification
    } else if (contractType.includes("freelance") || contractType.includes("indépendant")) {
      contractScore = criteria.contract_scoring.freelance
    } else if (contractType.includes("étudiant") || contractType.includes("student")) {
      contractScore = criteria.contract_scoring.student
    } else if (contractType.includes("retraité") || contractType.includes("retired")) {
      contractScore = criteria.contract_scoring.retired
    } else if (contractType.includes("fonctionnaire")) {
      contractScore = criteria.contract_scoring.civil_servant
    } else {
      contractScore = criteria.contract_scoring.unemployed
    }

    // Bonus ancienneté
    if (
      criteria.seniority_bonus.enabled &&
      (mainApplicant?.seniority_months || 0) >= criteria.seniority_bonus.min_months
    ) {
      contractScore += criteria.seniority_bonus.bonus_points
    }

    // Pénalité période d'essai
    if (mainApplicant?.trial_period) {
      contractScore -= criteria.trial_period_penalty
    }

    contractScore = Math.max(0, Math.min(criteria.weight, contractScore))

    result.breakdown.professional_stability.score = contractScore
    result.breakdown.professional_stability.details = `${contractType} - Score: ${contractScore}/${criteria.weight}`
    result.breakdown.professional_stability.compatible = contractScore >= criteria.weight * 0.5
  },

  // Évaluation de la qualité du dossier
  evaluateFileQuality(result: ScoringResult, application: any, preferences: ScoringPreferences) {
    const criteria = preferences.criteria.file_quality
    let score = 0

    // Vérification des documents complets
    const hasCompleteDocuments = application.documents_complete || false
    if (criteria.complete_documents_required && !hasCompleteDocuments) {
      result.breakdown.file_quality.compatible = false
      result.warnings.push("Dossier incomplet")
    } else if (hasCompleteDocuments) {
      score += criteria.weight * 0.4
    }

    // Vérification des documents vérifiés
    const hasVerifiedDocuments = application.has_verified_documents || false
    if (criteria.verified_documents_required && !hasVerifiedDocuments) {
      result.breakdown.file_quality.compatible = false
      result.warnings.push("Documents non vérifiés")
    } else if (hasVerifiedDocuments) {
      score += criteria.weight * 0.3
    }

    // Qualité de la présentation
    const presentation = application.presentation || application.message || ""
    if (presentation.length > 100) {
      score += criteria.presentation_quality_weight
    } else if (presentation.length > 50) {
      score += criteria.presentation_quality_weight * 0.5
    }

    // Vérification de cohérence
    const hasBasicInfo = application.profession && application.company
    if (hasBasicInfo) {
      score += criteria.coherence_check_weight
    }

    result.breakdown.file_quality.score = Math.min(criteria.weight, Math.round(score))
    result.breakdown.file_quality.details = `Qualité du dossier: ${result.breakdown.file_quality.score}/${criteria.weight}`
  },

  // Évaluation de la cohérence avec le bien
  evaluatePropertyCoherence(
    result: ScoringResult,
    applicants: any[],
    property: any,
    preferences: ScoringPreferences,
    householdType: string,
  ) {
    const criteria = preferences.criteria.property_coherence
    let score = 0

    // Taille du foyer vs logement
    if (criteria.household_size_vs_property && property) {
      const rooms = property.rooms || 1
      const idealOccupants = Math.max(1, rooms - 1)

      if (applicants.length <= idealOccupants) {
        score += criteria.weight * 0.4
      } else if (applicants.length <= idealOccupants + 1) {
        score += criteria.weight * 0.2
      } else {
        result.warnings.push("Logement potentiellement sous-dimensionné")
      }
    } else {
      score += criteria.weight * 0.4
    }

    // Structure de la colocation
    if (criteria.colocation_structure_check && householdType === "colocation") {
      score += criteria.weight * 0.3
    } else if (householdType !== "colocation") {
      score += criteria.weight * 0.3
    }

    // Cohérence situation familiale
    if (criteria.family_situation_coherence) {
      score += criteria.weight * 0.3
    }

    result.breakdown.property_coherence.score = Math.min(criteria.weight, Math.round(score))
    result.breakdown.property_coherence.details = `Cohérence avec le bien: ${result.breakdown.property_coherence.score}/${criteria.weight}`
    result.breakdown.property_coherence.compatible = true
  },

  // Évaluation de la répartition des revenus (colocation)
  evaluateIncomeDistribution(result: ScoringResult, applicants: any[], property: any, preferences: ScoringPreferences) {
    if (!result.breakdown.income_distribution) return

    const criteria = preferences.criteria.income_distribution
    const totalIncome = applicants.reduce((sum, app) => sum + (app.income || 0), 0)
    let score = 0

    if (totalIncome === 0) {
      result.breakdown.income_distribution.details = "Impossible d'évaluer la répartition"
      return
    }

    // Calcul de l'équilibre des revenus
    const incomes = applicants.map((app) => app.income || 0)
    const averageIncome = totalIncome / applicants.length
    const maxDeviation = Math.max(...incomes.map((income) => Math.abs(income - averageIncome)))
    const deviationRatio = maxDeviation / averageIncome

    if (criteria.balance_check) {
      if (deviationRatio <= 0.3) {
        score += criteria.weight * 0.8
      } else if (deviationRatio <= 0.5) {
        score += criteria.weight * 0.6
      } else if (deviationRatio <= 0.7) {
        score += criteria.weight * 0.4
      } else {
        score += criteria.weight * 0.2
        if (!criteria.compensation_allowed) {
          result.warnings.push("Déséquilibre important des revenus en colocation")
        }
      }
    } else {
      score += criteria.weight * 0.8
    }

    result.breakdown.income_distribution.score = Math.min(criteria.weight, Math.round(score))
    result.breakdown.income_distribution.details = `Répartition des revenus: écart max ${(deviationRatio * 100).toFixed(0)}%`
    result.breakdown.income_distribution.compatible = score >= criteria.weight * 0.4
  },

  // Vérification des règles d'exclusion
  checkExclusionRules(result: ScoringResult, application: any, preferences: ScoringPreferences) {
    const rules = preferences.exclusion_rules

    // Dossier incomplet
    if (rules.incomplete_file && !application.documents_complete) {
      result.exclusions.push("Dossier incomplet")
      result.compatible = false
      result.totalScore = Math.min(result.totalScore, 30)
    }

    // Garant manquant quand requis
    if (rules.no_guarantor_when_required && !result.breakdown.guarantor.compatible) {
      result.exclusions.push("Garant requis mais absent ou insuffisant")
      result.compatible = false
      result.totalScore = Math.min(result.totalScore, 35)
    }

    // Ratio revenus/loyer < 2
    if (
      rules.income_ratio_below_2 &&
      result.breakdown.income_ratio.ratio &&
      result.breakdown.income_ratio.ratio < 2.0
    ) {
      result.exclusions.push("Ratio revenus/loyer inférieur à 2")
      result.compatible = false
      result.totalScore = Math.min(result.totalScore, 25)
    }

    // Documents non vérifiés
    if (rules.unverified_documents && !application.has_verified_documents) {
      result.exclusions.push("Documents non vérifiés")
      result.compatible = false
      result.totalScore = Math.min(result.totalScore, 40)
    }

    // Incohérence manifeste
    if (rules.manifest_incoherence) {
      if (application.income && application.income < 0) {
        result.exclusions.push("Incohérence dans les revenus déclarés")
        result.compatible = false
        result.totalScore = Math.min(result.totalScore, 20)
      }
    }
  },

  // Génération des recommandations
  generateRecommendations(result: ScoringResult, preferences: ScoringPreferences) {
    if (result.totalScore >= 80) {
      result.recommendations.push("Excellent dossier, candidature fortement recommandée")
    } else if (result.totalScore >= 60) {
      result.recommendations.push("Bon dossier, candidature recommandée")
    } else if (result.totalScore >= 40) {
      result.recommendations.push("Dossier acceptable avec quelques réserves")
    } else {
      result.recommendations.push("Dossier fragile, à examiner avec attention")
    }

    // Recommandations spécifiques
    if (result.breakdown.income_ratio.score < result.breakdown.income_ratio.max * 0.6) {
      result.recommendations.push("Demander un garant supplémentaire ou une caution")
    }

    if (result.breakdown.professional_stability.score < result.breakdown.professional_stability.max * 0.6) {
      result.recommendations.push("Vérifier la stabilité de l'emploi et demander des justificatifs récents")
    }

    if (result.breakdown.file_quality.score < result.breakdown.file_quality.max * 0.6) {
      result.recommendations.push("Demander des documents complémentaires")
    }
  },

  // Résultat par défaut en cas d'erreur
  getDefaultResult(modelName: string): ScoringResult {
    return {
      totalScore: 0,
      compatible: false,
      model_used: modelName,
      model_version: 1,
      household_type: "single",
      breakdown: {
        income_ratio: { score: 0, max: 20, details: "Données manquantes", compatible: false },
        guarantor: { score: 0, max: 20, details: "Données manquantes", compatible: false },
        professional_stability: { score: 0, max: 20, details: "Données manquantes", compatible: false },
        file_quality: { score: 0, max: 20, details: "Données manquantes", compatible: false },
        property_coherence: { score: 0, max: 20, details: "Données manquantes", compatible: false },
      },
      exclusions: ["Données insuffisantes pour l'évaluation"],
      recommendations: ["Vérifier les données de la candidature"],
      warnings: ["Impossible de calculer le score"],
    }
  },

  // Invalider le cache
  invalidateCache(ownerId: string): void {
    preferencesCache.invalidate(ownerId)
    scoreCache.invalidateForOwner(ownerId)
  },

  // Calculer le score personnalisé (pour compatibilité)
  calculateCustomScore(application: any, property: any, preferences: ScoringPreferences): ScoringResult {
    return this.performScoreCalculation(application, property, preferences)
  },
}
