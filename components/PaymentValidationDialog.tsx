"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Euro, Calendar, User, Home } from "lucide-react"
import { Payment, PaymentMethod } from "@/lib/payment-models"
import { paymentService } from "@/lib/payment-service"
import { toast } from "sonner"

interface PaymentValidationDialogProps {
  payment: Payment | null
  isOpen: boolean
  onClose: () => void
  onValidation: () => void
}

export function PaymentValidationDialog({ payment, isOpen, onClose, onValidation }: PaymentValidationDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [validationType, setValidationType] = useState<'paid' | 'unpaid'>('paid')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('virement')
  const [notes, setNotes] = useState('')

  if (!payment) return null

  const handleValidation = async () => {
    if (!payment) return

    setIsLoading(true)
    try {
      if (validationType === 'paid') {
        await paymentService.validatePayment({
          payment_id: payment.id,
          status: 'paid',
          payment_date: paymentDate,
          payment_method: paymentMethod,
          notes: notes || undefined
        })
        toast.success("Paiement confirmé et quittance générée")
      } else {
        await paymentService.validatePayment({
          payment_id: payment.id,
          status: 'unpaid',
          notes: notes || "Marqué comme impayé"
        })
        toast.success("Paiement marqué comme impayé")
      }
      
      onValidation()
      onClose()
    } catch (error) {
      console.error('Erreur validation paiement:', error)
      toast.error("Erreur lors de la validation du paiement")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendReminder = async () => {
    if (!payment) return

    setIsLoading(true)
    try {
      await paymentService.sendReminder({
        payment_id: payment.id,
        reminder_type: 'first'
      })
      toast.success("Rappel envoyé au locataire")
      onValidation()
      onClose()
    } catch (error) {
      console.error('Erreur envoi rappel:', error)
      toast.error("Erreur lors de l'envoi du rappel")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Euro className="h-5 w-5" />
            Validation du Paiement
          </DialogTitle>
          <DialogDescription>
            Confirmez la réception du paiement ou marquez-le comme impayé
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations du paiement */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-3">Détails du Paiement</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Période:</span>
                <span>{payment.month_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Euro className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Montant:</span>
                <span className="font-bold">{payment.amount_due}€</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Locataire:</span>
                <span>{payment.leases?.tenant?.first_name} {payment.leases?.tenant?.last_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Propriété:</span>
                <span>{payment.leases?.property?.title}</span>
              </div>
            </div>
            <div className="mt-3">
              <Badge variant={payment.status === 'pending' ? 'secondary' : payment.status === 'paid' ? 'default' : 'destructive'}>
                {payment.status === 'pending' ? 'En attente' : payment.status === 'paid' ? 'Payé' : 'Impayé'}
              </Badge>
            </div>
          </div>

          {/* Type de validation */}
          <div className="space-y-2">
            <Label>Type de validation</Label>
            <div className="flex gap-4">
              <Button
                variant={validationType === 'paid' ? 'default' : 'outline'}
                onClick={() => setValidationType('paid')}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Paiement reçu
              </Button>
              <Button
                variant={validationType === 'unpaid' ? 'destructive' : 'outline'}
                onClick={() => setValidationType('unpaid')}
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Non reçu
              </Button>
            </div>
          </div>

          {/* Détails du paiement (si payé) */}
          {validationType === 'paid' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentDate">Date de paiement</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Mode de paiement</Label>
                <Select value={paymentMethod} onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="virement">Virement</SelectItem>
                    <SelectItem value="cheque">Chèque</SelectItem>
                    <SelectItem value="especes">Espèces</SelectItem>
                    <SelectItem value="prelevement">Prélèvement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Ajoutez des notes sur ce paiement..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Répartition loyer/charges */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Répartition pour le module fiscal</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Loyer:</span>
                <span className="ml-2 font-bold">{payment.rent_amount}€</span>
              </div>
              <div>
                <span className="font-medium">Charges:</span>
                <span className="ml-2 font-bold">{payment.charges_amount}€</span>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Ces montants seront automatiquement transmis au module fiscal
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          {validationType === 'unpaid' && (
            <Button 
              variant="secondary" 
              onClick={handleSendReminder}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              Envoyer un rappel
            </Button>
          )}
          <Button 
            onClick={handleValidation}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {validationType === 'paid' ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Confirmer le paiement
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                Marquer comme impayé
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
