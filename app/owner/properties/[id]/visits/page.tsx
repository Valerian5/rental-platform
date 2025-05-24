"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, CalendarIcon, Clock, Users, Plus, Edit, Trash2, Settings, Zap } from "lucide-react"
import Link from "next/link"
import { propertyService } from "@/lib/property-service"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"

interface VisitSlot {
  id: string
  date: string
  start_time: string
  end_time: string
  max_capacity: number
  is_group_visit: boolean
  current_bookings: number
}

export default function PropertyVisitsPage() {
  const router = useRouter()
  const params = useParams()
  const [property, setProperty] = useState<any>(null)
  const [visitSlots, setVisitSlots] = useState<VisitSlot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [isGenerating, setIsGenerating] = useState(false)

  // Formulaire pour ajouter un créneau
  const [newSlot, setNewSlot] = useState({
    date: "",
    start_time: "",
    end_time: "",
    max_capacity: 1,
    is_group_visit: false,
  })

  // Paramètres de génération automatique
  const [autoGenSettings, setAutoGenSettings] = useState({
    daysAhead: 14,
    slotDuration: 30, // en minutes
    weekdayStart: "09:00",
    weekdayEnd: "18:00",
    saturdayStart: "10:00",
    saturdayEnd: "17:00",
    includeSunday: false,
    defaultCapacity: 1,
    enableGroupVisits: false,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "owner") {
          router.push("/login")
          return
        }

        if (params.id) {
          const [propertyData, slotsData] = await Promise.all([
            propertyService.getPropertyById(params.id as string),
            propertyService.getPropertyVisitAvailabilities(params.id as string),
          ])

          setProperty(propertyData)
          setVisitSlots(slotsData)
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error)
        toast.error("Erreur lors du chargement des données")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params.id, router])

  const generateTimeSlots = (startTime: string, endTime: string, duration: number) => {
    const slots = []
    const start = new Date(`2000-01-01T${startTime}:00`)
    const end = new Date(`2000-01-01T${endTime}:00`)

    while (start < end) {
      const slotEnd = new Date(start.getTime() + duration * 60000)
      if (slotEnd <= end) {
        slots.push({
          start: start.toTimeString().slice(0, 5),
          end: slotEnd.toTimeString().slice(0, 5),
        })
      }
      start.setTime(start.getTime() + duration * 60000)
    }

    return slots
  }

  const handleGenerateSlots = async () => {
    if (!property) return

    setIsGenerating(true)
    try {
      await propertyService.generateDefaultVisitSlots(property.id, autoGenSettings.daysAhead)

      // Recharger les créneaux
      const updatedSlots = await propertyService.getPropertyVisitAvailabilities(property.id)
      setVisitSlots(updatedSlots)

      toast.success(`${updatedSlots.length} créneaux générés automatiquement`)
    } catch (error) {
      console.error("Erreur lors de la génération des créneaux:", error)
      toast.error("Erreur lors de la génération des créneaux")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAddSlot = async () => {
    if (!property || !newSlot.date || !newSlot.start_time || !newSlot.end_time) {
      toast.error("Veuillez remplir tous les champs")
      return
    }

    try {
      await propertyService.addVisitAvailability(
        property.id,
        newSlot.date,
        newSlot.start_time,
        newSlot.end_time,
        newSlot.max_capacity,
        newSlot.is_group_visit,
      )

      // Recharger les créneaux
      const updatedSlots = await propertyService.getPropertyVisitAvailabilities(property.id)
      setVisitSlots(updatedSlots)

      // Réinitialiser le formulaire
      setNewSlot({
        date: "",
        start_time: "",
        end_time: "",
        max_capacity: 1,
        is_group_visit: false,
      })

      toast.success("Créneau ajouté avec succès")
    } catch (error) {
      console.error("Erreur lors de l'ajout du créneau:", error)
      toast.error("Erreur lors de l'ajout du créneau")
    }
  }

  const handleUpdateSlot = async (slotId: string, updates: any) => {
    try {
      await propertyService.updateVisitAvailability(slotId, updates)

      // Mettre à jour localement
      setVisitSlots((prev) => prev.map((slot) => (slot.id === slotId ? { ...slot, ...updates } : slot)))

      toast.success("Créneau mis à jour")
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error)
      toast.error("Erreur lors de la mise à jour")
    }
  }

  const handleDeleteSlot = async (slotId: string) => {
    try {
      await propertyService.deleteVisitAvailability(slotId)
      setVisitSlots((prev) => prev.filter((slot) => slot.id !== slotId))
      toast.success("Créneau supprimé")
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      toast.error("Erreur lors de la suppression")
    }
  }

  const groupSlotsByDate = (slots: VisitSlot[]) => {
    return slots.reduce(
      (groups, slot) => {
        const date = slot.date
        if (!groups[date]) {
          groups[date] = []
        }
        groups[date].push(slot)
        return groups
      },
      {} as Record<string, VisitSlot[]>,
    )
  }

  const getSlotStatus = (slot: VisitSlot) => {
    if (slot.current_bookings === 0) return "available"
    if (slot.current_bookings < slot.max_capacity) return "partial"
    return "full"
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge variant="default">Disponible</Badge>
      case "partial":
        return <Badge variant="secondary">Partiellement réservé</Badge>
      case "full":
        return <Badge variant="destructive">Complet</Badge>
      default:
        return <Badge variant="outline">Inconnu</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Chargement...</div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Propriété non trouvée</div>
      </div>
    )
  }

  const groupedSlots = groupSlotsByDate(visitSlots)

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <Link href={`/owner/properties/${property.id}`} className="text-blue-600 hover:underline flex items-center mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Retour au bien
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Gestion des visites</h1>
        <p className="text-gray-600">{property.title}</p>
      </div>

      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList>
          <TabsTrigger value="calendar">Calendrier des visites</TabsTrigger>
          <TabsTrigger value="add">Ajouter un créneau</TabsTrigger>
          <TabsTrigger value="settings">Paramètres automatiques</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5" />
                <span className="font-medium">{visitSlots.length} créneaux disponibles</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span className="text-sm text-gray-600">
                  {visitSlots.reduce((sum, slot) => sum + slot.current_bookings, 0)} réservations
                </span>
              </div>
            </div>
            <Button onClick={handleGenerateSlots} disabled={isGenerating}>
              <Zap className="h-4 w-4 mr-2" />
              {isGenerating ? "Génération..." : "Générer des créneaux"}
            </Button>
          </div>

          {Object.keys(groupedSlots).length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Aucun créneau de visite</h3>
                <p className="text-gray-600 mb-4">
                  Commencez par générer des créneaux automatiquement ou ajoutez-en manuellement
                </p>
                <div className="flex justify-center space-x-2">
                  <Button onClick={handleGenerateSlots} disabled={isGenerating}>
                    <Zap className="h-4 w-4 mr-2" />
                    Générer automatiquement
                  </Button>
                  <Button variant="outline" onClick={() => document.querySelector('[value="add"]')?.click()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter manuellement
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedSlots)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, slots]) => (
                  <Card key={date}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>
                          {new Date(date).toLocaleDateString("fr-FR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                        <Badge variant="outline">{slots.length} créneaux</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {slots
                          .sort((a, b) => a.start_time.localeCompare(b.start_time))
                          .map((slot) => (
                            <div key={slot.id} className="border rounded-lg p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Clock className="h-4 w-4 text-gray-500" />
                                  <span className="font-medium">
                                    {slot.start_time} - {slot.end_time}
                                  </span>
                                </div>
                                {getStatusBadge(getSlotStatus(slot))}
                              </div>

                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center space-x-2">
                                  <Users className="h-4 w-4 text-gray-500" />
                                  <span>
                                    {slot.current_bookings}/{slot.max_capacity}
                                    {slot.is_group_visit && " (Groupe)"}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    // Ouvrir modal d'édition
                                    const newCapacity = prompt("Nouvelle capacité:", slot.max_capacity.toString())
                                    if (newCapacity) {
                                      handleUpdateSlot(slot.id, {
                                        max_capacity: Number.parseInt(newCapacity),
                                      })
                                    }
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm("Êtes-vous sûr de vouloir supprimer ce créneau ?")) {
                                      handleDeleteSlot(slot.id)
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="add" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ajouter un créneau de visite</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newSlot.date}
                    onChange={(e) => setNewSlot((prev) => ({ ...prev, date: e.target.value }))}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Capacité maximale</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={newSlot.max_capacity}
                    onChange={(e) => setNewSlot((prev) => ({ ...prev, max_capacity: Number.parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Heure de début</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={newSlot.start_time}
                    onChange={(e) => setNewSlot((prev) => ({ ...prev, start_time: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">Heure de fin</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={newSlot.end_time}
                    onChange={(e) => setNewSlot((prev) => ({ ...prev, end_time: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_group_visit"
                  checked={newSlot.is_group_visit}
                  onCheckedChange={(checked) => setNewSlot((prev) => ({ ...prev, is_group_visit: checked as boolean }))}
                />
                <Label htmlFor="is_group_visit">Visite groupée (plusieurs locataires en même temps)</Label>
              </div>

              <Button onClick={handleAddSlot} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter ce créneau
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Paramètres de génération automatique
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre de jours à l'avance</Label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={autoGenSettings.daysAhead}
                    onChange={(e) =>
                      setAutoGenSettings((prev) => ({
                        ...prev,
                        daysAhead: Number.parseInt(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Durée des créneaux (minutes)</Label>
                  <Select
                    value={autoGenSettings.slotDuration.toString()}
                    onValueChange={(value) =>
                      setAutoGenSettings((prev) => ({
                        ...prev,
                        slotDuration: Number.parseInt(value),
                      }))
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
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Horaires en semaine (Lundi - Vendredi)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Heure de début</Label>
                    <Input
                      type="time"
                      value={autoGenSettings.weekdayStart}
                      onChange={(e) =>
                        setAutoGenSettings((prev) => ({
                          ...prev,
                          weekdayStart: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Heure de fin</Label>
                    <Input
                      type="time"
                      value={autoGenSettings.weekdayEnd}
                      onChange={(e) =>
                        setAutoGenSettings((prev) => ({
                          ...prev,
                          weekdayEnd: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Horaires le samedi</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Heure de début</Label>
                    <Input
                      type="time"
                      value={autoGenSettings.saturdayStart}
                      onChange={(e) =>
                        setAutoGenSettings((prev) => ({
                          ...prev,
                          saturdayStart: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Heure de fin</Label>
                    <Input
                      type="time"
                      value={autoGenSettings.saturdayEnd}
                      onChange={(e) =>
                        setAutoGenSettings((prev) => ({
                          ...prev,
                          saturdayEnd: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeSunday"
                    checked={autoGenSettings.includeSunday}
                    onCheckedChange={(checked) =>
                      setAutoGenSettings((prev) => ({
                        ...prev,
                        includeSunday: checked as boolean,
                      }))
                    }
                  />
                  <Label htmlFor="includeSunday">Inclure le dimanche</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enableGroupVisits"
                    checked={autoGenSettings.enableGroupVisits}
                    onCheckedChange={(checked) =>
                      setAutoGenSettings((prev) => ({
                        ...prev,
                        enableGroupVisits: checked as boolean,
                      }))
                    }
                  />
                  <Label htmlFor="enableGroupVisits">Activer les visites groupées par défaut</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Capacité par défaut</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={autoGenSettings.defaultCapacity}
                  onChange={(e) =>
                    setAutoGenSettings((prev) => ({
                      ...prev,
                      defaultCapacity: Number.parseInt(e.target.value),
                    }))
                  }
                />
              </div>

              <Button onClick={handleGenerateSlots} disabled={isGenerating} className="w-full">
                <Zap className="h-4 w-4 mr-2" />
                {isGenerating ? "Génération en cours..." : "Générer les créneaux avec ces paramètres"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
