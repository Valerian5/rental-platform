"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { HomeIcon, CalendarIcon, ClockIcon, MapPinIcon, UserIcon, MessageSquareIcon, XIcon } from "lucide-react"

export function UpcomingVisits() {
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [currentVisit, setCurrentVisit] = useState<number | null>(null)
  const [cancelReason, setCancelReason] = useState("")

  // Mock data - in real app, this would come from API
  const upcomingVisits = [
    {
      id: 1,
      propertyTitle: "Appartement 3 pièces - Belleville",
      propertyAddress: "15 rue de Belleville, 75020 Paris",
      landlordName: "M. Martin",
      landlordPhone: "06 12 34 56 78",
      date: "2025-05-25",
      startTime: "14:00",
      endTime: "14:30",
      confirmationDate: "2025-05-21",
      notes: "Interphone au nom de Martin. 3ème étage sans ascenseur.",
    },
    {
      id: 2,
      propertyTitle: "Studio meublé - République",
      propertyAddress: "8 rue du Temple, 75003 Paris",
      landlordName: "Mme Dubois",
      landlordPhone: "06 98 76 54 32",
      date: "2025-05-27",
      startTime: "11:00",
      endTime: "11:30",
      confirmationDate: "2025-05-22",
      notes: "La propriétaire vous attendra devant l'immeuble.",
    },
  ]

  const handleCancelVisit = (visitId: number) => {
    setCurrentVisit(visitId)
    setIsCancelDialogOpen(true)
  }

  const submitCancellation = () => {
    console.log(`Cancelled visit ${currentVisit} with reason: ${cancelReason}`)
    setIsCancelDialogOpen(false)
    setCancelReason("")
    // Here you would typically call an API to cancel the visit
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getDaysUntilVisit = (dateString: string) => {
    const visitDate = new Date(dateString)
    const today = new Date()

    // Reset time part for accurate day calculation
    visitDate.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)

    const diffTime = visitDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Aujourd'hui"
    if (diffDays === 1) return "Demain"
    return `Dans ${diffDays} jours`
  }

  return (
    <div className="space-y-6">
      {upcomingVisits.length === 0 ? (
        <div className="text-center py-12">
          <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucune visite programmée</h3>
          <p className="text-muted-foreground">Vous n'avez pas encore de visites confirmées à venir.</p>
        </div>
      ) : (
        upcomingVisits.map((visit) => (
          <Card key={visit.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  {/* Property and landlord info */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-semibold">{visit.propertyTitle}</h3>
                      <Badge className="bg-green-500">{getDaysUntilVisit(visit.date)}</Badge>
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
                      <h4 className="font-medium">Contact propriétaire</h4>
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                        <span>{visit.landlordName}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">{visit.landlordPhone}</div>
                    </div>
                  </div>

                  {/* Notes */}
                  {visit.notes && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Informations complémentaires</h4>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">{visit.notes}</p>
                    </div>
                  )}

                  {/* Confirmation info */}
                  <div className="text-sm text-muted-foreground">
                    Visite confirmée le {new Date(visit.confirmationDate).toLocaleDateString("fr-FR")}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col justify-between gap-4 min-w-48">
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full">
                      <MessageSquareIcon className="h-4 w-4 mr-2" />
                      Contacter
                    </Button>
                    <Button variant="destructive" className="w-full" onClick={() => handleCancelVisit(visit.id)}>
                      <XIcon className="h-4 w-4 mr-2" />
                      Annuler
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

      {/* Cancel Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler la visite</DialogTitle>
            <DialogDescription>
              Veuillez indiquer la raison pour laquelle vous annulez cette visite. Le propriétaire en sera informé.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Indiquez pourquoi vous annulez cette visite..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
              Retour
            </Button>
            <Button variant="destructive" onClick={submitCancellation}>
              Confirmer l'annulation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
