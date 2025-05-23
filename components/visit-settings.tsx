"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function VisitSettings() {
  const [defaultVisitDuration, setDefaultVisitDuration] = useState(30)
  const [defaultAllowGroupVisits, setDefaultAllowGroupVisits] = useState(false)
  const [defaultMaxVisitorsPerSlot, setDefaultMaxVisitorsPerSlot] = useState(1)
  const [defaultTimeSlots, setDefaultTimeSlots] = useState([
    {
      day: "monday",
      slots: [
        { start: "09:00", end: "12:00" },
        { start: "14:00", end: "18:00" },
      ],
    },
    {
      day: "tuesday",
      slots: [
        { start: "09:00", end: "12:00" },
        { start: "14:00", end: "18:00" },
      ],
    },
    {
      day: "wednesday",
      slots: [
        { start: "09:00", end: "12:00" },
        { start: "14:00", end: "18:00" },
      ],
    },
    {
      day: "thursday",
      slots: [
        { start: "09:00", end: "12:00" },
        { start: "14:00", end: "18:00" },
      ],
    },
    {
      day: "friday",
      slots: [
        { start: "09:00", end: "12:00" },
        { start: "14:00", end: "18:00" },
      ],
    },
    { day: "saturday", slots: [{ start: "10:00", end: "12:00" }] },
    { day: "sunday", slots: [] },
  ])

  const [selectedDay, setSelectedDay] = useState("monday")

  const getDayName = (day) => {
    const days = {
      monday: "Lundi",
      tuesday: "Mardi",
      wednesday: "Mercredi",
      thursday: "Jeudi",
      friday: "Vendredi",
      saturday: "Samedi",
      sunday: "Dimanche",
    }
    return days[day]
  }

  const handleAddTimeSlot = (day) => {
    const newTimeSlots = [...defaultTimeSlots]
    const dayIndex = newTimeSlots.findIndex((d) => d.day === day)

    if (dayIndex !== -1) {
      newTimeSlots[dayIndex].slots.push({ start: "09:00", end: "10:00" })
      setDefaultTimeSlots(newTimeSlots)
    }
  }

  const handleRemoveTimeSlot = (day, index) => {
    const newTimeSlots = [...defaultTimeSlots]
    const dayIndex = newTimeSlots.findIndex((d) => d.day === day)

    if (dayIndex !== -1) {
      newTimeSlots[dayIndex].slots.splice(index, 1)
      setDefaultTimeSlots(newTimeSlots)
    }
  }

  const handleTimeSlotChange = (day, index, field, value) => {
    const newTimeSlots = [...defaultTimeSlots]
    const dayIndex = newTimeSlots.findIndex((d) => d.day === day)

    if (dayIndex !== -1) {
      newTimeSlots[dayIndex].slots[index][field] = value
      setDefaultTimeSlots(newTimeSlots)
    }
  }

  const handleSaveSettings = () => {
    // Logic to save settings
    console.log("Settings saved:", {
      defaultVisitDuration,
      defaultAllowGroupVisits,
      defaultMaxVisitorsPerSlot,
      defaultTimeSlots,
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Paramètres généraux des visites</CardTitle>
          <CardDescription>Configurez les paramètres par défaut pour toutes vos visites</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="default-visit-duration">Durée par défaut des visites (minutes)</Label>
            <Select
              value={defaultVisitDuration.toString()}
              onValueChange={(value) => setDefaultVisitDuration(Number.parseInt(value))}
            >
              <SelectTrigger id="default-visit-duration">
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
              <Label htmlFor="default-group-visits">Autoriser les visites groupées par défaut</Label>
              <p className="text-sm text-muted-foreground">Permettre à plusieurs personnes de visiter en même temps</p>
            </div>
            <Switch
              id="default-group-visits"
              checked={defaultAllowGroupVisits}
              onCheckedChange={setDefaultAllowGroupVisits}
            />
          </div>

          {defaultAllowGroupVisits && (
            <div className="space-y-2">
              <Label htmlFor="default-max-visitors">Nombre maximum de visiteurs par créneau</Label>
              <Select
                value={defaultMaxVisitorsPerSlot.toString()}
                onValueChange={(value) => setDefaultMaxVisitorsPerSlot(Number.parseInt(value))}
              >
                <SelectTrigger id="default-max-visitors">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Créneaux horaires par défaut</CardTitle>
          <CardDescription>Définissez vos disponibilités habituelles pour chaque jour de la semaine</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedDay} onValueChange={setSelectedDay}>
            <TabsList className="grid grid-cols-7 mb-6">
              {defaultTimeSlots.map((day) => (
                <TabsTrigger key={day.day} value={day.day}>
                  {getDayName(day.day).substring(0, 3)}
                </TabsTrigger>
              ))}
            </TabsList>

            {defaultTimeSlots.map((day) => (
              <TabsContent key={day.day} value={day.day}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">{getDayName(day.day)}</h3>
                    <Button variant="outline" size="sm" onClick={() => handleAddTimeSlot(day.day)}>
                      Ajouter un créneau
                    </Button>
                  </div>

                  {day.slots.length === 0 ? (
                    <p className="text-muted-foreground">Aucun créneau défini pour ce jour</p>
                  ) : (
                    day.slots.map((slot, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className="grid grid-cols-2 gap-4 flex-1">
                          <div className="space-y-2">
                            <Label htmlFor={`${day.day}-start-time-${index}`}>Heure de début</Label>
                            <Input
                              id={`${day.day}-start-time-${index}`}
                              type="time"
                              value={slot.start}
                              onChange={(e) => handleTimeSlotChange(day.day, index, "start", e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`${day.day}-end-time-${index}`}>Heure de fin</Label>
                            <Input
                              id={`${day.day}-end-time-${index}`}
                              type="time"
                              value={slot.end}
                              onChange={(e) => handleTimeSlotChange(day.day, index, "end", e.target.value)}
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="mt-6"
                          onClick={() => handleRemoveTimeSlot(day.day, index)}
                        >
                          ✕
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveSettings} className="ml-auto">
            Enregistrer les paramètres
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
