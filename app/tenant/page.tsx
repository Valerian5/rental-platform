import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  UserIcon,
  SearchIcon,
  FileTextIcon,
  CalendarIcon,
  MessageSquareIcon,
  HeartIcon,
  AlertCircleIcon,
} from "lucide-react"

export default function TenantDashboard() {
  // Mock data - in real app, this would come from API
  const tenantProfile = {
    name: "Marie Dupont",
    email: "marie.dupont@email.com",
    profileCompletion: 75,
    applicationStatus: "pending",
    favoriteProperties: 3,
    scheduledVisits: 2,
    unreadMessages: 1,
  }

  const recentActivity = [
    {
      id: 1,
      type: "application",
      title: "Dossier soumis pour Appartement 3P - Paris 11ème",
      date: "Il y a 2 heures",
      status: "pending",
    },
    {
      id: 2,
      type: "visit",
      title: "Visite confirmée pour Studio - Belleville",
      date: "Il y a 1 jour",
      status: "confirmed",
    },
    {
      id: 3,
      type: "favorite",
      title: "Nouveau bien ajouté aux favoris",
      date: "Il y a 2 jours",
      status: "info",
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            En attente
          </Badge>
        )
      case "confirmed":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            Confirmé
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            Refusé
          </Badge>
        )
      default:
        return <Badge variant="outline">Info</Badge>
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tableau de bord Locataire</h1>
        <p className="text-muted-foreground">Bienvenue {tenantProfile.name}</p>
      </div>

      {/* Profile completion alert */}
      {tenantProfile.profileCompletion < 100 && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertCircleIcon className="h-5 w-5 text-orange-600" />
              <div className="flex-1">
                <h3 className="font-medium text-orange-900">Complétez votre profil</h3>
                <p className="text-sm text-orange-700 mb-2">
                  Votre profil est complété à {tenantProfile.profileCompletion}%. Un profil complet augmente vos chances
                  d'être sélectionné.
                </p>
                <Progress value={tenantProfile.profileCompletion} className="w-full" />
              </div>
              <Link href="/tenant/profile">
                <Button variant="outline" size="sm">
                  Compléter
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Favoris</p>
                <p className="text-2xl font-bold">{tenantProfile.favoriteProperties}</p>
              </div>
              <HeartIcon className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Visites prévues</p>
                <p className="text-2xl font-bold">{tenantProfile.scheduledVisits}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Messages</p>
                <p className="text-2xl font-bold">{tenantProfile.unreadMessages}</p>
              </div>
              <MessageSquareIcon className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Statut dossier</p>
                <p className="text-sm font-medium">{getStatusBadge(tenantProfile.applicationStatus)}</p>
              </div>
              <FileTextIcon className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

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
                <Link href="/tenant/search">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <SearchIcon className="h-8 w-8 text-blue-500" />
                        <div>
                          <h3 className="font-medium">Rechercher un bien</h3>
                          <p className="text-sm text-muted-foreground">Trouvez votre futur logement</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/tenant/application">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <FileTextIcon className="h-8 w-8 text-green-500" />
                        <div>
                          <h3 className="font-medium">Mon dossier</h3>
                          <p className="text-sm text-muted-foreground">Gérer mon dossier de location</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/tenant/visits">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <CalendarIcon className="h-8 w-8 text-purple-500" />
                        <div>
                          <h3 className="font-medium">Mes visites</h3>
                          <p className="text-sm text-muted-foreground">Planifier et suivre mes visites</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/tenant/profile">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <UserIcon className="h-8 w-8 text-orange-500" />
                        <div>
                          <h3 className="font-medium">Mon profil</h3>
                          <p className="text-sm text-muted-foreground">Mettre à jour mes informations</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent activity */}
        <div>
          <Card>
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
                      {activity.type === "favorite" && <HeartIcon className="h-4 w-4 text-red-500" />}
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
              <Link href="/tenant/activity" className="w-full">
                <Button variant="outline" className="w-full">
                  Voir toute l'activité
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
