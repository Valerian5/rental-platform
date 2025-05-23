"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Home,
  FileText,
  Calendar,
  Settings,
  Plus,
  Filter,
  CheckCircle,
  Clock,
  Users,
  CreditCard,
  BarChart,
  MessageSquare,
  Search,
  Eye,
  Edit,
  MoreHorizontal,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"

// Données simulées
const properties = [
  {
    id: 1,
    title: "Appartement moderne au centre-ville",
    address: "123 Rue Principale, Paris",
    price: 1200,
    charges: 150,
    surface: 65,
    rooms: 3,
    bedrooms: 2,
    status: "Disponible",
    publishedDate: "2023-05-10",
    views: 124,
    applications: 5,
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: 2,
    title: "Studio étudiant rénové",
    address: "78 Rue des Étudiants, Paris",
    price: 750,
    charges: 80,
    surface: 30,
    rooms: 1,
    bedrooms: 0,
    status: "Loué",
    publishedDate: "2023-04-15",
    views: 87,
    applications: 3,
    image: "/placeholder.svg?height=200&width=300",
    tenant: "Sophie Martin",
    leaseStart: "2023-05-01",
    leaseEnd: "2024-04-30",
  },
]

const applications = [
  {
    id: 1,
    property: {
      id: 1,
      title: "Appartement moderne au centre-ville",
    },
    tenant: {
      name: "Jean Dupont",
      age: 32,
      profession: "Ingénieur",
      income: 3800,
      hasGuarantor: true,
    },
    status: "En cours d'analyse",
    appliedDate: "2023-05-20",
    matchScore: 85,
  },
  {
    id: 2,
    property: {
      id: 1,
      title: "Appartement moderne au centre-ville",
    },
    tenant: {
      name: "Marie Leroy",
      age: 28,
      profession: "Consultante",
      income: 4200,
      hasGuarantor: true,
    },
    status: "Visite programmée",
    appliedDate: "2023-05-19",
    matchScore: 92,
    visitDate: "2023-05-25T14:00:00",
  },
  {
    id: 3,
    property: {
      id: 1,
      title: "Appartement moderne au centre-ville",
    },
    tenant: {
      name: "Thomas Bernard",
      age: 35,
      profession: "Médecin",
      income: 5500,
      hasGuarantor: false,
    },
    status: "Dossier accepté",
    appliedDate: "2023-05-18",
    matchScore: 95,
  },
]

const visits = [
  {
    id: 1,
    property: {
      id: 1,
      title: "Appartement moderne au centre-ville",
      address: "123 Rue Principale, Paris",
    },
    tenant: "Marie Leroy",
    date: "2023-05-25T14:00:00",
    status: "Confirmée",
    tenantPhone: "06 23 45 67 89",
  },
  {
    id: 2,
    property: {
      id: 1,
      title: "Appartement moderne au centre-ville",
      address: "123 Rue Principale, Paris",
    },
    tenant: "Pierre Martin",
    date: "2023-05-27T11:00:00",
    status: "En attente",
    tenantPhone: "06 34 56 78 90",
  },
]

const rentals = [
  {
    id: 1,
    property: {
      id: 2,
      title: "Studio étudiant rénové",
      address: "78 Rue des Étudiants, Paris",
      price: 750,
      charges: 80,
    },
    tenant: "Sophie Martin",
    leaseStart: "2023-05-01",
    leaseEnd: "2024-04-30",
    paymentStatus: "À jour",
    lastPaymentDate: "2023-05-03",
    incidents: 0,
  },
]

const messages = [
  {
    id: 1,
    sender: "Sophie Martin",
    property: "Studio étudiant rénové",
    date: "2023-05-21T10:23:00",
    preview: "Bonjour, je voulais savoir s'il était possible de...",
    unread: true,
  },
  {
    id: 2,
    sender: "Marie Leroy",
    property: "Appartement moderne au centre-ville",
    date: "2023-05-20T16:45:00",
    preview: "Merci pour les informations concernant la visite...",
    unread: false,
  },
]

