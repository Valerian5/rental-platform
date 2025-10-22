"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertTriangle,
  Search,
  MessageSquare,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Building,
  User,
} from "lucide-react"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"
import Link from "next/link"

export default function OwnerIncidentsPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [incidents, setIncidents] = useState<any[]>([])
  const [filteredIncidents, setFilteredIncidents] = useState<any[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filtres
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    category: "all",
    priority: "all",
    property: "all",
  })

  useEffect(() => {
    const initialize = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "owner") {
          router.push("/login")
          return
        }
        setCurrentUser(user)
        await Promise.all([loadIncidents(user.id), loadProperties(user.id)])
      } catch (error) {
        console.error("Erreur initialisation:", error)
        toast.error("Erreur lors du chargement")
      } finally {
        setIsLoading(false)
      }
    }
    initialize()
  }, [router])

  const loadIncidents = async (ownerId: string) => {
    try {
      const res = await fetch(`/api/incidents/owner?ownerId=${ownerId}`, {
        cache: "no-store",
        next: { revalidate: 0 },
        headers: { "Cache-Control": "no-store" },
      })
      const data = await res.json()
      if (data.success) {
        setIncidents(data.incidents)
        setFilteredIncidents(data.incidents)
      } else {
        toast.error("Erreur lors du chargement des incidents")
      }
    } catch (error) {
      console.error("Erreur chargement incidents:", error)
      toast.error("Erreur lors du chargement")
    }
  }

  const loadProperties = async (ownerId: string) => {
    try {
      const res = await fetch(`/api/properties/owner?owner_id=${ownerId}`)
      const data = await res.json()

      if (data.success) {
        setProperties(data.properties)
      }
    } catch (error) {
      console.error("Erreur chargement propriétés:", error)
    }
  }

  // Rafraîchir à la visibilité
  useEffect(() => {
    const handleVis = async () => {
      if (document.visibilityState === "visible" && currentUser) {
        await loadIncidents(currentUser.id)
      }
    }
    document.addEventListener("visibilitychange", handleVis)
    return () => document.removeEventListener("visibilitychange", handleVis)
  }, [currentUser])

  // Appliquer les filtres
  useEffect(() => {
    let filtered = incidents

    // Recherche textuelle
    if (filters.search) {
      filtered = filtered.filter(
        (incident) =>
          incident.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          incident.description.toLowerCase().includes(filters.search.toLowerCase()) ||
          incident.property?.title.toLowerCase().includes(filters.search.toLowerCase()),
      )
    }

    // Filtre par statut
    if (filters.status !== "all") {
      filtered = filtered.filter((incident) => incident.status === filters.status)
    }

    // Filtre par catégorie
    if (filters.category !== "all") {
      filtered = filtered.filter((incident) => incident.category === filters.category)
    }

    // Filtre par priorité
    if (filters.priority !== "all") {
      filtered = filtered.filter((incident) => incident.priority === filters.priority)
    }

    // Filtre par propriété
    if (filters.property !== "all") {
      filtered = filtered.filter((incident) => incident.property_id === filters.property)
    }

    setFilteredIncidents(filtered)
  }, [incidents, filters])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "in_progress":
        return <Clock className="h-4 w-4 text-orange-600" />
      case "reported":
        return <AlertCircle className="h-4 w-4 text-blue-600" />
      case "closed":
        return <CheckCircle className="h-4 w-4 text-gray-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return <Badge className="bg-green-600 text-xs">Résolu</Badge>
      case "in_progress":
        return <Badge className="bg-orange-600 text-xs">En cours</Badge>
      case "reported":
        return (
          <Badge variant="secondary" className="text-xs">
            Signalé
          </Badge>
        )
      case "closed":
        return (
          <Badge variant="outline" className="text-xs">
            Fermé
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-xs">
            {status}
          </Badge>
        )
    }
  }

  const getInterventionPlannedBadge = (incident: any) => {
    // Affiche un badge spécifique lorsque l'incident est en cours (intervention programmée)
    if (incident.status === "in_progress") {
      return (
        <Badge className="bg-blue-600 text-xs">
          Intervention programmée
        </Badge>
      )
    }
    return null
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return (
          <Badge variant="destructive" className="text-xs">
            Urgent
          </Badge>
        )
      case "high":
        return <Badge className="bg-orange-600 text-xs">Élevé</Badge>
      case "medium":
        return (
          <Badge variant="secondary" className="text-xs">
            Moyen
          </Badge>
        )
      case "low":
        return (
          <Badge variant="outline" className="text-xs">
            Faible
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-xs">
            {priority}
          </Badge>
        )
    }
  }

  const getCategoryLabel = (category: string) => {
    const categories = {
      plumbing: "Plomberie",
      electrical: "Électricité",
      heating: "Chauffage",
      security: "Sécurité",
      other: "Autre",
    }
    return categories[category as keyof typeof categories] || category
  }

  const getIncidentStats = () => {
    const total = incidents.length
    const reported = incidents.filter((i) => i.status === "reported").length
    const inProgress = incidents.filter((i) => i.status === "in_progress").length
    const resolved = incidents.filter((i) => i.status === "resolved").length

    return { total, reported, inProgress, resolved }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Chargement des incidents...</p>
        </div>
      </div>
    )
  }

  const stats = getIncidentStats()

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Incidents signalés</h1>
          <p className="text-sm sm:text-base text-gray-600">Gérez les incidents signalés par vos locataires</p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.total}</p>
              </div>
              <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Signalés</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-600">{stats.reported}</p>
              </div>
              <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">En cours</p>
                <p className="text-lg sm:text-2xl font-bold text-orange-600">{stats.inProgress}</p>
              </div>
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Résolus</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Recherche */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un incident..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>

            {/* Propriété */}
            <Select value={filters.property} onValueChange={(value) => setFilters({ ...filters, property: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Propriété" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les propriétés</SelectItem>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Statut */}
            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="reported">Signalé</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="resolved">Résolu</SelectItem>
                <SelectItem value="closed">Fermé</SelectItem>
              </SelectContent>
            </Select>

            {/* Catégorie */}
            <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                <SelectItem value="plumbing">Plomberie</SelectItem>
                <SelectItem value="electrical">Électricité</SelectItem>
                <SelectItem value="heating">Chauffage</SelectItem>
                <SelectItem value="security">Sécurité</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>

            {/* Priorité */}
            <Select value={filters.priority} onValueChange={(value) => setFilters({ ...filters, priority: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les priorités</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">Élevé</SelectItem>
                <SelectItem value="medium">Moyen</SelectItem>
                <SelectItem value="low">Faible</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des incidents */}
      {filteredIncidents.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun incident trouvé</h3>
            <p className="text-gray-600">
              {incidents.length === 0
                ? "Aucun incident n'a été signalé pour vos propriétés."
                : "Aucun incident ne correspond à vos critères de recherche."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredIncidents.map((incident) => (
            <Card key={incident.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Contenu principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-3">
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {getStatusIcon(incident.status)}
                        <h3 className="font-semibold text-gray-900 truncate">{incident.title}</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {getStatusBadge(incident.status)}
                        {getInterventionPlannedBadge(incident)}
                        {getPriorityBadge(incident.priority)}
                        <Badge variant="outline" className="text-xs">
                          {getCategoryLabel(incident.category)}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{incident.description}</p>

                    {/* Informations propriété et locataire */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-3 text-xs text-gray-500">
                      {incident.property && (
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{incident.property.title}</span>
                        </div>
                      )}
                      {incident.lease?.tenant && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">
                            {incident.lease.tenant.first_name} {incident.lease.tenant.last_name}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-gray-500">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(incident.created_at).toLocaleDateString("fr-FR")}
                        </span>
                        {incident.responses && incident.responses.length > 0 && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {incident.responses.length} réponse{incident.responses.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                    <Link href={`/owner/rental-management/incidents/${incident.id}`}>
                      <Button variant="outline" size="sm" className="w-full sm:w-auto bg-transparent">
                        <Eye className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Voir</span>
                      </Button>
                    </Link>
                    {incident.status !== "resolved" && incident.status !== "closed" && (
                      <Link href={`/owner/rental-management/incidents/${incident.id}`}>
                        <Button size="sm" className="w-full sm:w-auto">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Traiter</span>
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Photos preview */}
                {incident.photos && incident.photos.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex gap-2 overflow-x-auto">
                      {incident.photos.slice(0, 3).map((photo: string, index: number) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`Photo ${index + 1}`}
                          className="w-16 h-16 object-cover rounded border flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg?height=64&width=64&text=Image"
                          }}
                        />
                      ))}
                      {incident.photos.length > 3 && (
                        <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
                          +{incident.photos.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
