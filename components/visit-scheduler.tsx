"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Calendar, Settings } from "lucide-react"
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
  slotDuration: number
  defaultCapacity: number
  allowGroupVisits: boolean
  workingDays: number[]
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
    workingDays: [1, 2, 3, 4, 5, 6],
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

  const [calendarDays, setCalendarDays] = useState<
    Array<{
      date: string
      dayName: string
      dayNumber: number
      monthName: string
      slots: VisitSlot[]
    }>
  >([])

  useEffect(() => {
    const days = []
    const today = new Date()

    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const dateStr = date.toISOString().split("T")[0]
      const dayName = date.toLocaleDateString("fr-FR", { weekday: "short" })
      const dayNumber = date.getDate()
      const monthName = date.toLocaleDateString("fr-FR", { month: "short" })

      const daySlots = visitSlots.filter((slot) => slot.date === dateStr)

      days.push({
        date: dateStr,
        dayName,
        dayNumber,
        monthName,
        slots: daySlots,
      })
    }

    setCalendarDays(days)
  }, [visitSlots])

  const generateAllSlots = () => {
    const allSlots: VisitSlot[] = []

    calendarDays.forEach((day) => {
      const dayOfWeek = new Date(day.date).getDay()
      if (!settings.workingDays.includes(dayOfWeek)) return

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
            allSlots.push({
              date: day.date,
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
    })

    onSlotsChange(allSlots)
    toast.success(`${allSlots.length} créneaux générés`)
  }

  const getDateStatus = (day: { slots: VisitSlot[] }) => {
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Durée des créneaux</Label>
              <Select
                value={settings.slotDuration.toString()}
                onValueChange={(value) => setSettings((prev) => ({ ...prev, slotDuration: Number.parseInt(value) }))}
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
                onChange={(e) => setSettings((prev) => ({ ...prev, defaultCapacity: Number.parseInt(e.target.value) }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Visites groupées</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={settings.allowGroupVisits}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, allowGroupVisits: !!checked }))}
                />
                <span className="text-sm">Autoriser</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
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

      {/* Calendrier simplifié */}
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
                <div key={day.date} className={`p-2 border rounded-lg text-center ${getStatusColor(status)}`}>
                  <div className="text-xs text-gray-500">{day.monthName}</div>
                  <div className="text-xs font-medium">{day.dayName}</div>
                  <div className="text-lg font-bold">{day.dayNumber}</div>
                  <div className="text-xs mt-1">{getStatusLabel(status)}</div>
                  <div className="text-xs">{day.slots.length} créneaux</div>
                </div>
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
