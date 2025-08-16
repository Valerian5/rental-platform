"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Calendar,
  Heart,
  Search,
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface DashboardStats {
  applications: number
  favorites: number
  visits: number
  messages: number
}

interface RecentActivity {
  applications: any[]
  favorites: any[]
  visits: any[]
}

export default function TenantDashboard() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<DashboardStats>({
    applications: 0,
    favorites: 0,
    visits: 0,
    messages: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity>({
    applications: [],
    favorites: [],
    visits: [],
  })
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()
      if (!currentUser) {
        toast({
          title: "Erreur",
          description: "Vous devez être connecté pour accéder au tableau de bord",
          variant: "destructive",
        })
        return
      }

      setUser(currentUser)

      // Récupérer les vraies données depuis la DB
      const [applicationsRes, favoritesRes, visitsRes] = await Promise.all([
        fetch(`/api/applications/tenant?tenant_id=${currentUser.id}`).catch(() => ({ ok: false })),
        fetch(`/api/favorites?user_id=${currentUser.id}`).catch(() => ({ ok: false })),
        fetch(`/api/visits/tenant?tenant_id=${currentUser.id}`).catch(() => ({ ok: false })),
      ])

      const applications = applicationsRes.ok ? await applicationsRes.json() : { applications: [] }
      const favorites = favoritesRes.ok ? await favoritesRes.json() : { favorites: [] }
      const visits = visitsRes.ok ? await visitsRes.json() : { visits: [] }

      setStats({
        applications: applications.applications?.length || 0,
        favorites: favorites.favorites?.length || 0,
        visits: visits.visits?.length || 0,
        messages: 0, // À implémenter avec l'API messages
      })

      setRecentActivity({
        applications: applications.applications?.slice(0, 3) || [],
        favorites: favorites.favorites?.slice(0, 3) || [],
        visits: visits.visits?.slice(0, 3) || [],
      })
    } catch (error) {
      console.error("Erreur récupération données dashboard:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger certaines données du tableau de bord",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getApplicationStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            En analyse
          </Badge>
        )
      case "accepted":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Acceptée
          </Badge>
        )
      case "rejected":
        return <Badge variant="destructive">Refusée</Badge>
      case "visit_proposed":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            Visite proposée
          </Badge>
        )
      default:
        return <Badge variant="secondary">En cours</Badge>
    }
  }

  const getApplicationStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "accepted":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "rejected":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case "visit_proposed":
        return <Calendar className="h-4 w-4 text-blue-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement de votre tableau de bord...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête de bienvenue */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bonjour {user?.user_metadata?.first_name || user?.email?.split("@")[0] || "Locataire"} 👋
        </h1>
        <p className="text-gray-600">Voici un aperçu de votre activité de recherche de logement</p>
      </div>

      {/* Statistiques réelles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Candidatures</p>
                <p className="text-2xl font-bold text-gray-900">{stats.applications}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Favoris</p>
                <p className="text-2xl font-bold text-gray-900">{stats.favorites}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <Heart className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Visites</p>
                <p className="text-2xl font-bold text-gray-900">{stats.visits}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Messages</p>
                <p className="text-2xl font-bold text-gray-900">{stats.messages}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Actions rapides
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => (window.location.href = "/tenant/search")}
            >
              <Search className="h-6 w-6" />
              <span>Rechercher</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent"
              onClick={() => (window.location.href = "/tenant/profile/rental-file")}
            >
              <FileText className="h-6 w-6" />
              <span>Mon dossier de location</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent"
              onClick={() => (window.location.href = "/tenant/favorites")}
            >
              <Heart className="h-6 w-6" />
              <span>Mes favoris</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent"
              onClick={() => (window.location.href = "/tenant/applications")}
            >
              <Calendar className="h-6 w-6" />
              <span>Mes candidatures</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activité récente avec vraies données */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Candidatures récentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Candidatures récentes
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/tenant/applications")}>
              Voir tout
            </Button>
          </CardHeader>
          <CardContent>
            {recentActivity.applications.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Aucune candidature récente</p>
                <Button size="sm" onClick={() => (window.location.href = "/tenant/search")}>
                  <Plus className="h-4 w-4 mr-1" />
                  Rechercher des logements
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.applications.map((application) => (
                  <div key={application.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{application.property?.title || "Logement"}</p>
                      <p className="text-xs text-gray-600">{application.property?.address || "Adresse"}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(application.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getApplicationStatusIcon(application.status)}
                      {getApplicationStatusBadge(application.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Favoris récents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <Heart className="h-5 w-5 mr-2" />
              Favoris récents
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/tenant/favorites")}>
              Voir tout
            </Button>
          </CardHeader>
          <CardContent>
            {recentActivity.favorites.length === 0 ? (
              <div className="text-center py-8">
                <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Aucun favori récent</p>
                <Button size="sm" onClick={() => (window.location.href = "/tenant/search")}>
                  <Plus className="h-4 w-4 mr-1" />
                  Découvrir des logements
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.favorites.map((favorite) => (
                  <div key={favorite.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{favorite.property?.title || "Logement"}</p>
                      <p className="text-xs text-gray-600">{favorite.property?.address || "Adresse"}</p>
                      <p className="text-xs text-gray-500">
                        Ajouté le {new Date(favorite.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{favorite.property?.price || 0}€</p>
                      <p className="text-xs text-gray-500">par mois</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
