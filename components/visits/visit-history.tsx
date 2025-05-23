"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HomeIcon, CalendarIcon, ClockIcon, MapPinIcon, UserIcon, CheckCircleIcon, XCircleIcon } from "lucide-react"

export function VisitHistory() {
  // Mock data - in real app, this would come from API
  const completedVisits = [
    {
      id: 1,
      propertyTitle: "Loft moderne - Bastille",
      propertyAddress: "12 rue de la Roquette, 75011 Paris",
      landlordName: "M. Leroy",
      date: "2025-05-15",
      startTime: "16:00",
      endTime: "16:30",
      status: "completed",
      feedback: "Visite très positive. Le bien correspond parfaitement à la description.",
    },
    {
      id: 2,
      propertyTitle: "Appartement 2 pièces - Montmartre",
      propertyAddress: "5 rue des Abbesses, 75018 Paris",
      landlordName: "Mme Bernard",
      date: "2025-05-10",
      startTime: "11:00",
      endTime: "11:30",
      status: "completed",
      feedback: "Bonne visite mais le bien est un peu plus petit que prévu.",
    },
  ]

  const cancelledVisits = [
    {
      id: 3,
      propertyTitle: "Maison 4 pièces - Montreuil",
      propertyAddress: "25 avenue de la République, 93100 Montreuil",
      landlordName: "M. Dubois",
      date: "2025-05-08",
      startTime: "14:00",
      endTime: "14:30",
      status: "cancelled",
      cancelReason: "Empêchement de dernière minute",
      cancelledBy: "tenant",
    },
    {
      id: 4,
      propertyTitle: "Duplex avec terrasse - Nation",
      propertyAddress: "8 rue des Boulets, 75011 Paris",
      landlordName: "Mme Martin",
      date: "2025-05-05",
      startTime: "17:00",
      endTime: "17:30",
      status: "cancelled",
      cancelReason: "Bien déjà loué",
      cancelledBy: "landlord",
    },
  ]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getStatusBadge = (status: string, cancelledBy?: string) => {
    if (status === "completed") {
      return (
        <Badge className="bg-green-500">
          <CheckCircleIcon className="h-3 w-3 mr-1" />
          Effectuée
        </Badge>
      )
    } else if (status === "cancelled") {
      return (
        <Badge variant="destructive">
          <XCircleIcon className="h-3 w-3 mr-1" />
          {cancelledBy === "tenant" ? "Annulée par vous" : "Annulée par le propriétaire"}
        </Badge>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="completed" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="completed">Visites effectuées</TabsTrigger>
          <TabsTrigger value="cancelled">Visites annulées</TabsTrigger>
        </TabsList>

        <TabsContent value="completed">
          {completedVisits.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircleIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune visite effectuée</h3>
              <p className="text-muted-foreground">Vous n'avez pas encore effectué de visite.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedVisits.map((visit) => (
                <Card key={visit.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1 space-y-4">
                        {/* Property and landlord info */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-lg font-semibold">{visit.propertyTitle}</h3>
                            {getStatusBadge(visit.status)}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground mb-2">
                            <MapPinIcon className="h-4 w-4 mr-1" />
                            {visit.propertyAddress}
                          </div>
                        </div>

                        {/* Visit details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <h4 className="font-medium">Date et heure</h4>
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                              <span>{formatDate(visit.date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <ClockIcon className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {visit.startTime} - {visit.endTime}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-medium">Propriétaire</h4>
                            <div className="flex items-center gap-2">
                              <UserIcon className="h-4 w-4 text-muted-foreground" />
                              <span>{visit.landlordName}</span>
                            </div>
                          </div>
                        </div>

                        {/* Feedback */}
                        {visit.feedback && (
                          <div className="space-y-2">
                            <h4 className="font-medium">Votre retour</h4>
                            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">{visit.feedback}</p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col justify-end min-w-48">
                        <Button variant="link" size="sm" className="text-muted-foreground">
                          <HomeIcon className="h-4 w-4 mr-1" />
                          Voir le bien
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cancelled">
          {cancelledVisits.length === 0 ? (
            <div className="text-center py-12">
              <XCircleIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune visite annulée</h3>
              <p className="text-muted-foreground">Vous n'avez pas de visites annulées.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cancelledVisits.map((visit) => (
                <Card key={visit.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1 space-y-4">
                        {/* Property and landlord info */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-lg font-semibold">{visit.propertyTitle}</h3>
                            {getStatusBadge(visit.status, visit.cancelledBy)}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground mb-2">
                            <MapPinIcon className="h-4 w-4 mr-1" />
                            {visit.propertyAddress}
                          </div>
                        </div>

                        {/* Visit details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <h4 className="font-medium">Date et heure prévues</h4>
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                              <span>{formatDate(visit.date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <ClockIcon className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {visit.startTime} - {visit.endTime}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-medium">Propriétaire</h4>
                            <div className="flex items-center gap-2">
                              <UserIcon className="h-4 w-4 text-muted-foreground" />
                              <span>{visit.landlordName}</span>
                            </div>
                          </div>
                        </div>

                        {/* Cancellation reason */}
                        {visit.cancelReason && (
                          <div className="space-y-2">
                            <h4 className="font-medium">Motif d'annulation</h4>
                            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                              {visit.cancelReason}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col justify-end min-w-48">
                        <Button variant="link" size="sm" className="text-muted-foreground">
                          <HomeIcon className="h-4 w-4 mr-1" />
                          Voir le bien
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
