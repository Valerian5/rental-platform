"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { format, addDays, isSameDay, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon, Clock, Loader2 } from "lucide-react"

interface VisitProposalDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (slots: any[]) => void
  propertyId: string
}

export function VisitProposalDialog({ open, onClose, onConfirm, propertyId }: VisitProposalDialogProps) {
  const [loading, setLoading] = useState(false)
  const [existingSlots, setExistingSlots] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(addDays(new Date(), 1))
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([])
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([
    "09:00",
    "10:00",
    "11:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
  ])
  const [conflictingSlots, setConflictingSlots] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    if (open && propertyId) {
      loadExistingSlots()
    }
  }, [open, propertyId])

  useEffect(() => {
    if (selectedDate) {
      checkConflicts()
    }
  }, [selectedDate, existingSlots])

  const loadExistingSlots = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/properties/${propertyId}/visit-slots`)
      if (response.ok) {
        const data = await response.json()
        setExistingSlots(data.slots || [])
      }
    } catch (error) {
      console.error("Erreur lors du chargement des créneaux:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkConflicts = () => {
    if (!selectedDate || !existingSlots.length) {
      setConflictingSlots({})
      return
    }

    const conflicts: { [key: string]: string } = {}

    existingSlots.forEach((slot) => {
      try {
        const slotDate = parseISO(slot.date)
        if (isSameDay(slotDate, selectedDate)) {
          const timeStr = format(slotDate, "HH:mm")
          conflicts[timeStr] = slot.property_title || "Autre bien"
        }
      } catch (e) {
        console.error("Erreur de parsing de date:", e)
      }
    })

    setConflictingSlots(conflicts)
  }

  const handleTimeSlotToggle = (time: string) => {
    setSelectedTimeSlots((prev) => (prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]))
  }

  const handleConfirm = () => {
    if (!selectedDate || selectedTimeSlots.length === 0) {
      toast.error("Veuillez sélectionner au moins un créneau de visite")
      return
    }

    const slots = selectedTimeSlots.map((time) => {
      const [hours, minutes] = time.split(":").map(Number)
      const date = new Date(selectedDate)
      date.setHours(hours, minutes, 0, 0)

      return {
        date: date.toISOString(),
        time,
      }
    })

    onConfirm(slots)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Proposer des créneaux de visite</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>Sélectionnez une date</Label>
              <div className="border rounded-md mt-1">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date() || date > addDays(new Date(), 30)}
                  locale={fr}
                />
              </div>
            </div>

            {selectedDate && (
              <div>
                <Label>Sélectionnez des créneaux horaires</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {availableTimeSlots.map((time) => {
                    const isConflict = conflictingSlots[time]

                    return (
                      <div
                        key={time}
                        className={`
                          flex items-center space-x-2 border rounded-md p-2
                          ${isConflict ? "bg-amber-50" : ""}
                          ${selectedTimeSlots.includes(time) ? "border-primary" : ""}
                        `}
                      >
                        <Checkbox
                          id={`time-${time}`}
                          checked={selectedTimeSlots.includes(time)}
                          onCheckedChange={() => !isConflict && handleTimeSlotToggle(time)}
                          disabled={!!isConflict}
                        />
                        <div className="flex-1">
                          <label
                            htmlFor={`time-${time}`}
                            className="flex justify-between text-sm font-medium cursor-pointer"
                          >
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {time}
                            </div>
                            {isConflict && <span className="text-xs text-amber-600">Conflit: {isConflict}</span>}
                          </label>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              <p>
                <CalendarIcon className="h-3 w-3 inline-block mr-1" />
                {selectedDate ? format(selectedDate, "EEEE d MMMM yyyy", { locale: fr }) : "Aucune date sélectionnée"}
              </p>
              <p>Créneaux sélectionnés: {selectedTimeSlots.length}</p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleConfirm} disabled={selectedTimeSlots.length === 0}>
            Proposer ces créneaux
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
