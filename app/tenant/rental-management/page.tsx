"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Home,
  FileText,
  CreditCard,
  AlertTriangle,
  Calendar,
  Download,
  Upload,
  CheckCircle,
  Clock,
  Euro,
  Receipt,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"

interface ActiveLease {
  id: string
  property: {
    id: string
    title: string
    address: string
    city: string
  }
  owner: {
    first_name: string
    last_name: string
    email: string
    phone: string
  }
  start_date: string
  end_date: string
  monthly_rent: number
  charges: number
  deposit: number
  status: string
}

interface RentReceipt {
  id: string
  month: string
  year: number
  rent_amount: number
  charges_amount: number
  total_amount: number
  payment_date: string | null
  status: "pending" | "paid" | "overdue"
  receipt_url: string | null
}

interface PaymentTracking {
  id: string
  rent_receipt_id: string
  payment_method: string
  payment_reference: string
  payment_proof_url: string | null
  total_paid: number
  payment_status: string
  payment_date: string | null
  validated_by_owner: boolean
  is_late: boolean
  late_fees: number
}

export default function TenantRentalManagementPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeLease, setActiveLease] = useState<ActiveLease | null>(null)
  const [rentReceipts, setRentReceipts] = useState<RentReceipt[]>([])
  const [paymentTracking, setPaymentTracking] = useState<PaymentTracking[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "tenant") {
          toast.error("Accès non autorisé")
          window.location.href = "/login"
          return
        }

        setCurrentUser(user)

        // Récupérer le bail actuel
        const leaseResponse = await fetch(`/api/leases/tenant/${user.id}/active`)
        const leaseData = await leaseResponse.json()

        if (leaseData.success && leaseData.lease) {
          setActiveLease(leaseData.lease)

          // Récupérer les quittances
          const receiptsResponse = await fetch(`/api/rent-receipts/lease/${leaseData.lease.id}`)
          const receiptsData = await receiptsResponse.json()

          if (receiptsData.success) {
            setRentReceipts(receiptsData.receipts || [])
          }

          // Récupérer le suivi des paiements
          const paymentsResponse = await fetch(`/api/payment-tracking/lease/${leaseData.lease.id}`)
          const paymentsData = await paymentsResponse.json()

          if (paymentsData.success) {
            setPaymentTracking(paymentsData.payments || [])
          }
        }
      } catch (error) {
        console.error("Erreur:", error)
        toast.error("Erreur lors du chargement")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Chargement de votre espace locataire...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!activeLease) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="text-center py-12">
            <Home className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucun bail actuel</h3>
            <p className="text-muted-foreground mb-4">Vous n'avez actuellement aucun bail de location actif.</p>
            <Button asChild>
              <Link href="/tenant/search">Rechercher un logement</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculs pour le tableau de bord
  const currentMonth = new Date().toLocaleString("fr-FR", { month: "long" })
  const currentYear = new Date().getFullYear()

  const currentReceipt = rentReceipts.find(
    (r) => r.month.toLowerCase() === currentMonth.toLowerCase() && r.year === currentYear,
  )

  const overdueReceipts = rentReceipts.filter((r) => r.status === "overdue")
  const paidReceipts = rentReceipts.filter((r) => r.status === "paid")
  const totalPaid = paidReceipts.reduce((sum, r) => sum + r.total_amount, 0)

  const nextPaymentDate = new Date()
  nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1)
  nextPaymentDate.setDate(5) // Supposons que le loyer est dû le 5 de chaque mois

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Mon espace locataire</h1>
        <p className="text-muted-foreground">Gérez votre location : {activeLease.property.title}</p>
      </div>

      {/* Vue d'ensemble */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loyer mensuel</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLease.monthly_rent}€</div>
            <p className="text-xs text-muted-foreground">+ {activeLease.charges}€ de charges</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prochain paiement</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {nextPaymentDate.getDate()}/{nextPaymentDate.getMonth() + 1}
            </div>
            <p className="text-xs text-muted-foreground">{activeLease.monthly_rent + activeLease.charges}€ total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Statut actuel</CardTitle>
            {currentReceipt?.status === "paid" ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : currentReceipt?.status === "overdue" ? (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            ) : (
              <Clock className="h-4 w-4 text-orange-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentReceipt?.status === "paid"
                ? "À jour"
                : currentReceipt?.status === "overdue"
                  ? "En retard"
                  : "En attente"}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentMonth} {currentYear}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total payé</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPaid.toLocaleString()}€</div>
            <p className="text-xs text-muted-foreground">{paidReceipts.length} paiements effectués</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertes importantes */}
      {overdueReceipts.length > 0 && (
        <Card className="border-red-200 bg-red-50 mb-6">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-800">Paiements en retard</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 mb-4">
              Vous avez {overdueReceipts.length} paiement(s) en retard. Veuillez régulariser votre situation rapidement.
            </p>
            <Button variant="destructive" size="sm">
              <CreditCard className="h-4 w-4 mr-2" />
              Effectuer un paiement
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="payments">Paiements</TabsTrigger>
          <TabsTrigger value="receipts">Quittances</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Informations du bail */}
          <Card>
            <CardHeader>
              <CardTitle>Informations de votre location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Propriété</h4>
                    <p className="text-sm text-muted-foreground">{activeLease.property.title}</p>
                    <p className="text-sm text-muted-foreground">{activeLease.property.address}</p>
                    <p className="text-sm text-muted-foreground">{activeLease.property.city}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Période du bail</h4>
                    <p className="text-sm text-muted-foreground">
                      Du {new Date(activeLease.start_date).toLocaleDateString("fr-FR")}
                      au {new Date(activeLease.end_date).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Propriétaire</h4>
                    <p className="text-sm text-muted-foreground">
                      {activeLease.owner.first_name} {activeLease.owner.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{activeLease.owner.email}</p>
                    <p className="text-sm text-muted-foreground">{activeLease.owner.phone}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Montants</h4>
                    <div className="space-y-1">
                      <p className="text-sm">Loyer : {activeLease.monthly_rent}€</p>
                      <p className="text-sm">Charges : {activeLease.charges}€</p>
                      <p className="text-sm font-semibold">Total : {activeLease.monthly_rent + activeLease.charges}€</p>
                      <p className="text-sm text-muted-foreground">Dépôt de garantie : {activeLease.deposit}€</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button asChild>
                  <Link href={`/tenant/leases/${activeLease.id}`}>
                    <FileText className="h-4 w-4 mr-2" />
                    Consulter le bail
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/tenant/messaging?owner=${activeLease.owner.first_name}`}>
                    Contacter le propriétaire
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Actions rapides */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent" variant="outline">
                  <CreditCard className="h-6 w-6" />
                  <span>Effectuer un paiement</span>
                </Button>

                <Button className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent" variant="outline">
                  <Upload className="h-6 w-6" />
                  <span>Envoyer un justificatif</span>
                </Button>

                <Button className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent" variant="outline">
                  <AlertTriangle className="h-6 w-6" />
                  <span>Signaler un incident</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historique des paiements</CardTitle>
              <CardDescription>Suivez vos paiements et leur validation par le propriétaire</CardDescription>
            </CardHeader>
            <CardContent>
              {paymentTracking.length > 0 ? (
                <div className="space-y-4">
                  {paymentTracking.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            payment.validated_by_owner
                              ? "bg-green-500"
                              : payment.payment_status === "submitted"
                                ? "bg-yellow-500"
                                : "bg-gray-300"
                          }`}
                        />
                        <div>
                          <p className="font-medium">{payment.total_paid}€</p>
                          <p className="text-sm text-muted-foreground">
                            {payment.payment_method} - {payment.payment_reference}
                          </p>
                          {payment.payment_date && (
                            <p className="text-sm text-muted-foreground">
                              {new Date(payment.payment_date).toLocaleDateString("fr-FR")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            payment.validated_by_owner
                              ? "default"
                              : payment.payment_status === "submitted"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {payment.validated_by_owner
                            ? "Validé"
                            : payment.payment_status === "submitted"
                              ? "En attente"
                              : "Brouillon"}
                        </Badge>
                        {payment.is_late && <p className="text-sm text-red-600 mt-1">Retard (+{payment.late_fees}€)</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Aucun paiement enregistré</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quittances de loyer</CardTitle>
              <CardDescription>Téléchargez vos quittances de loyer mensuelles</CardDescription>
            </CardHeader>
            <CardContent>
              {rentReceipts.length > 0 ? (
                <div className="space-y-4">
                  {rentReceipts.map((receipt) => (
                    <div key={receipt.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Receipt className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {receipt.month} {receipt.year}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {receipt.total_amount}€ ({receipt.rent_amount}€ + {receipt.charges_amount}€)
                          </p>
                          {receipt.payment_date && (
                            <p className="text-sm text-muted-foreground">
                              Payé le {new Date(receipt.payment_date).toLocaleDateString("fr-FR")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge
                          variant={
                            receipt.status === "paid"
                              ? "default"
                              : receipt.status === "overdue"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {receipt.status === "paid"
                            ? "Payé"
                            : receipt.status === "overdue"
                              ? "En retard"
                              : "En attente"}
                        </Badge>
                        {receipt.receipt_url && (
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Aucune quittance disponible</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Documents de location</CardTitle>
              <CardDescription>Accédez à tous vos documents liés à la location</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent">
                  <FileText className="h-6 w-6" />
                  <span>Contrat de bail</span>
                </Button>

                <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent">
                  <FileText className="h-6 w-6" />
                  <span>État des lieux</span>
                </Button>

                <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent">
                  <FileText className="h-6 w-6" />
                  <span>Assurance habitation</span>
                </Button>

                <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent">
                  <FileText className="h-6 w-6" />
                  <span>Diagnostics techniques</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact propriétaire</CardTitle>
              <CardDescription>Informations de contact de votre propriétaire</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Informations</h4>
                  <div className="space-y-2">
                    <p>
                      {activeLease.owner.first_name} {activeLease.owner.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{activeLease.owner.email}</p>
                    <p className="text-sm text-muted-foreground">{activeLease.owner.phone}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Actions</h4>
                  <div className="space-y-2">
                    <Button className="w-full" asChild>
                      <Link href={`/tenant/messaging?owner=${activeLease.owner.first_name}`}>Envoyer un message</Link>
                    </Button>
                    <Button variant="outline" className="w-full bg-transparent">
                      Signaler un incident
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
