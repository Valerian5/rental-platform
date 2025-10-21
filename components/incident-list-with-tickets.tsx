"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  AlertTriangle, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Building,
  User,
  Calendar
} from "lucide-react"
import { incidentTicketingService } from "@/lib/incident-ticketing-service"
import { toast } from "sonner"
import Link from "next/link"

interface IncidentWithTickets {
  id: string
  title: string
  description: string
  category: string
  priority: string
  status: string
  created_at: string
  property?: {
    id: string
    title: string
    address: string
    city: string
  }
  lease?: {
    tenant?: {
      first_name: string
      last_name: string
    }
    owner?: {
      first_name: string
      last_name: string
    }
  }
  responses?: Array<{
    id: string
    author_id: string
    author_name: string
    author_type: string
    message: string
    created_at: string
    is_read: boolean
  }>
}

interface IncidentListWithTicketsProps {
  userId: string
  userType: "owner" | "tenant"
  onIncidentClick?: (incidentId: string) => void
}

export default function IncidentListWithTickets({ 
  userId, 
  userType, 
  onIncidentClick 
}: IncidentListWithTicketsProps) {
  const [incidents, setIncidents] = useState<IncidentWithTickets[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadIncidents()
  }, [userId, userType])

  const loadIncidents = async () => {
    try {
      setLoading(true)
      const incidentsData = await incidentTicketingService.getUserIncidentsWithTickets(userId, userType)
      setIncidents(incidentsData)
    } catch (error) {
      console.error("❌ Erreur chargement incidents:", error)
      toast.error("Erreur lors du chargement des incidents")
    } finally {
      setLoading(false)
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent": return <AlertTriangle className="h-4 w-4 text-red-600" />
      case "high": return <AlertCircle className="h-4 w-4 text-orange-600" />
      case "medium": return <Clock className="h-4 w-4 text-yellow-600" />
      case "low": return <CheckCircle className="h-4 w-4 text-green-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved": return <Badge className="bg-green-600">Résolu</Badge>
      case "in_progress": return <Badge className="bg-orange-600">En cours</Badge>
      case "reported": return <Badge variant="secondary">Signalé</Badge>
      case "closed": return <Badge variant="outline">Fermé</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent": return <Badge variant="destructive">Urgent</Badge>
      case "high": return <Badge className="bg-orange-600">Élevé</Badge>
      case "medium": return <Badge variant="secondary">Moyen</Badge>
      case "low": return <Badge variant="outline">Faible</Badge>
      default: return <Badge variant="outline">{priority}</Badge>
    }
  }

  const getCategoryLabel = (category: string) => {
    const categories = {
      plumbing: "Plomberie",
      electrical: "Électricité",
      heating: "Chauffage",
      security: "Sécurité",
      other: "Autre",
    }
    return categories[category as keyof typeof categories] || category
  }

  const getUnreadCount = (incident: IncidentWithTickets) => {
    return incident.responses?.filter(response => 
      response.author_id !== userId && !response.is_read
    ).length || 0
  }

  const getLastActivity = (incident: IncidentWithTickets) => {
    if (!incident.responses || incident.responses.length === 0) {
      return incident.created_at
    }
    
    const lastResponse = incident.responses.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0]
    
    return lastResponse.created_at
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Hier"
    } else {
      return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (incidents.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun incident</h3>
          <p className="text-gray-500">
            {userType === "tenant" 
              ? "Vous n'avez signalé aucun incident pour le moment."
              : "Aucun incident n'a été signalé sur vos propriétés."
            }
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {incidents.map((incident) => {
        const unreadCount = getUnreadCount(incident)
        const lastActivity = getLastActivity(incident)
        
        return (
          <Card 
            key={incident.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              unreadCount > 0 ? "border-blue-200 bg-blue-50/30" : ""
            }`}
            onClick={() => onIncidentClick?.(incident.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getPriorityIcon(incident.priority)}
                    <h3 className="font-semibold text-lg">{incident.title}</h3>
                    {getStatusBadge(incident.status)}
                    {getPriorityBadge(incident.priority)}
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="animate-pulse">
                        {unreadCount} nouveau{unreadCount > 1 ? "x" : ""}
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-3 line-clamp-2">{incident.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      <span>{incident.property?.title}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>
                        {userType === "owner" 
                          ? `${incident.lease?.tenant?.first_name} ${incident.lease?.tenant?.last_name}`
                          : `${incident.lease?.owner?.first_name} ${incident.lease?.owner?.last_name}`
                        }
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Signalé le {formatTime(incident.created_at)}</span>
                    </div>
                    
                    {incident.responses && incident.responses.length > 0 && (
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>{incident.responses.length} message{incident.responses.length > 1 ? "s" : ""}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <div className="text-sm text-gray-500">
                    {formatTime(lastActivity)}
                  </div>
                  
                  {unreadCount > 0 && (
                    <div className="flex items-center gap-1 text-blue-600">
                      <MessageSquare className="h-4 w-4" />
                      <span className="text-sm font-medium">Nouveaux messages</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
