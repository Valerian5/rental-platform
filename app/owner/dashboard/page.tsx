"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, Calendar, TrendingUp, AlertTriangle } from "lucide-react"
import { authService } from "@/lib/auth-service"
import { useRouter } from "next/navigation"

export default function OwnerDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({
    properties: 0,
    applications: 0,
    visits: 0,
    messages: 0,
    activeLeases: 0,
    monthlyRevenue: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser()
        if (!currentUser || currentUser.user_type !== "owner") {
          router.push("/login")
          return
        }
        setUser(currentUser)
        await loadRealStats(currentUser.id)
      } catch (error) {
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [router])

  const loadRealStats = async (ownerId: string) => {
    try {
      // Charger les vraies statistiques depuis la DB
      const [propertiesRes, applicationsRes, visitsRes, leasesRes] = await Promise.all([
        fetch(`/api/properties/owner?owner_id=${ownerId}`),
        fetch(`/api/applications?owner_id=${ownerId}`),
        fetch(`/api/visits?owner_id=${ownerId}`),
        fetch(`/api/leases?owner_id=${ownerId}`),
      ])

      const properties = propertiesRes.ok ? await propertiesRes.json() : { properties: [] }
      const applications = applicationsRes.ok ? await applicationsRes.json() : { applications: [] }
      const visits = visitsRes.ok ? await visitsRes.json() : { visits: [] }
      const leases = leasesRes.ok ? await leasesRes.json() : { leases: [] }

      // Calculer les revenus mensuels réels
      const activeLeases = leases.leases?.filter((lease) => lease.status === "active") || []
      const monthlyRevenue = activeLeases.reduce((sum, lease) => sum + (lease.monthly_rent || 0), 0)

      setStats({
        properties: properties.properties?.length || 0,
        applications: applications.applications?.length || 0,
        visits: visits.visits?.length || 0,
        messages: 0, // À implémenter avec l'API messages
        activeLeases: activeLeases.length,
        monthlyRevenue,
      })
    } catch (error) {
      console.error("Erreur chargement statistiques:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tableau de bord Propriétaire</h1>
        <p className="text-gray-600">Bienvenue {user.first_name} !</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mes Biens</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.properties}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeLeases} loué{stats.activeLeases > 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Candidatures</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.applications}</div>
            <p className="text-xs text-muted-foreground">Total reçues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visites</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.visits}</div>
            <p className="text-xs text-muted-foreground">Programmées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus mensuels</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthlyRevenue}€</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeLeases} bail{stats.activeLeases > 1 ? "x" : ""} actif{stats.activeLeases > 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      {stats.properties === 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <h3 className="font-medium text-amber-900">Commencez par ajouter vos biens</h3>
                <p className="text-sm text-amber-700">
                  Ajoutez vos premières propriétés pour commencer à recevoir des candidatures.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
