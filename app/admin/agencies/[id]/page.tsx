"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { Building, Users, Home, FileText, Settings, ArrowLeft, Calendar, TrendingUp } from "lucide-react"

interface Agency {
  id: string
  name: string
  description: string
  address: string
  phone: string
  email: string
  website: string
  created_at: string
}

interface AgencyStats {
  agency: Agency
  counts: {
    users: number
    properties: number
    applications: number
    active_leases: number
    recent_applications: number
  }
}

export default function AgencyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const agencyId = params.id as string

  const [stats, setStats] = useState<AgencyStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAgencyStats()
  }, [agencyId])

  const fetchAgencyStats = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`/api/agencies/${agencyId}/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch agency stats")
      }

      const data = await response.json()
      setStats(data.stats)
    } catch (error) {
      console.error("Error fetching agency stats:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques de l'agence",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Chargement des informations...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Agence introuvable</h1>
          <p className="text-muted-foreground mt-2">
            Cette agence n'existe pas ou vous n'avez pas les permissions pour la voir.
          </p>
          <Button onClick={() => router.push("/admin/agencies")} className="mt-4">
            Retour aux agences
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => router.push("/admin/agencies")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{stats.agency.name}</h1>
          <p className="text-muted-foreground">Créée le {formatDate(stats.agency.created_at)}</p>
        </div>
        <Button onClick={() => router.push(`/admin/agencies/${agencyId}/settings`)}>
          <Settings className="h-4 w-4 mr-2" />
          Paramètres
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.agency.description && (
                <div className="md:col-span-2">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{stats.agency.description}</p>
                </div>
              )}
              {stats.agency.address && (
                <div>
                  <h3 className="font-semibold mb-2">Adresse</h3>
                  <p className="text-muted-foreground">{stats.agency.address}</p>
                </div>
              )}
              {stats.agency.phone && (
                <div>
                  <h3 className="font-semibold mb-2">Téléphone</h3>
                  <p className="text-muted-foreground">{stats.agency.phone}</p>
                </div>
              )}
              {stats.agency.email && (
                <div>
                  <h3 className="font-semibold mb-2">Email</h3>
                  <p className="text-muted-foreground">{stats.agency.email}</p>
                </div>
              )}
              {stats.agency.website && (
                <div>
                  <h3 className="font-semibold mb-2">Site web</h3>
                  <a
                    href={stats.agency.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {stats.agency.website}
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-muted-foreground" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Utilisateurs</p>
                  <p className="text-2xl font-bold">{stats.counts.users}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Home className="h-8 w-8 text-muted-foreground" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Propriétés</p>
                  <p className="text-2xl font-bold">{stats.counts.properties}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Candidatures</p>
                  <p className="text-2xl font-bold">{stats.counts.applications}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Baux actifs</p>
                  <p className="text-2xl font-bold">{stats.counts.active_leases}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activité récente */}
        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <CardDescription>Aperçu de l'activité des 30 derniers jours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">30 derniers jours</span>
              </div>
              <Badge variant="secondary">{stats.counts.recent_applications} nouvelles candidatures</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Actions rapides */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>Accédez rapidement aux différentes sections de gestion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-20 flex-col bg-transparent"
                onClick={() => router.push(`/admin/agencies/${agencyId}/users`)}
              >
                <Users className="h-6 w-6 mb-2" />
                Gérer les utilisateurs
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col bg-transparent"
                onClick={() => router.push(`/admin/agencies/${agencyId}/properties`)}
              >
                <Home className="h-6 w-6 mb-2" />
                Voir les propriétés
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col bg-transparent"
                onClick={() => router.push(`/admin/agencies/${agencyId}/settings`)}
              >
                <Settings className="h-6 w-6 mb-2" />
                Paramètres
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col bg-transparent"
                onClick={() => router.push(`/admin/agencies`)}
              >
                <Building className="h-6 w-6 mb-2" />
                Toutes les agences
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
