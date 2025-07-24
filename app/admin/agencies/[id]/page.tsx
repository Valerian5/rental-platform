"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Building2,
  ChevronLeft,
  Users,
  Home,
  Settings,
  BarChart3,
  Loader2,
  Edit,
  Palette,
  Globe,
  Phone,
  Mail,
  MapPin,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/lib/auth-service"
import { agencyApi, authenticatedFetch } from "@/lib/api-client"

interface Agency {
  id: string
  name: string
  description?: string
  logo_url?: string
  website?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  postal_code?: string
  country?: string
  primary_color: string
  secondary_color: string
  accent_color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface AgencyStats {
  properties: number
  applications: number
  visits: number
  leases: number
  revenue: number
}

export default function AgencyDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [agency, setAgency] = useState<Agency | null>(null)
  const [stats, setStats] = useState<AgencyStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAdminAuth()
    fetchAgencyDetails()
  }, [params.id])

  const checkAdminAuth = async () => {
    try {
      const user = await authService.getCurrentUser()
      if (!user || user.user_type !== "admin") {
        toast({
          title: "Access denied",
          description: "You don't have administrator permissions",
          variant: "destructive",
        })
        router.push("/")
      }
    } catch (error) {
      console.error("Error checking admin auth:", error)
      router.push("/login")
    }
  }

  const fetchAgencyDetails = async () => {
    try {
      setLoading(true)

      // Fetch agency details
      const agencyResult = await agencyApi.getById(params.id)
      if (!agencyResult.success) {
        throw new Error(agencyResult.error || "Failed to fetch agency details")
      }
      setAgency(agencyResult.agency)

      // Fetch agency statistics
      const statsResult = await authenticatedFetch(`/api/agencies/${params.id}/stats`)
      if (statsResult.success) {
        setStats(statsResult.stats)
      }
    } catch (error) {
      console.error("Error fetching agency details:", error)
      toast({
        title: "Error",
        description: "Failed to load agency details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!agency) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Agency not found</h3>
          <p className="text-muted-foreground mb-4">The requested agency could not be found</p>
          <Button asChild>
            <Link href="/admin/agencies">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Agencies
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/agencies">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              {agency.name}
            </h1>
            <p className="text-muted-foreground">Agency Management</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/admin/agencies/${params.id}/settings`}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/admin/agencies/${params.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Agency
            </Link>
          </Button>
        </div>
      </div>

      {/* Agency Overview */}
      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Agency Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={agency.logo_url || "/placeholder.svg"} alt={agency.name} />
                <AvatarFallback className="text-lg">{agency.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{agency.name}</h3>
                {agency.description && <p className="text-muted-foreground mt-1">{agency.description}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={agency.is_active ? "default" : "secondary"}>
                    {agency.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Created {new Date(agency.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {agency.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{agency.email}</span>
                </div>
              )}
              {agency.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{agency.phone}</span>
                </div>
              )}
              {agency.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={agency.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {agency.website}
                  </a>
                </div>
              )}
              {(agency.address || agency.city) && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {[agency.address, agency.city, agency.postal_code, agency.country].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Brand Colors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded border" style={{ backgroundColor: agency.primary_color }} />
              <div>
                <p className="text-sm font-medium">Primary</p>
                <p className="text-xs text-muted-foreground">{agency.primary_color}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded border" style={{ backgroundColor: agency.secondary_color }} />
              <div>
                <p className="text-sm font-medium">Secondary</p>
                <p className="text-xs text-muted-foreground">{agency.secondary_color}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded border" style={{ backgroundColor: agency.accent_color }} />
              <div>
                <p className="text-sm font-medium">Accent</p>
                <p className="text-xs text-muted-foreground">{agency.accent_color}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Properties</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.properties}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applications</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.applications}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visits</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.visits}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leases</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.leases}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{stats.revenue.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" asChild>
          <Link href={`/admin/agencies/${params.id}/users`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Manage Users
              </CardTitle>
              <CardDescription>Add, edit, and manage agency users and their roles</CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" asChild>
          <Link href={`/admin/agencies/${params.id}/properties`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                View Properties
              </CardTitle>
              <CardDescription>Browse and manage all properties for this agency</CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" asChild>
          <Link href={`/admin/agencies/${params.id}/settings`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Agency Settings
              </CardTitle>
              <CardDescription>Configure agency preferences and integrations</CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>
    </div>
  )
}
