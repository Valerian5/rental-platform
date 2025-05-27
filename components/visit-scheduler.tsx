"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Settings, Copy, Trash2, Plus, ChevronLeft, ChevronRight, Check, Save, RefreshCw } from "lucide-react"
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

interface DayConfig {
  enabled: boolean
  periods: Array<{
    start: string
    end: string
    enabled: boolean
  }>
}

interface GlobalSettings {
  slotDuration: number
  defaultCapacity: number
  allowGroupVisits: boolean
  daysConfig: {
    [key: number]: DayConfig // 0=dimanche, 1=lundi, etc.
  }
  calendarRange: number // nombre de jours à afficher
}

interface VisitSchedulerProps {
  visitSlots: VisitSlot[]
  onSlotsChange: (slots: VisitSlot[]) => void
  mode: "creation" | "management"
  propertyId?: string
}

const DAYS_OF_WEEK = [
  { value: 1, label: "Lundi", short: "Lun" },
  { value: 2, label: "Mardi", short: "Mar" },
  { value: 3, label: "Mercredi", short: "Mer" },
  { value: 4, label: "Jeudi", short: "Jeu" },
  { value: 5, label: "Vendredi", short: "Ven" },
  { value: 6, label: "Samedi", short: "Sam" },
  { value: 0, label: "Dimanche", short: "Dim" },
]

const DEFAULT_PERIODS = [
  { start: "09:00", end: "12:00", enabled: true },
  { start: "14:00", end: "18:00", enabled: true },
]

