"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Calendar, Clock, FileText, Search, MapPin, Trash2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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
  created_at: string
  updated_at: string
  income: number
  profession: string
  property: {
    id: string
    title: string
    address: string
    city: string
    price: number
    property_images: Array<{ id: string; url: string; is_primary: boolean }>
    owner: {
      first_name: string
      last_name: string
    }
  }
  visits?: Array<{
    id: string
    visit_date: string
    start_time?: string
    end_time?: string
    status: string
  }>
}

// Composant popup pour la sélection de créneaux
function VisitSlotSelectionDialog({
  application,
  open,
  onOpenChange,
  onSlotConfirmed,
}: {
  application: Application
  open: boolean
  onOpenChange: (open: boolean) => void
  onSlotConfirmed: () => void
}) {
  const [availableSlots, setAvailableSlots] = useState<VisitSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    if (open && application) {
      loadAvailableSlots()
    }
  }, [open, application])

  const loadAvailableSlots = async () => {
    try {
      setLoading(true)
      console.log("🔍 Chargement créneaux pour candidature:", application.id)

      const response = await fetch(`/api/applications/${application.id}/available-slots`)
      if (response.ok) {
        const data = await response.json()
        console.log("✅ Créneaux disponibles:", data.slots?.length || 0)
        setAvailableSlots(data.slots || [])
      } else {
        const errorData = await response.json()
        console.error("❌ Erreur chargement créneaux:", errorData)
        toast.error("Erreur lors du chargement des créneaux")
      }
    } catch (error) {
      console.error("❌ Erreur:", error)
      toast.error("Erreur lors du chargement")
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
      console.log("✅ Confirmation créneau:", { applicationId: application.id, selectedSlot })

      const response = await fetch(`/api/applications/${application.id}/choose-visit-slot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slot_id: selectedSlot }),
      })

      if (response.ok) {
        toast.success("Créneau de visite confirmé !")
        onSlotConfirmed()
        onOpenChange(false)
        setSelectedSlot("")
        setSelectedDate(null)
      } else {
        const errorData = await response.json()
        console.error("❌ Erreur API:", errorData)
        toast.error(errorData.error || "Erreur lors de la confirmation")
      }
    } catch (error) {
      console.error("❌ Erreur confirmation:", error)
      toast.error("Erreur lors de la confirmation du créneau")
    } finally {
      setConfirming(false)
    }
  }

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
      const hasSlots = availableSlots.some((slot) => slot.date === dateStr)

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
    setSelectedSlot("") // Reset slot selection when changing date
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
    ? availableSlots
        .filter((slot) => slot.date === selectedDate)
        .sort((a, b) => a.start_time.localeCompare(b.start_time))
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
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Choisir un créneau de visite</DialogTitle>
        <DialogDescription>
          Sélectionnez le créneau qui vous convient le mieux pour visiter {application.property.title}
        </DialogDescription>
      </DialogHeader>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Chargement des créneaux...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendrier */}
          <div>
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
          </div>

          {/* Créneaux du jour sélectionné */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              {selectedDate ? `Créneaux du ${formatDateForDisplay(selectedDate)}` : "Sélectionnez une date"}
            </h3>

            {selectedDate ? (
              selectedDateSlots.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
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
                        setSelectedSlot(slot.id)
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
          </div>
        </div>
      )}

      {/* Bouton de confirmation */}
      {!loading && availableSlots.length > 0 && (
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleConfirmSlot} disabled={!selectedSlot || confirming}>
            {confirming ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Confirmation...
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
    </DialogContent>
  )
}

export default function TenantApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortOrder, setSortOrder] = useState("date-desc")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [showSlotDialog, setShowSlotDialog] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    try {
      setLoading(true)
      const user = await authService.getCurrentUser()
      if (!user || user.user_type !== "tenant") {
        toast.error("Vous devez être connecté en tant que locataire")
        return
      }

      setCurrentUser(user)
      console.log("🔍 Chargement candidatures pour:", user.id)

      const response = await fetch(`/api/applications?tenant_id=${user.id}`, {
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("📊 Réponse API:", response.status, data)
        setApplications(data.applications || [])
      } else {
        const errorData = await response.json()
        console.error("❌ Erreur API:", response.status, errorData)
        toast.error(errorData.error || "Erreur lors du chargement")
      }
    } catch (error) {
      console.error("❌ Erreur chargement candidatures:", error)
      toast.error("Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }

  const handleWithdrawApplication = async (applicationId: string) => {
    try {
      console.log("🗑️ Retrait candidature:", applicationId)

      const response = await fetch(`/api/applications?id=${applicationId}&tenant_id=${currentUser.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        toast.success("Candidature retirée avec succès")
        // Recharger les candidatures
        await loadApplications()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Erreur lors du retrait")
      }
    } catch (error) {
      console.error("❌ Erreur retrait candidature:", error)
      toast.error("Erreur lors du retrait de la candidature")
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary"
      case "under_review":
        return "secondary"
      case "visit_proposed":
        return "default"
      case "visit_scheduled":
        return "default"
      case "accepted":
        return "default"
      case "rejected":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "En attente"
      case "under_review":
        return "En cours d'analyse"
      case "visit_proposed":
        return "Créneaux proposés"
      case "visit_scheduled":
        return "Visite programmée"
      case "accepted":
        return "Dossier accepté"
      case "rejected":
        return "Refusé"
      default:
        return status
    }
  }

  const canWithdrawApplication = (status: string) => {
    return ["pending", "under_review", "visit_proposed"].includes(status)
  }

  // Filtrer les candidatures
  const filteredApplications = applications.filter((application) => {
    if (statusFilter !== "all" && application.status !== statusFilter) {
      return false
    }
    if (searchQuery && !application.property.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })

  // Trier les candidatures
  const sortedApplications = [...filteredApplications].sort((a, b) => {
    if (sortOrder === "date-desc") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    } else if (sortOrder === "date-asc") {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    }
    return 0
  })

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Chargement de vos candidatures...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Mes candidatures</h1>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="w-full md:w-1/2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher par nom de bien..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="under_review">En cours d'analyse</SelectItem>
              <SelectItem value="visit_proposed">Créneaux proposés</SelectItem>
              <SelectItem value="visit_scheduled">Visite programmée</SelectItem>
              <SelectItem value="accepted">Dossier accepté</SelectItem>
              <SelectItem value="rejected">Refusé</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Date (plus récent)</SelectItem>
              <SelectItem value="date-asc">Date (plus ancien)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-6">
        {sortedApplications.length > 0 ? (
          sortedApplications.map((application) => {
            const primaryImage =
              application.property.property_images?.find((img) => img.is_primary) ||
              application.property.property_images?.[0]

            return (
              <Card key={application.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-1/3 h-48 md:h-auto">
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
                    <div className="flex-1 p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h2 className="text-xl font-semibold">{application.property.title}</h2>
                          <div className="flex items-center text-muted-foreground mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>
                              {application.property.address}, {application.property.city}
                            </span>
                          </div>
                        </div>
                        <Badge variant={getStatusBadgeVariant(application.status)}>
                          {getStatusLabel(application.status)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-start">
                          <FileText className="h-5 w-5 mr-2 text-blue-600" />
                          <div>
                            <p className="font-medium">Candidature</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(application.created_at).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <Clock className="h-5 w-5 mr-2 text-blue-600" />
                          <div>
                            <p className="font-medium">Dernière mise à jour</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(application.updated_at).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="mr-2 flex items-center">
                            <span className="font-medium mr-2">Loyer</span>
                            <span className="text-lg font-bold">{application.property.price} €/mois</span>
                          </div>
                        </div>
                      </div>

                      {/* Créneaux proposés - nouveau statut */}
                      {application.status === "visit_proposed" && (
                        <div className="bg-blue-50 p-4 rounded-md mb-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 text-blue-600 mr-2" />
                              <span className="font-medium text-blue-800">Créneaux de visite proposés</span>
                            </div>
                            <Dialog open={showSlotDialog} onOpenChange={setShowSlotDialog}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    console.log("🔄 Ouverture popup sélection créneau:", application.id)
                                    setSelectedApplication(application)
                                  }}
                                >
                                  Choisir un créneau
                                </Button>
                              </DialogTrigger>
                              {selectedApplication && (
                                <VisitSlotSelectionDialog
                                  application={selectedApplication}
                                  open={showSlotDialog}
                                  onOpenChange={setShowSlotDialog}
                                  onSlotConfirmed={loadApplications}
                                />
                              )}
                            </Dialog>
                          </div>
                          <div className="text-sm text-blue-700">
                            Le propriétaire vous a proposé des créneaux de visite. Cliquez sur "Choisir un créneau" pour
                            sélectionner celui qui vous convient.
                          </div>
                        </div>
                      )}

                      {/* Visite programmée */}
                      {application.status === "visit_scheduled" &&
                        application.visits &&
                        application.visits.length > 0 && (
                          <div className="bg-green-50 p-3 rounded-md mb-4">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 text-green-600 mr-2" />
                              <span className="font-medium text-green-800">Visite confirmée</span>
                            </div>
                            {application.visits.map((visit) => (
                              <p key={visit.id} className="text-sm text-green-700 mt-1">
                                Le{" "}
                                {new Date(visit.visit_date).toLocaleDateString("fr-FR", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })}{" "}
                                {visit.start_time && visit.end_time && `de ${visit.start_time} à ${visit.end_time}`}
                              </p>
                            ))}
                          </div>
                        )}

                      {/* Statut visit_scheduled sans visite */}
                      {application.status === "visit_scheduled" &&
                        (!application.visits || application.visits.length === 0) && (
                          <div className="bg-orange-50 p-3 rounded-md mb-4">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 text-orange-600 mr-2" />
                              <span className="font-medium text-orange-800">Problème de synchronisation</span>
                            </div>
                            <p className="text-sm text-orange-700 mt-1">
                              Votre candidature indique qu'une visite est programmée mais aucune visite n'est trouvée.
                              Contactez le propriétaire pour clarifier.
                            </p>
                          </div>
                        )}

                      {application.status === "accepted" && (
                        <div className="bg-green-50 p-3 rounded-md mb-4">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 text-green-600 mr-2" />
                            <span className="font-medium text-green-800">
                              Félicitations ! Votre dossier a été accepté
                            </span>
                          </div>
                          <p className="text-sm text-green-700 mt-1">
                            Le propriétaire a accepté votre candidature. Vous allez bientôt recevoir le bail à signer.
                          </p>
                        </div>
                      )}

                      {application.status === "rejected" && (
                        <div className="bg-red-50 p-3 rounded-md mb-4">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 text-red-600 mr-2" />
                            <span className="font-medium text-red-800">Candidature refusée</span>
                          </div>
                          <p className="text-sm text-red-700 mt-1">
                            Votre candidature n'a pas été retenue pour ce bien.
                          </p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 justify-end">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/properties/${application.property.id}`}>Voir l'annonce</Link>
                        </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                      // Récupérer l'owner_id depuis la propriété
                      const ownerId = application.property.owner?.id
                      if (ownerId && application.property.id) {
                        router.push(`/tenant/messaging?owner_id=${ownerId}&property_id=${application.property.id}`)
                      } else {
                        toast.error("Impossible de contacter le propriétaire - informations manquantes")
                      }
                    }}
                  >
                    Contacter le propriétaire
                  </Button>
                        {canWithdrawApplication(application.status) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Retirer ma candidature
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Retirer votre candidature</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir retirer votre candidature pour "{application.property.title}"
                                  ? Cette action est irréversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleWithdrawApplication(application.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Retirer ma candidature
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        {application.status === "visit_scheduled" && (
                          <Button size="sm" asChild>
                            <Link href="/tenant/visits">Voir mes visites</Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="text-center py-12">
            <div className="bg-gray-100 p-6 rounded-full inline-block mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucune candidature trouvée</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== "all"
                ? "Aucune candidature ne correspond à vos critères de recherche."
                : "Vous n'avez pas encore postulé à des annonces."}
            </p>
            <Button asChild>
              <Link href="/tenant/search">Rechercher des biens</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}