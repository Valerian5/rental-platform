"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { authService } from "@/lib/auth-service"
import { applicationService } from "@/lib/application-service"
import { toast } from "sonner"
import {
  Users,
  Search,
  Check,
  X,
  Clock,
  Euro,
  SortAsc,
  SortDesc,
  Grid,
  List,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
} from "lucide-react"
import { MatchingScore } from "@/components/matching-score"
import { ApplicationActions } from "@/components/application-actions"

export default function ApplicationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<any[]>([])
  const [filteredApplications, setFilteredApplications] = useState<any[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [selectedApplications, setSelectedApplications] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [sortBy, setSortBy] = useState<"date" | "score" | "name">("score")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    status: "all",
    property: "all",
    search: "",
    dateRange: "all",
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

    if (filters.dateRange !== "all") {
      const now = new Date()
      const days = filters.dateRange === "week" ? 7 : filters.dateRange === "month" ? 30 : 90
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      filtered = filtered.filter((app) => new Date(app.created_at) >= cutoff)
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

  const handleStatusChange = async (applicationId: string, newStatus: "approved" | "rejected") => {
    try {
      await applicationService.updateApplicationStatus(applicationId, newStatus)
      toast.success(`Candidature ${newStatus === "approved" ? "approuvée" : "rejetée"}`)

      const user = await authService.getCurrentUser()
      if (user) {
        await loadApplications(user.id)
      }
    } catch (error) {
      console.error("Erreur mise à jour statut:", error)
      toast.error("Erreur lors de la mise à jour")
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreProgressColor = (score: number) => {
    if (score >= 80) return "#10b981"
    if (score >= 60) return "#f59e0b"
    return "#ef4444"
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        )
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approuvée
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejetée
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const CompactApplicationCard = ({ application }: { application: any }) => {
    const score = application.match_score || 50
    const isExpanded = expandedCard === application.id
    const isSelected = selectedApplications.includes(application.id)

    const getScoreColor = (score: number) => {
      if (score >= 80) return "#10b981" // green
      if (score >= 60) return "#f59e0b" // yellow
      return "#ef4444" // red
    }

    const getStatusConfig = (status: string) => {
      switch (status) {
        case "pending":
          return { color: "bg-yellow-500", label: "En attente", textColor: "text-yellow-700" }
        case "visit_proposed":
          return { color: "bg-blue-500", label: "Visite proposée", textColor: "text-blue-700" }
        case "visit_scheduled":
          return { color: "bg-purple-500", label: "Visite programmée", textColor: "text-purple-700" }
        case "approved":
          return { color: "bg-green-500", label: "Approuvée", textColor: "text-green-700" }
        case "rejected":
          return { color: "bg-red-500", label: "Rejetée", textColor: "text-red-700" }
        default:
          return { color: "bg-gray-500", label: status, textColor: "text-gray-700" }
      }
    }

    const statusConfig = getStatusConfig(application.status)

    return (
      <Card
        className={`transition-all duration-200 ${isSelected ? "ring-2 ring-blue-500" : ""} ${isExpanded ? "shadow-lg" : "hover:shadow-md"}`}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Checkbox et Avatar */}
            <div className="flex items-center gap-3">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedApplications([...selectedApplications, application.id])
                  } else {
                    setSelectedApplications(selectedApplications.filter((id) => id !== application.id))
                  }
                }}
              />

              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold">
                  {application.tenant?.first_name?.[0] || "?"}
                  {application.tenant?.last_name?.[0] || "?"}
                </span>
              </div>
            </div>

            {/* Informations principales */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-semibold text-lg truncate">
                  {application.tenant?.first_name || "Prénom"} {application.tenant?.last_name || "Nom"}
                </h3>
                <div className={`w-2 h-2 rounded-full ${statusConfig.color}`}></div>
                <span className={`text-sm font-medium ${statusConfig.textColor}`}>{statusConfig.label}</span>
              </div>

              <p className="text-sm text-muted-foreground truncate mb-2">
                {application.property?.title || "Propriété"} • {application.profession || "Profession non renseignée"}
              </p>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {application.income && (
                  <span className="flex items-center">
                    <Euro className="h-3 w-3 mr-1" />
                    {application.income.toLocaleString()}€/mois
                  </span>
                )}
                {application.has_guarantor && <span className="text-green-600 font-medium">Avec garant</span>}
                <span>{new Date(application.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Score circulaire */}
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="2"
                  />
                  <path
                    d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={getScoreColor(score)}
                    strokeWidth="2"
                    strokeDasharray={`${score}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold" style={{ color: getScoreColor(score) }}>
                    {score}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <ApplicationActions
                  application={application}
                  onStatusUpdate={(newStatus) => {
                    setApplications((prev) =>
                      prev.map((app) => (app.id === application.id ? { ...app, status: newStatus } : app)),
                    )
                  }}
                />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedCard(isExpanded ? null : application.id)}
                  className="text-xs"
                >
                  {isExpanded ? "Réduire" : "Détails"}
                </Button>
              </div>
            </div>
          </div>

          {/* Section détails expandable */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2 text-gray-900">Contact</h4>
                  <div className="space-y-1">
                    <p className="text-muted-foreground flex items-center">
                      <Mail className="h-3 w-3 mr-2" />
                      {application.tenant?.email}
                    </p>
                    {application.tenant?.phone && (
                      <p className="text-muted-foreground flex items-center">
                        <Phone className="h-3 w-3 mr-2" />
                        {application.tenant.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2 text-gray-900">Propriété</h4>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">{application.property?.address}</p>
                    <p className="text-muted-foreground font-medium">
                      {application.property?.price?.toLocaleString()}€/mois
                    </p>
                  </div>
                </div>
              </div>

              {application.message && (
                <div>
                  <h4 className="font-medium mb-2 text-gray-900">Message du candidat</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">{application.message}</p>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <MatchingScore application={application} size="lg" detailed={true} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
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
        <div className="grid gap-2">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const pendingCount = applications.filter((a) => a.status === "pending").length
  const approvedCount = applications.filter((a) => a.status === "approved").length
  const rejectedCount = applications.filter((a) => a.status === "rejected").length
  const avgScore =
    applications.length > 0
      ? Math.round(applications.reduce((sum, app) => sum + (app.match_score || 50), 0) / applications.length)
      : 0

  const handleProposeVisit = async (applicationId: string, slots: any[]) => {
    try {
      const response = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "propose_slots",
          application_id: applicationId,
          slots: slots,
        }),
      })

      if (response.ok) {
        await applicationService.updateApplicationStatus(applicationId, "visit_proposed")
        toast.success("Proposition de visite envoyée")

        const user = await authService.getCurrentUser()
        if (user) {
          await loadApplications(user.id)
        }
      } else {
        throw new Error("Erreur lors de l'envoi")
      }
    } catch (error) {
      console.error("Erreur proposition visite:", error)
      toast.error("Erreur lors de l'envoi de la proposition")
    }
  }

  const handleSelectCandidate = async (applicationId: string) => {
    try {
      // Sélectionner le candidat
      await applicationService.updateApplicationStatus(applicationId, "selected")

      // Rejeter tous les autres candidats pour cette propriété
      const application = applications.find((app) => app.id === applicationId)
      if (application) {
        const otherApplications = applications.filter(
          (app) => app.property_id === application.property_id && app.id !== applicationId && app.status !== "rejected",
        )

        await Promise.all(
          otherApplications.map((app) =>
            applicationService.updateApplicationStatus(app.id, "rejected", "Un autre candidat a été sélectionné"),
          ),
        )
      }

      const user = await authService.getCurrentUser()
      if (user) {
        await loadApplications(user.id)
      }
    } catch (error) {
      console.error("Erreur sélection candidat:", error)
      toast.error("Erreur lors de la sélection")
    }
  }

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
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>{pendingCount} en attente</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>{approvedCount} approuvées</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>{rejectedCount} rejetées</span>
            </div>
          </div>
        </div>
      </div>

      {/* Barre d'outils */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Filtres */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="approved">Approuvées</SelectItem>
                  <SelectItem value="rejected">Rejetées</SelectItem>
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
                  <SelectItem value="80-100">Excellent (80-100)</SelectItem>
                  <SelectItem value="60-79">Bon (60-79)</SelectItem>
                  <SelectItem value="40-59">Moyen (40-59)</SelectItem>
                  <SelectItem value="0-39">Faible (0-39)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.property} onValueChange={(value) => setFilters({ ...filters, property: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Propriété" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.hasGuarantor}
                onValueChange={(value) => setFilters({ ...filters, hasGuarantor: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Garant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="yes">Avec garant</SelectItem>
                  <SelectItem value="no">Sans garant</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.dateRange} onValueChange={(value) => setFilters({ ...filters, dateRange: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                  <SelectItem value="quarter">Ce trimestre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tri et actions */}
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

              <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}>
                {viewMode === "list" ? <Grid className="h-4 w-4" /> : <List className="h-4 w-4" />}
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
                  variant="outline"
                  onClick={() => handleBulkAction("approve")}
                  className="text-green-600 border-green-600"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approuver
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction("reject")}
                  className="text-red-600 border-red-600"
                >
                  <X className="h-4 w-4 mr-1" />
                  Rejeter
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
      <div className="space-y-2">
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
              <span>Score moyen: {avgScore}/100</span>
            </div>

            {filteredApplications.map((application) => (
              <CompactApplicationCard key={application.id} application={application} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
