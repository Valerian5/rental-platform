"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  FileText,
  Upload,
  Download,
  Edit,
  Trash2,
  Plus,
  Eye,
  Home,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/lib/auth-service"

interface EtatDesLieuxTemplate {
  id: string
  name: string
  type: "entree" | "sortie"
  room_count: number
  file_url: string
  file_name: string
  file_size: number
  is_active: boolean
  description?: string
  created_at: string
  updated_at: string
}

const ROOM_COUNTS = [
  { value: 1, label: "1 pièce (Studio)" },
  { value: 2, label: "2 pièces (T2)" },
  { value: 3, label: "3 pièces (T3)" },
  { value: 4, label: "4 pièces (T4)" },
  { value: 5, label: "5 pièces (T5)" },
  { value: 6, label: "6+ pièces" },
]

export default function EtatDesLieuxTemplatesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentUser, setCurrentUser] = useState(null)
  const [templates, setTemplates] = useState<EtatDesLieuxTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EtatDesLieuxTemplate | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterRoomCount, setFilterRoomCount] = useState<string>("all")

  // Formulaire
  const [formData, setFormData] = useState({
    name: "",
    type: "entree" as "entree" | "sortie",
    room_count: 1,
    description: "",
    file: null as File | null,
  })

  useEffect(() => {
    checkAdminAuth()
  }, [])

  useEffect(() => {
    if (currentUser) {
      loadTemplates()
    }
  }, [currentUser])

  const checkAdminAuth = async () => {
    try {
      const user = await authService.getCurrentUser()
      if (!user || user.user_type !== "admin") {
        console.log("❌ Utilisateur non admin:", user?.user_type)
        router.push("/login")
        return
      }
      console.log("✅ Utilisateur admin confirmé:", user.email)
      setCurrentUser(user)
    } catch (error) {
      console.error("Erreur auth:", error)
      router.push("/login")
    }
  }

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/etat-des-lieux-templates")
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error("Erreur chargement templates:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les modèles",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.file) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUploading(true)
      const formDataToSend = new FormData()
      formDataToSend.append("name", formData.name)
      formDataToSend.append("type", formData.type)
      formDataToSend.append("room_count", formData.room_count.toString())
      formDataToSend.append("description", formData.description)
      formDataToSend.append("file", formData.file)

      const response = await fetch("/api/admin/etat-des-lieux-templates", {
        method: "POST",
        body: formDataToSend,
      })

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Modèle uploadé avec succès",
        })
        setIsDialogOpen(false)
        resetForm()
        loadTemplates()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de l'upload")
      }
    } catch (error) {
      console.error("Erreur upload:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de l'upload",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleEdit = (template: EtatDesLieuxTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      type: template.type,
      room_count: template.room_count,
      description: template.description || "",
      file: null,
    })
    setIsDialogOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingTemplate) return

    try {
      setIsUploading(true)
      const formDataToSend = new FormData()
      formDataToSend.append("name", formData.name)
      formDataToSend.append("type", formData.type)
      formDataToSend.append("room_count", formData.room_count.toString())
      formDataToSend.append("description", formData.description)
      if (formData.file) {
        formDataToSend.append("file", formData.file)
      }

      const response = await fetch(`/api/admin/etat-des-lieux-templates/${editingTemplate.id}`, {
        method: "PUT",
        body: formDataToSend,
      })

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Modèle mis à jour avec succès",
        })
        setIsDialogOpen(false)
        setEditingTemplate(null)
        resetForm()
        loadTemplates()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la mise à jour")
      }
    } catch (error) {
      console.error("Erreur mise à jour:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la mise à jour",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (templateId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce modèle ?")) return

    try {
      const response = await fetch(`/api/admin/etat-des-lieux-templates/${templateId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Modèle supprimé avec succès",
        })
        loadTemplates()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la suppression")
      }
    } catch (error) {
      console.error("Erreur suppression:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la suppression",
        variant: "destructive",
      })
    }
  }

  const toggleActive = async (templateId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/etat-des-lieux-templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !isActive }),
      })

      if (response.ok) {
        toast({
          title: "Succès",
          description: `Modèle ${!isActive ? "activé" : "désactivé"}`,
        })
        loadTemplates()
      }
    } catch (error) {
      console.error("Erreur toggle:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors de la modification",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      type: "entree",
      room_count: 1,
      description: "",
      file: null,
    })
    setEditingTemplate(null)
  }

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || template.type === filterType
    const matchesRoomCount = filterRoomCount === "all" || template.room_count.toString() === filterRoomCount
    
    return matchesSearch && matchesType && matchesRoomCount
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des modèles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Modèles d'État des Lieux</h1>
          <p className="text-gray-600">Gérez les modèles PDF d'état des lieux</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau modèle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Modifier le modèle" : "Nouveau modèle d'état des lieux"}
              </DialogTitle>
              <DialogDescription>
                {editingTemplate 
                  ? "Modifiez les informations du modèle" 
                  : "Ajoutez un nouveau modèle PDF d'état des lieux"
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={editingTemplate ? handleUpdate : handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom du modèle</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: État des lieux T3 - Entrée"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "entree" | "sortie") => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entree">Entrée</SelectItem>
                      <SelectItem value="sortie">Sortie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="room_count">Nombre de pièces</Label>
                  <Select
                    value={formData.room_count.toString()}
                    onValueChange={(value) => setFormData({ ...formData, room_count: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROOM_COUNTS.map((room) => (
                        <SelectItem key={room.value} value={room.value.toString()}>
                          {room.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="file">Fichier PDF</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                    required={!editingTemplate}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description du modèle..."
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingTemplate ? "Mise à jour..." : "Upload..."}
                    </>
                  ) : (
                    editingTemplate ? "Mettre à jour" : "Uploader"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Rechercher</Label>
              <Input
                id="search"
                placeholder="Nom ou description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="type-filter">Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="entree">Entrée</SelectItem>
                  <SelectItem value="sortie">Sortie</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="room-filter">Pièces</Label>
              <Select value={filterRoomCount} onValueChange={setFilterRoomCount}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {ROOM_COUNTS.map((room) => (
                    <SelectItem key={room.value} value={room.value.toString()}>
                      {room.value} pièce{room.value > 1 ? "s" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des modèles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Modèles ({filteredTemplates.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun modèle trouvé</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Pièces</TableHead>
                  <TableHead>Fichier</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{template.name}</p>
                        {template.description && (
                          <p className="text-sm text-gray-500">{template.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={template.type === "entree" ? "default" : "secondary"}>
                        {template.type === "entree" ? "Entrée" : "Sortie"}
                      </Badge>
                    </TableCell>
                    <TableCell>{template.room_count} pièce{template.room_count > 1 ? "s" : ""}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{template.file_name}</span>
                        <span className="text-xs text-gray-500">
                          ({(template.file_size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {template.is_active ? (
                          <Badge className="bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Actif
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Inactif
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(template.file_url, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleActive(template.id, template.is_active)}
                        >
                          {template.is_active ? "Désactiver" : "Activer"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
