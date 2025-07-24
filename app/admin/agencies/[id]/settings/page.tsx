"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Shield, Building } from "lucide-react"

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

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  is_default: boolean
  created_at: string
}

const AVAILABLE_PERMISSIONS = [
  {
    key: "manage_properties",
    label: "Gérer les propriétés",
    description: "Créer, modifier et supprimer des propriétés",
  },
  { key: "manage_applications", label: "Gérer les candidatures", description: "Voir et traiter les candidatures" },
  { key: "manage_leases", label: "Gérer les baux", description: "Créer et gérer les contrats de bail" },
  {
    key: "manage_users",
    label: "Gérer les utilisateurs",
    description: "Inviter et gérer les utilisateurs de l'agence",
  },
  { key: "view_analytics", label: "Voir les statistiques", description: "Accéder aux rapports et statistiques" },
  { key: "manage_settings", label: "Gérer les paramètres", description: "Modifier les paramètres de l'agence" },
]

export default function AgencySettingsPage() {
  const params = useParams()
  const router = useRouter()
  const agencyId = params.id as string

  const [agency, setAgency] = useState<Agency | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form states
  const [agencyForm, setAgencyForm] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    website: "",
  })

  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  })

  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)

  useEffect(() => {
    fetchAgencyData()
    fetchRoles()
  }, [agencyId])

  useEffect(() => {
    if (agency) {
      setAgencyForm({
        name: agency.name || "",
        description: agency.description || "",
        address: agency.address || "",
        phone: agency.phone || "",
        email: agency.email || "",
        website: agency.website || "",
      })
    }
  }, [agency])

  const fetchAgencyData = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`/api/agencies/${agencyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch agency")
      }

      const data = await response.json()
      setAgency(data.agency)
    } catch (error) {
      console.error("Error fetching agency:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les informations de l'agence",
        variant: "destructive",
      })
    }
  }

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`/api/agencies/${agencyId}/roles`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch roles")
      }

      const data = await response.json()
      setRoles(data.roles || [])
    } catch (error) {
      console.error("Error fetching roles:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les rôles",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAgency = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`/api/agencies/${agencyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(agencyForm),
      })

      if (!response.ok) {
        throw new Error("Failed to update agency")
      }

      toast({
        title: "Succès",
        description: "Informations de l'agence mises à jour",
      })

      fetchAgencyData()
    } catch (error) {
      console.error("Error updating agency:", error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'agence",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCreateRole = async () => {
    if (!roleForm.name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom du rôle est requis",
        variant: "destructive",
      })
      return
    }

    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`/api/agencies/${agencyId}/roles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(roleForm),
      })

      if (!response.ok) {
        throw new Error("Failed to create role")
      }

      toast({
        title: "Succès",
        description: "Rôle créé avec succès",
      })

      setRoleForm({ name: "", description: "", permissions: [] })
      setIsRoleDialogOpen(false)
      fetchRoles()
    } catch (error) {
      console.error("Error creating role:", error)
      toast({
        title: "Erreur",
        description: "Impossible de créer le rôle",
        variant: "destructive",
      })
    }
  }

  const handleUpdateRole = async () => {
    if (!editingRole || !roleForm.name.trim()) {
      return
    }

    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`/api/agencies/${agencyId}/roles/${editingRole.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(roleForm),
      })

      if (!response.ok) {
        throw new Error("Failed to update role")
      }

      toast({
        title: "Succès",
        description: "Rôle mis à jour avec succès",
      })

      setRoleForm({ name: "", description: "", permissions: [] })
      setEditingRole(null)
      setIsRoleDialogOpen(false)
      fetchRoles()
    } catch (error) {
      console.error("Error updating role:", error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le rôle",
        variant: "destructive",
      })
    }
  }

  const handleDeleteRole = async (roleId: string) => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`/api/agencies/${agencyId}/roles/${roleId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete role")
      }

      toast({
        title: "Succès",
        description: "Rôle supprimé avec succès",
      })

      fetchRoles()
    } catch (error) {
      console.error("Error deleting role:", error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le rôle",
        variant: "destructive",
      })
    }
  }

  const openRoleDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role)
      setRoleForm({
        name: role.name,
        description: role.description || "",
        permissions: role.permissions || [],
      })
    } else {
      setEditingRole(null)
      setRoleForm({ name: "", description: "", permissions: [] })
    }
    setIsRoleDialogOpen(true)
  }

  const togglePermission = (permission: string) => {
    setRoleForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }))
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Chargement des paramètres...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Paramètres de l'agence</h1>
          <p className="text-muted-foreground">{agency?.name}</p>
        </div>
        <Button onClick={() => router.push(`/admin/agencies/${agencyId}`)}>Retour à l'agence</Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">
            <Building className="h-4 w-4 mr-2" />
            Général
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Shield className="h-4 w-4 mr-2" />
            Rôles et permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
              <CardDescription>Modifiez les informations de base de l'agence</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de l'agence</Label>
                  <Input
                    id="name"
                    value={agencyForm.name}
                    onChange={(e) => setAgencyForm({ ...agencyForm, name: e.target.value })}
                    placeholder="Nom de l'agence"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={agencyForm.email}
                    onChange={(e) => setAgencyForm({ ...agencyForm, email: e.target.value })}
                    placeholder="contact@agence.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={agencyForm.phone}
                    onChange={(e) => setAgencyForm({ ...agencyForm, phone: e.target.value })}
                    placeholder="01 23 45 67 89"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Site web</Label>
                  <Input
                    id="website"
                    value={agencyForm.website}
                    onChange={(e) => setAgencyForm({ ...agencyForm, website: e.target.value })}
                    placeholder="https://www.agence.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={agencyForm.address}
                  onChange={(e) => setAgencyForm({ ...agencyForm, address: e.target.value })}
                  placeholder="123 Rue de la Paix, 75001 Paris"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={agencyForm.description}
                  onChange={(e) => setAgencyForm({ ...agencyForm, description: e.target.value })}
                  placeholder="Description de l'agence..."
                  rows={4}
                />
              </div>
              <Button onClick={handleSaveAgency} disabled={saving}>
                {saving ? "Enregistrement..." : "Enregistrer les modifications"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Rôles et permissions</CardTitle>
                    <CardDescription>Gérez les rôles et permissions des utilisateurs de l'agence</CardDescription>
                  </div>
                  <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => openRoleDialog()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nouveau rôle
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{editingRole ? "Modifier le rôle" : "Créer un nouveau rôle"}</DialogTitle>
                        <DialogDescription>
                          Définissez le nom, la description et les permissions du rôle
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="roleName">Nom du rôle</Label>
                          <Input
                            id="roleName"
                            value={roleForm.name}
                            onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                            placeholder="Ex: Gestionnaire de biens"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="roleDescription">Description</Label>
                          <Textarea
                            id="roleDescription"
                            value={roleForm.description}
                            onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                            placeholder="Description du rôle..."
                            rows={3}
                          />
                        </div>
                        <div className="space-y-3">
                          <Label>Permissions</Label>
                          <div className="space-y-3">
                            {AVAILABLE_PERMISSIONS.map((permission) => (
                              <div key={permission.key} className="flex items-start space-x-3">
                                <Switch
                                  checked={roleForm.permissions.includes(permission.key)}
                                  onCheckedChange={() => togglePermission(permission.key)}
                                />
                                <div className="flex-1">
                                  <div className="font-medium">{permission.label}</div>
                                  <div className="text-sm text-muted-foreground">{permission.description}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
                          Annuler
                        </Button>
                        <Button onClick={editingRole ? handleUpdateRole : handleCreateRole}>
                          {editingRole ? "Mettre à jour" : "Créer"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {roles.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-semibold">Aucun rôle</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Créez votre premier rôle pour commencer à gérer les permissions.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {roles.map((role) => (
                      <div key={role.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{role.name}</h3>
                            {role.is_default && <Badge variant="secondary">Par défaut</Badge>}
                          </div>
                          {role.description && <p className="text-sm text-muted-foreground mb-2">{role.description}</p>}
                          <div className="flex flex-wrap gap-1">
                            {role.permissions?.map((permission) => {
                              const permissionInfo = AVAILABLE_PERMISSIONS.find((p) => p.key === permission)
                              return (
                                <Badge key={permission} variant="outline" className="text-xs">
                                  {permissionInfo?.label || permission}
                                </Badge>
                              )
                            })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => openRoleDialog(role)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!role.is_default && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Supprimer le rôle</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Êtes-vous sûr de vouloir supprimer ce rôle ? Les utilisateurs ayant ce rôle perdront
                                    leurs permissions associées.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteRole(role.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Supprimer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
