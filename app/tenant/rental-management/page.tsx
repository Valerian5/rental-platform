"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Home,
  Euro,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  Download,
  MessageSquare,
  Bell,
  TrendingUp,
  Receipt,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"

interface Lease {
  id: string
  property: {
    id: string
    title: string
    address: string
    city: string
  }
  owner: {
    id: string
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
  status: string
  receipt_url: string | null
}

interface PaymentTracking {
  id: string
  payment_date: string
  amount: number
  payment_method: string
  payment_reference: string
  validated_by_owner: boolean
  status: string
  is_late: boolean
  late_fees: number
  days_late: number
}

export default function TenantRentalManagementPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeLease, setActiveLease] = useState<Lease | null>(null)
  const [rentReceipts, setRentReceipts] = useState<RentReceipt[]>([])
  const [payments, setPayments] = useState<PaymentTracking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

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

        // Récupérer le bail actif
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

          // Récupérer les paiements
          const paymentsResponse = await fetch(`/api/payment-tracking/lease/${leaseData.lease.id}`)
          const paymentsData = await paymentsResponse.json()
          if (paymentsData.success) {
            setPayments(paymentsData.payments || [])
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
            <h3 className="text-lg font-semibold mb-2">Aucun bail actif</h3>
            <p className="text-muted-foreground mb-4">Vous n'avez actuellement aucun bail de location actif.</p>
            <Button asChild>
              <Link href="/tenant/search">Rechercher un logement</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculs pour les métriques
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  const currentMonthReceipt = rentReceipts.find(
    (r) => r.year === currentYear && Number.parseInt(r.month) === currentMonth,
  )

  const overdueReceipts = rentReceipts.filter((r) => r.status === "overdue")
  const paidReceipts = rentReceipts.filter((r) => r.status === "paid")
  const totalPaid = paidReceipts.reduce((sum, r) => sum + r.total_amount, 0)
  const paymentRate = rentReceipts.length > 0 ? (paidReceipts.length / rentReceipts.length) * 100 : 0

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Mon espace locataire</h1>
        <p className="text-muted-foreground">Gérez votre location - {activeLease.property.title}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="payments">
            Paiements
            {overdueReceipts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {overdueReceipts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="receipts">Quittances</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Alertes importantes */}
          {overdueReceipts.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Attention :</strong> Vous avez {overdueReceipts.length} paiement(s) en retard.
                <Button
                  variant="link"
                  className="p-0 ml-2 text-red-600 underline"
                  onClick={() => setActiveTab("payments")}
                >
                  Voir les détails
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {currentMonthReceipt && currentMonthReceipt.status === "pending" && (
            <Alert className="border-blue-200 bg-blue-50">
              <Clock className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Rappel :</strong> Votre loyer de {currentMonthReceipt.month}/{currentMonthReceipt.year}(
                {currentMonthReceipt.total_amount}€) est à payer.
                <Button
                  variant="link"
                  className="p-0 ml-2 text-blue-600 underline"
                  onClick={() => setActiveTab("payments")}
                >
                  Effectuer le paiement
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Métriques principales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                <CardTitle className="text-sm font-medium">Total payé</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalPaid.toFixed(2)}€</div>
                <p className="text-xs text-muted-foreground">Sur {rentReceipts.length} quittances</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taux de paiement</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{paymentRate.toFixed(0)}%</div>
                <Progress value={paymentRate} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Retards</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{overdueReceipts.length}</div>
                <p className="text-xs text-muted-foreground">Paiements en retard</p>
              </CardContent>
            </Card>
          </div>

          {/* Informations du bail */}
          <Card>
            <CardHeader>
              <CardTitle>Informations du bail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Logement</p>
                  <p className="font-medium">{activeLease.property.title}</p>
                  <p className="text-sm text-muted-foreground">{activeLease.property.address}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Propriétaire</p>
                  <p className="font-medium">
                    {activeLease.owner.first_name} {activeLease.owner.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{activeLease.owner.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Période du bail</p>
                  <p className="font-medium">
                    Du {new Date(activeLease.start_date).toLocaleDateString("fr-FR")}
                    au {new Date(activeLease.end_date).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dépôt de garantie</p>
                  <p className="font-medium">{activeLease.deposit}€</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions rapides */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex-col bg-transparent"
                  onClick={() => setActiveTab("payments")}
                >
                  <CreditCard className="h-6 w-6 mb-2" />
                  Payer le loyer
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col bg-transparent"
                  onClick={() => setActiveTab("receipts")}
                >
                  <Receipt className="h-6 w-6 mb-2" />
                  Mes quittances
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col bg-transparent"
                  onClick={() => setActiveTab("documents")}
                >
                  <FileText className="h-6 w-6 mb-2" />
                  Documents
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col bg-transparent"
                  onClick={() => setActiveTab("contact")}
                >
                  <MessageSquare className="h-6 w-6 mb-2" />
                  Contacter
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des paiements</CardTitle>
              <CardDescription>Suivez vos paiements et téléchargez vos justificatifs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rentReceipts.map((receipt) => (
                  <div key={receipt.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          receipt.status === "paid"
                            ? "bg-green-500"
                            : receipt.status === "overdue"
                              ? "bg-red-500"
                              : "bg-yellow-500"
                        }`}
                      />
                      <div>
                        <p className="font-medium">
                          Loyer {receipt.month}/{receipt.year}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {receipt.total_amount}€
                          {receipt.payment_date &&
                            ` - Payé le ${new Date(receipt.payment_date).toLocaleDateString("fr-FR")}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          receipt.status === "paid"
                            ? "default"
                            : receipt.status === "overdue"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {receipt.status === "paid" ? "Payé" : receipt.status === "overdue" ? "En retard" : "En attente"}
                      </Badge>
                      {receipt.status === "pending" && (
                        <Button size="sm">
                          <CreditCard className="h-4 w-4 mr-2" />
                          Payer
                        </Button>
                      )}
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mes quittances de loyer</CardTitle>
              <CardDescription>Téléchargez et consultez toutes vos quittances</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rentReceipts.map((receipt) => (
                  <div key={receipt.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Receipt className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          Quittance {receipt.month}/{receipt.year}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Loyer: {receipt.rent_amount}€ + Charges: {receipt.charges_amount}€ = {receipt.total_amount}€
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {receipt.status === "paid" && <Badge className="bg-green-600">Payé</Badge>}
                      {receipt.receipt_url ? (
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" disabled>
                          Non disponible
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mes documents</CardTitle>
              <CardDescription>Accédez à tous vos documents de location</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Contrat de bail</p>
                      <p className="text-sm text-muted-foreground">Document principal de location</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/tenant/leases/${activeLease.id}`}>
                      <Download className="h-4 w-4 mr-2" />
                      Consulter
                    </Link>
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">État des lieux d'entrée</p>
                      <p className="text-sm text-muted-foreground">Constat de l'état du logement</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" disabled>
                    Non disponible
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact propriétaire</CardTitle>
              <CardDescription>Communiquez avec votre propriétaire</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">
                  {activeLease.owner.first_name} {activeLease.owner.last_name}
                </h4>
                <p className="text-sm text-muted-foreground mb-1">Email: {activeLease.owner.email}</p>
                {activeLease.owner.phone && (
                  <p className="text-sm text-muted-foreground">Téléphone: {activeLease.owner.phone}</p>
                )}
              </div>

              <div className="flex gap-3">
                <Button asChild>
                  <Link href={`/tenant/messaging?owner=${activeLease.owner.id}`}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Envoyer un message
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/tenant/incidents/new">
                    <Bell className="h-4 w-4 mr-2" />
                    Signaler un incident
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
