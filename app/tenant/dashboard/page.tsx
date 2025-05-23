"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, Home, FileText, Calendar, Heart, Bell, Settings, Plus, Clock, X, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Données simulées
const savedSearches = [
  {
    id: 1,
    name: "Appartement Paris",
    city: "Paris",
    propertyType: "Appartement",
    rentalType: "Non meublé",
    maxRent: 1200,
    minRooms: 2,
    minBedrooms: 1,
    minSurface: 40,
    maxSurface: 80,
    lastUpdated: "2023-05-15",
    matchCount: 12,
    newMatches: 3,
  },
  {
    id: 2,
    name: "Maison Lyon",
    city: "Lyon",
    propertyType: "Maison",
    rentalType: "Non meublé",
    maxRent: 1500,
    minRooms: 4,
    minBedrooms: 3,
    minSurface: 90,
    maxSurface: 150,
    lastUpdated: "2023-05-10",
    matchCount: 5,
    newMatches: 0,
  },
]

const favoriteProperties = [
  {
    id: 1,
    title: "Appartement moderne au centre-ville",
    address: "123 Rue Principale, Paris",
    price: 1200,
    charges: 150,
    surface: 65,
    rooms: 3,
    bedrooms: 2,
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: 2,
    title: "Studio lumineux proche des transports",
    address: "45 Avenue des Fleurs, Paris",
    price: 850,
    charges: 80,
    surface: 30,
    rooms: 1,
    bedrooms: 0,
    image: "/placeholder.svg?height=200&width=300",
  },
]

const applications = [
  {
    id: 1,
    property: {
      id: 1,
      title: "Appartement moderne au centre-ville",
      address: "123 Rue Principale, Paris",
      price: 1200,
      image: "/placeholder.svg?height=200&width=300",
    },
    status: "En cours d'analyse",
    appliedDate: "2023-05-20",
    lastUpdate: "2023-05-21",
    matchScore: 85,
  },
  {
    id: 2,
    property: {
      id: 3,
      title: "Loft industriel spacieux",
      address: "12 Rue des Artistes, Paris",
      price: 1500,
      image: "/placeholder.svg?height=200&width=300",
    },
    status: "Visite proposée",
    appliedDate: "2023-05-18",
    lastUpdate: "2023-05-22",
    matchScore: 92,
    visitDate: "2023-05-25T14:00:00",
  },
  {
    id: 3,
    property: {
      id: 4,
      title: "Studio étudiant rénové",
      address: "78 Rue des Étudiants, Paris",
      price: 750,
      image: "/placeholder.svg?height=200&width=300",
    },
    status: "Refusé",
    appliedDate: "2023-05-15",
    lastUpdate: "2023-05-19",
    matchScore: 65,
    refusalReason: "Revenus insuffisants",
  },
]

const visits = [
  {
    id: 1,
    property: {
      id: 3,
      title: "Loft industriel spacieux",
      address: "12 Rue des Artistes, Paris",
      price: 1500,
      image: "/placeholder.svg?height=200&width=300",
    },
    date: "2023-05-25T14:00:00",
    status: "Confirmée",
    contactPerson: "Marie Leroy",
    contactPhone: "06 23 45 67 89",
  },
  {
    id: 2,
    property: {
      id: 5,
      title: "Appartement avec vue sur parc",
      address: "56 Boulevard du Parc, Paris",
      price: 1350,
      image: "/placeholder.svg?height=200&width=300",
    },
    date: "2023-05-27T11:00:00",
    status: "En attente",
    contactPerson: "Jean Dupont",
    contactPhone: "06 12 34 56 78",
  },
]

const rentalFile = {
  completionPercentage: 75,
  missingItems: ["Dernier avis d'imposition", "Justificatif de domicile"],
  lastUpdated: "2023-05-15",
}

