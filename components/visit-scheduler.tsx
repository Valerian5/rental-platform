"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronLeft, ChevronRight, Plus, Minus, Save, RefreshCw, CheckCircle, Clock } from "lucide-react"
import { toast } from "sonner"
import { getAuthHeaders } from "@/lib/auth-utils"

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

interface VisitSchedulerProps {
  visitSlots: VisitSlot[]
  onSlotsChange: (slots: VisitSlot[]) => void
  mode: "creation" | "management"
  propertyId?: string
}

interface DayConfiguration {
  date: string
  slotDuration: number
  startTime: string
  endTime: string
  isGroupVisit: boolean
  capacity: number
  selectedSlots: string[]
}

const DURATION_OPTIONS = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 60, label: "1 h" },
  { value: 0, label: "autre" },
]

const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
]

const DAYS_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]

const formatTimeString = (timeStr: string): string => {
  if (!timeStr) return "00:00"
  if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeStr)) {
    return timeStr
  }
  if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(timeStr)) {
    return timeStr.substring(0, 5)
  }
  return "00:00"
}

const formatDateForDisplay = (dateStr: string): string => {
  try {
    const [year, month, day] = dateStr.split("-").map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
  } catch (error) {
    console.error("Erreur formatage date:", error, "pour:", dateStr)
    return "Date invalide"
  }
}

const isFutureSlot = (slot: VisitSlot) => {
  const now = new Date()
  const slotDate = new Date(`${slot.date}T${slot.start_time}`)
  return slotDate > now
}

