import { useState, useEffect, useCallback } from "react"
import { incidentTicketingService, IncidentTicket } from "@/lib/incident-ticketing-service"

interface UseIncidentTicketingProps {
  incidentId: string
  currentUser: {
    id: string
    user_type: "owner" | "tenant"
  }
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useIncidentTicketing({ 
  incidentId, 
  currentUser, 
  autoRefresh = true,
  refreshInterval = 30000 // 30 secondes
}: UseIncidentTicketingProps) {
  const [tickets, setTickets] = useState<IncidentTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadTickets = useCallback(async () => {
    if (!incidentId) return

    try {
      setError(null)
      const ticketsData = await incidentTicketingService.getIncidentTickets(incidentId)
      setTickets(ticketsData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors du chargement des tickets"
      setError(errorMessage)
      console.error("❌ Erreur chargement tickets:", err)
    } finally {
      setLoading(false)
    }
  }, [incidentId])

  const sendTicket = useCallback(async (message: string, attachments?: string[]) => {
    if (!message.trim()) {
      toast.error("Veuillez saisir un message")
      return false
    }

    try {
      setSending(true)
      setError(null)

      const ticketData = {
        incident_id: incidentId,
        user_id: currentUser.id,
        user_type: currentUser.user_type,
        message: message.trim(),
        attachments: attachments || []
      }

      const newTicket = await incidentTicketingService.createIncidentTicket(ticketData)
      setTickets((prev: IncidentTicket[]) => [...prev, newTicket])
      
      console.log("✅ Message envoyé avec succès")
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors de l'envoi du message"
      setError(errorMessage)
      console.error("❌ Erreur envoi ticket:", err)
      return false
    } finally {
      setSending(false)
    }
  }, [incidentId, currentUser.id, currentUser.user_type])

  const markAsRead = useCallback(async () => {
    try {
      await incidentTicketingService.markTicketsAsRead(incidentId, currentUser.id)
    } catch (err) {
      console.error("❌ Erreur marquage lu:", err)
    }
  }, [incidentId, currentUser.id])

  const getUnreadCount = useCallback(() => {
    return tickets.filter((ticket: IncidentTicket) => 
      ticket.author_id !== currentUser.id && !ticket.is_read
    ).length
  }, [tickets, currentUser.id])

  const getLastActivity = useCallback(() => {
    if (tickets.length === 0) return null
    return tickets.sort(
      (a: IncidentTicket, b: IncidentTicket) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0].created_at
  }, [tickets])

  // Chargement initial
  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      loadTickets()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, loadTickets])

  // Marquer comme lu quand l'utilisateur voit les tickets
  useEffect(() => {
    if (tickets.length > 0) {
      markAsRead()
    }
  }, [tickets.length, markAsRead])

  return {
    tickets,
    loading,
    sending,
    error,
    loadTickets,
    sendTicket,
    markAsRead,
    getUnreadCount,
    getLastActivity,
    hasUnreadMessages: getUnreadCount() > 0,
    unreadCount: getUnreadCount(),
    lastActivity: getLastActivity()
  }
}
