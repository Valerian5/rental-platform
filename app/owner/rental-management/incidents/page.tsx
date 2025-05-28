"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AlertTriangle, Plus, Search, Clock, CheckCircle, AlertCircle, Eye } from "lucide-react"
import { authService } from "@/lib/auth-service"
import { rentalManagementService } from "@/lib/rental-management-service"
import { toast } from "sonner"

export default function IncidentsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [leases, setLeases] = useState<any[]>([])
  const [incidents, setIncidents] = useState<any[]>([])
  const [filteredIncidents, setFilteredIncidents] = useState<any[]>([])
  const [selectedIncident, setSelectedIncident] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    category: "all",
    property: "all",
    search: "",
  })

  // Formulaire nouvel incident
  const [newIncident, setNewIncident] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium",
    property_id: "",
    lease_id: "",
  })

  // Formulaire résolution
  const [resolution, setResolution] = useState({
    status: "",
    notes: "",
    cost: "",
  })

  useEffect(() => {
    const initializeData = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "owner") return

        setCurrentUser(user)
        const leasesData = await rentalManagementService.getOwnerLeases(user.id)
        setLeases(leasesData)

        // Charger tous les incidents de toutes les propriétés
        const allIncidents = []
        for (const lease of leasesData) {
          const propertyIncidents = await rentalManagementService.getPropertyIncidents(lease.property.id)
          allIncidents.push(...propertyIncidents)
        }
        setIncidents(allIncidents)
      } catch (error) {
        console.error("Erreur initialisation:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [incidents, filters])

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

    if (filters.property !== "all") {
      filtered = filtered.filter((incident) => incident.property_id === filters.property)
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

  const handleCreateIncident = async () => {
    if (!newIncident.title || !newIncident.description || !newIncident.category || !newIncident.property_id) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }

    try {
      const selectedLease = leases.find((lease) => lease.property.id === newIncident.property_id)
      if (!selectedLease) {
        toast.error("Bail non trouvé pour cette propriété")
        return
      }

      await rentalManagementService.reportIncident({
        ...newIncident,
        lease_id: selectedLease.id,
        reported_by: currentUser.id,
      })

      toast.success("Incident signalé avec succès")
      setNewIncident({
        title: "",
        description: "",
        category: "",
        priority: "medium",
        property_id: "",
        lease_id: "",
      })

      // Recharger les incidents
      const allIncidents = []
      for (const lease of leases) {
        const propertyIncidents = await rentalManagementService.getPropertyIncidents(lease.property.id)
        allIncidents.push(...propertyIncidents)
      }
      setIncidents(allIncidents)
    } catch (error) {
      toast.error("Erreur lors du signalement")
    }
  }

  const handleUpdateIncidentStatus = async (incidentId: string) => {
    if (!resolution.status) {
      toast.error("Veuillez sélectionner un statut")
      return
    }

    try {
      await rentalManagementService.updateIncidentStatus(
        incidentId,
        resolution.status,
        resolution.notes,
        resolution.cost ? Number(resolution.cost) : undefined,
      )

      toast.success("Incident mis à jour avec succès")
      setSelectedIncident(null)
      setResolution({ status: "", notes: "", cost: "" })

      // Recharger les incidents
      const allIncidents = []
      for (const lease of leases) {
        const propertyIncidents = await rentalManagementService.getPropertyIncidents(lease.property.id)
        allIncidents.push(...propertyIncidents)
      }
      setIncidents(allIncidents)
    } catch (error) {
      toast.error("Erreur lors de la mise à jour")
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Incidents</h1>
          <p className="text-gray-600">Suivez et résolvez les problèmes signalés</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Signaler un incident
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Signaler un nouvel incident</DialogTitle>
              <DialogDescription>Créez un signalement pour un problème dans une de vos propriétés</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="incident-property">Propriété *</Label>
                  <Select
                    value={newIncident.property_id}
                    onValueChange={(value) => setNewIncident((prev) => ({ ...prev, property_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une propriété" />
                    </SelectTrigger>
                    <SelectContent>
                      {leases.map((lease) => (
                        <SelectItem key={lease.property.id} value={lease.property.id}>
                          {lease.property.title} - {lease.tenant.first_name} {lease.tenant.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="incident-category">Catégorie *</Label>
                  <Select
                    value={newIncident.category}
                    onValueChange={(value) => setNewIncident((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plumbing">Plomberie</SelectItem>
                      <SelectItem value="electrical">Électricité</SelectItem>
                      <SelectItem value="heating">Chauffage</SelectItem>
                      <SelectItem value="security">Sécurité</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="incident-title">Titre *</Label>
                <Input
                  id="incident-title"
                  value={newIncident.title}
                  onChange={(e) => setNewIncident((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Fuite d'eau salle de bain"
                />
              </div>

              <div>
                <Label htmlFor="incident-description">Description *</Label>
                <Textarea
                  id="incident-description"
                  value={newIncident.description}
                  onChange={(e) => setNewIncident((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Décrivez le problème en détail..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="incident-priority">Priorité</Label>
                <Select
                  value={newIncident.priority}
                  onValueChange={(value) => setNewIncident((prev) => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Faible</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="high">Élevée</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline">Annuler</Button>
                <Button onClick={handleCreateIncident}>Signaler l'incident</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Signalés</p>
                <p className="text-3xl font-bold text-orange-600">{stats.reported}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En cours</p>
                <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Résolus</p>
                <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Urgents</p>
                <p className="text-3xl font-bold text-red-600">{stats.urgent}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Rechercher</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Rechercher dans les incidents..."
                  value={filters.search}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Statut</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="reported">Signalé</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="resolved">Résolu</SelectItem>
                  <SelectItem value="closed">Fermé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priorité</Label>
              <Select
                value={filters.priority}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, priority: value }))}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">Élevé</SelectItem>
                  <SelectItem value="medium">Moyen</SelectItem>
                  <SelectItem value="low">Faible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Catégorie</Label>
              <Select
                value={filters.category}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="plumbing">Plomberie</SelectItem>
                  <SelectItem value="electrical">Électricité</SelectItem>
                  <SelectItem value="heating">Chauffage</SelectItem>
                  <SelectItem value="security">Sécurité</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des incidents */}
      <Card>
        <CardHeader>
          <CardTitle>Incidents signalés</CardTitle>
          <CardDescription>Gérez tous les incidents de vos propriétés</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredIncidents.length > 0 ? (
              filteredIncidents.map((incident) => (
                <div key={incident.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getPriorityIcon(incident.priority)}
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{incident.title}</h3>
                          {getPriorityBadge(incident.priority)}
                        </div>
                        <p className="text-sm text-gray-600">{incident.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Catégorie: {incident.category}</span>
                          <span>Signalé le {new Date(incident.created_at).toLocaleDateString("fr-FR")}</span>
                          {incident.cost && <span>Coût: {incident.cost}€</span>}
                        </div>
                        {incident.resolution_notes && (
                          <div className="mt-2 p-3 bg-green-50 rounded-lg">
                            <p className="text-sm text-green-800">
                              <strong>Résolution:</strong> {incident.resolution_notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(incident.status)}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => setSelectedIncident(incident)}>
                            <Eye className="h-4 w-4 mr-1" />
                            Gérer
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Gestion de l'incident</DialogTitle>
                            <DialogDescription>{selectedIncident?.title}</DialogDescription>
                          </DialogHeader>
                          {selectedIncident && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Statut actuel</Label>
                                  <div className="mt-1">{getStatusBadge(selectedIncident.status)}</div>
                                </div>
                                <div>
                                  <Label>Priorité</Label>
                                  <div className="mt-1">{getPriorityBadge(selectedIncident.priority)}</div>
                                </div>
                              </div>

                              <div>
                                <Label>Description</Label>
                                <p className="text-sm text-gray-600 mt-1">{selectedIncident.description}</p>
                              </div>

                              <div>
                                <Label htmlFor="resolution-status">Nouveau statut</Label>
                                <Select
                                  value={resolution.status}
                                  onValueChange={(value) => setResolution((prev) => ({ ...prev, status: value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Changer le statut" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="in_progress">En cours</SelectItem>
                                    <SelectItem value="resolved">Résolu</SelectItem>
                                    <SelectItem value="closed">Fermé</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label htmlFor="resolution-notes">Notes de résolution</Label>
                                <Textarea
                                  id="resolution-notes"
                                  value={resolution.notes}
                                  onChange={(e) => setResolution((prev) => ({ ...prev, notes: e.target.value }))}
                                  placeholder="Décrivez les actions entreprises..."
                                  rows={3}
                                />
                              </div>

                              <div>
                                <Label htmlFor="resolution-cost">Coût de l'intervention (€)</Label>
                                <Input
                                  id="resolution-cost"
                                  type="number"
                                  value={resolution.cost}
                                  onChange={(e) => setResolution((prev) => ({ ...prev, cost: e.target.value }))}
                                  placeholder="0"
                                />
                              </div>

                              <div className="flex justify-end space-x-2">
                                <Button variant="outline">Annuler</Button>
                                <Button onClick={() => handleUpdateIncidentStatus(selectedIncident.id)}>
                                  Mettre à jour
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Aucun incident trouvé</p>
                <p className="text-sm">Les incidents signalés apparaîtront ici</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
