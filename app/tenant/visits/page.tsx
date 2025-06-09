"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Calendar, Clock, MapPin, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { authService } from "@/lib/auth-service"
import { visitService } from "@/lib/visit-service"
import { toast } from "sonner"

export default function VisitsPage() {
  const [activeTab, setActiveTab] = useState("upcoming")
  const [visits, setVisits] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedVisit, setSelectedVisit] = useState<any>(null)
  const [feedbackDialog, setFeedbackDialog] = useState(false)
  const [feedbackRating, setFeedbackRating] = useState<number>(0)
  const [feedbackComment, setFeedbackComment] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("🏠 Chargement des visites locataire...")
        setIsLoading(true)

        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "tenant") {
          toast.error("Vous devez être connecté en tant que locataire")
          return
        }

        setCurrentUser(user)
        console.log("👤 Utilisateur locataire:", user.id)

        // Récupérer les visites du locataire
        const visitsData = await visitService.getTenantVisits(user.id)
        console.log("📅 Visites récupérées:", visitsData.length)
        console.log("📅 Structure première visite:", visitsData[0]) // Debug
        setVisits(visitsData)
      } catch (error) {
        console.error("❌ Erreur chargement visites:", error)
        toast.error("Erreur lors du chargement des visites")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Fonction utilitaire pour extraire la date au format YYYY-MM-DD
  const extractDate = (dateString: string) => {
    if (!dateString) return ""
    // Si c'est déjà au bon format, on le retourne
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return dateString
    // Sinon on extrait la partie date de l'ISO string
    return dateString.split("T")[0]
  }

  const upcomingVisits = visits.filter((visit) => {
    const visitDate = extractDate(visit.visit_date)
    const visitTime = visit.start_time || visit.visit_time || "00:00"
    const visitDateTime = new Date(`${visitDate}T${visitTime}`)
    const now = new Date()
    const isUpcoming = visitDateTime > now
    const hasValidStatus = ["scheduled", "confirmed", "proposed"].includes(visit.status)

    console.log("🔍 Analyse visite:", {
      id: visit.id,
      original_date: visit.visit_date,
      extracted_date: visitDate,
      time: visitTime,
      status: visit.status,
      dateTime: visitDateTime.toISOString(),
      now: now.toISOString(),
      isUpcoming,
      hasValidStatus,
      willShow: isUpcoming && hasValidStatus,
    })

    return isUpcoming && hasValidStatus
  })

  console.log("📅 Visites à venir filtrées:", upcomingVisits.length)

  const pastVisits = visits.filter((visit) => {
    const visitDate = extractDate(visit.visit_date)
    const visitTime = visit.start_time || visit.visit_time || "00:00"
    const visitDateTime = new Date(`${visitDate}T${visitTime}`)
    return visitDateTime <= new Date() || ["completed", "cancelled", "no_show"].includes(visit.status)
  })

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "proposed":
        return "secondary"
      case "confirmed":
      case "scheduled":
        return "default"
      case "completed":
        return "default"
      case "cancelled":
      case "no_show":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "proposed":
        return "Proposée"
      case "confirmed":
        return "Confirmée"
      case "scheduled":
        return "Programmée"
      case "completed":
        return "Terminée"
      case "cancelled":
        return "Annulée"
      case "no_show":
        return "Absent"
      default:
        return status
    }
  }

  const formatDateTime = (dateString: string, timeString?: string) => {
    const date = new Date(extractDate(dateString))
    const time = timeString || "00:00"

    return {
      date: date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
      time: time,
      full: `${date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })} à ${time}`,
    }
  }

  const handleConfirmVisit = async (visitId: string) => {
    try {
      await visitService.updateVisitStatus(visitId, "confirmed")
      toast.success("Visite confirmée")

      // Recharger les visites
      const visitsData = await visitService.getTenantVisits(currentUser.id)
      setVisits(visitsData)
    } catch (error) {
      console.error("❌ Erreur confirmation visite:", error)
      toast.error("Erreur lors de la confirmation")
    }
  }

  const handleCancelVisit = async (visitId: string) => {
    try {
      await visitService.updateVisitStatus(visitId, "cancelled")
      toast.success("Visite annulée")

      // Recharger les visites
      const visitsData = await visitService.getTenantVisits(currentUser.id)
      setVisits(visitsData)
    } catch (error) {
      console.error("❌ Erreur annulation visite:", error)
      toast.error("Erreur lors de l'annulation")
    }
  }

  const handleSubmitFeedback = async () => {
    if (!selectedVisit) return

    try {
      // Ici on pourrait ajouter un service pour les feedbacks
      toast.success("Avis enregistré")
      setFeedbackDialog(false)
    } catch (error) {
      console.error("❌ Erreur feedback:", error)
      toast.error("Erreur lors de l'enregistrement")
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Chargement de vos visites...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <p className="text-red-600">Vous devez être connecté pour voir vos visites</p>
          <Link href="/login">
            <Button className="mt-4">Se connecter</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Mes visites</h1>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="upcoming">À venir ({upcomingVisits.length})</TabsTrigger>
          <TabsTrigger value="past">Passées ({pastVisits.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-6">
          {upcomingVisits.length > 0 ? (
            upcomingVisits.map((visit) => (
              <Card key={visit.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-1/3 h-48 md:h-auto">
                      <img
                        src={visit.property?.property_images?.[0]?.url || "/placeholder.svg?height=200&width=300"}
                        alt={visit.property?.title || "Propriété"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h2 className="text-xl font-semibold">{visit.property?.title || "Propriété"}</h2>
                          <div className="flex items-center text-muted-foreground mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            {visit.property?.address || "Adresse non disponible"}
                          </div>
                        </div>
                        <Badge variant={getStatusBadgeVariant(visit.status)}>{getStatusText(visit.status)}</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-start">
                          <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                          <div>
                            <p className="font-medium">
                              {formatDateTime(visit.visit_date, visit.start_time || visit.visit_time).date}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDateTime(visit.visit_date, visit.start_time || visit.visit_time).time}
                            </p>
                          </div>
                        </div>
                        {visit.property?.owner && (
                          <div className="flex items-start">
                            <User className="h-5 w-5 mr-2 text-blue-600" />
                            <div>
                              <p className="font-medium">
                                {visit.property.owner.first_name} {visit.property.owner.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {visit.property.owner.phone || visit.property.owner.email}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {visit.notes && (
                        <div className="bg-gray-50 p-3 rounded-md mb-4">
                          <p className="text-sm">{visit.notes}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 justify-end">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/properties/${visit.property_id}`}>Voir l'annonce</Link>
                        </Button>

                        {visit.status === "proposed" && (
                          <>
                            <Button size="sm" onClick={() => handleConfirmVisit(visit.id)}>
                              Confirmer la visite
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleCancelVisit(visit.id)}>
                              Refuser
                            </Button>
                          </>
                        )}

                        {visit.status === "confirmed" && (
                          <Button size="sm" variant="destructive" onClick={() => handleCancelVisit(visit.id)}>
                            Annuler la visite
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-100 p-6 rounded-full inline-block mb-4">
                <Calendar className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Aucune visite à venir</h3>
              <p className="text-muted-foreground mb-4">
                Vous n'avez pas encore de visites programmées. Postulez à des annonces pour organiser des visites.
              </p>
              <Button asChild>
                <Link href="/properties">Voir les annonces</Link>
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-6">
          {pastVisits.length > 0 ? (
            pastVisits.map((visit) => (
              <Card key={visit.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-1/3 h-48 md:h-auto">
                      <img
                        src={visit.property?.property_images?.[0]?.url || "/placeholder.svg?height=200&width=300"}
                        alt={visit.property?.title || "Propriété"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h2 className="text-xl font-semibold">{visit.property?.title || "Propriété"}</h2>
                          <div className="flex items-center text-muted-foreground mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            {visit.property?.address || "Adresse non disponible"}
                          </div>
                        </div>
                        <Badge variant={getStatusBadgeVariant(visit.status)}>{getStatusText(visit.status)}</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-start">
                          <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                          <div>
                            <p className="font-medium">
                              {formatDateTime(visit.visit_date, visit.start_time || visit.visit_time).date}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDateTime(visit.visit_date, visit.start_time || visit.visit_time).time}
                            </p>
                          </div>
                        </div>
                        {visit.property?.owner && (
                          <div className="flex items-start">
                            <User className="h-5 w-5 mr-2 text-blue-600" />
                            <div>
                              <p className="font-medium">
                                {visit.property.owner.first_name} {visit.property.owner.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {visit.property.owner.phone || visit.property.owner.email}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {visit.notes && (
                        <div className="bg-gray-50 p-3 rounded-md mb-4">
                          <p className="text-sm">{visit.notes}</p>
                        </div>
                      )}

                      {visit.feedback && (
                        <div className="bg-blue-50 p-3 rounded-md mb-4">
                          <div className="flex items-center mb-1">
                            <p className="font-medium text-blue-800">Votre avis sur ce bien</p>
                            <div className="ml-2 flex">
                              {[...Array(5)].map((_, i) => (
                                <StarComponent
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < visit.feedback.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-blue-700">{visit.feedback.comment}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 justify-end">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/properties/${visit.property_id}`}>Voir l'annonce</Link>
                        </Button>
                        {visit.status === "completed" && !visit.feedback && (
                          <Dialog open={feedbackDialog} onOpenChange={setFeedbackDialog}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedVisit(visit)
                                  setFeedbackRating(0)
                                  setFeedbackComment("")
                                }}
                              >
                                Donner mon avis
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Votre avis sur la visite</DialogTitle>
                                <DialogDescription>
                                  Partagez votre expérience concernant la visite de {selectedVisit?.property?.title}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label>Comment évaluez-vous ce bien ?</Label>
                                  <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((rating) => (
                                      <Button
                                        key={rating}
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className={`h-10 w-10 ${
                                          feedbackRating >= rating ? "bg-yellow-50 border-yellow-300" : ""
                                        }`}
                                        onClick={() => setFeedbackRating(rating)}
                                      >
                                        <StarComponent
                                          className={`h-5 w-5 ${
                                            feedbackRating >= rating
                                              ? "fill-yellow-400 text-yellow-400"
                                              : "text-gray-300"
                                          }`}
                                        />
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="comment">Commentaire</Label>
                                  <Textarea
                                    id="comment"
                                    placeholder="Partagez votre impression sur ce bien..."
                                    value={feedbackComment}
                                    onChange={(e) => setFeedbackComment(e.target.value)}
                                    rows={4}
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setFeedbackDialog(false)}>
                                  Annuler
                                </Button>
                                <Button onClick={handleSubmitFeedback} disabled={feedbackRating === 0}>
                                  Envoyer mon avis
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-100 p-6 rounded-full inline-block mb-4">
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Aucune visite passée</h3>
              <p className="text-muted-foreground">L'historique de vos visites apparaîtra ici.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Composant Star pour les évaluations
function StarComponent(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}
