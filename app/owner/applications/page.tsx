"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { authService } from "@/lib/auth-service"
import { applicationService } from "@/lib/application-service"
import { toast } from "sonner"
import { Users, Search, Check, X, SortAsc, SortDesc } from "lucide-react"
import { ModernApplicationCard } from "@/components/modern-application-card"

export default function ApplicationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<any[]>([])
  const [filteredApplications, setFilteredApplications] = useState<any[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [selectedApplications, setSelectedApplications] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<"date" | "score" | "name">("score")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [filters, setFilters] = useState({
    status: "all",
    property: "all",
    search: "",
    scoreRange: "all",
    hasGuarantor: "all",
  })

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  useEffect(() => {
    applyFiltersAndSort()
  }, [applications, filters, sortBy, sortOrder])

  const checkAuthAndLoadData = async () => {
    try {
      const user = await authService.getCurrentUser()
      if (!user || user.user_type !== "owner") {
        router.push("/login")
        return
      }

      await loadApplications(user.id)
      await loadProperties(user.id)
    } catch (error) {
      console.error("Erreur auth:", error)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  const loadApplications = async (ownerId: string) => {
    try {
      const data = await applicationService.getOwnerApplications(ownerId)
      const applicationsWithScore = data.map((app) => ({
        ...app,
        match_score: applicationService.calculateMatchScore(app, app.property),
        documents_complete: Math.random() > 0.3, // Simulation
      }))
      setApplications(applicationsWithScore)
    } catch (error) {
      console.error("Erreur chargement candidatures:", error)
      toast.error("Erreur lors du chargement des candidatures")
    }
  }

  const loadProperties = async (ownerId: string) => {
    try {
      const response = await fetch(`/api/properties?owner_id=${ownerId}`)
      if (response.ok) {
        const data = await response.json()
        setProperties(data.properties || [])
      }
    } catch (error) {
      console.error("Erreur chargement propriétés:", error)
    }
  }

  const applyFiltersAndSort = () => {
    let filtered = [...applications]

    // Filtres
    if (filters.status !== "all") {
      filtered = filtered.filter((app) => app.status === filters.status)
    }

    if (filters.property !== "all") {
      filtered = filtered.filter((app) => app.property_id === filters.property)
    }

    if (filters.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter(
        (app) =>
          app.tenant?.first_name?.toLowerCase().includes(search) ||
          app.tenant?.last_name?.toLowerCase().includes(search) ||
          app.property?.title?.toLowerCase().includes(search) ||
          app.tenant?.email?.toLowerCase().includes(search) ||
          app.profession?.toLowerCase().includes(search),
      )
    }

    if (filters.scoreRange !== "all") {
      const [min, max] = filters.scoreRange.split("-").map(Number)
      filtered = filtered.filter((app) => {
        const score = app.match_score || 50
        return score >= min && (max ? score <= max : true)
      })
    }

    if (filters.hasGuarantor !== "all") {
      const hasGuarantor = filters.hasGuarantor === "yes"
      filtered = filtered.filter((app) => app.has_guarantor === hasGuarantor)
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
        case "score":
          aValue = a.match_score || 50
          bValue = b.match_score || 50
          break
        case "date":
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        case "name":
          aValue = `${a.tenant?.first_name || ""} ${a.tenant?.last_name || ""}`.toLowerCase()
          bValue = `${b.tenant?.first_name || ""} ${b.tenant?.last_name || ""}`.toLowerCase()
          break
        default:
          return 0
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredApplications(filtered)
  }

  const handleApplicationAction = async (applicationId: string, action: string) => {
    try {
      switch (action) {
        case "view_details":
          router.push(`/owner/applications/${applicationId}`)
          break
        case "analyze":
          router.push(`/owner/applications/${applicationId}?tab=analysis`)
          break
        case "accept":
          await applicationService.updateApplicationStatus(applicationId, "accepted")
          toast.success("Candidature acceptée")
          break
        case "refuse":
          await applicationService.updateApplicationStatus(applicationId, "rejected")
          toast.success("Candidature refusée")
          break
        case "contact":
          // Ouvrir modal de contact ou rediriger vers messagerie
          toast.info("Fonctionnalité de contact à venir")
          break
      }

      // Recharger les données
      const user = await authService.getCurrentUser()
      if (user) {
        await loadApplications(user.id)
      }
    } catch (error) {
      console.error("Erreur action:", error)
      toast.error("Erreur lors de l'action")
    }
  }

  const handleBulkAction = async (action: "approve" | "reject") => {
    if (selectedApplications.length === 0) {
      toast.error("Aucune candidature sélectionnée")
      return
    }

    try {
      const promises = selectedApplications.map((id) =>
        applicationService.updateApplicationStatus(id, action === "approve" ? "approved" : "rejected"),
      )

      await Promise.all(promises)
      toast.success(
        `${selectedApplications.length} candidature(s) ${action === "approve" ? "approuvée(s)" : "rejetée(s)"}`,
      )

      setSelectedApplications([])
      const user = await authService.getCurrentUser()
      if (user) {
        await loadApplications(user.id)
      }
    } catch (error) {
      console.error("Erreur action groupée:", error)
      toast.error("Erreur lors de l'action groupée")
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Candidatures</h1>
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-24 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  const pendingCount = applications.filter((a) => a.status === "pending").length
  const acceptedCount = applications.filter((a) => a.status === "accepted").length
  const rejectedCount = applications.filter((a) => a.status === "rejected").length

  return (
    <div className="space-y-6 p-6">
      {/* Header avec statistiques */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Candidatures</h1>
          <p className="text-muted-foreground">
            {applications.length} candidature{applications.length > 1 ? "s" : ""} au total
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>{pendingCount} nouvelles</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>{acceptedCount} acceptées</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>{rejectedCount} refusées</span>
            </div>
          </div>
        </div>
      </div>

      {/* Barre d'outils */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Filtres */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>

              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">Nouveau</SelectItem>
                  <SelectItem value="analyzing">En cours d'analyse</SelectItem>
                  <SelectItem value="visit_scheduled">Visite programmée</SelectItem>
                  <SelectItem value="accepted">Acceptée</SelectItem>
                  <SelectItem value="rejected">Refusée</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.scoreRange}
                onValueChange={(value) => setFilters({ ...filters, scoreRange: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous scores</SelectItem>
                  <SelectItem value="80-100">Excellent (80-100%)</SelectItem>
                  <SelectItem value="60-79">Bon (60-79%)</SelectItem>
                  <SelectItem value="40-59">Moyen (40-59%)</SelectItem>
                  <SelectItem value="0-39">Faible (0-39%)</SelectItem>
                </SelectContent>
              </Select>

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
            </div>

            {/* Tri */}
            <div className="flex items-center space-x-2">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="score">Score</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="name">Nom</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}>
                {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Actions groupées */}
          {selectedApplications.length > 0 && (
            <div className="flex items-center justify-between mt-4 p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium">{selectedApplications.length} candidature(s) sélectionnée(s)</span>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => handleBulkAction("approve")}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Accepter
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleBulkAction("reject")}>
                  <X className="h-4 w-4 mr-1" />
                  Refuser
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedApplications([])}>
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liste des candidatures */}
      <div className="space-y-3">
        {filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune candidature</h3>
              <p className="text-muted-foreground">
                {Object.values(filters).some((f) => f !== "all") || filters.search
                  ? "Aucune candidature ne correspond à vos filtres"
                  : "Vous n'avez pas encore reçu de candidatures"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>{filteredApplications.length} résultat(s)</span>
            </div>

            {filteredApplications.map((application) => (
              <ModernApplicationCard
                key={application.id}
                application={application}
                isSelected={selectedApplications.includes(application.id)}
                onSelect={(selected) => {
                  if (selected) {
                    setSelectedApplications([...selectedApplications, application.id])
                  } else {
                    setSelectedApplications(selectedApplications.filter((id) => id !== application.id))
                  }
                }}
                onAction={(action) => handleApplicationAction(application.id, action)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}

