"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  TrendingUp,
  Calendar,
  Euro,
  RefreshCw,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle
} from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

interface IRLData {
  id?: string
  year: number
  quarter: number
  value: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export default function IRLManagementPage() {
  const [irlData, setIrlData] = useState<IRLData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editingItem, setEditingItem] = useState<IRLData | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  // État pour le formulaire d'édition
  const [formData, setFormData] = useState({
    year: currentYear,
    quarter: 1,
    value: 0,
    is_active: true
  })

  useEffect(() => {
    loadIRLData()
  }, [])

  const loadIRLData = async () => {
    try {
      setIsLoading(true)
      
      const { data, error } = await supabase
        .from('irl_indices')
        .select('*')
        .order('year', { ascending: false })
        .order('quarter', { ascending: false })

      if (error) {
        console.error("Erreur chargement IRL:", error)
        toast.error("Erreur lors du chargement des indices IRL")
        return
      }

      setIrlData(data || [])
    } catch (error) {
      console.error("Erreur chargement IRL:", error)
      toast.error("Erreur lors du chargement des indices IRL")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddNew = () => {
    setFormData({
      year: currentYear,
      quarter: 1,
      value: 0,
      is_active: true
    })
    setEditingItem(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (item: IRLData) => {
    setFormData({
      year: item.year,
      quarter: item.quarter,
      value: item.value,
      is_active: item.is_active
    })
    setEditingItem(item)
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)

      if (editingItem) {
        // Mise à jour
        const { error } = await supabase
          .from('irl_indices')
          .update({
            year: formData.year,
            quarter: formData.quarter,
            value: formData.value,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingItem.id)

        if (error) {
          console.error("Erreur mise à jour IRL:", error)
          toast.error("Erreur lors de la mise à jour")
          return
        }

        toast.success("Indice IRL mis à jour avec succès")
      } else {
        // Création
        const { error } = await supabase
          .from('irl_indices')
          .insert({
            year: formData.year,
            quarter: formData.quarter,
            value: formData.value,
            is_active: formData.is_active
          })

        if (error) {
          console.error("Erreur création IRL:", error)
          toast.error("Erreur lors de la création")
          return
        }

        toast.success("Indice IRL créé avec succès")
      }

      setIsDialogOpen(false)
      await loadIRLData()
    } catch (error) {
      console.error("Erreur sauvegarde IRL:", error)
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('irl_indices')
        .delete()
        .eq('id', id)

      if (error) {
        console.error("Erreur suppression IRL:", error)
        toast.error("Erreur lors de la suppression")
        return
      }

      toast.success("Indice IRL supprimé avec succès")
      await loadIRLData()
    } catch (error) {
      console.error("Erreur suppression IRL:", error)
      toast.error("Erreur lors de la suppression")
    }
  }

  const handleToggleActive = async (item: IRLData) => {
    try {
      const { error } = await supabase
        .from('irl_indices')
        .update({ 
          is_active: !item.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id)

      if (error) {
        console.error("Erreur toggle IRL:", error)
        toast.error("Erreur lors de la modification")
        return
      }

      toast.success(`Indice IRL ${!item.is_active ? 'activé' : 'désactivé'}`)
      await loadIRLData()
    } catch (error) {
      console.error("Erreur toggle IRL:", error)
      toast.error("Erreur lors de la modification")
    }
  }

  const getQuarterLabel = (quarter: number) => {
    return quarter === 1 ? '1er' : `${quarter}e`
  }

  const getFilteredData = () => {
    return irlData.filter(item => item.year === currentYear)
  }

  const getYears = () => {
    const years = [...new Set(irlData.map(item => item.year))]
    return years.sort((a, b) => b - a)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestion des indices IRL</h1>
          <p className="text-muted-foreground">Administration des indices de référence des loyers</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Chargement des indices IRL...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des indices IRL</h1>
          <p className="text-muted-foreground">Administration des indices de référence des loyers</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={currentYear.toString()} onValueChange={(value) => setCurrentYear(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Année" />
            </SelectTrigger>
            <SelectContent>
              {getYears().map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un indice
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total indices</p>
                <p className="text-2xl font-bold">{irlData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Actifs</p>
                <p className="text-2xl font-bold">{irlData.filter(item => item.is_active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Année {currentYear}</p>
                <p className="text-2xl font-bold">{getFilteredData().length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Euro className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Dernier indice</p>
                <p className="text-2xl font-bold">
                  {irlData.length > 0 ? irlData[0].value.toFixed(2) : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table des indices */}
      <Card>
        <CardHeader>
          <CardTitle>Indices IRL - {currentYear}</CardTitle>
          <CardDescription>
            Gestion des indices de référence des loyers pour l'année {currentYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trimestre</TableHead>
                <TableHead>Valeur</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernière modification</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getFilteredData().map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {getQuarterLabel(item.quarter)} trimestre {item.year}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-lg">{item.value.toFixed(2)}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.is_active ? "default" : "secondary"}>
                      {item.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.updated_at ? new Date(item.updated_at).toLocaleDateString('fr-FR') : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(item)}
                      >
                        {item.is_active ? "Désactiver" : "Activer"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer l'indice IRL</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir supprimer l'indice du {getQuarterLabel(item.quarter)} trimestre {item.year} ?
                              Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(item.id!)}>
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {getFilteredData().length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun indice IRL pour l'année {currentYear}</p>
              <p className="text-sm">Cliquez sur "Ajouter un indice" pour commencer</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog d'édition */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Modifier l'indice IRL" : "Ajouter un indice IRL"}
            </DialogTitle>
            <DialogDescription>
              {editingItem 
                ? "Modifiez les informations de l'indice IRL" 
                : "Ajoutez un nouvel indice IRL pour un trimestre"
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="year">Année</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    year: parseInt(e.target.value) || currentYear
                  }))}
                  min="2020"
                  max="2030"
                />
              </div>
              <div>
                <Label htmlFor="quarter">Trimestre</Label>
                <Select
                  value={formData.quarter.toString()}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    quarter: parseInt(value)
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1er trimestre</SelectItem>
                    <SelectItem value="2">2e trimestre</SelectItem>
                    <SelectItem value="3">3e trimestre</SelectItem>
                    <SelectItem value="4">4e trimestre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="value">Valeur de l'indice</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  value: parseFloat(e.target.value) || 0
                }))}
                placeholder="Ex: 142.45"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  is_active: e.target.checked
                }))}
                className="rounded"
              />
              <Label htmlFor="is_active">Indice actif (disponible pour les révisions)</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {editingItem ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
