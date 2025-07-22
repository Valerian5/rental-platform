"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertTriangle,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  MessageSquare,
  Calendar,
  User,
  Building,
} from "lucide-react"
import { authService } from "@/lib/auth-service"
import { rentalManagementService } from "@/lib/rental-management-service"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import Link from "next/link"

export default function IncidentsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [leases, setLeases] = useState<any[]>([])
  const [incidents, setIncidents] = useState<any[]>([])
  const [filteredIncidents, setFilteredIncidents] = useState<any[]>([])
  const [selectedIncident, setSelectedIncident] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showNewIncidentDialog, setShowNewIncidentDialog] = useState(false)
  const [showResponseDialog, setShowResponseDialog] = useState(false)
  const [showInterventionDialog, setShowInterventionDialog] = useState(false)

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
    category: "other",
    priority: "medium",
    property_id: "",
    lease_id: "",
  })

  // Formulaire réponse
  const [response, setResponse] = useState({
    message: "",
    status: "",
    cost: "",
  })

  // Formulaire intervention
  const [intervention, setIntervention] = useState({
    type: "owner", // owner ou professional
    scheduled_date: "",
    description: "",
    provider_name: "",
    provider_contact: "",
    estimated_cost: "",
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
          allIncidents.push(
            ...propertyIncidents.map((incident) => ({
              ...incident,
              property: lease.property,
              tenant: lease.tenant,
              lease_id: lease.id,
            })),
          )
        }
        setIncidents(allIncidents)
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
        category: "other",
        priority: "medium",
        property_id: "",
        lease_id: "",
      })
      setShowNewIncidentDialog(false)

      // Recharger les incidents
      window.location.reload()
    } catch (error) {
      toast.error("Erreur lors du signalement")
    }
  }

  const handleSendResponse = async () => {
    if (!response.message) {
      toast.error("Veuillez saisir un message")
      return
    }

    try {
      // Envoyer la réponse
      const responseData = {
        incident_id: selectedIncident.id,
        user_id: currentUser.id,
        message: response.message,
        user_type: "owner",
      }

      const res = await fetch(`/api/incidents/${selectedIncident.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(responseData),
      })

      if (!res.ok) throw new Error("Erreur envoi réponse")

      // Mettre à jour le statut si spécifié
      if (response.status) {
        await rentalManagementService.updateIncidentStatus(
          selectedIncident.id,
          response.status,
          response.message,
          response.cost ? Number(response.cost) : undefined,
        )
      }

      toast.success("Réponse envoyée avec succès")
      setResponse({ message: "", status: "", cost: "" })
      setShowResponseDialog(false)
      setSelectedIncident(null)

      // Recharger les incidents
      window.location.reload()
    } catch (error) {
      toast.error("Erreur lors de l'envoi de la réponse")
    }
  }

  const handleScheduleIntervention = async () => {
    if (!intervention.scheduled_date || !intervention.description) {
      toast.error("Veuillez remplir les champs obligatoires")
      return
    }

    try {
      const workData = {
        property_id: selectedIncident.property_id,
        lease_id: selectedIncident.lease_id,
        title: `Intervention - ${selectedIncident.title}`,
        description: intervention.description,
        type: "corrective",
        category: selectedIncident.category,
        scheduled_date: intervention.scheduled_date,
        cost: intervention.estimated_cost ? Number(intervention.estimated_cost) : 0,
        provider_name: intervention.type === "professional" ? intervention.provider_name : null,
        provider_contact: intervention.type === "professional" ? intervention.provider_contact : null,
      }

      await rentalManagementService.scheduleMaintenanceWork(workData)

      // Mettre à jour le statut de l'incident
      await rentalManagementService.updateIncidentStatus(
        selectedIncident.id,
        "in_progress",
        `Intervention programmée le ${new Date(intervention.scheduled_date).toLocaleDateString("fr-FR")}`,
      )

      toast.success("Intervention programmée avec succès")
      setIntervention({
        type: "owner",
        scheduled_date: "",
        description: "",
        provider_name: "",
        provider_contact: "",
        estimated_cost: "",
      })
      setShowInterventionDialog(false)
      setSelectedIncident(null)

      // Recharger les incidents
      window.location.reload()
    } catch (error) {
      toast.error("Erreur lors de la programmation")
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
      <PageHeader title="Gestion des Incidents" description="Gérez les incidents signalés par vos locataires">
        <Dialog open={showNewIncidentDialog} onOpenChange={setShowNewIncidentDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Signaler un incident
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nouveau signalement</DialogTitle>
              <DialogDescription>Signaler un incident sur une de vos propriétés</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Propriété *</label>
                <Select
                  value={newIncident.property_id}
                  onValueChange={(value) => setNewIncident({ ...newIncident, property_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une propriété" />
                  </SelectTrigger>
                  <SelectContent>
                    {leases.map((lease) => (
                      <SelectItem key={lease.property.id} value={lease.property.id}>
                        {lease.property.title} - {lease.property.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Titre *</label>
                <Input
                  value={newIncident.title}
                  onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                  placeholder="Titre de l'incident"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Catégorie *</label>
                <Select
                  value={newIncident.category}
                  onValueChange={(value) => setNewIncident({ ...newIncident, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
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
              <div>
                <label className="text-sm font-medium">Priorité</label>
                <Select
                  value={newIncident.priority}
                  onValueChange={(value) => setNewIncident({ ...newIncident, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Faible</SelectItem>
                    <SelectItem value="medium">Moyen</SelectItem>
                    <SelectItem value="high">Élevé</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Description *</label>
                <Textarea
                  value={newIncident.description}
                  onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                  placeholder="Description détaillée de l'incident"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateIncident} className="flex-1">
                  Signaler
                </Button>
                <Button variant="outline" onClick={() => setShowNewIncidentDialog(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
            <Select value={filters.property} onValueChange={(value) => setFilters({ ...filters, property: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Propriété" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes propriétés</SelectItem>
                {leases.map((lease) => (
                  <SelectItem key={lease.property.id} value={lease.property.id}>
                    {lease.property.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() =>
                setFilters({ status: "all", priority: "all", category: "all", property: "all", search: "" })
              }
            >
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des incidents */}
      <Card>
        <CardHeader>
          <CardTitle>Incidents ({filteredIncidents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredIncidents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aucun incident trouvé</p>
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
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {incident.tenant?.first_name} {incident.tenant?.last_name}
                        </div>
                        <span>{new Date(incident.created_at).toLocaleDateString("fr-FR")}</span>
                      </div>

                      <p className="text-gray-700 mb-3">{incident.description}</p>

                      {incident.photos && incident.photos.length > 0 && (
                        <div className="flex gap-2 mb-3">
                          {incident.photos.slice(0, 3).map((photo: string, index: number) => (
                            <img
                              key={index}
                              src={photo.startsWith("http") ? photo : `/api/documents/${photo}`}
                              alt={`Photo ${index + 1}`}
                              className="w-16 h-16 object-cover rounded border cursor-pointer hover:opacity-80"
                              onClick={() =>
                                window.open(photo.startsWith("http") ? photo : `/api/documents/${photo}`, "_blank")
                              }
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.svg?height=64&width=64&text=Image"
                              }}
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
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Link href={`/owner/rental-management/incidents/${incident.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                      </Link>

                      {incident.status !== "resolved" && incident.status !== "closed" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedIncident(incident)
                              setShowResponseDialog(true)
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Répondre
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedIncident(incident)
                              setShowInterventionDialog(true)
                            }}
                          >
                            <Calendar className="h-4 w-4 mr-1" />
                            Programmer
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Réponse */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Répondre à l'incident</DialogTitle>
            <DialogDescription>{selectedIncident?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Message *</label>
              <Textarea
                value={response.message}
                onChange={(e) => setResponse({ ...response, message: e.target.value })}
                placeholder="Votre réponse au locataire..."
                rows={4}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Changer le statut</label>
              <Select value={response.status} onValueChange={(value) => setResponse({ ...response, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Garder le statut actuel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="resolved">Résolu</SelectItem>
                  <SelectItem value="closed">Fermé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {response.status === "resolved" && (
              <div>
                <label className="text-sm font-medium">Coût (€)</label>
                <Input
                  type="number"
                  value={response.cost}
                  onChange={(e) => setResponse({ ...response, cost: e.target.value })}
                  placeholder="Coût de la réparation"
                />
              </div>
            )}
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSendResponse} className="flex-1">
                Envoyer
              </Button>
              <Button variant="outline" onClick={() => setShowResponseDialog(false)}>
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Intervention */}
      <Dialog open={showInterventionDialog} onOpenChange={setShowInterventionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Programmer une intervention</DialogTitle>
            <DialogDescription>{selectedIncident?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Type d'intervention *</label>
              <Select
                value={intervention.type}
                onValueChange={(value) => setIntervention({ ...intervention, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Par moi-même</SelectItem>
                  <SelectItem value="professional">Par un professionnel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {intervention.type === "professional" && (
              <>
                <div>
                  <label className="text-sm font-medium">Nom du prestataire</label>
                  <Input
                    value={intervention.provider_name}
                    onChange={(e) => setIntervention({ ...intervention, provider_name: e.target.value })}
                    placeholder="Nom de l'entreprise/artisan"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Contact</label>
                  <Input
                    value={intervention.provider_contact}
                    onChange={(e) => setIntervention({ ...intervention, provider_contact: e.target.value })}
                    placeholder="Téléphone ou email"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-sm font-medium">Date prévue *</label>
              <Input
                type="datetime-local"
                value={intervention.scheduled_date}
                onChange={(e) => setIntervention({ ...intervention, scheduled_date: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description *</label>
              <Textarea
                value={intervention.description}
                onChange={(e) => setIntervention({ ...intervention, description: e.target.value })}
                placeholder="Description de l'intervention prévue"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Coût estimé (€)</label>
              <Input
                type="number"
                value={intervention.estimated_cost}
                onChange={(e) => setIntervention({ ...intervention, estimated_cost: e.target.value })}
                placeholder="Coût estimé"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleScheduleIntervention} className="flex-1">
                <Calendar className="h-4 w-4 mr-2" />
                Programmer
              </Button>
              <Button variant="outline" onClick={() => setShowInterventionDialog(false)}>
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
