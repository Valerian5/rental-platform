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

export function ChargeRegularizationTable({
  chargeCategories,
  totalProvisionsCollected,
  occupationPeriod,
  onDataChange,
  onCalculationChange
}: ChargeRegularizationTableProps) {
  const [chargeBreakdown, setChargeBreakdown] = useState<ChargeBreakdown[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newCharge, setNewCharge] = useState<ChargeBreakdown>({
    charge_name: "",
    category: "",
    provision_amount: 0,
    real_amount: 0,
    difference: 0,
    is_recoverable: true,
    notes: "",
    documents: []
  })

  useEffect(() => {
    // Initialiser le tableau avec les catégories de charges
    const initialBreakdown = chargeCategories
      .filter(cat => cat.included_in_provisions)
      .map(cat => ({
        charge_name: cat.name,
        category: cat.category,
        provision_amount: cat.default_amount,
        real_amount: 0,
        difference: -cat.default_amount,
        is_recoverable: cat.recoverable,
        notes: "",
        documents: []
      }))
    
    setChargeBreakdown(initialBreakdown)
  }, [chargeCategories])

  useEffect(() => {
    // Recalculer les totaux quand les données changent
    recalculateTotals()
  }, [chargeBreakdown, totalProvisionsCollected])

  const recalculateTotals = () => {
    // Calculer le prorata exact en jours
    const prorata = calculateExactProrata(
      occupationPeriod.start,
      occupationPeriod.end,
      occupationPeriod.start.getFullYear()
    )
    
    // Calculer les charges réelles proratisées
    const totalRealCharges = chargeBreakdown.reduce((sum, charge) => {
      const proratedAmount = calculateProratedAmount(charge.real_amount, prorata)
      return sum + proratedAmount
    }, 0)
    
    const recoverableCharges = chargeBreakdown
      .filter(charge => charge.is_recoverable)
      .reduce((sum, charge) => {
        const proratedAmount = calculateProratedAmount(charge.real_amount, prorata)
        return sum + proratedAmount
      }, 0)
    
    const nonRecoverableCharges = totalRealCharges - recoverableCharges
    const tenantBalance = totalProvisionsCollected - recoverableCharges

    onCalculationChange({
      totalRealCharges,
      recoverableCharges,
      nonRecoverableCharges,
      tenantBalance,
      balanceType: tenantBalance >= 0 ? 'refund' : 'additional_payment'
    })

    onDataChange(chargeBreakdown)
  }

  const handleRealAmountChange = (index: number, amount: number) => {
    const updatedBreakdown = [...chargeBreakdown]
    updatedBreakdown[index].real_amount = amount
    updatedBreakdown[index].difference = amount - updatedBreakdown[index].provision_amount
    setChargeBreakdown(updatedBreakdown)
  }

  const handleProvisionAmountChange = (index: number, amount: number) => {
    const updatedBreakdown = [...chargeBreakdown]
    updatedBreakdown[index].provision_amount = amount
    updatedBreakdown[index].difference = updatedBreakdown[index].real_amount - amount
    setChargeBreakdown(updatedBreakdown)
  }

  const handleToggleRecoverable = (index: number) => {
    const updatedBreakdown = [...chargeBreakdown]
    updatedBreakdown[index].is_recoverable = !updatedBreakdown[index].is_recoverable
    setChargeBreakdown(updatedBreakdown)
  }

  const handleAddCharge = () => {
    if (!newCharge.charge_name.trim()) {
      toast.error("Veuillez saisir un nom pour la charge")
      return
    }

    const updatedBreakdown = [...chargeBreakdown, { ...newCharge }]
    setChargeBreakdown(updatedBreakdown)
    setNewCharge({
      charge_name: "",
      category: "",
      provision_amount: 0,
      real_amount: 0,
      difference: 0,
      is_recoverable: true,
      notes: "",
      documents: []
    })
    setIsDialogOpen(false)
  }

  const handleDeleteCharge = (index: number) => {
    const updatedBreakdown = chargeBreakdown.filter((_, i) => i !== index)
    setChargeBreakdown(updatedBreakdown)
  }

  const handleFileUpload = async (index: number, file: File) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `charge-documents/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) {
        console.error("Erreur upload:", uploadError)
        toast.error("Erreur lors de l'upload du fichier")
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)

      const updatedBreakdown = [...chargeBreakdown]
      if (!updatedBreakdown[index].documents) {
        updatedBreakdown[index].documents = []
      }
      
      updatedBreakdown[index].documents!.push({
        id: fileName,
        name: file.name,
        url: publicUrl,
        uploaded_at: new Date().toISOString()
      })

      setChargeBreakdown(updatedBreakdown)
      toast.success("Fichier uploadé avec succès")
    } catch (error) {
      console.error("Erreur upload fichier:", error)
      toast.error("Erreur lors de l'upload du fichier")
    }
  }

  const handleDeleteDocument = (chargeIndex: number, docIndex: number) => {
    const updatedBreakdown = [...chargeBreakdown]
    updatedBreakdown[chargeIndex].documents?.splice(docIndex, 1)
    setChargeBreakdown(updatedBreakdown)
  }

  return (
    <div className="bg-white shadow-sm rounded-lg p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Tableau des charges</h2>
        <div className="flex items-center gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                <Plus className="h-4 w-4 mr-1" />
                + Ajouter une charge
              </button>
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
                  <Label htmlFor="charge-name">Nom de la charge</Label>
                  <Input
                    id="charge-name"
                    value={newCharge.charge_name}
                    onChange={(e) => setNewCharge(prev => ({ ...prev, charge_name: e.target.value }))}
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
                  <div>
                    <Label htmlFor="provision-amount">Provision (€/an)</Label>
                    <Input
                      id="provision-amount"
                      type="number"
                      step="0.01"
                      value={newCharge.provision_amount}
                      onChange={(e) => setNewCharge(prev => ({ 
                        ...prev, 
                        provision_amount: parseFloat(e.target.value) || 0,
                        difference: prev.real_amount - (parseFloat(e.target.value) || 0)
                      }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="real-amount">Montant réel (€/an)</Label>
                    <Input
                      id="real-amount"
                      type="number"
                      step="0.01"
                      value={newCharge.real_amount}
                      onChange={(e) => setNewCharge(prev => ({ 
                        ...prev, 
                        real_amount: parseFloat(e.target.value) || 0,
                        difference: (parseFloat(e.target.value) || 0) - prev.provision_amount
                      }))}
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is-recoverable"
                    checked={newCharge.is_recoverable}
                    onChange={(e) => setNewCharge(prev => ({ ...prev, is_recoverable: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="is-recoverable">Incluse dans la régularisation</Label>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleAddCharge}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500">
              <th className="w-1/4 px-3 py-2">Poste</th>
              <th className="w-1/6 px-3 py-2">Provision (€/an)</th>
              <th className="w-1/6 px-3 py-2">Charges annuelles (€/an)</th>
              <th className="w-1/6 px-3 py-2">Quote-part locataire (€)</th>
              <th className="w-1/6 px-3 py-2">Incluse (récupérable)</th>
              <th className="w-1/6 px-3 py-2">Justificatif</th>
              <th className="w-12 px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {chargeBreakdown.map((charge, index) => (
              <tr key={index} className="border-t">
                <td className="px-3 py-3">
                  <input 
                    className="w-full border rounded p-2 text-sm" 
                    value={charge.charge_name}
                    onChange={(e) => {
                      const updatedBreakdown = [...chargeBreakdown]
                      updatedBreakdown[index].charge_name = e.target.value
                      setChargeBreakdown(updatedBreakdown)
                    }}
                  />
                </td>
                <td className="px-3 py-3">
                  <input 
                    className="w-full border rounded p-2 text-sm provision-input" 
                    type="number"
                    step="0.01"
                    value={charge.provision_amount}
                    onChange={(e) => handleProvisionAmountChange(index, parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td className="px-3 py-3">
                  <input 
                    className="w-full border rounded p-2 text-sm reel-input" 
                    type="number"
                    step="0.01"
                    value={charge.real_amount}
                    onChange={(e) => handleRealAmountChange(index, parseFloat(e.target.value) || 0)}
                    placeholder="Montant annuel"
                  />
                </td>
                <td className="px-3 py-3">
                  <div className="text-sm font-medium text-blue-600">
                    {(() => {
                      const prorata = calculateExactProrata(
                        occupationPeriod.start,
                        occupationPeriod.end,
                        occupationPeriod.start.getFullYear()
                      )
                      const proratedAmount = calculateProratedAmount(charge.real_amount, prorata)
                      return `${proratedAmount.toFixed(2)} €`
                    })()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {(() => {
                      const prorata = calculateExactProrata(
                        occupationPeriod.start,
                        occupationPeriod.end,
                        occupationPeriod.start.getFullYear()
                      )
                      return `${prorata.occupationDays} jours (${prorata.percentage.toFixed(1)}%)`
                    })()}
                  </div>
                </td>
                <td className="px-3 py-3 text-center">
                  <input 
                    type="checkbox" 
                    className="incluse-checkbox" 
                    checked={charge.is_recoverable}
                    onChange={() => handleToggleRecoverable(index)}
                  />
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <input 
                      type="file" 
                      className="file-input hidden" 
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(index, file)
                      }}
                    />
                    <button 
                      className="uploadBtn inline-flex items-center px-2 py-1 bg-gray-100 border rounded text-xs"
                      onClick={() => {
                        const fileInput = document.querySelector(`input[type="file"]`) as HTMLInputElement
                        fileInput?.click()
                      }}
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      Joindre
                    </button>
                    <div className="file-name text-xs ml-2">
                      {charge.documents && charge.documents.length > 0 ? 
                        `${charge.documents.length} fichier(s)` : '—'
                      }
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-center">
                  <button 
                    className="removeRowBtn text-red-600 text-sm hover:text-red-800"
                    onClick={() => handleDeleteCharge(index)}
                  >
                    Suppr
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Résumé des documents joints */}
      {chargeBreakdown.some(charge => charge.documents && charge.documents.length > 0) && (
        <div className="mt-4 bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium mb-2">Documents joints</h4>
          <div className="space-y-2">
            {chargeBreakdown.map((charge, chargeIndex) => 
              charge.documents && charge.documents.length > 0 && (
                <div key={chargeIndex} className="text-sm">
                  <span className="font-medium">{charge.charge_name}:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {charge.documents.map((doc, docIndex) => (
                      <div key={docIndex} className="flex items-center gap-2 bg-white rounded px-2 py-1 border">
                        <FileText className="h-3 w-3" />
                        <span className="text-xs">{doc.name}</span>
                        <button
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => window.open(doc.url, '_blank')}
                        >
                          <Eye className="h-3 w-3" />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800"
                          onClick={() => handleDeleteDocument(chargeIndex, docIndex)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}