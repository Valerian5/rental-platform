import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  UsersIcon,
  HomeIcon,
  FileTextIcon,
  CalendarIcon,
  MessageSquareIcon,
  SettingsIcon,
  TrendingUpIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

export default function AdminDashboard() {
  // Mock data - in a real app, this would come from an API
  const stats = {
    users: {
      total: 1245,
      landlords: 342,
      tenants: 903,
      newThisMonth: 87,
      growth: 12.4,
    },
    properties: {
      total: 528,
      active: 412,
      pending: 76,
      inactive: 40,
      occupancyRate: 78,
    },
    leases: {
      total: 398,
      active: 312,
      pending: 45,
      expired: 41,
      revenue: 342500,
    },
    visits: {
      total: 876,
      scheduled: 124,
      completed: 698,
      cancelled: 54,
      conversionRate: 68,
    },
  }

  const recentActivities = [
    {
      id: 1,
      type: "user",
      action: "Nouvel utilisateur inscrit",
      name: "Sophie Martin",
      time: "Il y a 23 minutes",
      status: "success",
    },
    {
      id: 2,
      type: "property",
      action: "Nouvelle propriété ajoutée",
      name: "Appartement 3P - Lyon 6ème",
      time: "Il y a 1 heure",
      status: "success",
    },
    {
      id: 3,
      type: "lease",
      action: "Bail en attente de signature",
      name: "Studio - Paris 11ème",
      time: "Il y a 2 heures",
      status: "pending",
    },
    {
      id: 4,
      type: "visit",
      action: "Visite annulée",
      name: "Maison - Bordeaux",
      time: "Il y a 3 heures",
      status: "error",
    },
    {
      id: 5,
      type: "message",
      action: "Ticket support",
      name: "Problème de paiement",
      time: "Il y a 5 heures",
      status: "pending",
    },
  ]

  const alerts = [
    { id: 1, type: "error", message: "3 paiements de loyer en retard", time: "Action requise" },
    { id: 2, type: "warning", message: "5 baux expirent dans les 30 jours", time: "Attention requise" },
    { id: 3, type: "info", message: "12 nouveaux utilisateurs à vérifier", time: "Information" },
    { id: 4, type: "success", message: "Sauvegarde système réussie", time: "Aujourd'hui, 08:30" },
  ]

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tableau de bord Administrateur</h1>
        <p className="text-muted-foreground">Gérez votre plateforme et suivez les performances</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="properties">Propriétés</TabsTrigger>
          <TabsTrigger value="leases">Baux</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Utilisateurs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{stats.users.total}</p>
                    <p className="text-xs text-muted-foreground">+{stats.users.newThisMonth} ce mois</p>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-full">
                    <UsersIcon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-xs">
                  <TrendingUpIcon className="h-3 w-3 mr-1 text-green-500" />
                  <span className="text-green-500 font-medium">+{stats.users.growth}%</span>
                  <span className="text-muted-foreground ml-1">vs mois dernier</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Propriétés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{stats.properties.total}</p>
                    <p className="text-xs text-muted-foreground">{stats.properties.active} actives</p>
                  </div>
                  <div className="p-2 bg-blue-500/10 rounded-full">
                    <HomeIcon className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Taux d'occupation</span>
                    <span className="font-medium">{stats.properties.occupancyRate}%</span>
                  </div>
                  <Progress value={stats.properties.occupancyRate} className="h-1" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Baux</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{stats.leases.total}</p>
                    <p className="text-xs text-muted-foreground">{stats.leases.active} actifs</p>
                  </div>
                  <div className="p-2 bg-green-500/10 rounded-full">
                    <FileTextIcon className="h-6 w-6 text-green-500" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-xs">
                  <span className="font-medium">{stats.leases.revenue.toLocaleString("fr-FR")} €</span>
                  <span className="text-muted-foreground ml-1">de revenus mensuels</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Visites</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{stats.visits.total}</p>
                    <p className="text-xs text-muted-foreground">{stats.visits.scheduled} à venir</p>
                  </div>
                  <div className="p-2 bg-purple-500/10 rounded-full">
                    <CalendarIcon className="h-6 w-6 text-purple-500" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Taux de conversion</span>
                    <span className="font-medium">{stats.visits.conversionRate}%</span>
                  </div>
                  <Progress value={stats.visits.conversionRate} className="h-1" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity and Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Activité récente</CardTitle>
                <CardDescription>Les dernières actions sur la plateforme</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-4">
                      <div className="mt-0.5">
                        {activity.type === "user" && <UsersIcon className="h-5 w-5 text-blue-500" />}
                        {activity.type === "property" && <HomeIcon className="h-5 w-5 text-green-500" />}
                        {activity.type === "lease" && <FileTextIcon className="h-5 w-5 text-yellow-500" />}
                        {activity.type === "visit" && <CalendarIcon className="h-5 w-5 text-purple-500" />}
                        {activity.type === "message" && <MessageSquareIcon className="h-5 w-5 text-pink-500" />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{activity.action}</p>
                        <p className="text-sm text-muted-foreground">{activity.name}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                      <div>
                        {activity.status === "success" && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Succès
                          </Badge>
                        )}
                        {activity.status === "pending" && (
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            En attente
                          </Badge>
                        )}
                        {activity.status === "error" && (
                          <Badge variant="outline" className="text-red-600 border-red-600">
                            Erreur
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertes système</CardTitle>
                <CardDescription>Notifications importantes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="p-3 rounded-lg border">
                      <div className="flex items-start space-x-3">
                        <div className="mt-0.5">
                          {alert.type === "error" && <XCircleIcon className="h-5 w-5 text-red-500" />}
                          {alert.type === "warning" && <AlertCircleIcon className="h-5 w-5 text-orange-500" />}
                          {alert.type === "info" && <AlertCircleIcon className="h-5 w-5 text-blue-500" />}
                          {alert.type === "success" && <CheckCircleIcon className="h-5 w-5 text-green-500" />}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">{alert.message}</p>
                          <p className="text-xs text-muted-foreground">{alert.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Access */}
          <Card>
            <CardHeader>
              <CardTitle>Accès rapide</CardTitle>
              <CardDescription>Gérez les aspects clés de votre plateforme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/admin/users">
                  <Button
                    variant="outline"
                    className="w-full h-auto py-4 flex flex-col items-center justify-center gap-2"
                  >
                    <UsersIcon className="h-6 w-6" />
                    <span>Utilisateurs</span>
                  </Button>
                </Link>
                <Link href="/admin/properties">
                  <Button
                    variant="outline"
                    className="w-full h-auto py-4 flex flex-col items-center justify-center gap-2"
                  >
                    <HomeIcon className="h-6 w-6" />
                    <span>Propriétés</span>
                  </Button>
                </Link>
                <Link href="/admin/leases">
                  <Button
                    variant="outline"
                    className="w-full h-auto py-4 flex flex-col items-center justify-center gap-2"
                  >
                    <FileTextIcon className="h-6 w-6" />
                    <span>Baux</span>
                  </Button>
                </Link>
                <Link href="/admin/settings">
                  <Button
                    variant="outline"
                    className="w-full h-auto py-4 flex flex-col items-center justify-center gap-2"
                  >
                    <SettingsIcon className="h-6 w-6" />
                    <span>Paramètres</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des utilisateurs</CardTitle>
              <CardDescription>Consultez et gérez tous les utilisateurs de la plateforme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium">Statistiques utilisateurs</h3>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div className="p-3 bg-slate-100 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-xl font-bold">{stats.users.total}</p>
                    </div>
                    <div className="p-3 bg-slate-100 rounded-lg">
                      <p className="text-sm text-muted-foreground">Propriétaires</p>
                      <p className="text-xl font-bold">{stats.users.landlords}</p>
                    </div>
                    <div className="p-3 bg-slate-100 rounded-lg">
                      <p className="text-sm text-muted-foreground">Locataires</p>
                      <p className="text-xl font-bold">{stats.users.tenants}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <Link href="/admin/users">
                    <Button>Voir tous les utilisateurs</Button>
                  </Link>
                </div>
              </div>
              <p className="text-center text-muted-foreground">
                Accédez à la section utilisateurs pour voir la liste complète et effectuer des actions
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="properties">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des propriétés</CardTitle>
              <CardDescription>Consultez et gérez toutes les propriétés de la plateforme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium">Statistiques propriétés</h3>
                  <div className="grid grid-cols-4 gap-4 mt-2">
                    <div className="p-3 bg-slate-100 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-xl font-bold">{stats.properties.total}</p>
                    </div>
                    <div className="p-3 bg-slate-100 rounded-lg">
                      <p className="text-sm text-muted-foreground">Actives</p>
                      <p className="text-xl font-bold">{stats.properties.active}</p>
                    </div>
                    <div className="p-3 bg-slate-100 rounded-lg">
                      <p className="text-sm text-muted-foreground">En attente</p>
                      <p className="text-xl font-bold">{stats.properties.pending}</p>
                    </div>
                    <div className="p-3 bg-slate-100 rounded-lg">
                      <p className="text-sm text-muted-foreground">Inactives</p>
                      <p className="text-xl font-bold">{stats.properties.inactive}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <Link href="/admin/properties">
                    <Button>Voir toutes les propriétés</Button>
                  </Link>
                </div>
              </div>
              <p className="text-center text-muted-foreground">
                Accédez à la section propriétés pour voir la liste complète et effectuer des actions
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leases">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des baux</CardTitle>
              <CardDescription>Consultez et gérez tous les baux de la plateforme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium">Statistiques baux</h3>
                  <div className="grid grid-cols-4 gap-4 mt-2">
                    <div className="p-3 bg-slate-100 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-xl font-bold">{stats.leases.total}</p>
                    </div>
                    <div className="p-3 bg-slate-100 rounded-lg">
                      <p className="text-sm text-muted-foreground">Actifs</p>
                      <p className="text-xl font-bold">{stats.leases.active}</p>
                    </div>
                    <div className="p-3 bg-slate-100 rounded-lg">
                      <p className="text-sm text-muted-foreground">En attente</p>
                      <p className="text-xl font-bold">{stats.leases.pending}</p>
                    </div>
                    <div className="p-3 bg-slate-100 rounded-lg">
                      <p className="text-sm text-muted-foreground">Expirés</p>
                      <p className="text-xl font-bold">{stats.leases.expired}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <Link href="/admin/leases">
                    <Button>Voir tous les baux</Button>
                  </Link>
                </div>
              </div>
              <p className="text-center text-muted-foreground">
                Accédez à la section baux pour voir la liste complète et effectuer des actions
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
