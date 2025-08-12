export interface ObsoleteDocument {
  personType: string
  documentType: string
  documentName: string
  reason: string
  urgency: "low" | "medium" | "high"
  recommendedAction: string
  category: string
}

export const documentObsolescenceService = {
  async checkUserDocuments(userId: string): Promise<ObsoleteDocument[]> {
    console.log("🔍 Vérification obsolescence documents pour:", userId)

    try {
      const response = await fetch("/api/documents/check-obsolescence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        console.log(`✅ ${result.obsoleteDocuments.length} documents obsolètes détectés`)
        return result.obsoleteDocuments
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("❌ Erreur vérification obsolescence:", error)
      return []
    }
  },

  async createObsolescenceNotifications(userId: string, obsoleteDocuments: ObsoleteDocument[]) {
    console.log("🔔 Création notifications obsolescence pour:", userId)

    const notifications = []

    for (const doc of obsoleteDocuments) {
      const notification = {
        userId,
        title: `📄 Mise à jour requise: ${doc.documentName}`,
        content: `${doc.personType} - ${doc.reason}. ${doc.recommendedAction}`,
        type: "document_update_required",
        action_url: `/tenant/profile/rental-file?update=${doc.documentType}&person=${encodeURIComponent(doc.personType)}`,
      }

      try {
        const response = await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(notification),
        })

        if (response.ok) {
          const result = await response.json()
          notifications.push(result.notification)
          console.log("✅ Notification créée:", doc.documentName)
        }
      } catch (error) {
        console.error("❌ Erreur création notification:", error)
      }
    }

    return notifications
  },

  async schedulePeriodicCheck(userId: string) {
    console.log("⏰ Programmation vérification périodique pour:", userId)

    // Vérifier les documents obsolètes
    const obsoleteDocuments = await this.checkUserDocuments(userId)

    if (obsoleteDocuments.length > 0) {
      // Créer les notifications
      await this.createObsolescenceNotifications(userId, obsoleteDocuments)

      // Programmer la prochaine vérification (dans 7 jours)
      setTimeout(
        () => {
          this.schedulePeriodicCheck(userId)
        },
        7 * 24 * 60 * 60 * 1000,
      )
    } else {
      // Si pas de documents obsolètes, vérifier dans 30 jours
      setTimeout(
        () => {
          this.schedulePeriodicCheck(userId)
        },
        30 * 24 * 60 * 60 * 1000,
      )
    }
  },

  getUrgencyColor(urgency: string): string {
    switch (urgency) {
      case "high":
        return "text-red-600"
      case "medium":
        return "text-yellow-600"
      case "low":
        return "text-blue-600"
      default:
        return "text-gray-600"
    }
  },

  getUrgencyBadge(urgency: string): string {
    switch (urgency) {
      case "high":
        return "destructive"
      case "medium":
        return "secondary"
      case "low":
        return "outline"
      default:
        return "outline"
    }
  },

  getCategoryIcon(category: string): string {
    switch (category) {
      case "income":
        return "💰"
      case "banking":
        return "🏦"
      case "tax":
        return "📊"
      case "identity":
        return "🆔"
      case "employment":
        return "💼"
      default:
        return "📄"
    }
  },
}
