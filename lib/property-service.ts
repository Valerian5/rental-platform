"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Home,
  Users,
  Calendar,
  Plus,
  Eye,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  Euro,
  Bug,
  MessageSquare,
  CreditCard,
  MapPin,
} from "lucide-react"
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
  const [activeTab, setActiveTab] = useState("overview")

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
      <div className="flex h-screen">
        <div className="w-64 bg-gray-900"></div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2">Chargement du tableau de bord...</p>
          </div>
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
    totalRevenue: properties.reduce((sum, p) => sum + (p.rent_excluding_charges || 0), 0),
  }

  const sidebarItems = [
    { id: "overview", label: "Vue d'ensemble", icon: Home },
    { id: "properties", label: "Mes biens", icon: Home },
    { id: "applications", label: "Candidatures", icon: Users },
    { id: "visits", label: "Visites", icon: Calendar },
    { id: "leases", label: "Locations en cours", icon: MapPin },
    { id: "payments", label: "Paiements", icon: CreditCard },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "settings", label: "Paramètres", icon: Settings },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold">Tableau de bord</h2>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === item.id
                        ? "bg-blue-600 text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Debug button */}
        <div className="p-4 border-t border-gray-700">
          <Button variant="outline" size="sm" onClick={() => setShowDebug(!showDebug)} className="w-full">
            <Bug className="h-4 w-4 mr-2" />
            {showDebug ? "Masquer Debug" : "Debug"}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {currentUser?.first_name} {currentUser?.last_name}
              </h1>
              <p className="text-gray-600">Propriétaire</p>
            </div>
            <Button asChild>
              <Link href="/owner/properties/new">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un bien
              </Link>
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Debug Panel */}
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

          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Candidatures</p>
                        <p className="text-2xl font-bold">{stats.totalApplications}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Biens disponibles</p>
                        <p className="text-2xl font-bold">{stats.availableProperties}</p>
                      </div>
                      <Home className="h-8 w-8 text-green-600" />
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
                        <p className="text-sm font-medium text-gray-600">Revenus mensuels</p>
                        <p className="text-2xl font-bold">{stats.totalRevenue}€</p>
                      </div>
                      <Euro className="h-8 w-8 text-yellow-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Candidatures récentes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Candidatures récentes
                      <Badge variant="secondary">{applications.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {applications.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Aucune candidature récente</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {applications.slice(0, 3).map((application) => (
                          <div key={application.id} className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              {application.status === "pending" && <Clock className="h-5 w-5 text-yellow-500" />}
                              {application.status === "approved" && <CheckCircle className="h-5 w-5 text-green-500" />}
                              {application.status === "rejected" && <AlertCircle className="h-5 w-5 text-red-500" />}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{application.property?.title}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(application.created_at).toLocaleDateString("fr-FR")}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Prochaines visites */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Prochaines visites
                      <Badge variant="secondary">{stats.upcomingVisits}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.upcomingVisits === 0 ? (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Aucune visite programmée</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {visits
                          .filter((v) => new Date(v.visit_date) > new Date())
                          .slice(0, 3)
                          .map((visit) => (
                            <div key={visit.id} className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium">{visit.property?.title}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(visit.visit_date).toLocaleDateString("fr-FR")}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">
                                  {new Date(visit.visit_date).toLocaleTimeString("fr-FR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Mes biens */}
              <Card>
                <CardHeader>
                  <CardTitle>Mes biens</CardTitle>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {properties.map((property) => (
                        <Card key={property.id} className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-0">
                            <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
                              {property.property_images && property.property_images.length > 0 ? (
                                <img
                                  src={property.property_images[0].image_url || "/placeholder.svg"}
                                  alt={property.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src =
                                      "/placeholder.svg?height=200&width=300&text=Image+non+disponible"
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                  <Home className="h-12 w-12 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="p-4 space-y-3">
                              <div className="flex justify-between items-start">
                                <h4 className="font-medium text-sm line-clamp-2">{property.title}</h4>
                                <Badge variant={property.available ? "default" : "secondary"} className="text-xs">
                                  {property.available ? "Disponible" : "Loué"}
                                </Badge>
                              </div>

                              <p className="text-xs text-gray-500">
                                {property.address}, {property.city}
                              </p>

                              <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-blue-600">
                                  {property.rent_excluding_charges}€
                                </span>
                                <span className="text-xs text-gray-500">par mois</span>
                              </div>

                              <Button variant="outline" size="sm" className="w-full" asChild>
                                <Link href={`/owner/properties/${property.id}`}>Gérer</Link>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "properties" && (
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
                              <span className="text-lg font-bold text-blue-600">
                                {property.rent_excluding_charges}€
                              </span>
                              <span className="text-sm text-gray-500">par mois</span>
                            </div>

                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" className="flex-1" asChild>
                                <Link href={`/owner/properties/${property.id}`}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  Gérer
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
          )}

          {activeTab === "applications" && (
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
          )}

          {activeTab === "visits" && (
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
          )}

          {/* Placeholder pour les autres onglets */}
          {["leases", "payments", "messages", "settings"].includes(activeTab) && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {activeTab === "leases" && "Locations en cours"}
                  {activeTab === "payments" && "Paiements"}
                  {activeTab === "messages" && "Messages"}
                  {activeTab === "settings" && "Paramètres"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-gray-500">Cette section sera bientôt disponible</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}