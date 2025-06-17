"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Plus, Trash2, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface VisitSlot {
  id: string
  property_id: string
  date: string
  start_time: string
  end_time: string
  max_visitors: number
  current_bookings: number
  is_available: boolean
  created_at: string
}

interface VisitSchedulerProps {
  propertyId: string
  visitSlots: VisitSlot[]
  onSlotsChange: (slots: VisitSlot[]) => void
  mode?: "management" | "booking"
}

export function VisitScheduler({
  propertyId,
  visitSlots: initialSlots,
  onSlotsChange,
  mode = "management",
}: VisitSchedulerProps) {
  const [slots, setSlots] = useState<VisitSlot[]>(initialSlots)
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newSlot, setNewSlot] = useState({
    date: "",
    start_time: "",
    end_time: "",
    max_visitors: 5,
  })

  // Ref pour éviter les appels multiples
  const loadingRef = useRef(false)
  const initialLoadRef = useRef(false)

  // Fonction de chargement des créneaux - STABLE
  const loadSlots = useCallback(async () => {
    if (loadingRef.current || !propertyId) return

    loadingRef.current = true
    setIsLoading(true)

    try {
      console.log("🔄 Chargement des créneaux depuis la DB pour:", propertyId)

      const response = await fetch(`/api/properties/${propertyId}/visit-slots`)
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const loadedSlots = data.slots || []

      console.log("✅ Créneaux chargés depuis la DB:", loadedSlots.length)

      setSlots(loadedSlots)
      onSlotsChange(loadedSlots)
    } catch (error: any) {
      console.error("❌ Erreur lors du chargement des créneaux:", error)
      toast("Erreur lors du chargement des créneaux", {
        description: error.message,
        type: "error",
      })
    } finally {
      setIsLoading(false)
      loadingRef.current = false
    }
  }, [propertyId, onSlotsChange])

  // Chargement initial - UNE SEULE FOIS
  useEffect(() => {
    if (!initialLoadRef.current && propertyId) {
      console.log("🔄 Chargement initial des créneaux...")
      initialLoadRef.current = true
      loadSlots()
    }
  }, [propertyId, loadSlots])

  // Synchronisation avec les props - SANS RECHARGEMENT
  useEffect(() => {
    if (initialSlots.length !== slots.length) {
      setSlots(initialSlots)
    }
  }, [initialSlots.length]) // Seulement si la longueur change

  const createSlot = async () => {
    if (!newSlot.date || !newSlot.start_time || !newSlot.end_time) {
      toast("Veuillez remplir tous les champs", {
        type: "error",
      })
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch(`/api/properties/${propertyId}/visit-slots`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSlot),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la création du créneau")
      }

      const createdSlot = await response.json()
      const updatedSlots = [...slots, createdSlot]

      setSlots(updatedSlots)
      onSlotsChange(updatedSlots)

      // Reset du formulaire
      setNewSlot({
        date: "",
        start_time: "",
        end_time: "",
        max_visitors: 5,
      })

      toast("Créneau créé avec succès", {
        type: "success",
      })
    } catch (error: any) {
      console.error("Erreur lors de la création:", error)
      toast("Erreur lors de la création du créneau", {
        description: error.message,
        type: "error",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const deleteSlot = async (slotId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce créneau ?")) return

    try {
      const response = await fetch(`/api/properties/${propertyId}/visit-slots`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slotId }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression")
      }

      const updatedSlots = slots.filter((slot) => slot.id !== slotId)
      setSlots(updatedSlots)
      onSlotsChange(updatedSlots)

      toast("Créneau supprimé avec succès", {
        type: "success",
      })
    } catch (error: any) {
      console.error("Erreur lors de la suppression:", error)
      toast("Erreur lors de la suppression", {
        description: error.message,
        type: "error",
      })
    } finally {
      setIsCreating(false)
    }
  }

  if (mode === "booking") {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Créneaux de visite disponibles</h3>
        {slots.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Aucun créneau de visite disponible pour le moment</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {slots
              .filter((slot) => slot.is_available && slot.current_bookings < slot.max_visitors)
              .map((slot) => (
                <Card key={slot.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center text-blue-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span className="font-medium">
                            {new Date(slot.date).toLocaleDateString("fr-FR", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>
                            {slot.start_time} - {slot.end_time}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          <Users className="h-3 w-3 mr-1" />
                          {slot.current_bookings}/{slot.max_visitors}
                        </Badge>
                        <Button size="sm">Réserver</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Formulaire de création */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Ajouter un créneau de visite
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={newSlot.date}
                onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div>
              <Label htmlFor="start_time">Heure de début</Label>
              <Input
                id="start_time"
                type="time"
                value={newSlot.start_time}
                onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="end_time">Heure de fin</Label>
              <Input
                id="end_time"
                type="time"
                value={newSlot.end_time}
                onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="max_visitors">Visiteurs max</Label>
              <Input
                id="max_visitors"
                type="number"
                min="1"
                max="20"
                value={newSlot.max_visitors}
                onChange={(e) => setNewSlot({ ...newSlot, max_visitors: Number.parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
          <Button onClick={createSlot} disabled={isCreating} className="w-full md:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            {isCreating ? "Création..." : "Créer le créneau"}
          </Button>
        </CardContent>
      </Card>

      {/* Liste des créneaux */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Créneaux programmés
            </span>
            <Badge variant="outline">{slots.length} créneaux</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Chargement...</span>
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Aucun créneau programmé</p>
              <p className="text-sm">Créez votre premier créneau de visite ci-dessus</p>
            </div>
          ) : (
            <div className="space-y-3">
              {slots
                .sort(
                  (a, b) =>
                    new Date(a.date + " " + a.start_time).getTime() - new Date(b.date + " " + b.start_time).getTime(),
                )
                .map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center text-blue-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="font-medium">
                          {new Date(slot.date).toLocaleDateString("fr-FR", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>
                          {slot.start_time} - {slot.end_time}
                        </span>
                      </div>
                      <Badge variant={slot.is_available ? "default" : "secondary"}>
                        {slot.is_available ? "Disponible" : "Indisponible"}
                      </Badge>
                      <Badge variant="outline">
                        <Users className="h-3 w-3 mr-1" />
                        {slot.current_bookings}/{slot.max_visitors}
                      </Badge>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => deleteSlot(slot.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
