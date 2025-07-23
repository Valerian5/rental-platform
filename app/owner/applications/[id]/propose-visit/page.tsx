"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { format, addDays, setHours, setMinutes } from "date-fns"
import { fr } from "date-fns/locale"
import { Clock, ArrowLeft, Send } from "lucide-react"
import { PageHeader } from "@/components/page-header"

export default function ProposeVisitPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [application, setApplication] = useState<any>(null)
  const [selectedSlots, setSelectedSlots] = useState<any[]>([])
  const [availableSlots, setAvailableSlots] = useState<any[]>([])

  useEffect(() => {
    loadApplication()
    generateAvailableSlots()
  }, [])

  const loadApplication = async () => {
    try {
      const response = await fetch(`/api/applications/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setApplication(data.application)
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }

  const generateAvailableSlots = () => {
    const slots = []
    const today = new Date()

    // Générer des créneaux pour les 14 prochains jours
    for (let i = 1; i <= 14; i++) {
      const date = addDays(today, i)

      // Créneaux matin (9h-12h)
      for (let hour = 9; hour <= 11; hour++) {
        slots.push({
          id: `${format(date, "yyyy-MM-dd")}-${hour}:00`,
          date: format(date, "yyyy-MM-dd"),
          time: `${hour}:00`,
          datetime: setMinutes(setHours(date, hour), 0),
          period: "Matin",
        })
      }

      // Créneaux après-midi (14h-18h)
      for (let hour = 14; hour <= 17; hour++) {
        slots.push({
          id: `${format(date, "yyyy-MM-dd")}-${hour}:00`,
          date: format(date, "yyyy-MM-dd"),
          time: `${hour}:00`,
          datetime: setMinutes(setHours(date, hour), 0),
          period: "Après-midi",
        })
      }
    }

    setAvailableSlots(slots)
  }

  const toggleSlot = (slot: any) => {
    setSelectedSlots((prev) => {
      const exists = prev.find((s) => s.id === slot.id)
      if (exists) {
        return prev.filter((s) => s.id !== slot.id)
      } else {
        return [...prev, slot]
      }
    })
  }

  const handleSubmit = async () => {
    if (selectedSlots.length === 0) {
      toast.error("Veuillez sélectionner au moins un créneau")
      return
    }

    try {
      const response = await fetch(`/api/applications/${params.id}/propose-visit-slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots: selectedSlots }),
      })

      if (response.ok) {
        toast.success("Créneaux de visite proposés avec succès")
        router.push(`/owner/applications/${params.id}`)
      } else {
        toast.error("Erreur lors de la proposition")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la proposition")
    }
  }

  if (loading) {
    return <div className="container mx-auto py-6">Chargement...</div>
  }

  // Grouper les créneaux par date
  const slotsByDate = availableSlots.reduce(
    (acc, slot) => {
      if (!acc[slot.date]) {
        acc[slot.date] = []
      }
      acc[slot.date].push(slot)
      return acc
    },
    {} as Record<string, any[]>,
  )

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Proposer des créneaux de visite"
        description={`Candidature de ${application?.tenant_name || "Candidat"}`}
        backButton={{
          href: `/owner/applications/${params.id}`,
          label: "Retour à l'analyse",
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Sélection des créneaux */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Créneaux disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(slotsByDate).map(([date, slots]) => (
                  <div key={date}>
                    <h3 className="font-medium mb-3">{format(new Date(date), "EEEE d MMMM yyyy", { locale: fr })}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {slots.map((slot) => (
                        <Button
                          key={slot.id}
                          variant={selectedSlots.find((s) => s.id === slot.id) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleSlot(slot)}
                          className="justify-start"
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          {slot.time}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Récapitulatif */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Créneaux sélectionnés</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedSlots.length === 0 ? (
                <p className="text-muted-foreground text-sm">Aucun créneau sélectionné</p>
              ) : (
                <div className="space-y-2">
                  {selectedSlots.map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium text-sm">{format(slot.datetime, "EEE d MMM", { locale: fr })}</div>
                        <div className="text-xs text-muted-foreground">
                          {slot.time} - {slot.period}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => toggleSlot(slot)}>
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-4 space-y-2">
            <Button onClick={handleSubmit} disabled={selectedSlots.length === 0} className="w-full">
              <Send className="h-4 w-4 mr-2" />
              Proposer {selectedSlots.length} créneau{selectedSlots.length > 1 ? "x" : ""}
            </Button>
            <Button variant="outline" onClick={() => router.back()} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Annuler
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
