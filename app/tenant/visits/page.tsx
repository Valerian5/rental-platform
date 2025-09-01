"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { authService } from "@/lib/auth-service"
import { visitService } from "@/lib/visit-service"
import { toast } from "sonner"
import { CalendarIcon, Clock, CheckCircle, XCircle, Filter, Search, MapPin, User } from "lucide-react"
import { TenantVisitFeedback } from "@/components/tenant-visit-feedback"

export default function VisitsPage() {
  const [visits, setVisits] = useState<any[]>([])
  const [filteredVisits, setFilteredVisits] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("�� Chargement des visites locataire...")
        setIsLoading(true)

        const user = await authService.getCurrentUser()
        console.log("🔐 Utilisateur récupéré:", user)
        
        if (!user) {
          console.log("❌ Aucun utilisateur connecté")
          toast.error("Vous devez être connecté pour voir vos visites")
          return
        }

        if (user.user_type !== "tenant") {
          console.log("❌ Mauvais type d'utilisateur:", user.user_type)
          toast.error("Accès réservé aux locataires")
          return
        }

        setCurrentUser(user)
        console.log("�� Utilisateur locataire:", user.id)

        // Récupérer les visites du locataire
        const visitsData = await visitService.getTenantVisits(user.id)
        console.log("�� Visites récupérées:", visitsData.length)
        setVisits(visitsData)
        setFilteredVisits(visitsData)
      } catch (error) {
        console.error("❌ Erreur chargement visites:", error)
        toast.error("Erreur lors du chargement des visites")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filtrage des visites
  useEffect(() => {
    let filtered = visits

    // Filtre par recherche
    if (searchQuery) {
      filtered = filtered.filter(
        (visit) =>
          visit.property?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          visit.property?.address?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Filtre par statut
    if (statusFilter !== "all") {
      filtered = filtered.filter((visit) => visit.status === statusFilter)
    }

    setFilteredVisits(filtered)
  }, [visits, searchQuery, statusFilter])

  const handleVisitUpdate = async (visitId: string, updates: any) => {
    try {
      // Mettre à jour la visite via le service
      await visitService.updateVisitStatus(visitId, updates.status || updates.tenant_interest)
      
      // Mettre à jour localement
      setVisits(prevVisits => 
        prevVisits.map(visit => 
          visit.id === visitId ? { ...visit, ...updates } : visit
        )
      )
      setFilteredVisits(prevVisits => 
        prevVisits.map(visit => 
          visit.id === visitId ? { ...visit, ...updates } : visit
        )
      )
      
      toast.success("Visite mise à jour avec succès")
    } catch (error) {
      console.error("Erreur mise à jour visite:", error)
      toast.error("Erreur lors de la mise à jour")
    }
  }

  const stats = {
    total: visits.length,
    upcoming: visits.filter((v) => {
      const visitDate = new Date(v.visit_date)
      return visitDate > new Date() && ["scheduled", "confirmed", "proposed"].includes(v.status)
    }).length,
    completed: visits.filter((v) => v.status === "completed").length,
    interested: visits.filter((v) => v.tenant_interest === "interested").length,
    not_interested: visits.filter((v) => v.tenant_interest === "not_interested").length,
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Chargement de vos visites...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <p className="text-red-600">Vous devez être connecté pour voir vos visites</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Mes visites</h1>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">À venir</p>
                <p className="text-2xl font-bold text-blue-600">{stats.upcoming}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Terminées</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Intéressé</p>
                <p className="text-2xl font-bold text-green-600">{stats.interested}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pas intéressé</p>
                <p className="text-2xl font-bold text-red-600">{stats.not_interested}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Input
                placeholder="Rechercher une propriété..."
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
                <SelectItem value="proposed">Proposées</SelectItem>
                <SelectItem value="confirmed">Confirmées</SelectItem>
                <SelectItem value="scheduled">Programmées</SelectItem>
                <SelectItem value="completed">Terminées</SelectItem>
                <SelectItem value="interested">Intéressé</SelectItem>
                <SelectItem value="not_interested">Pas intéressé</SelectItem>
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

      {/* Liste des visites */}
      <div className="space-y-4">
        {filteredVisits.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Aucune visite</h3>
              <p className="text-muted-foreground">
                {visits.length === 0
                  ? "Aucune visite programmée pour le moment"
                  : "Aucune visite ne correspond aux filtres sélectionnés"}
              </p>
            </Card>
          </Card>
        ) : (
          filteredVisits.map((visit) => (
            <Card key={visit.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-1/3 h-48 md:h-auto">
                    <img
                      src={visit.property?.property_images?.[0]?.url || "/placeholder.svg?height=200&width=300"}
                      alt={visit.property?.title || "Propriété"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-xl font-semibold">{visit.property?.title || "Propriété"}</h2>
                        <div className="flex items-center text-muted-foreground mt-1">
                          <MapPin className="h-4 w-4 mr-1" />
                          {visit.property?.address || "Adresse non disponible"}
                        </div>
                      </div>
                      <Badge variant={getStatusBadgeVariant(visit.status)}>{getStatusText(visit.status)}</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-start">
                        <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
                        <div>
                          <p className="font-medium">
                            {formatDateTime(visit.visit_date, visit.start_time || visit.visit_time).date}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDateTime(visit.visit_date, visit.start_time || visit.visit_time).time}
                          </p>
                        </div>
                      </div>
                      {visit.property?.owner && (
                        <div className="flex items-start">
                          <User className="h-5 w-5 mr-2 text-blue-600" />
                          <div>
                            <p className="font-medium">
                              {visit.property.owner.first_name} {visit.property.owner.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {visit.property.owner.phone || visit.property.owner.email}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {visit.notes && (
                      <div className="bg-gray-50 p-3 rounded-md mb-4">
                        <p className="text-sm">{visit.notes}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 justify-end">
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/properties/${visit.property_id}`}>Voir l'annonce</a>
                      </Button>

                      {visit.status === "proposed" && (
                        <>
                          <Button size="sm" onClick={() => handleConfirmVisit(visit.id)}>
                            Confirmer la visite
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleCancelVisit(visit.id)}>
                            Refuser
                          </Button>
                        </>
                      )}

                      {visit.status === "confirmed" && (
                        <Button size="sm" variant="destructive" onClick={() => handleCancelVisit(visit.id)}>
                          Annuler la visite
                        </Button>
                      )}

                      {/* Affichage de l'intérêt si déjà défini */}
                      {visit.tenant_interest && (
                        <Badge variant={visit.tenant_interest === "interested" ? "default" : "destructive"}>
                          {visit.tenant_interest === "interested" ? "Intéressé" : "Pas intéressé"}
                        </Badge>
                      )}
                    </div>

                    {/* Composant de feedback locataire pour les visites terminées */}
                    <TenantVisitFeedback
                      visit={visit}
                      onFeedbackSubmit={handleVisitUpdate}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )

  // Fonctions utilitaires
  function getStatusBadgeVariant(status: string) {
    switch (status) {
      case "proposed":
        return "secondary"
      case "confirmed":
      case "scheduled":
        return "default"
      case "completed":
        return "default"
      case "cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case "proposed":
        return "Proposée"
      case "confirmed":
        return "Confirmée"
      case "scheduled":
        return "Programmée"
      case "completed":
        return "Terminée"
      case "cancelled":
        return "Annulée"
      default:
        return status
    }
  }

  function formatDateTime(dateString: string, timeString?: string) {
    const date = new Date(dateString)
    const time = timeString || "00:00"

    return {
      date: date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
      time: time,
    }
  }

  async function handleConfirmVisit(visitId: string) {
    try {
      await visitService.updateVisitStatus(visitId, "confirmed")
      toast.success("Visite confirmée")
      
      // Recharger les visites
      const visitsData = await visitService.getTenantVisits(currentUser.id)
      setVisits(visitsData)
      setFilteredVisits(visitsData)
    } catch (error) {
      console.error("❌ Erreur confirmation visite:", error)
      toast.error("Erreur lors de la confirmation")
    }
  }

  async function handleCancelVisit(visitId: string) {
    try {
      await visitService.updateVisitStatus(visitId, "cancelled")
      toast.success("Visite annulée")
      
      // Recharger les visites
      const visitsData = await visitService.getTenantVisits(currentUser.id)
      setVisits(visitsData)
      setFilteredVisits(visitsData)
    } catch (error) {
      console.error("❌ Erreur annulation visite:", error)
      toast.error("Erreur lors de l'annulation")
    }
  }
}