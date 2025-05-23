"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import {
  HomeIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  SearchIcon,
  MessageSquareIcon,
  EyeIcon,
} from "lucide-react"

export function VisitManagement() {
  // Mock data - in real app, this would come from API
  const visits = [
    {
      id: 1,
      propertyTitle: "Appartement 3P - Belleville",
      propertyAddress: "15 rue de Belleville, 75020 Paris",
      tenantName: "Marie Dupont",
      tenantEmail: "marie.dupont@email.com",
      requestedAt: "2025-05-20T10:30:00",
      status: "pending",
      slots: [
        { date: "2025-05-25", startTime: "14:00", endTime: "14:30" },
        { date: "2025-05-26", startTime: "16:00", endTime: "16:30" },
        { date: "2025-05-27", startTime: "10:00", endTime: "10:30" },
      ],
      expiresAt: "2025-05-23T23:59:59",
    },
    {
      id: 2,
      propertyTitle: "Studio meublé - République",
      propertyAddress: "8 rue du Temple, 75003 Paris",
      tenantName: "Pierre Martin",
      tenantEmail: "pierre.martin@email.com",
      requestedAt: "2025-05-19T14:15:00",
      status: "confirmed",
      selectedSlot: { date: "2025-05-24", startTime: "11:00", endTime: "11:30" },
      confirmedAt: "2025-05-20T09:45:00",
    },
    {
      id: 3,
      propertyTitle: "Maison 4P - Montreuil",
      propertyAddress: "25 avenue de la République, 93100 Montreuil",
      tenantName: "Sophie Leroy",
      tenantEmail: "sophie.leroy@email.com",
      requestedAt: "2025-05-18T09:00:00",
      status: "completed",
      selectedSlot: { date: "2025-05-20", startTime: "14:00", endTime: "14:30" },
      confirmedAt: "2025-05-19T10:30:00",
      completedAt: "2025-05-20T14:45:00",
      feedback: "Visite très positive. Le candidat était très intéressé.",
    },
    {
      id: 4,
      propertyTitle: "Loft moderne - Bastille",
      propertyAddress: "12 rue de la Roquette, 75011 Paris",
      tenantName: "Thomas Dubois",
      tenantEmail: "thomas.dubois@email.com",
      requestedAt: "2025-05-17T16:45:00",
      status: "cancelled",
      selectedSlot: { date: "2025-05-22", startTime: "18:00", endTime: "18:30" },
      confirmedAt: "2025-05-18T11:15:00",
      cancelledAt: "2025-05-21T09:00:00",
      cancelReason: "Empêchement de dernière minute du visiteur",
      cancelledBy: "tenant",
    },
    {
      id: 5,
      propertyTitle: "Appartement 3P - Belleville",
      propertyAddress: "15 rue de Belleville, 75020 Paris",
      tenantName: "Julie Bernard",
      tenantEmail: "julie.bernard@email.com",
      requestedAt: "2025-05-16T13:20:00",
      status: "declined",
      declinedAt: "2025-05-17T10:00:00",
      declineReason: "Le candidat a trouvé un autre logement",
    },
  ]

  const getStatusBadge = (status: string, cancelledBy?: string) => {
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
            Effectuée
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <XCircleIcon className="h-3 w-3 mr-1" />
            {cancelledBy === "tenant" ? "Annulée par locataire" : "Annulée par vous"}
          </Badge>
        )
      case "declined":
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-600">
            <XCircleIcon className="h-3 w-3 mr-1" />
            Déclinée
          </Badge>
        )
      default:
        return <Badge variant="outline">Inconnu</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const filterByStatus = (status: string) => {
    if (status === "all") return visits
    return visits.filter((visit) => visit.status === status)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Rechercher une visite..." className="pl-10" />
          </div>
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Propriété" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les propriétés</SelectItem>
            <SelectItem value="1">Appartement 3P - Belleville</SelectItem>
            <SelectItem value="2">Studio meublé - République</SelectItem>
            <SelectItem value="3">Maison 4P - Montreuil</SelectItem>
            <SelectItem value="4">Loft moderne - Bastille</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="date">
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date de visite</SelectItem>
            <SelectItem value="requested">Date de demande</SelectItem>
            <SelectItem value="status">Statut</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Visits Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">Toutes ({visits.length})</TabsTrigger>
          <TabsTrigger value="pending">En attente ({filterByStatus("pending").length})</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmées ({filterByStatus("confirmed").length})</TabsTrigger>
          <TabsTrigger value="completed">Effectuées ({filterByStatus("completed").length})</TabsTrigger>
          <TabsTrigger value="cancelled">
            Annulées ({filterByStatus("cancelled").length + filterByStatus("declined").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="space-y-4">
            {visits.map((visit) => (
              <Card key={visit.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      {/* Property and tenant info */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-lg font-semibold">{visit.propertyTitle}</h3>
                          {getStatusBadge(visit.status, visit.cancelledBy)}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground mb-2">
                          <MapPinIcon className="h-4 w-4 mr-1" />
                          {visit.propertyAddress}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <UserIcon className="h-4 w-4 mr-1" />
                          Candidat: {visit.tenantName}
                        </div>
                      </div>

                      {/* Visit details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {visit.status === "pending" ? (
                          <div className="space-y-2">
                            <h4 className="font-medium">Créneaux proposés</h4>
                            <div className="space-y-1">
                              {visit.slots?.map((slot, index) => (
                                <div key={index} className="text-sm">
                                  <div className="flex items-center gap-2">
                                    <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                                    <span>{formatDate(slot.date)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 ml-5">
                                    <ClockIcon className="h-3 w-3 text-muted-foreground" />
                                    <span>
                                      {slot.startTime} - {slot.endTime}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <h4 className="font-medium">Date et heure</h4>
                            {visit.selectedSlot && (
                              <>
                                <div className="flex items-center gap-2">
                                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                  <span>{formatDate(visit.selectedSlot.date)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <ClockIcon className="h-4 w-4 text-muted-foreground" />
                                  <span>
                                    {visit.selectedSlot.startTime} - {visit.selectedSlot.endTime}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        <div className="space-y-2">
                          <h4 className="font-medium">Informations</h4>
                          <div className="text-sm space-y-1">
                            <div>Demande envoyée le {new Date(visit.requestedAt).toLocaleDateString("fr-FR")}</div>
                            {visit.confirmedAt && (
                              <div>Confirmée le {new Date(visit.confirmedAt).toLocaleDateString("fr-FR")}</div>
                            )}
                            {visit.completedAt && (
                              <div>Effectuée le {new Date(visit.completedAt).toLocaleDateString("fr-FR")}</div>
                            )}
                            {visit.cancelledAt && (
                              <div>Annulée le {new Date(visit.cancelledAt).toLocaleDateString("fr-FR")}</div>
                            )}
                            {visit.declinedAt && (
                              <div>Déclinée le {new Date(visit.declinedAt).toLocaleDateString("fr-FR")}</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Additional info based on status */}
                      {visit.status === "pending" && visit.expiresAt && (
                        <div className="text-sm text-orange-600 flex items-center gap-1">
                          <ClockIcon className="h-4 w-4" />
                          <span>
                            Expire le {new Date(visit.expiresAt).toLocaleDateString("fr-FR")} à{" "}
                            {new Date(visit.expiresAt).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      )}

                      {visit.status === "completed" && visit.feedback && (
                        <div className="space-y-2">
                          <h4 className="font-medium">Retour sur la visite</h4>
                          <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">{visit.feedback}</p>
                        </div>
                      )}

                      {visit.status === "cancelled" && visit.cancelReason && (
                        <div className="space-y-2">
                          <h4 className="font-medium">Motif d'annulation</h4>
                          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                            {visit.cancelReason}
                          </p>
                        </div>
                      )}

                      {visit.status === "declined" && visit.declineReason && (
                        <div className="space-y-2">
                          <h4 className="font-medium">Motif de refus</h4>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
                            {visit.declineReason}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col justify-between gap-4 min-w-48">
                      <div className="space-y-2">
                        <Link href={`/landlord/visits/${visit.id}`}>
                          <Button variant="outline" className="w-full">
                            <EyeIcon className="h-4 w-4 mr-2" />
                            Détails
                          </Button>
                        </Link>
                        <Button variant="outline" className="w-full">
                          <MessageSquareIcon className="h-4 w-4 mr-2" />
                          Contacter
                        </Button>
                      </div>

                      <div className="text-center">
                        <Button variant="link" size="sm" className="text-muted-foreground">
                          <HomeIcon className="h-4 w-4 mr-1" />
                          Voir le bien
                        </Button>
                      </div>
                    </div>
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
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{visit.propertyTitle}</h3>
                      <p className="text-sm text-muted-foreground">
                        Candidat: {visit.tenantName} - Envoyée le{" "}
                        {new Date(visit.requestedAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <Link href={`/landlord/visits/${visit.id}`}>
                      <Button size="sm">Voir détails</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="confirmed">
          <div className="space-y-4">
            {filterByStatus("confirmed").map((visit) => (
              <Card key={visit.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{visit.propertyTitle}</h3>
                      <p className="text-sm text-muted-foreground">
                        Visite le {formatDate(visit.selectedSlot?.date || "")} à {visit.selectedSlot?.startTime}
                      </p>
                    </div>
                    <Link href={`/landlord/visits/${visit.id}`}>
                      <Button size="sm">Voir détails</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <div className="space-y-4">
            {filterByStatus("completed").map((visit) => (
              <Card key={visit.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{visit.propertyTitle}</h3>
                      <p className="text-sm text-muted-foreground">
                        Visite effectuée le {formatDate(visit.selectedSlot?.date || "")}
                      </p>
                    </div>
                    <Link href={`/landlord/visits/${visit.id}`}>
                      <Button size="sm">Voir détails</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cancelled">
          <div className="space-y-4">
            {[...filterByStatus("cancelled"), ...filterByStatus("declined")].map((visit) => (
              <Card key={visit.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{visit.propertyTitle}</h3>
                      <p className="text-sm text-muted-foreground">
                        {visit.status === "cancelled" ? "Annulée" : "Déclinée"} le{" "}
                        {new Date(visit.cancelledAt || visit.declinedAt || "").toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <Link href={`/landlord/visits/${visit.id}`}>
                      <Button size="sm">Voir détails</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