export default function TenantDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview")

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "En cours d'analyse":
        return "secondary"
      case "Visite proposée":
        return "default"
      case "Refusé":
        return "destructive"
      case "Dossier accepté":
        return "success"
      default:
        return "outline"
    }
  }

  const getVisitStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Confirmée":
        return "success"
      case "En attente":
        return "secondary"
      case "Annulée":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-1/4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src="/placeholder.svg?height=40&width=40&text=JD" alt="Jean Dupont" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>Jean Dupont</CardTitle>
                  <CardDescription>Locataire</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dossier de location</span>
                  <span className="font-medium">{rentalFile.completionPercentage}% complet</span>
                </div>
                <Progress value={rentalFile.completionPercentage} className="h-2" />
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/tenant/profile/rental-file">Compléter mon dossier</Link>
              </Button>
            </CardFooter>
          </Card>

          <div className="mt-6 space-y-2">
            <Button
              variant={activeTab === "overview" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("overview")}
            >
              <Home className="h-4 w-4 mr-2" />
              Vue d'ensemble
            </Button>
            <Button
              variant={activeTab === "searches" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("searches")}
            >
              <Search className="h-4 w-4 mr-2" />
              Mes recherches
            </Button>
            <Button
              variant={activeTab === "favorites" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("favorites")}
            >
              <Heart className="h-4 w-4 mr-2" />
              Favoris
            </Button>
            <Button
              variant={activeTab === "applications" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("applications")}
            >
              <FileText className="h-4 w-4 mr-2" />
              Mes candidatures
            </Button>
            <Button
              variant={activeTab === "visits" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("visits")}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Visites
            </Button>
            <Button
              variant={activeTab === "notifications" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("notifications")}
            >
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </Button>
            <Button
              variant={activeTab === "settings" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("settings")}
            >
              <Settings className="h-4 w-4 mr-2" />
              Paramètres
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Tableau de bord</h1>

              {rentalFile.completionPercentage < 100 && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-blue-800">Complétez votre dossier de location</h3>
                        <p className="text-sm text-blue-700 mb-2">
                          Votre dossier est incomplet. Ajoutez les documents manquants pour augmenter vos chances d'être
                          sélectionné.
                        </p>
                        <div className="text-sm text-blue-700 mb-3">
                          <span className="font-medium">Documents manquants :</span>
                          <ul className="list-disc list-inside">
                            {rentalFile.missingItems.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        </div>
                        <Button size="sm" asChild>
                          <Link href="/tenant/profile/rental-file">Compléter mon dossier</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Mes candidatures récentes</span>
                      <Badge>{applications.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {applications.slice(0, 2).map((application) => (
                      <div key={application.id} className="flex items-start gap-3">
                        <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                          <img
                            src={application.property.image || "/placeholder.svg"}
                            alt={application.property.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{application.property.title}</h4>
                          <p className="text-xs text-muted-foreground">{application.property.address}</p>
                          <div className="flex items-center justify-between mt-1">
                            <Badge variant={getStatusBadgeVariant(application.status)} className="text-xs">
                              {application.status}
                            </Badge>
                            <span className="text-sm font-semibold">{application.property.price} €/mois</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveTab("applications")}>
                      Voir toutes mes candidatures
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Mes prochaines visites</span>
                      <Badge>{visits.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {visits.length > 0 ? (
                      visits.slice(0, 2).map((visit) => (
                        <div key={visit.id} className="flex items-start gap-3">
                          <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                            <img
                              src={visit.property.image || "/placeholder.svg"}
                              alt={visit.property.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{visit.property.title}</h4>
                            <p className="text-xs text-muted-foreground">{visit.property.address}</p>
                            <div className="flex items-center justify-between mt-1">
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                <span className="text-xs">
                                  {new Date(visit.date).toLocaleDateString("fr-FR", {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <Badge variant={getVisitStatusBadgeVariant(visit.status)} className="text-xs">
                                {visit.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Aucune visite programmée</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveTab("visits")}>
                      Gérer mes visites
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Mes recherches enregistrées</span>
                    <Badge>{savedSearches.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {savedSearches.map((search) => (
                    <div key={search.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{search.name}</h4>
                        {search.newMatches > 0 && (
                          <Badge className="bg-green-600 hover:bg-green-700">{search.newMatches} nouveaux</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-3">
                        <div className="flex items-center">
                          <span className="text-muted-foreground mr-2">Ville:</span>
                          <span>{search.city}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-muted-foreground mr-2">Type:</span>
                          <span>{search.propertyType}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-muted-foreground mr-2">Budget:</span>
                          <span>Max {search.maxRent} €</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-muted-foreground mr-2">Surface:</span>
                          <span>
                            {search.minSurface} - {search.maxSurface} m²
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          {search.matchCount} biens correspondent à vos critères
                        </span>
                        <Button size="sm" asChild>
                          <Link href={`/properties?search=${search.id}`}>Voir les biens</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveTab("searches")}>
                    Gérer mes recherches
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}

          {activeTab === "searches" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Mes recherches enregistrées</h1>
                <Button asChild>
                  <Link href="/tenant/searches/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle recherche
                  </Link>
                </Button>
              </div>

              <div className="space-y-4">
                {savedSearches.map((search) => (
                  <Card key={search.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                        <div>
                          <h3 className="text-lg font-semibold flex items-center">
                            {search.name}
                            {search.newMatches > 0 && (
                              <Badge className="ml-2 bg-green-600 hover:bg-green-700">
                                {search.newMatches} nouveaux
                              </Badge>
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Dernière mise à jour: {new Date(search.lastUpdated).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                        <div className="flex gap-2 mt-2 md:mt-0">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/tenant/searches/edit/${search.id}`}>Modifier</Link>
                          </Button>
                          <Button variant="destructive" size="sm">
                            Supprimer
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Ville</p>
                          <p className="font-medium">{search.city}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Type de bien</p>
                          <p className="font-medium">{search.propertyType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Type de location</p>
                          <p className="font-medium">{search.rentalType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Budget max</p>
                          <p className="font-medium">{search.maxRent} €/mois</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Pièces min</p>
                          <p className="font-medium">{search.minRooms}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Chambres min</p>
                          <p className="font-medium">{search.minBedrooms}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Surface min</p>
                          <p className="font-medium">{search.minSurface} m²</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Surface max</p>
                          <p className="font-medium">{search.maxSurface} m²</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-sm font-medium">{search.matchCount} biens correspondent</span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Activer les alertes
                          </Button>
                          <Button size="sm" asChild>
                            <Link href={`/properties?search=${search.id}`}>Voir les biens</Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === "favorites" && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Mes favoris</h1>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {favoriteProperties.map((property) => (
                  <Card key={property.id} className="overflow-hidden">
                    <div className="aspect-video w-full overflow-hidden">
                      <img
                        src={property.image || "/placeholder.svg"}
                        alt={property.title}
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                      />
                    </div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{property.title}</h3>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{property.address}</p>
                      <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                        <div>
                          <p className="text-muted-foreground">Surface</p>
                          <p className="font-medium">{property.surface} m²</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Pièces</p>
                          <p className="font-medium">{property.rooms}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Chambres</p>
                          <p className="font-medium">{property.bedrooms}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold text-lg">{property.price} €/mois</p>
                          <p className="text-xs text-muted-foreground">+ {property.charges} € charges</p>
                        </div>
                        <Button asChild>
                          <Link href={`/properties/${property.id}`}>Voir détails</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === "applications" && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Mes candidatures</h1>

              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground mr-2">Filtrer par statut:</span>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="pending">En cours d'analyse</SelectItem>
                      <SelectItem value="visit">Visite proposée</SelectItem>
                      <SelectItem value="accepted">Dossier accepté</SelectItem>
                      <SelectItem value="rejected">Refusé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground mr-2">Trier par:</span>
                  <Select defaultValue="date-desc">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Date (plus récent)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date-desc">Date (plus récent)</SelectItem>
                      <SelectItem value="date-asc">Date (plus ancien)</SelectItem>
                      <SelectItem value="match-desc">Score de matching</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                {applications.map((application) => (
                  <Card key={application.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="w-full md:w-1/4">
                          <div className="aspect-video rounded-md overflow-hidden">
                            <img
                              src={application.property.image || "/placeholder.svg"}
                              alt={application.property.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold">{application.property.title}</h3>
                              <p className="text-sm text-muted-foreground">{application.property.address}</p>
                            </div>
                            <Badge variant={getStatusBadgeVariant(application.status)}>{application.status}</Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Loyer</p>
                              <p className="font-medium">{application.property.price} €/mois</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Candidature</p>
                              <p className="font-medium">
                                {new Date(application.appliedDate).toLocaleDateString("fr-FR")}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Dernière mise à jour</p>
                              <p className="font-medium">
                                {new Date(application.lastUpdate).toLocaleDateString("fr-FR")}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Score de matching</p>
                              <div className="flex items-center">
                                <span className="font-medium mr-2">{application.matchScore}%</span>
                                <Progress value={application.matchScore} className="h-2 w-16" />
                              </div>
                            </div>
                          </div>

                          {application.status === "Visite proposée" && application.visitDate && (
                            <div className="bg-blue-50 p-3 rounded-md mb-4">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 text-blue-600 mr-2" />
                                <span className="font-medium text-blue-800">Visite proposée</span>
                              </div>
                              <p className="text-sm text-blue-700 mt-1">
                                Le propriétaire vous propose une visite le{" "}
                                {new Date(application.visitDate).toLocaleDateString("fr-FR", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                              <div className="flex gap-2 mt-2">
                                <Button size="sm" variant="default">
                                  Confirmer
                                </Button>
                                <Button size="sm" variant="outline">
                                  Proposer une autre date
                                </Button>
                              </div>
                            </div>
                          )}

                          {application.status === "Refusé" && application.refusalReason && (
                            <div className="bg-red-50 p-3 rounded-md mb-4">
                              <div className="flex items-center">
                                <X className="h-4 w-4 text-red-600 mr-2" />
                                <span className="font-medium text-red-800">Candidature refusée</span>
                              </div>
                              <p className="text-sm text-red-700 mt-1">Motif: {application.refusalReason}</p>
                            </div>
                          )}

                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/properties/${application.property.id}`}>Voir l'annonce</Link>
                            </Button>
                            <Button variant="outline" size="sm">
                              Contacter le propriétaire
                            </Button>
                            {application.status === "En cours d'analyse" && (
                              <Button variant="destructive" size="sm">
                                Retirer ma candidature
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === "visits" && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Mes visites</h1>

              <Tabs defaultValue="upcoming">
                <TabsList>
                  <TabsTrigger value="upcoming">À venir</TabsTrigger>
                  <TabsTrigger value="past">Passées</TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming" className="space-y-4 mt-4">
                  {visits.length > 0 ? (
                    visits.map((visit) => (
                      <Card key={visit.id}>
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row gap-4">
                            <div className="w-full md:w-1/4">
                              <div className="aspect-video rounded-md overflow-hidden">
                                <img
                                  src={visit.property.image || "/placeholder.svg"}
                                  alt={visit.property.title}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h3 className="font-semibold">{visit.property.title}</h3>
                                  <p className="text-sm text-muted-foreground">{visit.property.address}</p>
                                </div>
                                <Badge variant={getVisitStatusBadgeVariant(visit.status)}>{visit.status}</Badge>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Date et heure</p>
                                  <p className="font-medium">
                                    {new Date(visit.date).toLocaleDateString("fr-FR", {
                                      day: "numeric",
                                      month: "long",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Contact</p>
                                  <p className="font-medium">{visit.contactPerson}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Téléphone</p>
                                  <p className="font-medium">{visit.contactPhone}</p>
                                </div>
                              </div>

                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/properties/${visit.property.id}`}>Voir l'annonce</Link>
                                </Button>
                                <Button variant="outline" size="sm">
                                  Contacter le propriétaire
                                </Button>
                                {visit.status === "En attente" && (
                                  <Button variant="default" size="sm">
                                    Confirmer la visite
                                  </Button>
                                )}
                                {visit.status !== "Annulée" && (
                                  <Button variant="destructive" size="sm">
                                    Annuler la visite
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">Aucune visite à venir</h3>
                      <p className="text-muted-foreground mb-4">
                        Vous n'avez pas encore de visites programmées. Postulez à des annonces pour organiser des
                        visites.
                      </p>
                      <Button asChild>
                        <Link href="/properties">Voir les annonces</Link>
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="past" className="space-y-4 mt-4">
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Aucune visite passée</h3>
                    <p className="text-muted-foreground">L'historique de vos visites apparaîtra ici.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
