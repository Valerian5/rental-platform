"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Settings,
  Euro,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

interface ChargeCategory {
  name: string
  category: string
  recoverable: boolean
  included_in_provisions: boolean
  default_amount: number
}

interface ChargeSettingsManagerProps {
  leaseId: string
  onSettingsChange?: (settings: ChargeCategory[]) => void
}

const DEFAULT_CHARGE_CATEGORIES: ChargeCategory[] = [
  { name: "Eau froide", category: "eau", recoverable: true, included_in_provisions: true, default_amount: 0 },
  { name: "Électricité parties communes", category: "electricite", recoverable: true, included_in_provisions: true, default_amount: 0 },
  { name: "Ascenseur", category: "ascenseur", recoverable: true, included_in_provisions: true, default_amount: 0 },
  { name: "Chauffage collectif", category: "chauffage", recoverable: true, included_in_provisions: true, default_amount: 0 },
  { name: "Taxe ordures ménagères (TEOM)", category: "teom", recoverable: true, included_in_provisions: true, default_amount: 0 },
  { name: "Gardiennage", category: "gardiennage", recoverable: true, included_in_provisions: true, default_amount: 0 },
  { name: "Nettoyage", category: "nettoyage", recoverable: true, included_in_provisions: true, default_amount: 0 },
  { name: "Assurance propriétaire", category: "assurance", recoverable: false, included_in_provisions: false, default_amount: 0 }
]

