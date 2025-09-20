"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Calculator, AlertCircle, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface AddExpenseDialogProps {
  propertyId?: string
  leaseId?: string
  onExpenseAdded?: () => void
}

const expenseTypes = [
  { value: "incident", label: "Incident locataire", description: "Dépense causée par le locataire" },
  { value: "maintenance", label: "Travaux propriétaire", description: "Travaux d'entretien ou de réparation" },
  { value: "annual_charge", label: "Charge annuelle", description: "Taxes, assurances, intérêts..." }
]

const expenseCategories = [
  { value: "repair", label: "Réparations", deductible: true, color: "bg-red-100 text-red-800" },
  { value: "maintenance", label: "Entretien", deductible: true, color: "bg-blue-100 text-blue-800" },
  { value: "tax", label: "Taxes", deductible: true, color: "bg-green-100 text-green-800" },
  { value: "insurance", label: "Assurance", deductible: true, color: "bg-purple-100 text-purple-800" },
  { value: "interest", label: "Intérêts", deductible: true, color: "bg-orange-100 text-orange-800" },
  { value: "management", label: "Gestion", deductible: true, color: "bg-gray-100 text-gray-800" },
  { value: "improvement", label: "Améliorations", deductible: false, color: "bg-yellow-100 text-yellow-800" }
]

export function AddExpenseDialog({ propertyId, leaseId, onExpenseAdded }: AddExpenseDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    property_id: propertyId || "",
    lease_id: leaseId || "",
    type: "",
    category: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    description: "",
    receipt_url: ""
  })

  const selectedCategory = expenseCategories.find(cat => cat.value === formData.category)
  const isDeductible = selectedCategory?.deductible ?? true

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.property_id || !formData.type || !formData.category || !formData.amount || !formData.description) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }

    if (parseFloat(formData.amount) <= 0) {
      toast.error("Le montant doit être positif")
      return
    }

    try {
      setIsLoading(true)

      // Récupérer le token d'authentification
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session?.access_token) {
        toast.error("Session expirée, veuillez vous reconnecter")
        return
      }

      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionData.session.access_token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Dépense ajoutée avec succès")
        setOpen(false)
        setFormData({
          property_id: propertyId || "",
          lease_id: leaseId || "",
          type: "",
          category: "",
          amount: "",
          date: new Date().toISOString().split('T')[0],
          description: "",
          receipt_url: ""
        })
        onExpenseAdded?.()
      } else {
        toast.error(data.error || "Erreur lors de l'ajout de la dépense")
      }
    } catch (error) {
      console.error("Erreur ajout dépense:", error)
      toast.error("Erreur lors de l'ajout de la dépense")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une dépense
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajouter une dépense</DialogTitle>
          <DialogDescription>
            Enregistrez une nouvelle dépense pour votre déclaration fiscale
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type de dépense */}
            <div className="space-y-2">
              <Label htmlFor="type">Type de dépense *</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {expenseTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-sm text-muted-foreground">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Catégorie */}
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      <div className="flex items-center gap-2">
                        <span>{category.label}</span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${category.color}`}
                        >
                          {category.deductible ? "Déductible" : "Non déductible"}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Montant et date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Montant (€) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Décrivez la dépense..."
              rows={3}
            />
          </div>

          {/* URL du justificatif */}
          <div className="space-y-2">
            <Label htmlFor="receipt_url">URL du justificatif (optionnel)</Label>
            <Input
              id="receipt_url"
              type="url"
              value={formData.receipt_url}
              onChange={(e) => handleInputChange("receipt_url", e.target.value)}
              placeholder="https://..."
            />
          </div>

          {/* Aperçu de la déductibilité */}
          {formData.category && (
            <Card className={isDeductible ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  {isDeductible ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                  Impact fiscal
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isDeductible ? "text-green-900" : "text-yellow-900"}`}>
                      {isDeductible ? "Dépense déductible" : "Dépense non déductible"}
                    </p>
                    <p className={`text-xs ${isDeductible ? "text-green-700" : "text-yellow-700"}`}>
                      {isDeductible 
                        ? "Cette dépense réduira votre revenu imposable"
                        : "Cette dépense ne peut pas être déduite de vos revenus"
                      }
                    </p>
                  </div>
                  {formData.amount && (
                    <div className="text-right">
                      <p className={`text-lg font-bold ${isDeductible ? "text-green-700" : "text-yellow-700"}`}>
                        {parseFloat(formData.amount).toLocaleString('fr-FR')} €
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isDeductible ? "Économie d'impôt" : "Pas d'économie"}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Calculator className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {isLoading ? "Ajout en cours..." : "Ajouter la dépense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
