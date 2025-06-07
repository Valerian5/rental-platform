"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, MapPin, User, CheckCircle, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { authService } from "@/lib/auth-service"

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

interface Application {
  id: string
  status: string
  property: {
    id: string
    title: string
    address: string
    city: string
    price: number
    property_images: Array<{ id: string; url: string; is_primary: boolean }>
  }
  owner: {
    first_name: string
    last_name: string
  }
}

// Composant calendrier intégré pour éviter les problèmes d'import
function TenantVisitSlotCalendar({
  visitSlots,
  selectedSlot,
  onSlotSelected,
}: {
  visitSlots: VisitSlot[]
  selectedSlot: string
  onSlotSelected: (slotId: string) => void
}) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  console.log("📅 Composant calendrier chargé avec", visitSlots.length, "créneaux")

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
    console.log("📅 Date sélectionnée:", dateStr)
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calendrier */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Dates disponibles
            </h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                ←
              </Button>
              <span className="font-medium min-w-[120px] text-center">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                →
              </Button>
            </div>
          </div>

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
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {selectedDate ? `Créneaux du ${formatDateForDisplay(selectedDate)}` : "Sélectionnez une date"}
          </h3>

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
                    onClick={() => {
                      console.log("🎯 Créneau sélectionné:", slot.id)
                      onSlotSelected(slot.id)
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
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
                          <span>Visite groupée</span>
                          <Badge variant="secondary" className="ml-2">
                            {slot.max_capacity - slot.current_bookings} place(s) disponible(s)
                          </Badge>
                        </div>
                      ) : (
                        <span>Visite individuelle</span>
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
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
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

export default function SelectVisitSlotPage() {
  const params = useParams()
  const router = useRouter()
  const applicationId = params.id as string

  const [application, setApplication] = useState<Application | null>(null)
  const [availableSlots, setAvailableSlots] = useState<VisitSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)

  console.log("🚀 Page de sélection chargée pour candidature:", applicationId)

  useEffect(() => {
    loadApplicationAndSlots()
  }, [applicationId])

  const loadApplicationAndSlots = async () => {
    try {
      setLoading(true)
      console.log("📥 Chargement des données...")

      // Vérifier l'authentification
      const user = await authService.getCurrentUser()
      if (!user || user.user_type !== "tenant") {
        toast.error("Vous devez être connecté en tant que locataire")
        router.push("/login")
        return
      }

      // Charger les détails de la candidature
      const appResponse = await fetch(`/api/applications/${applicationId}`, {
        headers: { "Content-Type": "application/json" },
      })

      if (!appResponse.ok) {
        throw new Error("Candidature introuvable")
      }

      const appData = await appResponse.json()
      console.log("📋 Candidature chargée:", appData.application.status)

      if (appData.application.status !== "visit_proposed") {
        toast.error("Cette candidature n'est pas au stade de sélection de créneaux")
        router.push("/tenant/applications")
        return
      }

      setApplication(appData.application)

      // Charger les créneaux disponibles
      const slotsResponse = await fetch(`/api/applications/${applicationId}/available-slots`, {
        headers: { "Content-Type": "application/json" },
      })

      if (slotsResponse.ok) {
        const slotsData = await slotsResponse.json()
        console.log("🎯 Créneaux chargés:", slotsData.slots?.length || 0)
        setAvailableSlots(slotsData.slots || [])
      } else {
        throw new Error("Erreur lors du chargement des créneaux")
      }
    } catch (error) {
      console.error("❌ Erreur chargement:", error)
      toast.error("Erreur lors du chargement")
      router.push("/tenant/applications")
    } finally {
      setLoading(false)
    }
  }

  const handleSlotSelected = (slotId: string) => {
    console.log("✅ Créneau sélectionné:", slotId)
    setSelectedSlot(slotId)
  }

  const handleConfirmSlot = async () => {
    if (!selectedSlot) {
      toast.error("Veuillez sélectionner un créneau")
      return
    }

    try {
      setConfirming(true)
      console.log("📤 Confirmation du créneau:", selectedSlot)

      const response = await fetch(`/api/applications/${applicationId}/choose-visit-slot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot_id: selectedSlot }),
      })

      if (response.ok) {
        toast.success("Créneau de visite confirmé !")
        router.push("/tenant/applications")
      } else {
        const errorData = await response.json()
        console.error("❌ Erreur API:", errorData)
        throw new Error(errorData.error || "Erreur lors de la confirmation")
      }
    } catch (error) {
      console.error("❌ Erreur confirmation:", error)
      toast.error("Erreur lors de la confirmation du créneau")
    } finally {
      setConfirming(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Chargement des créneaux disponibles...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">Candidature introuvable</h3>
          <Button onClick={() => router.push("/tenant/applications")}>Retour à mes candidatures</Button>
        </div>
      </div>
    )
  }

  const primaryImage =
    application.property.property_images?.find((img) => img.is_primary) || application.property.property_images?.[0]

  return (
    <div className="container mx-auto py-6">
      {/* Debug info */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm">
        <p>
          <strong>🔍 Debug:</strong> Candidature {applicationId}
        </p>
        <p>
          <strong>📊 Statut:</strong> {application.status}
        </p>
        <p>
          <strong>🎯 Créneaux:</strong> {availableSlots.length}
        </p>
        <p>
          <strong>✅ Sélectionné:</strong> {selectedSlot || "Aucun"}
        </p>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => router.push("/tenant/applications")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Choisir un créneau de visite</h1>
          <p className="text-muted-foreground">Sélectionnez le créneau qui vous convient le mieux</p>
        </div>
      </div>

      {/* Informations du bien */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="w-32 h-24 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={primaryImage?.url || "/placeholder.svg?height=96&width=128&text=Pas d'image"}
                alt={application.property.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg?height=96&width=128&text=Image non disponible"
                }}
              />
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-xl mb-2">{application.property.title}</h3>
              <div className="flex items-center text-muted-foreground mb-2">
                <MapPin className="h-4 w-4 mr-1" />
                <span>
                  {application.property.address}, {application.property.city}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Propriétaire : {application.owner.first_name} {application.owner.last_name}
                  </span>
                </div>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {application.property.price} €/mois
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendrier de sélection */}
      <TenantVisitSlotCalendar
        visitSlots={availableSlots}
        selectedSlot={selectedSlot}
        onSlotSelected={handleSlotSelected}
      />

      {/* Bouton de confirmation */}
      {availableSlots.length > 0 && (
        <div className="mt-6 flex justify-center">
          <Button
            onClick={handleConfirmSlot}
            disabled={!selectedSlot || confirming}
            size="lg"
            className="min-w-[250px]"
          >
            {confirming ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Confirmation en cours...
              </>
            ) : selectedSlot ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmer ce créneau
              </>
            ) : (
              "Sélectionnez un créneau"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
