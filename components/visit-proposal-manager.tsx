"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Calendar, Check, X, Plus, Trash2, AlertTriangle, Edit, Save, RefreshCw, Send } from "lucide-react"
import { toast } from "sonner"
import { getAuthHeaders } from "@/lib/auth-utils"

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

interface ConflictingSlot {
  propertyId: string
  propertyTitle: string
  slot: VisitSlot
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

export function VisitProposalManager({
  isOpen,
  onClose,
  propertyId,
  propertyTitle,
  applicationId,
  tenantName,
  onSlotsProposed,
}: VisitProposalManagerProps) {
  const [availableSlots, setAvailableSlots] = useState<VisitSlot[]>([])
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set())
  const [conflictingSlots, setConflictingSlots] = useState<ConflictingSlot[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingSlot, setEditingSlot] = useState<VisitSlot | null>(null)
  const [showConflictDialog, setShowConflictDialog] = useState(false)
  const [proposalMessage, setProposalMessage] = useState("")
  const [showAddSlot, setShowAddSlot] = useState(false)
  const [newSlot, setNewSlot] = useState({
    date: "",
    start_time: "",
    end_time: "",
    max_capacity: 1,
    is_group_visit: false,
  })

  useEffect(() => {
    if (isOpen) {
      loadAvailableSlots()
      setProposalMessage(
        `Bonjour ${tenantName},\n\nJe vous propose les créneaux suivants pour visiter le bien "${propertyTitle}" :\n\nMerci de me confirmer votre disponibilité.\n\nCordialement`,
      )
    }
  }, [isOpen, propertyId, tenantName, propertyTitle])

  const loadAvailableSlots = async () => {
    setIsLoading(true)
    try {
      console.log("🔄 Chargement des créneaux pour proposition...")

      const headers = await getAuthHeaders()
      const response = await fetch(`/api/properties/${propertyId}/visit-slots`, {
        headers,
      })

      if (response.ok) {
        const data = await response.json()
        console.log("✅ Créneaux chargés:", data.slots?.length || 0)

        // Filtrer les créneaux futurs et disponibles
        const futureSlots = (data.slots || []).filter((slot: VisitSlot) => {
          const slotDate = new Date(slot.date)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          return slotDate >= today && slot.is_available && slot.current_bookings < slot.max_capacity
        })

        setAvailableSlots(futureSlots)

        // Vérifier les conflits avec d'autres propriétés
        await checkForConflicts(futureSlots)
      } else {
        console.error("❌ Erreur chargement créneaux:", response.status)
        if (response.status === 401) {
          toast.error("Erreur d'authentification. Veuillez vous reconnecter.")
        } else {
          toast.error("Erreur lors du chargement des créneaux")
        }
      }
    } catch (error) {
      console.error("❌ Erreur chargement créneaux:", error)
      toast.error("Erreur lors du chargement des créneaux")
    } finally {
      setIsLoading(false)
    }
  }

  const checkForConflicts = async (slots: VisitSlot[]) => {
    try {
      // Simuler la vérification des conflits
      // Dans un vrai système, on ferait un appel API pour vérifier les autres propriétés du propriétaire
      const conflicts: ConflictingSlot[] = []

      // Exemple de conflit simulé (à remplacer par un vrai appel API)
      slots.forEach((slot) => {
        if (slot.date === "2025-05-28" && slot.start_time === "14:00") {
          conflicts.push({
            propertyId: "autre-propriete-id",
            propertyTitle: "Appartement Rue de la Paix",
            slot,
          })
        }
      })

      setConflictingSlots(conflicts)
    } catch (error) {
      console.error("❌ Erreur vérification conflits:", error)
    }
  }

