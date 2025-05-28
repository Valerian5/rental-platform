"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Calendar,
  X,
  CheckCircle,
  Clock,
  UserCheck,
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  MoreVertical,
  Eye,
} from "lucide-react"
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
    actions: ["propose_visit", "reject", "view"],
  },
  visit_proposed: {
    label: "Visite proposée",
    color: "bg-blue-100 text-blue-800",
    icon: Calendar,
    actions: ["accept", "reject", "view"],
  },
  visit_scheduled: {
    label: "Visite programmée",
    color: "bg-purple-100 text-purple-800",
    icon: Calendar,
    actions: ["accept", "reject", "view"],
  },
  visit_completed: {
    label: "Visite effectuée",
    color: "bg-indigo-100 text-indigo-800",
    icon: CheckCircle,
    actions: ["accept", "reject", "view"],
  },
  accepted: {
    label: "Candidature acceptée",
    color: "bg-green-100 text-green-800",
    icon: UserCheck,
    actions: ["contact", "view"],
  },
  rejected: {
    label: "Candidature refusée",
    color: "bg-red-100 text-red-800",
    icon: X,
    actions: ["view"],
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
      await new Promise((resolve) => setTimeout(resolve, 1000))
      onStatusUpdate("rejected")
      toast.success("Candidature refusée et notification envoyée au candidat")
      setShowRejectDialog(false)
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
      await new Promise((resolve) => setTimeout(resolve, 1000))
      onStatusUpdate("accepted")
      toast.success("Candidature acceptée ! Le candidat va être notifié.")
      setShowAcceptDialog(false)
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

  const handleViewDetails = () => {
    // Navigation vers la page de détails
    window.open(`/owner/applications/${application.id}`, "_blank")
  }

  const getPrimaryAction = () => {
    const actions = statusConfig?.actions || []

    if (actions.includes("propose_visit")) {
      return (
        <Button size="sm" onClick={handleProposeVisit} className="min-w-[100px]">
          <Calendar className="h-3 w-3 mr-1" />
          Proposer visite
        </Button>
      )
    }

    if (actions.includes("accept")) {
      return (
        <Button size="sm" onClick={() => setShowAcceptDialog(true)} className="min-w-[100px]">
          <UserCheck className="h-3 w-3 mr-1" />
          Accepter
        </Button>
      )
    }

    if (actions.includes("contact")) {
      return (
        <Button size="sm" variant="outline" className="min-w-[100px]">
          <MessageSquare className="h-3 w-3 mr-1" />
          Contacter
        </Button>
      )
    }

    return (
      <Button size="sm" variant="outline" onClick={handleViewDetails} className="min-w-[100px]">
        <Eye className="h-3 w-3 mr-1" />
        Voir détails
      </Button>
    )
  }

  const getSecondaryActions = () => {
    const actions = statusConfig?.actions || []
    const secondaryActions = []

    if (actions.includes("reject")) {
      secondaryActions.push(
        <DropdownMenuItem key="reject" onClick={() => setShowRejectDialog(true)} className="text-red-600">
          <X className="h-4 w-4 mr-2" />
          Refuser
        </DropdownMenuItem>,
      )
    }

    if (actions.includes("view")) {
      secondaryActions.push(
        <DropdownMenuItem key="view" onClick={handleViewDetails}>
          <Eye className="h-4 w-4 mr-2" />
          Voir détails
        </DropdownMenuItem>,
      )
    }

    return secondaryActions
  }

  return (
    <div className="flex items-center gap-1">
      {/* Action principale */}
      {getPrimaryAction()}

      {/* Menu des actions secondaires */}
      {getSecondaryActions().length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">{getSecondaryActions()}</DropdownMenuContent>
        </DropdownMenu>
      )}

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
        tenantName={`${application.tenant?.first_name || ""} ${application.tenant?.last_name || ""}`.trim()}
        onSlotsProposed={handleSlotsProposed}
      />
    </div>
  )
}
