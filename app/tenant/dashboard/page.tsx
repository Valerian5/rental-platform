"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Search,
  Home,
  FileText,
  Calendar,
  Heart,
  Bell,
  Settings,
  Plus,
  AlertTriangle,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { authService } from "@/lib/auth-service"
import { rentalFileService } from "@/lib/rental-file-service"
import { applicationService } from "@/lib/application-service"
import { toast } from "sonner"

export default function TenantDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [rentalFile, setRentalFile] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [savedSearches, setSavedSearches] = useState<any[]>([])
  const [favoriteProperties, setFavoriteProperties] = useState<any[]>([])
  const [visits, setVisits] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log("📊 Chargement dashboard locataire...")
        setIsLoading(true)

        // Récupérer l'utilisateur connecté avec debug
        const user = await authService.getCurrentUser()
        console.log("👤 Utilisateur récupéré:", user)

        if (!user) {
          console.log("❌ Pas d'utilisateur connecté")
          toast.error("Vous devez être connecté pour accéder à cette page")
          window.location.href = "/login"
          return
        }

        if (user.user_type !== "tenant") {
          console.log("❌ Type utilisateur incorrect:", user.user_type)
          toast.error("Accès réservé aux locataires")
          window.location.href = "/"
          return
        }

        console.log("✅ Utilisateur locataire authentifié:", user)
        setCurrentUser(user)

        // Récupérer le dossier de location avec gestion d'erreur
        try {
          const fileData = await rentalFileService.getRentalFile(user.id)
          setRentalFile(fileData || { completion_percentage: 0, missing_documents: [] })
          console.log("📁 Dossier location:", fileData)
        } catch (fileError) {
          console.warn("⚠️ Erreur dossier location:", fileError)
          setRentalFile({ completion_percentage: 0, missing_documents: [] })
        }

        // Récupérer les candidatures avec gestion d'erreur
        try {
          const applicationsData = await applicationService.getTenantApplications(user.id)
          setApplications(Array.isArray(applicationsData) ? applicationsData : [])
          console.log("📝 Candidatures:", applicationsData)
        } catch (appError) {
          console.warn("⚠️ Erreur candidatures:", appError)
          setApplications([])
        }

        // Initialiser les autres données avec des valeurs par défaut
        setSavedSearches([])
        setFavoriteProperties([])
        setVisits([])

        console.log("✅ Dashboard chargé avec succès")
      } catch (error) {
        console.error("❌ Erreur chargement dashboard:", error)
        toast.error("Erreur lors du chargement du tableau de bord")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary"
      case "visit_proposed":
        return "default"
      case "rejected":
        return "destructive"
      case "accepted":
        return "default"
      default:
        return "outline"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "En cours d'analyse"
      case "visit_proposed":
        return "Visite proposée"
      case "rejected":
        return "Refusé"
      case "accepted":
        return "Accepté"
      default:
        return status
    }
  }

  // Utiliser la fonction getMissingDocuments du service
  const missingDocuments = rentalFile ? rentalFileService.getMissingDocuments(rentalFile) : []
  const completionPercentage = rentalFile?.completion_percentage || 0

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Chargement du tableau de bord...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <p className="text-red-600">Accès non autorisé</p>
        </div>
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
                    src="/placeholder.svg?height=40&width=40&text=JD"
                    alt={`${currentUser.first_name} ${currentUser.last_name}`}
                  />
                  <AvatarFallback>
                    {currentUser.first_name?.[0]}
                    {currentUser.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>
                    {currentUser.first_name} {currentUser.last_name}
                  </CardTitle>
                  <CardDescription>Locataire</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dossier de location</span>
                  <span className="font-medium">{completionPercentage}% complet</span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
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
              variant={activeTab === "messaging" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("messaging")}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Messagerie
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

              {completionPercentage < 100 && (
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
                        {missingDocuments.length > 0 && (
                          <div className="text-sm text-blue-700 mb-3">
                            <span className="font-medium">Documents manquants :</span>
                            <ul className="list-disc list-inside">
                              {missingDocuments.map((item, index) => (
                                <li key={index}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
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
                    {applications && applications.length > 0 ? (
                      applications.slice(0, 2).map((application) => (
                        <div key={application.id} className="flex items-start gap-3">
                          <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                            <img
                              src={application.property?.property_images?.[0]?.url || "/placeholder.svg"}
                              alt={application.property?.title || "Propriété"}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{application.property?.title || "Propriété"}</h4>
                            <p className="text-xs text-muted-foreground">
                              {application.property?.address || "Adresse non disponible"}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <Badge variant={getStatusBadgeVariant(application.status)} className="text-xs">
                                {getStatusText(application.status)}
                              </Badge>
                              <span className="text-sm font-semibold">{application.property?.price || 0} €/mois</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Aucune candidature envoyée</p>
                      </div>
                    )}
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
                    {visits && visits.length > 0 ? (
                      visits.slice(0, 2).map((visit) => (
                        <div key={visit.id} className="flex items-start gap-3">
                          <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                            <img
                              src={visit.property?.property_images?.[0]?.url || "/placeholder.svg"}
                              alt={visit.property?.title || "Propriété"}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{visit.property?.title || "Propriété"}</h4>
                            <p className="text-xs text-muted-foreground">
                              {visit.property?.address || "Adresse non disponible"}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <div className="flex items-center">
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
                              <Badge variant="default" className="text-xs">
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
                  {savedSearches && savedSearches.length > 0 ? (
                    savedSearches.map((search) => (
                      <div key={search.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{search.name}</h4>
                          {search.new_matches > 0 && (
                            <Badge className="bg-green-600 hover:bg-green-700">{search.new_matches} nouveaux</Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-3">
                          <div className="flex items-center">
                            <span className="text-muted-foreground mr-2">Ville:</span>
                            <span>{search.city}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-muted-foreground mr-2">Type:</span>
                            <span>{search.property_type}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-muted-foreground mr-2">Budget:</span>
                            <span>Max {search.max_price} €</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-muted-foreground mr-2">Surface:</span>
                            <span>
                              {search.min_surface} - {search.max_surface} m²
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            {search.match_count || 0} biens correspondent à vos critères
                          </span>
                          <Button size="sm" asChild>
                            <Link href={`/properties?search=${search.id}`}>Voir les biens</Link>
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">Aucune recherche sauvegardée</h3>
                      <p className="text-muted-foreground mb-4">
                        Créez des alertes pour être notifié des nouveaux biens correspondant à vos critères.
                      </p>
                      <Button asChild>
                        <Link href="/tenant/search">
                          <Plus className="h-4 w-4 mr-2" />
                          Créer une recherche
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveTab("searches")}>
                    Gérer mes recherches
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}

          {activeTab === "applications" && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Mes candidatures</h1>

              <div className="space-y-4">
                {applications && applications.length > 0 ? (
                  applications.map((application) => (
                    <Card key={application.id}>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="w-full md:w-1/4">
                            <div className="aspect-video rounded-md overflow-hidden">
                              <img
                                src={application.property?.property_images?.[0]?.url || "/placeholder.svg"}
                                alt={application.property?.title || "Propriété"}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold">{application.property?.title || "Propriété"}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {application.property?.address || "Adresse non disponible"}
                                </p>
                              </div>
                              <Badge variant={getStatusBadgeVariant(application.status)}>
                                {getStatusText(application.status)}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Loyer</p>
                                <p className="font-medium">{application.property?.price || 0} €/mois</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Candidature</p>
                                <p className="font-medium">
                                  {new Date(application.created_at).toLocaleDateString("fr-FR")}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Dernière mise à jour</p>
                                <p className="font-medium">
                                  {new Date(application.updated_at).toLocaleDateString("fr-FR")}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Score de matching</p>
                                <div className="flex items-center">
                                  <span className="font-medium mr-2">
                                    {applicationService.calculateMatchScore(application, application.property)}%
                                  </span>
                                  <Progress
                                    value={applicationService.calculateMatchScore(application, application.property)}
                                    className="h-2 w-16"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/properties/${application.property?.id}`}>Voir l'annonce</Link>
                              </Button>
                              <Button variant="outline" size="sm">
                                Contacter le propriétaire
                              </Button>
                              {application.status === "pending" && (
                                <Button variant="destructive" size="sm">
                                  Retirer ma candidature
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
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Aucune candidature envoyée</h3>
                    <p className="text-muted-foreground mb-4">
                      Vous n'avez pas encore postulé à des annonces. Explorez nos propriétés disponibles.
                    </p>
                    <Button asChild>
                      <Link href="/properties">Voir les annonces</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "messaging" && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Messagerie</h1>
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Messagerie en cours de développement</h3>
                <p className="text-muted-foreground">
                  Cette fonctionnalité sera bientôt disponible pour communiquer avec les propriétaires.
                </p>
              </div>
            </div>
          )}

          {/* Autres onglets similaires... */}
        </div>
      </div>
    </div>
  )
}
