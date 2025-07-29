"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calendar, Send, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { VisitScheduler } from "./visit-scheduler"

interface VisitSlot {
  id?: string
  date: string
  start_time: string
  end_time: string
  max_capacity: number
  is_group_visit: boolean
  current_bookings: number
  is_available: boolean
}

interface VisitProposalManagerProps {
  isOpen: boolean
  onClose: () => void
  propertyId: string
  propertyTitle: string
  applicationId: string
  tenantName: string
  onSlotsProposed: (slots: VisitSlot[]) => void
}

const isFutureSlot = (slot: VisitSlot) => {
  const now = new Date()
  const slotDate = new Date(`${slot.date}T${slot.start_time}`)
  return slotDate > now
}

export function VisitProposalManager({
  isOpen,
  onClose,
  propertyId,
  propertyTitle,
  applicationId,
  tenantName,
  onSlotsProposed,
}: VisitProposalManagerProps) {
  const [visitSlots, setVisitSlots] = useState<VisitSlot[]>([])
  const [proposalMessage, setProposalMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [step, setStep] = useState<"configure" | "confirm">("configure")

  useEffect(() => {
    if (isOpen) {
      setStep("configure")
      setProposalMessage(
        `Bonjour ${tenantName},\n\nJe vous propose les créneaux suivants pour visiter le bien "${propertyTitle}".\n\nMerci de sélectionner le créneau qui vous convient le mieux.\n\nCordialement`,
      )
    }
  }, [isOpen, tenantName, propertyTitle])

  const handleSlotsChange = (slots: VisitSlot[]) => {
    setVisitSlots(slots)
  }

  const handleContinueToProposal = () => {
    const availableSlots = visitSlots.filter(
      (slot) => slot.is_available && 
      slot.current_bookings < slot.max_capacity && 
      isFutureSlot(slot)
    )

    if (availableSlots.length === 0) {
      toast.error("Vous devez configurer au moins un créneau disponible dans le futur")
      return
    }

    setStep("confirm")
  }

  const sendProposal = async () => {
    try {
      setIsSending(true)

      const availableSlots = visitSlots.filter(
        (slot) => slot.is_available && 
        slot.current_bookings < slot.max_capacity && 
        isFutureSlot(slot)
      )

      const slotIds = availableSlots.map((slot) => slot.id).filter(Boolean)

      if (slotIds.length === 0) {
        toast.error("Aucun créneau disponible à proposer")
        return
      }

      const response = await fetch(`/api/applications/${applicationId}/propose-visit-slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slot_ids: slotIds,
          message: proposalMessage,
          status: "visit_proposed",
        }),
      })

      if (response.ok) {
        onSlotsProposed(availableSlots)
        toast.success(`${availableSlots.length} créneau(x) proposé(s) à ${tenantName}`)
        onClose()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de l'envoi de la proposition")
      }
    } catch (error) {
      console.error("❌ Erreur envoi proposition:", error)
      toast.error("Erreur lors de l'envoi de la proposition")
    } finally {
      setIsSending(false)
    }
  }

  const availableSlots = visitSlots.filter(
    (slot) => slot.is_available && 
    slot.current_bookings < slot.max_capacity && 
    isFutureSlot(slot)
  )
  const bookedSlots = visitSlots.filter(
    (slot) => slot.current_bookings > 0 && 
    isFutureSlot(slot)
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {step === "configure"
              ? `Vérifier vos disponibilités - ${propertyTitle}`
              : `Confirmer la proposition - ${propertyTitle}`}
          </DialogTitle>
          <DialogDescription>
            {step === "configure"
              ? "Vérifiez vos disponibilités, le locataire pourra choisir un créneau parmi ceux configurés"
              : `Vous allez proposer ${availableSlots.length} créneau(x) à ${tenantName}`}
          </DialogDescription>
        </DialogHeader>

        {step === "configure" ? (
          <div className="space-y-6">
            {/* Statistiques */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {visitSlots.filter(isFutureSlot).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Créneaux total</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{availableSlots.length}</div>
                    <div className="text-sm text-muted-foreground">Disponibles</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{bookedSlots.length}</div>
                    <div className="text-sm text-muted-foreground">Réservés</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Interface de gestion des créneaux */}
            <VisitScheduler
              visitSlots={visitSlots}
              onSlotsChange={handleSlotsChange}
              mode="management"
              propertyId={propertyId}
            />

            {/* Alertes */}
            {visitSlots.length > 0 && availableSlots.length === 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-orange-800">Aucun créneau disponible</p>
                      <p className="text-sm text-orange-700">
                        Tous vos créneaux sont complets ou expirés. Ajoutez de nouveaux créneaux ou augmentez la capacité des
                        existants.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Résumé de la proposition */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Créneaux à proposer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {availableSlots
                    .sort((a, b) => {
                      if (a.date !== b.date) return a.date.localeCompare(b.date)
                      return a.start_time.localeCompare(b.start_time)
                    })
                    .map((slot, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">
                            {new Date(slot.date).toLocaleDateString("fr-FR", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                            })}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {slot.start_time} - {slot.end_time}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {slot.max_capacity - slot.current_bookings} place(s) disponible(s)
                          </Badge>
                          {slot.is_group_visit && <Badge variant="secondary">Visite groupée</Badge>}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Message de proposition */}
            <Card>
              <CardHeader>
                <CardTitle>Message pour le candidat</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={proposalMessage}
                  onChange={(e) => setProposalMessage(e.target.value)}
                  rows={6}
                  placeholder="Message personnalisé pour le candidat..."
                />
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          {step === "configure" ? (
            <Button onClick={handleContinueToProposal} disabled={availableSlots.length === 0}>
              Continuer ({availableSlots.length} créneau(x))
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep("configure")}>
                Retour
              </Button>
              <Button onClick={sendProposal} disabled={isSending}>
                {isSending ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                Envoyer la proposition
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}