"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { authService } from "@/lib/auth-service"
import { PageHeader } from "@/components/page-header"
import { ModernApplicationCard } from "@/components/modern-application-card"
import { VisitProposalManager } from "@/components/visit-proposal-manager"
import { RefusalDialog } from "@/components/refusal-dialog"
import { scoringPreferencesService } from "@/lib/scoring-preferences-service"
import { applicationEnrichmentService } from "@/lib/application-enrichment-service"
import { Search, Filter, SortAsc, Settings, Users, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

export default function ApplicationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<any[]>([])
  const [filteredApplications, setFilteredApplications] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("date_desc")
  const [selectedApplications, setSelectedApplications] = useState<string[]>([])
  const [showVisitDialog, setShowVisitDialog] = useState(false)
  const [showRefuseDialog, setShowRefuseDialog] = useState(false)
  const [currentApplication, setCurrentApplication] = useState<any>(null)
  const [scoringPreferences, setScoringPreferences] = useState<any>(null)

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  useEffect(() => {
    filterAndSortApplications()
  }, [applications, searchTerm, statusFilter, sortBy])

  const checkAuthAndLoadData = async () => {
    try {
      setLoading(true)
      const currentUser = await authService.getCurrentUser()

      if (!currentUser) {
        toast.error("Vous devez être connecté pour accéder à cette page")
        router.push("/login")
        return
      }

      if (currentUser.user_type !== "owner") {
        toast.error("Accès réservé aux propriétaires")
        router.push("/")
        return
      }

      setUser(currentUser)
      await Promise.all([loadApplications(currentUser.id), loadScoringPreferences(currentUser.id)])
    } catch (error) {
      console.error("Erreur auth:", error)
      toast.error("Erreur d'authentification")
    } finally {
      setLoading(false)
    }
  }

  const loadRentalFile = async (tenantId: string) => {
    try {
      const rentalFileResponse = await fetch(`/api/rental-files?tenant_id=${tenantId}`)
      if (rentalFileResponse.ok) {
        const rentalFileData = await rentalFileResponse.json()
        return rentalFileData.rental_file
      }
    } catch (error) {
      console.error("Erreur chargement dossier location:", error)
    }
    return null
  }

  const loadApplications = async (ownerId: string) => {
    try {
      console.log("🔍 Chargement des candidatures pour le propriétaire:", ownerId)

      const response = await fetch(`/api/applications?owner_id=${ownerId}`)
      if (!response.ok) {
        toast.error("Erreur lors du chargement des candidatures")
        return
      }

      const data = await response.json()
      console.log("✅ Candidatures chargées:", data.applications?.length || 0)

      if (data.applications && data.applications.length > 0) {
        // Enrichir les candidatures avec les données des dossiers de location
        const enrichedApplications = await applicationEnrichmentService.enrichApplications(
          data.applications,
          loadRentalFile,
        )

        // Calculer les scores avec le service unifié
        const applicationsWithScores = await Promise.all(
          enrichedApplications.map(async (app) => {
            try {
              if (app.property?.owner_id && app.property?.price) {
                console.log(`🎯 Calcul score pour candidature ${app.id}`)

                const result = await scoringPreferencesService.calculateScore(
                  app,
                  app.property,
                  app.property.owner_id,
                  false, // Ne pas utiliser le cache pour avoir le score le plus récent
                )

                return {
                  ...app,
                  match_score: result.totalScore,
                  scoring_compatible: result.compatible,
                  scoring_breakdown: result.breakdown,
                  scoring_model_used: result.model_used,
                  scoring_recommendations: result.recommendations,
                  scoring_warnings: result.warnings,
                  scoring_exclusions: result.exclusions,
                }
              }
              return app
            } catch (error) {
              console.error("❌ Erreur calcul score pour candidature:", app.id, error)
              return {
                ...app,
                match_score: 50,
                scoring_compatible: false,
                scoring_breakdown: {},
                scoring_model_used: "Erreur",
              }
            }
          }),
        )

        setApplications(applicationsWithScores)
      } else {
        setApplications([])
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du chargement des candidatures")
      setApplications([])
    }
  }

  const loadScoringPreferences = async (ownerId: string) => {
    try {
      const preferences = await scoringPreferencesService.getOwnerPreferences(ownerId, false)
      setScoringPreferences(preferences)
      console.log("📋 Préférences de scoring chargées:", preferences.name)
    } catch (error) {
      console.error("Erreur chargement préférences scoring:", error)
    }
  }

  const filterAndSortApplications = () => {
    let filtered = [...applications]

    // Filtrage par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(
        (app) =>
          app.tenant?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.tenant?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.tenant?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.property?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.profession?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filtrage par statut
    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter)
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date_desc":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "date_asc":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "score_desc":
          return (b.match_score || 0) - (a.match_score || 0)
        case "score_asc":
          return (a.match_score || 0) - (b.match_score || 0)
        case "name_asc":
          return `${a.tenant?.first_name} ${a.tenant?.last_name}`.localeCompare(
            `${b.tenant?.first_name} ${b.tenant?.last_name}`,
          )
        case "name_desc":
          return `${b.tenant?.first_name} ${b.tenant?.last_name}`.localeCompare(
            `${a.tenant?.first_name} ${a.tenant?.last_name}`,
          )
        default:
          return 0
      }
    })

    setFilteredApplications(filtered)
  }

  const handleApplicationAction = async (applicationId: string, action: string) => {
    const application = applications.find((app) => app.id === applicationId)
    if (!application) return

    switch (action) {
      case "analyze":
        router.push(`/owner/applications/${applicationId}`)
        break
      case "propose_visit":
        setCurrentApplication(application)
        setShowVisitDialog(true)
        break
      case "accept":
        await updateApplicationStatus(applicationId, "accepted")
        break
      case "refuse":
        setCurrentApplication(application)
        setShowRefuseDialog(true)
        break
      case "contact":
        await handleContact(application)
        break
      case "generate_lease":
        router.push(`/owner/leases/new?application=${applicationId}`)
        break
      default:
        console.log("Action non gérée:", action)
    }
  }

  const updateApplicationStatus = async (applicationId: string, newStatus: string, notes?: string) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          notes: notes || undefined,
        }),
      })

      if (response.ok) {
        const statusMessages: { [key: string]: string } = {
          analyzing: "Candidature en cours d'analyse",
          accepted: "Candidature acceptée",
          rejected: "Candidature refusée",
          visit_proposed: "Visite proposée au candidat",
          visit_scheduled: "Visite planifiée",
          waiting_tenant_confirmation: "En attente de confirmation du locataire",
        }

        toast.success(statusMessages[newStatus] || "Statut mis à jour")

        // Recharger les candidatures
        if (user) {
          await loadApplications(user.id)
        }
      } else {
        toast.error("Erreur lors de la mise à jour du statut")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la mise à jour du statut")
    }
  }

  const handleContact = async (application: any) => {
    if (!application?.tenant_id || !application?.property_id) {
      toast.error("Impossible de contacter ce locataire")
      return
    }

    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenant_id: application.tenant_id,
          owner_id: user.id,
          property_id: application.property_id,
          subject: `Candidature pour ${application.property?.title || "le bien"}`,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/owner/messaging?conversation_id=${data.conversation.id}`)
      } else {
        router.push(`/owner/messaging?tenant_id=${application.tenant_id}`)
      }
    } catch (error) {
      console.error("Erreur création conversation:", error)
      router.push(`/owner/messaging?tenant_id=${application.tenant_id}`)
    }
  }

  const handleVisitProposed = async (slots: any[]) => {
    if (!currentApplication) return

    try {
      const response = await fetch(`/api/applications/${currentApplication.id}/propose-visit-slots`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slots }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        toast.error(errorData.message || "Erreur lors de la proposition de visite")
        return
      }

      const data = await response.json()
      toast.success(data.message || "Créneaux de visite proposés avec succès")
      setShowVisitDialog(false)
      setCurrentApplication(null)

      // Recharger les candidatures
      if (user) {
        await loadApplications(user.id)
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la proposition de visite")
    }
  }

  const handleRefuseConfirm = async (reason: string, type: string) => {
    if (!currentApplication) return

    let notes = ""
    const refusalReasons: { [key: string]: string } = {
      insufficient_income: "Revenus insuffisants",
      incomplete_file: "Dossier incomplet",
      missing_guarantor: "Absence de garant",
      unstable_situation: "Situation professionnelle instable",
      other: reason,
    }

    notes = refusalReasons[type] || reason

    await updateApplicationStatus(currentApplication.id, "rejected", notes)
    setShowRefuseDialog(false)
    setCurrentApplication(null)
  }

  const handleBulkAction = async (action: string) => {
    if (selectedApplications.length === 0) {
      toast.error("Aucune candidature sélectionnée")
      return
    }

    try {
      const promises = selectedApplications.map((id) =>
        updateApplicationStatus(id, action === "accept" ? "accepted" : "rejected"),
      )
      await Promise.all(promises)
      setSelectedApplications([])
      toast.success(
        `${selectedApplications.length} candidature(s) ${action === "accept" ? "acceptée(s)" : "refusée(s)"}`,
      )
    } catch (error) {
      console.error("Erreur action groupée:", error)
      toast.error("Erreur lors de l'action groupée")
    }
  }

  const getStatusStats = () => {
    const stats = {
      total: applications.length,
      pending: applications.filter((app) => app.status === "pending").length,
      analyzing: applications.filter((app) => app.status === "analyzing").length,
      visit_proposed: applications.filter((app) => app.status === "visit_proposed").length,
      visit_scheduled: applications.filter((app) => app.status === "visit_scheduled").length,
      accepted: applications.filter((app) => app.status === "accepted").length,
      rejected: applications.filter((app) => app.status === "rejected").length,
    }
    return stats
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const stats = getStatusStats()

  return (
    <>
      <PageHeader title="Candidatures" description="Gérez les candidatures pour vos biens immobiliers">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/owner/scoring-preferences-simple")}>
            <Settings className="h-4 w-4 mr-2" />
            Configurer le scoring
          </Button>
        </div>
      </PageHeader>

      <div className="p-6 space-y-6">
        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">En attente</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.analyzing}</div>
              <div className="text-sm text-muted-foreground">En analyse</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.visit_proposed}</div>
              <div className="text-sm text-muted-foreground">Visite proposée</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.visit_scheduled}</div>
              <div className="text-sm text-muted-foreground">Visite planifiée</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
              <div className="text-sm text-muted-foreground">Acceptées</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <div className="text-sm text-muted-foreground">Refusées</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et recherche */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher par nom, email, bien ou profession..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="analyzing">En analyse</SelectItem>
                    <SelectItem value="visit_proposed">Visite proposée</SelectItem>
                    <SelectItem value="visit_scheduled">Visite planifiée</SelectItem>
                    <SelectItem value="accepted">Acceptées</SelectItem>
                    <SelectItem value="rejected">Refusées</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SortAsc className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Trier par" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date_desc">Plus récentes</SelectItem>
                    <SelectItem value="date_asc">Plus anciennes</SelectItem>
                    <SelectItem value="score_desc">Score décroissant</SelectItem>
                    <SelectItem value="score_asc">Score croissant</SelectItem>
                    <SelectItem value="name_asc">Nom A-Z</SelectItem>
                    <SelectItem value="name_desc">Nom Z-A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions groupées */}
        {selectedApplications.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{selectedApplications.length} candidature(s) sélectionnée(s)</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleBulkAction("accept")}>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Accepter
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleBulkAction("reject")}>
                    <XCircle className="h-4 w-4 mr-1" />
                    Refuser
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedApplications([])}>
                    Annuler
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Liste des candidatures */}
        <div className="space-y-4">
          {filteredApplications.length > 0 ? (
            filteredApplications.map((application) => (
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
                scoringPreferences={scoringPreferences}
              />
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Aucune candidature trouvée</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchTerm || statusFilter !== "all"
                    ? "Aucune candidature ne correspond à vos critères de recherche."
                    : "Vous n'avez pas encore reçu de candidatures."}
                </p>
                {(searchTerm || statusFilter !== "all") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("")
                      setStatusFilter("all")
                    }}
                    className="mt-4"
                  >
                    Effacer les filtres
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialogue de proposition de visite */}
      {showVisitDialog && currentApplication && (
        <VisitProposalManager
          isOpen={showVisitDialog}
          onClose={() => {
            setShowVisitDialog(false)
            setCurrentApplication(null)
          }}
          propertyId={currentApplication.property_id}
          propertyTitle={currentApplication.property?.title || ""}
          applicationId={currentApplication.id}
          tenantName={`${currentApplication.tenant?.first_name || ""} ${currentApplication.tenant?.last_name || ""}`}
          onSlotsProposed={handleVisitProposed}
        />
      )}

      {/* Dialogue de refus */}
      {showRefuseDialog && currentApplication && (
        <RefusalDialog
          isOpen={showRefuseDialog}
          onClose={() => {
            setShowRefuseDialog(false)
            setCurrentApplication(null)
          }}
          onConfirm={handleRefuseConfirm}
          tenantName={`${currentApplication.tenant?.first_name || ""} ${currentApplication.tenant?.last_name || ""}`}
        />
      )}
    </>
  )
}
