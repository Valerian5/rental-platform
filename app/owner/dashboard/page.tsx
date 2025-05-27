"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { authService } from "@/lib/auth-service"
import {
  Building2,
  Users,
  Calendar,
  Euro,
  TrendingUp,
  AlertCircle,
  Plus,
  Eye,
  MessageSquare,
  Clock,
} from "lucide-react"

interface DashboardStats {
  totalProperties: number
  activeProperties: number
  pendingApplications: number
  scheduledVisits: number
  monthlyRevenue: number
  occupancyRate: number
  pendingPayments: number
  unreadMessages: number
}

interface RecentActivity {
  id: string
  type: "application" | "visit" | "payment" | "message"
  title: string
  description: string
  time: string
  status?: string
}

export default function OwnerDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    activeProperties: 0,
    pendingApplications: 0,
    scheduledVisits: 0,
    monthlyRevenue: 0,
    occupancyRate: 0,
    pendingPayments: 0,
    unreadMessages: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [recentProperties, setRecentProperties] = useState([])

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      console.log("🔍 Dashboard - Vérification auth...")

      const currentUser = await authService.getCurrentUser()
      console.log("👤 Dashboard - Utilisateur:", currentUser)

      if (!currentUser) {
        console.log("❌ Dashboard - Pas d'utilisateur, redirection login")
        router.push("/login")
        return
      }

      if (currentUser.user_type !== "owner") {
        console.log("❌ Dashboard - Pas propriétaire, redirection")
        router.push("/")
        return
      }

      console.log("✅ Dashboard - Utilisateur propriétaire authentifié")
      setUser(currentUser)
      await loadDashboardData(currentUser.id)
    } catch (error) {
      console.error("❌ Dashboard - Erreur auth:", error)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardData = async (userId: string) => {
    try {
      console.log("📊 Dashboard - Chargement données pour:", userId)

      // Charger les données en parallèle
      await Promise.all([loadProperties(userId), loadApplications(userId), loadVisits(userId), loadMessages(userId)])

      console.log("✅ Dashboard - Données chargées")
    } catch (error) {
      console.error("❌ Dashboard - Erreur chargement:", error)
      toast.error("Erreur lors du chargement des données")
    }
  }

  const loadProperties = async (userId: string) => {
    try {
      const response = await fetch(`/api/properties?owner_id=${userId}`)
      if (response.ok) {
        const data = await response.json()
        const properties = data.properties || []
        setRecentProperties(properties.slice(0, 3))

        setStats((prev) => ({
          ...prev,
          totalProperties: properties.length,
          activeProperties: properties.filter((p: any) => p.status === "active").length,
          occupancyRate:
            properties.length > 0
              ? (properties.filter((p: any) => p.status === "rented").length / properties.length) * 100
              : 0,
        }))
      }
    } catch (error) {
      console.error("Erreur chargement propriétés:", error)
    }
  }

  const loadApplications = async (userId: string) => {
    try {
      const response = await fetch(`/api/applications?owner_id=${userId}`)
      if (response.ok) {
        const data = await response.json()
        const applications = data.applications || []

        setStats((prev) => ({
          ...prev,
          pendingApplications: applications.filter((a: any) => a.status === "pending").length,
        }))

        // Ajouter aux activités récentes
        const recentApps = applications.slice(0, 2).map((app: any) => ({
          id: app.id,
          type: "application" as const,
          title: "Nouvelle candidature",
          description: `${app.tenant_name} pour ${app.property_title}`,
          time: new Date(app.created_at).toLocaleDateString(),
          status: app.status,
        }))

        setRecentActivity((prev) => [...prev, ...recentApps])
      }
    } catch (error) {
      console.error("Erreur chargement candidatures:", error)
    }
  }

  const loadVisits = async (userId: string) => {
    try {
      const response = await fetch(`/api/visits?owner_id=${userId}`)
      if (response.ok) {
        const data = await response.json()
        const visits = data.visits || []

        setStats((prev) => ({
          ...prev,
          scheduledVisits: visits.filter((v: any) => v.status === "scheduled").length,
        }))

        // Ajouter aux activités récentes
        const recentVisits = visits.slice(0, 2).map((visit: any) => ({
          id: visit.id,
          type: "visit" as const,
          title: "Visite programmée",
          description: `${visit.property_title} - ${visit.visitor_name}`,
          time: new Date(visit.visit_date).toLocaleDateString(),
          status: visit.status,
        }))

        setRecentActivity((prev) => [...prev, ...recentVisits])
      }
    } catch (error) {
      console.error("Erreur chargement visites:", error)
    }
  }

  const loadMessages = async (userId: string) => {
    try {
      const response = await fetch(`/api/conversations?user_id=${userId}`)
      if (response.ok) {
        const data = await response.json()
        const conversations = data.conversations || []

        setStats((prev) => ({
          ...prev,
          unreadMessages: conversations.filter((c: any) => c.unread_count > 0).length,
        }))
      }
    } catch (error) {
      console.error("Erreur chargement messages:", error)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "application":
        return <Users className="h-4 w-4" />
      case "visit":
        return <Calendar className="h-4 w-4" />
      case "payment":
        return <Euro className="h-4 w-4" />
      case "message":
        return <MessageSquare className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Affichage de chargement
  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Contenu principal du dashboard
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Bonjour {user?.first_name} ! Vue d'ensemble de votre activité immobilière
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/owner/properties/new">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle annonce
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propriétés</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProperties}</div>
            <p className="text-xs text-muted-foreground">{stats.activeProperties} actives</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Candidatures</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApplications}</div>
            <p className="text-xs text-muted-foreground">En attente de traitement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visites</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scheduledVisits}</div>
            <p className="text-xs text-muted-foreground">Programmées ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'occupation</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.occupancyRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">De vos propriétés</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <CardDescription>Dernières actions sur vos propriétés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {activity.status && (
                        <Badge variant="secondary" className={getStatusColor(activity.status)}>
                          {activity.status}
                        </Badge>
                      )}
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {activity.time}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Aucune activité récente</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>Accès direct aux fonctions principales</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/owner/properties">
                <Building2 className="h-4 w-4 mr-2" />
                Gérer mes annonces
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/owner/applications">
                <Users className="h-4 w-4 mr-2" />
                Voir les candidatures
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/owner/visits">
                <Calendar className="h-4 w-4 mr-2" />
                Planning des visites
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/messaging">
                <MessageSquare className="h-4 w-4 mr-2" />
                Messages
                {stats.unreadMessages > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {stats.unreadMessages}
                  </Badge>
                )}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Properties */}
      {recentProperties.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Mes dernières annonces</CardTitle>
              <CardDescription>Propriétés récemment ajoutées</CardDescription>
            </div>
            <Button asChild variant="outline">
              <Link href="/owner/properties">
                <Eye className="h-4 w-4 mr-2" />
                Voir tout
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {recentProperties.map((property: any) => (
                <Card key={property.id} className="overflow-hidden">
                  <div className="aspect-video bg-muted">
                    {property.images && property.images[0] ? (
                      <img
                        src={property.images[0] || "/placeholder.svg"}
                        alt={property.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold truncate">{property.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">{property.address}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-lg">{property.price}€</span>
                      <Badge variant={property.status === "active" ? "default" : "secondary"}>{property.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}