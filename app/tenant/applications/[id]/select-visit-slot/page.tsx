"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Calendar, Clock, MapPin, User, ArrowLeft, CheckCircle, Filter, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
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

export default function SelectVisitSlotPage() {
  const params = useParams()
  const router = useRouter()
  const applicationId = params.id as string

  const [application, setApplication] = useState<Application | null>(null)
  const [availableSlots, setAvailableSlots] = useState<VisitSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)

  // Filtres et affichage
  const [timeFilter, setTimeFilter] = useState<string>("all")
  const [visitTypeFilter, setVisitTypeFilter] = useState<string>("all")
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())
  const [showAllDates, setShowAllDates] = useState(false)

  useEffect(() => {
    loadApplicationAndSlots()
  }, [applicationId])

  const loadApplicationAndSlots = async () => {
    try {
      setLoading(true)

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
        setAvailableSlots(slotsData.slots || [])

        // Ouvrir automatiquement les 3 premières dates
        const dates = [...new Set(slotsData.slots?.map((slot: VisitSlot) => slot.date) || [])]
        setExpandedDates(new Set(dates.slice(0, 3)))
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

  const handleConfirmSlot = async () => {
    if (!selectedSlot) {
      toast.error("Veuillez sélectionner un créneau")
      return
    }

    try {
      setConfirming(true)

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

  // Filtrer les créneaux
  const filteredSlots = useMemo(() => {
    return availableSlots.filter((slot) => {
      // Filtre par heure
      if (timeFilter !== "all") {
        const hour = Number.parseInt(slot.start_time.split(":")[0])
        if (timeFilter === "morning" && (hour < 8 || hour >= 12)) return false
        if (timeFilter === "afternoon" && (hour < 12 || hour >= 17)) return false
        if (timeFilter === "evening" && (hour < 17 || hour >= 21)) return false
      }

      // Filtre par type de visite
      if (visitTypeFilter !== "all") {
        if (visitTypeFilter === "individual" && slot.is_group_visit) return false
        if (visitTypeFilter === "group" && !slot.is_group_visit) return false
      }

      return true
    })
  }, [availableSlots, timeFilter, visitTypeFilter])

  // Grouper les créneaux par date
  const slotsByDate = useMemo(() => {
    return filteredSlots.reduce(
      (acc, slot) => {
        if (!acc[slot.date]) {
          acc[slot.date] = []
        }
        acc[slot.date].push(slot)
        return acc
      },
      {} as Record<string, VisitSlot[]>,
    )
  }, [filteredSlots])

  const sortedDates = Object.keys(slotsByDate).sort()
  const displayedDates = showAllDates ? sortedDates : sortedDates.slice(0, 7)

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
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

  const toggleDateExpansion = (date: string) => {
    const newExpanded = new Set(expandedDates)
    if (newExpanded.has(date)) {
      newExpanded.delete(date)
    } else {
      newExpanded.add(date)
    }
    setExpandedDates(newExpanded)
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations du bien */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Informations du bien</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video rounded-lg overflow-hidden">
                <img
                  src={primaryImage?.url || "/placeholder.svg?height=200&width=300&text=Pas d'image"}
                  alt={application.property.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = "/placeholder.svg?height=200&width=300&text=Image non disponible"
                  }}
                />
              </div>

              <div>
                <h3 className="font-semibold text-lg">{application.property.title}</h3>
                <div className="flex items-center text-muted-foreground mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>
                    {application.property.address}, {application.property.city}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">Loyer</span>
                <span className="text-lg font-bold">{application.property.price} €/mois</span>
              </div>

              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Propriétaire : {application.owner.first_name} {application.owner.last_name}
                </span>
              </div>

              {/* Statistiques */}
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Créneaux disponibles</span>
                  <span className="font-medium">{filteredSlots.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Dates proposées</span>
                  <span className="font-medium">{Object.keys(slotsByDate).length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Créneaux disponibles */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Créneaux disponibles ({filteredSlots.length})
                </CardTitle>
                <Filter className="h-4 w-4 text-muted-foreground" />
              </div>

              {/* Filtres */}
              <div className="flex gap-4 mt-4">
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrer par heure" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toute la journée</SelectItem>
                    <SelectItem value="morning">Matin (8h-12h)</SelectItem>
                    <SelectItem value="afternoon">Après-midi (12h-17h)</SelectItem>
                    <SelectItem value="evening">Soirée (17h-21h)</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={visitTypeFilter} onValueChange={setVisitTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Type de visite" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous types</SelectItem>
                    <SelectItem value="individual">Visite individuelle</SelectItem>
                    <SelectItem value="group">Visite groupée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {Object.keys(slotsByDate).length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Aucun créneau disponible</h3>
                  <p className="text-muted-foreground">
                    Aucun créneau ne correspond à vos filtres ou tous sont réservés.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayedDates.map((date) => {
                    const slots = slotsByDate[date].sort((a, b) => a.start_time.localeCompare(b.start_time))
                    const isExpanded = expandedDates.has(date)
                    const displayedSlots = isExpanded ? slots : slots.slice(0, 3)

                    return (
                      <Collapsible key={date} open={isExpanded} onOpenChange={() => toggleDateExpansion(date)}>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                            <h4 className="font-semibold text-lg text-blue-800">{formatDate(date)}</h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{slots.length} créneaux</Badge>
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </div>
                          </Button>
                        </CollapsibleTrigger>

                        <CollapsibleContent className="mt-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {displayedSlots.map((slot) => (
                              <div
                                key={slot.id}
                                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                  selectedSlot === slot.id
                                    ? "border-blue-500 bg-blue-50 shadow-md"
                                    : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                                }`}
                                onClick={() => setSelectedSlot(slot.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4 text-blue-600" />
                                      <span className="font-medium">
                                        {slot.start_time} - {slot.end_time}
                                      </span>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                      {calculateDuration(slot.start_time, slot.end_time)}
                                    </Badge>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {slot.is_group_visit && (
                                      <Badge variant="secondary" className="text-xs">
                                        Groupée
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className="text-xs">
                                      {slot.max_capacity - slot.current_bookings} place(s)
                                    </Badge>
                                    {selectedSlot === slot.id && <CheckCircle className="h-5 w-5 text-blue-600" />}
                                  </div>
                                </div>

                                {slot.is_group_visit && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Cette visite peut être partagée avec d'autres candidats
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>

                          {!isExpanded && slots.length > 3 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full mt-2"
                              onClick={() => toggleDateExpansion(date)}
                            >
                              Voir {slots.length - 3} créneaux de plus
                            </Button>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    )
                  })}

                  {!showAllDates && sortedDates.length > 7 && (
                    <Button variant="outline" className="w-full" onClick={() => setShowAllDates(true)}>
                      Voir {sortedDates.length - 7} dates supplémentaires
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bouton de confirmation */}
          {filteredSlots.length > 0 && (
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleConfirmSlot}
                disabled={!selectedSlot || confirming}
                size="lg"
                className="min-w-[200px]"
              >
                {confirming ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Confirmation...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmer ce créneau
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
