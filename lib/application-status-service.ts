import { supabase } from "./supabase"

export interface ApplicationStatus {
  hasApplied: boolean
  status?: string
  appliedAt?: string
  applicationId?: string
}

export const applicationStatusService = {
  // Vérifier si un locataire a déjà postulé pour une propriété
  async checkApplicationStatus(propertyId: string, tenantId: string): Promise<ApplicationStatus> {
    console.log("🔍 ApplicationStatusService.checkApplicationStatus", { propertyId, tenantId })

    try {
      const { data, error } = await supabase
        .from("applications")
        .select("id, status, created_at")
        .eq("property_id", propertyId)
        .eq("tenant_id", tenantId)
        .neq("status", "withdrawn")
        .maybeSingle()

      if (error) {
        console.error("❌ Erreur vérification candidature:", error)
        return { hasApplied: false }
      }

      if (!data) {
        return { hasApplied: false }
      }

      return {
        hasApplied: true,
        status: data.status,
        appliedAt: data.created_at,
        applicationId: data.id
      }
    } catch (error) {
      console.error("❌ Erreur dans checkApplicationStatus:", error)
      return { hasApplied: false }
    }
  },

  // Vérifier le statut de plusieurs propriétés en une fois
  async checkMultipleApplications(propertyIds: string[], tenantId: string): Promise<Record<string, ApplicationStatus>> {
    console.log("🔍 ApplicationStatusService.checkMultipleApplications", { propertyIds, tenantId })

    try {
      const { data, error } = await supabase
        .from("applications")
        .select("id, property_id, status, created_at")
        .in("property_id", propertyIds)
        .eq("tenant_id", tenantId)
        .neq("status", "withdrawn")

      if (error) {
        console.error("❌ Erreur vérification candidatures multiples:", error)
        return {}
      }

      const result: Record<string, ApplicationStatus> = {}
      
      // Initialiser toutes les propriétés comme non postulées
      propertyIds.forEach(id => {
        result[id] = { hasApplied: false }
      })

      // Mettre à jour avec les candidatures existantes
      data?.forEach(app => {
        result[app.property_id] = {
          hasApplied: true,
          status: app.status,
          appliedAt: app.created_at,
          applicationId: app.id
        }
      })

      return result
    } catch (error) {
      console.error("❌ Erreur dans checkMultipleApplications:", error)
      return {}
    }
  },

  // Obtenir le texte du statut pour l'affichage
  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      "pending": "En attente",
      "accepted": "Acceptée",
      "rejected": "Refusée",
      "withdrawn": "Retirée",
      "under_review": "En cours d'évaluation",
      "analyzing": "En analyse",
      "confirmed_by_tenant": "Confirmée par le locataire",
      "visit_scheduled": "Visite programmée",
      "visit_proposed": "Visite proposée",
      "visit_completed": "Visite effectuée",
      "visit_done": "Visite effectuée",
      "waiting_tenant_confirmation": "En attente de confirmation",
      "offer_made": "Offre faite",
      "offer_accepted": "Offre acceptée",
      "offer_rejected": "Offre refusée",
      "lease_created": "Bail créé",
      "lease_signed": "Bail signé"
    }

    return statusMap[status] || status
  },

  // Obtenir la couleur du badge selon le statut
  getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      "pending": "bg-yellow-100 text-yellow-800",
      "accepted": "bg-green-100 text-green-800",
      "rejected": "bg-red-100 text-red-800",
      "withdrawn": "bg-gray-100 text-gray-800",
      "under_review": "bg-blue-100 text-blue-800",
      "analyzing": "bg-blue-100 text-blue-800",
      "confirmed_by_tenant": "bg-green-100 text-green-800",
      "visit_scheduled": "bg-purple-100 text-purple-800",
      "visit_proposed": "bg-purple-100 text-purple-800",
      "visit_completed": "bg-indigo-100 text-indigo-800",
      "visit_done": "bg-indigo-100 text-indigo-800",
      "waiting_tenant_confirmation": "bg-yellow-100 text-yellow-800",
      "offer_made": "bg-orange-100 text-orange-800",
      "offer_accepted": "bg-green-100 text-green-800",
      "offer_rejected": "bg-red-100 text-red-800",
      "lease_created": "bg-green-100 text-green-800",
      "lease_signed": "bg-emerald-100 text-emerald-800"
    }

    return colorMap[status] || "bg-gray-100 text-gray-800"
  }
}
