"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  MessageSquareIcon,
  PhoneIcon,
  MailIcon,
} from "lucide-react"

interface PropertyVisitsProps {
  propertyId: number
}

export function PropertyVisits({ propertyId }: PropertyVisitsProps) {
  // Mock data - in real app, this would come from API
  const [visits] = useState([
    {
      id: 1,
      tenantName: "Marie Dupont",
      tenantEmail: "marie.dupont@email.com",
      tenantPhone: "06 12 34 56 78",
      requestedDate: "2025-05-25",
      requestedTime: "14:00",
      status: "pending",
      message:
        "Bonjour, je suis très intéressée par votre appartement. Serait-il possible de le visiter samedi après-midi ?",
      submittedAt: "2025-05-20T10:30:00",
    },
    {
      id: 2,
      tenantName: "Pierre Martin",
      tenantEmail: "pierre.martin@email.com",
      tenantPhone: "06 98 76 54 32",
      requestedDate: "2025-05-24",
      requestedTime: "16:30",
      status: "confirmed",
      message: "Je souhaiterais visiter l'appartement vendredi en fin d'après-midi si possible.",
      submittedAt: "2025-05-19T14:15:00",
      confirmedDate: "2025-05-24",
      confirmedTime: "16:30",
    },
    {
      id: 3,
      tenantName: "Sophie Leroy",
      tenantEmail: "sophie.leroy@email.com",
      tenantPhone: "06 11 22 33 44",
      requestedDate: "2025-05-23",
      requestedTime: "10:00",
      status: "completed",
      message: "Bonjour, nous sommes une famille avec deux enfants et cherchons un logement dans ce quartier.",
      submittedAt: "2025-05-18T09:00:00",
      confirmedDate: "2025-05-23",
      confirmedTime: "10:00",
      completedAt: "2025-05-23T10:45:00",
      feedback: "Visite très positive, les visiteurs étaient très intéressés.",
    },
    {
      id: 4,
      tenantName: "Thomas Dubois",
      tenantEmail: "thomas.dubois@email.com",
      tenantPhone: "06 55 44 33 22",
      requestedDate: "2025-05-22",
      requestedTime: "18:00",
      status: "cancelled",
      message: "Je travaille en freelance et cherche un espace avec une bonne connexion internet.",
      submittedAt: "2025-05-17T16:45:00",
      cancelledAt: "2025-05-22T08:00:00",
      cancelReason: "Empêchement de dernière minute du visiteur",
    },
  ])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            <ClockIcon className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        )
      case "confirmed":
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Confirmée
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Terminée
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <XCircleIcon className="h-3 w-3 mr-1" />
            Annulée
          </Badge>
        )
      default:
        return <Badge variant="outline">Inconnu</Badge>
    }
  }

  const filterByStatus = (status: string) => {
    if (status === "all") return visits
    return visits.filter((visit) => visit.status === status)
  }

  const handleConfirmVisit = (visitId: number) => {
    console.log("Confirming visit:", visitId)
    // Here you would typically call an API to confirm the visit
  }

  const handleRejectVisit = (visitId: number) => {
    console.log("Rejecting visit:", visitId)
    // Here you would typically call an API to reject the visit
  }

  const handleCompleteVisit = (visitId: number) => {
    console.log("Completing visit:", visitId)
    // Here you would typically call an API to mark the visit as completed
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{filterByStatus("pending").length}</p>
              <p className="text-sm text-muted-foreground">En attente</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{filterByStatus("confirmed").length}</p>
              <p className="text-sm text-muted-foreground">Confirmées</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{filterByStatus("completed").length}</p>
              <p className="text-sm text-muted-foreground">Terminées</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{filterByStatus("cancelled").length}</p>
              <p className="text-sm text-muted-foreground">Annulées</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visits Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="pending">En attente</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmées</TabsTrigger>
            <TabsTrigger value="completed">Terminées</TabsTrigger>
          </TabsList>
          <Select defaultValue="date">
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date de visite</SelectItem>
              <SelectItem value="submitted">Date de demande</SelectItem>
              <SelectItem value="status">Statut</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="all">
          <div className="space-y-4">
            {visits.map((visit) => (
              <Card key={visit.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <UserIcon className="h-5 w-5" />
                        {visit.tenantName}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Demande soumise le {new Date(visit.submittedAt).toLocaleDateString("fr-FR")}
                      </CardDescription>
                    </div>
                    {getStatusBadge(visit.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Visit Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        Date et heure demandées
                      </h4>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Date:</span>
                          <span className="font-medium">
                            {new Date(visit.requestedDate).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Heure:</span>
                          <span className="font-medium">{visit.requestedTime}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Contact</h4>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <MailIcon className="h-3 w-3 text-muted-foreground" />
                          <span>{visit.tenantEmail}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <PhoneIcon className="h-3 w-3 text-muted-foreground" />
                          <span>{visit.tenantPhone}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Confirmed Details */}
                  {visit.status === "confirmed" && visit.confirmedDate && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-2">Visite confirmée</h4>
                      <div className="text-sm text-blue-700">
                        <div>Date: {new Date(visit.confirmedDate).toLocaleDateString("fr-FR")}</div>
                        <div>Heure: {visit.confirmedTime}</div>
                      </div>
                    </div>
                  )}

                  {/* Completion Details */}
                  {visit.status === "completed" && visit.feedback && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-medium text-green-900 mb-2">Visite terminée</h4>
                      <p className="text-sm text-green-700">{visit.feedback}</p>
                    </div>
                  )}

                  {/* Cancellation Details */}
                  {visit.status === "cancelled" && visit.cancelReason && (
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <h4 className="font-medium text-red-900 mb-2">Visite annulée</h4>
                      <p className="text-sm text-red-700">{visit.cancelReason}</p>
                    </div>
                  )}

                  {/* Message */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Message du visiteur</h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">{visit.message}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button variant="outline" size="sm">
                      <MessageSquareIcon className="h-4 w-4 mr-1" />
                      Contacter
                    </Button>
                    {visit.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleConfirmVisit(visit.id)}
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Confirmer
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleRejectVisit(visit.id)}>
                          <XCircleIcon className="h-4 w-4 mr-1" />
                          Refuser
                        </Button>
                      </>
                    )}
                    {visit.status === "confirmed" && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleCompleteVisit(visit.id)}
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Marquer comme terminée
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <div className="space-y-4">
            {filterByStatus("pending").map((visit) => (
              <Card key={visit.id}>
                <CardContent className="pt-6">
                  <h3 className="font-semibold">{visit.tenantName}</h3>
                  <p className="text-muted-foreground">
                    Demande pour le {new Date(visit.requestedDate).toLocaleDateString("fr-FR")} à {visit.requestedTime}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="confirmed">
          <div className="space-y-4">
            {filterByStatus("confirmed").map((visit) => (
              <Card key={visit.id}>
                <CardContent className="pt-6">
                  <h3 className="font-semibold">{visit.tenantName}</h3>
                  <p className="text-muted-foreground">
                    Visite confirmée le {new Date(visit.confirmedDate!).toLocaleDateString("fr-FR")} à{" "}
                    {visit.confirmedTime}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <div className="space-y-4">
            {filterByStatus("completed").map((visit) => (
              <Card key={visit.id}>
                <CardContent className="pt-6">
                  <h3 className="font-semibold">{visit.tenantName}</h3>
                  <p className="text-muted-foreground">
                    Visite terminée le {new Date(visit.completedAt!).toLocaleDateString("fr-FR")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
