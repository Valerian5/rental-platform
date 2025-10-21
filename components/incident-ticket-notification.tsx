"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquare, Bell, BellOff } from "lucide-react"
import { incidentTicketingService } from "@/lib/incident-ticketing-service"

interface IncidentTicketNotificationProps {
  incidentId: string
  currentUserId: string
  onNotificationClick?: () => void
}

export default function IncidentTicketNotification({ 
  incidentId, 
  currentUserId, 
  onNotificationClick 
}: IncidentTicketNotificationProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotificationStatus()
  }, [incidentId, currentUserId])

  const loadNotificationStatus = async () => {
    try {
      setLoading(true)
      const stats = await incidentTicketingService.getIncidentTicketStats(incidentId)
      setUnreadCount(stats.unreadTickets)
    } catch (error) {
      console.error("❌ Erreur chargement statut notification:", error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async () => {
    try {
      await incidentTicketingService.markTicketsAsRead(incidentId, currentUserId)
      setUnreadCount(0)
    } catch (error) {
      console.error("❌ Erreur marquage lu:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-pulse bg-gray-200 h-6 w-6 rounded"></div>
        <span className="text-sm text-gray-500">Chargement...</span>
      </div>
    )
  }

  if (unreadCount === 0) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <BellOff className="h-4 w-4" />
        <span className="text-sm">Aucun nouveau message</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          markAsRead()
          onNotificationClick?.()
        }}
        className="relative"
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        Messages
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>
    </div>
  )
}
