"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/page-header"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  Calendar,
  Eye,
  MessageSquare,
  Search,
  Filter,
} from "lucide-react"

interface Application {
  id: string
  status: string
  created_at: string
  message?: string
  property: {
    id: string
    title: string
    address: string
    city: string
    rent?: number
    property_images?: Array<{ url: string; is_primary: boolean }>
  }
  owner?: {
    id: string
    first_name: string
    last_name: string
  }
}

export default function TenantApplicationsPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const statusConfig = {
    pending: { label: "En attente", variant: "secondary" as const, icon: Clock, color: "text-yellow-600" },
    accepted: { label: "Acceptée", variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
    rejected: { label: "Refusée", variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
    visit_scheduled: {
      label: "Visite programmée",
      variant: "outline" as const,
      icon: Calendar,
      color: "text-blue-600",
    },
    visit_proposed: {
      label: "Visite proposée",
      variant: "outline" as const,
      icon: Calendar,
      color: "text-blue-600",
    },
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "tenant") {
          router.push("/login")
          return
        }

        setCurrentUser(user)
        await loadApplications(user.id)
      } catch (error) {
        console.error("Erreur auth:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const loadApplications = async (tenantId: string) => {
    try {
      const response = await fetch(`/api/applications/tenant?tenant_id=${tenantId}`)
      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications || [])
        setFilteredApplications(data.applications || [])
      } else {
        toast.error("Erreur lors du chargement des candidatures")
      }
    } catch (error) {
      console.error("Erreur chargement candidatures:", error)
      toast.error("Erreur lors du chargement des candidatures")
    }
  }

  // Filtrage des candidatures
  useEffect(() => {
    let filtered = applications

    // Filtre par recherche
    if (searchQuery) {
      filtered = filtered.filter(
        (app) =>
          app.property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.property.city.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Filtre par statut
    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter)
    }

    setFilteredApplications(filtered)
  }, [applications, searchQuery, statusFilter])

  const getPropertyImage = (property: Application["property"]) => {
    if (!property.property_images?.length) {
      return "/placeholder.svg?height=120&width=120&text=Apt"
    }
    const primaryImage = property.property_images.find((img) => img.is_primary)
    return primaryImage?.url || property.property_images[0]?.url || "/placeholder.svg?height=120&width=120&text=Apt"
  }

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3 flex-shrink-0" />
        <span className="truncate">{config.label}</span>
      </Badge>
    )
  }

  const getApplicationsByStatus = (status: string) => {
    return applications.filter((app) => app.status === status)
  }

  const stats = {
    total: applications.length,
    pending: getApplicationsByStatus("pending").length,
    accepted: getApplicationsByStatus("accepted").length,
    rejected: getApplicationsByStatus("rejected").length,
    visit_scheduled: getApplicationsByStatus("visit_scheduled").length,
    visit_proposed: getApplicationsByStatus("visit_proposed").length,
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-full overflow-x-hidden">
        <PageHeader title="Mes candidatures" description="Chargement..." />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "accepted":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "visit_proposed":
      case "visit_scheduled":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "En analyse"
      case "accepted":
        return "Acceptée"
      case "rejected":
        return "Refusée"
      case "visit_proposed":
      case "visit_scheduled":
        return "Visite"
      default:
        return "Inconnu"
    }
  }

  return (
    <div className="space-y-6 p-4 max-w-full overflow-x-hidden">
      <PageHeader title="Mes candidatures" description="Suivez l'état de vos candidatures">
        <Button asChild className="w-full sm:w-auto">
          <Link href="/tenant/search">
            <Search className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="hidden sm:inline">Rechercher un logement</span>
            <span className="sm:hidden">Rechercher</span>
          </Link>
        </Button>
      </PageHeader>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Acceptées</p>
                <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Visites</p>
                <p className="text-2xl font-bold text-blue-600">{stats.visit_scheduled}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Refusées</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Input
                placeholder="Rechercher un logement..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2 flex-shrink-0" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="accepted">Acceptées</SelectItem>
                <SelectItem value="visit_scheduled">Visites programmées</SelectItem>
                <SelectItem value="rejected">Refusées</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("")
                setStatusFilter("all")
              }}
              className="w-full sm:w-auto"
            >
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Onglets par statut */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="pending">En analyse</TabsTrigger>
          <TabsTrigger value="visit_proposed">Visite</TabsTrigger>
          <TabsTrigger value="accepted">Acceptées</TabsTrigger>
          <TabsTrigger value="rejected">Refusées</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="space-y-4">
          {filteredApplications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Aucune candidature</h3>
                <p className="text-muted-foreground mb-4">
                  {applications.length === 0
                    ? "Vous n'avez pas encore postulé à des logements"
                    : "Aucune candidature ne correspond aux filtres sélectionnés"}
                </p>
                {applications.length === 0 && (
                  <Button asChild>
                    <Link href="/tenant/search">
                      <Search className="h-4 w-4 mr-2" />
                      Rechercher un logement
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((application) => (
                <Card key={application.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col lg:flex-row">
                      {/* Image */}
                      <div className="w-full lg:w-1/3 h-48 lg:h-auto">
                        <img
                          src={
                            application.property?.property_images?.find((img: any) => img.is_primary)?.url ||
                            application.property?.property_images?.[0]?.url ||
                            "/placeholder.svg?height=200&width=300" ||
                            "/placeholder.svg"
                          }
                          alt={application.property?.title || "Propriété"}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                          <div className="min-w-0 flex-1">
                            <h2 className="text-xl font-semibold truncate">
                              {application.property?.title || "Propriété"}
                            </h2>
                            <div className="flex items-center text-muted-foreground mt-1 min-w-0">
                              <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                              <span className="truncate">
                                {application.property?.address || "Adresse non disponible"}
                              </span>
                            </div>
                          </div>
                          <Badge className={`${getStatusColor(application.status)} whitespace-nowrap flex-shrink-0`}>
                            {getStatusText(application.status)}
                          </Badge>
                        </div>

                        {/* Informations candidature */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Date de candidature</p>
                            <p className="text-sm font-medium">
                              {new Date(application.created_at).toLocaleDateString("fr-FR", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                          {application.owner && (
                            <div>
                              <p className="text-sm text-muted-foreground">Propriétaire</p>
                              <p className="text-sm font-medium truncate">
                                {application.owner.first_name} {application.owner.last_name}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Message de candidature */}
                        {application.message && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Message</p>
                            <p className="text-sm bg-gray-50 p-3 rounded-lg break-words">{application.message}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button variant="outline" size="sm" asChild className="w-full sm:w-auto bg-transparent">
                            <Link href={`/properties/${application.property_id}`}>
                              <Eye className="h-4 w-4 mr-1 flex-shrink-0" />
                              Voir l'annonce
                            </Link>
                          </Button>

                          {application.owner && (
                            <Button variant="outline" size="sm" asChild className="w-full sm:w-auto bg-transparent">
                              <Link
                                href={`/tenant/messaging?owner_id=${application.owner.id}&property_id=${application.property.id}`}
                              >
                                <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                                Contacter
                              </Link>
                            </Button>
                          )}

                          {application.status === "visit_scheduled" && (
                            <Button size="sm" asChild className="w-full sm:w-auto">
                              <Link href="/tenant/visits">
                                <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                                Voir visite
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
