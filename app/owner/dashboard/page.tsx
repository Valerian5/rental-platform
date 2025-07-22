"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"
import { Building2, Users, Calendar, MessageSquare, Plus, Eye, Clock } from "lucide-react"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"

export default function OwnerDashboard() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [stats, setStats] = useState({
    properties: { total: 0, active: 0 },
    applications: { total: 0, pending: 0 },
    visits: { total: 0, upcoming: 0 },
    messages: { total: 0, unread: 0 },
  })
  const [recentApplications, setRecentApplications] = useState([])
  const [upcomingVisits, setUpcomingVisits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "owner") {
          router.push("/login")
          return
        }

        setCurrentUser(user)

        // Récupérer les statistiques
        const [propertiesRes, applicationsRes, visitsRes, conversationsRes] = await Promise.all([
          fetch(`/api/properties?owner_id=${user.id}`),
          fetch(`/api/applications?owner_id=${user.id}&limit=5`),
          fetch(`/api/visits?owner_id=${user.id}&limit=5`),
          fetch(`/api/conversations?user_id=${user.id}&limit=5`),
        ])

        if (propertiesRes.ok) {
          const propertiesData = await propertiesRes.json()
          setStats((prev) => ({
            ...prev,
            properties: {
              total: propertiesData.properties?.length || 0,
              active: propertiesData.properties?.filter((p: any) => p.status === "active").length || 0,
            },
          }))
        }

        if (applicationsRes.ok) {
          const applicationsData = await applicationsRes.json()
          setRecentApplications(applicationsData.applications || [])
          setStats((prev) => ({
            ...prev,
            applications: {
              total: applicationsData.total || 0,
              pending: applicationsData.applications?.filter((a: any) => a.status === "pending").length || 0,
            },
          }))
        }

        if (visitsRes.ok) {
          const visitsData = await visitsRes.json()
          setUpcomingVisits(visitsData.visits || [])
          setStats((prev) => ({
            ...prev,
            visits: {
              total: visitsData.total || 0,
              upcoming: visitsData.visits?.filter((v: any) => new Date(v.visit_date) > new Date()).length || 0,
            },
          }))
        }

        if (conversationsRes.ok) {
          const conversationsData = await conversationsRes.json()
          const totalMessages =
            conversationsData.conversations?.reduce(
              (acc: number, conv: any) => acc + (conv.messages?.length || 0),
              0,
            ) || 0
          const unreadMessages =
            conversationsData.conversations?.reduce((acc: number, conv: any) => {
              const unread = conv.messages?.filter((msg: any) => !msg.is_read && msg.sender_id !== user.id).length || 0
              return acc + unread
            }, 0) || 0

          setStats((prev) => ({
            ...prev,
            messages: {
              total: totalMessages,
              unread: unreadMessages,
            },
          }))
        }
      } catch (error) {
        console.error("Erreur chargement dashboard:", error)
        toast.error("Erreur lors du chargement du tableau de bord")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tableau de bord"
        description={`Bonjour ${currentUser?.first_name || ""} ! Vue d'ensemble de votre activité immobilière`}
      >
        <Button asChild className="w-full sm:w-auto">
          <Link href="/owner/properties/new">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Nouvelle annonce</span>
            <span className="sm:hidden">Nouvelle</span>
          </Link>
        </Button>
      </PageHeader>

      {/* Statistiques principales */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propriétés</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.properties.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.properties.active} active{stats.properties.active > 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Candidatures</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.applications.total}</div>
            <p className="text-xs text-muted-foreground">{stats.applications.pending} en attente</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visites</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.visits.total}</div>
            <p className="text-xs text-muted-foreground">{stats.visits.upcoming} à venir</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.messages.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.messages.unread} non lu{stats.messages.unread > 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full justify-start bg-transparent">
              <Link href="/owner/properties/new">
                <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                Créer une annonce
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start bg-transparent">
              <Link href="/owner/applications">
                <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                Voir les candidatures
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start bg-transparent">
              <Link href="/owner/visits">
                <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                Gérer les visites
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Candidatures récentes */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Candidatures récentes</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/owner/applications">
                <Eye className="h-4 w-4 mr-1 flex-shrink-0" />
                Tout voir
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentApplications.length > 0 ? (
              <div className="space-y-3">
                {recentApplications.slice(0, 3).map((application: any) => (
                  <div key={application.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {application.tenant?.first_name || ""} {application.tenant?.last_name || "Candidat"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{application.property?.title || "Propriété"}</p>
                    </div>
                    <Badge
                      variant={application.status === "pending" ? "secondary" : "outline"}
                      className="ml-2 text-xs flex-shrink-0"
                    >
                      {application.status === "pending" ? "En attente" : application.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Aucune candidature récente</p>
            )}
          </CardContent>
        </Card>

        {/* Visites à venir */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Visites à venir</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/owner/visits">
                <Eye className="h-4 w-4 mr-1 flex-shrink-0" />
                Tout voir
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingVisits.length > 0 ? (
              <div className="space-y-3">
                {upcomingVisits.slice(0, 3).map((visit: any) => (
                  <div key={visit.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{visit.visitor_name || "Visiteur"}</p>
                      <p className="text-xs text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate">
                          {visit.visit_date ? new Date(visit.visit_date).toLocaleDateString() : ""}
                          {visit.visit_time ? ` à ${visit.visit_time}` : ""}
                        </span>
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-2 text-xs flex-shrink-0">
                      {visit.status === "scheduled" ? "Programmée" : visit.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Aucune visite programmée</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