export default function OwnerDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview")

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Disponible":
        return "default"
      case "Loué":
        return "success"
      case "En pause":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getApplicationStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "En cours d'analyse":
        return "secondary"
      case "Visite programmée":
        return "default"
      case "Dossier accepté":
        return "success"
      case "Refusé":
        return "destructive"
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
                  <CardDescription>Propriétaire</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Biens en location</span>
                  <span className="font-medium">{properties.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Candidatures</span>
                  <span className="font-medium">{applications.length}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/owner/properties/new">Ajouter un bien</Link>
              </Button>
            </CardFooter>
          </Card>

          <div className="mt-6 space-y-2">
            <Button
              variant={activeTab === "overview" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("overview")}
            >
              <BarChart className="h-4 w-4 mr-2" />
              Vue d'ensemble
            </Button>
            <Button
              variant={activeTab === "properties" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("properties")}
            >
              <Home className="h-4 w-4 mr-2" />
              Mes biens
            </Button>
            <Button
              variant={activeTab === "applications" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("applications")}
            >
              <FileText className="h-4 w-4 mr-2" />
              Candidatures
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
              variant={activeTab === "rentals" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("rentals")}
            >
              <Users className="h-4 w-4 mr-2" />
              Locations en cours
            </Button>
            <Button
              variant={activeTab === "payments" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("payments")}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Paiements
            </Button>
            <Button
              variant={activeTab === "messages" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("messages")}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Biens en location</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{properties.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {properties.filter((p) => p.status === "Disponible").length} disponibles,{" "}
                      {properties.filter((p) => p.status === "Loué").length} loués
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Candidatures</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{applications.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {applications.filter((a) => a.status === "En cours d'analyse").length} en attente d'analyse
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Visites à venir</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{visits.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {visits.filter((v) => v.status === "Confirmée").length} confirmées
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Candidatures récentes</span>
                      <Badge>{applications.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {applications.slice(0, 2).map((application) => (
                      <div key={application.id} className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {application.tenant.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h4 className="font-medium text-sm">{application.tenant.name}</h4>
                            <Badge variant={getApplicationStatusBadgeVariant(application.status)} className="text-xs">
                              {application.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">Pour: {application.property.title}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-muted-foreground">
                              {application.tenant.profession}, {application.tenant.income} €/mois
                            </span>
                            <div className="flex items-center">
                              <span className="text-xs font-medium mr-1">{application.matchScore}%</span>
                              <Progress value={application.matchScore} className="h-2 w-12" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveTab("applications")}>
                      Voir toutes les candidatures
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Prochaines visites</span>
                      <Badge>{visits.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {visits.length > 0 ? (
                      visits.slice(0, 2).map((visit) => (
                        <div key={visit.id} className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {visit.tenant
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <h4 className="font-medium text-sm">{visit.tenant}</h4>
                              <Badge variant={getVisitStatusBadgeVariant(visit.status)} className="text-xs">
                                {visit.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">Pour: {visit.property.title}</p>
                            <div className="flex items-center mt-1">
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
                      Gérer les visites
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Mes biens</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {properties.map((property) => (
                      <div key={property.id} className="flex border rounded-lg overflow-hidden">
                        <div className="w-1/3">
                          <img
                            src={property.image || "/placeholder.svg"}
                            alt={property.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1 p-4">
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium text-sm">{property.title}</h3>
                            <Badge variant={getStatusBadgeVariant(property.status)} className="text-xs">
                              {property.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{property.address}</p>
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-sm font-semibold">{property.price} €/mois</p>
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Eye className="h-3 w-3 mr-1" />
                                {property.views} vues
                              </div>
                            </div>
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/owner/properties/${property.id}`}>Gérer</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveTab("properties")}>
                    Voir tous mes biens
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}

          {activeTab === "properties" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Mes biens</h1>
                <Button asChild>
                  <Link href="/owner/properties/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un bien
                  </Link>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="col-span-1 md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder="Rechercher un bien..." className="pl-8" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger>
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="available">Disponible</SelectItem>
                      <SelectItem value="rented">Loué</SelectItem>
                      <SelectItem value="paused">En pause</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {properties.map((property) => (
                  <Card key={property.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="w-full md:w-1/4">
                          <div className="aspect-video rounded-md overflow-hidden">
                            <img
                              src={property.image || "/placeholder.svg"}
                              alt={property.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold">{property.title}</h3>
                              <p className="text-sm text-muted-foreground">{property.address}</p>
                            </div>
                            <Badge variant={getStatusBadgeVariant(property.status)}>{property.status}</Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Loyer</p>
                              <p className="font-medium">{property.price} €/mois</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Surface</p>
                              <p className="font-medium">{property.surface} m²</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Pièces</p>
                              <p className="font-medium">{property.rooms}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Chambres</p>
                              <p className="font-medium">{property.bedrooms}</p>
                            </div>
                          </div>

                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center">
                                <Eye className="h-4 w-4 mr-1 text-muted-foreground" />
                                <span className="text-sm">{property.views} vues</span>
                              </div>
                              <div className="flex items-center">
                                <FileText className="h-4 w-4 mr-1 text-muted-foreground" />
                                <span className="text-sm">{property.applications} candidatures</span>
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                                <span className="text-sm">
                                  Publié le {new Date(property.publishedDate).toLocaleDateString("fr-FR")}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/properties/${property.id}`}>Voir l'annonce</Link>
                              </Button>
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/owner/properties/${property.id}/edit`}>
                                  <Edit className="h-4 w-4 mr-1" />
                                  Modifier
                                </Link>
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>Mettre en pause</DropdownMenuItem>
                                  <DropdownMenuItem>Dupliquer</DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">Supprimer</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === "applications" && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Candidatures</h1>

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
                      <SelectItem value="visit">Visite programmée</SelectItem>
                      <SelectItem value="accepted">Dossier accepté</SelectItem>
                      <SelectItem value="rejected">Refusé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground mr-2">Trier par:</span>
                  <Select defaultValue="match-desc">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Score de matching" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="match-desc">Score de matching</SelectItem>
                      <SelectItem value="date-desc">Date (plus récent)</SelectItem>
                      <SelectItem value="date-asc">Date (plus ancien)</SelectItem>
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
                          <div className="border rounded-md p-4">
                            <div className="flex items-center mb-4">
                              <Avatar className="h-12 w-12 mr-3">
                                <AvatarFallback>
                                  {application.tenant.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold">{application.tenant.name}</h3>
                                <p className="text-sm text-muted-foreground">{application.tenant.age} ans</p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <p className="text-xs text-muted-foreground">Profession</p>
                                <p className="text-sm">{application.tenant.profession}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Revenus mensuels</p>
                                <p className="text-sm font-medium">{application.tenant.income} €</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Garant</p>
                                <p className="text-sm">{application.tenant.hasGuarantor ? "Oui" : "Non"}</p>
                              </div>
                            </div>
                            <div className="mt-4">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">Score de matching</span>
                                <span className="text-sm font-bold">{application.matchScore}%</span>
                              </div>
                              <Progress value={application.matchScore} className="h-2" />
                            </div>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-semibold">Candidature pour: {application.property.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                Reçue le {new Date(application.appliedDate).toLocaleDateString("fr-FR")}
                              </p>
                            </div>
                            <Badge variant={getApplicationStatusBadgeVariant(application.status)}>
                              {application.status}
                            </Badge>
                          </div>

                          {application.status === "Visite programmée" && application.visitDate && (
                            <div className="bg-blue-50 p-3 rounded-md mb-4">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 text-blue-600 mr-2" />
                                <span className="font-medium text-blue-800">Visite programmée</span>
                              </div>
                              <p className="text-sm text-blue-700 mt-1">
                                Le{" "}
                                {new Date(application.visitDate).toLocaleDateString("fr-FR", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          )}

                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-medium mb-2">Actions</h4>
                              <div className="flex flex-wrap gap-2">
                                <Button size="sm" variant="outline" asChild>
                                  <Link href={`/owner/applications/${application.id}`}>Voir le dossier complet</Link>
                                </Button>
                                {application.status === "En cours d'analyse" && (
                                  <>
                                    <Button size="sm">Proposer une visite</Button>
                                    <Button size="sm" variant="destructive">
                                      Refuser
                                    </Button>
                                  </>
                                )}
                                {application.status === "Visite programmée" && (
                                  <>
                                    <Button size="sm">Accepter le dossier</Button>
                                    <Button size="sm" variant="destructive">
                                      Refuser
                                    </Button>
                                  </>
                                )}
                                {application.status === "Dossier accepté" && (
                                  <Button size="sm" asChild>
                                    <Link href={`/owner/leases/new?application=${application.id}`}>Créer le bail</Link>
                                  </Button>
                                )}
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium mb-2">Notes</h4>
                              <Textarea placeholder="Ajouter une note sur ce candidat..." className="h-20" />
                            </div>
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
              <h1 className="text-2xl font-bold">Visites</h1>

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
                              <div className="border rounded-md p-4">
                                <div className="flex items-center mb-4">
                                  <Calendar className="h-10 w-10 mr-3 text-blue-600" />
                                  <div>
                                    <h3 className="font-semibold">
                                      {new Date(visit.date).toLocaleDateString("fr-FR", {
                                        day: "numeric",
                                        month: "long",
                                      })}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                      {new Date(visit.date).toLocaleTimeString("fr-FR", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </p>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Visiteur</p>
                                    <p className="text-sm font-medium">{visit.tenant}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Téléphone</p>
                                    <p className="text-sm">{visit.tenantPhone}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Statut</p>
                                    <Badge variant={getVisitStatusBadgeVariant(visit.status)}>{visit.status}</Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h3 className="font-semibold">Visite pour: {visit.property.title}</h3>
                                  <p className="text-sm text-muted-foreground">{visit.property.address}</p>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div>
                                  <h4 className="text-sm font-medium mb-2">Actions</h4>
                                  <div className="flex flex-wrap gap-2">
                                    <Button size="sm" variant="outline">
                                      Envoyer un rappel
                                    </Button>
                                    <Button size="sm" variant="outline">
                                      Modifier la date
                                    </Button>
                                    {visit.status === "En attente" && <Button size="sm">Confirmer la visite</Button>}
                                    <Button size="sm" variant="destructive">
                                      Annuler la visite
                                    </Button>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="text-sm font-medium mb-2">Notes pour la visite</h4>
                                  <Textarea
                                    placeholder="Ajouter des instructions ou notes pour la visite..."
                                    className="h-20"
                                  />
                                </div>
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
                      <p className="text-muted-foreground mb-4">Vous n'avez pas encore de visites programmées.</p>
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

          {activeTab === "rentals" && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Locations en cours</h1>

              {rentals.length > 0 ? (
                <div className="space-y-4">
                  {rentals.map((rental) => (
                    <Card key={rental.id}>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="w-full md:w-1/4">
                            <div className="border rounded-md p-4">
                              <div className="flex items-center mb-4">
                                <Avatar className="h-12 w-12 mr-3">
                                  <AvatarFallback>
                                    {rental.tenant
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="font-semibold">{rental.tenant}</h3>
                                  <p className="text-sm text-muted-foreground">Locataire</p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div>
                                  <p className="text-xs text-muted-foreground">Début du bail</p>
                                  <p className="text-sm">{new Date(rental.leaseStart).toLocaleDateString("fr-FR")}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Fin du bail</p>
                                  <p className="text-sm">{new Date(rental.leaseEnd).toLocaleDateString("fr-FR")}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Statut des paiements</p>
                                  <Badge variant={rental.paymentStatus === "À jour" ? "success" : "destructive"}>
                                    {rental.paymentStatus}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="font-semibold">Bien loué: {rental.property.title}</h3>
                                <p className="text-sm text-muted-foreground">{rental.property.address}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg">{rental.property.price} €/mois</p>
                                <p className="text-xs text-muted-foreground">+ {rental.property.charges} € charges</p>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <h4 className="text-sm font-medium mb-2">Dernier paiement</h4>
                                <div className="flex items-center">
                                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                                  <span className="text-sm">
                                    Reçu le {new Date(rental.lastPaymentDate).toLocaleDateString("fr-FR")}
                                  </span>
                                </div>
                              </div>

                              <div>
                                <h4 className="text-sm font-medium mb-2">Incidents</h4>
                                {rental.incidents > 0 ? (
                                  <div className="flex items-center">
                                    <AlertTriangle className="h-4 w-4 text-amber-600 mr-2" />
                                    <span className="text-sm">{rental.incidents} incident(s) en cours</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center">
                                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                                    <span className="text-sm">Aucun incident signalé</span>
                                  </div>
                                )}
                              </div>

                              <div>
                                <h4 className="text-sm font-medium mb-2">Actions</h4>
                                <div className="flex flex-wrap gap-2">
                                  <Button size="sm" variant="outline" asChild>
                                    <Link href={`/owner/rentals/${rental.id}`}>Gérer la location</Link>
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    Générer une quittance
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    Contacter le locataire
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Home className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Aucune location en cours</h3>
                  <p className="text-muted-foreground mb-4">Vous n'avez pas encore de biens en location active.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "messages" && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Messages</h1>

              {messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <Card key={message.id} className={message.unread ? "border-blue-300 bg-blue-50" : ""}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {message.sender
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold text-sm">{message.sender}</h3>
                                <p className="text-xs text-muted-foreground">À propos de: {message.property}</p>
                              </div>
                              <div className="flex items-center">
                                {message.unread && <Badge className="mr-2 bg-blue-600">Nouveau</Badge>}
                                <span className="text-xs text-muted-foreground">
                                  {new Date(message.date).toLocaleDateString("fr-FR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm mt-2">{message.preview}</p>
                            <div className="flex justify-end mt-2">
                              <Button size="sm" asChild>
                                <Link href={`/owner/messages/${message.id}`}>Lire et répondre</Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Aucun message</h3>
                  <p className="text-muted-foreground">Vous n'avez pas encore reçu de messages.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
