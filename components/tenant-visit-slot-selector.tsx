"use client"

import { useEffect, useState } from "react"
import { Button } from "./Button"
import { AlertTriangle } from "react-feather"
import { RefreshCw } from "react-feather"

const TenantVisitSlotSelector = ({ applicationId }) => {
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [application, setApplication] = useState(null)

  const loadAvailableSlots = async () => {
    if (!applicationId) return

    setLoading(true)
    setError(null)

    try {
      console.log("🔍 Chargement créneaux pour candidature:", applicationId)

      const response = await fetch(`/api/applications/${applicationId}/available-slots`)

      console.log("📡 Réponse API:", response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("❌ Erreur API:", errorData)
        throw new Error(errorData.error || `Erreur ${response.status}`)
      }

      const data = await response.json()
      console.log("✅ Données reçues:", data)
      console.log("✅ Nombre de créneaux:", data.slots?.length || 0)

      if (data.success && Array.isArray(data.slots)) {
        setSlots(data.slots)
        setApplication(data.application)

        if (data.slots.length === 0) {
          setError("Aucun créneau de visite disponible pour cette propriété.")
        }
      } else {
        console.error("❌ Format de données invalide:", data)
        setError("Format de données invalide reçu du serveur")
      }
    } catch (error) {
      console.error("❌ Erreur chargement créneaux:", error)
      setError(error instanceof Error ? error.message : "Erreur lors du chargement des créneaux")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAvailableSlots()
  }, [applicationId])

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-700 mb-2">Erreur</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadAvailableSlots} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      </div>
    )
  }

  return <div>{/* Render slots or loading state here */}</div>
}

export default TenantVisitSlotSelector
</merged_code>
