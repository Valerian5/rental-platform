"use client"

import { useState, useEffect, useRef } from "react"
import { Calendar } from "@fullcalendar/core"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import listPlugin from "@fullcalendar/list"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CalendarIcon, MapPinIcon, ClockIcon, UserIcon } from "lucide-react"

export function TenantVisitCalendar() {
  const calendarRef = useRef(null)
  const [calendar, setCalendar] = useState(null)
  const [selectedVisit, setSelectedVisit] = useState(null)
  const [isVisitDialogOpen, setIsVisitDialogOpen] = useState(false)

  // Mock visit data
  const visits = [
    {
      id: "1",
      title: "Visite - Appartement 3P Belleville",
      start: "2025-05-25T14:00:00",
      end: "2025-05-25T14:30:00",
      backgroundColor: "#10b981",
      borderColor: "#10b981",
      extendedProps: {
        propertyTitle: "Appartement 3 pièces - Belleville",
        propertyAddress: "15 rue de Belleville, 75020 Paris",
        landlordName: "M. Martin",
        landlordPhone: "06 12 34 56 78",
        status: "confirmed",
        notes: "Apporter les justificatifs de revenus",
        visitType: "individual",
      },
    },
    {
      id: "2",
      title: "Visite - Studio République",
      start: "2025-05-27T10:00:00",
      end: "2025-05-27T10:30:00",
      backgroundColor: "#f59e0b",
      borderColor: "#f59e0b",
      extendedProps: {
        propertyTitle: "Studio meublé - République",
        propertyAddress: "8 rue du Temple, 75003 Paris",
        landlordName: "Mme Dubois",
        landlordPhone: "06 98 76 54 32",
        status: "pending",
        notes: "Visite groupée avec 2 autres candidats",
        visitType: "group",
      },
    },
    {
      id: "3",
      title: "Visite - Maison Montreuil",
      start: "2025-05-30T16:00:00",
      end: "2025-05-30T17:00:00",
      backgroundColor: "#6366f1",
      borderColor: "#6366f1",
      extendedProps: {
        propertyTitle: "Maison 4 pièces avec jardin - Montreuil",
        propertyAddress: "25 avenue de la République, 93100 Montreuil",
        landlordName: "M. Leroy",
        landlordPhone: "06 11 22 33 44",
        status: "confirmed",
        notes: "Visite complète de la maison et du jardin",
        visitType: "individual",
      },
    },
  ]

  // Initialize FullCalendar
  useEffect(() => {
    if (calendarRef.current && !calendar) {
      const calendarInstance = new Calendar(calendarRef.current, {
        plugins: [dayGridPlugin, timeGridPlugin, listPlugin],
        initialView: "dayGridMonth",
        headerToolbar: {
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,listWeek",
        },
        height: "auto",
        events: visits,
        eventClick: (info) => {
          setSelectedVisit({
            id: info.event.id,
            title: info.event.title,
            start: info.event.start,
            end: info.event.end,
            ...info.event.extendedProps,
          })
          setIsVisitDialogOpen(true)
        },
        eventDisplay: "block",
        dayMaxEvents: 3,
        locale: "fr",
      })

      calendarInstance.render()
      setCalendar(calendarInstance)

      return () => {
        calendarInstance.destroy()
      }
    }
  }, [calendarRef, calendar])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500">Confirmée</Badge>
      case "pending":
        return <Badge className="bg-orange-500">En attente</Badge>
      case "cancelled":
        return <Badge variant="destructive">Annulée</Badge>
      default:
        return <Badge variant="outline">Inconnue</Badge>
    }
  }

  const getVisitTypeBadge = (type: string) => {
    switch (type) {
      case "individual":
        return <Badge variant="outline">Visite individuelle</Badge>
      case "group":
        return <Badge variant="outline">Visite groupée</Badge>
      default:
        return <Badge variant="outline">Type inconnu</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Calendar stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Visites prévues</p>
                <p className="text-2xl font-bold">{visits.length}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Confirmées</p>
                <p className="text-2xl font-bold text-green-600">
                  {visits.filter((v) => v.extendedProps.status === "confirmed").length}
                </p>
              </div>
              <CalendarIcon className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-orange-600">
                  {visits.filter((v) => v.extendedProps.status === "pending").length}
                </p>
              </div>
              <ClockIcon className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card>
        <CardContent className="p-0">
          <div ref={calendarRef} className="min-h-[600px] p-4"></div>
        </CardContent>
      </Card>

      {/* Visit details dialog */}
      <Dialog open={isVisitDialogOpen} onOpenChange={setIsVisitDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Détails de la visite</DialogTitle>
            <DialogDescription>Informations complètes sur votre visite programmée</DialogDescription>
          </DialogHeader>

          {selectedVisit && (
            <div className="space-y-6 py-4">
              {/* Property info */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">{selectedVisit.propertyTitle}</h3>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPinIcon className="h-4 w-4" />
                  <span>{selectedVisit.propertyAddress}</span>
                </div>
              </div>

              {/* Visit details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Date et heure</h4>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {selectedVisit.start &&
                        new Date(selectedVisit.start).toLocaleDateString("fr-FR", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {selectedVisit.start &&
                        new Date(selectedVisit.start).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                      -{" "}
                      {selectedVisit.end &&
                        new Date(selectedVisit.end).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Propriétaire</h4>
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedVisit.landlordName}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedVisit.landlordPhone}</p>
                </div>
              </div>

              {/* Status and type */}
              <div className="flex gap-2">
                {getStatusBadge(selectedVisit.status)}
                {getVisitTypeBadge(selectedVisit.visitType)}
              </div>

              {/* Notes */}
              {selectedVisit.notes && (
                <div className="space-y-2">
                  <h4 className="font-medium">Notes</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">{selectedVisit.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" size="sm">
                  Modifier
                </Button>
                <Button variant="outline" size="sm">
                  Annuler
                </Button>
                <Button size="sm">Contacter le propriétaire</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
