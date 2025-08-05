// Event Bus centralisé pour la synchronisation des scores en temps réel
type EventType = "preferences-updated" | "score-calculated" | "score-invalidated"

interface ScoringEvent {
  type: EventType
  ownerId: string
  data: any
  timestamp: number
}

interface ScoreCache {
  [applicationId: string]: {
    score: number
    timestamp: number
    preferencesVersion: number
    propertyPrice: number
  }
}

interface PreferencesCache {
  [ownerId: string]: {
    preferences: any
    timestamp: number
    version: number
  }
}

class ScoringEventBus {
  private listeners: Map<EventType, Set<(event: ScoringEvent) => void>> = new Map()
  private scoreCache: ScoreCache = {}
  private preferencesCache: PreferencesCache = {}
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map()

  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly DEBOUNCE_DELAY = 300 // 300ms

  constructor() {
    // Nettoyer le cache périodiquement
    setInterval(() => this.cleanupCache(), 60000) // Chaque minute
  }

  // Souscrire aux événements
  subscribe(eventType: EventType, callback: (event: ScoringEvent) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }

    this.listeners.get(eventType)!.add(callback)

    return () => {
      this.listeners.get(eventType)?.delete(callback)
    }
  }

  // Émettre un événement
  private emit(eventType: EventType, ownerId: string, data: any) {
    const event: ScoringEvent = {
      type: eventType,
      ownerId,
      data,
      timestamp: Date.now(),
    }

    const listeners = this.listeners.get(eventType)
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(event)
        } catch (error) {
          console.error("Erreur dans le listener:", error)
        }
      })
    }
  }

  // Mettre à jour les préférences et déclencher le recalcul
  updatePreferences(ownerId: string, preferences: any) {
    const version = (this.preferencesCache[ownerId]?.version || 0) + 1

    this.preferencesCache[ownerId] = {
      preferences,
      timestamp: Date.now(),
      version,
    }

    // Invalider tous les scores pour ce propriétaire
    this.invalidateScoresForOwner(ownerId)

    // Émettre l'événement avec debounce
    this.debounceEmit("preferences-updated", ownerId, { preferences, version })
  }

  // Obtenir les préférences depuis le cache
  getPreferences(ownerId: string): any | null {
    const cached = this.preferencesCache[ownerId]
    if (!cached) return null

    const now = Date.now()
    if (now - cached.timestamp > this.CACHE_TTL) {
      delete this.preferencesCache[ownerId]
      return null
    }

    return cached.preferences
  }

  // Calculer le score avec cache intelligent
  async calculateScore(applicationId: string, applicationData: any, property: any, ownerId: string): Promise<number> {
    const cacheKey = `${applicationId}-${property.price}`
    const preferencesVersion = this.preferencesCache[ownerId]?.version || 0

    // Vérifier le cache
    const cached = this.scoreCache[cacheKey]
    if (
      cached &&
      cached.preferencesVersion === preferencesVersion &&
      cached.propertyPrice === property.price &&
      Date.now() - cached.timestamp < this.CACHE_TTL
    ) {
      return cached.score
    }

    // Calculer le nouveau score
    const score = await this.performScoreCalculation(applicationData, property, ownerId)

    // Mettre en cache
    this.scoreCache[cacheKey] = {
      score,
      timestamp: Date.now(),
      preferencesVersion,
      propertyPrice: property.price,
    }

    // Émettre l'événement
    this.emit("score-calculated", ownerId, { applicationId, score })

    return score
  }

  // Calcul de score amélioré et cohérent
  private async performScoreCalculation(applicationData: any, property: any, ownerId: string): Promise<number> {
    const preferences = this.getPreferences(ownerId)
    if (!preferences) {
      // Fallback vers l'API si pas de cache
      try {
        const response = await fetch(`/api/scoring-preferences?owner_id=${ownerId}&default_only=true`)
        if (response.ok) {
          const data = await response.json()
          if (data.preferences?.[0]) {
            return this.calculateScoreWithPreferences(applicationData, property, data.preferences[0])
          }
        }
      } catch (error) {
        console.error("Erreur récupération préférences:", error)
      }
      return 50 // Score par défaut
    }

    return this.calculateScoreWithPreferences(applicationData, property, preferences)
  }

  // Algorithme de scoring amélioré
  private calculateScoreWithPreferences(applicationData: any, property: any, preferences: any): number {
    let totalScore = 0
    const rent = property.price || 0

    if (rent === 0) return 0

    // 1. Ratio revenus/loyer (logique inversée pour cohérence)
    const income = applicationData.income || 0
    const guarantorIncome = applicationData.guarantor_income || 0

    // Pour les étudiants, possibilité d'utiliser les revenus du garant comme revenus principaux
    const effectiveIncome = this.getEffectiveIncome(applicationData, income, guarantorIncome, preferences)
    const ratio = effectiveIncome / rent

    const incomeWeight = preferences.criteria?.income_ratio?.weight || 18
    const thresholds = preferences.criteria?.income_ratio?.thresholds || {
      excellent: 3.5,
      good: 3.0,
      acceptable: 2.5,
      minimum: 2.0,
    }

    let incomeScore = 0
    if (ratio >= thresholds.excellent) {
      incomeScore = incomeWeight
    } else if (ratio >= thresholds.good) {
      incomeScore = incomeWeight * 0.85
    } else if (ratio >= thresholds.acceptable) {
      incomeScore = incomeWeight * 0.65
    } else if (ratio >= thresholds.minimum) {
      incomeScore = incomeWeight * 0.4
    } else {
      incomeScore = incomeWeight * 0.2
    }

    totalScore += incomeScore

    // 2. Garants (scoring amélioré)
    const guarantorWeight = preferences.criteria?.guarantor?.weight || 17
    const hasGuarantor = applicationData.has_guarantor || false
    const requiredRatio = preferences.criteria?.guarantor?.required_if_income_below || 3.0

    let guarantorScore = 0
    if (hasGuarantor && guarantorIncome > 0) {
      const guarantorRatio = guarantorIncome / rent
      const minGuarantorRatio = preferences.criteria?.guarantor?.minimum_income_ratio || 3.0

      if (guarantorRatio >= minGuarantorRatio) {
        guarantorScore = guarantorWeight
      } else if (guarantorRatio >= 2.0) {
        guarantorScore = guarantorWeight * 0.7
      } else {
        guarantorScore = guarantorWeight * 0.4
      }
    } else if (ratio >= requiredRatio) {
      // Pas de garant mais revenus suffisants
      guarantorScore = guarantorWeight * 0.6
    } else {
      // Pas de garant et revenus insuffisants
      guarantorScore = 0
    }

    totalScore += guarantorScore

    // 3. Stabilité professionnelle (scoring différencié selon le modèle)
    const stabilityWeight = preferences.criteria?.professional_stability?.weight || 17
    const contractType = (applicationData.contract_type || "unknown").toLowerCase()

    let stabilityScore = 0
    const contractScoring = this.getContractScoring(preferences.model_type || "standard")

    if (contractType.includes("cdi")) {
      stabilityScore = contractScoring.cdi * stabilityWeight
    } else if (contractType.includes("cdd")) {
      stabilityScore = contractScoring.cdd * stabilityWeight
    } else if (contractType.includes("freelance") || contractType.includes("indépendant")) {
      stabilityScore = contractScoring.freelance * stabilityWeight
    } else if (contractType.includes("étudiant") || contractType.includes("student")) {
      stabilityScore = contractScoring.student * stabilityWeight
    } else if (contractType.includes("retraité")) {
      stabilityScore = contractScoring.retired * stabilityWeight
    } else {
      stabilityScore = contractScoring.other * stabilityWeight
    }

    // Bonus/malus selon les préférences
    if (applicationData.trial_period && preferences.criteria?.professional_stability?.trial_period_penalty) {
      stabilityScore *= 0.8
    }

    totalScore += stabilityScore

    // 4. Qualité du dossier
    const fileWeight = preferences.criteria?.file_quality?.weight || 16
    let fileScore = 0

    if (applicationData.documents_complete) fileScore += 0.4
    if (applicationData.has_verified_documents) fileScore += 0.3
    if (applicationData.presentation && applicationData.presentation.length > 50) fileScore += 0.3

    totalScore += fileWeight * fileScore

    // 5. Cohérence avec le bien
    const coherenceWeight = preferences.criteria?.property_coherence?.weight || 16
    totalScore += coherenceWeight * 0.8 // Score par défaut

    // 6. Répartition des revenus (colocation)
    const distributionWeight = preferences.criteria?.income_distribution?.weight || 16
    totalScore += distributionWeight * 0.8 // Score par défaut

    // Appliquer les règles d'exclusion
    totalScore = this.applyExclusionRules(totalScore, applicationData, property, preferences)

    return Math.min(100, Math.max(0, Math.round(totalScore)))
  }

  // Déterminer les revenus effectifs (avec option garant pour étudiants)
  private getEffectiveIncome(applicationData: any, income: number, guarantorIncome: number, preferences: any): number {
    const contractType = (applicationData.contract_type || "").toLowerCase()
    const isStudent = contractType.includes("étudiant") || contractType.includes("student")

    // Option spéciale pour les étudiants : utiliser les revenus du garant
    if (isStudent && preferences.criteria?.guarantor?.use_guarantor_income_for_students && guarantorIncome > 0) {
      return guarantorIncome
    }

    return income
  }

  // Scoring différencié par type de contrat selon le modèle
  private getContractScoring(modelType: string): any {
    switch (modelType) {
      case "strict":
        return {
          cdi: 1.0,
          cdd: 0.6,
          freelance: 0.3,
          student: 0.2,
          retired: 0.9,
          other: 0.1,
        }
      case "flexible":
        return {
          cdi: 1.0,
          cdd: 0.9,
          freelance: 0.8,
          student: 0.7,
          retired: 0.9,
          other: 0.5,
        }
      default: // standard
        return {
          cdi: 1.0,
          cdd: 0.8,
          freelance: 0.6,
          student: 0.5,
          retired: 0.9,
          other: 0.3,
        }
    }
  }

  // Appliquer les règles d'exclusion
  private applyExclusionRules(score: number, applicationData: any, property: any, preferences: any): number {
    const exclusionRules = preferences.exclusion_rules || {}

    // Dossier incomplet
    if (exclusionRules.incomplete_file && !applicationData.documents_complete) {
      return Math.min(score, 30)
    }

    // Ratio revenus/loyer < 2
    if (exclusionRules.income_ratio_below_2) {
      const ratio = (applicationData.income || 0) / (property.price || 1)
      if (ratio < 2.0) {
        return Math.min(score, 25)
      }
    }

    // Garant manquant quand requis
    if (exclusionRules.no_guarantor_when_required && !applicationData.has_guarantor) {
      const ratio = (applicationData.income || 0) / (property.price || 1)
      const requiredRatio = preferences.criteria?.guarantor?.required_if_income_below || 3.0
      if (ratio < requiredRatio) {
        return Math.min(score, 35)
      }
    }

    return score
  }

  // Invalider les scores pour un propriétaire
  private invalidateScoresForOwner(ownerId: string) {
    Object.keys(this.scoreCache).forEach((key) => {
      delete this.scoreCache[key]
    })

    this.emit("score-invalidated", ownerId, {})
  }

  // Debounce pour éviter les événements multiples
  private debounceEmit(eventType: EventType, ownerId: string, data: any) {
    const key = `${eventType}-${ownerId}`

    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key)!)
    }

    const timer = setTimeout(() => {
      this.emit(eventType, ownerId, data)
      this.debounceTimers.delete(key)
    }, this.DEBOUNCE_DELAY)

    this.debounceTimers.set(key, timer)
  }

  // Nettoyer le cache
  private cleanupCache() {
    const now = Date.now()

    // Nettoyer le cache des scores
    Object.keys(this.scoreCache).forEach((key) => {
      if (now - this.scoreCache[key].timestamp > this.CACHE_TTL) {
        delete this.scoreCache[key]
      }
    })

    // Nettoyer le cache des préférences
    Object.keys(this.preferencesCache).forEach((ownerId) => {
      if (now - this.preferencesCache[ownerId].timestamp > this.CACHE_TTL) {
        delete this.preferencesCache[ownerId]
      }
    })
  }

  // Statistiques pour le debugging
  getStats() {
    return {
      scoreCache: Object.keys(this.scoreCache).length,
      preferencesCache: Object.keys(this.preferencesCache).length,
      listeners: Array.from(this.listeners.entries()).map(([type, listeners]) => ({
        type,
        count: listeners.size,
      })),
    }
  }
}

// Instance globale
const scoringEventBus = new ScoringEventBus()

// Hook React pour utiliser l'Event Bus
export function useScoringEventBus() {
  return scoringEventBus
}

export default scoringEventBus