export function VisitScheduler({ visitSlots, onSlotsChange, mode, propertyId }: VisitSchedulerProps) {
  const [settings, setSettings] = useState<GlobalSettings>({
    slotDuration: 30,
    defaultCapacity: 1,
    allowGroupVisits: false,
    calendarRange: 15,
    daysConfig: {
      1: { enabled: true, periods: [...DEFAULT_PERIODS] },
      2: { enabled: true, periods: [...DEFAULT_PERIODS] },
      3: { enabled: true, periods: [...DEFAULT_PERIODS] },
      4: { enabled: true, periods: [...DEFAULT_PERIODS] },
      5: { enabled: true, periods: [...DEFAULT_PERIODS] },
      6: { enabled: true, periods: [{ start: "10:00", end: "17:00", enabled: true }] },
      0: { enabled: false, periods: [] },
    },
  })

  const [calendarDays, setCalendarDays] = useState<
    Array<{
      date: string
      dayName: string
      dayNumber: number
      monthName: string
      dayOfWeek: number
      slots: VisitSlot[]
      isToday: boolean
      isPast: boolean
    }>
  >([])

  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set())
  const [calendarStartDate, setCalendarStartDate] = useState(new Date())
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set())
  const [showDaySelector, setShowDaySelector] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoadedInitialSlots, setHasLoadedInitialSlots] = useState(false)

  // Charger les créneaux depuis la base de données
  useEffect(() => {
    if (mode === "management" && propertyId && !hasLoadedInitialSlots && !isLoading) {
      setHasLoadedInitialSlots(true)
      loadSlotsFromDatabase()
    }
  }, [mode, propertyId, hasLoadedInitialSlots, isLoading])

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
    if (!propertyId || mode !== "management") {
      console.log("⚠️ Pas de sauvegarde - mode création ou pas de propertyId")
      return
    }

    setIsSaving(true)
    try {
      console.log("💾 Sauvegarde des créneaux en DB...", slots.length)
      console.log("📋 Exemple de créneau à sauvegarder:", slots[0])

      // Valider les créneaux avant envoi
      const validatedSlots = slots.map((slot, index) => {
        if (!slot.date || !slot.start_time || !slot.end_time) {
          throw new Error(`Créneau ${index + 1}: données manquantes`)
        }

        return {
          date: slot.date,
          start_time: slot.start_time,
          end_time: slot.end_time,
          max_capacity: slot.max_capacity || 1,
          is_group_visit: slot.is_group_visit || false,
          current_bookings: slot.current_bookings || 0,
          is_available: slot.is_available !== false,
        }
      })

      const response = await fetch(`/api/properties/${propertyId}/visit-slots`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slots: validatedSlots }),
      })

      const responseText = await response.text()
      console.log("📋 Réponse brute du serveur:", responseText)

      if (response.ok) {
        const data = JSON.parse(responseText)
        console.log("✅ Créneaux sauvegardés:", data.message)
        toast.success(data.message || "Créneaux sauvegardés avec succès")

        // Recharger les créneaux pour avoir les IDs
        setTimeout(() => {
          loadSlotsFromDatabase()
        }, 500)
      } else {
        let errorData
        try {
          errorData = JSON.parse(responseText)
        } catch {
          errorData = { error: `Erreur HTTP ${response.status}: ${responseText}` }
        }

        console.error("❌ Erreur sauvegarde:", errorData)
        toast.error(errorData.error || `Erreur ${response.status}`)
      }
    } catch (error) {
      console.error("❌ Erreur sauvegarde créneaux:", error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de la sauvegarde des créneaux")
    } finally {
      setIsSaving(false)
    }
  }

  // Générer les jours du calendrier
  useEffect(() => {
    const days = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < settings.calendarRange; i++) {
      const date = new Date(calendarStartDate)
      date.setDate(calendarStartDate.getDate() + i)
      const dateStr = date.toISOString().split("T")[0]

      const dayName = date.toLocaleDateString("fr-FR", { weekday: "short" })
      const dayNumber = date.getDate()
      const monthName = date.toLocaleDateString("fr-FR", { month: "short" })
      const dayOfWeek = date.getDay()

      const daySlots = visitSlots.filter((slot) => slot.date === dateStr)
      const isToday = date.getTime() === today.getTime()
      const isPast = date < today

      days.push({
        date: dateStr,
        dayName,
        dayNumber,
        monthName,
        dayOfWeek,
        slots: daySlots,
        isToday,
        isPast,
      })
    }

    setCalendarDays(days)
  }, [visitSlots, settings.calendarRange, calendarStartDate])

  // Générer les créneaux pour un jour donné
  const generateSlotsForDay = (date: string, dayOfWeek: number): VisitSlot[] => {
    const dayConfig = settings.daysConfig[dayOfWeek]
    if (!dayConfig?.enabled) return []

    const slots: VisitSlot[] = []

    dayConfig.periods.forEach((period) => {
      if (!period.enabled) return

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
            is_available: true,
          })
        }

        currentTime = nextTime
      }
    })

    return slots
  }

  // Générer tous les créneaux selon la configuration
  const generateAllSlots = async () => {
    const allSlots: VisitSlot[] = []

    calendarDays.forEach((day) => {
      if (!day.isPast) {
        const daySlots = generateSlotsForDay(day.date, day.dayOfWeek)
        allSlots.push(...daySlots)
      }
    })

    onSlotsChange(allSlots)
    setSelectedSlots(new Set())

    // Sauvegarder automatiquement en mode gestion
    if (mode === "management") {
      await saveSlotsToDatabase(allSlots)
    } else {
      toast.success(`${allSlots.length} créneaux générés selon votre configuration`)
    }
  }

  // Basculer la sélection d'un créneau
  const toggleSlotSelection = (slotId: string) => {
    const newSelected = new Set(selectedSlots)
    if (newSelected.has(slotId)) {
      newSelected.delete(slotId)
    } else {
      newSelected.add(slotId)
    }
    setSelectedSlots(newSelected)
  }

  // Supprimer les créneaux sélectionnés
  const removeSelectedSlots = async () => {
    const newSlots = visitSlots.filter((slot) => {
      const slotId = slot.id || `${slot.date}-${slot.start_time}`
      return !selectedSlots.has(slotId)
    })

    onSlotsChange(newSlots)
    setSelectedSlots(new Set())

    // Sauvegarder automatiquement en mode gestion
    if (mode === "management") {
      await saveSlotsToDatabase(newSlots)
    } else {
      toast.success(`${selectedSlots.size} créneaux supprimés`)
    }
  }

  // Dupliquer la configuration d'un jour
  const duplicateDayConfig = (sourceDayOfWeek: number, targetDaysOfWeek: number[]) => {
    const sourceConfig = settings.daysConfig[sourceDayOfWeek]
    if (!sourceConfig) return

    const newDaysConfig = { ...settings.daysConfig }
    targetDaysOfWeek.forEach((dayOfWeek) => {
      newDaysConfig[dayOfWeek] = {
        enabled: sourceConfig.enabled,
        periods: sourceConfig.periods.map((p) => ({ ...p })),
      }
    })

    setSettings((prev) => ({ ...prev, daysConfig: newDaysConfig }))
    toast.success("Configuration dupliquée")
  }

  // Navigation du calendrier
  const navigateCalendar = (direction: "prev" | "next") => {
    const newDate = new Date(calendarStartDate)
    const days = direction === "next" ? 7 : -7
    newDate.setDate(newDate.getDate() + days)
    setCalendarStartDate(newDate)
  }

  // Mettre à jour la configuration d'un jour
  const updateDayConfig = (dayOfWeek: number, config: Partial<DayConfig>) => {
    setSettings((prev) => ({
      ...prev,
      daysConfig: {
        ...prev.daysConfig,
        [dayOfWeek]: {
          ...prev.daysConfig[dayOfWeek],
          ...config,
        },
      },
    }))
  }

  // Ajouter une période à un jour
  const addPeriodToDay = (dayOfWeek: number) => {
    const dayConfig = settings.daysConfig[dayOfWeek]
    const newPeriod = { start: "09:00", end: "10:00", enabled: true }

    updateDayConfig(dayOfWeek, {
      periods: [...dayConfig.periods, newPeriod],
    })
  }

  // Supprimer une période d'un jour
  const removePeriodFromDay = (dayOfWeek: number, periodIndex: number) => {
    const dayConfig = settings.daysConfig[dayOfWeek]
    const newPeriods = dayConfig.periods.filter((_, index) => index !== periodIndex)

    updateDayConfig(dayOfWeek, { periods: newPeriods })
  }

  // Mettre à jour une période
  const updatePeriod = (dayOfWeek: number, periodIndex: number, updates: Partial<(typeof DEFAULT_PERIODS)[0]>) => {
    const dayConfig = settings.daysConfig[dayOfWeek]
    const newPeriods = dayConfig.periods.map((period, index) =>
      index === periodIndex ? { ...period, ...updates } : period,
    )

    updateDayConfig(dayOfWeek, { periods: newPeriods })
  }

  // Ajouter un créneau individuel
  const addIndividualSlot = async (date: string, dayOfWeek: number) => {
    const dayConfig = settings.daysConfig[dayOfWeek]
    if (!dayConfig?.enabled) {
      toast.error("Ce jour n'est pas configuré pour les visites")
      return
    }

    // Trouver le prochain créneau disponible
    const existingSlots = visitSlots.filter((slot) => slot.date === date)
    let startTime = "09:00"

    if (dayConfig.periods.length > 0) {
      startTime = dayConfig.periods[0].start
    }

    // Si il y a déjà des créneaux, prendre le suivant
    if (existingSlots.length > 0) {
      const lastSlot = existingSlots.sort((a, b) => a.start_time.localeCompare(b.start_time)).pop()
      if (lastSlot) {
        const lastEndTime = new Date(`2000-01-01T${lastSlot.end_time}:00`)
        const nextStartTime = new Date(lastEndTime.getTime() + settings.slotDuration * 60000)
        startTime = nextStartTime.toTimeString().slice(0, 5)
      }
    }

    const endTime = new Date(`2000-01-01T${startTime}:00`)
    endTime.setMinutes(endTime.getMinutes() + settings.slotDuration)

    const newSlot: VisitSlot = {
      date,
      start_time: startTime,
      end_time: endTime.toTimeString().slice(0, 5),
      max_capacity: settings.defaultCapacity,
      is_group_visit: settings.allowGroupVisits,
      current_bookings: 0,
      is_available: true,
    }

    const newSlots = [...visitSlots, newSlot]
    onSlotsChange(newSlots)

    // Sauvegarder automatiquement en mode gestion
    if (mode === "management") {
      await saveSlotsToDatabase(newSlots)
    } else {
      toast.success("Créneau ajouté")
    }
  }

  // Supprimer un créneau individuel
  const removeIndividualSlot = async (slotId: string) => {
    const newSlots = visitSlots.filter((slot) => {
      const id = slot.id || `${slot.date}-${slot.start_time}`
      return id !== slotId
    })

    onSlotsChange(newSlots)

    // Sauvegarder automatiquement en mode gestion
    if (mode === "management") {
      await saveSlotsToDatabase(newSlots)
    } else {
      toast.success("Créneau supprimé")
    }
  }

  const totalSlots = visitSlots.length
  const selectedCount = selectedSlots.size
  const availableSlots = visitSlots.filter((slot) => slot.is_available).length

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
      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendar">📅 Calendrier</TabsTrigger>
          <TabsTrigger value="settings">⚙️ Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          {/* En-tête du calendrier */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Créneaux de visite
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Cliquez sur les créneaux pour les sélectionner/désélectionner
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigateCalendar("prev")}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigateCalendar("next")}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  {mode === "management" && (
                    <Button variant="outline" size="sm" onClick={loadSlotsFromDatabase} disabled={isLoading}>
                      <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{totalSlots} créneaux</Badge>
                  <Badge variant="outline">{availableSlots} disponibles</Badge>
                  {selectedCount > 0 && <Badge variant="destructive">{selectedCount} sélectionnés</Badge>}
                  {selectedDays.size > 0 && <Badge variant="default">{selectedDays.size} jours sélectionnés</Badge>}
                </div>

                <div className="flex gap-2 ml-auto">
                  <Button variant="outline" size="sm" onClick={() => setShowDaySelector(!showDaySelector)}>
                    📅 Sélectionner des jours
                  </Button>
                  {selectedCount > 0 && (
                    <Button variant="destructive" size="sm" onClick={removeSelectedSlots} disabled={isSaving}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Supprimer ({selectedCount})
                    </Button>
                  )}
                  <Button onClick={generateAllSlots} size="sm" disabled={isSaving}>
                    <Plus className="h-4 w-4 mr-1" />
                    Générer créneaux
                  </Button>
                  {mode === "management" && totalSlots > 0 && (
                    <Button onClick={() => saveSlotsToDatabase(visitSlots)} size="sm" disabled={isSaving}>
                      {isSaving ? (
                        <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-1" />
                      )}
                      Sauvegarder
                    </Button>
                  )}
                </div>
              </div>

              {/* Sélecteur de jours */}
              {showDaySelector && (
                <div className="mt-4 p-4 border rounded-lg bg-muted/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Sélectionner des jours spécifiques</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const allDates = new Set(calendarDays.filter((d) => !d.isPast).map((d) => d.date))
                          setSelectedDays(allDates)
                        }}
                      >
                        Tout sélectionner
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setSelectedDays(new Set())}>
                        Tout désélectionner
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day) => {
                      const isSelected = selectedDays.has(day.date)
                      const dayConfig = settings.daysConfig[day.dayOfWeek]
                      const isConfigured = dayConfig?.enabled

                      return (
                        <Button
                          key={day.date}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className={`h-16 flex flex-col items-center justify-center ${
                            day.isPast ? "opacity-50 cursor-not-allowed" : ""
                          } ${!isConfigured ? "border-dashed" : ""}`}
                          onClick={() => {
                            if (day.isPast) return
                            const newSelected = new Set(selectedDays)
                            if (newSelected.has(day.date)) {
                              newSelected.delete(day.date)
                            } else {
                              newSelected.add(day.date)
                            }
                            setSelectedDays(newSelected)
                          }}
                          disabled={day.isPast}
                        >
                          <div className="text-xs text-muted-foreground">{day.monthName}</div>
                          <div className="text-xs font-medium">{day.dayName}</div>
                          <div className="text-sm font-bold">{day.dayNumber}</div>
                          {!isConfigured && <div className="text-xs">Non config.</div>}
                        </Button>
                      )
                    })}
                  </div>

                  {selectedDays.size > 0 && (
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        onClick={async () => {
                          const allSlots: VisitSlot[] = []
                          selectedDays.forEach((date) => {
                            const day = calendarDays.find((d) => d.date === date)
                            if (day && !day.isPast) {
                              const daySlots = generateSlotsForDay(day.date, day.dayOfWeek)
                              allSlots.push(...daySlots)
                            }
                          })
                          const newSlots = [...visitSlots, ...allSlots]
                          onSlotsChange(newSlots)
                          setSelectedDays(new Set())
                          setShowDaySelector(false)

                          if (mode === "management") {
                            await saveSlotsToDatabase(newSlots)
                          } else {
                            toast.success(`${allSlots.length} créneaux ajoutés pour ${selectedDays.size} jours`)
                          }
                        }}
                        size="sm"
                        disabled={isSaving}
                      >
                        ✅ Générer créneaux pour les jours sélectionnés ({selectedDays.size})
                      </Button>
                      <Button variant="outline" onClick={() => setShowDaySelector(false)} size="sm">
                        Annuler
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardHeader>
          </Card>

          {/* Grille du calendrier */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {calendarDays.map((day) => {
                  const dayConfig = settings.daysConfig[day.dayOfWeek]
                  const isEnabled = dayConfig?.enabled && !day.isPast

                  return (
                    <div key={day.date} className={`space-y-2 ${day.isPast ? "opacity-50" : ""}`}>
                      {/* En-tête du jour */}
                      <div className="text-center p-2 border rounded-lg bg-muted/50 relative">
                        <div className="text-xs text-muted-foreground">{day.monthName}</div>
                        <div className="font-medium">
                          {day.dayName} {day.dayNumber}
                        </div>
                        {day.isToday && (
                          <Badge variant="default" className="text-xs mt-1">
                            Aujourd'hui
                          </Badge>
                        )}

                        {/* Bouton d'ajout de créneau individuel */}
                        {isEnabled && !day.isPast && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 bg-blue-600 text-white hover:bg-blue-700"
                            onClick={() => addIndividualSlot(day.date, day.dayOfWeek)}
                            disabled={isSaving}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        )}
                      </div>

                      {/* Créneaux du jour */}
                      <div className="space-y-1">
                        {isEnabled ? (
                          day.slots.length > 0 ? (
                            day.slots.map((slot) => {
                              const slotId = slot.id || `${slot.date}-${slot.start_time}`
                              const isSelected = selectedSlots.has(slotId)
                              const isBooked = slot.current_bookings > 0

                              return (
                                <div key={slotId} className="flex items-center gap-1">
                                  <Button
                                    variant={isSelected ? "default" : "outline"}
                                    size="sm"
                                    className={`flex-1 h-8 text-xs justify-between ${
                                      isBooked ? "bg-orange-100 border-orange-300 text-orange-800" : ""
                                    } ${isSelected ? "bg-blue-600 text-white" : ""}`}
                                    onClick={() => toggleSlotSelection(slotId)}
                                    disabled={day.isPast}
                                  >
                                    <span>{slot.start_time}</span>
                                    {isBooked && (
                                      <Badge variant="secondary" className="text-xs">
                                        {slot.current_bookings}/{slot.max_capacity}
                                      </Badge>
                                    )}
                                    {isSelected && <Check className="h-3 w-3" />}
                                  </Button>

                                  {/* Bouton de suppression individuelle */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => removeIndividualSlot(slotId)}
                                    disabled={isSaving}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )
                            })
                          ) : (
                            <div className="text-center py-4 text-muted-foreground text-xs">
                              Aucun créneau
                              <br />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs mt-1 h-6"
                                onClick={() => addIndividualSlot(day.date, day.dayOfWeek)}
                                disabled={isSaving}
                              >
                                + Ajouter
                              </Button>
                            </div>
                          )
                        ) : (
                          <div className="text-center py-4 text-muted-foreground text-xs">Jour désactivé</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {/* Paramètres globaux */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Paramètres globaux
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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
                  <Label>Jours à afficher</Label>
                  <Select
                    value={settings.calendarRange.toString()}
                    onValueChange={(value) =>
                      setSettings((prev) => ({ ...prev, calendarRange: Number.parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 jours</SelectItem>
                      <SelectItem value="14">14 jours</SelectItem>
                      <SelectItem value="21">21 jours</SelectItem>
                      <SelectItem value="30">30 jours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.allowGroupVisits}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, allowGroupVisits: checked }))}
                />
                <Label>Autoriser les visites groupées</Label>
              </div>
            </CardContent>
          </Card>

          {/* Configuration par jour */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration par jour de la semaine</CardTitle>
              <p className="text-sm text-muted-foreground">
                Définissez les horaires disponibles pour chaque jour de la semaine
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {DAYS_OF_WEEK.map((day) => {
                const dayConfig = settings.daysConfig[day.value]

                return (
                  <div key={day.value} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Switch
                          checked={dayConfig.enabled}
                          onCheckedChange={(enabled) => updateDayConfig(day.value, { enabled })}
                        />
                        <Label className="font-medium">{day.label}</Label>
                      </div>

                      {dayConfig.enabled && (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => addPeriodToDay(day.value)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const targetDays = DAYS_OF_WEEK.filter((d) => d.value !== day.value).map((d) => d.value)
                              duplicateDayConfig(day.value, targetDays)
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {dayConfig.enabled && (
                      <div className="space-y-2 ml-6">
                        {dayConfig.periods.map((period, periodIndex) => (
                          <div key={periodIndex} className="flex items-center gap-2">
                            <Switch
                              checked={period.enabled}
                              onCheckedChange={(enabled) => updatePeriod(day.value, periodIndex, { enabled })}
                            />
                            <Input
                              type="time"
                              value={period.start}
                              onChange={(e) => updatePeriod(day.value, periodIndex, { start: e.target.value })}
                              className="w-24"
                              disabled={!period.enabled}
                            />
                            <span className="text-muted-foreground">à</span>
                            <Input
                              type="time"
                              value={period.end}
                              onChange={(e) => updatePeriod(day.value, periodIndex, { end: e.target.value })}
                              className="w-24"
                              disabled={!period.enabled}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removePeriodFromDay(day.value, periodIndex)}
                              disabled={dayConfig.periods.length <= 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
                <div className="text-2xl font-bold text-green-600">{availableSlots}</div>
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
                  {Object.values(settings.daysConfig).filter((config) => config.enabled).length}
                </div>
                <div className="text-sm text-muted-foreground">Jours actifs</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
