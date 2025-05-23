"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { CalendarIcon, ClockIcon, MapPinIcon, UserIcon } from "lucide-react"

interface VisitDetailProps {
  visitId: string
}

export function VisitDetail({ visitId }: VisitDetailProps) {
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [completionFeedback, setCompletionFeedback] = useState("")

  // Mock data - in real app, this would come from API based on visitId
  const visit = {
    id: 1,
    propertyTitle: "Appartement 3 pièces - Belleville",
    propertyAddress: "15 rue de Belleville, 75020 Paris",
    tenantName: "Marie Dupont",
    tenantEmail: "marie.dupont@email.com",
    tenantPhone: "06 12 34 56 78",
    requestedAt: "2025-05-20T10:30:00",
    status: "confirmed",
    selectedSlot: { date: "2025-05-25", startTime: "14:00", endTime: "14:30" },
    confirmedAt: "2025-05-21T09:45:00",
    message: "Je suis très intéressée par cet appartement qui correspond parfaitement à mes critères.",
    notes: "Interphone au nom de Martin. 3ème étage sans ascenseur.",
  }

  const handleCancel = () => {
    console.log("Cancelling visit with reason:", cancelReason)
    setIsCancelDialogOpen(false)
    // Here you would typically call an API to cancel the visit
  }

  const handleComplete = () => {
    console.log("Completing visit with feedback:", completionFeedback)
    setIsCompleteDialogOpen(false)
    // Here you would typically call an API to mark the visit as completed
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-orange-500">En attente</Badge>
      case "confirmed":
        return <Badge className="bg-green-500">Confirmée</Badge>
      case "completed":
        return <Badge className="bg-blue-500">Effectuée</Badge>
      case "cancelled":
        return <Badge variant="destructive">Annulée</Badge>
      default:
        return <Badge variant="outline">Inconnu</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Property and status */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">{visit.propertyTitle}</h2>
          <div className="flex items-center text-muted-foreground mt-1">
            <MapPinIcon className="h-4 w-4 mr-1" />
            {visit.propertyAddress}
          </div>
        </div>
        {getStatusBadge(visit.status)}
      </div>

      <Separator />

      {/* Visit details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-medium">Détails de la visite</h3>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Date:</span>
              <span>{formatDate(visit.selectedSlot.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Heure:</span>
              <span>
                {visit.selectedSlot.startTime} - {visit.selectedSlot.endTime}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-medium">Historique</div>
            <div className="text-sm space-y-1">
              <div>Demande envoyée le {new Date(visit.requestedAt).toLocaleDateString("fr-FR")}</div>
              {visit.confirmedAt && <div>Confirmée le {new Date(visit.confirmedAt).toLocaleDateString("fr-FR")}</div>}
            </div>
          </div>

          {visit.notes && (
            <div className="space-y-2">
              <div className="font-medium">Notes</div>
              <p className="text-sm bg-muted p-3 rounded-lg">{visit.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">Informations du candidat</h3>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Nom:</span>
              <span>{visit.tenantName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Email:</span>
              <span>{visit.tenantEmail}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Téléphone:</span>
              <span>{visit.tenantPhone}</span>
            </div>
          </div>

          {visit.message && (
            <div className="space-y-2">
              <div className="font-medium">Message du candidat</div>
              <p className="text-sm bg-muted p-3 rounded-lg">{visit.message}</p>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler la visite</DialogTitle>
            <DialogDescription>
              Veuillez indiquer la raison pour laquelle vous annulez cette visite. Le candidat en sera informé.
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
            <Button variant="destructive" onClick={handleCancel}>
              Confirmer l'annulation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marquer comme effectuée</DialogTitle>
            <DialogDescription>Ajoutez un retour sur cette visite pour vos notes personnelles.</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Comment s'est passée la visite ? Le candidat était-il intéressé ?"
                value={completionFeedback}
                onChange={(e) => setCompletionFeedback(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCompleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleComplete}>Confirmer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
