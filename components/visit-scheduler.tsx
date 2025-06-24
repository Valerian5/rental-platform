"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Plus, X } from "lucide-react"

interface VisitSlot {
  id?: string
  day_of_week: number
  start_time: string
  end_time: string
  max_visitors: number
}

interface VisitSchedulerProps {
  propertyId: string
  onSlotsChange?: (slots: VisitSlot[]) => void
  existingSlots?: VisitSlot[]
}

const DAYS_OF_WEEK = [
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
  { value: 0, label: "Dimanche" },
]

export function VisitScheduler({ propertyId, onSlotsChange, existingSlots = [] }: VisitSchedulerProps) {
  console.log("🏠 VisitScheduler - Initialisation avec:", { propertyId, existingSlots })

  const [slots, setSlots] = useState<VisitSlot[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Initialiser les créneaux
  useEffect(() => {
    console.log("🏠 VisitScheduler - useEffect existingSlots:", existingSlots)
    const safeSlots = Array.isArray(existingSlots) ? existingSlots : []
    console.log("🏠 VisitScheduler - Créneaux sécurisés:", safeSlots)
    setSlots(safeSlots)
  }, [existingSlots])

  // Notifier les changements
  useEffect(() => {
    console.log("🏠 VisitScheduler - Notification changement slots:", slots)
    if (onSlotsChange && Array.isArray(slots)) {
      onSlotsChange(slots)
    }
  }, [slots, onSlotsChange])

  const addSlot = () => {
    console.log("➕ Ajout d'un nouveau créneau")
    const newSlot: VisitSlot = {
      day_of_week: 1,
      start_time: "14:00",
      end_time: "18:00",
      max_visitors: 1,
    }

    const currentSlots = Array.isArray(slots) ? slots : []
    const newSlots = [...currentSlots, newSlot]
    console.log("➕ Nouveaux créneaux:", newSlots)
    setSlots(newSlots)
  }

  const removeSlot = (index: number) => {
    console.log("❌ Suppression créneau index:", index)
    const currentSlots = Array.isArray(slots) ? slots : []
    const newSlots = currentSlots.filter((_, i) => i !== index)
    console.log("❌ Créneaux après suppression:", newSlots)
    setSlots(newSlots)
  }

  const updateSlot = (index: number, field: keyof VisitSlot, value: any) => {
    console.log("✏️ Mise à jour créneau:", { index, field, value })
    const currentSlots = Array.isArray(slots) ? slots : []
    const newSlots = currentSlots.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot))
    console.log("✏️ Créneaux après mise à jour:", newSlots)
    setSlots(newSlots)
  }

  const getDayLabel = (dayOfWeek: number) => {
    const day = DAYS_OF_WEEK.find((d) => d.value === dayOfWeek)
    return day ? day.label : `Jour ${dayOfWeek}`
  }

  const getSlotsCount = () => {
    return Array.isArray(slots) ? slots.length : 0
  }

  console.log("🏠 VisitScheduler - Rendu avec", getSlotsCount(), "créneaux")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Créneaux de visite</h3>
          <p className="text-sm text-gray-600">
            Définissez les créneaux horaires où les locataires peuvent visiter votre bien
          </p>
        </div>
        <Badge variant="outline">
          {getSlotsCount()} créneau{getSlotsCount() !== 1 ? "x" : ""}
        </Badge>
      </div>

      {getSlotsCount() === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h4 className="text-lg font-medium mb-2">Aucun créneau défini</h4>
            <p className="text-gray-600 mb-4">
              Ajoutez des créneaux de visite pour permettre aux locataires de planifier leur visite
            </p>
            <Button onClick={addSlot}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un créneau
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {slots.map((slot, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Créneau {index + 1}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSlot(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label>Jour de la semaine</Label>
                    <Select
                      value={slot.day_of_week?.toString() || "1"}
                      onValueChange={(value) => updateSlot(index, "day_of_week", Number.parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day) => (
                          <SelectItem key={day.value} value={day.value.toString()}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Heure de début</Label>
                    <Input
                      type="time"
                      value={slot.start_time || "14:00"}
                      onChange={(e) => updateSlot(index, "start_time", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Heure de fin</Label>
                    <Input
                      type="time"
                      value={slot.end_time || "18:00"}
                      onChange={(e) => updateSlot(index, "end_time", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Visiteurs max</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={slot.max_visitors || 1}
                      onChange={(e) => updateSlot(index, "max_visitors", Number.parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-1" />
                  {getDayLabel(slot.day_of_week || 1)} de {slot.start_time || "14:00"} à {slot.end_time || "18:00"}
                  {slot.max_visitors && slot.max_visitors > 1 && (
                    <span className="ml-2">• Max {slot.max_visitors} visiteurs</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          <Button onClick={addSlot} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un autre créneau
          </Button>
        </div>
      )}

      {getSlotsCount() > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">Récapitulatif</h4>
          <div className="space-y-1 text-sm text-blue-700">
            {slots.map((slot, index) => (
              <div key={index}>
                • {getDayLabel(slot.day_of_week || 1)} : {slot.start_time || "14:00"} - {slot.end_time || "18:00"}
                {slot.max_visitors && slot.max_visitors > 1 && ` (${slot.max_visitors} visiteurs max)`}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
