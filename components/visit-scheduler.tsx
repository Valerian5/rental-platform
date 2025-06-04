"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronLeft, ChevronRight, Plus, Minus, Save, RefreshCw, CheckCircle, Clock } from "lucide-react"
import { toast } from "sonner"

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
  slotDuration: number // en minutes
  startTime: string // format HH:MM
  endTime: string // format HH:MM
  isGroupVisit: boolean
  capacity: number
  selectedSlots: string[] // array des créneaux sélectionnés
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
  const [hasLoadedInitialSlots, setHasLoadedInitialSlots] = useState(false)

  // Charger les créneaux depuis la base de données
  useEffect(() => {
    if (mode === "management" && propertyId && !hasLoadedInitialSlots) {
      setHasLoadedInitialSlots(true)
      loadSlotsFromDatabase()
    }
  }, [mode, propertyId, hasLoadedInitialSlots])

  const loadSlotsFromDatabase = async () => {
    if (!propertyId || isLoading) return

    setIsLoading(true)
    try {
      console.log("🔄 Chargement des créneaux depuis la DB...")
      const response = await fetch(`/api/properties/${propertyId}/visit-slots`)

      if (response.ok) {
        const data = await response.json()
        console.log("✅ Créneaux chargés:", data.slots?.length || 0)

        // Seulement mettre à jour si les données ont changé
        if (JSON.stringify(data.slots) !== JSON.stringify(visitSlots)) {
          onSlotsChange(data.slots || [])
        }
      } else {
        console.error("❌ Erreur chargement créneaux:", response.status)
        toast.error("Erreur lors du chargement des créneaux")
      }
    } catch (error) {
      console.error("❌ Erreur chargement créneaux:", error)
      toast.error("Erreur lors du chargement des créneaux")
    } finally {
      setIsLoading(false)
    }
  }

  // Sauvegarder les créneaux en base de données
  const saveSlotsToDatabase = async (slots: VisitSlot[]) => {
    if (!propertyId || mode !== "management") return

    setIsSaving(true)
    try {
      console.log("💾 Sauvegarde des créneaux en DB...", slots.length)

      const validatedSlots = slots.map((slot) => ({
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        max_capacity: slot.max_capacity || 1,
        is_group_visit: slot.is_group_visit || false,
        current_bookings: slot.current_bookings || 0,
        is_available: slot.is_available !== false,
      }))

      const response = await fetch(`/api/properties/${propertyId}/visit-slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots: validatedSlots }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("✅ Créneaux sauvegardés:", data.message)
        toast.success(data.message || "Créneaux sauvegardés avec succès")
        setTimeout(() => loadSlotsFromDatabase(), 500)
      } else {
        const errorData = await response.json()
        console.error("❌ Erreur sauvegarde:", errorData)
        toast.error(errorData.error || `Erreur ${response.status}`)
      }
    } catch (error) {
      console.error("❌ Erreur sauvegarde créneaux:", error)
      toast.error("Erreur lors de la sauvegarde des créneaux")
    } finally {
      setIsSaving(false)
    }
  }

  // Générer les jours du calendrier
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)

    // Commencer au lundi précédent
    const dayOfWeek = firstDay.getDay()
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    startDate.setDate(firstDay.getDate() - daysToSubtract)

    const days = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)

      const dateStr = date.toISOString().split("T")[0]
      const isCurrentMonth = date.getMonth() === month
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

  // Générer les créneaux pour une configuration donnée
  const generateTimeSlots = (config: DayConfiguration) => {
    const slots = []
    const duration = config.slotDuration === 0 ? customDuration : config.slotDuration

    const startTime = new Date(`2000-01-01T${config.startTime}:00`)
    const endTime = new Date(`2000-01-01T${config.endTime}:00`)
    let currentTime = new Date(startTime)

    while (currentTime < endTime) {
      const nextTime = new Date(currentTime.getTime() + duration * 60000)

      if (nextTime <= endTime) {
        const slotKey = `${currentTime.toTimeString().slice(0, 5)}-${nextTime.toTimeString().slice(0, 5)}`
        slots.push({
          key: slotKey,
          startTime: currentTime.toTimeString().slice(0, 5),
          endTime: nextTime.toTimeString().slice(0, 5),
          label: `${currentTime.toTimeString().slice(0, 5)} - ${nextTime.toTimeString().slice(0, 5)}`,
        })
      }

      currentTime = nextTime
    }

    return slots
  }

  // Naviguer dans le calendrier
  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  // Sélectionner un jour
  const selectDate = (dateStr: string) => {
    setSelectedDate(dateStr)

    // Charger la configuration existante pour ce jour
    const existingSlots = visitSlots.filter((slot) => slot.date === dateStr)

    if (existingSlots.length > 0) {
      // Calculer la durée en analysant les créneaux existants
      const firstSlot = existingSlots[0]
      const startTime = new Date(`2000-01-01T${firstSlot.start_time}:00`)
      const endTime = new Date(`2000-01-01T${firstSlot.end_time}:00`)
      const duration = (endTime.getTime() - startTime.getTime()) / 60000

      // Trouver l'heure de début et fin globale
      const allStartTimes = existingSlots.map((slot) => slot.start_time).sort()
      const allEndTimes = existingSlots.map((slot) => slot.end_time).sort()

      setDayConfig({
        date: dateStr,
        slotDuration: duration,
        startTime: allStartTimes[0],
        endTime: allEndTimes[allEndTimes.length - 1],
        isGroupVisit: firstSlot.is_group_visit,
        capacity: firstSlot.max_capacity,
        selectedSlots: existingSlots.map((slot) => `${slot.start_time}-${slot.end_time}`),
      })
    } else {
      // Réinitialiser avec les valeurs par défaut mais garder la date
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

  // Basculer la sélection d'un créneau
  const toggleSlot = (slotKey: string) => {
    setDayConfig((prev) => ({
      ...prev,
      selectedSlots: prev.selectedSlots.includes(slotKey)
        ? prev.selectedSlots.filter((s) => s !== slotKey)
        : [...prev.selectedSlots, slotKey],
    }))
  }

  // Appliquer la configuration du jour
  const applyDayConfiguration = async () => {
    if (!selectedDate || dayConfig.selectedSlots.length === 0) {
      toast.error("Veuillez sélectionner au moins un créneau")
      return
    }

    // Supprimer les anciens créneaux pour ce jour
    const otherDaysSlots = visitSlots.filter((slot) => slot.date !== selectedDate)

    // Créer les nouveaux créneaux
    const newSlots: VisitSlot[] = dayConfig.selectedSlots.map((slotKey) => {
      const [startTime, endTime] = slotKey.split("-")
      return {
        date: selectedDate,
        start_time: startTime,
        end_time: endTime,
        max_capacity: dayConfig.capacity,
        is_group_visit: dayConfig.isGroupVisit,
        current_bookings: 0,
        is_available: true,
      }
    })

    const allSlots = [...otherDaysSlots, ...newSlots]
    onSlotsChange(allSlots)

    // Sauvegarder automatiquement en mode gestion
    if (mode === "management") {
      await saveSlotsToDatabase(allSlots)
    } else {
      toast.success(
        `${newSlots.length} créneaux configurés pour le ${new Date(selectedDate).toLocaleDateString("fr-FR")}`,
      )
    }
  }

  // Supprimer tous les créneaux d'un jour
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Chargement des créneaux...</p>
        </div>
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
            {/* En-têtes des jours */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS_SHORT.map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Grille du calendrier */}
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
                <span>Jours avec créneaux configurés</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded"></div>
                <span>Jour sélectionné</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuration du jour */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate
                ? `Configuration du ${new Date(selectedDate).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}`
                : "Sélectionnez un jour"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedDate ? (
              <>
                {/* Durée des créneaux */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    De combien de temps avez-vous besoin pour une visite ?
                  </Label>
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

                {/* Créneaux générés - Vue complète */}
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
                        {timeSlots.map((slot) => (
                          <div
                            key={slot.key}
                            className={`
                              flex items-center justify-between p-2 rounded border cursor-pointer transition-colors
                              ${
                                dayConfig.selectedSlots.includes(slot.key)
                                  ? "bg-blue-100 border-blue-300 text-blue-800"
                                  : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                              }
                            `}
                            onClick={() => toggleSlot(slot.key)}
                          >
                            <span className="text-sm font-medium">{slot.label}</span>
                            {dayConfig.selectedSlots.includes(slot.key) && (
                              <CheckCircle className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                        ))}
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
                  <Label className="text-base font-medium">S'agit-il d'une visite groupée ?</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={!dayConfig.isGroupVisit ? "default" : "outline"}
                      onClick={() => setDayConfig((prev) => ({ ...prev, isGroupVisit: false, capacity: 1 }))}
                    >
                      Non
                    </Button>
                    <Button
                      variant={dayConfig.isGroupVisit ? "default" : "outline"}
                      onClick={() => setDayConfig((prev) => ({ ...prev, isGroupVisit: true }))}
                    >
                      Oui
                    </Button>
                  </div>
                </div>

                {/* Capacité */}
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

                {/* Créneaux générés */}
                {/* <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Sélectionner les créneaux disponibles</Label>
                    <Badge variant="outline">{dayConfig.selectedSlots.length} sélectionnés</Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                    {timeSlots.map((slot) => (
                      <Button
                        key={slot.key}
                        variant={dayConfig.selectedSlots.includes(slot.key) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleSlot(slot.key)}
                        className="text-xs"
                      >
                        {slot.label}
                      </Button>
                    ))}
                  </div>
                </div> */}

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
                  {visitSlots.filter((slot) => slot.is_available).length}
                </div>
                <div className="text-sm text-muted-foreground">Disponibles</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {visitSlots.reduce((sum, slot) => sum + slot.max_capacity, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Capacité totale</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
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
