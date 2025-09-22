"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Euro,
  Download,
  Send,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  ArrowUpRight,
  Bell,
  FileText,
  Calendar,
  User,
  Home,
  Mail,
  Phone,
  AlertTriangle,
  Plus,
  RefreshCw
} from "lucide-react"
import { paymentService } from "@/lib/payment-service"
import { Payment, PaymentStats, PaymentHistory } from "@/lib/payment-models"
import { PaymentValidationDialog } from "./PaymentValidationDialog"
import { PaymentDetails } from "./PaymentDetails"
import { toast } from "sonner"

interface PaymentManagementProps {
  ownerId: string
  selectedLeaseId?: string
}

export function PaymentManagement({ ownerId, selectedLeaseId }: PaymentManagementProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [showValidationDialog, setShowValidationDialog] = useState(false)
  const [showReminderDialog, setShowReminderDialog] = useState(false)
  const [filters, setFilters] = useState({
    status: "all",
    period: "month",
    search: ""
  })

  useEffect(() => {
    loadPayments()
    loadStats()
  }, [ownerId, selectedLeaseId])

  const loadPayments = async () => {
    try {
      setIsLoading(true)
      const data = selectedLeaseId 
        ? await paymentService.getLeasePayments(selectedLeaseId)
        : await paymentService.getOwnerPayments(ownerId)
      setPayments(data)
    } catch (error) {
      toast.error("Erreur lors du chargement des paiements")
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const data = await paymentService.getPaymentStats(ownerId, filters.period)
      setStats(data)
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques")
    }
  }


  const handleSendReminder = async (paymentId: string, reminderType: 'first' | 'second' | 'final') => {
    try {
      await paymentService.sendReminder({
        payment_id: paymentId,
        reminder_type: reminderType
      })
      
      toast.success("Rappel envoyé avec succès")
      setShowReminderDialog(false)
      setSelectedPayment(null)
    } catch (error) {
      toast.error("Erreur lors de l'envoi du rappel")
    }
  }

  const handleDownloadReceipt = async (paymentId: string) => {
    try {
      const blob = await paymentService.downloadReceipt(paymentId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `quittance_${paymentId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      toast.error("Erreur lors du téléchargement de la quittance")
    }
  }

  const handleValidatePayment = (payment: Payment) => {
    setSelectedPayment(payment)
    setShowValidationDialog(true)
  }

  const handlePaymentValidation = () => {
    loadPayments()
    loadStats()
  }

  const handleGenerateMonthlyPayments = async () => {
    try {
      const result = await paymentService.generateMonthlyPayments()
      toast.success(`Paiements mensuels générés avec succès (${result.count} paiements créés)`)
      
      // Recharger les données
      await loadPayments()
      await loadStats()
    } catch (error) {
      console.error('Erreur génération paiements:', error)
      toast.error("Erreur lors de la génération des paiements")
    }
  }

  const filteredPayments = payments.filter(payment => {
    const matchesStatus = filters.status === "all" || payment.status === filters.status
    const matchesSearch = filters.search === "" || 
      payment.month_name.toLowerCase().includes(filters.search.toLowerCase()) ||
      payment.reference.toLowerCase().includes(filters.search.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'paid':
        return { label: 'Payé', color: 'green', icon: CheckCircle }
      case 'pending':
        return { label: 'En attente', color: 'orange', icon: Clock }
      case 'overdue':
        return { label: 'En retard', color: 'red', icon: AlertCircle }
      default:
        return { label: status, color: 'gray', icon: AlertCircle }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">Chargement des paiements...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.total_received?.toLocaleString() || '0'} €</p>
                  <p className="text-sm text-muted-foreground">Reçu ce mois</p>
                </div>
                <div className="flex items-center text-green-500">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span className="text-sm">+12%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-orange-600">{stats.total_pending?.toLocaleString() || '0'} €</p>
                  <p className="text-sm text-muted-foreground">En attente</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-red-600">{stats.total_overdue?.toLocaleString() || '0'} €</p>
                  <p className="text-sm text-muted-foreground">En retard</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stats.collection_rate}%</p>
                  <p className="text-sm text-muted-foreground">Taux de recouvrement</p>
                </div>
                <div className="flex items-center text-green-500">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  <span className="text-sm">+2%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Boutons d'action */}
      <div className="flex gap-4 mb-6">
        <Button onClick={handleGenerateMonthlyPayments}>
          <Plus className="h-4 w-4 mr-2" />
          Générer paiements mensuels
        </Button>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Input
                  placeholder="Rechercher un paiement..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
            </div>

            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="paid">Payé</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="overdue">En retard</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.period} onValueChange={(value) => setFilters(prev => ({ ...prev, period: value }))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Ce mois</SelectItem>
                <SelectItem value="quarter">Ce trimestre</SelectItem>
                <SelectItem value="year">Cette année</SelectItem>
                <SelectItem value="all">Toutes les périodes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des paiements */}
      <Card>
        <CardHeader>
          <CardTitle>Paiements ({filteredPayments.length})</CardTitle>
          <CardDescription>Gérez les paiements et générez les quittances</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPayments.map((payment) => {
              const statusConfig = getStatusConfig(payment.status)
              const StatusIcon = statusConfig.icon

              return (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Euro className="h-5 w-5 text-blue-600" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{payment.month_name}</h3>
                        <Badge
                          variant={
                            statusConfig.color === "green" ? "default" : 
                            statusConfig.color === "red" ? "destructive" : "secondary"
                          }
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>Réf: {payment.reference}</span>
                        <span>•</span>
                        <span>Échéance: {new Date(payment.due_date).toLocaleDateString("fr-FR")}</span>
                        {payment.payment_date && (
                          <>
                            <span>•</span>
                            <span>Payé le: {new Date(payment.payment_date).toLocaleDateString("fr-FR")}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-lg font-bold">{payment.amount_due?.toLocaleString() || '0'} €</p>
                      <div className="text-sm text-muted-foreground">
                        Loyer: {payment.rent_amount}€ + Charges: {payment.charges_amount}€
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      {payment.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedPayment(payment)
                            setShowValidationDialog(true)
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Valider
                        </Button>
                      )}

                      {(payment.status === 'overdue' || (payment.status === 'pending' && new Date(payment.due_date) < new Date())) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedPayment(payment)
                            setShowReminderDialog(true)
                          }}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Rappel
                        </Button>
                      )}

                      {payment.status === 'paid' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadReceipt(payment.id)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Quittance
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de validation */}
      <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Valider le paiement</DialogTitle>
            <DialogDescription>
              Marquer le paiement de {selectedPayment?.month_name} comme payé ou impayé
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p><strong>Montant:</strong> {selectedPayment?.amount_due?.toLocaleString() || '0'} €</p>
              <p><strong>Échéance:</strong> {selectedPayment && new Date(selectedPayment.due_date).toLocaleDateString("fr-FR")}</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleValidatePayment(selectedPayment!.id, 'unpaid')}
            >
              Non reçu
            </Button>
            <Button
              onClick={() => handleValidatePayment(selectedPayment!.id, 'paid')}
            >
              Paiement reçu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de rappel */}
      <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envoyer un rappel</DialogTitle>
            <DialogDescription>
              Envoyer un rappel au locataire pour le paiement de {selectedPayment?.month_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type de rappel</Label>
              <Select defaultValue="first">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first">Premier rappel</SelectItem>
                  <SelectItem value="second">Deuxième rappel</SelectItem>
                  <SelectItem value="final">Rappel final</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Message personnalisé (optionnel)</Label>
              <Textarea placeholder="Message personnalisé..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReminderDialog(false)}>
              Annuler
            </Button>
            <Button onClick={() => handleSendReminder(selectedPayment!.id, 'first')}>
              Envoyer le rappel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Dialog de validation de paiement */}
      <PaymentValidationDialog
        payment={selectedPayment}
        isOpen={showValidationDialog}
        onClose={() => setShowValidationDialog(false)}
        onValidation={handlePaymentValidation}
      />
    </div>
  )
}
