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
  Plus,
} from "lucide-react"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"
import Link from "next/link"

export default function TenantIncidentsPage() {
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
    const initializeData = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "tenant") {
          router.push("/login")
          return
        }
        setCurrentUser(user)
        await loadIncidents(user.id)
      } catch (error) {
        console.error("Erreur initialisation:", error)
        toast.error("Erreur lors du chargement")
      } finally {
        setIsLoading(false)
      }
    }
    initializeData()
  }, [router])

  const loadIncidents = async (tenantId: string) => {
    try {
      console.log("🔍 [TENANT INCIDENTS PAGE] Chargement incidents pour tenantId:", tenantId)
      const res = await fetch(`/api/incidents/tenant?tenantId=${tenantId}`, {
        cache: "no-store",
        next: { revalidate: 0 },
        headers: { "Cache-Control": "no-store" },
      })
      const data = await res.json()
      console.log("🔍 [TENANT INCIDENTS PAGE] Réponse API:", data)

      if (data.success) {
        const incidentsData = data.incidents || []
        setIncidents(incidentsData)
        setFilteredIncidents(incidentsData)

        const uniqueProperties = Array.from(
          new Set(incidentsData.map((inc) => inc.property?.id))
        ).map(id => incidentsData.find((inc) => inc.property?.id === id)?.property)
        setProperties(uniqueProperties.filter(Boolean))
      } else {
        console.error("❌ [TENANT INCIDENTS PAGE] Erreur API:", data.error)
        toast.error("Erreur lors du chargement des incidents")
      }
    } catch (error) {
      console.error("❌ [TENANT INCIDENTS PAGE] Erreur chargement:", error)
      toast.error("Erreur lors du chargement des incidents")
    }
  }

 // Rafraîchir à la visibilité (quand on revient sur la page)
 useEffect(() => {
  const handleVis = async () => {
    if (document.visibilityState === "visible" && currentUser) {
      await loadIncidents(currentUser.id)
    }
  }
  document.addEventListener("visibilitychange", handleVis)
  return () => document.removeEventListener("visibilitychange", handleVis)
}, [currentUser]) 

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200"
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "reported":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "closed":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "resolved":
        return "Résolu"
      case "in_progress":
        return "En cours"
      case "reported":
        return "Signalé"
      case "closed":
        return "Fermé"
      default:
        return status
    }
  }

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityLabel = (priority: string | null) => {
    switch (priority) {
      case "urgent":
        return "Urgent"
      case "high":
        return "Élevé"
      case "medium":
        return "Moyen"
      case "low":
        return "Faible"
      default:
        return priority || "Non définie"
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

  const getPriorityIcon = (priority: string | null) => {
    switch (priority) {
      case "urgent":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case "high":
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      case "medium":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "low":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const applyFilters = () => {
    let filtered = [...incidents]

    if (filters.search) {
      filtered = filtered.filter(
        (incident) =>
          incident.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          incident.description.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    if (filters.status !== "all") {
      filtered = filtered.filter((incident) => incident.status === filters.status)
    }

    if (filters.category !== "all") {
      filtered = filtered.filter((incident) => incident.category === filters.category)
    }

    if (filters.priority !== "all") {
      filtered = filtered.filter((incident) => incident.priority === filters.priority)
    }

    if (filters.property !== "all") {
      filtered = filtered.filter((incident) => incident.property?.id === filters.property)
    }

    setFilteredIncidents(filtered)
  }

  useEffect(() => {
    applyFilters()
  }, [filters, incidents])

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mes incidents</h1>
          <p className="text-gray-600">Suivez l'état de vos signalements</p>
        </div>
        <Link href="/tenant/incidents/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Signaler un incident
          </Button>
        </Link>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Statut</label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="reported">Signalé</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="resolved">Résolu</SelectItem>
                  <SelectItem value="closed">Fermé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Catégorie</label>
              <Select
                value={filters.category}
                onValueChange={(value) => setFilters({ ...filters, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
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
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Priorité</label>
              <Select
                value={filters.priority}
                onValueChange={(value) => setFilters({ ...filters, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
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

            <div>
              <label className="text-sm font-medium mb-2 block">Logement</label>
              <Select
                value={filters.property}
                onValueChange={(value) => setFilters({ ...filters, property: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les logements</SelectItem>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total</p>
                <p className="text-2xl font-bold">{incidents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">En cours</p>
                <p className="text-2xl font-bold">
                  {incidents.filter((i) => i.status === "in_progress").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Résolus</p>
                <p className="text-2xl font-bold">
                  {incidents.filter((i) => i.status === "resolved").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium">Urgents</p>
                <p className="text-2xl font-bold">
                  {incidents.filter((i) => i.priority === "urgent").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des incidents */}
      {filteredIncidents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {incidents.length === 0 ? "Aucun incident signalé" : "Aucun incident trouvé"}
            </h3>
            <p className="text-gray-600 mb-4">
              {incidents.length === 0
                ? "Vous n'avez pas encore signalé d'incident."
                : "Aucun incident ne correspond à vos critères de recherche."}
            </p>
            {incidents.length === 0 && (
              <Link href="/tenant/incidents/new">
                <Button>Signaler un incident</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredIncidents.map((incident) => (
            <Card key={incident.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold">{incident.title}</h3>
                      <div className="flex items-center space-x-2">
                        {incident.priority && (
                          <Badge className={getPriorityColor(incident.priority)}>
                            {getPriorityLabel(incident.priority)}
                          </Badge>
                        )}
                        <Badge className={getStatusColor(incident.status)}>
                          {getStatusLabel(incident.status)}
                        </Badge>
                        <Badge variant="outline">{getCategoryLabel(incident.category)}</Badge>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-3 line-clamp-2">{incident.description}</p>

                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Building className="h-4 w-4" />
                        <span>{incident.property?.title}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Signalé le {new Date(incident.created_at).toLocaleDateString("fr-FR")}</span>
                      </div>
                      {incident.responses && incident.responses.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="h-4 w-4" />
                          <span>{incident.responses.length} échange(s)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Link href={`/tenant/incidents/${incident.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Voir
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
