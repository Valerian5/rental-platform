"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Building2, Users, Settings, Edit } from "lucide-react"
import { agencyApi } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

interface Agency {
  id: string
  name: string
  logo_url?: string
  primary_color: string
  secondary_color: string
  accent_color: string
  created_at: string
  updated_at: string
}

export default function AgencyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [agency, setAgency] = useState<Agency | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchAgency(params.id as string)
    }
  }, [params.id])

  const fetchAgency = async (id: string) => {
    try {
      setLoading(true)
      console.log("🔍 Récupération de l'agence:", id)
      const result = await agencyApi.getById(id)
      console.log("📊 Résultat API:", result)

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch agency")
      }

      setAgency(result.agency)
      console.log("✅ Agence chargée:", result.agency.name)
    } catch (error) {
      console.error("Error fetching agency:", error)
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
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!agency) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold">Agency not found</h3>
          <Button onClick={() => router.push("/admin/agencies")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Agencies
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.push("/admin/agencies")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{agency.name}</h1>
          <p className="text-muted-foreground">Agency Management</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {agency.logo_url ? (
                  <img
                    src={agency.logo_url || "/placeholder.svg"}
                    alt={agency.name}
                    className="h-12 w-12 object-contain rounded"
                  />
                ) : (
                  <div
                    className="h-12 w-12 rounded flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: agency.primary_color }}
                  >
                    {agency.name.charAt(0)}
                  </div>
                )}
                <div>
                  <CardTitle className="text-2xl">{agency.name}</CardTitle>
                  <CardDescription>
                    Created on {new Date(agency.created_at).toLocaleDateString()} • Last updated{" "}
                    {new Date(agency.updated_at).toLocaleDateString()}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary">Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <h4 className="font-semibold mb-2">Brand Colors</h4>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: agency.primary_color }}></div>
                    <span className="text-sm">Primary: {agency.primary_color}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: agency.secondary_color }}></div>
                    <span className="text-sm">Secondary: {agency.secondary_color}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: agency.accent_color }}></div>
                    <span className="text-sm">Accent: {agency.accent_color}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Properties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-sm text-muted-foreground">Total properties managed</p>
              <Button variant="outline" className="w-full mt-4 bg-transparent">
                View Properties
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-sm text-muted-foreground">Active users</p>
              <Button variant="outline" className="w-full mt-4 bg-transparent">
                Manage Users
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Configure agency settings and preferences</p>
              <Button variant="outline" className="w-full bg-transparent">
                <Edit className="mr-2 h-4 w-4" />
                Edit Agency
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
