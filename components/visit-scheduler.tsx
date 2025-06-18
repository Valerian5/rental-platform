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
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
]

const DAYS_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]

const formatTimeString = (timeStr: string): string => {
  if (!timeStr) return "00:00"
  if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeStr)) return timeStr
  if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(timeStr)) return timeStr.substring(0, 5)
  return "00:00"
}

const formatDateForDisplay = (dateStr: string): string => {
  try {
    const [year, month, day] = dateStr.split("-").map(Number)
    const date = new Date(year, month - 1, day)
    if (isNaN(date.getTime())) return "Date invalide"
    return date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
  } catch {
    return "Date invalide"
  }
}

export function VisitScheduler({ visitSlots, onSlotsChange, mode, propertyId }: VisitSchedulerProps) {
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

  // Chargement initial : fetch une seule fois puis setHasInitialLoad(true) même si la liste est vide
  useEffect(() => {
    let cancelled = false
    async function fetchSlots() {
      if (mode === "management" && propertyId && !hasInitialLoad) {
        setIsLoading(true)
        loadingRef.current = true
        try {
          const headers = await getAuthHeaders()
          const response = await fetch(`/api/properties/${propertyId}/visit-slots`, { headers })
          if (cancelled) return
          if (response.ok) {
            const data = await response.json()
            const cleanedSlots = (data.slots || []).map((slot: any) => ({
              ...slot,
              start_time: formatTimeString(slot.start_time),
              end_time: formatTimeString(slot.end_time),
            }))
            onSlotsChange(cleanedSlots)
          } else {
            const errorData = await response.json()
            toast.error(errorData.error || "Erreur lors du chargement des créneaux")
          }
        } catch (error) {
          if (!cancelled) toast.error("Erreur lors du chargement des créneaux")
        } finally {
          if (!cancelled) {
            setIsLoading(false)
            setHasInitialLoad(true)
            loadingRef.current = false
          }
        }
      } else {
        setHasInitialLoad(true)
      }
    }
    fetchSlots()
    return () => { cancelled = true }
    // eslint-disable-next-line
  }, [mode, propertyId, hasInitialLoad, onSlotsChange])

  const saveSlotsToDatabase = async (slots: VisitSlot[]) => {
    if (!propertyId || mode !== "management") return
    setIsSaving(true)
    try {
      const headers = await getAuthHeaders()
      const validatedSlots = slots.map((slot) => ({
        date: slot.date,
        start_time: formatTimeString(slot.start_time),
        end_time: formatTimeString(slot.end_time),
        max_capacity: slot.max_capacity || 1,
        is_group_visit: slot.is_group_visit || false,
        current_bookings: slot.current_bookings || 0,
        is_available: slot.is_available !== false,
      }))
      const response = await fetch(`/api/properties/${propertyId}/visit-slots`, {
        method: "POST",
        headers,
        body: JSON.stringify({ slots: validatedSlots }),
      })
      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || "Créneaux sauvegardés avec succès")
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || `Erreur ${response.status}`)
      }
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde des créneaux")
    } finally {
      setIsSaving(false)
    }
  }

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
      const bookedSlots = visitSlots.filter((slot) => slot.date === dateStr && slot.current_bookings > 0).length
      days.push({
        date: dateStr,
        day: date.getDate(),
        isCurrentMonth,
        isToday,
        isPast,
        hasSlots,
        bookedSlots,
      })
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
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) return slots
      let currentTime = new Date(startTime)
      while (currentTime < endTime) {
        const nextTime = new Date(currentTime.getTime() + duration * 60000)
        if (nextTime <= endTime) {
          const startTimeStr = currentTime.toTimeString().slice(0, 5)
          const endTimeStr = nextTime.toTimeString().slice(0, 5)
          const slotKey = `${startTimeStr}-${endTimeStr}`
          slots.push({
            key: slotKey,
            startTime: startTimeStr,
            endTime: endTimeStr,
            label: `${startTimeStr} - ${endTimeStr}`,
          })
        }
        currentTime = nextTime
      }
    } catch {}
    return slots
  }

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    if (direction === "prev") newDate.setMonth(newDate.getMonth() - 1)
    else newDate.setMonth(newDate.getMonth() + 1)
    setCurrentDate(newDate)
  }

  const selectDate = (dateStr: string) => {
    setSelectedDate(dateStr)
    const existingSlots = visitSlots.filter((slot) => slot.date === dateStr)
    if (existingSlots.length > 0) {
      const firstSlot = existingSlots[0]
      try {
        const startTime = new Date(`2000-01-01T${formatTimeString(firstSlot.start_time)}:00`)
        const endTime = new Date(`2000-01-01T${formatTimeString(firstSlot.end_time)}:00`)
        const duration = (endTime.getTime() - startTime.getTime()) / 60000
        let commonDuration = duration
        if (!DURATION_OPTIONS.some((opt) => opt.value === duration)) {
          commonDuration = 0
          setCustomDuration(duration)
        }
        setDayConfig({
          date: dateStr,
          slotDuration: commonDuration,
          startTime: "08:00",
          endTime: "20:00",
          isGroupVisit: firstSlot.is_group_visit,
          capacity: firstSlot.max_capacity,
          selectedSlots: existingSlots.map(
            (slot) => `${formatTimeString(slot.start_time)}-${formatTimeString(slot.end_time)}`
          ),
        })
      } catch {
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
    setDayConfig((prev) => ({
      ...prev,
      selectedSlots: prev.selectedSlots.includes(slotKey)
        ? prev.selectedSlots.filter((s) => s !== slotKey)
        : [...prev.selectedSlots, slotKey],
    }))
  }

  const applyDayConfiguration = async () => {
    if (!selectedDate || dayConfig.selectedSlots.length === 0) {
      toast.error("Veuillez sélectionner au moins un créneau")
      return
    }
    const otherDaysSlots = visitSlots.filter((slot) => slot.date !== selectedDate)
    const newSlots: VisitSlot[] = dayConfig.selectedSlots.map((slotKey) => {
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
    const allSlots = [...otherDaysSlots, ...newSlots]
    onSlotsChange(allSlots)
    if (mode === "management") {
      await saveSlotsToDatabase(allSlots)
    } else {
      toast.success(`${newSlots.length} créneau(x) configuré(s) pour le ${formatDateForDisplay(selectedDate)}`)
    }
  }

  const clearDaySlots = async () => {
    if (!selectedDate) return
    const otherDaysSlots = visitSlots.filter((slot) => slot.date !== selectedDate)
    onSlotsChange(otherDaysSlots)
    setDayConfig((prev) => ({ ...prev, selectedSlots: [] }))
    if (mode === "management") {
      await saveSlotsToDatabase(otherDaysSlots)
    } else {
      toast.success("Créneaux supprimés pour ce jour")
    }
  }

  const calendarDays = generateCalendarDays()
  const timeSlots = generateTimeSlots(dayConfig)
  const totalSlots = visitSlots.length

  if (isLoading && !hasInitialLoad) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Chargement des créneaux...</p>
        </div>
      </div>
    )
  }

  if (!isLoading && hasInitialLoad && visitSlots.length === 0 && !selectedDate) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Calendar className="h-10 w-10 text-muted-foreground" />
        <p className="text-lg text-muted-foreground">Aucun créneau configuré pour cette propriété.</p>
        <Button onClick={() => selectDate(new Date().toISOString().slice(0, 10))}>
          Ajouter un créneau
        </Button>
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
            <div className="mt-4 text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                <span>Jours avec créneaux configurés</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded"></div>
                <span>Jour sélectionné</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-orange-600 rounded-full"></div>
                </div>
                <span>Créneaux disponibles et réservés</span>
              </div>
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
                {/* Affichage des créneaux existants pour ce jour */}
                {visitSlots.filter((slot) => slot.date === selectedDate).length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Créneaux existants</Label>
                    <div className="space-y-2">
                      {visitSlots
                        .filter((slot) => slot.date === selectedDate)
                        .map((slot, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm">
                              {slot.start_time} - {slot.end_time}
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge variant={slot.current_bookings > 0 ? "default" : "outline"}>
                                {slot.current_bookings}/{slot.max_capacity}
                              </Badge>
                              {slot.is_group_visit && <Badge variant="secondary">Groupe</Badge>}
                              {slot.current_bookings > 0 && <Badge variant="destructive">Réservé</Badge>}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Durée des créneaux */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Durée des créneaux</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {DURATION_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        variant={dayConfig.slotDuration === option.value ? "default" : "outline"}
                        onClick={() => setDayConfig((prev) => ({ ...prev, slotDuration: option.value }))}
                        className="h-10"
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>

                  {dayConfig.slotDuration === 0 && (
                    <div className="flex items-center gap-2">
                      <Label>Durée personnalisée :</Label>
                      <Input
                        type="number"
                        min="5"
                        max="180"
                        value={customDuration}
                        onChange={(e) => setCustomDuration(Number(e.target.value))}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">minutes</span>
                    </div>
                  )}
                </div>

                {/* Amplitude horaire */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Amplitude horaire</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Début</Label>
                      <Input
                        type="time"
                        value={dayConfig.startTime}
                        onChange={(e) => setDayConfig((prev) => ({ ...prev, startTime: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fin</Label>
                      <Input
                        type="time"
                        value={dayConfig.endTime}
                        onChange={(e) => setDayConfig((prev) => ({ ...prev, endTime: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Type de visite */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Type de visite</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={!dayConfig.isGroupVisit ? "default" : "outline"}
                      onClick={() => setDayConfig((prev) => ({ ...prev, isGroupVisit: false, capacity: 1 }))}
                    >
                      Individuelle
                    </Button>
                    <Button
                      variant={dayConfig.isGroupVisit ? "default" : "outline"}
                      onClick={() => setDayConfig((prev) => ({ ...prev, isGroupVisit: true }))}
                    >
                      Groupée
                    </Button>
                  </div>
                </div>

                {/* Capacité */}
                {dayConfig.isGroupVisit && (
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Capacité par visite</Label>
                    <div className="flex items-center justify-center gap-4 p-4 border rounded-lg">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDayConfig((prev) => ({ ...prev, capacity: Math.max(1, prev.capacity - 1) }))}
                        disabled={dayConfig.capacity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-medium">{dayConfig.capacity}</span>
                        <span className="text-sm text-muted-foreground">
                          {dayConfig.capacity === 1 ? "personne" : "personnes"}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDayConfig((prev) => ({ ...prev, capacity: Math.min(10, prev.capacity + 1) }))}
                        disabled={dayConfig.capacity >= 10}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Créneaux */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Créneaux disponibles</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{timeSlots.length} générés</Badge>
                      <Badge variant="default">{dayConfig.selectedSlots.length} sélectionnés</Badge>
                    </div>
                  </div>

                  {timeSlots.length > 0 ? (
                    <div className="border rounded-lg p-3 max-h-80 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-2">
                        {timeSlots.map((slot) => {
                          const isSelected = dayConfig.selectedSlots.includes(slot.key)
                          return (
                            <div
                              key={slot.key}
                              className={`
                                flex items-center justify-between p-2 rounded border cursor-pointer transition-colors
                                ${
                                  isSelected
                                    ? "bg-blue-100 border-blue-300 text-blue-800"
                                    : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                                }
                              `}
                              onClick={() => toggleSlot(slot.key)}
                            >
                              <span className="text-sm font-medium">{slot.label}</span>
                              {isSelected && <CheckCircle className="h-4 w-4 text-blue-600" />}
                            </div>
                          )
                        })}
                      </div>

                      <div className="mt-3 pt-3 border-t flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setDayConfig((prev) => ({
                              ...prev,
                              selectedSlots: timeSlots.map((slot) => slot.key),
                            }))
                          }
                        >
                          Tout sélectionner
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDayConfig((prev) => ({ ...prev, selectedSlots: [] }))}
                        >
                          Tout désélectionner
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground border rounded-lg">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Configurez la durée et l'amplitude pour générer les créneaux</p>
                    </div>
                  )}
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
                <p>Sélectionnez un jour dans le calendrier pour configurer les créneaux de visite</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Résumé */}
      {totalSlots > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Résumé de la configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{totalSlots}</div>
                <div className="text-sm text-muted-foreground">Créneaux total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {visitSlots.filter((slot) => slot.is_available && slot.current_bookings < slot.max_capacity).length}
                </div>
                <div className="text-sm text-muted-foreground">Disponibles</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {visitSlots.filter((slot) => slot.current_bookings > 0).length}
                </div>
                <div className="text-sm text-muted-foreground">Réservés</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {new Set(visitSlots.map((slot) => slot.date)).size}
                </div>
                <div className="text-sm text-muted-foreground">Jours configurés</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}