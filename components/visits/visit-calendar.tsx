"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, ClockIcon, UserIcon, HomeIcon } from "lucide-react"

export function VisitCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedView, setSelectedView] = useState("month")

  // Mock data for visits - in real app, this would come from API
  const visits = [
    {
      id: 1,
      propertyTitle: "Appartement 3P - Belleville",
      tenantName: "Marie Dupont",
      date: "2025-05-25",
      time: "14:00",
      status: "confirmed",
    },
    {
      id: 2,
      propertyTitle: "Studio meublé - République",
      tenantName: "Pierre Martin",
      date: "2025-05-24",
      time: "16:30",
      status: "confirmed",
    },
    {
      id: 3,
      propertyTitle: "Loft moderne - Bastille",
      tenantName: "Sophie Leroy",
      date: "2025-05-26",
      time: "10:00",
      status: "pending",
    },
    {
      id: 4,
      propertyTitle: "Maison 4P - Montreuil",
      tenantName: "Thomas Dubois",
      date: "2025-05-27",
      time: "15:00",
      status: "confirmed",
    },
    {
      id: 5,
      propertyTitle: "Appartement 3P - Belleville",
      tenantName: "Julie Bernard",
      date: "2025-05-28",
      time: "11:00",
      status: "pending",
    },
  ]

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const getVisitsForDate = (date: Date | null) => {
    if (!date) return []
    const dateString = date.toISOString().split("T")[0]
    return visits.filter((visit) => visit.date === dateString)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500"
      case "pending":
        return "bg-orange-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const monthNames = [
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

  const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]

  const days = getDaysInMonth(currentDate)

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedView} onValueChange={setSelectedView}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mois</SelectItem>
              <SelectItem value="week">Semaine</SelectItem>
              <SelectItem value="day">Jour</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b">
            {dayNames.map((day) => (
              <div key={day} className="p-3 text-center font-medium text-muted-foreground border-r last:border-r-0">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day, index) => {
              const dayVisits = getVisitsForDate(day)
              const isToday = day && day.toDateString() === new Date().toDateString()

              return (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 border-r border-b last:border-r-0 ${
                    day ? "bg-white hover:bg-gray-50" : "bg-gray-50"
                  } ${isToday ? "bg-blue-50" : ""}`}
                >
                  {day && (
                    <>
                      <div className={`text-sm font-medium mb-2 ${isToday ? "text-blue-600" : ""}`}>
                        {day.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayVisits.map((visit) => (
                          <div
                            key={visit.id}
                            className={`text-xs p-1 rounded text-white cursor-pointer ${getStatusColor(visit.status)}`}
                            title={`${visit.time} - ${visit.tenantName} (${visit.propertyTitle})`}
                          >
                            <div className="font-medium">{visit.time}</div>
                            <div className="truncate">{visit.tenantName}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500"></div>
          <span className="text-sm">Confirmée</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-orange-500"></div>
          <span className="text-sm">En attente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500"></div>
          <span className="text-sm">Annulée</span>
        </div>
      </div>

      {/* Upcoming Visits */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Prochaines visites</h3>
          <div className="space-y-4">
            {visits
              .filter((visit) => {
                const visitDate = new Date(visit.date)
                const today = new Date()
                const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
                return visitDate >= today && visitDate <= nextWeek
              })
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map((visit) => (
                <div key={visit.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(visit.status)}`}></div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{new Date(visit.date).toLocaleDateString("fr-FR")}</span>
                        <ClockIcon className="h-4 w-4 text-muted-foreground ml-2" />
                        <span>{visit.time}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <UserIcon className="h-3 w-3" />
                          {visit.tenantName}
                        </div>
                        <div className="flex items-center gap-1">
                          <HomeIcon className="h-3 w-3" />
                          {visit.propertyTitle}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Button variant="outline" size="sm">
                      Détails
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
