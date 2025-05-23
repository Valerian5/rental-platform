"use client"

import { useState } from "react"
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

// Données simulées
const visits = [
  {
    id: 1,
    property: {
      id: 1,
      title: "Appartement moderne au centre-ville",
      address: "123 Rue Principale, Paris",
      price: 1200,
      image: "/placeholder.svg?height=200&width=300",
    },
    date: "2023-05-25T14:00:00",
    status: "Confirmée",
    contactPerson: "Marie Leroy",
    contactPhone: "06 23 45 67 89",
    notes: "Interphone au nom de Leroy. 3ème étage avec ascenseur.",
  },
  {
    id: 2,
    property: {
      id: 2,
      title: "Studio lumineux proche des transports",
      address: "45 Avenue des Fleurs, Paris",
      price: 850,
      image: "/placeholder.svg?height=200&width=300",
    },
    date: "2023-05-27T11:00:00",
    status: "En attente",
    contactPerson: "Jean Dupont",
    contactPhone: "06 12 34 56 78",
    notes: "",
  },
  {
    id: 3,
    property: {
      id: 3,
      title: "Loft industriel spacieux",
      address: "12 Rue des Artistes, Paris",
      price: 1500,
      image: "/placeholder.svg?height=200&width=300",
    },
    date: "2023-05-20T10:30:00",
    status: "Terminée",
    contactPerson: "Pierre Martin",
    contactPhone: "06 34 56 78 90",
    notes: "Visite effectuée. Dossier en cours d'analyse.",
    feedback: {
      rating: 4,
      comment: "Très bel appartement, lumineux et spacieux. Quelques travaux de rafraîchissement à prévoir.",
    },
  },
  {
    id: 4,
    property: {
      id: 4,
      title: "Maison familiale avec jardin",
      address: "78 Rue des Jardins, Banlieue de Paris",
      price: 1800,
      image: "/placeholder.svg?height=200&width=300",
    },
    date: "2023-05-18T16:00:00",
    status: "Annulée",
    contactPerson: "Sophie Bernard",
    contactPhone: "06 45 67 89 01",
    notes: "Annulée par le propriétaire.",
  },
]

export default function VisitsPage() {
  const [activeTab, setActiveTab] = useState("upcoming")
  const [selectedVisit, setSelectedVisit] = useState<any>(null)
  const [feedbackDialog, setFeedbackDialog] = useState(false)
  const [feedbackRating, setFeedbackRating] = useState<number>(0)
  const [feedbackComment, setFeedbackComment] = useState("")

  const upcomingVisits = visits.filter((visit) => ["Confirmée", "En attente"].includes(visit.status))
  const pastVisits = visits.filter((visit) => ["Terminée", "Annulée"].includes(visit.status))

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Confirmée":
        return "success"
      case "En attente":
        return "secondary"
      case "Terminée":
        return "default"
      case "Annulée":
        return "destructive"
      default:
        return "outline"
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
      time: date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      full: date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }
  }

  const handleSubmitFeedback = () => {
    // Logique pour soumettre le feedback
    setFeedbackDialog(false)
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
                        src={visit.property.image || "/placeholder.svg"}
                        alt={visit.property.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h2 className="text-xl font-semibold">{visit.property.title}</h2>
                          <div className="flex items-center text-muted-foreground mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            {visit.property.address}
                          </div>
                        </div>
                        <Badge variant={getStatusBadgeVariant(visit.status)}>{visit.status}</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-start">
                          <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                          <div>
                            <p className="font-medium">{formatDateTime(visit.date).date}</p>
                            <p className="text-sm text-muted-foreground">{formatDateTime(visit.date).time}</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <User className="h-5 w-5 mr-2 text-blue-600" />
                          <div>
                            <p className="font-medium">{visit.contactPerson}</p>
                            <p className="text-sm text-muted-foreground">{visit.contactPhone}</p>
                          </div>
                        </div>
                      </div>

                      {visit.notes && (
                        <div className="bg-gray-50 p-3 rounded-md mb-4">
                          <p className="text-sm">{visit.notes}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 justify-end">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/properties/${visit.property.id}`}>Voir l'annonce</Link>
                        </Button>
                        <Button variant="outline" size="sm">
                          Contacter le propriétaire
                        </Button>
                        {visit.status === "En attente" && (
                          <Button size="sm" variant="default">
                            Confirmer la visite
                          </Button>
                        )}
                        <Button size="sm" variant="destructive">
                          Annuler la visite
                        </Button>
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
                        src={visit.property.image || "/placeholder.svg"}
                        alt={visit.property.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h2 className="text-xl font-semibold">{visit.property.title}</h2>
                          <div className="flex items-center text-muted-foreground mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            {visit.property.address}
                          </div>
                        </div>
                        <Badge variant={getStatusBadgeVariant(visit.status)}>{visit.status}</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-start">
                          <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                          <div>
                            <p className="font-medium">{formatDateTime(visit.date).date}</p>
                            <p className="text-sm text-muted-foreground">{formatDateTime(visit.date).time}</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <User className="h-5 w-5 mr-2 text-blue-600" />
                          <div>
                            <p className="font-medium">{visit.contactPerson}</p>
                            <p className="text-sm text-muted-foreground">{visit.contactPhone}</p>
                          </div>
                        </div>
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
                                <Star
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
                          <Link href={`/properties/${visit.property.id}`}>Voir l'annonce</Link>
                        </Button>
                        {visit.status === "Terminée" && !visit.feedback && (
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
                                  Partagez votre expérience concernant la visite de {selectedVisit?.property.title}
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
                                        <Star
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
function Star(props: any) {
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
