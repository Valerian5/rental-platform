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
  visitSlots?: VisitSlot[]
  onSlotsChange: (slots: VisitSlot[]) => void
  mode?: "management" | "booking"
}

export function VisitScheduler({
  propertyId,
  visitSlots: initialSlots = [],
  onSlotsChange,
  mode = "management",
}: VisitSchedulerProps) {
  console.log("🏠 VisitScheduler - Initialisation:", {
    propertyId,
    initialSlotsLength: Array.isArray(initialSlots) ? initialSlots.length : 0,
    mode,
  })

  const [slots, setSlots] = useState<VisitSlot[]>([])
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
  const [hasInitialLoad, setHasInitialLoad] = useState(false)

  // Fonction sécurisée pour obtenir le nombre de créneaux
  const getSlotsCount = useCallback(() => {
    return Array.isArray(slots) ? slots.length : 0
  }, [slots])

  // Fonction sécurisée pour obtenir les créneaux
  const getSafeSlots = useCallback(() => {
    return Array.isArray(slots) ? slots : []
  }, [slots])

  // Fonction de chargement des créneaux - SÉCURISÉE
  const loadSlotsFromDatabase = useCallback(async () => {
    if (!propertyId || loadingRef.current) {
      console.log("🚫 Chargement évité - pas de propertyId ou déjà en cours")
      return
    }

    console.log("🔄 Chargement des créneaux depuis la DB pour:", propertyId)
    setIsLoading(true)
    loadingRef.current = true

    try {
      const response = await fetch(`/api/properties/${propertyId}/visit-slots`)

      if (response.ok) {
        const data = await response.json()
        console.log("✅ Créneaux chargés depuis la DB:", Array.isArray(data.slots) ? data.slots.length : 0)

        const loadedSlots = Array.isArray(data.slots) ? data.slots : []

        // Filtrer les créneaux pour s'assurer qu'ils ont tous les champs requis
        const cleanedSlots = loadedSlots.filter(
          (slot: any) =>
            slot &&
            typeof slot === "object" &&
            slot.id &&
            slot.property_id &&
            slot.date &&
            slot.start_time &&
            slot.end_time &&
            typeof slot.max_visitors === "number" &&
            typeof slot.current_bookings === "number" &&
            typeof slot.is_available === "boolean" &&
            slot.created_at,
        )

        console.log("🧹 Créneaux nettoyés:", cleanedSlots.length)

        // Mettre à jour l'état local
        setSlots(cleanedSlots)
        if (onSlotsChange) {
          onSlotsChange(cleanedSlots)
        }
        setHasInitialLoad(true)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error("❌ Erreur chargement créneaux:", response.status, errorData)
        if (response.status === 401) {
          toast.error("Erreur d'authentification. Veuillez vous reconnecter.")
        } else {
          toast.error(errorData.error || "Erreur lors du chargement des créneaux")
        }
        setHasInitialLoad(true)
      }
    } catch (error) {
      console.error("❌ Erreur chargement créneaux:", error)
      toast.error("Erreur lors du chargement des créneaux")
      setHasInitialLoad(true)
    } finally {
      setIsLoading(false)
      loadingRef.current = false
    }
  }, [propertyId, onSlotsChange])

  // Charger les créneaux au montage SEULEMENT si mode management et pas de créneaux existants
  useEffect(() => {
    const safeInitialSlots = Array.isArray(initialSlots) ? initialSlots : []

    if (mode === "management" && propertyId && safeInitialSlots.length === 0 && !hasInitialLoad) {
      console.log("🔄 Chargement initial des créneaux...")
      loadSlotsFromDatabase()
    } else if (safeInitialSlots.length > 0 && !hasInitialLoad) {
      console.log("✅ Utilisation des créneaux existants:", safeInitialSlots.length)
      setSlots(safeInitialSlots)
      setHasInitialLoad(true)
    } else if (!hasInitialLoad) {
      console.log("✅ Marquage comme chargé (0 créneaux)")
      setHasInitialLoad(true)
    }
  }, [mode, propertyId, initialSlots, hasInitialLoad, loadSlotsFromDatabase])

  // Synchronisation avec les props - SÉCURISÉE
  useEffect(() => {
    const safeInitialSlots = Array.isArray(initialSlots) ? initialSlots : []
    const currentSlotsCount = getSlotsCount()

    if (safeInitialSlots.length !== currentSlotsCount) {
      console.log("🔄 Synchronisation créneaux:", {
        initial: safeInitialSlots.length,
        current: currentSlotsCount,
      })
      setSlots(safeInitialSlots)
    }
  }, [initialSlots, getSlotsCount])

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
      const currentSlots = getSafeSlots()
      const updatedSlots = [...currentSlots, createdSlot]

      console.log("✅ Créneau créé:", createdSlot)
      setSlots(updatedSlots)
      if (onSlotsChange) {
        onSlotsChange(updatedSlots)
      }

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

      const currentSlots = getSafeSlots()
      const updatedSlots = currentSlots.filter((slot) => slot.id !== slotId)

      console.log("🗑️ Créneau supprimé:", slotId)
      setSlots(updatedSlots)
      if (onSlotsChange) {
        onSlotsChange(updatedSlots)
      }

      toast("Créneau supprimé avec succès", {
        type: "success",
      })
    } catch (error: any) {
      console.error("Erreur lors de la suppression:", error)
      toast("Erreur lors de la suppression", {
        description: error.message,
        type: "error",
      })
    }
  }

  // Fonction sécurisée pour formater la date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch (error) {
      console.error("Erreur formatage date:", error)
      return dateString
    }
  }

  // Fonction sécurisée pour formater la date courte
  const formatDateShort = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("fr-FR", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    } catch (error) {
      console.error("Erreur formatage date courte:", error)
      return dateString
    }
  }

  // Fonction sécurisée pour trier les créneaux
  const getSortedSlots = () => {
    const safeSlots = getSafeSlots()
    return safeSlots.sort((a, b) => {
      try {
        const dateA = new Date(a.date + " " + a.start_time).getTime()
        const dateB = new Date(b.date + " " + b.start_time).getTime()
        return dateA - dateB
      } catch (error) {
        console.error("Erreur tri créneaux:", error)
        return 0
      }
    })
  }

  if (mode === "booking") {
    const availableSlots = getSafeSlots().filter(
      (slot) => slot && slot.is_available && (slot.current_bookings || 0) < (slot.max_visitors || 1),
    )

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Créneaux de visite disponibles</h3>
        {availableSlots.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Aucun créneau de visite disponible pour le moment</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {availableSlots.map((slot) => (
              <Card key={slot.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center text-blue-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="font-medium">{formatDate(slot.date)}</span>
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
                        {slot.current_bookings || 0}/{slot.max_visitors || 1}
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
            <Badge variant="outline">{getSlotsCount()} créneaux</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Chargement...</span>
            </div>
          ) : getSlotsCount() === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Aucun créneau programmé</p>
              <p className="text-sm">Créez votre premier créneau de visite ci-dessus</p>
            </div>
          ) : (
            <div className="space-y-3">
              {getSortedSlots().map((slot) => (
                <div key={slot.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-blue-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span className="font-medium">{formatDateShort(slot.date)}</span>
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
                      {slot.current_bookings || 0}/{slot.max_visitors || 1}
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
