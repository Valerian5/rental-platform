"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { PlusIcon, XIcon, CalendarIcon, ClockIcon } from "lucide-react"

export function VisitRequestForm() {
  const [formData, setFormData] = useState({
    propertyId: "",
    applicantIds: [] as string[],
    message: "",
    slots: [{ date: "", startTime: "", endTime: "" }],
    expirationDays: "3",
  })

  // Mock data - in real app, this would come from API
  const properties = [
    { id: "1", title: "Appartement 3P - Belleville", address: "15 rue de Belleville, 75020 Paris" },
    { id: "2", title: "Studio meublé - République", address: "8 rue du Temple, 75003 Paris" },
    { id: "3", title: "Maison 4P - Montreuil", address: "25 avenue de la République, 93100 Montreuil" },
    { id: "4", title: "Loft moderne - Bastille", address: "12 rue de la Roquette, 75011 Paris" },
  ]

  const applicants = [
    { id: "1", name: "Marie Dupont", email: "marie.dupont@email.com", score: 85, status: "pending" },
    { id: "2", name: "Pierre Martin", email: "pierre.martin@email.com", score: 78, status: "pending" },
    { id: "3", name: "Sophie Leroy", email: "sophie.leroy@email.com", score: 62, status: "pending" },
    { id: "4", name: "Thomas Dubois", email: "thomas.dubois@email.com", score: 92, status: "pending" },
  ]

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSlotChange = (index: number, field: string, value: string) => {
    const newSlots = [...formData.slots]
    newSlots[index] = { ...newSlots[index], [field]: value }
    setFormData((prev) => ({
      ...prev,
      slots: newSlots,
    }))
  }

  const addSlot = () => {
    setFormData((prev) => ({
      ...prev,
      slots: [...prev.slots, { date: "", startTime: "", endTime: "" }],
    }))
  }

  const removeSlot = (index: number) => {
    if (formData.slots.length > 1) {
      const newSlots = [...formData.slots]
      newSlots.splice(index, 1)
      setFormData((prev) => ({
        ...prev,
        slots: newSlots,
      }))
    }
  }

  const toggleApplicant = (applicantId: string) => {
    setFormData((prev) => {
      const isSelected = prev.applicantIds.includes(applicantId)
      return {
        ...prev,
        applicantIds: isSelected
          ? prev.applicantIds.filter((id) => id !== applicantId)
          : [...prev.applicantIds, applicantId],
      }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted:", formData)
    // Here you would typically send the data to your API
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-orange-600"
    return "text-red-600"
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-orange-500"
    return "bg-red-500"
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Property Selection */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="propertyId">Bien à visiter *</Label>
          <Select
            value={formData.propertyId}
            onValueChange={(value) => handleInputChange("propertyId", value)}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez un bien" />
            </SelectTrigger>
            <SelectContent>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {formData.propertyId && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold">{properties.find((p) => p.id === formData.propertyId)?.title}</h3>
              <p className="text-sm text-muted-foreground">
                {properties.find((p) => p.id === formData.propertyId)?.address}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Applicant Selection */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Candidats à inviter *</Label>
          <p className="text-sm text-muted-foreground">
            Sélectionnez les candidats que vous souhaitez inviter à visiter ce bien
          </p>
        </div>

        <div className="space-y-3">
          {applicants.map((applicant) => (
            <Card
              key={applicant.id}
              className={`cursor-pointer transition-colors ${
                formData.applicantIds.includes(applicant.id)
                  ? "border-primary bg-primary/5"
                  : "hover:border-muted-foreground"
              }`}
              onClick={() => toggleApplicant(applicant.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{applicant.name}</h3>
                    <p className="text-sm text-muted-foreground">{applicant.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <div className={`text-xl font-bold ${getScoreColor(applicant.score)}`}>{applicant.score}</div>
                      <div className="text-xs text-muted-foreground">Score</div>
                    </div>
                    {formData.applicantIds.includes(applicant.id) && <Badge className="bg-primary">Sélectionné</Badge>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Visit Slots */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>Créneaux proposés *</Label>
            <p className="text-sm text-muted-foreground">
              Proposez plusieurs créneaux pour que les candidats puissent choisir
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addSlot}>
            <PlusIcon className="h-4 w-4 mr-1" />
            Ajouter un créneau
          </Button>
        </div>

        {formData.slots.map((slot, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor={`date-${index}`} className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                Date
              </Label>
              <Input
                id={`date-${index}`}
                type="date"
                value={slot.date}
                onChange={(e) => handleSlotChange(index, "date", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`startTime-${index}`} className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                Heure de début
              </Label>
              <Input
                id={`startTime-${index}`}
                type="time"
                value={slot.startTime}
                onChange={(e) => handleSlotChange(index, "startTime", e.target.value)}
                required
              />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor={`endTime-${index}`} className="flex items-center gap-1">
                  <ClockIcon className="h-4 w-4" />
                  Heure de fin
                </Label>
                <Input
                  id={`endTime-${index}`}
                  type="time"
                  value={slot.endTime}
                  onChange={(e) => handleSlotChange(index, "endTime", e.target.value)}
                  required
                />
              </div>
              {formData.slots.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSlot(index)}
                  className="flex-shrink-0"
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Message and Expiration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="message">Message aux candidats</Label>
          <Textarea
            id="message"
            placeholder="Ajoutez des informations complémentaires pour les candidats..."
            value={formData.message}
            onChange={(e) => handleInputChange("message", e.target.value)}
            rows={4}
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expirationDays">Délai de réponse</Label>
            <Select
              value={formData.expirationDays}
              onValueChange={(value) => handleInputChange("expirationDays", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un délai" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 jour</SelectItem>
                <SelectItem value="2">2 jours</SelectItem>
                <SelectItem value="3">3 jours</SelectItem>
                <SelectItem value="5">5 jours</SelectItem>
                <SelectItem value="7">7 jours</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Les candidats auront ce délai pour répondre à votre proposition de visite
            </p>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline">
          Annuler
        </Button>
        <Button type="submit" disabled={formData.applicantIds.length === 0 || formData.propertyId === ""}>
          Envoyer les propositions de visite
        </Button>
      </div>
    </form>
  )
}
