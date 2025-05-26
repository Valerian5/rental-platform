"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Receipt, AlertTriangle, Wrench, Shield, TrendingUp, Calculator, Clock, Euro, Home, Plus } from "lucide-react"
import { authService } from "@/lib/auth-service"
import { rentalManagementService } from "@/lib/rental-management-service"
import Link from "next/link"

export default function RentalManagementOverview() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [stats, setStats] = useState({
    totalLeases: 0,
    activeLeases: 0,
    pendingReceipts: 0,
    openIncidents: 0,
    scheduledMaintenance: 0,
    expiringDocuments: 0,
    monthlyIncome: 0,
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initializeData = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "owner") return

        setCurrentUser(user)
        await loadOverviewData(user.id)
      } catch (error) {
        console.error("Erreur initialisation:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeData()
  }, [])

  const loadOverviewData = async (ownerId: string) => {
    try {
      // Charger les statistiques générales
      const leases = await rentalManagementService.getOwnerLeases(ownerId)
      const activeLeases = leases.filter((lease) => lease.status === "active")

      // Calculer les revenus mensuels
      const monthlyIncome = activeLeases.reduce((sum, lease) => sum + lease.monthly_rent + lease.charges, 0)

      // Simuler d'autres statistiques (à implémenter selon vos besoins)
      setStats({
        totalLeases: leases.length,
        activeLeases: activeLeases.length,
        pendingReceipts: 3, // À calculer depuis rent_receipts
        openIncidents: 2, // À calculer depuis incidents
        scheduledMaintenance: 1, // À calculer depuis maintenance_works
        expiringDocuments: 1, // À calculer depuis annual_documents
        monthlyIncome,
      })

      // Activité récente simulée
      setRecentActivity([
        {
          type: "receipt",
          message: "Quittance novembre générée",
          date: "2024-11-01",
          status: "success",
        },
        {
          type: "incident",
          message: "Incident plomberie signalé",
          date: "2024-10-28",
          status: "warning",
        },
        {
          type: "maintenance",
          message: "Révision chaudière programmée",
          date: "2024-10-25",
          status: "info",
        },
      ])
    } catch (error) {
      console.error("Erreur chargement données:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    )
  }

  const features = [
    {
      title: "Gestion des Quittances",
      description: "Génération automatique et suivi des paiements",
      icon: Receipt,
      href: "/owner/rental-management/receipts",
      stats: `${stats.pendingReceipts} en attente`,
      color: "blue",
    },
    {
      title: "Signalement d'Incidents",
      description: "Suivi des problèmes et résolutions",
      icon: AlertTriangle,
      href: "/owner/rental-management/incidents",
      stats: `${stats.openIncidents} ouverts`,
      color: "orange",
    },
    {
      title: "Travaux de Maintenance",
      description: "Planification et suivi des interventions",
      icon: Wrench,
      href: "/owner/rental-management/maintenance",
      stats: `${stats.scheduledMaintenance} programmés`,
      color: "green",
    },
    {
      title: "Documents Obligatoires",
      description: "Suivi des attestations annuelles",
      icon: Shield,
      href: "/owner/rental-management/documents",
      stats: `${stats.expiringDocuments} expirent bientôt`,
      color: "purple",
    },
    {
      title: "Révision de Loyer",
      description: "Calcul selon l'indice INSEE",
      icon: TrendingUp,
      href: "/owner/rental-management/revision",
      stats: "Indice 2024 disponible",
      color: "indigo",
    },
    {
      title: "Bilan Fiscal",
      description: "Préparation déclaration d'impôts",
      icon: Calculator,
      href: "/owner/rental-management/fiscal",
      stats: "Année 2023 prête",
      color: "gray",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Baux Actifs</p>
                <p className="text-3xl font-bold text-blue-600">{stats.activeLeases}</p>
              </div>
              <Home className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenus Mensuels</p>
                <p className="text-3xl font-bold text-green-600">{stats.monthlyIncome}€</p>
              </div>
              <Euro className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Incidents Ouverts</p>
                <p className="text-3xl font-bold text-orange-600">{stats.openIncidents}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Quittances en Attente</p>
                <p className="text-3xl font-bold text-purple-600">{stats.pendingReceipts}</p>
              </div>
              <Receipt className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes importantes */}
      {stats.expiringDocuments > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>{stats.expiringDocuments} document(s)</strong> expire(nt) bientôt et nécessite(nt) un renouvellement
            de la part de vos locataires.
          </AlertDescription>
        </Alert>
      )}

      {/* Fonctionnalités principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <Card key={feature.title} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Icon className={`h-8 w-8 text-${feature.color}-600`} />
                  <Badge variant="outline">{feature.stats}</Badge>
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={feature.href}>
                  <Button className="w-full">Accéder</Button>
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Activité récente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Activité Récente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {activity.type === "receipt" && <Receipt className="h-5 w-5 text-blue-600" />}
                  {activity.type === "incident" && <AlertTriangle className="h-5 w-5 text-orange-600" />}
                  {activity.type === "maintenance" && <Wrench className="h-5 w-5 text-green-600" />}
                  <div>
                    <p className="font-medium">{activity.message}</p>
                    <p className="text-sm text-gray-600">{new Date(activity.date).toLocaleDateString("fr-FR")}</p>
                  </div>
                </div>
                <Badge
                  variant={
                    activity.status === "success" ? "default" : activity.status === "warning" ? "secondary" : "outline"
                  }
                >
                  {activity.status === "success" ? "Terminé" : activity.status === "warning" ? "En cours" : "Prévu"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions Rapides</CardTitle>
          <CardDescription>Tâches courantes de gestion locative</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-auto p-4 flex flex-col items-center space-y-2">
              <Plus className="h-6 w-6" />
              <span>Générer quittances du mois</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <AlertTriangle className="h-6 w-6" />
              <span>Signaler un incident</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Calculator className="h-6 w-6" />
              <span>Calculer révision loyer</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
