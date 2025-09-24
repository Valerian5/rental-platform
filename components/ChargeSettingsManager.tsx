"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
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
  calculationNotes?: string
  onCalculationNotesChange?: (notes: string) => void
}

const DEFAULT_CHARGE_CATEGORIES: ChargeCategory[] = [
  { name: "Eau froide", category: "eau", recoverable: true, included_in_provisions: true, default_amount: 0 },
  { name: "Électricité parties communes", category: "electricite", recoverable: true, included_in_provisions: true, default_amount: 0 },
  { name: "Ascenseur", category: "ascenseur", recoverable: true, included_in_provisions: true, default_amount: 0 },
  { name: "Chauffage collectif", category: "chauffage", recoverable: true, included_in_provisions: true, default_amount: 0 },
  { name: "Taxe ordures ménagères (TOEM)", category: "teom", recoverable: true, included_in_provisions: true, default_amount: 0 },
  { name: "Gardiennage", category: "gardiennage", recoverable: true, included_in_provisions: true, default_amount: 0 },
  { name: "Nettoyage", category: "nettoyage", recoverable: true, included_in_provisions: true, default_amount: 0 },
  { name: "Assurance propriétaire", category: "assurance", recoverable: false, included_in_provisions: false, default_amount: 0 }
]

export function ChargeSettingsManager({ 
  leaseId, 
  onSettingsChange, 
  calculationNotes = "",
  onCalculationNotesChange 
}: ChargeSettingsManagerProps) {
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

  const handleToggleRecoverable = (index: number) => {
    const updatedCategories = [...chargeCategories]
    updatedCategories[index].recoverable = !updatedCategories[index].recoverable
    if (!updatedCategories[index].recoverable) {
      updatedCategories[index].included_in_provisions = false
    }
    setChargeCategories(updatedCategories)
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

  const handleDeleteCharge = (index: number) => {
    const updatedCategories = chargeCategories.filter((_, i) => i !== index)
    setChargeCategories(updatedCategories)
  }

  if (isLoading) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-5 mb-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Chargement des paramètres de charges...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow-sm rounded-lg p-5 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-medium">Paramètres du bail</h2>
          <p className="text-sm text-gray-500">Définissez une fois ce qui est récupérable auprès du locataire.</p>
        </div>
        <div className="text-sm text-gray-500">
          <div>Jour de paiement : <strong>5</strong></div>
          <div>Provision charges : <strong>75 €/mois</strong></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="text-sm font-semibold mb-2">Charges récupérables (cocher celles qui s'appliquent)</h3>
          <div className="space-y-2 text-sm">
            {chargeCategories.map((charge, index) => (
              <label key={index} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="charge-toggle"
                  checked={charge.recoverable}
                  onChange={() => handleToggleRecoverable(index)}
                />
                <span>{charge.name}</span>
                {!charge.recoverable && (
                  <span className="text-xs text-gray-400">(non récupérable habituellement)</span>
                )}
              </label>
            ))}
          </div>
          
          <div className="mt-4 flex items-center gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <button className="inline-flex items-center px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs">
                  <Plus className="h-3 w-3 mr-1" />
                  Ajouter
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter une charge</DialogTitle>
                  <DialogDescription>
                    Ajoutez une nouvelle charge récupérable
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
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is-recoverable"
                      checked={newCharge.recoverable}
                      onChange={(e) => setNewCharge(prev => ({ ...prev, recoverable: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="is-recoverable">Récupérable</Label>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Annuler
                  </Button>
                  <Button onClick={handleAddCharge}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <button
              onClick={handleDeleteCharge}
              className="text-red-600 text-xs hover:text-red-800"
            >
              Supprimer sélectionnées
            </button>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded">
          <h3 className="text-sm font-semibold mb-2">Méthode de calcul</h3>
          <textarea
            rows={4}
            className="w-full border rounded p-2 text-sm"
            placeholder="Ex : répartition au prorata de la surface + relevés fournisseurs."
            value={calculationNotes}
            onChange={(e) => onCalculationNotesChange?.(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-2">Ce texte sera inclus dans le PDF de décompte.</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          <span>Charges récupérables: </span>
          <strong>{chargeCategories.filter(c => c.recoverable).length}</strong>
        </div>
        <Button onClick={saveChargeSettings} disabled={isSaving} size="sm">
          {isSaving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Sauvegarder
        </Button>
      </div>
    </div>
  )
}