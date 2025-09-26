"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Upload,
  FileText,
  Trash2,
  Eye
} from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { calculateProratedAmount, calculateExactProrata } from "@/lib/date-utils"

interface ChargeCategory {
  id: string
  name: string
  isRecoverable: boolean
}

interface ChargeBreakdown {
  id?: string
  category: string
  provisionAmount: number
  realAmount: number
  isRecoverable: boolean
  justificationFileUrl?: string
  notes?: string
}

interface ChargeRegularizationTableProps {
  chargeCategories: ChargeCategory[]
  totalProvisionsCollected: number
  occupationPeriod: {
    start: Date
    end: Date
  }
  initialData?: ChargeBreakdown[]
  onDataChange: (data: ChargeBreakdown[]) => void
  onCalculationChange: (calculation: {
    totalRealCharges: number
    recoverableCharges: number
    nonRecoverableCharges: number
    tenantBalance: number
    balanceType: 'refund' | 'additional_payment'
  }) => void
}

export function ChargeRegularizationTableNew({
  chargeCategories,
  totalProvisionsCollected,
  occupationPeriod,
  initialData = [],
  onDataChange,
  onCalculationChange
}: ChargeRegularizationTableProps) {
  const [chargeBreakdown, setChargeBreakdown] = useState<ChargeBreakdown[]>(initialData)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newCharge, setNewCharge] = useState<ChargeBreakdown>({
    category: '',
    provisionAmount: 0,
    realAmount: 0,
    isRecoverable: true,
    notes: ''
  })

  // Initialiser avec les données pré-remplies
  useEffect(() => {
    if (initialData && initialData.length > 0) {
      setChargeBreakdown(initialData)
      console.log('📊 Données initiales chargées dans le tableau:', initialData)
    } else if (chargeCategories && chargeCategories.length > 0) {
      // Initialiser avec les catégories par défaut
      const defaultBreakdown = chargeCategories.map(cat => ({
        category: cat.name || '',
        provisionAmount: 0,
        realAmount: 0,
        isRecoverable: cat.isRecoverable || false,
        notes: ''
      }))
      setChargeBreakdown(defaultBreakdown)
    }
  }, [initialData, chargeCategories])

  // Calculer les totaux quand les données changent
  useEffect(() => {
    if (!chargeBreakdown || chargeBreakdown.length === 0) return

    console.log('📊 Recalcul des totaux pour:', chargeBreakdown)

    const totalRealCharges = chargeBreakdown.reduce((sum, charge) => {
      return sum + (charge.realAmount || 0)
    }, 0)
    
    const recoverableCharges = chargeBreakdown
      .filter(charge => charge.isRecoverable)
      .reduce((sum, charge) => {
        return sum + (charge.realAmount || 0)
      }, 0)
      
    const nonRecoverableCharges = totalRealCharges - recoverableCharges
    const tenantBalance = (totalProvisionsCollected || 0) - recoverableCharges

    console.log('📊 Totaux calculés:', {
      totalRealCharges,
      recoverableCharges,
      nonRecoverableCharges,
      tenantBalance,
      balanceType: tenantBalance >= 0 ? 'refund' : 'additional_payment'
    })

    if (onCalculationChange) {
      onCalculationChange({
        totalRealCharges,
        recoverableCharges,
        nonRecoverableCharges,
        tenantBalance,
        balanceType: tenantBalance >= 0 ? 'refund' : 'additional_payment'
      })
    }

    if (onDataChange) {
      onDataChange(chargeBreakdown)
    }
  }, [chargeBreakdown, totalProvisionsCollected, onDataChange, onCalculationChange])

  const handleInputChange = (index: number, field: keyof ChargeBreakdown, value: any) => {
    if (!chargeBreakdown || index < 0 || index >= chargeBreakdown.length) return
    
    console.log('📝 Modification du champ:', { index, field, value })
    
    const updated = [...chargeBreakdown]
    updated[index] = { ...updated[index], [field]: value }
    setChargeBreakdown(updated)
    
    console.log('📝 Données mises à jour:', updated)
  }

  const handleAddCharge = () => {
    if (!newCharge.category.trim()) {
      toast.error("Veuillez saisir le nom de la charge")
      return
    }

    const updated = [...(chargeBreakdown || []), { ...newCharge }]
    setChargeBreakdown(updated)
    setNewCharge({
      category: '',
      provisionAmount: 0,
      realAmount: 0,
      isRecoverable: true,
      notes: ''
    })
    setIsDialogOpen(false)
    toast.success("Charge ajoutée")
  }

  const handleRemoveCharge = (index: number) => {
    if (!chargeBreakdown || index < 0 || index >= chargeBreakdown.length) return
    
    const updated = chargeBreakdown.filter((_, i) => i !== index)
    setChargeBreakdown(updated)
    toast.success("Charge supprimée")
  }

  const handleFileUpload = async (index: number, file: File) => {
    if (!chargeBreakdown || index < 0 || index >= chargeBreakdown.length) return
    
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `charge-justifications/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) {
        toast.error("Erreur lors de l'upload")
        return
      }

      const { data } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)

      const updated = [...chargeBreakdown]
      updated[index] = { ...updated[index], justificationFileUrl: data.publicUrl }
      setChargeBreakdown(updated)
      toast.success("Fichier uploadé")
    } catch (error) {
      toast.error("Erreur lors de l'upload")
    }
  }

  const prorata = calculateExactProrata(occupationPeriod.start, occupationPeriod.end, new Date().getFullYear())

  return (
    <div className="space-y-6">
      {/* En-tête du tableau */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Détail des charges</h3>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une charge
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter une charge</DialogTitle>
                <DialogDescription>
                  Ajoutez une charge supplémentaire non prévue dans les provisions
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category">Nom de la charge</Label>
                  <Input
                    id="category"
                    value={newCharge.category}
                    onChange={(e) => setNewCharge({ ...newCharge, category: e.target.value })}
                    placeholder="Ex: Entretien espaces verts"
                  />
                </div>
                <div>
                  <Label htmlFor="realAmount">Montant payé (€/an)</Label>
                  <Input
                    id="realAmount"
                    type="number"
                    step="0.01"
                    value={newCharge.realAmount}
                    onChange={(e) => setNewCharge({ ...newCharge, realAmount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isRecoverable"
                    checked={newCharge.isRecoverable}
                    onCheckedChange={(checked) => setNewCharge({ ...newCharge, isRecoverable: !!checked })}
                  />
                  <Label htmlFor="isRecoverable">Incluse dans la régularisation</Label>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newCharge.notes}
                    onChange={(e) => setNewCharge({ ...newCharge, notes: e.target.value })}
                    placeholder="Méthode de calcul, justifications..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleAddCharge}>
                  Ajouter
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tableau des charges */}
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700 w-1/3">Poste</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700 w-1/6">Provision</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700 w-1/6">Réel payé</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700 w-1/6">Part locataire</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700 w-1/6">Justificatifs</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700 w-1/12">Actions</th>
              </tr>
            </thead>
            <tbody>
              {chargeBreakdown && chargeBreakdown.length > 0 ? chargeBreakdown.map((charge, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{charge.category}</span>
                      {!charge.isRecoverable && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          Non récupérable
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Input
                      type="number"
                      step="0.01"
                      value={charge.provisionAmount}
                      onChange={(e) => handleInputChange(index, 'provisionAmount', parseFloat(e.target.value) || 0)}
                      className="text-right border-0 bg-transparent p-0 h-auto"
                    />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Input
                      type="number"
                      step="0.01"
                      value={charge.realAmount}
                      onChange={(e) => handleInputChange(index, 'realAmount', parseFloat(e.target.value) || 0)}
                      className="text-right border-0 bg-transparent p-0 h-auto"
                    />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-medium text-gray-900">
                      {charge.isRecoverable ? 
                        calculateProratedAmount(charge.realAmount, prorata).toFixed(2) : 
                        '0.00'
                      } €
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      {charge.justificationFileUrl ? (
                        <div className="flex items-center space-x-1">
                          <FileText className="h-4 w-4 text-green-600" />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(charge.justificationFileUrl, '_blank')}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <Upload className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleFileUpload(index, file)
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCharge(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    Aucune charge configurée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Informations sur le prorata */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Période d'occupation :</strong> {prorata.days} jours ({prorata.percentage.toFixed(1)}% de l'année)
          </p>
          <p className="text-sm text-blue-800">
            Les montants "Part locataire" sont calculés au prorata de la période d'occupation effective.
          </p>
        </div>
      </div>
    </div>
  )
}
