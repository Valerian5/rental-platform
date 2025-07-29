"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CalendarIcon, Clock, Plus, Trash2, Send } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { format, startOfDay } from "date-fns"
import { fr } from "date-fns/locale"

interface TimeSlot {
  start_time: string
  end_time: string
}

interface DaySlots {
  [key: string]: TimeSlot[]
}

interface Application {
  id: string
  tenant_name: string
  status: string
  property?: {
    title: string
    address: string
  }
}

export default function ProposeVisitPage() {
  const params = useParams()
  const router = useRouter()
  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [daySlots, setDaySlots] = useState<DaySlots>({})
  const [newSlotStart, setNewSlotStart] = useState("")
  const [newSlotEnd, setNewSlotEnd] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/applications/${params.id}`)

        if (!response.ok) {
          throw new Error("Erreur lors du chargement")
        }

        const data = await response.json()
        setApplication(data)
      } catch (error: any) {
        console.error("Erreur chargement candidature:", error)
        toast.error("Erreur lors du chargement de la candidature")
        router.push("/owner/applications")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchApplication()
    }
  }, [params.id, router])

  const addTimeSlot = () => {
    if (!selectedDate || !newSlotStart || !newSlotEnd) {
      toast.error("Veuillez sélectionner une date et des heures")
      return
    }

    if (newSlotStart >= newSlotEnd) {
      toast.error("L'heure de fin doit être après l'heure de début")
      return
    }

    const dateKey = format(selectedDate, "yyyy-MM-dd")
    const startDateTime = `${dateKey}T${newSlotStart}:00`
    const endDateTime = `${dateKey}T${newSlotEnd}:00`

    // Vérifier que le créneau est dans le futur
    const now = new Date()
    if (new Date(startDateTime) <= now) {
      toast.error("Le créneau doit être dans le futur")
      return
    }

    const newSlot: TimeSlot = {
      start_time: startDateTime,
      end_time: endDateTime,
    }

    setDaySlots((prev) => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), newSlot],
    }))

    setNewSlotStart("")
    setNewSlotEnd("")
    toast.success("Créneau ajouté")
  }

  const removeTimeSlot = (dateKey: string, index: number) => {
    setDaySlots((prev) => ({
      ...prev,
      [dateKey]: prev[dateKey]?.filter((_, i) => i !== index) || [],
    }))
    toast.success("Créneau supprimé")
  }

  const clearDay = (dateKey: string) => {
    setDaySlots((prev) => ({
      ...prev,
      [dateKey]: [],
    }))
    toast.success("Journée effacée")
  }

  const getAllSlots = (): TimeSlot[] => {
    const allSlots: TimeSlot[] = []
    const now = new Date()

    Object.values(daySlots).forEach((slots) => {
      slots.forEach((slot) => {
        const slotDate = new Date(slot.start_time)
        if (slotDate > now) {
          allSlots.push(slot)
        }
      })
    })

    return allSlots.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
  }

  const submitSlots = async () => {
    const slots = getAllSlots()

    if (slots.length === 0) {
      toast.error("Veuillez ajouter au moins un créneau futur")
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch(`/api/applications/${params.id}/propose-visit-slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Erreur lors de la proposition")
      }

      const result = await response.json()
      toast.success(`${result.slotsCount || slots.length} créneaux proposés avec succès`)
      router.push(`/owner/applications/${params.id}`)
    } catch (error: any) {
      console.error("Erreur:", error)
      toast.error(error.message || "Erreur lors de la proposition des créneaux")
    } finally {
      setSubmitting(false)
    }
  }

  const selectedDateKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""
  const selectedDaySlots = selectedDateKey ? daySlots[selectedDateKey] || [] : []
  const totalSlots = getAllSlots().length

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Candidature introuvable</h2>
          <Button asChild>
            <Link href="/owner/applications">Retour aux candidatures</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/owner/applications/${application.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Proposer des créneaux de visite</h1>
          <p className="text-gray-600">Candidature de {application.tenant_name}</p>
        </div>
        <Badge variant="outline">
          {totalSlots} créneau{totalSlots > 1 ? "x" : ""} configuré{totalSlots > 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Property Info */}
      {application.property && (
        <Card>
          <CardHeader>
            <CardTitle>Bien concerné</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <h3 className="font-semibold">{application.property.title}</h3>
              <p className="text-gray-600">{application.property.address}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5" />
              <span>Sélectionner une date</span>
            </CardTitle>
            <CardDescription>Choisissez les dates pour lesquelles vous souhaitez proposer des créneaux</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < startOfDay(new Date())}
              locale={fr}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Time Slots Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Créneaux horaires</span>
            </CardTitle>
            {selectedDate && (
              <CardDescription>
                Configuration pour le {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedDate ? (
              <>
                {/* Add New Slot */}
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium">Ajouter un créneau</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Début</label>
                      <input
                        type="time"
                        value={newSlotStart}
                        onChange={(e) => setNewSlotStart(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Fin</label>
                      <input
                        type="time"
                        value={newSlotEnd}
                        onChange={(e) => setNewSlotEnd(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <Button onClick={addTimeSlot} size="sm" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter le créneau
                  </Button>
                </div>

                {/* Existing Slots */}
                {selectedDaySlots.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Créneaux configurés ({selectedDaySlots.length})</h4>
                      <Button variant="outline" size="sm" onClick={() => clearDay(selectedDateKey)}>
                        Effacer tout
                      </Button>
                    </div>
                    {selectedDaySlots.map((slot, index) => {
                      const startTime = new Date(slot.start_time)
                      const endTime = new Date(slot.end_time)
                      const isPast = startTime <= new Date()

                      return (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            isPast ? "bg-red-50 border-red-200" : "bg-white border-gray-200"
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className={isPast ? "text-red-600" : "text-gray-900"}>
                              {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")}
                            </span>
                            {isPast && (
                              <Badge variant="destructive" className="text-xs">
                                Expiré
                              </Badge>
                            )}
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removeTimeSlot(selectedDateKey, index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Sélectionnez une date pour configurer les créneaux</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary and Actions */}
      {totalSlots > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Récapitulatif des créneaux</CardTitle>
            <CardDescription>
              {totalSlots} créneau{totalSlots > 1 ? "x" : ""} futur{totalSlots > 1 ? "s" : ""} configuré
              {totalSlots > 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              {getAllSlots().map((slot, index) => {
                const startTime = new Date(slot.start_time)
                const endTime = new Date(slot.end_time)

                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{format(startTime, "EEEE d MMMM", { locale: fr })}</span>
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>
                        {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={submitSlots} disabled={submitting || totalSlots === 0} className="flex-1">
                <Send className="h-4 w-4 mr-2" />
                {submitting ? "Envoi en cours..." : `Continuer (${totalSlots} créneaux)`}
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/owner/applications/${application.id}`}>Annuler</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>• Sélectionnez une ou plusieurs dates dans le calendrier</p>
          <p>• Ajoutez des créneaux horaires pour chaque date</p>
          <p>• Les créneaux expirés ne seront pas envoyés au candidat</p>
          <p>• Vous pouvez modifier les créneaux existants en les supprimant et les recréant</p>
          <p>• Le candidat recevra une notification avec les créneaux proposés</p>
        </CardContent>
      </Card>
    </div>
  )
}