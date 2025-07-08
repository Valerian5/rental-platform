"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { Plus, Edit, Trash2, Star, StarOff, Info } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"

interface LeaseClause {
  id: string
  name: string
  category: string
  clause_text: string
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

const CLAUSE_CATEGORIES = [
  { value: "animaux_domestiques", label: "Animaux domestiques" },
  { value: "entretien_appareils", label: "Entretien des appareils" },
  { value: "degradations_locataire", label: "Dégradations du locataire" },
  { value: "travaux_bailleur", label: "Travaux du bailleur" },
  { value: "travaux_locataire", label: "Travaux du locataire" },
  { value: "travaux_ente_locataires", label: "Travaux entre locataires" },
  { value: "renonciation", label: "Clause de renonciation à la régularisation des charges" },
  { value: "degradation", label: "Dégradation du locataire et grille de vetusté" },
  { value: "entretien", label: "Entretien des appareils de chauffage" },
  { value: "visite", label: "Droit de visite du bailleur" },
  { value: "autres", label: "Autres clauses" },
]

export default function LeaseClausesAdminPage() {
  const [clauses, setClauses] = useState<LeaseClause[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClause, setEditingClause] = useState<LeaseClause | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    clause_text: "",
    is_default: false,
    is_active: true,
  })

  useEffect(() => {
    loadClauses()
  }, [])

  const loadClauses = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/lease-clauses")
      const data = await response.json()

      if (data.success) {
        setClauses(data.clauses)
      } else {
        toast.error("Erreur lors du chargement des clauses")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.category || !formData.clause_text) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }

    try {
      setSaving(true)

      const url = editingClause ? `/api/lease-clauses/${editingClause.id}` : "/api/lease-clauses"
      const method = editingClause ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(editingClause ? "Clause modifiée avec succès" : "Clause créée avec succès")
        setIsDialogOpen(false)
        resetForm()
        loadClauses()
      } else {
        toast.error(data.error || "Erreur lors de la sauvegarde")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (clause: LeaseClause) => {
    setEditingClause(clause)
    setFormData({
      name: clause.name,
      category: clause.category,
      clause_text: clause.clause_text,
      is_default: clause.is_default,
      is_active: clause.is_active,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (clauseId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette clause ?")) {
      return
    }

    try {
      const response = await fetch(`/api/lease-clauses/${clauseId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Clause supprimée avec succès")
        loadClauses()
      } else {
        toast.error(data.error || "Erreur lors de la suppression")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la suppression")
    }
  }

  const toggleDefault = async (clause: LeaseClause) => {
    try {
      const response = await fetch(`/api/lease-clauses/${clause.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...clause,
          is_default: !clause.is_default,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(clause.is_default ? "Clause retirée par défaut" : "Clause définie par défaut")
        loadClauses()
      } else {
        toast.error(data.error || "Erreur lors de la modification")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la modification")
    }
  }

  const toggleActive = async (clause: LeaseClause) => {
    try {
      const response = await fetch(`/api/lease-clauses/${clause.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...clause,
          is_active: !clause.is_active,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(clause.is_active ? "Clause désactivée" : "Clause activée")
        loadClauses()
      } else {
        toast.error(data.error || "Erreur lors de la modification")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la modification")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      clause_text: "",
      is_default: false,
      is_active: true,
    })
    setEditingClause(null)
  }

  const filteredClauses =
    selectedCategory === "all" ? clauses : clauses.filter((clause) => clause.category === selectedCategory)

  const clausesByCategory = CLAUSE_CATEGORIES.reduce(
    (acc, category) => {
      acc[category.value] = clauses.filter((clause) => clause.category === category.value)
      return acc
    },
    {} as Record<string, LeaseClause[]>,
  )

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Chargement des clauses...</p>
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
          { label: "Clauses de bail", href: "/admin/lease-clauses" },
        ]}
      />

      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title="Gestion des clauses de bail"
          description="Gérez les clauses personnalisables pour les contrats de location"
        />
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle clause
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingClause ? "Modifier la clause" : "Créer une nouvelle clause"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom de la clause *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Animaux interdits"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Catégorie *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLAUSE_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="clause_text">Texte de la clause *</Label>
                <Textarea
                  id="clause_text"
                  value={formData.clause_text}
                  onChange={(e) => setFormData((prev) => ({ ...prev, clause_text: e.target.value }))}
                  placeholder="Saisissez le texte de la clause qui sera inséré dans le contrat..."
                  rows={4}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Ce texte sera inséré dans la section "Autres conditions particulières" du bail
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_default"
                    checked={formData.is_default}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_default: checked }))}
                  />
                  <Label htmlFor="is_default">Clause par défaut</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Clause active</Label>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Une seule clause par défaut est autorisée par catégorie. Si vous définissez cette clause comme par
                  défaut, les autres clauses de la même catégorie ne seront plus par défaut.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
                  Annuler
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingClause ? "Modification..." : "Création..."}
                    </>
                  ) : editingClause ? (
                    "Modifier"
                  ) : (
                    "Créer"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtres */}
      <div className="mb-6">
        <Label htmlFor="category-filter">Filtrer par catégorie</Label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {CLAUSE_CATEGORIES.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label} ({clausesByCategory[category.value]?.length || 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Liste des clauses */}
      <div className="space-y-6">
        {CLAUSE_CATEGORIES.map((category) => {
          const categoryClausesFiltered = selectedCategory === "all" || selectedCategory === category.value
          const categoryClauses = clausesByCategory[category.value] || []

          if (!categoryClausesFiltered || categoryClauses.length === 0) {
            return null
          }

          return (
            <Card key={category.value}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{category.label}</span>
                  <Badge variant="secondary">
                    {categoryClauses.length} clause{categoryClauses.length > 1 ? "s" : ""}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryClauses.map((clause) => (
                    <div
                      key={clause.id}
                      className={`p-4 border rounded-lg ${clause.is_active ? "bg-white" : "bg-gray-50 opacity-75"}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{clause.name}</h4>
                          {clause.is_default && (
                            <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                              <Star className="h-3 w-3 mr-1" />
                              Par défaut
                            </Badge>
                          )}
                          {!clause.is_active && <Badge variant="secondary">Inactive</Badge>}
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleDefault(clause)}
                            title={clause.is_default ? "Retirer par défaut" : "Définir par défaut"}
                          >
                            {clause.is_default ? (
                              <StarOff className="h-4 w-4 text-yellow-600" />
                            ) : (
                              <Star className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActive(clause)}
                            title={clause.is_active ? "Désactiver" : "Activer"}
                          >
                            <Switch checked={clause.is_active} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(clause)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(clause.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border-l-4 border-blue-200">
                        {clause.clause_text}
                      </p>
                      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                        <span>Créée le {new Date(clause.created_at).toLocaleDateString("fr-FR")}</span>
                        {clause.updated_at !== clause.created_at && (
                          <span>Modifiée le {new Date(clause.updated_at).toLocaleDateString("fr-FR")}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredClauses.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Info className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune clause trouvée</h3>
          <p className="text-gray-600 mb-4">
            {selectedCategory === "all"
              ? "Aucune clause n'a été créée pour le moment."
              : `Aucune clause n'a été créée pour la catégorie "${CLAUSE_CATEGORIES.find((c) => c.value === selectedCategory)?.label}".`}
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Créer la première clause
          </Button>
        </div>
      )}
    </div>
  )
}
