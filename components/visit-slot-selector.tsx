"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Users, Plus, X } from "lucide-react"
import { propertyService } from "@/lib/property-service"
import { toast } from "sonner"

interface VisitSlot {
  id?: string
  date: string
  start_time: string
  end_time: string
  max_capacity: number
  is_group_visit: boolean
  current_bookings: number
  is_available: boolean
}

interface VisitSlotSelectorProps {
  propertyId: string
  applicationId: string
  onSlotsSelected: (slots: VisitSlot[]) => void
  onCancel: () => void
}

export function VisitSlotSelector({ propertyId, applicationId, onSlotsSelected, onCancel }: VisitSlotSelectorProps) {
  const [availableSlots, setAvailableSlots] = useState<VisitSlot[]>([])
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAvailableSlots()
  }, [propertyId])

  const loadAvailableSlots = async () => {
    try {
      setIsLoading(true)
      const slots = await propertyService.getPropertyVisitAvailabilities(propertyId)

      // Filtrer les créneaux futurs et disponibles
      const now = new Date()
      const futureSlots = slots.filter((slot) => {
        const slotDateTime = new Date(`${slot.date}T${slot.start_time}`)
        return slotDateTime > now && slot.current_bookings < slot.max_capacity
      })

      setAvailableSlots(futureSlots)
    } catch (error) {
      console.error("Erreur lors du chargement des créneaux:", error)
      toast.error("Erreur lors du chargement des créneaux")
    } finally {
      setIsLoading(false)
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

  const handleConfirmSelection = () => {
    const selectedSlotObjects = availableSlots.filter((slot) => selectedSlots.has(`${slot.date}-${slot.start_time}`))
    onSlotsSelected(selectedSlotObjects)
  }

  // Grouper les créneaux par date
  const slotsByDate = availableSlots.reduce(
    (acc, slot) => {
      const date = slot.date
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(slot)
      return acc
    },
    {} as Record<string, VisitSlot[]>,
  )

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2">Chargement des créneaux...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Sélectionner les créneaux de visite
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-1" />
              Annuler
            </Button>
            <Button onClick={handleConfirmSelection} disabled={selectedSlots.size === 0}>
              Proposer {selectedSlots.size} créneau{selectedSlots.size > 1 ? "x" : ""}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {Object.keys(slotsByDate).length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun créneau disponible</h3>
            <p className="text-gray-500 mb-4">
              Vous devez d'abord configurer des créneaux de visite pour cette propriété.
            </p>
            <Button variant="outline" onClick={() => window.open(`/owner/properties/${propertyId}`, "_blank")}>
              <Plus className="h-4 w-4 mr-1" />
              Gérer les créneaux
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-sm text-gray-600">
              Sélectionnez un ou plusieurs créneaux à proposer au candidat. Il pourra choisir celui qui lui convient le
              mieux.
            </div>

            {Object.entries(slotsByDate)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([date, slots]) => {
                const dateObj = new Date(date)
                const dayName = dateObj.toLocaleDateString("fr-FR", { weekday: "long" })
                const formattedDate = dateObj.toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                })

                return (
                  <div key={date} className="space-y-3">
                    <h3 className="font-semibold text-lg capitalize">
                      {dayName} {formattedDate}
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {slots
                        .sort((a, b) => a.start_time.localeCompare(b.start_time))
                        .map((slot) => {
                          const slotId = `${slot.date}-${slot.start_time}`
                          const isSelected = selectedSlots.has(slotId)
                          const availableSpots = slot.max_capacity - slot.current_bookings

                          return (
                            <Button
                              key={slotId}
                              variant={isSelected ? "default" : "outline"}
                              className={`h-auto p-3 flex flex-col items-center justify-center ${
                                isSelected ? "bg-blue-600 text-white" : ""
                              }`}
                              onClick={() => toggleSlotSelection(slotId)}
                            >
                              <div className="flex items-center gap-1 mb-1">
                                <Clock className="h-4 w-4" />
                                <span className="font-medium">
                                  {slot.start_time} - {slot.end_time}
                                </span>
                              </div>

                              {slot.is_group_visit && (
                                <div className="flex items-center gap-1 text-xs">
                                  <Users className="h-3 w-3" />
                                  <span>
                                    {availableSpots} place{availableSpots > 1 ? "s" : ""}
                                  </span>
                                </div>
                              )}
                            </Button>
                          )
                        })}
                    </div>
                  </div>
                )
              })}

            {selectedSlots.size > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Créneaux sélectionnés ({selectedSlots.size})</h4>
                <div className="flex flex-wrap gap-2">
                  {Array.from(selectedSlots).map((slotId) => {
                    const [date, time] = slotId.split("-")
                    const dateObj = new Date(date)
                    const dayName = dateObj.toLocaleDateString("fr-FR", { weekday: "short" })
                    const formattedDate = dateObj.toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                    })

                    return (
                      <Badge key={slotId} variant="default" className="text-xs">
                        {dayName} {formattedDate} à {time}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
