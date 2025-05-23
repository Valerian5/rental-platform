"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CalendarIcon, ClockIcon, MapPinIcon, MessageSquareIcon, XIcon } from "lucide-react"

export function VisitRequests() {
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [requestForm, setRequestForm] = useState({
    preferredDate: "",
    preferredTime: "",
    alternativeDate: "",
    alternativeTime: "",
    message: "",
  })

  // Mock data for visit requests
  const visitRequests = [
    {
      id: 1,
      propertyTitle: "Appartement 3P - Belleville",
      propertyAddress: "15 rue de Belleville, 75020 Paris",
      landlordName: "M. Martin",
      requestedDate: "2025-05-25",
      requestedTime: "14:00",
      status: "pending",
      submittedAt: "2025-05-20T10:30:00",
      message:
        "Bonjour, je suis très intéressée par votre appartement. Serait-il possible de le visiter cette semaine ?",
    },
    {
      id: 2,
      propertyTitle: "Studio meublé - République",
      propertyAddress: "8 rue du Temple, 75003 Paris",
      landlordName: "Mme Dubois",
      requestedDate: "2025-05-27",
      requestedTime: "10:00",
      status: "confirmed",
      submittedAt: "2025-05-18T14:15:00",
      confirmedAt: "2025-05-19T09:00:00",
      message: "Je souhaiterais visiter ce studio qui correspond parfaitement à mes critères.",
    },
    {
      id: 3,
      propertyTitle: "Maison 4P - Montreuil",
      propertyAddress: "25 avenue de la République, 93100 Montreuil",
      landlordName: "M. Leroy",
      requestedDate: "2025-05-22",
      requestedTime: "16:00",
      status: "declined",
      submittedAt: "2025-05-15T09:00:00",
      declinedAt: "2025-05-16T11:30:00",
      declineReason: "Créneau non disponible",
      message: "Bonjour, cette maison m'intéresse beaucoup. Merci de me proposer un créneau de visite.",
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-orange-500">En attente</Badge>
      case "confirmed":
        return <Badge className="bg-green-500">Confirmée</Badge>
      case "declined":
        return <Badge variant="destructive">Refusée</Badge>
      default:
        return <Badge variant="outline">Inconnue</Badge>
    }
  }

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Visit request submitted:", requestForm)
    setIsRequestDialogOpen(false)
    // Reset form
    setRequestForm({
      preferredDate: "",
      preferredTime: "",
      alternativeDate: "",
      alternativeTime: "",
      message: "",
    })
  }

  const handleCancelRequest = (requestId: number) => {
    console.log("Cancelling request:", requestId)
    // Here you would typically call an API to cancel the request
  }

  return (
    <div className="space-y-6">
      {/* Header with new request button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Mes demandes de visite</h2>
          <p className="text-sm text-muted-foreground">Gérez vos demandes de visite en cours et passées</p>
        </div>
        <Button onClick={() => setIsRequestDialogOpen(true)}>
          <CalendarIcon className="h-4 w-4 mr-2" />
          Nouvelle demande
        </Button>
      </div>

      {/* Visit requests list */}
      <div className="space-y-4">
        {visitRequests.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune demande de visite</h3>
              <p className="text-muted-foreground mb-4">Vous n'avez pas encore fait de demande de visite.</p>
              <Button onClick={() => setIsRequestDialogOpen(true)}>Faire une demande</Button>
            </CardContent>
          </Card>
        ) : (
          visitRequests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{request.propertyTitle}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPinIcon className="h-4 w-4" />
                      {request.propertyAddress}
                    </CardDescription>
                    <p className="text-sm text-muted-foreground mt-1">Propriétaire: {request.landlordName}</p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Request details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Date et heure demandées</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {new Date(request.requestedDate).toLocaleDateString("fr-FR", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <ClockIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{request.requestedTime}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Statut de la demande</h4>
                    <p className="text-sm text-muted-foreground">
                      Demande soumise le {new Date(request.submittedAt).toLocaleDateString("fr-FR")}
                    </p>
                    {request.status === "confirmed" && request.confirmedAt && (
                      <p className="text-sm text-green-600">
                        Confirmée le {new Date(request.confirmedAt).toLocaleDateString("fr-FR")}
                      </p>
                    )}
                    {request.status === "declined" && request.declinedAt && (
                      <div>
                        <p className="text-sm text-red-600">
                          Refusée le {new Date(request.declinedAt).toLocaleDateString("fr-FR")}
                        </p>
                        {request.declineReason && (
                          <p className="text-sm text-muted-foreground">Raison: {request.declineReason}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Message */}
                {request.message && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Message</h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">{request.message}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  {request.status === "pending" && (
                    <>
                      <Button variant="outline" size="sm">
                        Modifier
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleCancelRequest(request.id)}>
                        <XIcon className="h-4 w-4 mr-1" />
                        Annuler
                      </Button>
                    </>
                  )}
                  {request.status === "declined" && (
                    <Button variant="outline" size="sm">
                      Nouvelle demande
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    <MessageSquareIcon className="h-4 w-4 mr-1" />
                    Contacter
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* New visit request dialog */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Demande de visite</DialogTitle>
            <DialogDescription>Remplissez ce formulaire pour demander une visite</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRequestSubmit} className="space-y-6 py-4">
            {/* Property selection (simplified for demo) */}
            <div className="space-y-2">
              <Label htmlFor="property">Bien à visiter *</Label>
              <Select required>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un bien" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Appartement 3P - Belleville</SelectItem>
                  <SelectItem value="2">Studio meublé - République</SelectItem>
                  <SelectItem value="3">Maison 4P - Montreuil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Preferred date and time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preferredDate">Date préférée *</Label>
                <Input
                  id="preferredDate"
                  type="date"
                  value={requestForm.preferredDate}
                  onChange={(e) => setRequestForm((prev) => ({ ...prev, preferredDate: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferredTime">Heure préférée *</Label>
                <Input
                  id="preferredTime"
                  type="time"
                  value={requestForm.preferredTime}
                  onChange={(e) => setRequestForm((prev) => ({ ...prev, preferredTime: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Alternative date and time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="alternativeDate">Date alternative</Label>
                <Input
                  id="alternativeDate"
                  type="date"
                  value={requestForm.alternativeDate}
                  onChange={(e) => setRequestForm((prev) => ({ ...prev, alternativeDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alternativeTime">Heure alternative</Label>
                <Input
                  id="alternativeTime"
                  type="time"
                  value={requestForm.alternativeTime}
                  onChange={(e) => setRequestForm((prev) => ({ ...prev, alternativeTime: e.target.value }))}
                />
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message (optionnel)</Label>
              <Textarea
                id="message"
                value={requestForm.message}
                onChange={(e) => setRequestForm((prev) => ({ ...prev, message: e.target.value }))}
                rows={3}
                placeholder="Ajoutez un message pour le propriétaire..."
              />
            </div>
          </form>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRequestDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleRequestSubmit}>Envoyer la demande</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
