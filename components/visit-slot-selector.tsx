"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Check, X } from "lucide-react"
import { toast } from "sonner"

interface VisitSlot {
  date: string
  start_time: string
  end_time: string
}

interface VisitSlotSelectorProps {
  propertyId: string
  applicationId: string
  onSlotsSelected: (slots: VisitSlot[]) => void
  onCancel: () => void
}

export function VisitSlotSelector({ propertyId, applicationId, onSlotsSelected, onCancel }: VisitSlotSelectorProps) {
  const [availableSlots, setAvailableSlots] = useState<any[]>([])
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAvailableSlots()
  }, [propertyId])

  const loadAvailableSlots = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/properties/${propertyId}/visit-slots`)
      if (response.ok) {
        const data = await response.json()
        setAvailableSlots(data.slots || [])
      }
    } catch (error) {
      console.error("Erreur chargement créneaux:", error)
      toast.error("Erreur lors du chargement des créneaux")
    } finally {
      setLoading(false)
    }
  }

  const toggleSlotSelection = (slotId: string) => {
    const newSelected = new Set(selectedSlots)
    if (newSelected.has(slotId)) {
      newSelected.delete(slotId)
    } else {
      newSelected.add(slotId)
    }
    setSelectedSlots(newSelected)
  }

  const handleProposeSlots = async () => {
    if (selectedSlots.size === 0) {
      toast.error("Veuillez sélectionner au moins un créneau")
      return
    }

    try {
      const slotsToPropose = availableSlots
        .filter((slot) => selectedSlots.has(`${slot.date}-${slot.start_time}`))
        .map((slot) => ({
          date: slot.date,
          start_time: slot.start_time,
          end_time: slot.end_time,
        }))

      const response = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "propose_slots",
          application_id: applicationId,
          slots: slotsToPropose,
        }),
      })

      if (response.ok) {
        onSlotsSelected(slotsToPropose)
        toast.success(`${slotsToPropose.length} créneau(x) proposé(s) au candidat`)
      } else {
        throw new Error("Erreur lors de la proposition")
      }
    } catch (error) {
      console.error("Erreur proposition créneaux:", error)
      toast.error("Erreur lors de la proposition de créneaux")
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Chargement des créneaux disponibles...</div>
        </CardContent>
      </Card>
    )
  }

  // Grouper les créneaux par date
  const slotsByDate = availableSlots.reduce(
    (acc, slot) => {
      if (!acc[slot.date]) {
        acc[slot.date] = []
      }
      acc[slot.date].push(slot)
      return acc
    },
    {} as Record<string, any[]>,
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Proposer des créneaux de visite
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Sélectionnez les créneaux que vous souhaitez proposer au candidat
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.keys(slotsByDate).length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucun créneau disponible</h3>
            <p className="text-muted-foreground mb-4">
              Vous devez d'abord configurer des créneaux de visite pour cette propriété.
            </p>
            <Button variant="outline" onClick={onCancel}>
              Retour
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(slotsByDate).map(([date, slots]) => (
                <div key={date} className="space-y-2">
                  <h3 className="font-medium text-center p-2 bg-muted rounded">
                    {new Date(date).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </h3>
                  <div className="space-y-1">
                    {slots.map((slot) => {
                      const slotId = `${slot.date}-${slot.start_time}`
                      const isSelected = selectedSlots.has(slotId)

                      return (
                        <Button
                          key={slotId}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className="w-full justify-between"
                          onClick={() => toggleSlotSelection(slotId)}
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            <span>
                              {slot.start_time} - {slot.end_time}
                            </span>
                          </div>
                          {isSelected && <Check className="h-3 w-3" />}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{selectedSlots.size} créneau(x) sélectionné(s)</Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onCancel}>
                  <X className="h-4 w-4 mr-1" />
                  Annuler
                </Button>
                <Button onClick={handleProposeSlots} disabled={selectedSlots.size === 0}>
                  <Check className="h-4 w-4 mr-1" />
                  Proposer {selectedSlots.size > 0 && `(${selectedSlots.size})`}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
