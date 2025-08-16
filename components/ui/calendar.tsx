"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface CalendarProps {
  className?: string
  classNames?: Record<string, string>
  showOutsideDays?: boolean
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  mode?: "single" | "multiple" | "range"
  hasVisitsOnDate?: (date: Date) => boolean
  getVisitCountForDate?: (date: Date) => number
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  selected,
  onSelect,
  disabled,
  mode = "single",
  hasVisitsOnDate,
  getVisitCountForDate,
  ...props
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date())

  const today = new Date()
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const firstDayWeekday = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  // Get previous month days to show
  const prevMonth = new Date(year, month - 1, 0)
  const daysInPrevMonth = prevMonth.getDate()

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

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1))
  }

  const handleDateClick = (date: Date) => {
    if (disabled && disabled(date)) return
    onSelect?.(date)
  }

  const isSelected = (date: Date) => {
    if (!selected) return false
    return (
      date.getDate() === selected.getDate() &&
      date.getMonth() === selected.getMonth() &&
      date.getFullYear() === selected.getFullYear()
    )
  }

  const isToday = (date: Date) => {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const isDisabled = (date: Date) => {
    return disabled ? disabled(date) : false
  }

  const hasVisits = (date: Date) => {
    return hasVisitsOnDate ? hasVisitsOnDate(date) : false
  }

  const getVisitCount = (date: Date) => {
    return getVisitCountForDate ? getVisitCountForDate(date) : 0
  }

  // Generate calendar days
  const calendarDays = []

  // Previous month days
  for (let i = firstDayWeekday - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, daysInPrevMonth - i)
    calendarDays.push({
      date,
      isCurrentMonth: false,
      isToday: isToday(date),
      isSelected: isSelected(date),
      isDisabled: isDisabled(date),
    })
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    calendarDays.push({
      date,
      isCurrentMonth: true,
      isToday: isToday(date),
      isSelected: isSelected(date),
      isDisabled: isDisabled(date),
    })
  }

  // Next month days
  const remainingDays = 42 - calendarDays.length // 6 weeks * 7 days
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month + 1, day)
    calendarDays.push({
      date,
      isCurrentMonth: false,
      isToday: isToday(date),
      isSelected: isSelected(date),
      isDisabled: isDisabled(date),
    })
  }

  return (
    <div className={cn("p-3", className)} {...props}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="sm" onClick={goToPreviousMonth} className="h-7 w-7 p-0 bg-transparent">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-medium">
          {monthNames[month]} {year}
        </div>
        <Button variant="outline" size="sm" onClick={goToNextMonth} className="h-7 w-7 p-0 bg-transparent">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="h-8 w-8 text-xs font-medium text-muted-foreground flex items-center justify-center">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          const dayHasVisits = hasVisits(day.date)
          const visitCount = getVisitCount(day.date)

          return (
            <button
              key={index}
              onClick={() => handleDateClick(day.date)}
              disabled={day.isDisabled}
              className={cn(
                "h-8 w-8 text-sm rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed relative",
                {
                  "text-muted-foreground": !day.isCurrentMonth && showOutsideDays,
                  "bg-primary text-primary-foreground": day.isSelected,
                  "bg-accent text-accent-foreground": day.isToday && !day.isSelected,
                  hidden: !day.isCurrentMonth && !showOutsideDays,
                  "ring-2 ring-blue-500 ring-offset-1": dayHasVisits && day.isCurrentMonth && !day.isSelected,
                  "bg-blue-50": dayHasVisits && day.isCurrentMonth && !day.isSelected && !day.isToday,
                },
              )}
            >
              {day.date.getDate()}
              {dayHasVisits && day.isCurrentMonth && (
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-[8px] text-white font-bold">{visitCount > 9 ? "9+" : visitCount}</span>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

Calendar.displayName = "Calendar"

export { Calendar }
