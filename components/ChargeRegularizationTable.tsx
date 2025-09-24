"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Plus,
  Upload,
  FileText,
  Euro,
  Calculator,
  CheckCircle,
  AlertCircle,
  Trash2,
  Eye
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

interface ChargeBreakdown {
  charge_name: string
  category: string
  provision_amount: number
  real_amount: number
  difference: number
  is_recoverable: boolean
  notes?: string
  documents?: Array<{
    id: string
    name: string
    url: string
    uploaded_at: string
  }>
}

interface ChargeRegularizationTableProps {
  chargeCategories: ChargeCategory[]
  totalProvisionsCollected: number
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
    const totalRealCharges = chargeBreakdown.reduce((sum, charge) => sum + charge.real_amount, 0)
    const recoverableCharges = chargeBreakdown
      .filter(charge => charge.is_recoverable)
      .reduce((sum, charge) => sum + charge.real_amount, 0)
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

  const handleNotesChange = (index: number, notes: string) => {
    const updatedBreakdown = [...chargeBreakdown]
    updatedBreakdown[index].notes = notes
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Détail des charges par catégorie
        </CardTitle>
        <CardDescription>
          Saisissez les montants réels payés et joignez les justificatifs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tableau des charges */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Poste</TableHead>
                <TableHead className="text-right">Provision (€/an)</TableHead>
                <TableHead className="text-right">Réel payé (€/an)</TableHead>
                <TableHead className="text-right">Différence</TableHead>
                <TableHead className="text-center">Récupérable</TableHead>
                <TableHead className="text-center">Justificatifs</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chargeBreakdown.map((charge, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{charge.charge_name}</div>
                      {charge.notes && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {charge.notes}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {charge.provision_amount.toFixed(2)} €
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={charge.real_amount}
                      onChange={(e) => handleRealAmountChange(index, parseFloat(e.target.value) || 0)}
                      className="text-right font-mono"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-mono ${charge.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {charge.difference >= 0 ? '+' : ''}{charge.difference.toFixed(2)} €
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={charge.is_recoverable ? "default" : "secondary"}>
                      {charge.is_recoverable ? "Oui" : "Non"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="file"
                        id={`file-${index}`}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileUpload(index, file)
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById(`file-${index}`)?.click()}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                      {charge.documents && charge.documents.length > 0 && (
                        <Badge variant="outline">
                          {charge.documents.length}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCharge(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Bouton d'ajout */}
        <div className="flex justify-center">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
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
                
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newCharge.notes}
                    onChange={(e) => setNewCharge(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Détails sur cette charge..."
                    rows={3}
                  />
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

        {/* Résumé des documents */}
        {chargeBreakdown.some(charge => charge.documents && charge.documents.length > 0) && (
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Documents joints</h4>
            <div className="space-y-2">
              {chargeBreakdown.map((charge, chargeIndex) => 
                charge.documents && charge.documents.length > 0 && (
                  <div key={chargeIndex} className="text-sm">
                    <span className="font-medium">{charge.charge_name}:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {charge.documents.map((doc, docIndex) => (
                        <div key={docIndex} className="flex items-center gap-2 bg-background rounded px-2 py-1">
                          <FileText className="h-3 w-3" />
                          <span>{doc.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(doc.url, '_blank')}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDocument(chargeIndex, docIndex)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
