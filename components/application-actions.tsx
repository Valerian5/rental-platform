"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, X, CheckCircle, Clock, UserCheck, MessageSquare, AlertTriangle, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { VisitProposalManager } from "./visit-proposal-manager"

interface ApplicationActionsProps {
  application: any
  onStatusUpdate: (newStatus: string) => void
}

const STATUS_CONFIG = {
  pending: {
    label: "En cours d'analyse",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
    actions: ["propose_visit", "reject"],
  },
  visit_proposed: {
    label: "Visite proposée",
    color: "bg-blue-100 text-blue-800",
    icon: Calendar,
    actions: ["accept", "reject"],
  },
  visit_scheduled: {
    label: "Visite programmée",
    color: "bg-purple-100 text-purple-800",
    icon: Calendar,
    actions: ["accept", "reject"],
  },
  visit_completed: {
    label: "Visite effectuée",
    color: "bg-indigo-100 text-indigo-800",
    icon: CheckCircle,
    actions: ["accept", "reject"],
  },
  accepted: {
    label: "Candidature acceptée",
    color: "bg-green-100 text-green-800",
    icon: UserCheck,
    actions: ["contact"],
  },
  rejected: {
    label: "Candidature refusée",
    color: "bg-red-100 text-red-800",
    icon: X,
    actions: [],
  },
}

const REJECTION_REASONS = [
  { value: "income", label: "Revenus insuffisants" },
  { value: "documents", label: "Documents incomplets ou non conformes" },
  { value: "profile", label: "Profil ne correspondant pas aux critères" },
  { value: "other_candidate", label: "Autre candidature retenue" },
  { value: "visit_no_show", label: "Absence à la visite programmée" },
  { value: "visit_negative", label: "Suite à la visite (impression négative)" },
  { value: "references", label: "Références insuffisantes" },
  { value: "custom", label: "Autre raison (préciser)" },
]

