"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  MessageSquare, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Users,
  TrendingUp,
  Bell,
  BellOff
} from "lucide-react"
import { incidentTicketingService } from "@/lib/incident-ticketing-service"
import { toast } from "sonner"

interface IncidentTicketingDashboardProps {
  userId: string
  userType: "owner" | "tenant"
}

interface DashboardStats {
  totalIncidents: number
  activeIncidents: number
  resolvedIncidents: number
  totalTickets: number
  unreadTickets: number
  recentActivity: Array<{
    incident_id: string
    incident_title: string
    last_message: string
    last_activity: string
    unread_count: number
  }>
}

export default function IncidentTicketingDashboard({ 
  userId, 
  userType 
}: IncidentTicketingDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    loadDashboardData()
  }, [userId, userType])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Charger les incidents avec leurs tickets
      const incidents = await incidentTicketingService.getUserIncidentsWithTickets(userId, userType)
      
      // Calculer les statistiques
      const totalIncidents = incidents.length
      const activeIncidents = incidents.filter(incident => 
        !["resolved", "closed"].includes(incident.status)
      ).length
      const resolvedIncidents = incidents.filter(incident => 
        incident.status === "resolved"
      ).length
      
      const totalTickets = incidents.reduce((sum, incident) => 
        sum + (incident.responses?.length || 0), 0
      )
      
      const unreadTickets = incidents.reduce((sum, incident) => 
        sum + (incident.responses?.filter(response => 
          response.author_id !== userId && !response.is_read
        ).length || 0), 0
      )
      
      // Activité récente
      const recentActivity = incidents
        .filter(incident => incident.responses && incident.responses.length > 0)
        .map(incident => {
          const lastResponse = incident.responses!.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0]
          
          const unreadCount = incident.responses!.filter(response => 
            response.author_id !== userId && !response.is_read
          ).length
          
          return {
            incident_id: incident.id,
            incident_title: incident.title,
            last_message: lastResponse.message,
            last_activity: lastResponse.created_at,
            unread_count: unreadCount
          }
        })
        .sort((a, b) => new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime())
        .slice(0, 5)
      
      setStats({
        totalIncidents,
        activeIncidents,
        resolvedIncidents,
        totalTickets,
        unreadTickets,
        recentActivity
      })
    } catch (error) {
      console.error("❌ Erreur chargement dashboard:", error)
      toast.error("Erreur lors du chargement du dashboard")
    } finally {
      setLoading(false)
    }
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
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
          <p className="text-gray-500 mb-4">Impossible de charger les données du dashboard</p>
          <Button onClick={loadDashboardData}>Réessayer</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total incidents</p>
                <p className="text-2xl font-bold">{stats.totalIncidents}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Incidents actifs</p>
                <p className="text-2xl font-bold text-orange-600">{stats.activeIncidents}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Résolus</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolvedIncidents}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Messages</p>
                <p className="text-2xl font-bold">{stats.totalTickets}</p>
                {stats.unreadTickets > 0 && (
                  <Badge variant="destructive" className="mt-1">
                    {stats.unreadTickets} non lus
                  </Badge>
                )}
              </div>
              {stats.unreadTickets > 0 ? (
                <Bell className="h-8 w-8 text-red-600" />
              ) : (
                <BellOff className="h-8 w-8 text-gray-400" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="activity">Activité récente</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Statistiques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Taux de résolution</span>
                    <span className="font-semibold">
                      {stats.totalIncidents > 0 
                        ? Math.round((stats.resolvedIncidents / stats.totalIncidents) * 100)
                        : 0
                      }%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Messages par incident</span>
                    <span className="font-semibold">
                      {stats.totalIncidents > 0 
                        ? Math.round(stats.totalTickets / stats.totalIncidents * 10) / 10
                        : 0
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Messages non lus</span>
                    <span className="font-semibold text-red-600">{stats.unreadTickets}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Répartition
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Incidents actifs</span>
                    <Badge variant="secondary">{stats.activeIncidents}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Incidents résolus</span>
                    <Badge className="bg-green-600">{stats.resolvedIncidents}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total incidents</span>
                    <Badge variant="outline">{stats.totalIncidents}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Activité récente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucune activité récente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{activity.incident_title}</h4>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {activity.last_message}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <span>{formatTime(activity.last_activity)}</span>
                          {activity.unread_count > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {activity.unread_count} nouveau{activity.unread_count > 1 ? "x" : ""}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Fonctionnalité en développement</p>
                <p className="text-sm">Bientôt disponible</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
