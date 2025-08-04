"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  scoringPreferencesService,
  type ScoringPreferences,
  type ScoringResult,
} from "@/lib/scoring-preferences-service"

interface UseScoringPreferencesOptions {
  ownerId: string
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseScoringPreferencesReturn {
  preferences: ScoringPreferences | null
  loading: boolean
  error: string | null
  version: number
  lastUpdated: Date | null
  refresh: () => Promise<void>
  calculateScore: (application: any, property: any) => Promise<ScoringResult>
  calculateScores: (applications: any[]) => Promise<Map<string, ScoringResult>>
}

export function useScoringPreferences({
  ownerId,
  autoRefresh = true,
  refreshInterval = 30000, // 30 secondes
}: UseScoringPreferencesOptions): UseScoringPreferencesReturn {
  const [preferences, setPreferences] = useState<ScoringPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const refreshTimeoutRef = useRef<NodeJS.Timeout>()
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Fonction pour charger les préférences
  const loadPreferences = useCallback(
    async (useCache = true) => {
      try {
        setLoading(true)
        setError(null)

        const prefs = await scoringPreferencesService.getOwnerPreferences(ownerId, useCache)
        setPreferences(prefs)
        setVersion(prefs.version || 1)
        setLastUpdated(new Date())

        console.log("🎯 Préférences chargées via hook:", prefs.name, "version:", prefs.version)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erreur lors du chargement des préférences"
        setError(errorMessage)
        console.error("❌ Erreur chargement préférences via hook:", err)
      } finally {
        setLoading(false)
      }
    },
    [ownerId],
  )

  // Fonction de rafraîchissement manuel
  const refresh = useCallback(async () => {
    await loadPreferences(false) // Force le rechargement sans cache
  }, [loadPreferences])

  // Fonction pour calculer un score
  const calculateScore = useCallback(
    async (application: any, property: any): Promise<ScoringResult> => {
      if (!preferences) {
        throw new Error("Préférences non chargées")
      }

      return await scoringPreferencesService.calculateScoreWithCache(application, property, ownerId, true)
    },
    [preferences, ownerId],
  )

  // Fonction pour calculer plusieurs scores
  const calculateScores = useCallback(
    async (applications: any[]): Promise<Map<string, ScoringResult>> => {
      return await scoringPreferencesService.recalculateScoresForApplications(applications, ownerId, false)
    },
    [ownerId],
  )

  // Effet pour le chargement initial
  useEffect(() => {
    loadPreferences(true)
  }, [loadPreferences])

  // Effet pour l'abonnement aux changements
  useEffect(() => {
    if (!ownerId) return

    // S'abonner aux changements de préférences
    const unsubscribe = scoringPreferencesService.subscribeToPreferencesChanges(ownerId, (newPreferences) => {
      console.log(
        "🔄 Préférences mises à jour via subscription:",
        newPreferences.name,
        "version:",
        newPreferences.version,
      )
      setPreferences(newPreferences)
      setVersion(newPreferences.version || 1)
      setLastUpdated(new Date())
      setError(null)
    })

    unsubscribeRef.current = unsubscribe

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [ownerId])

  // Effet pour le rafraîchissement automatique
  useEffect(() => {
    if (!autoRefresh || !refreshInterval) return

    const scheduleRefresh = () => {
      refreshTimeoutRef.current = setTimeout(async () => {
        try {
          await loadPreferences(false)
        } catch (err) {
          console.error("❌ Erreur lors du rafraîchissement automatique:", err)
        }
        scheduleRefresh() // Programmer le prochain rafraîchissement
      }, refreshInterval)
    }

    scheduleRefresh()

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [autoRefresh, refreshInterval, loadPreferences])

  // Nettoyage lors du démontage
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [])

  return {
    preferences,
    loading,
    error,
    version,
    lastUpdated,
    refresh,
    calculateScore,
    calculateScores,
  }
}

// Hook pour les scores en temps réel
interface UseRealtimeScoresOptions {
  applications: any[]
  ownerId: string
  enabled?: boolean
}

interface UseRealtimeScoresReturn {
  scores: Map<string, ScoringResult>
  loading: boolean
  error: string | null
  recalculating: boolean
  lastCalculated: Date | null
  recalculateAll: () => Promise<void>
}

export function useRealtimeScores({
  applications,
  ownerId,
  enabled = true,
}: UseRealtimeScoresOptions): UseRealtimeScoresReturn {
  const [scores, setScores] = useState<Map<string, ScoringResult>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recalculating, setRecalculating] = useState(false)
  const [lastCalculated, setLastCalculated] = useState<Date | null>(null)

  const { preferences, version } = useScoringPreferences({ ownerId, autoRefresh: true })
  const previousVersionRef = useRef<number>(0)

  // Fonction pour recalculer tous les scores
  const recalculateAll = useCallback(async () => {
    if (!enabled || !applications.length || !preferences) return

    try {
      setRecalculating(true)
      setError(null)

      console.log(`🔄 Recalcul de ${applications.length} scores avec version ${version}`)

      const newScores = await scoringPreferencesService.recalculateScoresForApplications(
        applications,
        ownerId,
        version !== previousVersionRef.current, // Force le recalcul si la version a changé
      )

      setScores(newScores)
      setLastCalculated(new Date())
      previousVersionRef.current = version

      console.log(`✅ ${newScores.size} scores recalculés`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors du recalcul des scores"
      setError(errorMessage)
      console.error("❌ Erreur recalcul scores:", err)
    } finally {
      setRecalculating(false)
      setLoading(false)
    }
  }, [enabled, applications, preferences, ownerId, version])

  // Recalculer quand les préférences changent
  useEffect(() => {
    if (preferences && version !== previousVersionRef.current) {
      console.log("🔄 Préférences mises à jour, recalcul des scores...")
      recalculateAll()
    }
  }, [preferences, version, recalculateAll])

  // Recalculer quand les candidatures changent
  useEffect(() => {
    if (applications.length > 0 && preferences) {
      recalculateAll()
    }
  }, [applications.length, recalculateAll, preferences])

  return {
    scores,
    loading,
    error,
    recalculating,
    lastCalculated,
    recalculateAll,
  }
}