export function ApplicationActions({ application, onStatusUpdate }: ApplicationActionsProps) {
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showAcceptDialog, setShowAcceptDialog] = useState(false)
  const [showVisitProposal, setShowVisitProposal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // États pour le rejet
  const [rejectionReason, setRejectionReason] = useState("")
  const [rejectionMessage, setRejectionMessage] = useState("")

  // États pour l'acceptation
  const [acceptanceMessage, setAcceptanceMessage] = useState("")

  const currentStatus = application.status || "pending"
  const statusConfig = STATUS_CONFIG[currentStatus as keyof typeof STATUS_CONFIG]

  const handleReject = async () => {
    if (!rejectionReason) {
      toast.error("Veuillez sélectionner un motif de refus")
      return
    }

    setIsProcessing(true)
    try {
      // Simuler l'appel API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mettre à jour le statut
      onStatusUpdate("rejected")

      // Notification de succès
      toast.success("Candidature refusée et notification envoyée au candidat")

      // Fermer le dialog
      setShowRejectDialog(false)

      // Reset des champs
      setRejectionReason("")
      setRejectionMessage("")
    } catch (error) {
      toast.error("Erreur lors du refus de la candidature")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAccept = async () => {
    setIsProcessing(true)
    try {
      // Simuler l'appel API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mettre à jour le statut
      onStatusUpdate("accepted")

      // Notification de succès
      toast.success("Candidature acceptée ! Le candidat va être notifié.")

      // Fermer le dialog
      setShowAcceptDialog(false)

      // Reset du message
      setAcceptanceMessage("")
    } catch (error) {
      toast.error("Erreur lors de l'acceptation de la candidature")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleProposeVisit = () => {
    setShowVisitProposal(true)
  }

  const handleSlotsProposed = (slots: any[]) => {
    onStatusUpdate("visit_proposed")
  }

  const getActionButtons = () => {
    const actions = statusConfig?.actions || []

    return (
      <div className="flex flex-wrap gap-2">
        {actions.includes("propose_visit") && (
          <Button onClick={handleProposeVisit} className="flex-1 min-w-[140px]">
            <Calendar className="h-4 w-4 mr-1" />
            Proposer une visite
          </Button>
        )}

        {actions.includes("accept") && (
          <Button onClick={() => setShowAcceptDialog(true)} className="flex-1 min-w-[140px]">
            <UserCheck className="h-4 w-4 mr-1" />
            Accepter le dossier
          </Button>
        )}

        {actions.includes("reject") && (
          <Button variant="destructive" onClick={() => setShowRejectDialog(true)} className="flex-1 min-w-[140px]">
            <X className="h-4 w-4 mr-1" />
            Refuser
          </Button>
        )}

        {actions.includes("contact") && (
          <Button variant="outline" className="flex-1 min-w-[140px]">
            <MessageSquare className="h-4 w-4 mr-1" />
            Contacter
          </Button>
        )}
      </div>
    )
  }

  const getStatusBadge = () => {
    if (!statusConfig) return null

    const Icon = statusConfig.icon

    return (
      <Badge className={`${statusConfig.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {statusConfig.label}
      </Badge>
    )
  }

  const getStatusMessage = () => {
    switch (currentStatus) {
      case "pending":
        return "Analysez le dossier et proposez une visite ou refusez la candidature."
      case "visit_proposed":
        return "En attente de la réponse du candidat pour la visite."
      case "visit_scheduled":
        return "Visite programmée. Vous pourrez accepter ou refuser après la visite."
      case "visit_completed":
        return "Visite effectuée. Prenez votre décision finale."
      case "accepted":
        return "Candidature acceptée. Vous pouvez maintenant créer le bail."
      case "rejected":
        return "Candidature refusée."
      default:
        return ""
    }
  }

  return (
    <div className="space-y-4">
      {/* Statut actuel */}
      <div className="flex items-center justify-between">
        {getStatusBadge()}
        <div className="text-sm text-muted-foreground">{getStatusMessage()}</div>
      </div>

      {/* Actions disponibles */}
      {getActionButtons()}

      {/* Dialog de rejet */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Refuser la candidature
            </DialogTitle>
            <DialogDescription>
              Veuillez indiquer la raison du refus. Une notification sera envoyée au candidat.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Motif du refus *</Label>
              <Select value={rejectionReason} onValueChange={setRejectionReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un motif" />
                </SelectTrigger>
                <SelectContent>
                  {REJECTION_REASONS.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Message personnalisé (optionnel)</Label>
              <Textarea
                value={rejectionMessage}
                onChange={(e) => setRejectionMessage(e.target.value)}
                placeholder="Message personnalisé pour expliquer votre décision..."
                rows={3}
              />
            </div>

            {rejectionReason && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-red-800">Conséquences du refus :</div>
                    <ul className="text-red-700 mt-1 space-y-1">
                      <li>• Le candidat recevra une notification de refus</li>
                      <li>• La candidature sera archivée</li>
                      <li>• Cette action est irréversible</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={isProcessing}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason || isProcessing}>
              {isProcessing ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <X className="h-4 w-4 mr-1" />}
              Confirmer le refus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog d'acceptation */}
      <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-500" />
              Accepter la candidature
            </DialogTitle>
            <DialogDescription>
              Vous êtes sur le point d'accepter cette candidature. Le candidat sera notifié.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Message de félicitations (optionnel)</Label>
              <Textarea
                value={acceptanceMessage}
                onChange={(e) => setAcceptanceMessage(e.target.value)}
                placeholder="Message personnalisé pour féliciter le candidat..."
                rows={3}
              />
            </div>

            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-green-800">Prochaines étapes :</div>
                  <ul className="text-green-700 mt-1 space-y-1">
                    <li>• Le candidat sera notifié de l'acceptation</li>
                    <li>• Tous les autres candidats seront automatiquement refusés</li>
                    <li>• Vous pourrez créer le bail et organiser l'état des lieux</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAcceptDialog(false)} disabled={isProcessing}>
              Annuler
            </Button>
            <Button onClick={handleAccept} disabled={isProcessing}>
              {isProcessing ? (
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <UserCheck className="h-4 w-4 mr-1" />
              )}
              Confirmer l'acceptation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gestionnaire de proposition de visite */}
      <VisitProposalManager
        isOpen={showVisitProposal}
        onClose={() => setShowVisitProposal(false)}
        propertyId={application.property?.id?.toString() || ""}
        propertyTitle={application.property?.title || ""}
        applicationId={application.id?.toString() || ""}
        tenantName={application.tenant?.name || ""}
        onSlotsProposed={handleSlotsProposed}
      />
    </div>
  )
}
