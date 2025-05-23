"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  HomeIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  CheckIcon,
  XIcon,
  MessageSquareIcon,
} from "lucide-react"

export function VisitRequests() {
  const [selectedSlots, setSelectedSlots] = useState<Record<number, string>>({})
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [isDeclineDialogOpen, setIsDeclineDialogOpen] = useState(false)
  const [currentRequest, setCurrentRequest] = useState<number | null>(null)
  const [declineReason, setDeclineReason] = useState("")

  // Mock data - in real app, this would come from API
  const visitRequests = [
    {
      id: 1,
      propertyTitle: "Appartement 3 pièces - Belleville",
      propertyAddress: "15 rue de Belleville, 75020 Paris",
      landlordName: "M. Martin",
      requestedAt: "2025-05-20T10:30:00",
      message:
        "Suite à l'étude de votre dossier, je vous propose de visiter ce bien aux créneaux suivants. Merci de sélectionner celui qui vous convient le mieux.",
      slots: [
        { id: "1-1", date: "2025-05-25", startTime: "14:00", endTime: "14:30" },
        { id: "1-2", date: "2025-05-26", startTime: "16:00", endTime: "16:30" },
        { id: "1-3", date: "2025-05-27", startTime: "10:00", endTime: "10:30" },
      ],
      expiresAt: "2025-05-23T23:59:59",
    },
    {
      id: 2,
      propertyTitle: "Studio meublé - République",
      propertyAddress: "8 rue du Temple, 75003 Paris",
      landlordName: "Mme Dubois",
      requestedAt: "2025-05-19T14:15:00",
      message:
        "Votre candidature a retenu mon attention. Je vous propose les créneaux suivants pour visiter le studio.",
      slots: [
        { id: "2-1", date: "2025-05-24", startTime: "11:00", endTime: "11:30" },
        { id: "2-2", date: "2025-05-24", startTime: "15:00", endTime: "15:30" },
      ],
      expiresAt: "2025-05-22T23:59:59",
    },
  ]

  const handleSelectSlot = (requestId: number, slotId: string) => {
    setSelectedSlots({
      ...selectedSlots,
      [requestId]: slotId,
    })
  }

  const handleConfirmVisit = (requestId: number) => {
    setCurrentRequest(requestId)
    setIsConfirmDialogOpen(true)
  }

  const handleDeclineVisit = (requestId: number) => {
    setCurrentRequest(requestId)
    setIsDeclineDialogOpen(true)
  }

  const submitConfirmation = () => {
    console.log(`Confirmed visit for request ${currentRequest} with slot ${selectedSlots[currentRequest!]}`)
    setIsConfirmDialogOpen(false)
    // Here you would typically call an API to confirm the visit
  }

  const submitDecline = () => {
    console.log(`Declined visit for request ${currentRequest} with reason: ${declineReason}`)
    setIsDeclineDialogOpen(false)
    setDeclineReason("")
    // Here you would typically call an API to decline the visit
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getRemainingTime = (expiresAt: string) => {
    const now = new Date()
    const expiration = new Date(expiresAt)
    const diffMs = expiration.getTime() - now.getTime()

    if (diffMs <= 0) return "Expirée"

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (diffDays > 0) {
      return `${diffDays} jour${diffDays > 1 ? "s" : ""} et ${diffHours} heure${diffHours > 1 ? "s" : ""}`
    } else {
      return `${diffHours} heure${diffHours > 1 ? "s" : ""}`
    }
  }

  return (
    <div className="space-y-6">
      {visitRequests.length === 0 ? (
        <div className="text-center py-12">
          <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucune proposition de visite</h3>
          <p className="text-muted-foreground">Vous n'avez pas encore reçu de proposition de visite.</p>
        </div>
      ) : (
        visitRequests.map((request) => (
          <Card key={request.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  {/* Property and landlord info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{request.propertyTitle}</h3>
                    <div className="flex items-center text-sm text-muted-foreground mb-2">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      {request.propertyAddress}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <UserIcon className="h-4 w-4 mr-1" />
                      Propriétaire: {request.landlordName}
                    </div>
                  </div>

                  <Separator />

                  {/* Message */}
                  <div className="space-y-2">
                    <p className="text-sm">{request.message}</p>
                  </div>

                  {/* Time slots */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Créneaux proposés</h4>
                    <RadioGroup
                      value={selectedSlots[request.id] || ""}
                      onValueChange={(value) => handleSelectSlot(request.id, value)}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {request.slots.map((slot) => (
                          <div key={slot.id} className="relative">
                            <RadioGroupItem value={slot.id} id={slot.id} className="peer sr-only" />
                            <Label
                              htmlFor={slot.id}
                              className="flex flex-col p-3 border rounded-lg cursor-pointer hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                <span>{formatDate(slot.date)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <ClockIcon className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {slot.startTime} - {slot.endTime}
                                </span>
                              </div>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Expiration notice */}
                  <div className="text-sm text-orange-600 flex items-center gap-1">
                    <ClockIcon className="h-4 w-4" />
                    <span>Cette proposition expire dans: {getRemainingTime(request.expiresAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col justify-between gap-4 min-w-48">
                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      disabled={!selectedSlots[request.id]}
                      onClick={() => handleConfirmVisit(request.id)}
                    >
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Confirmer
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => handleDeclineVisit(request.id)}>
                      <XIcon className="h-4 w-4 mr-2" />
                      Décliner
                    </Button>
                    <Button variant="ghost" className="w-full">
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
        ))
      )}

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la visite</DialogTitle>
            <DialogDescription>
              Vous êtes sur le point de confirmer cette visite. Un email de confirmation sera envoyé au propriétaire.
            </DialogDescription>
          </DialogHeader>

          {currentRequest && (
            <div className="py-4">
              <div className="space-y-2 mb-4">
                <h4 className="font-medium">Détails de la visite</h4>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">{visitRequests.find((r) => r.id === currentRequest)?.propertyTitle}</p>
                  {selectedSlots[currentRequest] && (
                    <>
                      {(() => {
                        const request = visitRequests.find((r) => r.id === currentRequest)
                        const slot = request?.slots.find((s) => s.id === selectedSlots[currentRequest])
                        return (
                          <>
                            <p className="text-sm">{formatDate(slot?.date || "")}</p>
                            <p className="text-sm">
                              {slot?.startTime} - {slot?.endTime}
                            </p>
                          </>
                        )
                      })()}
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message (optionnel)</Label>
                <Textarea id="message" placeholder="Ajouter un message pour le propriétaire..." rows={3} />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={submitConfirmation}>Confirmer la visite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decline Dialog */}
      <Dialog open={isDeclineDialogOpen} onOpenChange={setIsDeclineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Décliner la visite</DialogTitle>
            <DialogDescription>
              Veuillez indiquer la raison pour laquelle vous déclinez cette proposition de visite.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="decline-reason">Raison (optionnelle)</Label>
              <Textarea
                id="decline-reason"
                placeholder="Indiquez pourquoi vous ne pouvez pas visiter ce bien..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeclineDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={submitDecline}>
              Décliner la visite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
