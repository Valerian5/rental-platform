"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, Plus, Clock, CheckCircle, AlertCircle, Eye, MessageSquare, Building } from "lucide-react"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import Link from "next/link"

export default function TenantIncidentsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [incidents, setIncidents] = useState<any[]>([])
  const [filteredIncidents, setFilteredIncidents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    category: "all",
    search: "",
  })

  useEffect(() => {
    const initializeData = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "tenant") return

        setCurrentUser(user)
        await loadIncidents(user.id)
      } catch (error) {
        console.error("Erreur initialisation:", error)
        toast.error("Erreur lors du chargement des données")
      } finally {
        setIsLoading(false)
      }
    }

    initializeData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [incidents, filters])

  const loadIncidents = async (userId: string) => {
    try {
      const res = await fetch(`/api/incidents/tenant/${userId}`)
      const data = await res.json()

      if (data.success) {
        setIncidents(data.incidents)
      } else {
        toast.error("Erreur lors du chargement des incidents")
      }
    } catch (error) {
      console.error("Erreur chargement incidents:", error)
      toast.error("Erreur lors du chargement")
    }
  }

  const applyFilters = () => {
    let filtered = incidents

    if (filters.status !== "all") {
      filtered = filtered.filter((incident) => incident.status === filters.status)
    }

    if (filters.priority !== "all") {
      filtered = filtered.filter((incident) => incident.priority === filters.priority)
    }

    if (filters.category !== "all") {
      filtered = filtered.filter((incident) => incident.category === filters.category)
    }

    if (filters.search) {
      filtered = filtered.filter(
        (incident) =>
          incident.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          incident.description.toLowerCase().includes(filters.search.toLowerCase()),
      )
    }

    setFilteredIncidents(filtered)
  }

  const getPriorityIcon = (priority: string) => {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return <Badge className="bg-green-600">Résolu</Badge>
      case '\
      case "resolved':
        return <Badge className="bg-green-600">Résolu</Badge>
      case "in_progress":
        return <Badge className="bg-orange-600">En cours</Badge>
      case "reported":
        return <Badge variant="secondary">Signalé</Badge>
      case "closed":
        return <Badge variant="outline">Fermé</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="destructive">Urgent</Badge>
      case "high":
        return <Badge className="bg-orange-600">Élevé</Badge>
      case "medium":
        return <Badge variant="secondary">Moyen</Badge>
      case "low":
        return <Badge variant="outline">Faible</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
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
    const reported = incidents.filter((i) => i.status === "reported").length
    const inProgress = incidents.filter((i) => i.status === "in_progress").length
    const resolved = incidents.filter((i) => i.status === "resolved").length
    const urgent = incidents.filter((i) => i.priority === "urgent").length

    return { reported, inProgress, resolved, urgent }
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
    <div className="space-y-6">
      <PageHeader title="Mes Incidents" description="Suivez vos signalements et échanges avec le propriétaire">
        <Link href="/tenant/incidents/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Signaler un incident
          </Button>
        </Link>
      </PageHeader>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Signalés</p>
                <p className="text-2xl font-bold text-orange-600">{stats.reported}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En cours</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Résolus</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Urgents</p>
                <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              placeholder="Rechercher..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
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
            <Select value={filters.priority} onValueChange={(value) => setFilters({ ...filters, priority: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes priorités</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">Élevé</SelectItem>
                <SelectItem value="medium">Moyen</SelectItem>
                <SelectItem value="low">Faible</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                <SelectItem value="plumbing">Plomberie</SelectItem>
                <SelectItem value="electrical">Électricité</SelectItem>
                <SelectItem value="heating">Chauffage</SelectItem>
                <SelectItem value="security">Sécurité</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setFilters({ status: "all", priority: "all", category: "all", search: "" })}
            >
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des incidents */}
      <Card>
        <CardHeader>
          <CardTitle>Mes incidents ({filteredIncidents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredIncidents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aucun incident trouvé</p>
              <Link href="/tenant/incidents/new">
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Signaler votre premier incident
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredIncidents.map((incident) => (
                <div key={incident.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getPriorityIcon(incident.priority)}
                        <h3 className="font-semibold">{incident.title}</h3>
                        {getStatusBadge(incident.status)}
                        {getPriorityBadge(incident.priority)}
                        <Badge variant="outline">{getCategoryLabel(incident.category)}</Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          {incident.property?.title}
                        </div>
                        <span>{new Date(incident.created_at).toLocaleDateString("fr-FR")}</span>
                      </div>

                      <p className="text-gray-700 mb-3">{incident.description}</p>

                      {incident.photos && incident.photos.length > 0 && (
                        <div className="flex gap-2 mb-3">
                          {incident.photos.slice(0, 3).map((photo: string, index: number) => (
                            <img
                              key={index}
                              src={photo || "/placeholder.svg"}
                              alt={`Photo ${index + 1}`}
                              className="w-16 h-16 object-cover rounded border"
                            />
                          ))}
                          {incident.photos.length > 3 && (
                            <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center text-sm text-gray-600">
                              +{incident.photos.length - 3}
                            </div>
                          )}
                        </div>
                      )}

                      {incident.resolution_notes && (
                        <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
                          <p className="text-sm text-green-800">
                            <strong>Résolution :</strong> {incident.resolution_notes}
                          </p>
                          {incident.cost && (
                            <p className="text-sm text-green-800 mt-1">
                              <strong>Coût :</strong> {incident.cost}€
                            </p>
                          )}
                        </div>
                      )}

                      {incident.responses && incident.responses.length > 0 && (
                        <div className="text-sm text-blue-600">
                          {incident.responses.length} réponse{incident.responses.length > 1 ? "s" : ""} du propriétaire
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Link href={`/tenant/incidents/${incident.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                      </Link>

                      {incident.status !== "resolved" && incident.status !== "closed" && (
                        <Link href={`/tenant/incidents/${incident.id}/respond`}>
                          <Button variant="outline" size="sm">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Répondre
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
