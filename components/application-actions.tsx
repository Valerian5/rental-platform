"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Check,
  X,
  Calendar,
  Eye,
  Clock,
  Send,
  UserCheck,
  AlertCircle,
  MessageSquare,
  CalendarCheck,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Users,
  MapPin,
} from "lucide-react"
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
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [visitDialogOpen, setVisitDialogOpen] = useState(false)
  const [selectDialogOpen, setSelectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [customReason, setCustomReason] = useState("")
  const [selectedSlots, setSelectedSlots] = useState<string[]>([])
  const [visitMessage, setVisitMessage] = useState("")
  const [availableSlots, setAvailableSlots] = useState<any[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  const rejectReasons = [
    "Revenus insuffisants par rapport au loyer",
    "Dossier incomplet ou documents manquants",
    "Absence de garant requis",
    "Profil ne correspondant pas aux critères",
    "Bien déjà attribué à un autre candidat",
    "Références professionnelles insuffisantes",
    "Autre motif (à préciser)",
  ]

  useEffect(() => {
    if (visitDialogOpen) {
      loadAvailableSlots()
    }
  }, [visitDialogOpen])

  const loadAvailableSlots = async () => {
    setLoadingSlots(true)
    try {
      const response = await fetch(`/api/properties/${application.property_id}/visit-slots`)
      if (response.ok) {
        const data = await response.json()
        setAvailableSlots(data.slots || [])
      } else {
        toast.error("Erreur lors du chargement des créneaux")
      }
    } catch (error) {
      console.error("Erreur chargement créneaux:", error)
      toast.error("Erreur lors du chargement des créneaux")
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleReject = () => {
    const finalReason = rejectReason === "Autre motif (à préciser)" ? customReason : rejectReason
    if (!finalReason) {
      toast.error("Veuillez sélectionner un motif de refus")
      return
    }

    onStatusChange(application.id, "rejected", finalReason)
    setRejectDialogOpen(false)
    setRejectReason("")
    setCustomReason("")
    toast.success("Candidature rejetée avec notification envoyée")
  }

  const handleProposeVisit = () => {
    if (selectedSlots.length === 0) {
      toast.error("Veuillez sélectionner au moins un créneau")
      return
    }

    const slots = selectedSlots.map((slotId) => availableSlots.find((slot) => slot.id === slotId)).filter(Boolean)

    onProposeVisit(application.id, slots)
    setVisitDialogOpen(false)
    setSelectedSlots([])
    setVisitMessage("")
    toast.success(`${slots.length} créneau(x) proposé(s) au candidat`)
  }

  const handleSelectCandidate = () => {
    onSelectCandidate(application.id)
    setSelectDialogOpen(false)
    toast.success("Candidat sélectionné - Notifications envoyées")
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: {
        icon: Clock,
        label: "En attente",
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
      },
      visit_proposed: {
        icon: Calendar,
        label: "Visite proposée",
        className: "bg-blue-100 text-blue-800 border-blue-200",
      },
      visit_scheduled: {
        icon: CalendarCheck,
        label: "Visite programmée",
        className: "bg-purple-100 text-purple-800 border-purple-200",
      },
      visit_completed: {
        icon: CheckCircle2,
        label: "Visite effectuée",
        className: "bg-indigo-100 text-indigo-800 border-indigo-200",
      },
      selected: {
        icon: UserCheck,
        label: "Sélectionné",
        className: "bg-green-100 text-green-800 border-green-200",
      },
      approved: {
        icon: CheckCircle2,
        label: "Approuvé",
        className: "bg-green-100 text-green-800 border-green-200",
      },
      rejected: {
        icon: XCircle,
        label: "Rejeté",
        className: "bg-red-100 text-red-800 border-red-200",
      },
    }

    const badge = badges[status as keyof typeof badges] || badges.pending
    const Icon = badge.icon

    return (
      <Badge className={`${badge.className} border`}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.label}
      </Badge>
    )
  }

  // Grouper les créneaux par date
  const slotsByDate = availableSlots.reduce(
    (acc, slot) => {
      const date = slot.date
      if (!acc[date]) acc[date] = []
      acc[date].push(slot)
      return acc
    },
    {} as Record<string, any[]>,
  )

  return (
    <div className="flex items-center space-x-2">
      {getStatusBadge(application.status)}

      {/* Actions selon le statut */}
      {application.status === "pending" && (
        <div className="flex items-center space-x-1">
          {/* Approuver rapidement */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onStatusChange(application.id, "approved")}
            className="text-green-600 border-green-600 hover:bg-green-50 transition-colors"
          >
            <Check className="h-4 w-4" />
          </Button>

          {/* Proposer une visite */}
          <Dialog open={visitDialogOpen} onOpenChange={setVisitDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="text-blue-600 border-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Proposer des créneaux de visite
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Infos candidat */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {application.tenant?.first_name?.[0]}
                            {application.tenant?.last_name?.[0]}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold">
                            {application.tenant?.first_name} {application.tenant?.last_name}
                          </h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {application.property?.title}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{application.tenant?.email}</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Créneaux disponibles */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-base font-medium">Créneaux disponibles</Label>
                    <Button variant="outline" size="sm" onClick={loadAvailableSlots} disabled={loadingSlots}>
                      <RefreshCw className={`h-4 w-4 mr-1 ${loadingSlots ? "animate-spin" : ""}`} />
                      Actualiser
                    </Button>
                  </div>

                  {loadingSlots ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">Chargement des créneaux...</p>
                    </div>
                  ) : Object.keys(slotsByDate).length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="font-semibold mb-2">Aucun créneau configuré</h3>
                        <p className="text-muted-foreground mb-4">
                          Vous devez d'abord configurer des créneaux de visite pour cette propriété.
                        </p>
                        <Button variant="outline" asChild>
                          <a href={`/owner/properties/${application.property_id}/edit#visit-slots`}>
                            Configurer les créneaux
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(slotsByDate).map(([date, slots]) => (
                        <Card key={date} className="overflow-hidden">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm text-center">
                              {new Date(date).toLocaleDateString("fr-FR", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                              })}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0 space-y-2">
                            {slots.map((slot) => {
                              const slotId = `${slot.date}-${slot.start_time}`
                              const isSelected = selectedSlots.includes(slotId)
                              const isAvailable = slot.available !== false

                              return (
                                <div
                                  key={slotId}
                                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                    !isAvailable
                                      ? "bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed"
                                      : isSelected
                                        ? "bg-blue-50 border-blue-200 shadow-sm"
                                        : "bg-white border-gray-200 hover:border-blue-200 hover:bg-blue-50/50"
                                  }`}
                                  onClick={() => {
                                    if (!isAvailable) return
                                    if (isSelected) {
                                      setSelectedSlots(selectedSlots.filter((id) => id !== slotId))
                                    } else {
                                      setSelectedSlots([...selectedSlots, slotId])
                                    }
                                  }}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Checkbox checked={isSelected} disabled={!isAvailable} readOnly />
                                      <div>
                                        <div className="font-medium text-sm">
                                          {slot.start_time} - {slot.end_time}
                                        </div>
                                        {!isAvailable && <div className="text-xs text-red-600">Occupé</div>}
                                      </div>
                                    </div>
                                    {isSelected && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                                  </div>
                                </div>
                              )
                            })}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Message personnalisé */}
                {selectedSlots.length > 0 && (
                  <div>
                    <Label>Message personnalisé (optionnel)</Label>
                    <Textarea
                      placeholder="Bonjour, je vous propose les créneaux suivants pour visiter le bien. N'hésitez pas à me contacter si vous avez des questions..."
                      value={visitMessage}
                      onChange={(e) => setVisitMessage(e.target.value)}
                      className="mt-2"
                      rows={3}
                    />
                  </div>
                )}

                {/* Résumé sélection */}
                {selectedSlots.length > 0 && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">
                          {selectedSlots.length} créneau(x) sélectionné(s)
                        </span>
                      </div>
                      <div className="text-sm text-blue-700">
                        Le candidat recevra une notification avec ces créneaux et pourra choisir celui qui lui convient.
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setVisitDialogOpen(false)}>
                  Annuler
                </Button>
                <Button
                  onClick={handleProposeVisit}
                  disabled={selectedSlots.length === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer la proposition
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Rejeter */}
          <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50 transition-colors"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  Rejeter la candidature
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Infos candidat */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {application.tenant?.first_name} {application.tenant?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{application.tenant?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Motif du refus */}
                <div>
                  <Label>Motif du refus *</Label>
                  <Select value={rejectReason} onValueChange={setRejectReason}>
                    <SelectTrigger className="mt-2">
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

                {/* Motif personnalisé */}
                {rejectReason === "Autre motif (à préciser)" && (
                  <div>
                    <Label>Précisez le motif *</Label>
                    <Textarea
                      placeholder="Veuillez préciser le motif du refus..."
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      className="mt-2"
                      rows={3}
                    />
                  </div>
                )}

                {/* Avertissement */}
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-800 mb-1">Notification automatique</p>
                        <p className="text-yellow-700">
                          Le candidat recevra une notification de refus avec le motif sélectionné. Cette action est
                          définitive.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={!rejectReason || (rejectReason === "Autre motif (à préciser)" && !customReason)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Confirmer le refus
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Sélectionner candidat après visite */}
      {application.status === "visit_completed" && (
        <Dialog open={selectDialogOpen} onOpenChange={setSelectDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-green-600 hover:bg-green-700">
              <UserCheck className="h-4 w-4 mr-1" />
              Sélectionner
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-green-600" />
                Sélectionner ce candidat
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Candidat sélectionné */}
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
                      <span className="text-white font-bold">
                        {application.tenant?.first_name?.[0]}
                        {application.tenant?.last_name?.[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-800">
                        {application.tenant?.first_name} {application.tenant?.last_name}
                      </h3>
                      <p className="text-sm text-green-700">{application.property?.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Conséquences */}
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3">En sélectionnant ce candidat :</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Notification d'acceptation envoyée au candidat</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span>Rejet automatique des autres candidats</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                      <span>Lancement du processus de signature du bail</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSelectCandidate} className="bg-green-600 hover:bg-green-700">
                <UserCheck className="h-4 w-4 mr-2" />
                Confirmer la sélection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Examiner en détail - toujours disponible */}
      <Button size="sm" variant="outline" asChild>
        <a href={`/owner/applications/${application.id}`}>
          <Eye className="h-4 w-4" />
        </a>
      </Button>
    </div>
  )
}
