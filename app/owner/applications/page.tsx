"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import {
  MapPin,
  Calendar,
  Clock,
  Euro,
  FileText,
  MessageCircle,
  Eye,
  CalendarPlus,
  Search,
  Filter,
  SortAsc,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  Mail,
  Settings,
  Star,
} from "lucide-react"

interface Application {
  id: string
  tenant_id: string
  property_id: string
  status: "pending" | "accepted" | "rejected" | "visit_scheduled" | "visit_completed"
  created_at: string
  updated_at: string
  message?: string
  tenant: {
    id: string
    email: string
    first_name: string
    last_name: string
    phone?: string
    avatar_url?: string
  }
  property: {
    id: string
    title: string
    address: string
    rent: number
    images?: Array<{ url: string; is_primary?: boolean }>
  }
  rental_file?: {
    id: string
    monthly_income?: number
    employment_status?: string
    guarantor_income?: number
  }
  visits?: Array<{
    id: string
    visit_date: string
    start_time: string
    end_time: string
    status: string
  }>
}

const statusConfig = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
  visit_scheduled: { label: "Visite programmée", color: "bg-blue-100 text-blue-800", icon: Calendar },
  visit_completed: { label: "Visite effectuée", color: "bg-purple-100 text-purple-800", icon: CheckCircle },
  accepted: { label: "Acceptée", color: "bg-green-100 text-green-800", icon: CheckCircle },
  rejected: { label: "Refusée", color: "bg-red-100 text-red-800", icon: XCircle },
}