  const saveSlots = async (slots: VisitSlot[]) => {
    setIsSaving(true)
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/properties/${propertyId}/visit-slots`, {
        method: "POST",
        headers,
        body: JSON.stringify({ slots }),
      })

      if (response.ok) {
        await loadAvailableSlots()
        toast.success("Créneaux mis à jour")
      } else {
        if (response.status === 401) {
          toast.error("Erreur d'authentification. Veuillez vous reconnecter.")
        } else {
          throw new Error("Erreur lors de la sauvegarde")
        }
      }
    } catch (error) {
      console.error("❌ Erreur sauvegarde:", error)
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setIsSaving(false)
    }
  }

  const toggleSlotSelection = (slotId: string) => {
    const newSelected = new Set(selectedSlots)
    if (newSelected.has(slotId)) {
      newSelected.delete(slotId)
    } else {
      newSelected.add(slotId)
    }
    setSelectedSlots(newSelected)
  }

  const addNewSlot = async () => {
    if (!newSlot.date || !newSlot.start_time || !newSlot.end_time) {
      toast.error("Veuillez remplir tous les champs")
      return
    }

    const slot: VisitSlot = {
      date: newSlot.date,
      start_time: newSlot.start_time,
      end_time: newSlot.end_time,
      max_capacity: newSlot.max_capacity,
      is_group_visit: newSlot.is_group_visit,
      current_bookings: 0,
      is_available: true,
    }

    const updatedSlots = [...availableSlots, slot]
    await saveSlots(updatedSlots)

    setNewSlot({
      date: "",
      start_time: "",
      end_time: "",
      max_capacity: 1,
      is_group_visit: false,
    })
    setShowAddSlot(false)
  }

  const updateSlot = async (updatedSlot: VisitSlot) => {
    const updatedSlots = availableSlots.map((slot) =>
      slot.id === updatedSlot.id ||
      `${slot.date}-${slot.start_time}` === `${updatedSlot.date}-${updatedSlot.start_time}`
        ? updatedSlot
        : slot,
    )
    await saveSlots(updatedSlots)
    setEditingSlot(null)
  }

  const deleteSlot = async (slotToDelete: VisitSlot) => {
    const updatedSlots = availableSlots.filter(
      (slot) =>
        slot.id !== slotToDelete.id &&
        `${slot.date}-${slot.start_time}` !== `${slotToDelete.date}-${slotToDelete.start_time}`,
    )
    await saveSlots(updatedSlots)
  }

  const proposeSelectedSlots = async () => {
    if (selectedSlots.size === 0) {
      toast.error("Veuillez sélectionner au moins un créneau")
      return
    }

    // Vérifier s'il y a des conflits dans les créneaux sélectionnés
    const selectedSlotsData = availableSlots.filter((slot) => {
      const slotId = slot.id || `${slot.date}-${slot.start_time}`
      return selectedSlots.has(slotId)
    })

    const hasConflicts = selectedSlotsData.some((slot) =>
      conflictingSlots.some(
        (conflict) => conflict.slot.date === slot.date && conflict.slot.start_time === slot.start_time,
      ),
    )

    if (hasConflicts) {
      setShowConflictDialog(true)
      return
    }

    await sendProposal(selectedSlotsData)
  }

  const sendProposal = async (slotsToPropose: VisitSlot[]) => {
    try {
      setIsSaving(true)

      // Extraire les IDs des créneaux sélectionnés
      const slotIds = slotsToPropose.map((slot) => slot.id).filter(Boolean)

      // Utiliser la nouvelle API pour proposer les créneaux
      const response = await fetch(`/api/applications/${applicationId}/propose-visit-slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slot_ids: slotIds,
          message: proposalMessage,
        }),
      })

      if (response.ok) {
        onSlotsProposed(slotsToPropose)
        toast.success(`${slotsToPropose.length} créneau(x) proposé(s) à ${tenantName}`)
        onClose()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de l'envoi de la proposition")
      }
    } catch (error) {
      console.error("❌ Erreur envoi proposition:", error)
      toast.error("Erreur lors de l'envoi de la proposition")
    } finally {
      setIsSaving(false)
    }
  }

  // Grouper les créneaux par date
  const slotsByDate = availableSlots.reduce(
    (acc, slot) => {
      if (!acc[slot.date]) {
        acc[slot.date] = []
      }
      acc[slot.date].push(slot)
      return acc
    },
    {} as Record<string, VisitSlot[]>,
  )

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
  }

  const isSlotConflicting = (slot: VisitSlot) => {
    return conflictingSlots.some(
      (conflict) => conflict.slot.date === slot.date && conflict.slot.start_time === slot.start_time,
    )
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Proposer une visite - {propertyTitle}
            </DialogTitle>
            <DialogDescription>Gérez vos créneaux disponibles et proposez une visite à {tenantName}</DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2">Chargement des créneaux...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Actions rapides */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{availableSlots.length} créneaux disponibles</Badge>
                  {selectedSlots.size > 0 && <Badge variant="default">{selectedSlots.size} sélectionnés</Badge>}
                  {conflictingSlots.length > 0 && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {conflictingSlots.length} conflit(s)
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowAddSlot(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter un créneau
                  </Button>
                  <Button variant="outline" size="sm" onClick={loadAvailableSlots} disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
                    Actualiser
                  </Button>
                </div>
              </div>

              {/* Créneaux disponibles */}
              {Object.keys(slotsByDate).length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Aucun créneau disponible</h3>
                    <p className="text-muted-foreground mb-4">
                      Vous devez d'abord configurer des créneaux de visite pour cette propriété.
                    </p>
                    <Button onClick={() => setShowAddSlot(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter un créneau
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(slotsByDate).map(([date, slots]) => (
                    <Card key={date}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-center">{formatDate(date)}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {slots.map((slot) => {
                          const slotId = slot.id || `${slot.date}-${slot.start_time}`
                          const isSelected = selectedSlots.has(slotId)
                          const isConflicting = isSlotConflicting(slot)
                          const isEditing = editingSlot?.id === slot.id || editingSlot === slot

                          if (isEditing) {
                            return (
                              <div key={slotId} className="border rounded p-2 space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <Input
                                    type="time"
                                    value={editingSlot.start_time}
                                    onChange={(e) => setEditingSlot({ ...editingSlot, start_time: e.target.value })}
                                  />
                                  <Input
                                    type="time"
                                    value={editingSlot.end_time}
                                    onChange={(e) => setEditingSlot({ ...editingSlot, end_time: e.target.value })}
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={editingSlot.max_capacity}
                                    onChange={(e) =>
                                      setEditingSlot({ ...editingSlot, max_capacity: Number(e.target.value) })
                                    }
                                    className="w-16"
                                  />
                                  <Switch
                                    checked={editingSlot.is_group_visit}
                                    onCheckedChange={(checked) =>
                                      setEditingSlot({ ...editingSlot, is_group_visit: checked })
                                    }
                                  />
                                  <span className="text-xs">Groupe</span>
                                </div>
                                <div className="flex gap-1">
                                  <Button size="sm" onClick={() => updateSlot(editingSlot)} disabled={isSaving}>
                                    <Save className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingSlot(null)}
                                    disabled={isSaving}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            )
                          }

                          return (
                            <div
                              key={slotId}
                              className={`flex items-center justify-between p-2 border rounded cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-blue-50 border-blue-300"
                                  : isConflicting
                                    ? "bg-orange-50 border-orange-300"
                                    : "hover:bg-gray-50"
                              }`}
                              onClick={() => toggleSlotSelection(slotId)}
                            >
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-medium">
                                  {slot.start_time} - {slot.end_time}
                                </div>
                                {isConflicting && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                                {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                              </div>

                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className="text-xs">
                                  {slot.current_bookings}/{slot.max_capacity}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingSlot(slot)
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteSlot(slot)
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Message de proposition */}
              {selectedSlots.size > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Message de proposition</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={proposalMessage}
                      onChange={(e) => setProposalMessage(e.target.value)}
                      rows={4}
                      placeholder="Message personnalisé pour le candidat..."
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            {selectedSlots.size > 0 && (
              <Button onClick={proposeSelectedSlots} disabled={isSaving}>
                {isSaving ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                Proposer {selectedSlots.size} créneau(x)
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog d'ajout de créneau */}
      <Dialog open={showAddSlot} onOpenChange={setShowAddSlot}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un créneau</DialogTitle>
            <DialogDescription>Créez un nouveau créneau de visite pour cette propriété</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={newSlot.date}
                onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Heure de début</Label>
                <Input
                  type="time"
                  value={newSlot.start_time}
                  onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Heure de fin</Label>
                <Input
                  type="time"
                  value={newSlot.end_time}
                  onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Capacité maximale</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={newSlot.max_capacity}
                onChange={(e) => setNewSlot({ ...newSlot, max_capacity: Number(e.target.value) })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={newSlot.is_group_visit}
                onCheckedChange={(checked) => setNewSlot({ ...newSlot, is_group_visit: checked })}
              />
              <Label>Visite groupée</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSlot(false)}>
              Annuler
            </Button>
            <Button onClick={addNewSlot} disabled={isSaving}>
              {isSaving ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation des conflits */}
      <AlertDialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Conflits détectés
            </AlertDialogTitle>
            <AlertDialogDescription>
              Certains créneaux sélectionnés sont en conflit avec d'autres propriétés :
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            {conflictingSlots
              .filter((conflict) => {
                const selectedSlotsData = availableSlots.filter((slot) => {
                  const slotId = slot.id || `${slot.date}-${slot.start_time}`
                  return selectedSlots.has(slotId)
                })
                return selectedSlotsData.some(
                  (slot) => slot.date === conflict.slot.date && slot.start_time === conflict.slot.start_time,
                )
              })
              .map((conflict, index) => (
                <div key={index} className="p-3 border rounded bg-orange-50">
                  <div className="font-medium">{conflict.propertyTitle}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(conflict.slot.date)} à {conflict.slot.start_time}
                  </div>
                </div>
              ))}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Modifier la sélection</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const selectedSlotsData = availableSlots.filter((slot) => {
                  const slotId = slot.id || `${slot.date}-${slot.start_time}`
                  return selectedSlots.has(slotId)
                })
                sendProposal(selectedSlotsData)
                setShowConflictDialog(false)
              }}
            >
              Continuer malgré les conflits
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
