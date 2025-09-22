"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Euro, 
  Calendar, 
  User, 
  Home, 
  FileText, 
  Download, 
  Send,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from "lucide-react"
import { Payment } from "@/lib/payment-models"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface PaymentDetailsProps {
  payment: Payment
  onValidate: (payment: Payment) => void
  onSendReminder: (payment: Payment) => void
  onDownloadReceipt: (payment: Payment) => void
}

export function PaymentDetails({ payment, onValidate, onSendReminder, onDownloadReceipt }: PaymentDetailsProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <XCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Payé</Badge>
      case 'overdue':
        return <Badge variant="destructive">En retard</Badge>
      case 'pending':
        return <Badge variant="secondary">En attente</Badge>
      default:
        return <Badge variant="outline">Annulé</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMMM yyyy', { locale: fr })
    } catch {
      return dateString
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(payment.status)}
              Paiement {payment.month_name}
            </CardTitle>
            <CardDescription>
              Référence: {payment.reference}
            </CardDescription>
          </div>
          {getStatusBadge(payment.status)}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Informations principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Échéance:</span>
              <span>{formatDate(payment.due_date)}</span>
            </div>
            
            {payment.payment_date && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="font-medium">Payé le:</span>
                <span>{formatDate(payment.payment_date)}</span>
              </div>
            )}
            
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

          {/* Montants */}
          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Montant total</span>
                <span className="text-2xl font-bold text-blue-600">{payment.amount_due}€</span>
              </div>
              
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Loyer:</span>
                  <span>{payment.rent_amount}€</span>
                </div>
                <div className="flex justify-between">
                  <span>Charges:</span>
                  <span>{payment.charges_amount}€</span>
                </div>
              </div>
            </div>

            {payment.payment_method && (
              <div className="text-sm">
                <span className="font-medium">Mode de paiement:</span>
                <span className="ml-2 capitalize">{payment.payment_method}</span>
              </div>
            )}
          </div>
        </div>

        {/* Répartition pour le module fiscal */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Répartition pour le module fiscal
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{payment.rent_amount}€</div>
              <div className="text-sm text-gray-600">Loyer (revenus)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{payment.charges_amount}€</div>
              <div className="text-sm text-gray-600">Charges (déductibles)</div>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2 text-center">
            Ces montants sont automatiquement transmis au module fiscal pour la déclaration
          </p>
        </div>

        {/* Notes */}
        {payment.notes && (
          <div className="bg-yellow-50 p-3 rounded-lg">
            <h4 className="font-medium mb-1">Notes</h4>
            <p className="text-sm text-gray-700">{payment.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {payment.status === 'pending' && (
            <>
              <Button 
                onClick={() => onValidate(payment)}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Confirmer le paiement
              </Button>
              <Button 
                variant="outline" 
                onClick={() => onSendReminder(payment)}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Envoyer un rappel
              </Button>
            </>
          )}
          
          {payment.status === 'paid' && payment.receipt_id && (
            <Button 
              variant="outline" 
              onClick={() => onDownloadReceipt(payment)}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Télécharger la quittance
            </Button>
          )}
          
          {payment.status === 'overdue' && (
            <Button 
              variant="destructive" 
              onClick={() => onSendReminder(payment)}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Envoyer un rappel urgent
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
