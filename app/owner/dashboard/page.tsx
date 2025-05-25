"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Home, Users, Calendar, Plus, Eye, Settings, AlertCircle, CheckCircle, Clock, Euro, Bug } from "lucide-react"
import Link from "next/link"
import { propertyService } from "@/lib/property-service"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"

export default function OwnerDashboard() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [properties, setProperties] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [visits, setVisits] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDebug, setShowDebug] = useState(false)
  const [debugLogs, setDebugLogs] = useState<string[]>([])

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `${timestamp}: ${message}`
    console.log(logMessage)
    setDebugLogs((prev) => [...prev, logMessage])
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        addDebugLog("🔍 Début du chargement du dashboard")

        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "owner") {
          addDebugLog("❌ Utilisateur non autorisé ou non connecté")
          toast.error("Vous devez être connecté en tant que propriétaire")
          router.push("/login")
          return
        }

        addDebugLog(`✅ Utilisateur connecté: ${user.email} (ID: ${user.id})`)
        setCurrentUser(user)

        // Charger les propriétés
        addDebugLog("📋 Chargement des propriétés...")
        const userProperties = await propertyService.getOwnerProperties(user.id)
        addDebugLog(`✅ ${userProperties.length} propriétés chargées`)
        setProperties(userProperties)

        // Charger les candidatures
        addDebugLog("📝 Chargement des candidatures...")
        const userApplications = await propertyService.getOwnerApplications(user.id)
        addDebugLog(`✅ ${userApplications.length} candidatures chargées`)
        setApplications(userApplications)

        // Charger les visites
        addDebugLog("📅 Chargement des visites...")
        const userVisits = await propertyService.getOwnerVisits(user.id)
        addDebugLog(`✅ ${userVisits.length} visites chargées`)
        setVisits(userVisits)

        // Charger les messages
        addDebugLog("💬 Chargement des messages...")
        const userMessages = await propertyService.getOwnerMessages(user.id)
        addDebugLog(`✅ ${userMessages.length} messages chargés`)
        setMessages(userMessages)

        addDebugLog("🎉 Chargement du dashboard terminé avec succès")
      } catch (error) {
        addDebugLog(`❌ Erreur lors du chargement: ${error.message}`)
        console.error("Erreur lors du chargement du dashboard:", error)
        toast.error("Erreur lors du chargement du dashboard")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router])

  const testPropertyCreation = async () => {
    if (!currentUser) {
      addDebugLog("❌ Pas d'utilisateur pour le test")
      return
    }

    try {
      addDebugLog("🧪 Test de création de propriété...")

      const testData = {
        title: "Test Property " + Date.now(),
        description: "Test description",
        address: "123 Test Street",
        city: "Test City",
        postal_code: "12345",
        hide_exact_address: false,
        surface: 50,
        rent_excluding_charges: 1000,
        charges_amount: 100,
        property_type: "apartment" as const,
        rental_type: "unfurnished" as const,
        construction_year: 2020,
        security_deposit: 1000,
        rooms: 3,
        bedrooms: 2,
        bathrooms: 1,
        exterior_type: "balcon",
        equipment: ["Cuisine équipée"],
        energy_class: "C",
        ges_class: "C",
        heating_type: "individual_electric",
        required_income: 3000,
        professional_situation: "CDI",
        guarantor_required: false,
        lease_duration: 12,
        move_in_date: "2024-02-01",
        rent_payment_day: 5,
        owner_id: currentUser.id,
      }

      const result = await propertyService.createProperty(testData)
      addDebugLog(`✅ Test réussi! Propriété créée: ${result.id}`)
      toast.success("Test de création réussi!")

      // Recharger les propriétés
      const updatedProperties = await propertyService.getOwnerProperties(currentUser.id)
      setProperties(updatedProperties)
    } catch (error) {
      addDebugLog(`❌ Test échoué: ${error.message}`)
      toast.error(`Test échoué: ${error.message}`)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2">Chargement du tableau de bord...</p>
        </div>
      </div>
    )
  }

  const stats = {
    totalProperties: properties.length,
    availableProperties: properties.filter((p) => p.available).length,
    totalApplications: applications.length,
    pendingApplications: applications.filter((a) => a.status === "pending").length,
    upcomingVisits: visits.filter((v) => new Date(v.visit_date) > new Date()).length,
    totalRevenue: properties.reduce((sum, p) => sum + (p.price || 0), 0),
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord propriétaire</h1>
          <p className="text-gray-600">Bienvenue, {currentUser?.first_name || currentUser?.email}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowDebug(!showDebug)}>
            <Bug className="h-4 w-4 mr-2" />
            {showDebug ? "Masquer" : "Debug"}
          </Button>
          <Button asChild>
            <Link href="/owner/properties/new">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un bien
            </Link>
          </Button>
        </div>
      </div>

      {/* Panel de debug */}
      {showDebug && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Bug className="h-5 w-5" />
              Panel de Debug
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Button size="sm" onClick={testPropertyCreation}>
                Test Création Propriété
              </Button>
              <Button size="sm" variant="outline" onClick={() => setDebugLogs([])}>
                Effacer Logs
              </Button>
            </div>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg max-h-64 overflow-y-auto font-mono text-sm">
              {debugLogs.length === 0 ? (
                <p>Aucun log pour le moment...</p>
              ) : (
                debugLogs.map((log, index) => <div key={index}>{log}</div>)
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Biens total</p>
                <p className="text-2xl font-bold">{stats.totalProperties}</p>
              </div>
              <Home className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Candidatures</p>
                <p className="text-2xl font-bold">{stats.totalApplications}</p>
                {stats.pendingApplications > 0 && (
                  <Badge variant="secondary" className="mt-1">
                    {stats.pendingApplications} en attente
                  </Badge>
                )}
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Visites à venir</p>
                <p className="text-2xl font-bold">{stats.upcomingVisits}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenus potentiels</p>
                <p className="text-2xl font-bold">{stats.totalRevenue}€</p>
                <p className="text-xs text-gray-500">par mois</p>
              </div>
              <Euro className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenu principal */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="properties">Mes biens ({properties.length})</TabsTrigger>
          <TabsTrigger value="applications">
            Candidatures ({applications.length})
            {stats.pendingApplications > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.pendingApplications}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="visits">Visites ({visits.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Biens récents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Mes biens récents
                  <Link href="/owner/properties">
                    <Button variant="outline" size="sm">
                      Voir tout
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {properties.length === 0 ? (
                  <div className="text-center py-8">
                    <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucun bien ajouté</h3>
                    <p className="text-gray-500 mb-4">Commencez par ajouter votre premier bien immobilier</p>
                    <Button asChild>
                      <Link href="/owner/properties/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter un bien
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {properties.slice(0, 3).map((property) => (
                      <div key={property.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{property.title}</h4>
                          <p className="text-sm text-gray-500">
                            {property.city} • {property.price}€/mois
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={property.available ? "default" : "secondary"}>
                            {property.available ? "Disponible" : "Loué"}
                          </Badge>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/owner/properties/${property.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activité récente */}
            <Card>
              <CardHeader>
                <CardTitle>Activité récente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications.slice(0, 3).map((application) => (
                    <div key={application.id} className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {application.status === "pending" && <Clock className="h-5 w-5 text-yellow-500" />}
                        {application.status === "approved" && <CheckCircle className="h-5 w-5 text-green-500" />}
                        {application.status === "rejected" && <AlertCircle className="h-5 w-5 text-red-500" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Nouvelle candidature pour {application.property?.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(application.created_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                  ))}
                  {applications.length === 0 && (
                    <p className="text-gray-500 text-center py-4">Aucune activité récente</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="properties">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Mes biens ({properties.length})
                <Button asChild>
                  <Link href="/owner/properties/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un bien
                  </Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {properties.length === 0 ? (
                <div className="text-center py-12">
                  <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Aucun bien ajouté</h3>
                  <p className="text-gray-500 mb-6">Commencez par ajouter votre premier bien immobilier</p>
                  <Button asChild>
                    <Link href="/owner/properties/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un bien
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {properties.map((property) => (
                    <Card key={property.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium line-clamp-2">{property.title}</h4>
                            <Badge variant={property.available ? "default" : "secondary"}>
                              {property.available ? "Disponible" : "Loué"}
                            </Badge>
                          </div>

                          <p className="text-sm text-gray-500">
                            {property.address}, {property.city}
                          </p>

                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-blue-600">{property.price}€</span>
                            <span className="text-sm text-gray-500">par mois</span>
                          </div>

                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1" asChild>
                              <Link href={`/owner/properties/${property.id}`}>
                                <Eye className="h-4 w-4 mr-1" />
                                Voir
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/owner/properties/${property.id}/edit`}>
                                <Settings className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>Candidatures ({applications.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Aucune candidature</h3>
                  <p className="text-gray-500">Les candidatures pour vos biens apparaîtront ici</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((application) => (
                    <div key={application.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{application.property?.title}</h4>
                          <p className="text-sm text-gray-500">
                            Candidat: {application.tenant?.first_name} {application.tenant?.last_name}
                          </p>
                        </div>
                        <Badge
                          variant={
                            application.status === "pending"
                              ? "secondary"
                              : application.status === "approved"
                                ? "default"
                                : "destructive"
                          }
                        >
                          {application.status === "pending" && "En attente"}
                          {application.status === "approved" && "Approuvée"}
                          {application.status === "rejected" && "Refusée"}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        Reçue le {new Date(application.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visits">
          <Card>
            <CardHeader>
              <CardTitle>Visites programmées ({visits.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {visits.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Aucune visite programmée</h3>
                  <p className="text-gray-500">Les visites de vos biens apparaîtront ici</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {visits.map((visit) => (
                    <div key={visit.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{visit.property?.title}</h4>
                          <p className="text-sm text-gray-500">
                            {visit.property?.address}, {visit.property?.city}
                          </p>
                          <p className="text-sm text-gray-500">
                            Visiteur: {visit.tenant?.first_name} {visit.tenant?.last_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{new Date(visit.visit_date).toLocaleDateString("fr-FR")}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(visit.visit_date).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}