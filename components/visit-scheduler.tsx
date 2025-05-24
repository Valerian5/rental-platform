"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, Users, Settings, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface VisitSlot {
  id?: string
  date: string
  start_time: string
  end_time: string
  max_capacity: number
  is_group_visit: boolean
  current_bookings: number
}

interface GlobalSettings {
  slotDuration: number // en minutes
  defaultCapacity: number
  allowGroupVisits: boolean
  workingDays: number[] // 0=dimanche, 1=lundi, etc.
  morningStart: string
  morningEnd: string
  afternoonStart: string
  afternoonEnd: string
  eveningStart: string
  eveningEnd: string
  enableMorning: boolean
  enableAfternoon: boolean
  enableEvening: boolean
}

interface VisitSchedulerProps {
  visitSlots: VisitSlot[]
  onSlotsChange: (slots: VisitSlot[]) => void
  mode: "creation" | "management"
  propertyId?: string
}

const DAYS_OF_WEEK = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mer" },
  { value: 4, label: "Jeu" },
  { value: 5, label: "Ven" },
  { value: 6, label: "Sam" },
  { value: 0, label: "Dim" },
]

export function VisitScheduler({ visitSlots, onSlotsChange, mode, propertyId }: VisitSchedulerProps) {
  const [settings, setSettings] = useState<GlobalSettings>({
    slotDuration: 30,
    defaultCapacity: 1,
    allowGroupVisits: false,
    workingDays: [1, 2, 3, 4, 5, 6], // Lun-Sam par défaut
    morningStart: "09:00",
    morningEnd: "12:00",
    afternoonStart: "14:00",
    afternoonEnd: "18:00",
    eveningStart: "18:00",
    eveningEnd: "20:00",
    enableMorning: true,
    enableAfternoon: true,
    enableEvening: false,
  })

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [calendarDays, setCalendarDays] = useState<Array<{ date: string; dayName: string; slots: VisitSlot[] }>>([])

  // Générer les 30 prochains jours
  useEffect(() => {
    const days = []
    const today = new Date()

    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const dateStr = date.toISOString().split("T")[0]
      const dayName = date.toLocaleDateString("fr-FR", { weekday: "short" })

      const daySlots = visitSlots.filter((slot) => slot.date === dateStr)

      days.push({
        date: dateStr,
        dayName,
        slots: daySlots,
      })
    }

    setCalendarDays(days)
  }, [visitSlots])

  const generateSlotsForDay = (date: string) => {
    const dayOfWeek = new Date(date).getDay()

    if (!settings.workingDays.includes(dayOfWeek)) {
      return []
    }

    const slots: VisitSlot[] = []
    const periods = []

    if (settings.enableMorning) {
      periods.push({ start: settings.morningStart, end: settings.morningEnd })
    }
    if (settings.enableAfternoon) {
      periods.push({ start: settings.afternoonStart, end: settings.afternoonEnd })
    }
    if (settings.enableEvening) {
      periods.push({ start: settings.eveningStart, end: settings.eveningEnd })
    }

    periods.forEach((period) => {
      const startTime = new Date(`2000-01-01T${period.start}:00`)
      const endTime = new Date(`2000-01-01T${period.end}:00`)

      let currentTime = new Date(startTime)

      while (currentTime < endTime) {
        const nextTime = new Date(currentTime.getTime() + settings.slotDuration * 60000)

        if (nextTime <= endTime) {
          slots.push({
            date,
            start_time: currentTime.toTimeString().slice(0, 5),
            end_time: nextTime.toTimeString().slice(0, 5),
            max_capacity: settings.defaultCapacity,
            is_group_visit: settings.allowGroupVisits,
            current_bookings: 0,
          })
        }

        currentTime = nextTime
      }
    })

    return slots
  }

  const generateAllSlots = () => {
    const allSlots: VisitSlot[] = []

    calendarDays.forEach((day) => {
      const daySlots = generateSlotsForDay(day.date)
      allSlots.push(...daySlots)
    })

    onSlotsChange(allSlots)
    toast.success(`${allSlots.length} créneaux générés`)
  }

  const addSlotToDay = (date: string) => {
    const newSlot: VisitSlot = {
      date,
      start_time: "14:00",
      end_time: "14:30",
      max_capacity: settings.defaultCapacity,
      is_group_visit: settings.allowGroupVisits,
      current_bookings: 0,
    }

    onSlotsChange([...visitSlots, newSlot])
  }

  const removeSlot = (slotIndex: number) => {
    const newSlots = visitSlots.filter((_, index) => index !== slotIndex)
    onSlotsChange(newSlots)
  }

  const updateSlot = (slotIndex: number, updates: Partial<VisitSlot>) => {
    const newSlots = visitSlots.map((slot, index) => (index === slotIndex ? { ...slot, ...updates } : slot))
    onSlotsChange(newSlots)
  }

  const getDateStatus = (day: { date: string; slots: VisitSlot[] }) => {
    if (day.slots.length === 0) return "closed"

    const totalCapacity = day.slots.reduce((sum, slot) => sum + slot.max_capacity, 0)
    const totalBookings = day.slots.reduce((sum, slot) => sum + slot.current_bookings, 0)

    if (totalBookings === 0) return "available"
    if (totalBookings >= totalCapacity) return "full"
    return "partial"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 border-green-200"
      case "partial":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "full":
        return "bg-red-100 text-red-800 border-red-200"
      case "closed":
        return "bg-gray-100 text-gray-600 border-gray-200"
      default:
        return "bg-gray-100 text-gray-600 border-gray-200"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "available":
        return "Libre"
      case "partial":
        return "Partiel"
      case "full":
        return "Complet"
      case "closed":
        return "Fermé"
      default:
        return "Fermé"
    }
  }

  return (
    <div className="space-y-6">
      {/* Paramètres globaux */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Paramètres globaux
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">Général</TabsTrigger>
              <TabsTrigger value="horaires">Horaires</TabsTrigger>
              <TabsTrigger value="jours">Jours ouvrés</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Durée des créneaux</Label>
                  <Select
                    value={settings.slotDuration.toString()}
                    onValueChange={(value) =>
                      setSettings((prev) => ({ ...prev, slotDuration: Number.parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">1 heure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Capacité par défaut</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={settings.defaultCapacity}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, defaultCapacity: Number.parseInt(e.target.value) }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Visites groupées</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={settings.allowGroupVisits}
                      onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, allowGroupVisits: !!checked }))}
                    />
                    <span className="text-sm">Autoriser les visites groupées</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="horaires" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={settings.enableMorning}
                    onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, enableMorning: !!checked }))}
                  />
                  <Label>Matin</Label>
                  <Input
                    type="time"
                    value={settings.morningStart}
                    onChange={(e) => setSettings((prev) => ({ ...prev, morningStart: e.target.value }))}
                    disabled={!settings.enableMorning}
                    className="w-24"
                  />
                  <span>à</span>
                  <Input
                    type="time"
                    value={settings.morningEnd}
                    onChange={(e) => setSettings((prev) => ({ ...prev, morningEnd: e.target.value }))}
                    disabled={!settings.enableMorning}
                    className="w-24"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={settings.enableAfternoon}
                    onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, enableAfternoon: !!checked }))}
                  />
                  <Label>Après-midi</Label>
                  <Input
                    type="time"
                    value={settings.afternoonStart}
                    onChange={(e) => setSettings((prev) => ({ ...prev, afternoonStart: e.target.value }))}
                    disabled={!settings.enableAfternoon}
                    className="w-24"
                  />
                  <span>à</span>
                  <Input
                    type="time"
                    value={settings.afternoonEnd}
                    onChange={(e) => setSettings((prev) => ({ ...prev, afternoonEnd: e.target.value }))}
                    disabled={!settings.enableAfternoon}
                    className="w-24"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={settings.enableEvening}
                    onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, enableEvening: !!checked }))}
                  />
                  <Label>Soirée</Label>
                  <Input
                    type="time"
                    value={settings.eveningStart}
                    onChange={(e) => setSettings((prev) => ({ ...prev, eveningStart: e.target.value }))}
                    disabled={!settings.enableEvening}
                    className="w-24"
                  />
                  <span>à</span>
                  <Input
                    type="time"
                    value={settings.eveningEnd}
                    onChange={(e) => setSettings((prev) => ({ ...prev, eveningEnd: e.target.value }))}
                    disabled={!settings.enableEvening}
                    className="w-24"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="jours" className="space-y-4">
              <div className="grid grid-cols-7 gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day.value} className="text-center">
                    <Checkbox
                      checked={settings.workingDays.includes(day.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSettings((prev) => ({ ...prev, workingDays: [...prev.workingDays, day.value] }))
                        } else {
                          setSettings((prev) => ({
                            ...prev,
                            workingDays: prev.workingDays.filter((d) => d !== day.value),
                          }))
                        }
                      }}
                    />
                    <div className="text-sm mt-1">{day.label}</div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 mt-4">
            <Button onClick={generateAllSlots} className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Générer tous les créneaux
            </Button>
            <Button variant="outline" onClick={() => onSlotsChange([])}>
              Effacer tout
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calendrier */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendrier des disponibilités
            <Badge variant="secondary">{visitSlots.length} créneaux</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.slice(0, 28).map((day) => {
              const status = getDateStatus(day)
              return (
                <Dialog key={day.date}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className={`h-16 p-2 flex flex-col items-center justify-center ${getStatusColor(status)}`}
                      onClick={() => setSelectedDate(day.date)}
                    >
                      <div className="text-xs font-medium">{day.dayName}</div>
                      <div className="text-sm">{new Date(day.date).getDate()}</div>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {getStatusLabel(status)}
                      </Badge>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        Créneaux du{" "}
                        {new Date(day.date).toLocaleDateString("fr-FR", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{day.slots.length} créneau(x) configuré(s)</span>
                        <Button size="sm" onClick={() => addSlotToDay(day.date)}>
                          <Plus className="h-4 w-4 mr-1" />
                          Ajouter un créneau
                        </Button>
                      </div>

                      {day.slots.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Calendar className="h-8 w-8 mx-auto mb-2" />
                          <p>Aucun créneau configuré</p>
                          <p className="text-sm">
                            Cliquez sur "Ajouter un créneau" ou utilisez la génération automatique
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {day.slots.map((slot, index) => {
                            const slotIndex = visitSlots.findIndex(
                              (s) =>
                                s.date === slot.date &&
                                s.start_time === slot.start_time &&
                                s.end_time === slot.end_time,
                            )

                            return (
                              <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <Input
                                  type="time"
                                  value={slot.start_time}
                                  onChange={(e) => updateSlot(slotIndex, { start_time: e.target.value })}
                                  className="w-24"
                                />
                                <span>à</span>
                                <Input
                                  type="time"
                                  value={slot.end_time}
                                  onChange={(e) => updateSlot(slotIndex, { end_time: e.target.value })}
                                  className="w-24"
                                />
                                <Users className="h-4 w-4 text-gray-500" />
                                <Input
                                  type="number"
                                  min="1"
                                  max="10"
                                  value={slot.max_capacity}
                                  onChange={(e) =>
                                    updateSlot(slotIndex, { max_capacity: Number.parseInt(e.target.value) })
                                  }
                                  className="w-16"
                                />
                                <Button variant="destructive" size="sm" onClick={() => removeSlot(slotIndex)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Résumé */}
      {visitSlots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Résumé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{visitSlots.length}</div>
                <div className="text-sm text-gray-600">Créneaux total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {calendarDays.filter((day) => day.slots.length > 0).length}
                </div>
                <div className="text-sm text-gray-600">Jours ouverts</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {visitSlots.reduce((sum, slot) => sum + slot.max_capacity, 0)}
                </div>
                <div className="text-sm text-gray-600">Capacité totale</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {visitSlots.reduce((sum, slot) => sum + slot.current_bookings, 0)}
                </div>
                <div className="text-sm text-gray-600">Réservations</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
