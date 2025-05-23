"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircleIcon, XCircleIcon, MessageSquareIcon, CalendarIcon, PencilIcon } from "lucide-react"

interface VisitActionsProps {
  visitId: string
}

export function VisitActions({ visitId }: VisitActionsProps) {
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false)
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [completionFeedback, setCompletionFeedback] = useState("")
  const [message, setMessage] = useState("")

  // Mock data - in real app, this would come from API based on visitId
  const visit = {
    id: 1,
    status: "confirmed",
    selectedSlot: { date: "2025-05-25", startTime: "14:00", endTime: "14:30" },
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

  const handleSendMessage = () => {
    console.log("Sending message:", message)
    setIsMessageDialogOpen(false)
    // Here you would typically call an API to send the message
  }

  return (
    <div className="space-y-4">
      {visit.status === "confirmed" && (
        <>
          <Button className="w-full" onClick={() => setIsCompleteDialogOpen(true)}>
            <CheckCircleIcon className="h-4 w-4 mr-2" />
            Marquer comme effectuée
          </Button>
          <Button variant="outline" className="w-full" onClick={() => setIsCancelDialogOpen(true)}>
            <XCircleIcon className="h-4 w-4 mr-2" />
            Annuler la visite
          </Button>
        </>
      )}

      <Button variant="outline" className="w-full" onClick={() => setIsMessageDialogOpen(true)}>
        <MessageSquareIcon className="h-4 w-4 mr-2" />
        Envoyer un message
      </Button>

      <Button variant="outline" className="w-full">
        <CalendarIcon className="h-4 w-4 mr-2" />
        Reprogrammer
      </Button>

      <Button variant="outline" className="w-full">
        <PencilIcon className="h-4 w-4 mr-2" />
        Modifier les notes
      </Button>

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

      {/* Message Dialog */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envoyer un message</DialogTitle>
            <DialogDescription>Envoyez un message au candidat concernant cette visite.</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Votre message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMessageDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSendMessage}>Envoyer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
