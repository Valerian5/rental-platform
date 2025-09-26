"use client"

import React, { useState } from "react"
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
} from "@/components/ui/dialog"
import { Plus, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface ChargeExpense {
  id: string
  category: string
  amount: number
  is_recoverable: boolean
  notes?: string
}

export default function ChargeRegularizationPageTest() {
  const [expenses, setExpenses] = useState<ChargeExpense[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<ChargeExpense | null>(null)
  const [formData, setFormData] = useState({
    category: '',
    amount: 0,
    is_recoverable: true,
    notes: ''
  })

  const handleAddExpense = () => {
    console.log('🔍 Test - handleAddExpense appelé')
    try {
      setEditingExpense(null)
      setFormData({
        category: '',
        amount: 0,
        is_recoverable: true,
        notes: ''
      })
      console.log('🔍 Test - État formData réinitialisé')
      setIsDialogOpen(true)
      console.log('🔍 Test - Dialog ouvert')
    } catch (error) {
      console.error('❌ Test - Erreur handleAddExpense:', error)
    }
  }

  const handleEditExpense = (expense: ChargeExpense) => {
    console.log('🔍 Test - handleEditExpense appelé:', expense)
    try {
      setEditingExpense(expense)
      setFormData({
        category: expense.category,
        amount: expense.amount,
        is_recoverable: expense.is_recoverable,
        notes: expense.notes || ''
      })
      console.log('🔍 Test - État formData mis à jour')
      setIsDialogOpen(true)
      console.log('🔍 Test - Dialog ouvert pour édition')
    } catch (error) {
      console.error('❌ Test - Erreur handleEditExpense:', error)
    }
  }

  const handleDeleteExpense = (expenseId: string) => {
    const updatedExpenses = expenses.filter(expense => expense.id !== expenseId)
    setExpenses(updatedExpenses)
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
      notes: formData.notes
    }

    if (editingExpense) {
      // Modifier
      const updatedExpenses = expenses.map(expense =>
        expense.id === editingExpense.id ? expenseData : expense
      )
      setExpenses(updatedExpenses)
      toast.success('Dépense modifiée')
    } else {
      // Ajouter
      setExpenses([...expenses, expenseData])
      toast.success('Dépense ajoutée')
    }

    setIsDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Test Régularisation des charges</h1>
          <p className="text-gray-600">Test du popup d'ajout/modification</p>
        </div>
      </div>

      {/* Tableau des dépenses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Dépenses réelles</CardTitle>
              <CardDescription>
                Test du popup d'ajout/modification
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
              <p className="text-gray-500 mb-4">Aucune dépense enregistrée</p>
              <Button onClick={handleAddExpense} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter la première dépense
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {expenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">{expense.category}</div>
                    <div className="text-sm text-gray-600">
                      {expense.amount.toFixed(2)} € - {expense.is_recoverable ? 'Récupérable' : 'Non récupérable'}
                    </div>
                    {expense.notes && (
                      <div className="text-sm text-gray-500">{expense.notes}</div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
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
                </div>
              ))}
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
    </div>
  )
}

