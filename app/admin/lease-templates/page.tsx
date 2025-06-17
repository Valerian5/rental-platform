"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Plus, Edit, Trash2, Eye, FileText, Code, Save, Copy, CheckCircle } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"

interface LeaseTemplate {
  id: string
  name: string
  description: string
  lease_type: string
  template_content: string
  field_mapping: any
  is_active: boolean
  is_default: boolean
  version: string
  legal_references: string
  created_at: string
  updated_at: string
}

export default function LeaseTemplatesPage() {
  const [templates, setTemplates] = useState<LeaseTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<LeaseTemplate | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    lease_type: "unfurnished",
    template_content: "",
    field_mapping: "{}",
    is_active: true,
    is_default: false,
    version: "1.0",
    legal_references: "",
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/lease-templates")
      const data = await response.json()

      if (data.success) {
        setTemplates(data.templates)
      } else {
        toast.error("Erreur lors du chargement des templates")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      let parsedFieldMapping
      try {
        parsedFieldMapping = JSON.parse(formData.field_mapping)
      } catch {
        toast.error("Le mapping des champs doit être un JSON valide")
        return
      }

      const url =
        isEditing && selectedTemplate
          ? `/api/admin/lease-templates/${selectedTemplate.id}`
          : "/api/admin/lease-templates"

      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          field_mapping: parsedFieldMapping,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(isEditing ? "Template mis à jour" : "Template créé")
        setIsEditing(false)
        setIsCreating(false)
        setSelectedTemplate(null)
        loadTemplates()
        resetForm()
      } else {
        toast.error(data.error || "Erreur lors de la sauvegarde")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la sauvegarde")
    }
  }

  const handleEdit = (template: LeaseTemplate) => {
    setSelectedTemplate(template)
    setFormData({
      name: template.name,
      description: template.description,
      lease_type: template.lease_type,
      template_content: template.template_content,
      field_mapping: JSON.stringify(template.field_mapping, null, 2),
      is_active: template.is_active,
      is_default: template.is_default,
      version: template.version,
      legal_references: template.legal_references,
    })
    setIsEditing(true)
  }

  const handleDelete = async (template: LeaseTemplate) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le template "${template.name}" ?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/lease-templates/${template.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Template supprimé")
        loadTemplates()
      } else {
        toast.error(data.error || "Erreur lors de la suppression")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la suppression")
    }
  }

  const handleDuplicate = (template: LeaseTemplate) => {
    setFormData({
      name: `${template.name} (Copie)`,
      description: template.description,
      lease_type: template.lease_type,
      template_content: template.template_content,
      field_mapping: JSON.stringify(template.field_mapping, null, 2),
      is_active: true,
      is_default: false,
      version: "1.0",
      legal_references: template.legal_references,
    })
    setIsCreating(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      lease_type: "unfurnished",
      template_content: "",
      field_mapping: "{}",
      is_active: true,
      is_default: false,
      version: "1.0",
      legal_references: "",
    })
  }

  const getLeaseTypeLabel = (type: string) => {
    switch (type) {
      case "unfurnished":
        return "Non meublé"
      case "furnished":
        return "Meublé"
      case "commercial":
        return "Commercial"
      default:
        return type
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Chargement des templates...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <BreadcrumbNav
        items={[
          { label: "Administration", href: "/admin" },
          { label: "Modèles de bail", href: "/admin/lease-templates" },
        ]}
      />

      <PageHeader
        title="Modèles de bail"
        description="Gérez les templates de contrats de location conformes à la législation française"
      />

      <div className="mt-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <Badge variant="outline" className="text-green-600 border-green-600">
              {templates.filter((t) => t.is_active).length} actifs
            </Badge>
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              {templates.filter((t) => t.is_default).length} par défaut
            </Badge>
          </div>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau template
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="mt-1">{template.description}</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    {template.is_default && (
                      <Badge variant="default" className="text-xs">
                        Défaut
                      </Badge>
                    )}
                    {template.is_active ? (
                      <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Actif
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-500 border-gray-500 text-xs">
                        Inactif
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium">{getLeaseTypeLabel(template.lease_type)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Version:</span>
                    <span className="font-medium">{template.version}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Modifié:</span>
                    <span className="font-medium">{new Date(template.updated_at).toLocaleDateString("fr-FR")}</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedTemplate(template)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDuplicate(template)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(template)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Dialog de prévisualisation */}
        <Dialog open={!!selectedTemplate && !isEditing} onOpenChange={() => setSelectedTemplate(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedTemplate?.name}</DialogTitle>
            </DialogHeader>
            {selectedTemplate && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Type:</span> {getLeaseTypeLabel(selectedTemplate.lease_type)}
                  </div>
                  <div>
                    <span className="font-medium">Version:</span> {selectedTemplate.version}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Références légales:</h3>
                  <p className="text-sm text-muted-foreground">{selectedTemplate.legal_references}</p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Contenu du template:</h3>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap">{selectedTemplate.template_content}</pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Mapping des champs:</h3>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-48 overflow-y-auto">
                    <pre className="text-xs">{JSON.stringify(selectedTemplate.field_mapping, null, 2)}</pre>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog d'édition/création */}
        <Dialog
          open={isEditing || isCreating}
          onOpenChange={() => {
            setIsEditing(false)
            setIsCreating(false)
            setSelectedTemplate(null)
            resetForm()
          }}
        >
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditing ? "Modifier le template" : "Nouveau template"}</DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">Général</TabsTrigger>
                <TabsTrigger value="template">Template</TabsTrigger>
                <TabsTrigger value="mapping">Mapping</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nom du template</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Modèle standard - Logement non meublé"
                    />
                  </div>
                  <div>
                    <Label htmlFor="version">Version</Label>
                    <Input
                      id="version"
                      value={formData.version}
                      onChange={(e) => setFormData((prev) => ({ ...prev, version: e.target.value }))}
                      placeholder="1.0"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Description du template..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="lease_type">Type de bail</Label>
                  <Select
                    value={formData.lease_type}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, lease_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unfurnished">Non meublé</SelectItem>
                      <SelectItem value="furnished">Meublé</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="legal_references">Références légales</Label>
                  <Textarea
                    id="legal_references"
                    value={formData.legal_references}
                    onChange={(e) => setFormData((prev) => ({ ...prev, legal_references: e.target.value }))}
                    placeholder="Décret n°2015-587 du 29 mai 2015..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor="is_active">Template actif</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_default"
                      checked={formData.is_default}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_default: checked }))}
                    />
                    <Label htmlFor="is_default">Template par défaut</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="template" className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">Contenu du template (Markdown + Handlebars)</span>
                </div>
                <Textarea
                  value={formData.template_content}
                  onChange={(e) => setFormData((prev) => ({ ...prev, template_content: e.target.value }))}
                  placeholder="# CONTRAT DE LOCATION&#10;&#10;**BAILLEUR :**&#10;Nom : {{nom_bailleur}}&#10;..."
                  rows={20}
                  className="font-mono text-sm"
                />
                <div className="text-xs text-muted-foreground">
                  <p>
                    Utilisez les balises Handlebars : <code>{"{{nom_bailleur}}"}</code>,{" "}
                    <code>{"{{#if condition}}"}</code>, <code>{"{{#each items}}"}</code>
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="mapping" className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Code className="h-4 w-4" />
                  <span className="text-sm font-medium">Mapping des champs (JSON)</span>
                </div>
                <Textarea
                  value={formData.field_mapping}
                  onChange={(e) => setFormData((prev) => ({ ...prev, field_mapping: e.target.value }))}
                  placeholder='{"nom_bailleur": {"type": "string", "required": true, "label": "Nom du bailleur"}}'
                  rows={15}
                  className="font-mono text-sm"
                />
                <div className="text-xs text-muted-foreground">
                  <p>Définissez les champs avec leur type, validation et libellé.</p>
                  <p>Types supportés : string, number, boolean, date, email, select, array, textarea</p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false)
                  setIsCreating(false)
                  setSelectedTemplate(null)
                  resetForm()
                }}
              >
                Annuler
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
