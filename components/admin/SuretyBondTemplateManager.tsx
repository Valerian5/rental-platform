"use client"

import React, { useState, useEffect } from "react"
import {
  suretyBondTemplateService,
  SuretyBondTemplate,
} from "@/lib/surety-bond-template-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

export default function SuretyBondTemplateManager() {
  const [templates, setTemplates] = useState<SuretyBondTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] =
    useState<SuretyBondTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setIsLoading(true)
      const data = await suretyBondTemplateService.getTemplates()
      setTemplates(data)
    } catch (error) {
      toast.error("Erreur lors du chargement des modèles.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectTemplate = (template: SuretyBondTemplate) => {
    setSelectedTemplate({ ...template })
  }

  const handleCreateNew = () => {
    setSelectedTemplate({
      id: "",
      name: "Nouveau modèle",
      content: "<h1>Acte de Caution...</h1>",
      is_default: false,
      created_at: new Date().toISOString(),
    })
  }

  const handleSave = async () => {
    if (!selectedTemplate) return
    setIsSaving(true)
    try {
      if (selectedTemplate.id) {
        await suretyBondTemplateService.updateTemplate(
          selectedTemplate.id,
          selectedTemplate,
        )
        toast.success("Modèle mis à jour avec succès.")
      } else {
        const { id, ...newTemplateData } = selectedTemplate
        await suretyBondTemplateService.createTemplate(newTemplateData)
        toast.success("Modèle créé avec succès.")
      }
      await fetchTemplates()
      setSelectedTemplate(null)
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde du modèle.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await suretyBondTemplateService.deleteTemplate(id)
      toast.success("Modèle supprimé avec succès.")
      await fetchTemplates()
      if (selectedTemplate?.id === id) {
        setSelectedTemplate(null)
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression du modèle.")
    }
  }

  if (isLoading) {
    return <div>Chargement des modèles...</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Modèles</h2>
          <Button onClick={handleCreateNew}>Nouveau</Button>
        </div>
        <div className="space-y-2">
          {templates.map(template => (
            <Card
              key={template.id}
              className={`cursor-pointer ${
                selectedTemplate?.id === template.id ? "border-primary" : ""
              }`}
              onClick={() => handleSelectTemplate(template)}
            >
              <CardHeader>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                {template.is_default && (
                  <CardDescription>Modèle par défaut</CardDescription>
                )}
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      <div className="md:col-span-2">
        {selectedTemplate ? (
          <Card>
            <CardHeader>
              <CardTitle>Édition du modèle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="template-name">Nom du modèle</Label>
                <Input
                  id="template-name"
                  value={selectedTemplate.name}
                  onChange={e =>
                    setSelectedTemplate({
                      ...selectedTemplate,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="template-content">Contenu (HTML)</Label>
                <Textarea
                  id="template-content"
                  value={selectedTemplate.content}
                  onChange={e =>
                    setSelectedTemplate({
                      ...selectedTemplate,
                      content: e.target.value,
                    })
                  }
                  rows={20}
                  className="font-mono"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-default"
                  checked={selectedTemplate.is_default}
                  onCheckedChange={checked =>
                    setSelectedTemplate({
                      ...selectedTemplate,
                      is_default: checked,
                    })
                  }
                />
                <Label htmlFor="is-default">
                  Définir comme modèle par défaut
                </Label>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div>
                {selectedTemplate.id && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">Supprimer</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Êtes-vous sûr ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est irréversible et supprimera le modèle
                          définitivement.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(selectedTemplate.id)}
                        >
                          Confirmer la suppression
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedTemplate(null)}
                >
                  Annuler
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Sauvegarde..." : "Sauvegarder"}
                </Button>
              </div>
            </CardFooter>
          </Card>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Sélectionnez un modèle pour le modifier ou créez-en un nouveau.
          </div>
        )}
      </div>
    </div>
  )
}
