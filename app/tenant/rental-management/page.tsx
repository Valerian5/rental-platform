"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
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

export default function TenantRentalManagementPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeLease, setActiveLease] = useState<Lease | null>(null)
  const [incidents, setIncidents] = useState<any[]>([])
  const [rentReceipts, setRentReceipts] = useState<any[]>([])
  const [maintenanceRequests, setMaintenanceRequests] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
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

        // Récupérer le bail actif
        try {
          const activeLease = await LeaseServiceClient.getActiveTenantLease(user.id)
          if (activeLease) {
            setActiveLease(activeLease)
          }
        } catch (error) {
          console.error("❌ Erreur récupération bail actif:", error)
        }

        // Récupérer les incidents
        try {
          const incidentsResponse = await fetch(`/api/incidents/tenant?tenantId=${user.id}`, { cache: 'no-store' })
          const incidentsData = await incidentsResponse.json()
          if (incidentsData.success) {
            setIncidents(incidentsData.incidents || [])
          }
        } catch (error) {
          console.error("❌ Erreur récupération incidents:", error)
        }

        // Récupérer les quittances
        try {
          if (activeLease) {
            const receipts = await ReceiptServiceClient.getLeaseReceipts(activeLease.id)
            setRentReceipts(receipts)
          }
        } catch (error) {
          console.error("❌ Erreur récupération quittances:", error)
        }

        // Récupérer les demandes de travaux
        try {
          if (activeLease) {
            const requests = await MaintenanceServiceClient.getTenantRequests(activeLease.id)
            setMaintenanceRequests(requests)
          }
        } catch (error) {
          console.error("❌ Erreur récupération demandes travaux:", error)
        }

        // Récupérer les documents
        try {
          if (activeLease) {
            const docs = await DocumentServiceClient.getLeaseDocuments(activeLease.id)
            setDocuments(docs)
          }
        } catch (error) {
          console.error("❌ Erreur récupération documents:", error)
        }

        // Récupérer les notifications
        try {
          const notifs = await notificationsService.getUserNotifications(user.id)
          setNotifications(notifs)
        } catch (error) {
          console.error("❌ Erreur récupération notifications:", error)
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Chargement de votre espace locataire...</p>
        </div>
      </div>
    )
  }

  if (!activeLease) {
    return (
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
    )
  }

  // Calculs pour les métriques
  const overdueReceipts = rentReceipts.filter((r) => r.status === "overdue")
  const openIncidents = incidents.filter((i) => i.status !== "resolved" && i.status !== "closed")
  const pendingMaintenance = maintenanceRequests.filter((m) => m.status === "pending")
  const unreadNotifications = notifications.filter((n) => !n.read)

  return (
    <div className="space-y-6">
      {/* Alertes importantes */}
      {overdueReceipts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Vous avez {overdueReceipts.length} paiement{overdueReceipts.length > 1 ? 's' : ''} en retard.
            <Button variant="link" className="p-0 h-auto ml-2" asChild>
              <Link href="/tenant/rental-management/payments">Voir les détails</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {openIncidents.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Vous avez {openIncidents.length} incident{openIncidents.length > 1 ? 's' : ''} en cours.
            <Button variant="link" className="p-0 h-auto ml-2" asChild>
              <Link href="/tenant/rental-management/incidents">Voir les détails</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loyer mensuel</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLease.monthly_rent}€</div>
            <p className="text-xs text-muted-foreground">
              + {activeLease.charges}€ de charges
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{incidents.length}</div>
            <p className="text-xs text-muted-foreground">
              {openIncidents.length} en cours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quittances</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rentReceipts.length}</div>
            <p className="text-xs text-muted-foreground">
              {overdueReceipts.length} en retard
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
            <p className="text-xs text-muted-foreground">
              {unreadNotifications.length} non lues
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
          <CardDescription>Accès direct aux fonctionnalités principales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button asChild variant="outline" className="h-auto p-4">
              <Link href="/tenant/incidents/new" className="flex flex-col items-center gap-2">
                <Plus className="h-6 w-6" />
                <span>Signaler un incident</span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto p-4">
              <Link href="/tenant/rental-management/payments" className="flex flex-col items-center gap-2">
                <CreditCard className="h-6 w-6" />
                <span>Gérer les paiements</span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto p-4">
              <Link href="/tenant/rental-management/receipts" className="flex flex-col items-center gap-2">
                <Receipt className="h-6 w-6" />
                <span>Consulter les quittances</span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto p-4">
              <Link href="/tenant/rental-management/incidents" className="flex flex-col items-center gap-2">
                <AlertTriangle className="h-6 w-6" />
                <span>Mes incidents</span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto p-4">
              <Link href="/tenant/rental-management/maintenance" className="flex flex-col items-center gap-2">
                <FileText className="h-6 w-6" />
                <span>Demander des travaux</span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto p-4">
              <Link href="/tenant/rental-management/documents" className="flex flex-col items-center gap-2">
                <Download className="h-6 w-6" />
                <span>Documents</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Informations du bail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Informations du bail
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Propriété</label>
              <p className="font-medium">{activeLease.property.title}</p>
              <p className="text-sm text-muted-foreground">
                {activeLease.property.address}, {activeLease.property.city}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Début</label>
                <p className="font-medium">{new Date(activeLease.start_date).toLocaleDateString("fr-FR")}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Fin</label>
                <p className="font-medium">{new Date(activeLease.end_date).toLocaleDateString("fr-FR")}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Loyer</label>
                <p className="font-medium">{activeLease.monthly_rent}€</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Charges</label>
                <p className="font-medium">{activeLease.charges}€</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Propriétaire
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">
                {activeLease.owner.first_name} {activeLease.owner.last_name}
              </p>
              <p className="text-sm text-muted-foreground">{activeLease.owner.email}</p>
              {activeLease.owner.phone && (
                <p className="text-sm text-muted-foreground">{activeLease.owner.phone}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`mailto:${activeLease.owner.email}`}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contacter
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activité récente */}
      <Card>
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
          <CardDescription>Vos dernières actions et notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {incidents.slice(0, 3).map((incident) => (
              <div key={incident.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div className="flex-1">
                  <p className="font-medium">{incident.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(incident.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <Badge variant={incident.status === "resolved" ? "default" : "secondary"}>
                  {incident.status === "resolved" ? "Résolu" : "En cours"}
                </Badge>
              </div>
            ))}
            
            {incidents.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Aucune activité récente
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}