"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { authService } from "@/lib/auth-service"
import {
  Home,
  Users,
  Calendar,
  MessageSquare,
  Plus,
  TrendingUp,
  Euro,
  ArrowRight,
  Building,
  FileText,
  Settings,
} from "lucide-react"

const OwnerDashboard = () => {
  const router = useRouter()
  const [properties, setProperties] = useState([])
  const [applications, setApplications] = useState([])
  const [visits, setVisits] = useState([])
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({
    totalProperties: 0,
    availableProperties: 0,
    totalApplications: 0,
    pendingApplications: 0,
    upcomingVisits: 0,
    monthlyRevenue: 0,
  })

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        const currentUser = await authService.getCurrentUser()
        if (!currentUser) {
          router.push("/login")
          return
        }
        if (currentUser.user_type !== "owner") {
          router.push("/unauthorized")
          return
        }
        setUser(currentUser)
        await loadDashboardData(currentUser.id)
      } catch (error) {
        console.error("❌ Dashboard - Erreur auth:", error)
        router.push("/login")
      }
    }
    checkAuthAndLoadData()
  }, [router])

  const loadDashboardData = async (userId) => {
    try {
      setLoading(true)

      // Charger les propriétés
      const propertiesResponse = await fetch(`/api/properties?owner_id=${userId}`)
      if (propertiesResponse.ok) {
        const propertiesData = await propertiesResponse.json()
        const props = propertiesData.properties || []
        setProperties(props.slice(0, 6)) // Limiter à 6 pour l'affichage

        // Calculer les stats des propriétés
        setStats((prev) => ({
          ...prev,
          totalProperties: props.length,
          availableProperties: props.filter((p) => p.available).length,
          monthlyRevenue: props.reduce((sum, p) => sum + (p.price || 0), 0),
        }))
      }

      // Charger les candidatures
      const applicationsResponse = await fetch(`/api/applications?owner_id=${userId}`)
      if (applicationsResponse.ok) {
        const applicationsData = await applicationsResponse.json()
        const apps = applicationsData.applications || []
        setApplications(apps.slice(0, 5)) // Limiter à 5 pour l'affichage

        setStats((prev) => ({
          ...prev,
          totalApplications: apps.length,
          pendingApplications: apps.filter((a) => a.status === "pending").length,
        }))
      }

      // Charger les visites
      const visitsResponse = await fetch(`/api/visits?owner_id=${userId}`)
      if (visitsResponse.ok) {
        const visitsData = await visitsResponse.json()
        const visits = visitsData.visits || []
        setVisits(visits.slice(0, 5))

        const upcoming = visits.filter((v) => new Date(v.visit_date) > new Date()).length
        setStats((prev) => ({
          ...prev,
          upcomingVisits: upcoming,
        }))
      }

      // Charger les conversations
      const conversationsResponse = await fetch(`/api/conversations?user_id=${userId}`)
      if (conversationsResponse.ok) {
        const conversationsData = await conversationsResponse.json()
        setConversations(conversationsData.conversations?.slice(0, 4) || [])
      }
    } catch (error) {
      console.error("❌ Erreur chargement dashboard:", error)
      toast.error("Erreur lors du chargement des données")
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Chargement du tableau de bord...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground">Bienvenue {user.first_name}, voici un aperçu de votre activité</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/owner/properties/new">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un bien
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/owner/properties">
              <Building className="h-4 w-4 mr-2" />
              Mes biens
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propriétés totales</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-16" /> : stats.totalProperties}
            </div>
            <p className="text-xs text-muted-foreground">{stats.availableProperties} disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Candidatures</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-16" /> : stats.totalApplications}
            </div>
            <p className="text-xs text-muted-foreground">{stats.pendingApplications} en attente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visites prévues</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-16" /> : stats.upcomingVisits}
            </div>
            <p className="text-xs text-muted-foreground">Ce mois-ci</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus mensuels</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-20" /> : `${stats.monthlyRevenue.toLocaleString()}€`}
            </div>
            <p className="text-xs text-muted-foreground">Loyers estimés</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Propriétés récentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Mes propriétés
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/owner/properties">
                Voir tout <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))
            ) : properties.length > 0 ? (
              properties.map((property) => (
                <div key={property.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center">
                      <Home className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium line-clamp-1">{property.title}</p>
                      <p className="text-sm text-muted-foreground">{property.city}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{property.price?.toLocaleString()}€</p>
                    <Badge variant={property.available ? "default" : "secondary"}>
                      {property.available ? "Disponible" : "Loué"}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <Building className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Aucune propriété</p>
                <Button asChild size="sm" className="mt-2">
                  <Link href="/owner/properties/new">Ajouter votre première propriété</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Candidatures récentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Candidatures récentes
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/owner/applications">
                Voir tout <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))
            ) : applications.length > 0 ? (
              applications.map((application) => (
                <div key={application.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{application.tenant?.name || "Candidat"}</p>
                      <p className="text-sm text-muted-foreground">{application.property?.title || "Propriété"}</p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      application.status === "pending"
                        ? "secondary"
                        : application.status === "approved"
                          ? "default"
                          : "destructive"
                    }
                  >
                    {application.status === "pending"
                      ? "En attente"
                      : application.status === "approved"
                        ? "Approuvée"
                        : "Refusée"}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Aucune candidature</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visites planifiées */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Visites planifiées
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/owner/visits">
                Voir tout <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))
            ) : visits.length > 0 ? (
              visits.map((visit) => (
                <div key={visit.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-green-100 rounded flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{visit.property?.title || "Propriété"}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(visit.visit_date).toLocaleDateString()} à {visit.start_time}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{visit.status || "Planifiée"}</Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Aucune visite planifiée</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions rapides */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Actions rapides
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/owner/properties/new">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une propriété
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/owner/applications">
                <FileText className="h-4 w-4 mr-2" />
                Gérer les candidatures
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/owner/visits">
                <Calendar className="h-4 w-4 mr-2" />
                Planifier des visites
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/messaging">
                <MessageSquare className="h-4 w-4 mr-2" />
                Messages
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/owner/statistics">
                <TrendingUp className="h-4 w-4 mr-2" />
                Statistiques
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default OwnerDashboard
