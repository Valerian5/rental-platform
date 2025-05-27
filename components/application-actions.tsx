"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Check, X, Calendar, Eye, Clock, Send, UserCheck, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface ApplicationActionsProps {
  application: any
  onStatusChange: (id: string, status: string, notes?: string) => void
  onProposeVisit: (id: string, slots: any[]) => void
  onSelectCandidate: (id: string) => void
}

export function ApplicationActions({
  application,
  onStatusChange,
  onProposeVisit,
  onSelectCandidate,
}: ApplicationActionsProps) {
  const [rejectReason, setRejectReason] = useState("")
  const [customReason, setCustomReason] = useState("")
  const [selectedSlots, setSelectedSlots] = useState<string[]>([])
  const [visitMessage, setVisitMessage] = useState("")

  const rejectReasons = [
    "Revenus insuffisants",
    "Dossier incomplet",
    "Pas de garant",
    "Profil ne correspond pas",
    "Bien déjà loué",
    "Autre (préciser)",
  ]

  // Créneaux de visite simulés (à remplacer par les vrais créneaux)
  const availableSlots = [
    { id: "1", date: "2024-01-15", time: "14:00-15:00", available: true },
    { id: "2", date: "2024-01-15", time: "15:00-16:00", available: true },
    { id: "3", date: "2024-01-16", time: "10:00-11:00", available: true },
    { id: "4", date: "2024-01-16", time: "14:00-15:00", available: false },
    { id: "5", date: "2024-01-17", time: "16:00-17:00", available: true },
  ]

  const handleReject = () => {
    const finalReason = rejectReason === "Autre (préciser)" ? customReason : rejectReason
    if (!finalReason) {
      toast.error("Veuillez sélectionner un motif de refus")
      return
    }

    onStatusChange(application.id, "rejected", finalReason)
    setRejectReason("")
    setCustomReason("")
  }

  const handleProposeVisit = () => {
    if (selectedSlots.length === 0) {
      toast.error("Veuillez sélectionner au moins un créneau")
      return
    }

    const slots = selectedSlots.map((slotId) => availableSlots.find((slot) => slot.id === slotId)).filter(Boolean)

    onProposeVisit(application.id, slots)
    setSelectedSlots([])
    setVisitMessage("")
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        )
      case "visit_proposed":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Calendar className="h-3 w-3 mr-1" />
            Visite proposée
          </Badge>
        )
      case "visit_scheduled":
        return (
          <Badge className="bg-purple-100 text-purple-800">
            <Calendar className="h-3 w-3 mr-1" />
            Visite programmée
          </Badge>
        )
      case "visit_completed":
        return (
          <Badge className="bg-indigo-100 text-indigo-800">
            <Check className="h-3 w-3 mr-1" />
            Visite effectuée
          </Badge>
        )
      case "selected":
        return (
          <Badge className="bg-green-100 text-green-800">
            <UserCheck className="h-3 w-3 mr-1" />
            Candidat sélectionné
          </Badge>
        )
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800">
            <Check className="h-3 w-3 mr-1" />
            Approuvé
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive">
            <X className="h-3 w-3 mr-1" />
            Rejeté
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="flex items-center space-x-2">
      {getStatusBadge(application.status)}

      {application.status === "pending" && (
        <>
          {/* Bouton Approuver rapide */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onStatusChange(application.id, "approved")}
            className="text-green-600 border-green-600 hover:bg-green-50"
          >
            <Check className="h-4 w-4" />
          </Button>

          {/* Dialog Proposer une visite */}
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                <Calendar className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Proposer une visite</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Candidat</Label>
                  <p className="text-sm text-muted-foreground">
                    {application.tenant?.first_name} {application.tenant?.last_name} - {application.property?.title}
                  </p>
                </div>

                <div>
                  <Label>Créneaux disponibles</Label>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {availableSlots.map((slot) => (
                      <div key={slot.id} className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedSlots.includes(slot.id)}
                          disabled={!slot.available}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSlots([...selectedSlots, slot.id])
                            } else {
                              setSelectedSlots(selectedSlots.filter((id) => id !== slot.id))
                            }
                          }}
                        />
                        <span className={`text-sm ${!slot.available ? "text-muted-foreground line-through" : ""}`}>
                          {new Date(slot.date).toLocaleDateString("fr-FR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}{" "}
                          - {slot.time}
                        </span>
                        {!slot.available && (
                          <Badge variant="secondary" className="text-xs">
                            Occupé
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Message personnalisé (optionnel)</Label>
                  <Textarea
                    placeholder="Bonjour, je vous propose les créneaux suivants pour visiter le bien..."
                    value={visitMessage}
                    onChange={(e) => setVisitMessage(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setSelectedSlots([])}>
                    Annuler
                  </Button>
                  <Button onClick={handleProposeVisit} disabled={selectedSlots.length === 0}>
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer la proposition
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Dialog Rejeter */}
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                <X className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rejeter la candidature</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Candidat</Label>
                  <p className="text-sm text-muted-foreground">
                    {application.tenant?.first_name} {application.tenant?.last_name}
                  </p>
                </div>

                <div>
                  <Label>Motif du refus</Label>
                  <Select value={rejectReason} onValueChange={setRejectReason}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionnez un motif" />
                    </SelectTrigger>
                    <SelectContent>
                      {rejectReasons.map((reason) => (
                        <SelectItem key={reason} value={reason}>
                          {reason}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {rejectReason === "Autre (préciser)" && (
                  <div>
                    <Label>Précisez le motif</Label>
                    <Textarea
                      placeholder="Veuillez préciser le motif du refus..."
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}

                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">Information</p>
                      <p>Le candidat recevra une notification de refus avec le motif sélectionné.</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline">Annuler</Button>
                  <Button variant="destructive" onClick={handleReject}>
                    <X className="h-4 w-4 mr-2" />
                    Confirmer le refus
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}

      {application.status === "visit_completed" && (
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-green-600 hover:bg-green-700">
              <UserCheck className="h-4 w-4 mr-1" />
              Sélectionner
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sélectionner ce candidat</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-start space-x-2">
                  <UserCheck className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800">Sélection du candidat</p>
                    <p className="text-sm text-green-700 mt-1">En sélectionnant ce candidat, vous :</p>
                    <ul className="text-sm text-green-700 mt-2 space-y-1">
                      <li>• Envoyez une notification d'acceptation au candidat</li>
                      <li>• Rejetez automatiquement tous les autres candidats</li>
                      <li>• Lancez le processus de signature du bail</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Candidat :{" "}
                  <span className="font-medium">
                    {application.tenant?.first_name} {application.tenant?.last_name}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Propriété : <span className="font-medium">{application.property?.title}</span>
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline">Annuler</Button>
                <Button onClick={() => onSelectCandidate(application.id)} className="bg-green-600 hover:bg-green-700">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Confirmer la sélection
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Bouton Examiner toujours disponible */}
      <Button size="sm" variant="outline" asChild>
        <a href={`/owner/applications/${application.id}`}>
          <Eye className="h-4 w-4" />
        </a>
      </Button>
    </div>
  )
}
