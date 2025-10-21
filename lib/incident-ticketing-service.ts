import { supabase } from "./supabase"

export interface IncidentTicketData {
  incident_id: string
  user_id: string
  user_type: "owner" | "tenant"
  message: string
  attachments?: string[]
}

export interface IncidentTicket {
  id: string
  incident_id: string
  author_id: string
  author_name: string
  author_type: "owner" | "tenant"
  message: string
  attachments: string[]
  created_at: string
  updated_at: string
}

export const incidentTicketingService = {
  // Récupérer tous les tickets/messages d'un incident
  async getIncidentTickets(incidentId: string): Promise<IncidentTicket[]> {
    console.log("🎫 IncidentTicketingService.getIncidentTickets", incidentId)

    try {
      const response = await fetch(`/api/incidents/${incidentId}/tickets`)
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`)
      }

      const data = await response.json()
      console.log("✅ Tickets incident récupérés:", data.tickets?.length || 0)
      return data.tickets || []
    } catch (error) {
      console.error("❌ Erreur dans getIncidentTickets:", error)
      throw error
    }
  },

  // Créer un nouveau ticket/message pour un incident
  async createIncidentTicket(ticketData: IncidentTicketData): Promise<IncidentTicket> {
    console.log("🎫 IncidentTicketingService.createIncidentTicket", ticketData)

    try {
      const response = await fetch(`/api/incidents/${ticketData.incident_id}/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: ticketData.user_id,
          message: ticketData.message,
          user_type: ticketData.user_type,
          attachments: ticketData.attachments,
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Erreur ${response.status}: ${errorData}`)
      }

      const data = await response.json()
      console.log("✅ Ticket incident créé:", data.ticket)
      return data.ticket
    } catch (error) {
      console.error("❌ Erreur dans createIncidentTicket:", error)
      throw error
    }
  },

  // Marquer les tickets comme lus pour un utilisateur
  async markTicketsAsRead(incidentId: string, userId: string): Promise<void> {
    console.log("👁️ IncidentTicketingService.markTicketsAsRead", incidentId, userId)

    try {
      const { error } = await supabase
        .from("incident_responses")
        .update({ is_read: true })
        .eq("incident_id", incidentId)
        .neq("author_id", userId)
        .eq("is_read", false)

      if (error) {
        console.error("❌ Erreur marquage tickets lus:", error)
        throw new Error(error.message)
      }

      console.log("✅ Tickets marqués comme lus")
    } catch (error) {
      console.error("❌ Erreur dans markTicketsAsRead:", error)
      throw error
    }
  },

  // Récupérer les incidents avec leurs tickets pour un utilisateur
  async getUserIncidentsWithTickets(userId: string, userType: "owner" | "tenant"): Promise<any[]> {
    console.log("📋 IncidentTicketingService.getUserIncidentsWithTickets", userId, userType)

    try {
      let query
      
      if (userType === "owner") {
        // Pour les propriétaires : incidents de leurs propriétés
        query = supabase
          .from("incidents")
          .select(`
            *,
            property:properties(id, title, address, city),
            lease:leases(
              id,
              tenant:users!leases_tenant_id_fkey(id, first_name, last_name, email, phone)
            ),
            responses:incident_responses(
              id, author_id, author_name, author_type, message, attachments, created_at
            )
          `)
          .eq("property.owner_id", userId)
      } else {
        // Pour les locataires : incidents qu'ils ont signalés ou liés à leurs baux
        query = supabase
          .from("incidents")
          .select(`
            *,
            property:properties(id, title, address, city),
            lease:leases(
              id,
              owner:users!leases_owner_id_fkey(id, first_name, last_name, email, phone)
            ),
            responses:incident_responses(
              id, author_id, author_name, author_type, message, attachments, created_at
            )
          `)
          .or(`reported_by.eq.${userId},lease.tenant_id.eq.${userId}`)
      }

      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Erreur récupération incidents avec tickets:", error)
        throw new Error(error.message)
      }

      // Trier les réponses par date pour chaque incident
      const incidentsWithSortedTickets = data?.map((incident) => ({
        ...incident,
        responses: incident.responses?.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ) || [],
      })) || []

      console.log("✅ Incidents avec tickets récupérés:", incidentsWithSortedTickets.length)
      return incidentsWithSortedTickets
    } catch (error) {
      console.error("❌ Erreur dans getUserIncidentsWithTickets:", error)
      throw error
    }
  },

  // Récupérer les statistiques des tickets pour un incident
  async getIncidentTicketStats(incidentId: string): Promise<{
    totalTickets: number
    unreadTickets: number
    lastActivity: string | null
  }> {
    console.log("📊 IncidentTicketingService.getIncidentTicketStats", incidentId)

    try {
      const { data, error } = await supabase
        .from("incident_responses")
        .select("id, is_read, created_at")
        .eq("incident_id", incidentId)

      if (error) {
        console.error("❌ Erreur récupération stats tickets:", error)
        throw new Error(error.message)
      }

      const totalTickets = data?.length || 0
      const unreadTickets = data?.filter(ticket => !ticket.is_read).length || 0
      const lastActivity = data?.length > 0 
        ? data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
        : null

      console.log("✅ Stats tickets récupérées:", { totalTickets, unreadTickets, lastActivity })
      return { totalTickets, unreadTickets, lastActivity }
    } catch (error) {
      console.error("❌ Erreur dans getIncidentTicketStats:", error)
      throw error
    }
  }
}
