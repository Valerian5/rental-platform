"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Check, MapPin, User, AlertTriangle, RefreshCw } from 'lucide-react'
import { toast } from "sonner"

interface VisitSlot {
  id: string
  date: string
  start_time: string
  end_time: string
  is_available: boolean
  max_capacity: number
  current_bookings: number
}

interface TenantVisitSlotSelectorProps {
  applicationId: string
  propertyTitle: string
  propertyAddress: string
  ownerName: string
  onSlotSelected: (slotId: string) => void
  onCancel: () => void
}

export function TenantVisitSlotSelector({
  applicationId,
  propertyTitle,
  propertyAddress,
  ownerName,
  onSlotSelected,
  onCancel,
}: TenantVisitSlotSelectorProps) {
  const [availableSlots, setAvailableSlots] = useState<VisitSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAvailableSlots()
  }, [applicationId])

  const loadAvailableSlots = async () => {
    if (!applicationId) {
      setError("ID de candidature manquant")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      console.log("🔍 Chargement créneaux pour candidature:", applicationId)

      const response = await fetch(`/api/applications/${applicationId}/available-slots`)
      
      console.log("📡 Réponse API:", response.status, response.statusText)

      if (response.ok) {
        const data = await response.json()
        console.log("✅ Données reçues:", data)
        console.log("✅ Créneaux disponibles:", data.slots?.length || 0)

        if (data.success && Array.isArray(data.slots)) {
          setAvailableSlots(data.slots)
          
          if (data.slots.length === 0) {
            setError("Aucun créneau de visite disponible pour cette propriété.")
          }
        } else {
          console.error("❌ Format de données invalide:", data)
          setError("Format de données invalide reçu du serveur")
        }
      } else {
        const errorData = await response.json()
        console.error("❌ Erreur API:", errorData)
        setError(errorData.error || `Erreur ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error("❌ Erreur chargement créneaux:", error)
      setError(error instanceof Error ? error.message : "Erreur lors du chargement des créneaux")
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmSlot = async () => {
    if (!selectedSlot) return

    try {
      setConfirming(true)
      console.log("✅ Confirmation créneau:", { applicationId, selectedSlot })

      const response = await fetch(`/api/applications/${applicationId}/choose-visit-slot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slot_id: selectedSlot }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("✅ Créneau confirmé:", data)
        toast.success(data.message || "Créneau de visite confirmé !")
        onSlotSelected(selectedSlot)
      } else {
        const errorData = await response.json()
        console.error("❌ Erreur confirmation:", errorData)
        toast.error(errorData.error || "Erreur lors de la confirmation")
      }
    } catch (error) {
      console.error("❌ Erreur confirmation:", error)
      toast.error("Erreur lors de la confirmation")
    } finally {
      setConfirming(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    } catch (error) {
      console.error("Erreur formatage date:", error)
      return dateString
    }
  }

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5) // HH:MM
  }

  // État de chargement
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Chargement des créneaux disponibles...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // État d'erreur
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-700 mb-2">Erreur</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={loadAvailableSlots} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
              <Button onClick={onCancel} variant="outline">
                Retour
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
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
    {} as Record<string, VisitSlot[]>,
  )

  return (
    <div className="space-y-6">
      {/* En-tête avec infos du bien */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Choisir un créneau de visite
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <p className="font-medium">{propertyTitle}</p>
                <p className="text-sm text-muted-foreground">{propertyAddress}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm">Propriétaire : {ownerName}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Créneaux disponibles */}
      {Object.keys(slotsByDate).length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucun créneau disponible</h3>
            <p className="text-muted-foreground mb-4">
              Le propriétaire n'a pas encore configuré de créneaux de visite ou tous sont déjà réservés.
            </p>
            <Button variant="outline" onClick={onCancel}>
              Retour à mes candidatures
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {Object.entries(slotsByDate)
              .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
              .map(([date, slots]) => (
                <Card key={date}>
                  <CardHeader className="pb-3">
                    <h3 className="font-medium text-lg">{formatDate(date)}</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {slots
                        .filter((slot) => slot.is_available && slot.current_bookings < slot.max_capacity)
                        .sort((a, b) => a.start_time.localeCompare(b.start_time))
                        .map((slot) => {
                          const availableSpots = slot.max_capacity - slot.current_bookings
                          return (
                            <Button
                              key={slot.id}
                              variant={selectedSlot === slot.id ? "default" : "outline"}
                              className="h-auto p-4 justify-start"
                              onClick={() => setSelectedSlot(slot.id)}
                              disabled={availableSpots <= 0}
                            >
                              <div className="flex items-center gap-3 w-full">
                                <Clock className="h-4 w-4" />
                                <div className="text-left">
                                  <p className="font-medium">
                                    {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {(new Date(`2000-01-01T${slot.end_time}`).getTime() -
                                      new Date(`2000-01-01T${slot.start_time}`).getTime()) /
                                      (1000 * 60)}{" "}
                                    min
                                  </p>
                                  {slot.max_capacity > 1 && (
                                    <p className="text-xs text-muted-foreground">
                                      {availableSpots} place{availableSpots > 1 ? "s" : ""} disponible
                                      {availableSpots > 1 ? "s" : ""}
                                    </p>
                                  )}
                                </div>
                                {selectedSlot === slot.id && <Check className="h-4 w-4 ml-auto" />}
                              </div>
                            </Button>
                          )
                        })}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          {/* Actions */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedSlot ? (
                    <Badge variant="default">Créneau sélectionné</Badge>
                  ) : (
                    <Badge variant="secondary">Sélectionnez un créneau</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onCancel}>
                    Annuler
                  </Button>
                  <Button onClick={handleConfirmSlot} disabled={!selectedSlot || confirming}>
                    {confirming ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Confirmation...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Confirmer ce créneau
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
