import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  HomeIcon,
  CalendarIcon,
  FileTextIcon,
  MessageSquareIcon,
  EuroIcon,
  TrendingUpIcon,
  AlertCircleIcon,
  PlusIcon,
} from "lucide-react"

export default function LandlordDashboard() {
  // Mock data - in real app, this would come from API
  const landlordProfile = {
    name: "Jean Martin",
    email: "jean.martin@email.com",
    totalProperties: 5,
    activeProperties: 4,
    pendingVisits: 8,
    pendingApplications: 12,
    monthlyRevenue: 6800,
    occupancyRate: 80,
    unreadMessages: 3,
  }

  const recentActivity = [
    {
      id: 1,
      type: "application",
      title: "Nouvelle candidature pour Appartement 3P - Belleville",
      date: "Il y a 1 heure",
      status: "new",
    },
    {
      id: 2,
      type: "visit",
      title: "Visite confirmée pour Studio - République",
      date: "Il y a 2 heures",
      status: "confirmed",
    },
    {
      id: 3,
      type: "message",
      title: "Nouveau message de Marie Dupont",
      date: "Il y a 3 heures",
      status: "unread",
    },
    {
      id: 4,
      type: "property",
      title: "Bien publié: Maison 4P - Montreuil",
      date: "Il y a 1 jour",
      status: "published",
    },
  ]

  const urgentTasks = [
    {
      id: 1,
      title: "Répondre à 3 demandes de visite",
      priority: "high",
      dueDate: "Aujourd'hui",
    },
    {
      id: 2,
      title: "Examiner 5 nouveaux dossiers",
      priority: "medium",
      dueDate: "Dans 2 jours",
    },
    {
      id: 3,
      title: "Mettre à jour les photos du Studio République",
      priority: "low",
      dueDate: "Cette semaine",
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Nouveau
          </Badge>
        )
      case "confirmed":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            Confirmé
          </Badge>
        )
      case "unread":
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            Non lu
          </Badge>
        )
      case "published":
        return (
          <Badge variant="outline" className="text-purple-600 border-purple-600">
            Publié
          </Badge>
        )
      default:
        return <Badge variant="outline">Info</Badge>
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600"
      case "medium":
        return "text-orange-600"
      case "low":
        return "text-green-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tableau de bord Propriétaire</h1>
        <p className="text-muted-foreground">Bienvenue {landlordProfile.name}</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Biens actifs</p>
                <p className="text-2xl font-bold">{landlordProfile.activeProperties}</p>
                <p className="text-xs text-muted-foreground">sur {landlordProfile.totalProperties} total</p>
              </div>
              <HomeIcon className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Visites en attente</p>
                <p className="text-2xl font-bold">{landlordProfile.pendingVisits}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Candidatures</p>
                <p className="text-2xl font-bold">{landlordProfile.pendingApplications}</p>
              </div>
              <FileTextIcon className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenus mensuels</p>
                <p className="text-2xl font-bold">{landlordProfile.monthlyRevenue}€</p>
              </div>
              <EuroIcon className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Occupancy rate */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium">Taux d'occupation</h3>
              <p className="text-sm text-muted-foreground">Performance de votre portefeuille immobilier</p>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUpIcon className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold text-green-600">{landlordProfile.occupancyRate}%</span>
            </div>
          </div>
          <Progress value={landlordProfile.occupancyRate} className="w-full" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
              <CardDescription>Accédez rapidement aux fonctionnalités principales</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/landlord/properties/new">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <PlusIcon className="h-8 w-8 text-blue-500" />
                        <div>
                          <h3 className="font-medium">Ajouter un bien</h3>
                          <p className="text-sm text-muted-foreground">Créer une nouvelle annonce</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/landlord/properties">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <HomeIcon className="h-8 w-8 text-green-500" />
                        <div>
                          <h3 className="font-medium">Mes biens</h3>
                          <p className="text-sm text-muted-foreground">Gérer mon portefeuille</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/landlord/visits">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <CalendarIcon className="h-8 w-8 text-purple-500" />
                        <div>
                          <h3 className="font-medium">Visites</h3>
                          <p className="text-sm text-muted-foreground">Planifier et gérer les visites</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/landlord/applications">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <FileTextIcon className="h-8 w-8 text-orange-500" />
                        <div>
                          <h3 className="font-medium">Candidatures</h3>
                          <p className="text-sm text-muted-foreground">Examiner les dossiers</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent activity */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Activité récente</CardTitle>
              <CardDescription>Vos dernières actions sur la plateforme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="mt-1">
                      {activity.type === "application" && <FileTextIcon className="h-4 w-4 text-blue-500" />}
                      {activity.type === "visit" && <CalendarIcon className="h-4 w-4 text-green-500" />}
                      {activity.type === "message" && <MessageSquareIcon className="h-4 w-4 text-orange-500" />}
                      {activity.type === "property" && <HomeIcon className="h-4 w-4 text-purple-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.date}</p>
                    </div>
                    {getStatusBadge(activity.status)}
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/landlord/activity" className="w-full">
                <Button variant="outline" className="w-full">
                  Voir toute l'activité
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>

        {/* Urgent tasks */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircleIcon className="h-5 w-5 text-orange-500" />
                Tâches urgentes
              </CardTitle>
              <CardDescription>Actions à effectuer rapidement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {urgentTasks.map((task) => (
                  <div key={task.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-medium">{task.title}</h4>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          task.priority === "high"
                            ? "border-red-600 text-red-600"
                            : task.priority === "medium"
                              ? "border-orange-600 text-orange-600"
                              : "border-green-600 text-green-600"
                        }`}
                      >
                        {task.priority === "high" ? "Urgent" : task.priority === "medium" ? "Moyen" : "Faible"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Échéance: {task.dueDate}</p>
                    <Button size="sm" variant="outline" className="w-full">
                      Traiter
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/landlord/tasks" className="w-full">
                <Button variant="outline" className="w-full">
                  Voir toutes les tâches
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
