"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronLeft, ChevronRight, Clock, CheckCircle, Users } from "lucide-react"

interface VisitSlot {
  id: string
  date: string
  start_time: string
  end_time: string
  max_capacity: number
  is_group_visit: boolean
  current_bookings: number
  is_available: boolean
}

interface TenantVisitSlotCalendarProps {
  visitSlots: VisitSlot[]
  selectedSlot: string
  onSlotSelected: (slotId: string) => void
}

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

export function TenantVisitSlotCalendar({ visitSlots, selectedSlot, onSlotSelected }: TenantVisitSlotCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Générer les jours du calendrier
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const startDate = new Date(firstDay)

    const dayOfWeek = firstDay.getDay()
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    startDate.setDate(firstDay.getDate() - daysToSubtract)

    const days = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)

      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const day = String(date.getDate()).padStart(2, "0")
      const dateStr = `${year}-${month}-${day}`

      const isCurrentMonth = date.getMonth() === currentDate.getMonth()
      const isToday = date.getTime() === today.getTime()
      const isPast = date < today
      const hasSlots = visitSlots.some((slot) => slot.date === dateStr)

      days.push({
        date: dateStr,
        day: date.getDate(),
        isCurrentMonth,
        isToday,
        isPast,
        hasSlots,
      })
    }

    return days
  }

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const selectDate = (dateStr: string) => {
    setSelectedDate(dateStr)
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
      return "Date invalide"
    }
  }

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}`)
    const end = new Date(`2000-01-01T${endTime}`)
    const diffMs = end.getTime() - start.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))

    if (diffMins >= 60) {
      const hours = Math.floor(diffMins / 60)
      const mins = diffMins % 60
      return mins > 0 ? `${hours}h${mins}` : `${hours}h`
    }
    return `${diffMins}min`
  }

  const calendarDays = generateCalendarDays()
  const selectedDateSlots = selectedDate
    ? visitSlots.filter((slot) => slot.date === selectedDate).sort((a, b) => a.start_time.localeCompare(b.start_time))
    : []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calendrier */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Dates disponibles
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
            {DAYS_SHORT.map((day) => (
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
                onClick={() => day.hasSlots && !day.isPast && selectDate(day.date)}
                disabled={day.isPast || !day.hasSlots}
              >
                <span>{day.day}</span>
                {day.hasSlots && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                    <div className="w-1 h-1 bg-green-600 rounded-full"></div>
                  </div>
                )}
              </Button>
            ))}
          </div>

          <div className="mt-4 text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
              <span>Dates avec créneaux disponibles</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded"></div>
              <span>Date sélectionnée</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Créneaux du jour sélectionné */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDate ? `Créneaux du ${formatDateForDisplay(selectedDate)}` : "Sélectionnez une date"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDate ? (
            selectedDateSlots.length > 0 ? (
              <div className="space-y-3">
                {selectedDateSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedSlot === slot.id
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    }`}
                    onClick={() => onSlotSelected(slot.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-lg">
                          {slot.start_time} - {slot.end_time}
                        </span>
                        <Badge variant="outline">{calculateDuration(slot.start_time, slot.end_time)}</Badge>
                      </div>
                      {selectedSlot === slot.id && <CheckCircle className="h-5 w-5 text-blue-600" />}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {slot.is_group_visit ? (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>Visite groupée</span>
                          <Badge variant="secondary" className="ml-2">
                            {slot.max_capacity - slot.current_bookings} place(s) disponible(s)
                          </Badge>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>Visite individuelle</span>
                        </div>
                      )}
                    </div>

                    {slot.is_group_visit && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Cette visite peut être partagée avec d'autres candidats
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aucun créneau disponible pour cette date</p>
              </div>
            )
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Sélectionnez une date dans le calendrier pour voir les créneaux disponibles</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
