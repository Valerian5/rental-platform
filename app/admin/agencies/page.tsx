"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Building2, Plus, Search, Edit, Trash2, Users, Home, Settings, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
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
}

export default function AgenciesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    logo_url: "",
    primary_color: "#0066FF",
    secondary_color: "#FF6B00",
    accent_color: "#00C48C",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    checkAdminAuth()
    fetchAgencies()
  }, [])

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

  const fetchAgencies = async () => {
    try {
      setLoading(true)
      console.log("📋 Récupération des agences...")
      const result = await agencyApi.getAll()
      console.log("📊 Résultat API:", result)

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch agencies")
      }

      setAgencies(result.agencies || [])
      console.log("✅ Agences chargées:", result.agencies?.length || 0)
    } catch (error) {
      console.error("Error fetching agencies:", error)
      toast({
        title: "Error",
        description: "Failed to load agencies",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAgency = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)

      if (!formData.name.trim()) {
        toast({
          title: "Error",
          description: "Agency name is required",
          variant: "destructive",
        })
        return
      }

      console.log("➕ Création d'une nouvelle agence:", formData)
      const result = await agencyApi.create(formData)
      console.log("📊 Résultat création:", result)

      if (!result.success) {
        throw new Error(result.error || "Failed to create agency")
      }

      toast({
        title: "Success",
        description: "Agency created successfully",
      })

      setFormData({
        name: "",
        logo_url: "",
        primary_color: "#0066FF",
        secondary_color: "#FF6B00",
        accent_color: "#00C48C",
      })
      setIsCreateDialogOpen(false)
      fetchAgencies()
    } catch (error) {
      console.error("Error creating agency:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create agency",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAgency = async () => {
    if (!selectedAgency) return

    try {
      setIsSubmitting(true)
      const result = await agencyApi.delete(selectedAgency.id)

      if (!result.success) {
        throw new Error(result.error || "Failed to delete agency")
      }

      toast({
        title: "Success",
        description: "Agency deleted successfully",
      })

      setIsDeleteDialogOpen(false)
      setSelectedAgency(null)
      fetchAgencies()
    } catch (error) {
      console.error("Error deleting agency:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete agency",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredAgencies = agencies.filter((agency) => agency.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Agencies</h1>
          <p className="text-muted-foreground">Manage real estate agencies on the platform</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Agency
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Agency</DialogTitle>
              <DialogDescription>Add a new real estate agency to the platform.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateAgency}>
              <div className="grid gap-4 py-4">
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
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="primary_color">Primary Color</Label>
                    <div className="flex gap-2 items-center">
                      <div
                        className="w-6 h-6 rounded-full border"
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
                        className="w-6 h-6 rounded-full border"
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
                      <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: formData.accent_color }} />
                      <Input
                        id="accent_color"
                        type="text"
                        value={formData.accent_color}
                        onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Agency"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search agencies..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredAgencies.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No agencies found</h3>
          <p className="text-muted-foreground">
            {searchQuery ? "Try a different search term" : "Get started by adding a new agency"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgencies.map((agency) => (
            <Card key={agency.id} className="overflow-hidden">
              <CardHeader className="pb-3" style={{ backgroundColor: agency.primary_color + "10" }}>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
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
                    </CardTitle>
                    <CardDescription>Created on {new Date(agency.created_at).toLocaleDateString()}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Settings className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/agencies/${agency.id}`}>
                          <Settings className="mr-2 h-4 w-4" />
                          Manage Agency
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/agencies/${agency.id}/users`}>
                          <Users className="mr-2 h-4 w-4" />
                          Manage Users
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/agencies/${agency.id}/properties`}>
                          <Home className="mr-2 h-4 w-4" />
                          View Properties
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/agencies/${agency.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Agency
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => {
                          setSelectedAgency(agency)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Agency
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex gap-1">
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: agency.primary_color }}
                      title="Primary color"
                    />
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: agency.secondary_color }}
                      title="Secondary color"
                    />
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: agency.accent_color }}
                      title="Accent color"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">Brand colors</span>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 flex justify-between">
                <Button variant="outline" asChild>
                  <Link href={`/admin/agencies/${agency.id}`}>
                    Manage
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/admin/agencies/${agency.id}/users`}>
                    <Users className="mr-2 h-4 w-4" />
                    Users
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Agency</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedAgency?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAgency} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Agency"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
