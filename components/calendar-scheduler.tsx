"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react"
import { format, addDays, startOfWeek, isSameDay, isToday } from "date-fns"
import { fr } from "date-fns/locale"

interface CalendarEvent {
  id: string
  title: string
  date: Date
  time: string
  type: "visit" | "maintenance" | "meeting"
  location?: string
  status: "confirmed" | "pending" | "cancelled"
}

interface CalendarSchedulerProps {
  events?: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  onDateClick?: (date: Date) => void
}

export function CalendarScheduler({ events = [], onEventClick, onDateClick }: CalendarSchedulerProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"week" | "month">("week")

  // Générer les jours de la semaine
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Événements par défaut pour la démo
  const defaultEvents: CalendarEvent[] = [
    {
      id: "1",
      title: "Visite appartement 3 pièces",
      date: new Date(),
      time: "14:00",
      type: "visit",
      location: "123 Rue de la Paix",
      status: "confirmed",
    },
    {
      id: "2",
      title: "Maintenance chauffage",
      date: addDays(new Date(), 1),
      time: "10:30",
      type: "maintenance",
      location: "456 Avenue des Fleurs",
      status: "pending",
    },
    {
      id: "3",
      title: "Rendez-vous propriétaire",
      date: addDays(new Date(), 2),
      time: "16:00",
      type: "meeting",
      status: "confirmed",
    },
  ]

  const allEvents = events.length > 0 ? events : defaultEvents

  const getEventsForDate = (date: Date) => {
    return allEvents.filter((event) => isSameDay(event.date, date))
  }

  const getEventColor = (type: string, status: string) => {
    if (status === "cancelled") return "bg-gray-100 text-gray-600"

    switch (type) {
      case "visit":
        return "bg-blue-100 text-blue-800"
      case "maintenance":
        return "bg-orange-100 text-orange-800"
      case "meeting":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-600"
    }
  }

  const navigateWeek = (direction: "prev" | "next") => {
    const days = direction === "next" ? 7 : -7
    setCurrentDate((prev) => addDays(prev, days))
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Calendrier des événements</CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border">
              <Button variant={view === "week" ? "default" : "ghost"} size="sm" onClick={() => setView("week")}>
                Semaine
              </Button>
              <Button variant={view === "month" ? "default" : "ghost"} size="sm" onClick={() => setView("month")}>
                Mois
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateWeek("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold">
              {format(weekStart, "dd MMM", { locale: fr })} -{" "}
              {format(addDays(weekStart, 6), "dd MMM yyyy", { locale: fr })}
            </h3>
            <Button variant="outline" size="sm" onClick={() => navigateWeek("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Aujourd'hui
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => {
            const dayEvents = getEventsForDate(day)
            const isCurrentDay = isToday(day)

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[120px] p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                  isCurrentDay ? "bg-blue-50 border-blue-200" : "border-gray-200"
                }`}
                onClick={() => onDateClick?.(day)}
              >
                <div className={`text-sm font-medium mb-2 ${isCurrentDay ? "text-blue-600" : "text-gray-900"}`}>
                  {format(day, "d")}
                </div>

                <div className="space-y-1">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`p-1 rounded text-xs cursor-pointer hover:opacity-80 ${getEventColor(
                        event.type,
                        event.status,
                      )}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEventClick?.(event)
                      }}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <Clock className="h-3 w-3" />
                        <span className="font-medium">{event.time}</span>
                      </div>
                      <div className="truncate">{event.title}</div>
                      {event.location && (
                        <div className="flex items-center gap-1 mt-1 opacity-75">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Légende */}
        <div className="mt-6 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-100 text-blue-800">Visite</Badge>
            <Badge className="bg-orange-100 text-orange-800">Maintenance</Badge>
            <Badge className="bg-green-100 text-green-800">Rendez-vous</Badge>
            <Badge className="bg-gray-100 text-gray-600">Annulé</Badge>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{allEvents.filter((e) => e.type === "visit").length}</div>
            <div className="text-sm text-blue-600">Visites</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {allEvents.filter((e) => e.type === "maintenance").length}
            </div>
            <div className="text-sm text-orange-600">Maintenances</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {allEvents.filter((e) => e.type === "meeting").length}
            </div>
            <div className="text-sm text-green-600">Rendez-vous</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
