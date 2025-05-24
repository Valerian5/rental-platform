"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, Users, Settings, Plus, Trash2, Zap } from "lucide-react"
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
  defaultDuration: number // en minutes
  defaultCapacity: number
  allowGroupVisits: boolean
  workingDays: number[] // 0=dimanche, 1=lundi, etc.
  timeSlots: {
    morning: { start: string; end: string; enabled: boolean }
    afternoon: { start: string; end: string; enabled: boolean }
    evening: { start: string; end: string; enabled: boolean }
  }
}

interface VisitSchedulerProps {
  propertyId?: string
  visitSlots: VisitSlot[]
  onSlotsChange: (slots: VisitSlot[]) => void
  mode?: "creation" | "management"
}

export function VisitScheduler({ propertyId, visitSlots, onSlotsChange, mode = "creation" }: VisitSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [showTimeDialog, setShowTimeDialog] = useState(false)
  const [currentDaySlots, setCurrentDaySlots] = useState<VisitSlot[]>([])
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    defaultDuration: 30,
    defaultCapacity: 1,
    allowGroupVisits: false,
    workingDays: [1, 2, 3, 4, 5, 6], // Lundi à Samedi
    timeSlots: {
      morning: { start: "09:00", end: "12:00", enabled: true },
      afternoon: { start: "14:00", end: "18:00", enabled: true },
      evening: { start: "18:00", end: "20:00", enabled: false },
    },
  })

  // Générer les 30 prochains jours
  const generateCalendarDays = () => {
    const days = []
    const today = new Date()

    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)

      const dateStr = date.toISOString().split("T")[0]
      const daySlots = visitSlots.filter((slot) => slot.date === dateStr)

      days.push({
        date: dateStr,
        dayOfWeek: date.getDay(),
        dayNumber: date.getDate(),
        monthName: date.toLocaleDateString("fr-FR", { month: "short" }),
        isToday: i === 0,
        isPast: i < 0,
        isWorkingDay: globalSettings.workingDays.includes(date.getDay()),
        slotsCount: daySlots.length,
        bookedSlots: daySlots.filter((slot) => slot.current_bookings > 0).length,
        availableSlots: daySlots.filter((slot) => slot.current_bookings < slot.max_capacity).length,
      })
    }

    return days
  }

  const generateTimeSlots = (date: string) => {
    const slots: VisitSlot[] = []
    const { timeSlots, defaultDuration, defaultCapacity, allowGroupVisits } = globalSettings

    Object.entries(timeSlots).forEach(([period, config]) => {
      if (!config.enabled) return

      const startTime = new Date(`2000-01-01T${config.start}:00`)
      const endTime = new Date(`2000-01-01T${config.end}:00`)

      while (startTime < endTime) {
        const start = startTime.toTimeString().slice(0, 5)
        startTime.setMinutes(startTime.getMinutes() + defaultDuration)
        const end = startTime.toTimeString().slice(0, 5)

        if (startTime <= endTime) {
          slots.push({
            date,
            start_time: start,
            end_time: end,
            max_capacity: defaultCapacity,
            is_group_visit: allowGroupVisits,
            current_bookings: 0,
          })
        }
      }
    })

    return slots
  }

  const handleDayClick = (date: string) => {
    setSelectedDate(date)
    const daySlots = visitSlots.filter((slot) => slot.date === date)
    setCurrentDaySlots(daySlots)
    setShowTimeDialog(true)
  }

  const handleGenerateSlots = () => {
    if (!selectedDate) return

    const newSlots = generateTimeSlots(selectedDate)
    const otherSlots = visitSlots.filter((slot) => slot.date !== selectedDate)
    const updatedSlots = [...otherSlots, ...newSlots]

    onSlotsChange(updatedSlots)
    setCurrentDaySlots(newSlots)
    toast.success(`${newSlots.length} créneaux générés`)
  }

  const handleAddCustomSlot = () => {
    const newSlot: VisitSlot = {
      date: selectedDate,
      start_time: "09:00",
      end_time: "09:30",
      max_capacity: globalSettings.defaultCapacity,
      is_group_visit: globalSettings.allowGroupVisits,
      current_bookings: 0,
    }

    const updatedDaySlots = [...currentDaySlots, newSlot]
    setCurrentDaySlots(updatedDaySlots)

    const otherSlots = visitSlots.filter((slot) => slot.date !== selectedDate)
    onSlotsChange([...otherSlots, ...updatedDaySlots])
  }

  const handleUpdateSlot = (index: number, updates: Partial<VisitSlot>) => {
    const updatedDaySlots = currentDaySlots.map((slot, i) => (i === index ? { ...slot, ...updates } : slot))
    setCurrentDaySlots(updatedDaySlots)

    const otherSlots = visitSlots.filter((slot) => slot.date !== selectedDate)
    onSlotsChange([...otherSlots, ...updatedDaySlots])
  }

  const handleDeleteSlot = (index: number) => {
    const updatedDaySlots = currentDaySlots.filter((_, i) => i !== index)
    setCurrentDaySlots(updatedDaySlots)

    const otherSlots = visitSlots.filter((slot) => slot.date !== selectedDate)
    onSlotsChange([...otherSlots, ...updatedDaySlots])
  }

  const handleClearDay = () => {
    setCurrentDaySlots([])
    const otherSlots = visitSlots.filter((slot) => slot.date !== selectedDate)
    onSlotsChange(otherSlots)
    toast.success("Créneaux supprimés")
  }

  const handleGenerateAll = () => {
    const allSlots: VisitSlot[] = []
    const days = generateCalendarDays()

    days.forEach((day) => {
      if (day.isWorkingDay && !day.isPast) {
        const daySlots = generateTimeSlots(day.date)
        allSlots.push(...daySlots)
      }
    })

    onSlotsChange(allSlots)
    toast.success(`${allSlots.length} créneaux générés pour tous les jours ouvrés`)
  }

  const calendarDays = generateCalendarDays()

  const getDayStatusBadge = (day: any) => {
    if (day.isPast) return null
    if (!day.isWorkingDay)
      return (
        <Badge variant="outline" className="text-xs">
          Fermé
        </Badge>
      )
    if (day.slotsCount === 0)
      return (
        <Badge variant="secondary" className="text-xs">
          Libre
        </Badge>
      )
    if (day.availableSlots === 0)
      return (
        <Badge variant="destructive" className="text-xs">
          Complet
        </Badge>
      )
    if (day.bookedSlots > 0)
      return (
        <Badge variant="default" className="text-xs">
          Réservé
        </Badge>
      )
    return (
      <Badge variant="default" className="text-xs">
        Ouvert
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Paramètres globaux */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Paramètres des visites
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
                <div>
                  <Label>Durée par défaut (min)</Label>
                  <Select
                    value={globalSettings.defaultDuration.toString()}
                    onValueChange={(value) =>
                      setGlobalSettings((prev) => ({ ...prev, defaultDuration: Number.parseInt(value) }))
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

                <div>
                  <Label>Capacité par défaut</Label>
                  <Select
                    value={globalSettings.defaultCapacity.toString()}
                    onValueChange={(value) =>
                      setGlobalSettings((prev) => ({ ...prev, defaultCapacity: Number.parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} personne{num > 1 ? "s" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox
                    id="group-visits"
                    checked={globalSettings.allowGroupVisits}
                    onCheckedChange={(checked) =>
                      setGlobalSettings((prev) => ({ ...prev, allowGroupVisits: checked as boolean }))
                    }
                  />
                  <Label htmlFor="group-visits">Visites groupées par défaut</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="horaires" className="space-y-4">
              {Object.entries(globalSettings.timeSlots).map(([period, config]) => (
                <div key={period} className="flex items-center space-x-4 p-3 border rounded-lg">
                  <Checkbox
                    checked={config.enabled}
                    onCheckedChange={(checked) =>
                      setGlobalSettings((prev) => ({
                        ...prev,
                        timeSlots: {
                          ...prev.timeSlots,
                          [period]: { ...config, enabled: checked as boolean },
                        },
                      }))
                    }
                  />
                  <div className="flex-1">
                    <Label className="capitalize">
                      {period === "morning" ? "Matin" : period === "afternoon" ? "Après-midi" : "Soirée"}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="time"
                      value={config.start}
                      onChange={(e) =>
                        setGlobalSettings((prev) => ({
                          ...prev,
                          timeSlots: {
                            ...prev.timeSlots,
                            [period]: { ...config, start: e.target.value },
                          },
                        }))
                      }
                      disabled={!config.enabled}
                      className="w-24"
                    />
                    <span>à</span>
                    <Input
                      type="time"
                      value={config.end}
                      onChange={(e) =>
                        setGlobalSettings((prev) => ({
                          ...prev,
                          timeSlots: {
                            ...prev.timeSlots,
                            [period]: { ...config, end: e.target.value },
                          },
                        }))
                      }
                      disabled={!config.enabled}
                      className="w-24"
                    />
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="jours" className="space-y-4">
              <div className="grid grid-cols-7 gap-2">
                {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map((day, index) => (
                  <div key={day} className="text-center">
                    <Label className="text-sm">{day}</Label>
                    <div className="mt-2">
                      <Checkbox
                        checked={globalSettings.workingDays.includes(index)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setGlobalSettings((prev) => ({ ...prev, workingDays: [...prev.workingDays, index] }))
                          } else {
                            setGlobalSettings((prev) => ({
                              ...prev,
                              workingDays: prev.workingDays.filter((d) => d !== index),
                            }))
                          }
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleGenerateAll} className="flex-1">
              <Zap className="h-4 w-4 mr-2" />
              Générer tous les créneaux
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calendrier des jours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendrier des disponibilités
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day) => (
              <div
                key={day.date}
                onClick={() => !day.isPast && handleDayClick(day.date)}
                className={`
                  p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md
                  ${day.isPast ? "opacity-50 cursor-not-allowed bg-gray-50" : ""}
                  ${day.isToday ? "ring-2 ring-blue-500" : ""}
                  ${!day.isWorkingDay ? "bg-gray-100" : ""}
                  ${day.slotsCount > 0 ? "bg-blue-50 border-blue-200" : ""}
                `}
              >
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">{day.monthName}</div>
                  <div className="font-semibold text-lg">{day.dayNumber}</div>
                  <div className="mt-2 space-y-1">
                    {getDayStatusBadge(day)}
                    {day.slotsCount > 0 && <div className="text-xs text-gray-600">{day.slotsCount} créneaux</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de gestion des créneaux du jour */}
      <Dialog open={showTimeDialog} onOpenChange={setShowTimeDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Créneaux du{" "}
              {selectedDate &&
                new Date(selectedDate).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={handleGenerateSlots} variant="outline">
                <Zap className="h-4 w-4 mr-2" />
                Générer selon paramètres
              </Button>
              <Button onClick={handleAddCustomSlot} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un créneau
              </Button>
              {currentDaySlots.length > 0 && (
                <Button onClick={handleClearDay} variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Tout supprimer
                </Button>
              )}
            </div>

            {currentDaySlots.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4" />
                <p>Aucun créneau configuré pour ce jour</p>
                <p className="text-sm">Utilisez les boutons ci-dessus pour en ajouter</p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentDaySlots
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map((slot, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <Input
                          type="time"
                          value={slot.start_time}
                          onChange={(e) => handleUpdateSlot(index, { start_time: e.target.value })}
                          className="w-24"
                        />
                        <span>à</span>
                        <Input
                          type="time"
                          value={slot.end_time}
                          onChange={(e) => handleUpdateSlot(index, { end_time: e.target.value })}
                          className="w-24"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <Select
                          value={slot.max_capacity.toString()}
                          onValueChange={(value) => handleUpdateSlot(index, { max_capacity: Number.parseInt(value) })}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={slot.is_group_visit}
                          onCheckedChange={(checked) => handleUpdateSlot(index, { is_group_visit: checked as boolean })}
                        />
                        <Label className="text-sm">Groupe</Label>
                      </div>

                      {mode === "management" && slot.current_bookings > 0 && (
                        <Badge variant="secondary">
                          {slot.current_bookings}/{slot.max_capacity} réservé
                        </Badge>
                      )}

                      <Button variant="destructive" size="sm" onClick={() => handleDeleteSlot(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Résumé */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{visitSlots.length}</div>
              <div className="text-sm text-gray-600">Créneaux total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {visitSlots.filter((slot) => slot.current_bookings === 0).length}
              </div>
              <div className="text-sm text-gray-600">Disponibles</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {
                  visitSlots.filter((slot) => slot.current_bookings > 0 && slot.current_bookings < slot.max_capacity)
                    .length
                }
              </div>
              <div className="text-sm text-gray-600">Partiellement réservés</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {visitSlots.filter((slot) => slot.current_bookings >= slot.max_capacity).length}
              </div>
              <div className="text-sm text-gray-600">Complets</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
