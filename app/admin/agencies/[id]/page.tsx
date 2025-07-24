"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Building2,
  Users,
  Home,
  Settings,
  ChevronLeft,
  Save,
  Loader2,
  PaintBucket,
  ImageIcon,
  FileText,
  BarChart3,
  Mail,
  Palette,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/lib/auth-service"
import { agencyApi } from "@/lib/api-client"

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

interface AgencyRole {
  id: string
  name: string
  permissions: Record<string, boolean>
}

interface AgencyUser {
  id: string
  email: string
  first_name: string
  last_name: string
  user_type: string
  created_at: string
}

export default function AgencyDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [agency, setAgency] = useState<Agency | null>(null)
  const [roles, setRoles] = useState<AgencyRole[]>([])
  const [users, setUsers] = useState<AgencyUser[]>([])
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    logo_url: "",
    primary_color: "#0066FF",
    secondary_color: "#FF6B00",
    accent_color: "#00C48C",
  })

  useEffect(() => {
    checkAdminAuth()
    fetchAgencyDetails()
  }, [params.id])

  const checkAdminAuth = async () => {
    try {
      console.log("🔐 Vérification des droits admin...")
      const user = await authService.getCurrentUser()
      console.log("👤 Utilisateur actuel:", user)

      if (!user || user.user_type !== "admin") {
        console.log("❌ Accès refusé - pas admin")
        toast({
          title: "Access denied",
          description: "You don't have administrator permissions",
          variant: "destructive",
        })
        router.push("/")
        return
      }

      console.log("✅ Utilisateur admin confirmé")
    } catch (error) {
      console.error("❌ Error checking admin auth:", error)
      toast({
        title: "Authentication error",
        description: "Please log in again",
        variant: "destructive",
      })
      router.push("/login")
    }
  }

  const fetchAgencyDetails = async () => {
    try {
      console.log("📋 Récupération des détails de l'agence:", params.id)
      setLoading(true)

      const result = await agencyApi.getById(params.id)
      console.log("📊 Résultat API:", result)

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch agency details")
      }

      setAgency(result.agency)
      setRoles(result.roles || [])
      setUsers(result.users || [])

      // Initialize form data
      setFormData({
        name: result.agency.name,
        logo_url: result.agency.logo_url || "",
        primary_color: result.agency.primary_color,
        secondary_color: result.agency.secondary_color,
        accent_color: result.agency.accent_color,
      })

      console.log("✅ Détails de l'agence chargés")
    } catch (error) {
      console.error("❌ Error fetching agency details:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load agency details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateAgency = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSaving(true)

      if (!formData.name.trim()) {
        toast({
          title: "Error",
          description: "Agency name is required",
          variant: "destructive",
        })
        return
      }

      console.log("💾 Mise à jour de l'agence:", formData)
      const result = await agencyApi.update(params.id, formData)

      if (!result.success) {
        throw new Error(result.error || "Failed to update agency")
      }

      toast({
        title: "Success",
        description: "Agency updated successfully",
      })

      // Update local state
      setAgency({
        ...agency!,
        ...formData,
        updated_at: new Date().toISOString(),
      })

      console.log("✅ Agence mise à jour avec succès")
    } catch (error) {
      console.error("❌ Error updating agency:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update agency",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
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
              {agency.logo_url ? (
                <img
                  src={agency.logo_url || "/placeholder.svg"}
                  alt={agency.name}
                  className="h-8 w-8 object-contain rounded"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg?height=32&width=32&text=A"
                  }}
                />
              ) : (
                <div
                  className="h-8 w-8 rounded flex items-center justify-center text-white"
                  style={{ backgroundColor: agency.primary_color }}
                >
                  {agency.name.charAt(0)}
                </div>
              )}
              {agency.name}
            </h1>
            <p className="text-muted-foreground">Last updated on {new Date(agency.updated_at).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/agencies/${agency.id}/users`}>
              <Users className="mr-2 h-4 w-4" />
              Manage Users
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/admin/agencies/${agency.id}/properties`}>
              <Home className="mr-2 h-4 w-4" />
              Properties
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">
            <Settings className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="branding">
            <Palette className="mr-2 h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Users className="mr-2 h-4 w-4" />
            Roles & Permissions
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="mr-2 h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="dashboard">
            <BarChart3 className="mr-2 h-4 w-4" />
            Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agency Information</CardTitle>
              <CardDescription>Update the agency's basic information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateAgency} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Agency Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter agency name"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input
                    id="logo_url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                  {formData.logo_url && (
                    <div className="mt-2 p-2 border rounded flex items-center justify-center">
                      <img
                        src={formData.logo_url || "/placeholder.svg"}
                        alt="Agency Logo Preview"
                        className="max-h-20 object-contain"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg?height=80&width=200&text=Invalid+Image"
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agency Statistics</CardTitle>
              <CardDescription>Overview of agency activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Users</p>
                    <p className="text-2xl font-bold">{users.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Home className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Properties</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="p-2 bg-amber-100 rounded-full">
                    <FileText className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Leases</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Brand Colors</CardTitle>
              <CardDescription>Customize the agency's brand colors</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateAgency} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="primary_color">Primary Color</Label>
                    <div className="flex gap-2 items-center">
                      <div
                        className="w-8 h-8 rounded-full border"
                        style={{ backgroundColor: formData.primary_color }}
                      />
                      <Input
                        id="primary_color"
                        type="text"
                        value={formData.primary_color}
                        onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="secondary_color">Secondary Color</Label>
                    <div className="flex gap-2 items-center">
                      <div
                        className="w-8 h-8 rounded-full border"
                        style={{ backgroundColor: formData.secondary_color }}
                      />
                      <Input
                        id="secondary_color"
                        type="text"
                        value={formData.secondary_color}
                        onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="accent_color">Accent Color</Label>
                    <div className="flex gap-2 items-center">
                      <div className="w-8 h-8 rounded-full border" style={{ backgroundColor: formData.accent_color }} />
                      <Input
                        id="accent_color"
                        type="text"
                        value={formData.accent_color}
                        onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Preview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Button Preview</h4>
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="px-4 py-2 rounded text-white"
                          style={{ backgroundColor: formData.primary_color }}
                        >
                          Primary Button
                        </button>
                        <button
                          className="px-4 py-2 rounded text-white"
                          style={{ backgroundColor: formData.secondary_color }}
                        >
                          Secondary Button
                        </button>
                        <button
                          className="px-4 py-2 rounded text-white"
                          style={{ backgroundColor: formData.accent_color }}
                        >
                          Accent Button
                        </button>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Text Preview</h4>
                      <p style={{ color: formData.primary_color }}>This text uses the primary color.</p>
                      <p style={{ color: formData.secondary_color }}>This text uses the secondary color.</p>
                      <p style={{ color: formData.accent_color }}>This text uses the accent color.</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Logo & Branding Assets</CardTitle>
              <CardDescription>Manage the agency's visual identity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <ImageIcon className="h-5 w-5" />
                    <h3 className="font-medium">Main Logo</h3>
                  </div>
                  <div className="h-32 flex items-center justify-center border rounded-lg p-4 mb-2">
                    {formData.logo_url ? (
                      <img
                        src={formData.logo_url || "/placeholder.svg"}
                        alt="Agency Logo"
                        className="max-h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg?height=100&width=200&text=No+Logo"
                        }}
                      />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <ImageIcon className="mx-auto h-8 w-8 mb-2" />
                        <p>No logo uploaded</p>
                      </div>
                    )}
                  </div>
                  <Button variant="outline" className="w-full bg-transparent">
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Upload Logo
                  </Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <PaintBucket className="h-5 w-5" />
                    <h3 className="font-medium">Color Palette</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div
                      className="h-16 rounded-lg"
                      style={{ backgroundColor: formData.primary_color }}
                      title="Primary Color"
                    />
                    <div
                      className="h-16 rounded-lg"
                      style={{ backgroundColor: formData.secondary_color }}
                      title="Secondary Color"
                    />
                    <div
                      className="h-16 rounded-lg"
                      style={{ backgroundColor: formData.accent_color }}
                      title="Accent Color"
                    />
                  </div>
                  <Button variant="outline" className="w-full bg-transparent">
                    <PaintBucket className="mr-2 h-4 w-4" />
                    Generate Color Palette
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Roles & Permissions</CardTitle>
                <CardDescription>Manage the roles and permissions for this agency</CardDescription>
              </div>
              <Button asChild>
                <Link href={`/admin/agencies/${agency.id}/roles/new`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Role
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {roles.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No roles defined</h3>
                  <p className="text-muted-foreground mb-4">Create roles to manage user permissions</p>
                  <Button asChild>
                    <Link href={`/admin/agencies/${agency.id}/roles/new`}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Role
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {roles.map((role) => (
                    <div key={role.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{role.name}</h3>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/agencies/${agency.id}/roles/${role.id}`}>
                              <Settings className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {Object.entries(role.permissions || {})
                          .filter(([_, value]) => value === true)
                          .map(([key]) => (
                            <span key={key} className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                              {key.replace(/_/g, " ")}
                            </span>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Templates</CardTitle>
              <CardDescription>Customize document templates for this agency</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5" />
                    <h3 className="font-medium">Lease Templates</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Customize lease templates for different property types
                  </p>
                  <Button variant="outline" asChild>
                    <Link href={`/admin/agencies/${agency.id}/templates/leases`}>
                      <Settings className="mr-2 h-4 w-4" />
                      Manage Lease Templates
                    </Link>
                  </Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-5 w-5" />
                    <h3 className="font-medium">Email Templates</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Customize email templates for notifications and communications
                  </p>
                  <Button variant="outline" asChild>
                    <Link href={`/admin/agencies/${agency.id}/templates/emails`}>
                      <Settings className="mr-2 h-4 w-4" />
                      Manage Email Templates
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Customization</CardTitle>
              <CardDescription>Configure the agency dashboard layout and widgets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Dashboard customization</h3>
                <p className="text-muted-foreground mb-4">
                  This feature is coming soon. You'll be able to customize the agency dashboard layout and widgets.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
