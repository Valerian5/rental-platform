"use client"

import { useState, useEffect } from "react"
import { documentObsolescenceService, type ObsoleteDocument } from "@/lib/document-obsolescence-service"

export function useDocumentObsolescence(userId: string | null) {
  const [obsoleteDocuments, setObsoleteDocuments] = useState<ObsoleteDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [showUpdatePopup, setShowUpdatePopup] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  useEffect(() => {
    if (userId) {
      // Vérifier immédiatement
      checkDocuments()

      // Programmer des vérifications périodiques
      const interval = setInterval(
        () => {
          checkDocuments()
        },
        24 * 60 * 60 * 1000,
      ) // Toutes les 24 heures

      return () => clearInterval(interval)
    }
  }, [userId])

  const checkDocuments = async () => {
    if (!userId || loading) return

    try {
      setLoading(true)
      console.log("🔍 Vérification documents obsolètes pour:", userId)

      const documents = await documentObsolescenceService.checkUserDocuments(userId)
      setObsoleteDocuments(documents)
      setLastCheck(new Date())

      // Afficher le popup s'il y a des documents obsolètes urgents
      const hasUrgentDocuments = documents.some((doc) => doc.urgency === "high")
      if (hasUrgentDocuments && documents.length > 0) {
        setShowUpdatePopup(true)
      }

      // Créer des notifications pour les nouveaux documents obsolètes
      if (documents.length > 0) {
        await documentObsolescenceService.createObsolescenceNotifications(userId, documents)
      }
    } catch (error) {
      console.error("❌ Erreur vérification documents:", error)
    } finally {
      setLoading(false)
    }
  }

  const dismissPopup = () => {
    setShowUpdatePopup(false)
  }

  const forceCheck = () => {
    checkDocuments()
  }

  return {
    obsoleteDocuments,
    loading,
    showUpdatePopup,
    lastCheck,
    dismissPopup,
    forceCheck,
    hasObsoleteDocuments: obsoleteDocuments.length > 0,
    urgentDocuments: obsoleteDocuments.filter((doc) => doc.urgency === "high"),
    mediumDocuments: obsoleteDocuments.filter((doc) => doc.urgency === "medium"),
    lowDocuments: obsoleteDocuments.filter((doc) => doc.urgency === "low"),
  }
}
