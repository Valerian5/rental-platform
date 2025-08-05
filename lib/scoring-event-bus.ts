// Event Bus centralisé pour la synchronisation des scores en temps réel
type ScoringEventType = "preferences-updated" | "score-calculated" | "scores-invalidated"

interface ScoringEvent {
  type: ScoringEventType
  data: any
  timestamp: number
  ownerId: string
}

interface ScoreCache {
  [key: string]: {
    score: number
    timestamp: number
    version: number
    propertyPrice: number
    applicationData: any
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
  private listeners: Map<ScoringEventType, Set<(event: ScoringEvent) => void>> = new Map()
  private scoreCache: ScoreCache = {}
  private preferencesCache: PreferencesCache = {}
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly DEBOUNCE_DELAY = 100 // 100ms

  // Abonnement aux événements
  subscribe(eventType: ScoringEventType, callback: (event: ScoringEvent) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }

    this.listeners.get(eventType)!.add(callback)

    // Retourner une fonction de désabonnement
    return () => {
      const listeners = this.listeners.get(eventType)
      if (listeners) {
        listeners.delete(callback)
        if (listeners.size === 0) {
          this.listeners.delete(eventType)
        }
      }
    }
  }

  // Émission d'événements
  emit(eventType: ScoringEventType, data: any, ownerId: string) {
    const event: ScoringEvent = {
      type: eventType,
      data,
      timestamp: Date.now(),
      ownerId,
    }

    console.log(`🎯 Event Bus: ${eventType}`, { ownerId, dataKeys: Object.keys(data) })

    const listeners = this.listeners.get(eventType)
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(event)
        } catch (error) {
          console.error(`❌ Erreur dans listener ${eventType}:`, error)
        }
      })
    }
  }

  // Mise à jour des préférences avec invalidation du cache
  updatePreferences(ownerId: string, preferences: any) {
    const version = Date.now()

    // Mettre à jour le cache des préférences
    this.preferencesCache[ownerId] = {
      preferences,
      timestamp: Date.now(),
      version,
    }

    // Invalider tous les scores pour ce propriétaire
    this.invalidateScoresForOwner(ownerId)

    // Émettre l'événement
    this.emit("preferences-updated", { preferences, version }, ownerId)
  }

  // Calcul de score avec cache et debounce
  calculateScore(applicationId: string, application: any, property: any, ownerId: string): Promise<number> {
    return new Promise((resolve) => {
      const cacheKey = `${applicationId}-${property.id || "no-property"}`

      // Vérifier le cache
      const cached = this.scoreCache[cacheKey]
      const preferences = this.preferencesCache[ownerId]

      if (
        cached &&
        preferences &&
        cached.version === preferences.version &&
        cached.propertyPrice === property.price &&
        Date.now() - cached.timestamp < this.CACHE_TTL
      ) {
        console.log(`📊 Score depuis cache: ${cached.score}`)
        resolve(cached.score)
        return
      }

      // Debounce pour éviter les calculs multiples
      const debounceKey = `${ownerId}-${applicationId}`
      if (this.debounceTimers.has(debounceKey)) {
        clearTimeout(this.debounceTimers.get(debounceKey)!)
      }

      const timer = setTimeout(async () => {
        try {
          const score = await this.performScoreCalculation(application, property, ownerId)

          // Mettre en cache
          this.scoreCache[cacheKey] = {
            score,
            timestamp: Date.now(),
            version: preferences?.version || 0,
            propertyPrice: property.price || 0,
            applicationData: { ...application },
          }

          console.log(`📊 Score calculé et mis en cache: ${score}`)

          // Émettre l'événement
          this.emit("score-calculated", { applicationId, score, property }, ownerId)

          resolve(score)
        } catch (error) {
          console.error("❌ Erreur calcul score:", error)
          resolve(50) // Score par défaut
        } finally {
          this.debounceTimers.delete(debounceKey)
        }
      }, this.DEBOUNCE_DELAY)

      this.debounceTimers.set(debounceKey, timer)
    })
  }

  // Calcul effectif du score
  private async performScoreCalculation(application: any, property: any, ownerId: string): Promise<number> {
    const preferences = this.preferencesCache[ownerId]?.preferences

    if (!preferences || !property.price || !application.income) {
      return 50
    }

    let score = 0
    const weights = preferences.criteria?.income_ratio?.weight || 40

    // 1. Score revenus (basé sur le ratio revenus/loyer du bien spécifique)
    const rentRatio = application.income / property.price

    if (rentRatio >= 3.5) {
      score += weights
    } else if (rentRatio >= 3.0) {
      score += Math.round(weights * 0.8)
    } else if (rentRatio >= 2.5) {
      score += Math.round(weights * 0.6)
    } else if (rentRatio >= 2.0) {
      score += Math.round(weights * 0.4)
    } else {
      score += Math.round(weights * 0.2)
    }

    // 2. Score stabilité professionnelle
    const stabilityWeight = preferences.criteria?.professional_stability?.weight || 25
    const contractType = (application.contract_type || "").toLowerCase()

    if (["cdi", "fonctionnaire"].includes(contractType)) {
      score += stabilityWeight
    } else if (contractType === "cdd") {
      score += Math.round(stabilityWeight * 0.7)
    } else {
      score += Math.round(stabilityWeight * 0.5)
    }

    // 3. Score garant
    const guarantorWeight = preferences.criteria?.guarantor?.weight || 20
    if (application.has_guarantor) {
      score += guarantorWeight
    }

    // 4. Score qualité dossier
    const fileWeight = preferences.criteria?.file_quality?.weight || 15
    let fileScore = 0
    if (application.profession && application.profession !== "Non spécifié") {
      fileScore += Math.round(fileWeight * 0.5)
    }
    if (application.company && application.company !== "Non spécifié") {
      fileScore += Math.round(fileWeight * 0.5)
    }
    score += fileScore

    return Math.min(Math.round(score), 100)
  }

  // Invalidation des scores pour un propriétaire
  private invalidateScoresForOwner(ownerId: string) {
    const keysToDelete: string[] = []

    Object.keys(this.scoreCache).forEach((key) => {
      // Pour une vraie implémentation, on devrait stocker l'ownerId dans le cache
      // Pour l'instant, on invalide tout
      keysToDelete.push(key)
    })

    keysToDelete.forEach((key) => delete this.scoreCache[key])

    this.emit("scores-invalidated", { ownerId }, ownerId)
  }

  // Récupération des préférences
  getPreferences(ownerId: string) {
    const cached = this.preferencesCache[ownerId]
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.preferences
    }
    return null
  }

  // Nettoyage du cache
  clearCache() {
    this.scoreCache = {}
    this.preferencesCache = {}
    this.debounceTimers.forEach((timer) => clearTimeout(timer))
    this.debounceTimers.clear()
  }

  // Statistiques du cache
  getCacheStats() {
    return {
      scoreCache: Object.keys(this.scoreCache).length,
      preferencesCache: Object.keys(this.preferencesCache).length,
      activeDebounces: this.debounceTimers.size,
      listeners: Array.from(this.listeners.entries()).map(([type, listeners]) => ({
        type,
        count: listeners.size,
      })),
    }
  }
}

// Instance globale
export const scoringEventBus = new ScoringEventBus()

// Hook React pour utiliser l'Event Bus
export function useScoringEventBus() {
  return {
    subscribe: scoringEventBus.subscribe.bind(scoringEventBus),
    emit: scoringEventBus.emit.bind(scoringEventBus),
    updatePreferences: scoringEventBus.updatePreferences.bind(scoringEventBus),
    calculateScore: scoringEventBus.calculateScore.bind(scoringEventBus),
    getPreferences: scoringEventBus.getPreferences.bind(scoringEventBus),
    getCacheStats: scoringEventBus.getCacheStats.bind(scoringEventBus),
  }
}
