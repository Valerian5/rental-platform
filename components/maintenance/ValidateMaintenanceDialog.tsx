"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, Euro, Calendar, Wrench } from "lucide-react"
import { toast } from "sonner"

interface ValidateMaintenanceDialogProps {
  work: any
  isOpen: boolean
  onClose: () => void
  onValidate: (work: any, expenseData: any) => void
}

const expenseCategories = [
  { value: "repair", label: "Réparations", deductible: true, color: "bg-red-100 text-red-800" },
  { value: "maintenance", label: "Entretien", deductible: true, color: "bg-blue-100 text-blue-800" },
  { value: "tax", label: "Taxes", deductible: true, color: "bg-green-100 text-green-800" },
  { value: "insurance", label: "Assurance", deductible: true, color: "bg-purple-100 text-purple-800" },
  { value: "interest", label: "Intérêts", deductible: true, color: "bg-orange-100 text-orange-800" },
  { value: "management", label: "Gestion", deductible: true, color: "bg-gray-100 text-gray-800" },
  { value: "improvement", label: "Améliorations", deductible: false, color: "bg-yellow-100 text-yellow-800" }
]

export function ValidateMaintenanceDialog({ work, isOpen, onClose, onValidate }: ValidateMaintenanceDialogProps) {
  const [formData, setFormData] = useState({
    amount: "",
    date: new Date().toISOString().split('T')[0],
    description: "",
    category: "",
    receipt_url: ""
  })

  useEffect(() => {
    if (work) {
      // Pré-remplir avec les données du travail
      const workCost = work.cost && work.cost > 0 ? work.cost : (work.estimated_cost && work.estimated_cost > 0 ? work.estimated_cost : 0)
      
      // Déterminer la catégorie fiscale basée sur le type de travaux
      const getFiscalCategory = (type: string, category: string) => {
        if (type === "improvement") return "improvement"
        if (category === "plumbing" || category === "electrical" || category === "heating") return "repair"
        return "maintenance"
      }

      setFormData({
        amount: workCost.toString(),
        date: new Date().toISOString().split('T')[0], // Date d'aujourd'hui
        description: `${work.title} - ${work.description}`,
        category: getFiscalCategory(work.type, work.category),
        receipt_url: ""
      })
    }
  }, [work])

  const selectedCategory = expenseCategories.find(cat => cat.value === formData.category)
  const isDeductible = selectedCategory?.deductible ?? true

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.amount || !formData.description || !formData.category) {
      toast.error("Veuillez remplir les champs obligatoires")
      return
    }

    if (parseFloat(formData.amount) <= 0) {
      toast.error("Le montant doit être positif")
      return
    }

    onValidate(work, {
      ...formData,
      amount: parseFloat(formData.amount),
      deductible: isDeductible
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!work) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Valider les travaux
          </DialogTitle>
          <DialogDescription>
            Créez une dépense fiscale pour ce travail de maintenance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations du travail */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Travaux à valider
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="font-semibold">{work.title}</div>
                <div className="text-sm text-muted-foreground">{work.description}</div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">{work.type}</Badge>
                  <Badge variant="outline">{work.category}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formulaire de dépense */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
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

              <div>
                <Label htmlFor="date">Date de réalisation *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="category">Catégorie fiscale *</Label>
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

            <div>
              <Label htmlFor="description">Description de la dépense *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Décrivez la dépense..."
                rows={3}
              />
            </div>

            <div>
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
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Valider et créer la dépense
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
