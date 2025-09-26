"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
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
  Edit,
  Trash2,
  Upload,
  FileText,
  Eye
} from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

interface ChargeExpense {
  id: string
  category: string
  amount: number
  is_recoverable: boolean
  notes?: string
  supporting_documents: SupportingDocument[]
}

interface SupportingDocument {
  id: string
  file_name: string
  file_url: string
  file_size?: number
  file_type?: string
}

interface ExpensesTableProps {
  expenses: ChargeExpense[]
  daysOccupied: number
  onExpensesChange: (expenses: ChargeExpense[]) => void
  loading: boolean
}

export function ExpensesTable({ expenses, daysOccupied, onExpensesChange, loading }: ExpensesTableProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<ChargeExpense | null>(null)
  const [formData, setFormData] = useState({
    category: '',
    amount: 0,
    is_recoverable: true,
    notes: ''
  })

  const calculateQuotePart = (amount: number) => {
    return amount * (daysOccupied / 365)
  }

  const handleAddExpense = () => {
    console.log('🔍 ExpensesTable - handleAddExpense appelé')
    try {
      setEditingExpense(null)
      setFormData({
        category: '',
        amount: 0,
        is_recoverable: true,
        notes: ''
      })
      console.log('🔍 ExpensesTable - État formData réinitialisé')
      setIsDialogOpen(true)
      console.log('🔍 ExpensesTable - Dialog ouvert')
    } catch (error) {
      console.error('❌ ExpensesTable - Erreur handleAddExpense:', error)
    }
  }

  const handleEditExpense = (expense: ChargeExpense) => {
    console.log('🔍 ExpensesTable - handleEditExpense appelé:', expense)
    try {
      setEditingExpense(expense)
      setFormData({
        category: expense.category,
        amount: expense.amount,
        is_recoverable: expense.is_recoverable,
        notes: expense.notes || ''
      })
      console.log('🔍 ExpensesTable - État formData mis à jour')
      setIsDialogOpen(true)
      console.log('🔍 ExpensesTable - Dialog ouvert pour édition')
    } catch (error) {
      console.error('❌ ExpensesTable - Erreur handleEditExpense:', error)
    }
  }

  const handleDeleteExpense = (expenseId: string) => {
    const updatedExpenses = expenses.filter(expense => expense.id !== expenseId)
    onExpensesChange(updatedExpenses)
    toast.success('Dépense supprimée')
  }

  const handleSaveExpense = () => {
    if (!formData.category || formData.amount <= 0) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    const expenseData: ChargeExpense = {
      id: editingExpense?.id || `temp-${Date.now()}`,
      category: formData.category,
      amount: formData.amount,
      is_recoverable: formData.is_recoverable,
      notes: formData.notes,
      supporting_documents: editingExpense?.supporting_documents || []
    }

    if (editingExpense) {
      // Modifier
      const updatedExpenses = expenses.map(expense =>
        expense.id === editingExpense.id ? expenseData : expense
      )
      onExpensesChange(updatedExpenses)
      toast.success('Dépense modifiée')
    } else {
      // Ajouter
      onExpensesChange([...expenses, expenseData])
      toast.success('Dépense ajoutée')
    }

    setIsDialogOpen(false)
  }

  const handleFileUpload = async (expenseId: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${expenseId}-${Date.now()}.${fileExt}`
      const filePath = `charge-documents/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)

      const newDocument: SupportingDocument = {
        id: `doc-${Date.now()}`,
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        file_type: file.type
      }

      const updatedExpenses = expenses.map(expense => {
        if (expense.id === expenseId) {
          return {
            ...expense,
            supporting_documents: [...expense.supporting_documents, newDocument]
          }
        }
        return expense
      })

      onExpensesChange(updatedExpenses)
      toast.success('Fichier uploadé')
    } catch (error) {
      console.error('Erreur upload:', error)
      toast.error('Erreur lors de l\'upload')
    }
  }

  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const totalQuotePart = expenses
    .filter(expense => expense.is_recoverable)
    .reduce((sum, expense) => sum + calculateQuotePart(expense.amount), 0)

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-500">Chargement des dépenses...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Dépenses réelles</CardTitle>
            <CardDescription>
              Saisissez les montants payés annuellement pour chaque poste
            </CardDescription>
          </div>
          <Button onClick={handleAddExpense} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une dépense
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Aucune dépense enregistrée</p>
            <Button onClick={handleAddExpense} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter la première dépense
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Poste de dépense</TableHead>
                  <TableHead className="text-right">Montant payé (€)</TableHead>
                  <TableHead className="text-center">Récupérable</TableHead>
                  <TableHead className="text-right">Quote-part locataire (€)</TableHead>
                  <TableHead className="text-center">Justificatifs</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{expense.category}</div>
                        {expense.notes && (
                          <div className="text-sm text-gray-500">{expense.notes}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {expense.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={expense.is_recoverable}
                        disabled
                        className="pointer-events-none"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {expense.is_recoverable ? (
                        <span className="font-medium text-blue-600">
                          {calculateQuotePart(expense.amount).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-sm text-gray-500">
                          {expense.supporting_documents.length}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          className="hidden"
                          id={`file-${expense.id}`}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileUpload(expense.id, file)
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => document.getElementById(`file-${expense.id}`)?.click()}
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditExpense(expense)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteExpense(expense.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Résumé */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm text-gray-600">Total dépenses</div>
                  <div className="text-lg font-semibold">{totalAmount.toFixed(2)} €</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total récupérable</div>
                  <div className="text-lg font-semibold text-blue-600">
                    {expenses.filter(e => e.is_recoverable).reduce((sum, e) => sum + e.amount, 0).toFixed(2)} €
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Quote-part locataire</div>
                  <div className="text-lg font-semibold text-green-600">
                    {totalQuotePart.toFixed(2)} €
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dialog d'ajout/modification */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingExpense ? 'Modifier la dépense' : 'Ajouter une dépense'}
              </DialogTitle>
              <DialogDescription>
                Saisissez les informations de la dépense
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="category">Poste de dépense *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Ex: Eau froide, Chauffage, Ascenseur..."
                />
              </div>
              <div>
                <Label htmlFor="amount">Montant payé (€) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recoverable"
                  checked={formData.is_recoverable}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_recoverable: !!checked })}
                />
                <Label htmlFor="recoverable">Charge récupérable</Label>
              </div>
              <div>
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Informations complémentaires..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveExpense}>
                {editingExpense ? 'Modifier' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
