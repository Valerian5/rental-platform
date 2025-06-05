"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, Plus, Trash2, Save } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

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
  propertyId: string
  onSlotsChange?: (slots: VisitSlot[]) => void
}

// Fonction pour formater la date pour l'affichage (sans problème de timezone)
function formatDateForDisplay(dateString: string): string {
  try {
    // Extraire les composants de la date directement
    const [year, month, day] = dateString.split("-").map(Number)

    // Créer un objet Date avec les composants locaux
    const date = new Date(year, month - 1, day) // month - 1 car les mois commencent à 0

    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
    }

    const formatted = date.toLocaleDateString("fr-FR", options)
    console.log(`Debug: Date sélectionnée = ${dateString} | Formatée = ${formatted}`)
    return formatted
  } catch (error) {
    console.error("Erreur formatage date:", error)
    return dateString
  }
}

export default function VisitScheduler({ propertyId, onSlotsChange }: VisitSchedulerProps) {
  const [slots, setSlots] = useState<VisitSlot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const hasLoadedRef = useRef(false)

  // Fonction pour récupérer le token d'authentification
  const getAuthToken = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      return session?.access_token || null
    } catch (error) {
      console.error("Erreur récupération token:", error)
      return null
    }
  }, [])

  // Charger les créneaux depuis la base de données
  const loadSlotsFromDatabase = useCallback(async () => {
    if (hasLoadedRef.current) return

    try {
      console.log("🔄 Chargement des créneaux pour la propriété:", propertyId)
      setIsLoading(true)

      const token = await getAuthToken()
      if (!token) {
        console.error("❌ Pas de token d'authentification")
        toast.error("Vous devez être connecté")
        return
      }

      const response = await fetch(`/api/properties/${propertyId}/visit-slots`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Erreur ${response.status}`)
      }

      const data = await response.json()
      console.log("✅ Créneaux chargés:", data.slots?.length || 0)

      setSlots(data.slots || [])
      hasLoadedRef.current = true
    } catch (error) {
      console.error("❌ Erreur chargement créneaux:", error)
      toast.error("Erreur lors du chargement des créneaux")
    } finally {
      setIsLoading(false)
    }
  }, [propertyId, getAuthToken])

  // Charger les créneaux au montage du composant
  useEffect(() => {
    if (propertyId && !hasLoadedRef.current) {
      loadSlotsFromDatabase()
    }
  }, []) // Pas de dépendances pour éviter les boucles

  // Callback pour notifier les changements
  const handleSlotsChange = useCallback(
    (newSlots: VisitSlot[]) => {
      setSlots(newSlots)
      onSlotsChange?.(newSlots)
    },
    [onSlotsChange],
  )

  // Ajouter un nouveau créneau
  const addSlot = () => {
    const newSlot: VisitSlot = {
      date: new Date().toISOString().split("T")[0],
      start_time: "14:00",
      end_time: "15:00",
      max_capacity: 1,
      is_group_visit: false,
      current_bookings: 0,
      is_available: true,
    }

    const newSlots = [...slots, newSlot]
    handleSlotsChange(newSlots)
  }

  // Supprimer un créneau
  const removeSlot = (index: number) => {
    const newSlots = slots.filter((_, i) => i !== index)
    handleSlotsChange(newSlots)
  }

  // Mettre à jour un créneau
  const updateSlot = (index: number, field: keyof VisitSlot, value: any) => {
    const newSlots = [...slots]
    newSlots[index] = { ...newSlots[index], [field]: value }
    handleSlotsChange(newSlots)
  }

  // Sauvegarder les créneaux
  const saveSlots = async () => {
    try {
      setIsSaving(true)
      console.log("💾 Sauvegarde des créneaux...")

      const token = await getAuthToken()
      if (!token) {
        toast.error("Vous devez être connecté")
        return
      }

      const response = await fetch(`/api/properties/${propertyId}/visit-slots`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slots }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Erreur ${response.status}`)
      }

      const data = await response.json()
      console.log("✅ Créneaux sauvegardés:", data)

      toast.success(data.message || "Créneaux sauvegardés avec succès")

      // Recharger les créneaux depuis la base
      hasLoadedRef.current = false
      await loadSlotsFromDatabase()
    } catch (error) {
      console.error("❌ Erreur sauvegarde:", error)
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Créneaux de visite
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Chargement des créneaux...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Créneaux de visite
        </CardTitle>
        <CardDescription>Configurez les créneaux disponibles pour les visites de cette propriété</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Liste des créneaux */}
        <div className="space-y-4">
          {slots.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun créneau configuré</p>
              <p className="text-sm">Cliquez sur "Ajouter un créneau" pour commencer</p>
            </div>
          ) : (
            slots.map((slot, index) => (
              <Card key={index} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Date */}
                  <div className="space-y-2">
                    <Label htmlFor={`date-${index}`}>Date</Label>
                    <Input
                      id={`date-${index}`}
                      type="date"
                      value={slot.date}
                      onChange={(e) => updateSlot(index, "date", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">{formatDateForDisplay(slot.date)}</p>
                  </div>

                  {/* Heure de début */}
                  <div className="space-y-2">
                    <Label htmlFor={`start-${index}`}>Heure de début</Label>
                    <Input
                      id={`start-${index}`}
                      type="time"
                      value={slot.start_time}
                      onChange={(e) => updateSlot(index, "start_time", e.target.value)}
                    />
                  </div>

                  {/* Heure de fin */}
                  <div className="space-y-2">
                    <Label htmlFor={`end-${index}`}>Heure de fin</Label>
                    <Input
                      id={`end-${index}`}
                      type="time"
                      value={slot.end_time}
                      onChange={(e) => updateSlot(index, "end_time", e.target.value)}
                    />
                  </div>

                  {/* Capacité */}
                  <div className="space-y-2">
                    <Label htmlFor={`capacity-${index}`}>Capacité max</Label>
                    <Input
                      id={`capacity-${index}`}
                      type="number"
                      min="1"
                      max="20"
                      value={slot.max_capacity}
                      onChange={(e) => updateSlot(index, "max_capacity", Number.parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>

                {/* Options et actions */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={slot.is_group_visit}
                        onChange={(e) => updateSlot(index, "is_group_visit", e.target.checked)}
                        className="rounded"
                      />
                      Visite de groupe
                    </label>

                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={slot.is_available}
                        onChange={(e) => updateSlot(index, "is_available", e.target.checked)}
                        className="rounded"
                      />
                      Disponible
                    </label>

                    {slot.current_bookings > 0 && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {slot.current_bookings} réservation(s)
                      </Badge>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeSlot(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={addSlot} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Ajouter un créneau
          </Button>

          <Button onClick={saveSlots} disabled={isSaving} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
