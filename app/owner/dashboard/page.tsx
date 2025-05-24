"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Home,
  FileText,
  Calendar,
  Settings,
  Plus,
  Users,
  CreditCard,
  BarChart,
  MessageSquare,
  Eye,
  Edit,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { authService } from "@/lib/auth-service"
import { propertyService } from "@/lib/property-service"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function OwnerDashboardPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [properties, setProperties] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [visits, setVisits] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "owner") {
          router.push("/login")
          return
        }
        setCurrentUser(user)

        // Charger toutes les données en parallèle
        const [propertiesData, applicationsData, visitsData, messagesData] = await Promise.all([
          propertyService.getOwnerPropertiesWithStats(user.id),
          propertyService.getOwnerApplications(user.id),
          propertyService.getOwnerVisits(user.id),
          propertyService.getOwnerMessages(user.id),
        ])

        setProperties(propertiesData)
        setApplications(applicationsData)
        setVisits(visitsData)
        setMessages(messagesData)
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error)
        toast.error("Erreur lors du chargement des données")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router])

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "available":
        return "default"
      case "rented":
        return "success"
      case "paused":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getApplicationStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary"
      case "visit_scheduled":
        return "default"
      case "accepted":
        return "success"
      case "rejected":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getVisitStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "confirmed":
        return "success"
      case "pending":
        return "secondary"
      case "cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Chargement...</div>
      </div>
    )
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
                  <AvatarImage
                    src={currentUser?.avatar_url || "/placeholder.svg"}
                    alt={`${currentUser?.first_name} ${currentUser?.last_name}`}
                  />
                  <AvatarFallback>
                    {currentUser?.first_name?.[0]}
                    {currentUser?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>
                    {currentUser?.first_name} {currentUser?.last_name}
                  </CardTitle>
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
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Visites à venir</span>
                  <span className="font-medium">
                    {visits.filter((v) => new Date(v.visit_date) > new Date()).length}
                  </span>
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
                      {properties.filter((p) => p.available).length} disponibles,{" "}
                      {properties.filter((p) => !p.available).length} loués
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
                      {applications.filter((a) => a.status === "pending").length} en attente d'analyse
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Visites à venir</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {visits.filter((v) => new Date(v.visit_date) > new Date()).length}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {visits.filter((v) => v.status === "confirmed").length} confirmées
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
                    {applications.length === 0 ? (
                      <div className="text-center py-4">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Aucune candidature reçue</p>
                      </div>
                    ) : (
                      applications.slice(0, 3).map((application) => (
                        <div key={application.id} className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {application.tenant?.first_name?.[0]}
                              {application.tenant?.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <h4 className="font-medium text-sm">
                                {application.tenant?.first_name} {application.tenant?.last_name}
                              </h4>
                              <Badge variant={getApplicationStatusBadgeVariant(application.status)} className="text-xs">
                                {application.status === "pending" && "En attente"}
                                {application.status === "visit_scheduled" && "Visite programmée"}
                                {application.status === "accepted" && "Accepté"}
                                {application.status === "rejected" && "Refusé"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">Pour: {application.property?.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(application.created_at).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
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
                      <Badge>{visits.filter((v) => new Date(v.visit_date) > new Date()).length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {visits.filter((v) => new Date(v.visit_date) > new Date()).length === 0 ? (
                      <div className="text-center py-4">
                        <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Aucune visite programmée</p>
                      </div>
                    ) : (
                      visits
                        .filter((v) => new Date(v.visit_date) > new Date())
                        .slice(0, 3)
                        .map((visit) => (
                          <div key={visit.id} className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {visit.tenant?.first_name?.[0]}
                                {visit.tenant?.last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <h4 className="font-medium text-sm">
                                  {visit.tenant?.first_name} {visit.tenant?.last_name}
                                </h4>
                                <Badge variant={getVisitStatusBadgeVariant(visit.status)} className="text-xs">
                                  {visit.status === "confirmed" && "Confirmée"}
                                  {visit.status === "pending" && "En attente"}
                                  {visit.status === "cancelled" && "Annulée"}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">Pour: {visit.property?.title}</p>
                              <div className="flex items-center mt-1">
                                <Calendar className="h-3 w-3 mr-1" />
                                <span className="text-xs">
                                  {new Date(visit.visit_date).toLocaleDateString("fr-FR", {
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
                  {properties.length === 0 ? (
                    <div className="text-center py-8">
                      <Home className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">Aucun bien ajouté</h3>
                      <p className="text-muted-foreground mb-4">Commencez par ajouter votre premier bien immobilier</p>
                      <Button asChild>
                        <Link href="/owner/properties/new">Ajouter un bien</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {properties.slice(0, 4).map((property) => (
                        <div key={property.id} className="flex border rounded-lg overflow-hidden">
                          <div className="w-1/3">
                            <img
                              src={property.property_images?.[0]?.url || "/placeholder.svg?height=120&width=120"}
                              alt={property.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="flex-1 p-4">
                            <div className="flex justify-between items-start">
                              <h3 className="font-medium text-sm">{property.title}</h3>
                              <Badge
                                variant={getStatusBadgeVariant(property.available ? "available" : "rented")}
                                className="text-xs"
                              >
                                {property.available ? "Disponible" : "Loué"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{property.city}</p>
                            <div className="flex justify-between items-end">
                              <div>
                                <p className="text-sm font-semibold">
                                  {property.rent_excluding_charges || property.price} €/mois
                                </p>
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <Eye className="h-3 w-3 mr-1" />
                                  {property.applications?.length || 0} candidatures
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
                  )}
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

              {properties.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Home className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Aucun bien ajouté</h3>
                    <p className="text-muted-foreground mb-4">Commencez par ajouter votre premier bien immobilier</p>
                    <Button asChild>
                      <Link href="/owner/properties/new">Ajouter un bien</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {properties.map((property) => (
                    <Card key={property.id}>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="w-full md:w-1/4">
                            <div className="aspect-video rounded-md overflow-hidden">
                              <img
                                src={property.property_images?.[0]?.url || "/placeholder.svg?height=200&width=300"}
                                alt={property.title}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold">{property.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {property.address}, {property.city}
                                </p>
                              </div>
                              <Badge variant={getStatusBadgeVariant(property.available ? "available" : "rented")}>
                                {property.available ? "Disponible" : "Loué"}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Loyer</p>
                                <p className="font-medium">
                                  {property.rent_excluding_charges || property.price} €/mois
                                </p>
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
                                <p className="text-sm text-muted-foreground">Candidatures</p>
                                <p className="font-medium">{property.applications?.length || 0}</p>
                              </div>
                            </div>

                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                                  <span className="text-sm">
                                    Créé le {new Date(property.created_at).toLocaleDateString("fr-FR")}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/properties/${property.id}`}>Voir l'annonce</Link>
                                </Button>
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/owner/properties/${property.id}`}>
                                    <Edit className="h-4 w-4 mr-1" />
                                    Gérer
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Autres onglets avec structure similaire mais données réelles */}
          {activeTab === "applications" && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Candidatures</h1>
              {applications.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Aucune candidature reçue</h3>
                    <p className="text-muted-foreground">Les candidatures pour vos biens apparaîtront ici.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {applications.map((application) => (
                    <Card key={application.id}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">
                              {application.tenant?.first_name} {application.tenant?.last_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Candidature pour: {application.property?.title}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Reçue le {new Date(application.created_at).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                          <Badge variant={getApplicationStatusBadgeVariant(application.status)}>
                            {application.status === "pending" && "En attente"}
                            {application.status === "visit_scheduled" && "Visite programmée"}
                            {application.status === "accepted" && "Accepté"}
                            {application.status === "rejected" && "Refusé"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "visits" && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Visites</h1>
              {visits.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Aucune visite programmée</h3>
                    <p className="text-muted-foreground">Les visites de vos biens apparaîtront ici.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {visits.map((visit) => (
                    <Card key={visit.id}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">
                              {visit.tenant?.first_name} {visit.tenant?.last_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">Visite pour: {visit.property?.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(visit.visit_date).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <Badge variant={getVisitStatusBadgeVariant(visit.status)}>
                            {visit.status === "confirmed" && "Confirmée"}
                            {visit.status === "pending" && "En attente"}
                            {visit.status === "cancelled" && "Annulée"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "messages" && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Messages</h1>
              {messages.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Aucun message</h3>
                    <p className="text-muted-foreground">Vos conversations apparaîtront ici.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <Card key={message.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">
                              {message.sender?.first_name} {message.sender?.last_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">{message.conversation?.subject}</p>
                            <p className="text-sm mt-2">{message.content}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.created_at).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}