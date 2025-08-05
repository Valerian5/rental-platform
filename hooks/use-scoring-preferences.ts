"use client"

import { useState, useEffect, useCallback } from "react"
import { scoringPreferencesService } from "@/lib/scoring-preferences-service"

interface UseScoringPreferencesOptions {
  ownerId: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useScoringPreferences({
  ownerId,
  autoRefresh = false,
  refreshInterval = 30000,
}: UseScoringPreferencesOptions) {
  const [preferences, setPreferences] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  const loadPreferences = useCallback(async () => {
    if (!ownerId) return

    try {
      setLoading(true)
      setError(null)
      const prefs = await scoringPreferencesService.getOwnerPreferences(ownerId, false)
      setPreferences(prefs)
      setVersion(prefs.version || 1)
    } catch (err) {
      console.error("Erreur chargement préférences:", err)
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }, [ownerId])

  const refresh = useCallback(() => {
    if (ownerId) {
      scoringPreferencesService.invalidateCache(ownerId)
      loadPreferences()
    }
  }, [ownerId, loadPreferences])

  useEffect(() => {
    loadPreferences()
  }, [loadPreferences])

  useEffect(() => {
    if (!autoRefresh || !ownerId) return

    const interval = setInterval(() => {
      loadPreferences()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, loadPreferences, ownerId])

  return {
    preferences,
    loading,
    error,
    version,
    refresh,
  }
}

interface UseRealtimeScoresOptions {
  applications: any[]
  ownerId: string
  enabled?: boolean
}

export function useRealtimeScores({ applications, ownerId, enabled = true }: UseRealtimeScoresOptions) {
  const [scores, setScores] = useState<Map<string, any>>(new Map())
  const [loading, setLoading] = useState(false)
  const [recalculating, setRecalculating] = useState(false)
  const [lastCalculated, setLastCalculated] = useState<Date | null>(null)

  const recalculateAll = useCallback(async () => {
    if (!enabled || !ownerId || applications.length === 0) return

    try {
      setRecalculating(true)
      const newScores = new Map()

      // Calculer les scores en parallèle par batch
      const batchSize = 10
      for (let i = 0; i < applications.length; i += batchSize) {
        const batch = applications.slice(i, i + batchSize)

        const batchPromises = batch.map(async (app) => {
          try {
            const result = await scoringPreferencesService.calculateScore(
              app,
              app.property,
              ownerId,
              false, // Force recalculation
            )
            return { id: app.id, result }
          } catch (error) {
            console.error("Erreur calcul score pour:", app.id, error)
            return { id: app.id, result: { totalScore: 50, compatible: false } }
          }
        })

        const batchResults = await Promise.all(batchPromises)
        batchResults.forEach(({ id, result }) => {
          newScores.set(id, result)
        })
      }

      setScores(newScores)
      setLastCalculated(new Date())
    } catch (error) {
      console.error("Erreur recalcul scores:", error)
    } finally {
      setRecalculating(false)
    }
  }, [applications, ownerId, enabled])

  // Calculer les scores initiaux
  useEffect(() => {
    if (!enabled || !ownerId || applications.length === 0) return

    const calculateInitialScores = async () => {
      try {
        setLoading(true)
        const newScores = new Map()

        // Calculer les scores en parallèle par batch
        const batchSize = 10
        for (let i = 0; i < applications.length; i += batchSize) {
          const batch = applications.slice(i, i + batchSize)

          const batchPromises = batch.map(async (app) => {
            try {
              const result = await scoringPreferencesService.calculateScore(
                app,
                app.property,
                ownerId,
                true, // Utiliser le cache
              )
              return { id: app.id, result }
            } catch (error) {
              console.error("Erreur calcul score pour:", app.id, error)
              return { id: app.id, result: { totalScore: 50, compatible: false } }
            }
          })

          const batchResults = await Promise.all(batchPromises)
          batchResults.forEach(({ id, result }) => {
            newScores.set(id, result)
          })
        }

        setScores(newScores)
        setLastCalculated(new Date())
      } catch (error) {
        console.error("Erreur calcul scores initiaux:", error)
      } finally {
        setLoading(false)
      }
    }

    calculateInitialScores()
  }, [applications, ownerId, enabled])

  const getScore = useCallback(
    (applicationId: string) => {
      return scores.get(applicationId) || { totalScore: 50, compatible: false }
    },
    [scores],
  )

  return {
    scores: Object.fromEntries(scores),
    loading,
    recalculating,
    lastCalculated,
    getScore,
    recalculateAll,
  }
}