export function ChargeSettingsManager({ leaseId, onSettingsChange }: ChargeSettingsManagerProps) {
  const [chargeCategories, setChargeCategories] = useState<ChargeCategory[]>(DEFAULT_CHARGE_CATEGORIES)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [newCharge, setNewCharge] = useState<ChargeCategory>({
    name: "",
    category: "",
    recoverable: true,
    included_in_provisions: true,
    default_amount: 0
  })

  useEffect(() => {
    loadChargeSettings()
  }, [leaseId])

  const loadChargeSettings = async () => {
    try {
      setIsLoading(true)
      
      const { data, error } = await supabase
        .from('lease_charge_settings')
        .select('charge_categories')
        .eq('lease_id', leaseId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error("Erreur chargement paramètres charges:", error)
        toast.error("Erreur lors du chargement des paramètres")
        return
      }

      if (data && data.charge_categories) {
        setChargeCategories(data.charge_categories)
      } else {
        // Utiliser les paramètres par défaut
        setChargeCategories(DEFAULT_CHARGE_CATEGORIES)
      }
    } catch (error) {
      console.error("Erreur chargement paramètres charges:", error)
      toast.error("Erreur lors du chargement des paramètres")
    } finally {
      setIsLoading(false)
    }
  }

  const saveChargeSettings = async () => {
    try {
      setIsSaving(true)

      const { error } = await supabase
        .from('lease_charge_settings')
        .upsert({
          lease_id: leaseId,
          charge_categories: chargeCategories,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error("Erreur sauvegarde paramètres:", error)
        toast.error("Erreur lors de la sauvegarde")
        return
      }

      toast.success("Paramètres de charges sauvegardés")
      onSettingsChange?.(chargeCategories)
    } catch (error) {
      console.error("Erreur sauvegarde paramètres:", error)
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddCharge = () => {
    if (!newCharge.name.trim()) {
      toast.error("Veuillez saisir un nom pour la charge")
      return
    }

    const updatedCategories = [...chargeCategories, { ...newCharge }]
    setChargeCategories(updatedCategories)
    setNewCharge({
      name: "",
      category: "",
      recoverable: true,
      included_in_provisions: true,
      default_amount: 0
    })
    setIsDialogOpen(false)
  }

  const handleEditCharge = (index: number) => {
    setEditingIndex(index)
    setNewCharge({ ...chargeCategories[index] })
    setIsDialogOpen(true)
  }

  const handleUpdateCharge = () => {
    if (!newCharge.name.trim()) {
      toast.error("Veuillez saisir un nom pour la charge")
      return
    }

    if (editingIndex !== null) {
      const updatedCategories = [...chargeCategories]
      updatedCategories[editingIndex] = { ...newCharge }
      setChargeCategories(updatedCategories)
    }

    setEditingIndex(null)
    setNewCharge({
      name: "",
      category: "",
      recoverable: true,
      included_in_provisions: true,
      default_amount: 0
    })
    setIsDialogOpen(false)
  }

  const handleDeleteCharge = (index: number) => {
    const updatedCategories = chargeCategories.filter((_, i) => i !== index)
    setChargeCategories(updatedCategories)
  }

  const handleToggleRecoverable = (index: number) => {
    const updatedCategories = [...chargeCategories]
    updatedCategories[index].recoverable = !updatedCategories[index].recoverable
    setChargeCategories(updatedCategories)
  }

  const handleToggleIncluded = (index: number) => {
    const updatedCategories = [...chargeCategories]
    updatedCategories[index].included_in_provisions = !updatedCategories[index].included_in_provisions
    setChargeCategories(updatedCategories)
  }

  const handleDefaultAmountChange = (index: number, amount: number) => {
    const updatedCategories = [...chargeCategories]
    updatedCategories[index].default_amount = amount
    setChargeCategories(updatedCategories)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Chargement des paramètres de charges...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Paramétrage des charges incluses dans le bail
        </CardTitle>
        <CardDescription>
          Définissez quelles charges sont récupérables et incluses dans les provisions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Liste des charges */}
        <div className="space-y-3">
          {chargeCategories.map((charge, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium">{charge.name}</h4>
                  <Badge variant={charge.recoverable ? "default" : "secondary"}>
                    {charge.recoverable ? "Récupérable" : "Non récupérable"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditCharge(index)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteCharge(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={charge.recoverable}
                    onCheckedChange={() => handleToggleRecoverable(index)}
                  />
                  <Label className="text-sm">Récupérable</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={charge.included_in_provisions}
                    onCheckedChange={() => handleToggleIncluded(index)}
                    disabled={!charge.recoverable}
                  />
                  <Label className="text-sm">Incluse dans provisions</Label>
                </div>
                
                <div>
                  <Label htmlFor={`amount-${index}`} className="text-sm">Montant par défaut (€/an)</Label>
                  <Input
                    id={`amount-${index}`}
                    type="number"
                    step="0.01"
                    value={charge.default_amount}
                    onChange={(e) => handleDefaultAmountChange(index, parseFloat(e.target.value) || 0)}
                    className="h-8"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une charge
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingIndex !== null ? "Modifier la charge" : "Ajouter une charge"}
                </DialogTitle>
                <DialogDescription>
                  {editingIndex !== null 
                    ? "Modifiez les informations de la charge" 
                    : "Ajoutez une nouvelle charge récupérable"
                  }
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="charge-name">Nom de la charge</Label>
                  <Input
                    id="charge-name"
                    value={newCharge.name}
                    onChange={(e) => setNewCharge(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Entretien espaces verts"
                  />
                </div>
                
                <div>
                  <Label htmlFor="charge-category">Catégorie</Label>
                  <Input
                    id="charge-category"
                    value={newCharge.category}
                    onChange={(e) => setNewCharge(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="Ex: entretien"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={newCharge.recoverable}
                      onCheckedChange={(checked) => setNewCharge(prev => ({ ...prev, recoverable: checked as boolean }))}
                    />
                    <Label className="text-sm">Récupérable</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={newCharge.included_in_provisions}
                      onCheckedChange={(checked) => setNewCharge(prev => ({ ...prev, included_in_provisions: checked as boolean }))}
                    />
                    <Label className="text-sm">Incluse dans provisions</Label>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="default-amount">Montant par défaut (€/an)</Label>
                  <Input
                    id="default-amount"
                    type="number"
                    step="0.01"
                    value={newCharge.default_amount}
                    onChange={(e) => setNewCharge(prev => ({ ...prev, default_amount: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
                <Button onClick={editingIndex !== null ? handleUpdateCharge : handleAddCharge}>
                  {editingIndex !== null ? (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button onClick={saveChargeSettings} disabled={isSaving}>
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Sauvegarder
          </Button>
        </div>

        {/* Résumé */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium mb-2">Résumé des paramètres</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Charges récupérables:</span>
              <span className="ml-2 font-medium">
                {chargeCategories.filter(c => c.recoverable).length}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Incluses dans provisions:</span>
              <span className="ml-2 font-medium">
                {chargeCategories.filter(c => c.included_in_provisions).length}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
