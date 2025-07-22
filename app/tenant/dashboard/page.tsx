"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"
import { Search, Heart, FileText, Calendar, MessageSquare, Eye, Clock, MapPin, Building2 } from "lucide-react"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"

export default function TenantDashboard() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [stats, setStats] = useState({
    applications: { total: 0, pending: 0 },
    visits: { total: 0, upcoming: 0 },
    favorites: { total: 0 },
    messages: { total: 0, unread: 0 },
  })
  const [recentApplications, setRecentApplications] = useState([])
  const [upcomingVisits, setUpcomingVisits] = useState([])
  const [recentFavorites, setRecentFavorites] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "tenant") {
          router.push("/login")
          return
        }

        setCurrentUser(user)

        // Récupérer les statistiques
        const [applicationsRes, visitsRes, favoritesRes, messagesRes] = await Promise.all([
          fetch(`/api/applications/tenant?tenant_id=${user.id}&limit=5`),
          fetch(`/api/visits/tenant?tenant_id=${user.id}&limit=5`),
          fetch(`/api/favorites?user_id=${user.id}&limit=5`),
          fetch(`/api/messages?user_id=${user.id}&limit=5`),
        ])

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

        if (favoritesRes.ok) {
          const favoritesData = await favoritesRes.json()
          setRecentFavorites(favoritesData.favorites || [])
          setStats((prev) => ({
            ...prev,
            favorites: {
              total: favoritesData.total || 0,
            },
          }))
        }

        if (messagesRes.ok) {
          const messagesData = await messagesRes.json()
          setStats((prev) => ({
            ...prev,
            messages: {
              total: messagesData.total || 0,
              unread: messagesData.unread || 0,
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
        description={`Bonjour ${currentUser?.first_name} ! Trouvez votre logement idéal`}
      >
        <Button asChild className="w-full sm:w-auto">
          <Link href="/tenant/search">
            <Search className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Rechercher un logement</span>
            <span className="sm:hidden">Rechercher</span>
          </Link>
        </Button>
      </PageHeader>

      {/* Statistiques principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Candidatures</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.applications.total}</div>
            <p className="text-xs text-muted-foreground">{stats.applications.pending} en attente</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visites</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.visits.total}</div>
            <p className="text-xs text-muted-foreground">{stats.visits.upcoming} à venir</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favoris</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.favorites.total}</div>
            <p className="text-xs text-muted-foreground">Logements sauvegardés</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
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
              <Link href="/tenant/search">
                <Search className="h-4 w-4 mr-2" />
                Rechercher un logement
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start bg-transparent">
              <Link href="/tenant/applications">
                <FileText className="h-4 w-4 mr-2" />
                Mes candidatures
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start bg-transparent">
              <Link href="/tenant/visits">
                <Calendar className="h-4 w-4 mr-2" />
                Mes visites
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Candidatures récentes */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Mes candidatures</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/tenant/applications">
                <Eye className="h-4 w-4 mr-1" />
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
                      <p className="text-sm font-medium truncate">{application.property?.title || "Logement"}</p>
                      <p className="text-xs text-gray-500 truncate">{application.property?.address}</p>
                    </div>
                    <Badge
                      variant={application.status === "pending" ? "secondary" : "outline"}
                      className="ml-2 text-xs"
                    >
                      {application.status === "pending" ? "En attente" : application.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Aucune candidature</p>
            )}
          </CardContent>
        </Card>

        {/* Visites à venir */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Visites à venir</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/tenant/visits">
                <Eye className="h-4 w-4 mr-1" />
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
                      <p className="text-sm font-medium truncate">{visit.property?.title || "Logement"}</p>
                      <p className="text-xs text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(visit.visit_date).toLocaleDateString()} à {visit.visit_time}
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-2 text-xs">
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

      {/* Favoris récents */}
      {recentFavorites.length > 0 && (
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Mes favoris récents</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/tenant/favorites">
                <Eye className="h-4 w-4 mr-1" />
                Tout voir
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentFavorites.slice(0, 3).map((favorite: any) => (
                <div key={favorite.id} className="border rounded-lg p-3 hover:shadow-sm transition-shadow">
                  <div className="aspect-video bg-gray-200 rounded mb-2 overflow-hidden">
                    {favorite.property?.property_images?.[0] ? (
                      <img
                        src={favorite.property.property_images[0].url || "/placeholder.svg"}
                        alt={favorite.property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <h4 className="font-medium text-sm truncate">{favorite.property?.title}</h4>
                  <p className="text-xs text-gray-500 flex items-center mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span className="truncate">{favorite.property?.address}</span>
                  </p>
                  <p className="text-sm font-semibold text-blue-600 mt-1">
                    {favorite.property?.rent?.toLocaleString()} €/mois
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
