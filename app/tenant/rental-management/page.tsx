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
  Plus,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { authService } from "@/lib/auth-service"
import { notificationsService } from "@/lib/notifications-service"
import { LeaseServiceClient } from "@/lib/lease-service-client"
import { ReceiptServiceClient } from "@/lib/receipt-service-client"
import { MaintenanceServiceClient } from "@/lib/maintenance-service-client"
import { DocumentServiceClient } from "@/lib/document-service-client"
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

interface Incident {
  id: string
  title: string
  description: string
  category: string
  priority: string
  status: string
  photos?: string[]
  resolution_notes?: string
  cost?: number
  resolved_date?: string
  created_at: string
  updated_at?: string
  responses?: IncidentResponse[]
}

interface IncidentResponse {
  id: string
  incident_id: string
  message: string
  user_type: "owner" | "tenant"
  created_at: string
}

interface Document {
  id: string
  type: 'charge_regularization' | 'rent_revision' | 'lease' | 'other'
  title: string
  description: string
  year?: number
  amount?: number
  balance_type?: 'refund' | 'additional_payment'
  old_rent?: number
  new_rent?: number
  increase?: number
  increase_percentage?: number
  pdf_url: string
  created_at: string
  data?: any
}

export default function TenantRentalManagementPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeLease, setActiveLease] = useState<Lease | null>(null)
  const [rentReceipts, setRentReceipts] = useState<RentReceipt[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [maintenanceWorks, setMaintenanceWorks] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
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

        // Récupérer le bail actif (côté client)
        try {
          const activeLease = await LeaseServiceClient.getActiveTenantLease(user.id)
          if (activeLease) {
            setActiveLease(activeLease)
            console.log('🏠 Bail actif chargé:', activeLease.id)

            // Récupérer les quittances (côté client)
            try {
              const receipts = await ReceiptServiceClient.getLeaseReceipts(activeLease.id)
              setRentReceipts(receipts)
              console.log('🧾 Quittances chargées:', receipts.length)
            } catch (error) {
              console.error("❌ Erreur récupération quittances:", error)
            }
          }
        } catch (error) {
          console.error("❌ Erreur récupération bail actif:", error)
        }

        // Récupérer les incidents
        console.log("🔍 [CLIENT] Récupération incidents pour user.id:", user.id)
        const incidentsResponse = await fetch(`/api/incidents/tenant?tenantId=${user.id}`)
        const incidentsData = await incidentsResponse.json()
        console.log("🔍 [CLIENT] Réponse incidents:", incidentsData)
        if (incidentsData.success) {
          console.log("✅ [CLIENT] Incidents reçus:", incidentsData.incidents?.length || 0, incidentsData.incidents)
          setIncidents(incidentsData.incidents || [])
        } else {
          console.error("❌ [CLIENT] Erreur récupération incidents:", incidentsData.error)
        }

        // Récupérer les documents (côté client)
        try {
          const documents = await DocumentServiceClient.getTenantDocuments(user.id)
          setDocuments(documents)
          console.log('📄 Documents chargés:', documents.length)
        } catch (error) {
          console.error("❌ Erreur récupération documents:", error)
        }

        // Récupérer les travaux (côté client)
        try {
          const works = await MaintenanceServiceClient.getTenantMaintenanceWorks(user.id)
          setMaintenanceWorks(works)
          console.log('🔧 Travaux chargés:', works.length)
        } catch (error) {
          console.error("❌ Erreur récupération travaux:", error)
        }

        // Récupérer les notifications
        try {
          const userNotifications = await notificationsService.getUserNotifications(user.id)
          setNotifications(userNotifications)
          console.log('🔔 Notifications chargées:', userNotifications.length)
        } catch (error) {
          console.error('❌ Erreur chargement notifications:', error)
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

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200"
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "reported":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "closed":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "resolved":
        return "Résolu"
      case "in_progress":
        return "En cours"
      case "reported":
        return "Signalé"
      case "closed":
        return "Fermé"
      default:
        return status
    }
  }

  const getPriorityLabel = (priority: string | null) => {
    switch (priority) {
      case "urgent":
        return "Urgent"
      case "high":
        return "Élevé"
      case "medium":
        return "Moyen"
      case "low":
        return "Faible"
      default:
        return priority || "Non définie"
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "plumbing":
        return "Plomberie"
      case "electrical":
        return "Électricité"
      case "heating":
        return "Chauffage"
      case "security":
        return "Sécurité"
      case "other":
        return "Autre"
      default:
        return category
    }
  }

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

  // Statistiques incidents
  const openIncidents = incidents.filter((i) => i.status !== "resolved" && i.status !== "closed")
  const urgentIncidents = incidents.filter((i) => i.priority === "urgent" && i.status !== "resolved")

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Mon espace locataire</h1>
        <p className="text-muted-foreground">Gérez votre location - {activeLease.property.title}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
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
          <TabsTrigger value="incidents">
            Incidents
            {openIncidents.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {openIncidents.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="maintenance">Travaux</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Alertes importantes */}
          {urgentIncidents.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Urgent :</strong> Vous avez {urgentIncidents.length} incident(s) urgent(s) en cours.
                <Button
                  variant="link"
                  className="p-0 ml-2 text-red-600 underline"
                  onClick={() => setActiveTab("incidents")}
                >
                  Voir les détails
                </Button>
              </AlertDescription>
            </Alert>
          )}

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
                <CardTitle className="text-sm font-medium">Incidents ouverts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{openIncidents.length}</div>
                <p className="text-xs text-muted-foreground">
                  {urgentIncidents.length > 0 ? `${urgentIncidents.length} urgent(s)` : "Aucun urgent"}
                </p>
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
                <Button variant="outline" className="h-20 flex-col bg-transparent" asChild>
                  <Link href="/tenant/incidents/new">
                    <Bell className="h-6 w-6 mb-2" />
                    Signaler incident
                  </Link>
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
              {/* Filtre par année */}
              <div className="mb-6">
                <label className="text-sm font-medium mb-2 block">Filtrer par année :</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-2 border rounded-md"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                {rentReceipts
                  .filter(receipt => receipt.year === selectedYear)
                  .map((receipt) => (
                    <div key={receipt.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <Receipt className="h-8 w-8 text-muted-foreground" />
                        <div>
                        <p className="font-medium">
                          Quittance {receipt.month}
                        </p>
                          <p className="text-sm text-muted-foreground">
                            Loyer: {receipt.rent_amount}€ + Charges: {receipt.charges_amount}€ = {receipt.total_amount}€
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {receipt.payment_date 
                              ? `Payé le ${new Date(receipt.payment_date).toLocaleDateString("fr-FR")}`
                              : "En attente de paiement"
                            }
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
                          {receipt.status === "paid" ? "Payé" : 
                           receipt.status === "overdue" ? "En retard" : "En attente"}
                        </Badge>
                        {receipt.receipt_url ? (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(receipt.receipt_url, '_blank')}
                          >
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
                
                {rentReceipts.filter(receipt => receipt.year === selectedYear).length === 0 && (
                  <div className="text-center py-8">
                    <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucune quittance pour l'année {selectedYear}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Mes incidents</h2>
              <p className="text-muted-foreground">Suivez l'état de vos signalements</p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/tenant/rental-management/incidents">
                  <Eye className="h-4 w-4 mr-2" />
                  Voir tous
                </Link>
              </Button>
              <Button asChild>
                <Link href="/tenant/incidents/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Signaler un incident
                </Link>
              </Button>
            </div>
          </div>

          {incidents.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Aucun incident signalé</h3>
                <p className="text-muted-foreground mb-4">
                  Vous n'avez encore signalé aucun incident dans votre logement.
                </p>
                <Button asChild>
                  <Link href="/tenant/incidents/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Signaler un incident
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {incidents.map((incident) => (
                <Card key={incident.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{incident.title}</CardTitle>
                        <div className="flex items-center space-x-2">
                          {incident.priority && (
                            <Badge className={getPriorityColor(incident.priority)}>
                              {getPriorityLabel(incident.priority)}
                            </Badge>
                          )}
                          <Badge className={getStatusColor(incident.status)}>{getStatusLabel(incident.status)}</Badge>
                          <span className="text-sm text-muted-foreground">{getCategoryLabel(incident.category)}</span>
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>Signalé le</p>
                        <p>{new Date(incident.created_at).toLocaleDateString("fr-FR")}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Description</h4>
                      <p className="text-sm text-muted-foreground">{incident.description}</p>
                    </div>

                    {incident.photos && incident.photos.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Photos</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {incident.photos.map((photo, index) => (
                            <div key={index} className="relative aspect-square">
                              <img
                                src={photo || "/placeholder.svg"}
                                alt={`Photo ${index + 1}`}
                                className="w-full h-full object-cover rounded-lg border"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {incident.status === "resolved" && incident.resolution_notes && (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-medium text-green-800 mb-2">Résolution</h4>
                        <p className="text-sm text-green-700">{incident.resolution_notes}</p>
                        {incident.cost && (
                          <p className="text-sm text-green-700 mt-2">
                            <strong>Coût des réparations :</strong> {incident.cost}€
                          </p>
                        )}
                        {incident.resolved_date && (
                          <p className="text-sm text-green-700 mt-1">
                            Résolu le {new Date(incident.resolved_date).toLocaleDateString("fr-FR")}
                          </p>
                        )}
                      </div>
                    )}

                    {incident.responses && incident.responses.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">Échanges</h4>
                        <div className="space-y-3">
                          {incident.responses.map((response) => (
                            <div
                              key={response.id}
                              className={`p-3 rounded-lg ${
                                response.user_type === "owner"
                                  ? "bg-blue-50 border border-blue-200"
                                  : "bg-gray-50 border border-gray-200"
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-sm">
                                  {response.user_type === "owner" ? "Propriétaire" : "Vous"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(response.created_at).toLocaleDateString("fr-FR")} à{" "}
                                  {new Date(response.created_at).toLocaleTimeString("fr-FR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <p className="text-sm">{response.message}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/tenant/incidents/${incident.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir détails
                        </Link>
                      </Button>
                      {incident.status !== "resolved" && incident.status !== "closed" && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/tenant/incidents/${incident.id}/respond`}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Répondre
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Travaux et maintenance</CardTitle>
              <CardDescription>Suivez l'état des travaux dans votre logement</CardDescription>
            </CardHeader>
            <CardContent>
              {maintenanceWorks.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucun travail en cours pour le moment</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {maintenanceWorks.map((work) => (
                    <div key={work.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{work.title}</p>
                          <p className="text-sm text-muted-foreground">{work.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {work.property.title} - {work.property.address}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={
                            work.status === "completed" 
                              ? "default" 
                              : work.status === "in_progress" 
                                ? "secondary" 
                                : "outline"
                          }
                        >
                          {work.status === "completed" ? "Terminé" : 
                           work.status === "in_progress" ? "En cours" : "Planifié"}
                        </Badge>
                        <Badge 
                          variant={
                            work.priority === "urgent" 
                              ? "destructive" 
                              : work.priority === "high" 
                                ? "secondary" 
                                : "outline"
                          }
                        >
                          {work.priority === "urgent" ? "Urgent" : 
                           work.priority === "high" ? "Élevée" : "Normale"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                {/* Contrat de bail */}
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

                {/* Documents de régularisation et révision */}
                {documents.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucun document disponible pour le moment</p>
                  </div>
                ) : (
                  documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {doc.type === 'charge_regularization' ? 'Régularisation des charges' : 'Révision de loyer'}
                          </p>
                          {doc.metadata?.year && (
                            <p className="text-xs text-muted-foreground">Année {doc.metadata.year}</p>
                          )}
                          {doc.metadata?.balance !== undefined && (
                            <p className="text-xs text-muted-foreground">
                              {doc.metadata.balance_type === 'refund' ? 'Remboursement' : 'Complément'}: {Math.abs(doc.metadata.balance).toFixed(2)} €
                            </p>
                          )}
                          {doc.metadata?.new_rent && (
                            <p className="text-xs text-muted-foreground">
                              Nouveau loyer: {doc.metadata.new_rent.toFixed(2)} €
                            </p>
                          )}
                          {doc.metadata?.increase_percentage && (
                            <p className="text-xs text-muted-foreground">
                              Augmentation: {doc.metadata.increase_percentage.toFixed(2)}%
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(doc.url, '_blank')}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger
                        </Button>
                      </div>
                    </div>
                  ))
                )}

                {/* État des lieux d'entrée */}
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

                {documents.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Aucun document de régularisation disponible</p>
                  </div>
                )}
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
