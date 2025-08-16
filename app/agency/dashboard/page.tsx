"use client"

import { CardFooter } from "@/components/ui/card"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Building2,
  Home,
  Users,
  Calendar,
  FileText,
  BarChart3,
  ChevronRight,
  Loader2,
  MessageSquare,
  Bell,
  Search,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/lib/auth-service"

interface Agency {
  id: string
  name: string
  logo_url?: string
  primary_color: string
  secondary_color: string
  accent_color: string
}

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  agency_id: string
  roles: { id: string; name: string }[]
}

export default function AgencyDashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [agency, setAgency] = useState<Agency | null>(null)
  const [stats, setStats] = useState({
    properties: 0,
    applications: 0,
    visits: 0,
    leases: 0,
    performance: 0,
  })

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      setLoading(true)
      const currentUser = await authService.getCurrentUser()

      if (!currentUser) {
        router.push("/login")
        return
      }

      if (currentUser.user_type !== "agency" || !currentUser.agency_id) {
        toast({
          title: "Access denied",
          description: "You don't have agency access",
          variant: "destructive",
        })
        router.push("/")
        return
      }

      setUser(currentUser as User)

      // Fetch agency details
      const agencyResponse = await fetch(`/api/agencies/${currentUser.agency_id}`)
      const agencyResult = await agencyResponse.json()

      if (!agencyResult.success) {
        throw new Error(agencyResult.error || "Failed to fetch agency details")
      }

      setAgency(agencyResult.agency)

      // Fetch agency stats
      await fetchAgencyStats(currentUser.agency_id)
    } catch (error) {
      console.error("Error checking auth:", error)
      toast({
        title: "Error",
        description: "Failed to load dashboard",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchAgencyStats = async (agencyId: string) => {
    try {
      // Charger les vraies statistiques depuis l'API
      const [propertiesRes, applicationsRes, visitsRes, leasesRes] = await Promise.all([
        fetch(`/api/agencies/${agencyId}/properties`).catch(() => ({ ok: false })),
        fetch(`/api/applications?agency_id=${agencyId}`).catch(() => ({ ok: false })),
        fetch(`/api/visits?agency_id=${agencyId}`).catch(() => ({ ok: false })),
        fetch(`/api/leases?agency_id=${agencyId}`).catch(() => ({ ok: false })),
      ])

      const properties = propertiesRes.ok ? await propertiesRes.json() : { properties: [] }
      const applications = applicationsRes.ok ? await applicationsRes.json() : { applications: [] }
      const visits = visitsRes.ok ? await visitsRes.json() : { visits: [] }
      const leases = leasesRes.ok ? await leasesRes.json() : { leases: [] }

      const activeLeases = leases.leases?.filter((lease: any) => lease.status === "active") || []
      const totalRevenue = activeLeases.reduce((sum: number, lease: any) => sum + (lease.monthly_rent || 0), 0)
      const occupancyRate =
        properties.properties?.length > 0 ? (activeLeases.length / properties.properties.length) * 100 : 0

      setStats({
        properties: properties.properties?.length || 0,
        applications: applications.applications?.length || 0,
        visits: visits.visits?.length || 0,
        leases: activeLeases.length,
        performance: Math.round(occupancyRate),
      })
    } catch (error) {
      console.error("Error fetching agency stats:", error)
      // Fallback avec des valeurs par défaut
      setStats({
        properties: 0,
        applications: 0,
        visits: 0,
        leases: 0,
        performance: 0,
      })
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user || !agency) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Agency not found</h3>
          <p className="text-muted-foreground mb-4">Unable to load agency dashboard</p>
          <Button asChild>
            <Link href="/">Go to Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord Agence</h1>
          <p className="text-gray-600">Bienvenue {user.first_name} !</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-10 w-64" />
          </div>
          <Button variant="outline" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <Avatar>
            <AvatarFallback style={{ backgroundColor: agency.primary_color, color: "white" }}>
              {user.first_name[0]}
              {user.last_name[0]}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propriétés</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.properties}</div>
            <p className="text-xs text-muted-foreground">8 available for rent</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.applications}</div>
            <p className="text-xs text-muted-foreground">5 new this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visites</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.visits}</div>
            <p className="text-xs text-muted-foreground">3 today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.performance}%</div>
            <p className="text-xs text-muted-foreground">Taux de location</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.properties === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Aucune activité récente</p>
                <p className="text-sm text-gray-400">Commencez par ajouter des propriétés pour voir l'activité</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-blue-100 p-2">
                    <Home className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{stats.properties} propriétés gérées</p>
                    <p className="text-xs text-muted-foreground">Portfolio actuel</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-green-100 p-2">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{stats.applications} candidatures reçues</p>
                    <p className="text-xs text-muted-foreground">Total des demandes</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-purple-100 p-2">
                    <FileText className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{stats.leases} baux actifs</p>
                    <p className="text-xs text-muted-foreground">Contrats en cours</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
              <Link href="/agency/properties/new">
                <Home className="mr-2 h-4 w-4" />
                Add Property
              </Link>
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
              <Link href="/agency/applications">
                <Users className="mr-2 h-4 w-4" />
                Review Applications
              </Link>
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
              <Link href="/agency/visits">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Visit
              </Link>
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
              <Link href="/agency/leases">
                <FileText className="mr-2 h-4 w-4" />
                Manage Leases
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Properties
            </CardTitle>
            <CardDescription>Manage your property portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View and manage all properties in your portfolio. Add new listings, update details, and track
              availability.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/agency/properties">
                View Properties
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Applications
            </CardTitle>
            <CardDescription>Review tenant applications</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Review and process rental applications. View tenant profiles, documents, and make decisions.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/agency/applications">
                View Applications
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Visits
            </CardTitle>
            <CardDescription>Manage property visits</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Schedule and manage property visits. View upcoming appointments and coordinate with tenants.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/agency/visits">
                View Visits
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Leases
            </CardTitle>
            <CardDescription>Manage rental agreements</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Create, manage, and track rental agreements. Generate documents and monitor lease status.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/agency/leases">
                View Leases
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Messages
            </CardTitle>
            <CardDescription>Communicate with tenants</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Manage communications with tenants and property owners. View conversations and respond to inquiries.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/agency/messages">
                View Messages
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics
            </CardTitle>
            <CardDescription>View performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Track key metrics and performance indicators. View reports on properties, applications, and revenue.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/agency/analytics">
                View Analytics
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
