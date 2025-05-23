"use client"

import { useState, useEffect, useRef } from "react"
import { Calendar } from "@fullcalendar/core"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

export function CalendarScheduler() {
  const calendarRef = useRef(null)
  const [calendar, setCalendar] = useState(null)
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false)
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [visitDuration, setVisitDuration] = useState(30)
  const [allowGroupVisits, setAllowGroupVisits] = useState(false)
  const [maxVisitorsPerSlot, setMaxVisitorsPerSlot] = useState(1)
  const [timeSlots, setTimeSlots] = useState([
    { start: "09:00", end: "12:00" },
    { start: "14:00", end: "18:00" },
  ])

  // Initialize FullCalendar
  useEffect(() => {
    if (calendarRef.current && !calendar) {
      const calendarInstance = new Calendar(calendarRef.current, {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
        initialView: "dayGridMonth",
        headerToolbar: {
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek",
        },
        editable: true,
        selectable: true,
        selectMirror: true,
        dayMaxEvents: true,
        weekends: true,
        events: [
          // Sample events
          {
            id: "1",
            title: "Disponible (3 créneaux)",
            start: "2025-05-25",
            backgroundColor: "#10b981",
            borderColor: "#10b981",
          },
          {
            id: "2",
            title: "Disponible (2 créneaux)",
            start: "2025-05-26",
            backgroundColor: "#10b981",
            borderColor: "#10b981",
          },
        ],
        dateClick: (info) => {
          setSelectedDate(info.dateStr)
          setIsEventDialogOpen(true)
        },
        eventClick: (info) => {
          setSelectedEvent({
            id: info.event.id,
            title: info.event.title,
            start: info.event.startStr,
          })
          setIsEventDialogOpen(true)
        },
      })

      calendarInstance.render()
      setCalendar(calendarInstance)

      return () => {
        calendarInstance.destroy()
      }
    }
  }, [calendarRef, calendar])

  const handleAddTimeSlots = () => {
    // Logic to add time slots for the selected date
    setIsEventDialogOpen(false)

    // Example: Add event to calendar
    if (calendar) {
      calendar.addEvent({
        title: `Disponible (${timeSlots.length} créneaux)`,
        start: selectedDate,
        backgroundColor: "#10b981",
        borderColor: "#10b981",
      })
    }
  }

  const handleAddTimeSlot = () => {
    setTimeSlots([...timeSlots, { start: "09:00", end: "10:00" }])
  }

  const handleRemoveTimeSlot = (index) => {
    const newTimeSlots = [...timeSlots]
    newTimeSlots.splice(index, 1)
    setTimeSlots(newTimeSlots)
  }

  const handleTimeSlotChange = (index, field, value) => {
    const newTimeSlots = [...timeSlots]
    newTimeSlots[index][field] = value
    setTimeSlots(newTimeSlots)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Calendrier des disponibilités</h2>
        <Button onClick={() => setIsSettingsDialogOpen(true)}>Paramètres des visites</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div ref={calendarRef} className="min-h-[600px] p-4"></div>
        </CardContent>
      </Card>

      {/* Dialog for adding/editing time slots */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedEvent ? "Modifier les créneaux" : "Ajouter des créneaux de visite"}</DialogTitle>
            <DialogDescription>
              {selectedDate &&
                `Date: ${new Date(selectedDate).toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Créneaux horaires</h3>
              <Button variant="outline" size="sm" onClick={handleAddTimeSlot}>
                Ajouter un créneau
              </Button>
            </div>

            {timeSlots.map((slot, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="grid grid-cols-2 gap-4 flex-1">
                  <div className="space-y-2">
                    <Label htmlFor={`start-time-${index}`}>Heure de début</Label>
                    <Input
                      id={`start-time-${index}`}
                      type="time"
                      value={slot.start}
                      onChange={(e) => handleTimeSlotChange(index, "start", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`end-time-${index}`}>Heure de fin</Label>
                    <Input
                      id={`end-time-${index}`}
                      type="time"
                      value={slot.end}
                      onChange={(e) => handleTimeSlotChange(index, "end", e.target.value)}
                    />
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="mt-6" onClick={() => handleRemoveTimeSlot(index)}>
                  ✕
                </Button>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEventDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddTimeSlots}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for visit settings */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Paramètres des visites</DialogTitle>
            <DialogDescription>Configurez vos préférences pour les visites de vos biens</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="visit-duration">Durée des visites (minutes)</Label>
              <Select
                value={visitDuration.toString()}
                onValueChange={(value) => setVisitDuration(Number.parseInt(value))}
              >
                <SelectTrigger id="visit-duration">
                  <SelectValue placeholder="Sélectionnez la durée" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 heure</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="group-visits">Autoriser les visites groupées</Label>
                <p className="text-sm text-muted-foreground">
                  Permettre à plusieurs personnes de visiter en même temps
                </p>
              </div>
              <Switch id="group-visits" checked={allowGroupVisits} onCheckedChange={setAllowGroupVisits} />
            </div>

            {allowGroupVisits && (
              <div className="space-y-2">
                <Label htmlFor="max-visitors">Nombre maximum de visiteurs par créneau</Label>
                <Select
                  value={maxVisitorsPerSlot.toString()}
                  onValueChange={(value) => setMaxVisitorsPerSlot(Number.parseInt(value))}
                >
                  <SelectTrigger id="max-visitors">
                    <SelectValue placeholder="Sélectionnez le nombre maximum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 visiteurs</SelectItem>
                    <SelectItem value="3">3 visiteurs</SelectItem>
                    <SelectItem value="4">4 visiteurs</SelectItem>
                    <SelectItem value="5">5 visiteurs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={() => setIsSettingsDialogOpen(false)}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
