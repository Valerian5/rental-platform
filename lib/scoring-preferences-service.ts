// Interface pour les critères de scoring (nouvelle structure basée sur le prompt)
export interface ScoringCriteria {
  income_ratio: {
    weight: number // 0-20 points
    thresholds: {
      excellent: number // >= 3.5x
      good: number // >= 3x
      acceptable: number // >= 2.5x
      minimum: number // >= 2x
    }
    per_person_check: boolean // Vérifier le ratio par personne en colocation
  }
  guarantor: {
    weight: number // 0-20 points
    required_if_income_below: number // Seuil en dessous duquel garant obligatoire
    types_accepted: {
      parent: boolean
      visale: boolean
      garantme: boolean
      other_physical: boolean
      company: boolean
    }
    minimum_income_ratio: number // Garant doit avoir >= 3x la part couverte
    verification_required: boolean
  }
  professional_stability: {
    weight: number // 0-20 points
    contract_scoring: {
      cdi_confirmed: number // CDI hors période d'essai
      cdi_trial: number // CDI en période d'essai
      cdd_long: number // CDD > 6 mois
      cdd_short: number // CDD < 6 mois
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
    compensation_allowed: boolean // Déséquilibres compensés si groupe solide
  }
}

export interface ScoringModel {
  id: string
  name: string
  description: string
  criteria: ScoringCriteria
  exclusion_rules: {
    incomplete_file: boolean
    no_guarantor_when_required: boolean
    income_ratio_below_2: boolean
    unverified_documents: boolean
    manifest_incoherence: boolean
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
  version?: number // Nouveau : versioning des préférences
}

// Interface pour le résultat du calcul de score
export interface ScoringResult {
  totalScore: number
  compatible: boolean
  model_used: string
  model_version?: number // Nouveau : version du modèle utilisé
  calculated_at?: string // Nouveau : timestamp du calcul
  breakdown: {
    income_ratio: {
      score: number
      max: number
      details: string
      compatible: boolean
      per_person_details?: string[]
    }
    guarantor: {
      score: number
      max: number
      details: string
      compatible: boolean
      guarantor_analysis?: Array<{
        type: string
        income_ratio: number
        verified: boolean
        score: number
      }>
    }
    professional_stability: {
      score: number
      max: number
      details: string
      compatible: boolean
      individual_analysis?: Array<{
        person: string
        contract_type: string
        trial_period: boolean
        seniority: string
        score: number
      }>
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

// Cache pour les préférences de scoring
class ScoringPreferencesCache {
  private cache = new Map<string, { preferences: ScoringPreferences; timestamp: number; version: number }>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  private listeners = new Map<string, Set<(preferences: ScoringPreferences) => void>>()

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
    const version = (preferences.version || 0) + 1
    const versionedPreferences = { ...preferences, version }

    this.cache.set(ownerId, {
      preferences: versionedPreferences,
      timestamp: Date.now(),
      version,
    })

    // Notifier les listeners
    this.notifyListeners(ownerId, versionedPreferences)
  }

  invalidate(ownerId: string): void {
    this.cache.delete(ownerId)
  }

  subscribe(ownerId: string, callback: (preferences: ScoringPreferences) => void): () => void {
    if (!this.listeners.has(ownerId)) {
      this.listeners.set(ownerId, new Set())
    }
    this.listeners.get(ownerId)!.add(callback)

    // Retourner une fonction de désabonnement
    return () => {
      const ownerListeners = this.listeners.get(ownerId)
      if (ownerListeners) {
        ownerListeners.delete(callback)
        if (ownerListeners.size === 0) {
          this.listeners.delete(ownerId)
        }
      }
    }
  }

  private notifyListeners(ownerId: string, preferences: ScoringPreferences): void {
    const ownerListeners = this.listeners.get(ownerId)
    if (ownerListeners) {
      ownerListeners.forEach((callback) => {
        try {
          callback(preferences)
        } catch (error) {
          console.error("Erreur lors de la notification du listener:", error)
        }
      })
    }
  }

  getVersion(ownerId: string): number {
    const cached = this.cache.get(ownerId)
    return cached?.version || 0
  }
}

// Cache pour les scores calculés
class ScoreCache {
  private cache = new Map<string, { result: ScoringResult; timestamp: number }>()
  private readonly CACHE_TTL = 2 * 60 * 1000 // 2 minutes

  private getKey(applicationId: string, preferencesVersion: number): string {
    return `${applicationId}-${preferencesVersion}`
  }

  get(applicationId: string, preferencesVersion: number): ScoringResult | null {
    const key = this.getKey(applicationId, preferencesVersion)
    const cached = this.cache.get(key)
    if (!cached) return null

    const now = Date.now()
    if (now - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key)
      return null
    }

    return cached.result
  }

  set(applicationId: string, preferencesVersion: number, result: ScoringResult): void {
    const key = this.getKey(applicationId, preferencesVersion)
    this.cache.set(key, {
      result: { ...result, calculated_at: new Date().toISOString() },
      timestamp: Date.now(),
    })
  }

  invalidateForOwner(ownerId: string): void {
    // Invalider tous les scores pour un propriétaire (quand ses préférences changent)
    const keysToDelete: string[] = []
    for (const [key] of this.cache) {
      // On ne peut pas facilement identifier l'owner depuis la clé, donc on invalide tout
      // Dans une vraie implémentation, on pourrait stocker une map owner -> keys
      keysToDelete.push(key)
    }
    keysToDelete.forEach((key) => this.cache.delete(key))
  }

  clear(): void {
    this.cache.clear()
  }
}

// Instances globales des caches
const preferencesCache = new ScoringPreferencesCache()
const scoreCache = new ScoreCache()

export const scoringPreferencesService = {
  // Cache instances (pour les tests et le debugging)
  _preferencesCache: preferencesCache,
  _scoreCache: scoreCache,

  // Modèles prédéfinis
  getStrictModel(): ScoringModel {
    return {
      id: "strict",
      name: "Strict (GLI)",
      description: "Critères stricts inspirés des assurances GLI",
      criteria: {
        income_ratio: {
          weight: 20,
          thresholds: { excellent: 4.0, good: 3.5, acceptable: 3.0, minimum: 2.5 },
          per_person_check: true,
        },
        guarantor: {
          weight: 20,
          required_if_income_below: 3.5,
          types_accepted: { parent: true, visale: true, garantme: true, other_physical: true, company: true },
          minimum_income_ratio: 3.0,
          verification_required: true,
        },
        professional_stability: {
          weight: 20,
          contract_scoring: {
            cdi_confirmed: 20,
            cdi_trial: 10,
            cdd_long: 15,
            cdd_short: 8,
            freelance: 5,
            student: 3,
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

  getStandardModel(): ScoringModel {
    return {
      id: "standard",
      name: "Standard (Agence)",
      description: "Pratiques standards d'agence immobilière",
      criteria: {
        income_ratio: {
          weight: 18,
          thresholds: { excellent: 3.5, good: 3.0, acceptable: 2.5, minimum: 2.0 },
          per_person_check: true,
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
            cdi_trial: 12,
            cdd_long: 14,
            cdd_short: 10,
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

  getFlexibleModel(): ScoringModel {
    return {
      id: "flexible",
      name: "Souple (Particulier)",
      description: "Approche humaine et flexible pour particuliers",
      criteria: {
        income_ratio: {
          weight: 15,
          thresholds: { excellent: 3.0, good: 2.5, acceptable: 2.0, minimum: 1.8 },
          per_person_check: false,
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
            student: 10,
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

  // Obtenir les préférences par défaut pour un propriétaire
  getDefaultPreferences(ownerId: string): ScoringPreferences {
    const standardModel = this.getStandardModel()
    return {
      owner_id: ownerId,
      name: "Préférences par défaut",
      is_default: true,
      model_type: "standard",
      criteria: standardModel.criteria,
      exclusion_rules: standardModel.exclusion_rules,
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
          console.log("🎯 Préférences chargées et mises en cache:", preferences.name)
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

  // Souscrire aux changements de préférences
  subscribeToPreferencesChanges(ownerId: string, callback: (preferences: ScoringPreferences) => void): () => void {
    return preferencesCache.subscribe(ownerId, callback)
  },

  // Invalider le cache des préférences
  invalidatePreferencesCache(ownerId: string): void {
    preferencesCache.invalidate(ownerId)
    scoreCache.invalidateForOwner(ownerId)
  },

  // Calculer le score avec cache
  async calculateScoreWithCache(
    application: any,
    property: any,
    ownerId: string,
    useCache = true,
  ): Promise<ScoringResult> {
    const preferences = await this.getOwnerPreferences(ownerId, useCache)
    const preferencesVersion = preferences.version || 1

    if (useCache) {
      const cachedScore = scoreCache.get(application.id, preferencesVersion)
      if (cachedScore) {
        console.log("📊 Score récupéré depuis le cache:", cachedScore.totalScore)
        return cachedScore
      }
    }

    const result = this.calculateScore(application, property, preferences)
    result.model_version = preferencesVersion

    if (useCache) {
      scoreCache.set(application.id, preferencesVersion, result)
    }

    console.log("📊 Score calculé et mis en cache:", result.totalScore)
    return result
  },

  // Calculer le score selon les préférences du propriétaire
  calculateScore(application: any, property: any, preferences: ScoringPreferences): ScoringResult {
    console.log("🎯 Calcul score avec modèle:", preferences.model_type, preferences.name)

    // Vérifier que les données nécessaires sont présentes
    if (!application || !property) {
      console.error("❌ Données manquantes pour le calcul de score")
      return this.getDefaultResult(preferences.name)
    }

    // Déterminer le type de foyer
    const applicants = this.extractApplicants(application)
    const householdType = this.determineHouseholdType(applicants)

    console.log("👥 Type de foyer détecté:", householdType, "- Candidats:", applicants.length)

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

    console.log("📊 Score final:", result.totalScore, "- Compatible:", result.compatible)
    return result
  },

  // Recalculer les scores pour plusieurs candidatures (optimisé)
  async recalculateScoresForApplications(
    applications: any[],
    ownerId: string,
    forceRecalculation = false,
  ): Promise<Map<string, ScoringResult>> {
    const results = new Map<string, ScoringResult>()
    const preferences = await this.getOwnerPreferences(ownerId, !forceRecalculation)

    console.log(`🔄 Recalcul de ${applications.length} scores avec le modèle:`, preferences.name)

    // Traitement par batch pour optimiser les performances
    const batchSize = 50
    const batches = []
    for (let i = 0; i < applications.length; i += batchSize) {
      batches.push(applications.slice(i, i + batchSize))
    }

    for (const batch of batches) {
      const batchPromises = batch.map(async (application) => {
        try {
          const result = await this.calculateScoreWithCache(
            application,
            application.property,
            ownerId,
            !forceRecalculation,
          )
          results.set(application.id, result)
        } catch (error) {
          console.error(`❌ Erreur calcul score pour candidature ${application.id}:`, error)
          results.set(application.id, this.getDefaultResult(preferences.name))
        }
      })

      await Promise.all(batchPromises)
    }

    console.log(`✅ ${results.size} scores recalculés`)
    return results
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

  // Extraire les candidats du dossier
  extractApplicants(application: any): any[] {
    const applicants = []

    // Candidat principal - avec des valeurs par défaut sécurisées
    applicants.push({
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
    })

    // Colocataires (si présents dans rental_file)
    if (application.rental_file?.cotenants) {
      application.rental_file.cotenants.forEach((cotenant: any, index: number) => {
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
    if (applicants.length === 2) return "couple" // Peut être affiné selon la relation
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

    if (totalIncome === 0 || rent === 0) {
      result.breakdown.income_ratio.details = "Revenus ou loyer non spécifiés"
      result.breakdown.income_ratio.compatible = false
      result.warnings.push("Revenus ou loyer manquants")
      return
    }

    const globalRatio = totalIncome / rent
    const criteria = preferences.criteria.income_ratio

    // Score basé sur le ratio global
    if (globalRatio >= criteria.thresholds.excellent) {
      result.breakdown.income_ratio.score = criteria.weight
      result.breakdown.income_ratio.details = `Excellent ratio global (${globalRatio.toFixed(1)}x)`
    } else if (globalRatio >= criteria.thresholds.good) {
      result.breakdown.income_ratio.score = Math.round(criteria.weight * 0.85)
      result.breakdown.income_ratio.details = `Bon ratio global (${globalRatio.toFixed(1)}x)`
    } else if (globalRatio >= criteria.thresholds.acceptable) {
      result.breakdown.income_ratio.score = Math.round(criteria.weight * 0.65)
      result.breakdown.income_ratio.details = `Ratio global acceptable (${globalRatio.toFixed(1)}x)`
    } else if (globalRatio >= criteria.thresholds.minimum) {
      result.breakdown.income_ratio.score = Math.round(criteria.weight * 0.4)
      result.breakdown.income_ratio.details = `Ratio global faible (${globalRatio.toFixed(1)}x)`
      result.warnings.push(`Ratio revenus/loyer faible: ${globalRatio.toFixed(1)}x`)
    } else {
      result.breakdown.income_ratio.score = Math.round(criteria.weight * 0.2)
      result.breakdown.income_ratio.details = `Ratio global insuffisant (${globalRatio.toFixed(1)}x)`
      result.breakdown.income_ratio.compatible = false
      result.warnings.push(`Ratio revenus/loyer insuffisant: ${globalRatio.toFixed(1)}x`)
    }

    // Vérification par personne en colocation si activée
    if (criteria.per_person_check && householdType === "colocation") {
      const perPersonDetails: string[] = []
      const rentPerPerson = rent / applicants.length

      applicants.forEach((applicant, index) => {
        const personalRatio = (applicant.income || 0) / rentPerPerson
        perPersonDetails.push(`Candidat ${index + 1}: ${personalRatio.toFixed(1)}x sa part`)

        if (personalRatio < criteria.thresholds.minimum) {
          result.warnings.push(`Candidat ${index + 1}: ratio personnel insuffisant (${personalRatio.toFixed(1)}x)`)
        }
      })

      result.breakdown.income_ratio.per_person_details = perPersonDetails
    }
  },

  // Évaluation des garants
  evaluateGuarantors(result: ScoringResult, applicants: any[], property: any, preferences: ScoringPreferences) {
    const criteria = preferences.criteria.guarantor
    const rent = property?.price || 0
    let guarantorScore = 0
    const guarantorAnalysis: any[] = []

    // Vérifier si des garants sont requis
    const totalIncome = applicants.reduce((sum, app) => sum + (app.income || 0), 0)
    const globalRatio = rent > 0 ? totalIncome / rent : 0
    const guarantorRequired = globalRatio < criteria.required_if_income_below

    // Compter les garants disponibles
    const mainApplicantHasGuarantor = applicants[0]?.has_guarantor || false
    const guarantorCount = mainApplicantHasGuarantor ? 1 : 0

    if (guarantorRequired && guarantorCount === 0) {
      result.breakdown.guarantor.details = "Garant requis mais absent"
      result.breakdown.guarantor.compatible = false
      result.warnings.push("Garant obligatoire manquant")
      return
    }

    if (guarantorCount === 0) {
      result.breakdown.guarantor.details = "Aucun garant (non requis)"
      result.breakdown.guarantor.score = Math.round(criteria.weight * 0.3) // Score partiel
      return
    }

    // Évaluation du garant principal
    if (mainApplicantHasGuarantor) {
      const guarantorIncome = applicants[0].guarantor_income || 0
      const guarantorType = applicants[0].guarantor_type || "parent"
      const guarantorRatio = rent > 0 ? guarantorIncome / rent : 0

      let guarantorTypeScore = 0
      if (criteria.types_accepted[guarantorType as keyof typeof criteria.types_accepted]) {
        guarantorTypeScore = criteria.weight * 0.3
      }

      let incomeScore = 0
      if (guarantorRatio >= criteria.minimum_income_ratio) {
        incomeScore = criteria.weight * 0.7
      } else if (guarantorRatio >= 2.0) {
        incomeScore = criteria.weight * 0.4
      } else {
        incomeScore = criteria.weight * 0.1
        result.warnings.push(`Revenus du garant insuffisants: ${guarantorRatio.toFixed(1)}x`)
      }

      guarantorScore = guarantorTypeScore + incomeScore

      guarantorAnalysis.push({
        type: guarantorType,
        income_ratio: guarantorRatio,
        verified: true, // À déterminer selon les données
        score: guarantorScore,
      })
    }

    result.breakdown.guarantor.score = Math.min(criteria.weight, guarantorScore)
    result.breakdown.guarantor.details = `${guarantorCount} garant(s) - Score: ${result.breakdown.guarantor.score}/${criteria.weight}`
    result.breakdown.guarantor.guarantor_analysis = guarantorAnalysis
    result.breakdown.guarantor.compatible = guarantorScore >= criteria.weight * 0.5
  },

  // Évaluation de la stabilité professionnelle
  evaluateProfessionalStability(result: ScoringResult, applicants: any[], preferences: ScoringPreferences) {
    const criteria = preferences.criteria.professional_stability
    let totalScore = 0
    const individualAnalysis: any[] = []

    applicants.forEach((applicant, index) => {
      const contractType = (applicant.contract_type || "unknown").toLowerCase()
      const trialPeriod = applicant.trial_period || false
      const seniorityMonths = applicant.seniority_months || 0

      // Score de base selon le type de contrat
      let contractScore = 0
      if (contractType.includes("cdi")) {
        contractScore = trialPeriod ? criteria.contract_scoring.cdi_trial : criteria.contract_scoring.cdi_confirmed
      } else if (contractType.includes("cdd")) {
        contractScore = criteria.contract_scoring.cdd_long // Simplification, à affiner selon la durée
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
      if (criteria.seniority_bonus.enabled && seniorityMonths >= criteria.seniority_bonus.min_months) {
        contractScore += criteria.seniority_bonus.bonus_points
      }

      // Pénalité période d'essai
      if (trialPeriod) {
        contractScore -= criteria.trial_period_penalty
      }

      contractScore = Math.max(0, contractScore)
      totalScore += contractScore

      individualAnalysis.push({
        person: applicant.type === "main" ? "Candidat principal" : `Colocataire ${applicant.index + 1}`,
        contract_type: contractType,
        trial_period: trialPeriod,
        seniority: seniorityMonths > 0 ? `${seniorityMonths} mois` : "Non spécifié",
        score: contractScore,
      })
    })

    // Score moyen pondéré
    const averageScore = applicants.length > 0 ? totalScore / applicants.length : 0
    const finalScore = Math.min(criteria.weight, Math.round((averageScore / 20) * criteria.weight))

    result.breakdown.professional_stability.score = finalScore
    result.breakdown.professional_stability.details = `Stabilité moyenne: ${finalScore}/${criteria.weight}`
    result.breakdown.professional_stability.individual_analysis = individualAnalysis
    result.breakdown.professional_stability.compatible = finalScore >= criteria.weight * 0.5
  },

  // Évaluation de la qualité du dossier
  evaluateFileQuality(result: ScoringResult, application: any, preferences: ScoringPreferences) {
    const criteria = preferences.criteria.file_quality
    let score = 0

    // Vérification des documents complets
    const hasCompleteDocuments = application.file_complete || false
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
      const idealOccupants = Math.max(1, rooms - 1) // Règle approximative

      if (applicants.length <= idealOccupants) {
        score += criteria.weight * 0.4
      } else if (applicants.length <= idealOccupants + 1) {
        score += criteria.weight * 0.2
      } else {
        result.warnings.push("Logement potentiellement sous-dimensionné")
      }
    } else {
      score += criteria.weight * 0.4 // Score par défaut si pas de vérification
    }

    // Structure de la colocation
    if (criteria.colocation_structure_check && householdType === "colocation") {
      // Vérification basique - à améliorer selon les données disponibles
      score += criteria.weight * 0.3
    } else if (householdType !== "colocation") {
      score += criteria.weight * 0.3 // Score par défaut pour non-colocation
    }

    // Cohérence situation familiale
    if (criteria.family_situation_coherence) {
      score += criteria.weight * 0.3 // Score par défaut - à améliorer
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
        // Écart <= 30%
        score += criteria.weight * 0.8
      } else if (deviationRatio <= 0.5) {
        // Écart <= 50%
        score += criteria.weight * 0.6
      } else if (deviationRatio <= 0.7) {
        // Écart <= 70%
        score += criteria.weight * 0.4
      } else {
        score += criteria.weight * 0.2
        if (!criteria.compensation_allowed) {
          result.warnings.push("Déséquilibre important des revenus en colocation")
        }
      }
    } else {
      score += criteria.weight * 0.8 // Score par défaut si pas de vérification
    }

    // Compensation par garants ou revenus élevés
    if (criteria.compensation_allowed && deviationRatio > 0.5) {
      const hasStrongGuarantor = applicants.some((app) => app.has_guarantor && app.guarantor_income > 0)
      const hasHighIncome = incomes.some((income) => income > averageIncome * 1.5)

      if (hasStrongGuarantor || hasHighIncome) {
        score += criteria.weight * 0.2
      }
    }

    result.breakdown.income_distribution.score = Math.min(criteria.weight, Math.round(score))
    result.breakdown.income_distribution.details = `Répartition des revenus: écart max ${(deviationRatio * 100).toFixed(0)}%`
    result.breakdown.income_distribution.compatible = score >= criteria.weight * 0.4
  },

  // Vérification des règles d'exclusion
  checkExclusionRules(result: ScoringResult, application: any, preferences: ScoringPreferences) {
    const rules = preferences.exclusion_rules

    // Dossier incomplet
    if (rules.incomplete_file && !application.file_complete) {
      result.exclusions.push("Dossier incomplet")
      result.compatible = false
    }

    // Garant manquant quand requis
    if (rules.no_guarantor_when_required && !result.breakdown.guarantor.compatible) {
      result.exclusions.push("Garant requis mais absent ou insuffisant")
      result.compatible = false
    }

    // Ratio revenus/loyer < 2
    if (rules.income_ratio_below_2 && !result.breakdown.income_ratio.compatible) {
      const totalIncome = application.income || 0
      const rent = application.property?.price || 0
      if (rent > 0 && totalIncome / rent < 2.0) {
        result.exclusions.push("Ratio revenus/loyer inférieur à 2")
        result.compatible = false
      }
    }

    // Documents non vérifiés
    if (rules.unverified_documents && !application.has_verified_documents) {
      result.exclusions.push("Documents non vérifiés")
      result.compatible = false
    }

    // Incohérence manifeste
    if (rules.manifest_incoherence) {
      // Vérifications basiques d'incohérence
      if (application.income && application.income < 0) {
        result.exclusions.push("Incohérence dans les revenus déclarés")
        result.compatible = false
      }
    }

    // Si des exclusions sont présentes, marquer comme incompatible
    if (result.exclusions.length > 0) {
      result.compatible = false
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

    // Recommandations spécifiques selon les faiblesses
    if (result.breakdown.income_ratio.score < result.breakdown.income_ratio.max * 0.6) {
      result.recommendations.push("Demander un garant supplémentaire ou une caution")
    }

    if (result.breakdown.professional_stability.score < result.breakdown.professional_stability.max * 0.6) {
      result.recommendations.push("Vérifier la stabilité de l'emploi et demander des justificatifs récents")
    }

    if (result.breakdown.file_quality.score < result.breakdown.file_quality.max * 0.6) {
      result.recommendations.push("Demander des documents complémentaires")
    }

    if (result.household_type === "colocation" && result.breakdown.income_distribution) {
      if (result.breakdown.income_distribution.score < result.breakdown.income_distribution.max * 0.6) {
        result.recommendations.push("Attention au déséquilibre des revenus en colocation")
      }
    }
  },

  // Valider les préférences
  validatePreferences(preferences: ScoringPreferences): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!preferences.criteria) {
      errors.push("Critères manquants")
      return { valid: false, errors }
    }

    const totalWeight =
      preferences.criteria.income_ratio.weight +
      preferences.criteria.guarantor.weight +
      preferences.criteria.professional_stability.weight +
      preferences.criteria.file_quality.weight +
      preferences.criteria.property_coherence.weight +
      (preferences.criteria.income_distribution?.weight || 0)

    if (totalWeight > 100) {
      errors.push(`Le total des poids ne peut pas dépasser 100 (actuellement: ${totalWeight})`)
    }

    // Vérifier que chaque poids est entre 0 et 20
    const weights = [
      preferences.criteria.income_ratio.weight,
      preferences.criteria.guarantor.weight,
      preferences.criteria.professional_stability.weight,
      preferences.criteria.file_quality.weight,
      preferences.criteria.property_coherence.weight,
    ]

    weights.forEach((weight, index) => {
      if (weight < 0 || weight > 20) {
        errors.push(`Le poids du critère ${index + 1} doit être entre 0 et 20`)
      }
    })

    return { valid: errors.length === 0, errors }
  },

  // Obtenir les préférences par défaut d'un propriétaire (pour compatibilité)
  async getOwnerDefaultPreference(ownerId: string): Promise<ScoringPreferences | null> {
    try {
      return await this.getOwnerPreferences(ownerId, true)
    } catch (error) {
      console.error("Erreur récupération préférences:", error)
      return null
    }
  },
}