export default function OwnerApplicationsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [applications, setApplications] = useState<Application[]>([])
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("created_at")
  const [activeTab, setActiveTab] = useState("all")
  const [propertyFilter, setPropertyFilter] = useState<string>("all")
  const [scoreFilter, setScoreFilter] = useState<string>("all")
  const [properties, setProperties] = useState<Array<{ id: string; title: string }>>([])

  useEffect(() => {
    fetchApplications()
    fetchProperties()
  }, [])

  useEffect(() => {
    filterAndSortApplications()
  }, [applications, searchTerm, statusFilter, sortBy, activeTab, propertyFilter, scoreFilter])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      console.log("🔄 Récupération des candidatures...")

      const response = await fetch("/api/applications")
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("✅ Candidatures récupérées:", data?.length || 0)
      setApplications(data || [])
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des candidatures:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les candidatures",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchProperties = async () => {
    try {
      // Extraire les propriétés uniques des candidatures
      const uniqueProperties = applications.reduce(
        (acc, app) => {
          if (!acc.find((p) => p.id === app.property_id)) {
            acc.push({
              id: app.property_id,
              title: app.property.title,
            })
          }
          return acc
        },
        [] as Array<{ id: string; title: string }>,
      )

      setProperties(uniqueProperties)
    } catch (error) {
      console.error("Erreur récupération propriétés:", error)
    }
  }

  // Mettre à jour les propriétés quand les candidatures changent
  useEffect(() => {
    if (applications.length > 0) {
      fetchProperties()
    }
  }, [applications])

  const filterAndSortApplications = () => {
    let filtered = [...applications]

    // Filtre par onglet
    if (activeTab !== "all") {
      filtered = filtered.filter((app) => app.status === activeTab)
    }

    // Filtre par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (app) =>
          app.tenant.first_name.toLowerCase().includes(term) ||
          app.tenant.last_name.toLowerCase().includes(term) ||
          app.tenant.email.toLowerCase().includes(term) ||
          app.property.title.toLowerCase().includes(term) ||
          app.property.address.toLowerCase().includes(term),
      )
    }

    // Filtre par statut
    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter)
    }

    // Filtre par propriété
    if (propertyFilter !== "all") {
      filtered = filtered.filter((app) => app.property_id === propertyFilter)
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "created_at":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "tenant_name":
          return `${a.tenant.first_name} ${a.tenant.last_name}`.localeCompare(
            `${b.tenant.first_name} ${b.tenant.last_name}`,
          )
        case "property_title":
          return a.property.title.localeCompare(b.property.title)
        case "rent":
          return b.property.rent - a.property.rent
        default:
          return 0
      }
    })

    // Filtre par score (ajouter après les autres filtres)
    if (scoreFilter !== "all") {
      filtered = filtered.filter((app) => {
        // Calculer le score pour chaque candidature
        const score = calculateScore(app)
        switch (scoreFilter) {
          case "excellent":
            return score >= 80
          case "good":
            return score >= 60 && score < 80
          case "average":
            return score >= 40 && score < 60
          case "poor":
            return score < 40
          default:
            return true
        }
      })
    }

    setFilteredApplications(filtered)
  }

  const handleApplicationAction = async (applicationId: string, action: string) => {
    const application = applications.find((app) => app.id === applicationId)
    if (!application) return

    console.log(`🎯 Action: ${action} pour candidature:`, applicationId)

    switch (action) {
      case "view_details":
        router.push(`/owner/applications/${applicationId}`)
        break

      case "view_analysis":
        router.push(`/owner/applications/${applicationId}?tab=financial`)
        break

      case "view_rental_file":
        router.push(`/owner/applications/${applicationId}?tab=rental-file`)
        break

      case "propose_visit":
        router.push(`/owner/applications/${applicationId}?tab=visit`)
        break

      case "contact_tenant":
        router.push(`/owner/messaging?conversation=${application.tenant_id}`)
        break

      case "accept":
        await updateApplicationStatus(applicationId, "accepted")
        break

      case "reject":
        await updateApplicationStatus(applicationId, "rejected")
        break

      default:
        console.warn("Action non reconnue:", action)
    }
  }

  const updateApplicationStatus = async (applicationId: string, status: string) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) throw new Error("Erreur lors de la mise à jour")

      toast({
        title: "Succès",
        description: `Candidature ${status === "accepted" ? "acceptée" : "refusée"}`,
      })

      fetchApplications() // Recharger les données
    } catch (error) {
      console.error("Erreur:", error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la candidature",
        variant: "destructive",
      })
    }
  }

  const getApplicationCounts = () => {
    return {
      all: applications.length,
      pending: applications.filter((app) => app.status === "pending").length,
      visit_scheduled: applications.filter((app) => app.status === "visit_scheduled").length,
      visit_completed: applications.filter((app) => app.status === "visit_completed").length,
      accepted: applications.filter((app) => app.status === "accepted").length,
      rejected: applications.filter((app) => app.status === "rejected").length,
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getNextVisit = (application: Application) => {
    if (!application.visits || application.visits.length === 0) return null

    const now = new Date()
    const upcomingVisits = application.visits
      .filter((visit) => {
        const visitDateTime = new Date(`${visit.visit_date.split("T")[0]}T${visit.start_time}`)
        return visitDateTime > now && visit.status === "scheduled"
      })
      .sort(
        (a, b) =>
          new Date(`${a.visit_date}T${a.start_time}`).getTime() - new Date(`${b.visit_date}T${b.start_time}`).getTime(),
      )

    return upcomingVisits[0] || null
  }

  const calculateScore = (application: Application) => {
    let score = 0

    // Score basé sur les revenus (40 points max)
    if (application.rental_file?.monthly_income && application.property.rent) {
      const ratio = application.rental_file.monthly_income / application.property.rent
      if (ratio >= 3) score += 40
      else if (ratio >= 2.5) score += 30
      else if (ratio >= 2) score += 20
      else score += 10
    }

    // Score basé sur l'emploi (30 points max)
    if (application.rental_file?.employment_status) {
      if (application.rental_file.employment_status === "CDI") score += 30
      else if (application.rental_file.employment_status === "CDD") score += 20
      else score += 10
    }

    // Score basé sur le garant (20 points max)
    if (application.rental_file?.guarantor_income) {
      score += 20
    }

    // Score basé sur le message (10 points max)
    if (application.message && application.message.length > 50) {
      score += 10
    }

    return Math.min(score, 100)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des candidatures...</p>
          </div>
        </div>
      </div>
    )
  }

  const counts = getApplicationCounts()

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Candidatures</h1>
          <p className="text-gray-600 mt-1">Gérez les candidatures pour vos propriétés</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/owner/scoring-preferences-simple")}>
            <Settings className="h-4 w-4 mr-2" />
            Préférences de scoring
          </Button>
          <Button variant="outline" size="sm" onClick={() => fetchApplications()} disabled={loading}>
            🔄 Actualiser
          </Button>
        </div>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher par nom, email, propriété..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="visit_scheduled">Visite programmée</SelectItem>
                <SelectItem value="visit_completed">Visite effectuée</SelectItem>
                <SelectItem value="accepted">Acceptée</SelectItem>
                <SelectItem value="rejected">Refusée</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SortAsc className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date de candidature</SelectItem>
                <SelectItem value="tenant_name">Nom du locataire</SelectItem>
                <SelectItem value="property_title">Propriété</SelectItem>
                <SelectItem value="rent">Loyer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={propertyFilter} onValueChange={setPropertyFilter}>
              <SelectTrigger className="w-48">
                <MapPin className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrer par bien" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les biens</SelectItem>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={scoreFilter} onValueChange={setScoreFilter}>
              <SelectTrigger className="w-48">
                <Star className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrer par score" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les scores</SelectItem>
                <SelectItem value="excellent">Excellent (80-100)</SelectItem>
                <SelectItem value="good">Bon (60-79)</SelectItem>
                <SelectItem value="average">Moyen (40-59)</SelectItem>
                <SelectItem value="poor">Faible (&lt;40)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all" className="flex items-center gap-2">
            Toutes ({counts.all})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            En attente ({counts.pending})
          </TabsTrigger>
          <TabsTrigger value="visit_scheduled" className="flex items-center gap-2">
            Visites ({counts.visit_scheduled})
          </TabsTrigger>
          <TabsTrigger value="visit_completed" className="flex items-center gap-2">
            Effectuées ({counts.visit_completed})
          </TabsTrigger>
          <TabsTrigger value="accepted" className="flex items-center gap-2">
            Acceptées ({counts.accepted})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            Refusées ({counts.rejected})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredApplications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <FileText className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune candidature trouvée</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== "all"
                    ? "Essayez de modifier vos filtres de recherche"
                    : "Les candidatures pour vos propriétés apparaîtront ici"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {filteredApplications.map((application) => {
                const StatusIcon = statusConfig[application.status]?.icon || AlertCircle
                const nextVisit = getNextVisit(application)

                return (
                  <Card key={application.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Informations locataire */}
                        <div className="flex-1">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={application.tenant.avatar_url || "/placeholder.svg"} />
                              <AvatarFallback>
                                {application.tenant.first_name[0]}
                                {application.tenant.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold">
                                  {application.tenant.first_name} {application.tenant.last_name}
                                </h3>
                                <Badge className={statusConfig[application.status]?.color}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusConfig[application.status]?.label}
                                </Badge>
                              </div>

                              <div className="space-y-1 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4" />
                                  {application.tenant.email}
                                </div>
                                {application.tenant.phone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    {application.tenant.phone}
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  Candidature du {formatDate(application.created_at)}
                                </div>
                              </div>

                              {application.message && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                  <p className="text-sm text-gray-700">
                                    <strong>Message :</strong> {application.message}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Informations propriété */}
                        <div className="lg:w-80">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-medium mb-2">{application.property.title}</h4>
                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                {application.property.address}
                              </div>
                              <div className="flex items-center gap-2">
                                <Euro className="h-4 w-4" />
                                {application.property.rent}€/mois
                              </div>
                              {nextVisit && (
                                <div className="flex items-center gap-2 text-blue-600">
                                  <Clock className="h-4 w-4" />
                                  Visite le {new Date(nextVisit.visit_date).toLocaleDateString("fr-FR")} à{" "}
                                  {nextVisit.start_time}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Informations financières */}
                          {application.rental_file && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                              <div className="text-sm">
                                {application.rental_file.monthly_income && (
                                  <div>Revenus : {application.rental_file.monthly_income}€/mois</div>
                                )}
                                {application.rental_file.employment_status && (
                                  <div>Statut : {application.rental_file.employment_status}</div>
                                )}
                              </div>
                            </div>
                          )}
                          <div className="mt-3 p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Score de compatibilité</span>
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${
                                    calculateScore(application) >= 80
                                      ? "bg-green-500 text-white"
                                      : calculateScore(application) >= 60
                                        ? "bg-yellow-500 text-white"
                                        : calculateScore(application) >= 40
                                          ? "bg-orange-500 text-white"
                                          : "bg-red-500 text-white"
                                  }`}
                                >
                                  {calculateScore(application)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleApplicationAction(application.id, "view_details")}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir détails
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApplicationAction(application.id, "view_analysis")}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Analyse
                        </Button>

                        {application.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApplicationAction(application.id, "propose_visit")}
                          >
                            <CalendarPlus className="h-4 w-4 mr-2" />
                            Proposer visite
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApplicationAction(application.id, "contact_tenant")}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Contacter
                        </Button>

                        {application.status === "visit_completed" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => handleApplicationAction(application.id, "accept")}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Accepter
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => handleApplicationAction(application.id, "reject")}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Refuser
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
