"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Edit } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface EditMaintenanceDialogProps {
  work: any
  isOpen: boolean
  onClose: () => void
  onSave: (updatedWork: any) => void
}

export function EditMaintenanceDialog({ work, isOpen, onClose, onSave }: EditMaintenanceDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "preventive",
    category: "",
    cost: "",
    estimated_cost: "",
    provider_name: "",
    provider_contact: "",
    scheduled_date: new Date()
  })

  useEffect(() => {
    if (work) {
      setFormData({
        title: work.title || "",
        description: work.description || "",
        type: work.type || "preventive",
        category: work.category || "",
        cost: work.cost?.toString() || "",
        estimated_cost: work.estimated_cost?.toString() || "",
        provider_name: work.provider_name || "",
        provider_contact: work.provider_contact || "",
        scheduled_date: work.scheduled_date ? new Date(work.scheduled_date) : new Date()
      })
    }
  }, [work])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.description || !formData.category) {
      toast.error("Veuillez remplir les champs obligatoires")
      return
    }

    const updatedWork = {
      ...work,
      ...formData,
      cost: formData.cost ? Number(formData.cost) : null,
      estimated_cost: formData.estimated_cost ? Number(formData.estimated_cost) : null,
      scheduled_date: formData.scheduled_date.toISOString().split('T')[0]
    }

    onSave(updatedWork)
  }

  const handleInputChange = (field: string, value: string | Date) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Modifier les travaux
          </DialogTitle>
          <DialogDescription>
            Modifiez les informations de ce travail de maintenance
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Ex: Révision chaudière annuelle"
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Décrivez les travaux à effectuer..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Type *</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventive">Préventif</SelectItem>
                  <SelectItem value="corrective">Correctif</SelectItem>
                  <SelectItem value="improvement">Amélioration</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Catégorie *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plumbing">Plomberie</SelectItem>
                  <SelectItem value="electrical">Électricité</SelectItem>
                  <SelectItem value="heating">Chauffage</SelectItem>
                  <SelectItem value="painting">Peinture</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Date prévue *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.scheduled_date && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.scheduled_date ? format(formData.scheduled_date, "PPP", { locale: fr }) : "Sélectionner une date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.scheduled_date}
                  onSelect={(date) => date && handleInputChange("scheduled_date", date)}
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cost">Coût réel (€)</Label>
              <Input
                id="cost"
                type="number"
                value={formData.cost}
                onChange={(e) => handleInputChange("cost", e.target.value)}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="estimated_cost">Coût estimé (€)</Label>
              <Input
                id="estimated_cost"
                type="number"
                value={formData.estimated_cost}
                onChange={(e) => handleInputChange("estimated_cost", e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="provider_name">Prestataire</Label>
              <Input
                id="provider_name"
                value={formData.provider_name}
                onChange={(e) => handleInputChange("provider_name", e.target.value)}
                placeholder="Nom du prestataire"
              />
            </div>

            <div>
              <Label htmlFor="provider_contact">Contact</Label>
              <Input
                id="provider_contact"
                value={formData.provider_contact}
                onChange={(e) => handleInputChange("provider_contact", e.target.value)}
                placeholder="Téléphone ou email"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
