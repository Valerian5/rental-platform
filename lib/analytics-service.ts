interface AnalyticsEvent {
  event: string
  userId?: string
  properties?: Record<string, any>
  timestamp?: Date
}

interface UserMetrics {
  totalUsers: number
  activeUsers: number
  newUsers: number
  userGrowth: number
}

interface PropertyMetrics {
  totalProperties: number
  availableProperties: number
  averageRent: number
  mostPopularAreas: Array<{ area: string; count: number }>
}

interface ApplicationMetrics {
  totalApplications: number
  acceptedApplications: number
  pendingApplications: number
  averageProcessingTime: number
}

class AnalyticsService {
  private events: AnalyticsEvent[] = []

  // Enregistrer un événement
  track(event: string, userId?: string, properties?: Record<string, any>) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      userId,
      properties,
      timestamp: new Date(),
    }

    this.events.push(analyticsEvent)

    // En production, envoyer à un service d'analytics (Google Analytics, Mixpanel, etc.)
    this.sendToAnalytics(analyticsEvent)
  }

  private async sendToAnalytics(event: AnalyticsEvent) {
    try {
      // Exemple d'envoi vers Google Analytics 4
      if (typeof window !== "undefined" && (window as any).gtag) {
        ;(window as any).gtag("event", event.event, {
          user_id: event.userId,
          ...event.properties,
        })
      }

      // Ou vers votre propre API d'analytics
      await fetch("/api/analytics/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      })
    } catch (error) {
      console.error("Erreur envoi analytics:", error)
    }
  }

  // Métriques utilisateurs
  async getUserMetrics(): Promise<UserMetrics> {
    try {
      const response = await fetch("/api/analytics/users")
      return await response.json()
    } catch (error) {
      console.error("Erreur métriques utilisateurs:", error)
      return {
        totalUsers: 0,
        activeUsers: 0,
        newUsers: 0,
        userGrowth: 0,
      }
    }
  }

  // Métriques propriétés
  async getPropertyMetrics(): Promise<PropertyMetrics> {
    try {
      const response = await fetch("/api/analytics/properties")
      return await response.json()
    } catch (error) {
      console.error("Erreur métriques propriétés:", error)
      return {
        totalProperties: 0,
        availableProperties: 0,
        averageRent: 0,
        mostPopularAreas: [],
      }
    }
  }

  // Métriques candidatures
  async getApplicationMetrics(): Promise<ApplicationMetrics> {
    try {
      const response = await fetch("/api/analytics/applications")
      return await response.json()
    } catch (error) {
      console.error("Erreur métriques candidatures:", error)
      return {
        totalApplications: 0,
        acceptedApplications: 0,
        pendingApplications: 0,
        averageProcessingTime: 0,
      }
    }
  }

  // Événements prédéfinis
  trackUserRegistration(userId: string, userType: string) {
    this.track("user_registered", userId, { user_type: userType })
  }

  trackPropertyView(userId: string, propertyId: string) {
    this.track("property_viewed", userId, { property_id: propertyId })
  }

  trackApplicationSubmitted(userId: string, propertyId: string) {
    this.track("application_submitted", userId, { property_id: propertyId })
  }

  trackVisitScheduled(userId: string, propertyId: string) {
    this.track("visit_scheduled", userId, { property_id: propertyId })
  }

  trackMessageSent(userId: string, conversationId: string) {
    this.track("message_sent", userId, { conversation_id: conversationId })
  }

  trackSearchPerformed(userId: string, searchCriteria: Record<string, any>) {
    this.track("search_performed", userId, searchCriteria)
  }
}

export const analyticsService = new AnalyticsService()
