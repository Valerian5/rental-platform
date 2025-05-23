"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  EyeIcon,
  HeartIcon,
  CalendarIcon,
  FileTextIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  PhoneIcon,
} from "lucide-react"

interface PropertyStatsProps {
  property: {
    id: number
    stats: {
      views: number
      favorites: number
      applications: number
      visits: number
      contactRequests: number
    }
  }
}

export function PropertyStats({ property }: PropertyStatsProps) {
  // Mock data for analytics - in real app, this would come from API
  const analytics = {
    viewsThisWeek: 12,
    viewsLastWeek: 8,
    favoritesThisWeek: 3,
    favoritesLastWeek: 2,
    applicationsThisWeek: 1,
    applicationsLastWeek: 2,
    visitsThisWeek: 2,
    visitsLastWeek: 3,
    conversionRate: 6.7, // percentage of views that become applications
    averageTimeOnPage: "2m 34s",
    topReferrers: [
      { source: "Recherche Google", visits: 15, percentage: 45 },
      { source: "Accès direct", visits: 10, percentage: 30 },
      { source: "Réseaux sociaux", visits: 5, percentage: 15 },
      { source: "Autres sites", visits: 3, percentage: 10 },
    ],
    weeklyViews: [
      { day: "Lun", views: 8 },
      { day: "Mar", views: 12 },
      { day: "Mer", views: 6 },
      { day: "Jeu", views: 15 },
      { day: "Ven", views: 10 },
      { day: "Sam", views: 18 },
      { day: "Dim", views: 14 },
    ],
  }

  const getChangeIndicator = (current: number, previous: number) => {
    const change = current - previous
    const percentage = previous > 0 ? Math.round((change / previous) * 100) : 0

    if (change > 0) {
      return (
        <div className="flex items-center text-green-600 text-sm">
          <TrendingUpIcon className="h-3 w-3 mr-1" />+{percentage}%
        </div>
      )
    } else if (change < 0) {
      return (
        <div className="flex items-center text-red-600 text-sm">
          <TrendingDownIcon className="h-3 w-3 mr-1" />
          {percentage}%
        </div>
      )
    } else {
      return <div className="text-muted-foreground text-sm">Stable</div>
    }
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vues totales</p>
                <p className="text-2xl font-bold">{property.stats.views}</p>
                {getChangeIndicator(analytics.viewsThisWeek, analytics.viewsLastWeek)}
              </div>
              <EyeIcon className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Favoris</p>
                <p className="text-2xl font-bold">{property.stats.favorites}</p>
                {getChangeIndicator(analytics.favoritesThisWeek, analytics.favoritesLastWeek)}
              </div>
              <HeartIcon className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Candidatures</p>
                <p className="text-2xl font-bold">{property.stats.applications}</p>
                {getChangeIndicator(analytics.applicationsThisWeek, analytics.applicationsLastWeek)}
              </div>
              <FileTextIcon className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Visites</p>
                <p className="text-2xl font-bold">{property.stats.visits}</p>
                {getChangeIndicator(analytics.visitsThisWeek, analytics.visitsLastWeek)}
              </div>
              <CalendarIcon className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contacts</p>
                <p className="text-2xl font-bold">{property.stats.contactRequests}</p>
              </div>
              <PhoneIcon className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Taux de conversion</CardTitle>
            <CardDescription>Pourcentage de vues qui deviennent des candidatures</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-primary">{analytics.conversionRate}%</span>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Bon taux
                </Badge>
              </div>
              <Progress value={analytics.conversionRate} className="w-full" />
              <p className="text-sm text-muted-foreground">
                {property.stats.applications} candidatures sur {property.stats.views} vues
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Temps moyen sur la page</CardTitle>
            <CardDescription>Durée moyenne de consultation de votre annonce</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-primary">{analytics.averageTimeOnPage}</span>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Excellent
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Les visiteurs passent en moyenne {analytics.averageTimeOnPage} sur votre annonce
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Views Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Vues par jour (7 derniers jours)</CardTitle>
          <CardDescription>Évolution du nombre de vues quotidiennes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.weeklyViews.map((day) => (
              <div key={day.day} className="flex items-center gap-4">
                <div className="w-12 text-sm font-medium">{day.day}</div>
                <div className="flex-1">
                  <Progress value={(day.views / 20) * 100} className="w-full" />
                </div>
                <div className="w-8 text-sm font-medium text-right">{day.views}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Traffic Sources */}
      <Card>
        <CardHeader>
          <CardTitle>Sources de trafic</CardTitle>
          <CardDescription>D'où viennent vos visiteurs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topReferrers.map((referrer, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="font-medium">{referrer.source}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24">
                    <Progress value={referrer.percentage} className="w-full" />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{referrer.visits}</span>
                  <span className="text-sm text-muted-foreground w-8 text-right">{referrer.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommandations</CardTitle>
          <CardDescription>Conseils pour améliorer la performance de votre annonce</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
              <div>
                <h4 className="font-medium text-blue-900">Ajoutez plus de photos</h4>
                <p className="text-sm text-blue-700">Les annonces avec 8+ photos reçoivent 40% de vues en plus</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
              <div>
                <h4 className="font-medium text-green-900">Excellent taux de conversion</h4>
                <p className="text-sm text-green-700">
                  Votre annonce convertit bien ! Continuez à répondre rapidement aux demandes
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="w-2 h-2 rounded-full bg-orange-500 mt-2" />
              <div>
                <h4 className="font-medium text-orange-900">Optimisez votre description</h4>
                <p className="text-sm text-orange-700">Mentionnez les transports en commun et commerces à proximité</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