export function VisitScheduler({ visitSlots = [], onSlotsChange, mode, propertyId }: VisitSchedulerProps) {
  const safeVisitSlots: VisitSlot[] = Array.isArray(visitSlots) ? visitSlots : []
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [dayConfig, setDayConfig] = useState<DayConfiguration>({
    date: "",
    slotDuration: 30,
    startTime: "08:00",
    endTime: "20:00",
    isGroupVisit: false,
    capacity: 1,
    selectedSlots: [],
  })
  const [customDuration, setCustomDuration] = useState(45)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasInitialLoad, setHasInitialLoad] = useState(false)
  const loadingRef = useRef(false)

  const loadSlotsFromDatabase = useCallback(async () => {
    if (!propertyId || loadingRef.current) return

    setIsLoading(true)
    loadingRef.current = true

    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/properties/${propertyId}/visit-slots`, { headers })
      
      if (response.ok) {
        const data = await response.json()
        const cleanedSlots = (Array.isArray(data.slots) ? data.slots : []).map((slot: any) => ({
          ...slot,
          start_time: formatTimeString(slot.start_time),
          end_time: formatTimeString(slot.end_time),
        }))
        onSlotsChange(cleanedSlots)
        setHasInitialLoad(true)
      }
    } finally {
      setIsLoading(false)
      loadingRef.current = false
    }
  }, [propertyId, onSlotsChange])

  useEffect(() => {
    if (mode === "management" && propertyId && !hasInitialLoad && safeVisitSlots.length === 0) {
      loadSlotsFromDatabase()
    } else if (safeVisitSlots.length > 0 && !hasInitialLoad) {
      setHasInitialLoad(true)
    }
  }, [mode, propertyId, hasInitialLoad, safeVisitSlots.length, loadSlotsFromDatabase])

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const startDate = new Date(firstDay)
    startDate.setDate(firstDay.getDate() - (firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1))

    const days = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)

      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
      const isCurrentMonth = date.getMonth() === currentDate.getMonth()
      const isToday = date.getTime() === today.getTime()
      const isPast = date < today
      const hasSlots = safeVisitSlots.some((slot) => slot.date === dateStr)
      const bookedSlots = safeVisitSlots.filter((slot) => slot.date === dateStr && slot.current_bookings > 0).length

      days.push({ date: dateStr, day: date.getDate(), isCurrentMonth, isToday, isPast, hasSlots, bookedSlots })
    }

    return days
  }

  const generateTimeSlots = (config: DayConfiguration) => {
    const slots = []
    const duration = config.slotDuration === 0 ? customDuration : config.slotDuration
    if (!duration || duration <= 0) return slots

    try {
      const startTime = new Date(`2000-01-01T${config.startTime}:00`)
      const endTime = new Date(`2000-01-01T${config.endTime}:00`)
      let currentTime = new Date(startTime)

      while (currentTime < endTime) {
        const nextTime = new Date(currentTime.getTime() + duration * 60000)
        if (nextTime <= endTime) {
          const startTimeStr = currentTime.toTimeString().slice(0, 5)
          const endTimeStr = nextTime.toTimeString().slice(0, 5)
          slots.push({
            key: `${startTimeStr}-${endTimeStr}`,
            startTime: startTimeStr,
            endTime: endTimeStr,
            label: `${startTimeStr} - ${endTimeStr}`,
          })
        }
        currentTime = nextTime
      }
    } catch (error) {
      console.error("Erreur génération créneaux:", error)
    }

    return slots
  }

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + (direction === "prev" ? -1 : 1))
    setCurrentDate(newDate)
  }

  const selectDate = (dateStr: string) => {
    setSelectedDate(dateStr)
    const existingSlots = safeVisitSlots.filter((slot) => slot.date === dateStr)

    if (existingSlots.length > 0) {
      const firstSlot = existingSlots[0]
      const duration = (new Date(`2000-01-01T${firstSlot.end_time}:00`).getTime() - 
                       new Date(`2000-01-01T${firstSlot.start_time}:00`).getTime()) / 60000
      
      let commonDuration = DURATION_OPTIONS.some(opt => opt.value === duration) ? duration : 0
      if (commonDuration === 0) setCustomDuration(duration)

      setDayConfig({
        date: dateStr,
        slotDuration: commonDuration,
        startTime: firstSlot.start_time,
        endTime: firstSlot.end_time,
        isGroupVisit: firstSlot.is_group_visit,
        capacity: firstSlot.max_capacity,
        selectedSlots: existingSlots.map(slot => `${slot.start_time}-${slot.end_time}`),
      })
    } else {
      setDayConfig({
        date: dateStr,
        slotDuration: 30,
        startTime: "08:00",
        endTime: "20:00",
        isGroupVisit: false,
        capacity: 1,
        selectedSlots: [],
      })
    }
  }

  const toggleSlot = (slotKey: string) => {
    setDayConfig(prev => ({
      ...prev,
      selectedSlots: prev.selectedSlots.includes(slotKey)
        ? prev.selectedSlots.filter(s => s !== slotKey)
        : [...prev.selectedSlots, slotKey]
    }))
  }

  const applyDayConfiguration = async () => {
    if (!selectedDate || dayConfig.selectedSlots.length === 0) {
      toast.error("Veuillez sélectionner au moins un créneau")
      return
    }

    const otherDaysSlots = safeVisitSlots.filter(slot => slot.date !== selectedDate)
    const newSlots = dayConfig.selectedSlots.map(slotKey => {
      const [startTime, endTime] = slotKey.split("-")
      return {
        date: selectedDate,
        start_time: formatTimeString(startTime),
        end_time: formatTimeString(endTime),
        max_capacity: dayConfig.capacity,
        is_group_visit: dayConfig.isGroupVisit,
        current_bookings: 0,
        is_available: true,
      }
    })

    onSlotsChange([...otherDaysSlots, ...newSlots])

    if (mode === "management") {
      setIsSaving(true)
      try {
        const headers = await getAuthHeaders()
        await fetch(`/api/properties/${propertyId}/visit-slots`, {
          method: "POST",
          headers,
          body: JSON.stringify({ slots: [...otherDaysSlots, ...newSlots] }),
        })
        toast.success("Créneaux sauvegardés avec succès")
      } finally {
        setIsSaving(false)
      }
    } else {
      toast.success(`${newSlots.length} créneaux configurés`)
    }
  }

  const clearDaySlots = async () => {
    if (!selectedDate) return
    const otherDaysSlots = safeVisitSlots.filter(slot => slot.date !== selectedDate)
    onSlotsChange(otherDaysSlots)
    setDayConfig(prev => ({ ...prev, selectedSlots: [] }))

    if (mode === "management") {
      setIsSaving(true)
      try {
        const headers = await getAuthHeaders()
        await fetch(`/api/properties/${propertyId}/visit-slots`, {
          method: "POST",
          headers,
          body: JSON.stringify({ slots: otherDaysSlots }),
        })
        toast.success("Créneaux supprimés avec succès")
      } finally {
        setIsSaving(false)
      }
    }
  }

  const calendarDays = generateCalendarDays()
  const timeSlots = generateTimeSlots(dayConfig)
  const totalFutureSlots = safeVisitSlots.filter(isFutureSlot).length

  if (isLoading && !hasInitialLoad) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendrier */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Sélectionner un jour
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium min-w-[120px] text-center">
                  {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                </span>
                <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS_SHORT.map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => (
                <Button
                  key={index}
                  variant={selectedDate === day.date ? "default" : day.hasSlots ? "secondary" : "ghost"}
                  className={`
                    h-12 p-1 text-sm relative
                    ${!day.isCurrentMonth ? "text-muted-foreground opacity-50" : ""}
                    ${day.isToday ? "ring-2 ring-blue-500" : ""}
                    ${day.isPast ? "opacity-50 cursor-not-allowed" : ""}
                    ${day.hasSlots ? "bg-green-100 hover:bg-green-200 border-green-300" : ""}
                    ${selectedDate === day.date ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
                  `}
                  onClick={() => !day.isPast && selectDate(day.date)}
                  disabled={day.isPast}
                >
                  <span>{day.day}</span>
                  {day.hasSlots && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1">
                      <div className="w-1 h-1 bg-green-600 rounded-full"></div>
                      {day.bookedSlots > 0 && <div className="w-1 h-1 bg-orange-600 rounded-full"></div>}
                    </div>
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Configuration du jour */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate ? `Configuration du ${formatDateForDisplay(selectedDate)}` : "Sélectionnez un jour"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedDate ? (
              <>
                {/* Configuration des créneaux */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Créneaux disponibles</Label>
                  <div className="border rounded-lg p-3 max-h-80 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-2">
                      {timeSlots.map(slot => {
                        const isSelected = dayConfig.selectedSlots.includes(slot.key)
                        return (
                          <div
                            key={slot.key}
                            className={`
                              flex items-center justify-between p-2 rounded border cursor-pointer transition-colors
                              ${isSelected ? "bg-blue-100 border-blue-300 text-blue-800" : "bg-gray-50 border-gray-200 hover:bg-gray-100"}
                            `}
                            onClick={() => toggleSlot(slot.key)}
                          >
                            <span className="text-sm font-medium">{slot.label}</span>
                            {isSelected && <CheckCircle className="h-4 w-4 text-blue-600" />}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={applyDayConfiguration}
                    disabled={dayConfig.selectedSlots.length === 0 || isSaving}
                    className="flex-1"
                  >
                    {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Appliquer
                  </Button>
                  <Button variant="outline" onClick={clearDaySlots} disabled={isSaving}>
                    Effacer
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Sélectionnez un jour dans le calendrier</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Résumé */}
      {totalFutureSlots > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Résumé des créneaux futurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{totalFutureSlots}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {safeVisitSlots.filter(slot => 
                    slot.is_available && 
                    slot.current_bookings < slot.max_capacity && 
                    isFutureSlot(slot)
                  ).length}
                </div>
                <div className="text-sm text-muted-foreground">Disponibles</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {safeVisitSlots.filter(slot => 
                    slot.current_bookings > 0 && 
                    isFutureSlot(slot)
                  ).length}
                </div>
                <div className="text-sm text-muted-foreground">Réservés</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}