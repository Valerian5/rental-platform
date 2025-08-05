"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { authService } from "@/lib/auth-service"
import { PageHeader } from "@/components/page-header"
import { ModernApplicationCard } from "@/components/modern-application-card"
import { VisitProposalManager } from "@/components/visit-proposal-manager"
import { scoringPreferencesService } from "@/lib/scoring-preferences-service"
import { Filter, Download, Users, Search, SortAsc, Settings, RefreshCw, MapPin, Star } from "lucide-react"

export default function ApplicationsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const propertyIdFilter = searchParams.get("propertyId")

  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState([])
  const [filteredApplications, setFilteredApplications] = useState([])
  const [activeTab, setActiveTab] = useState("all")
  const [user, setUser] = useState(null)
  const [selectedApplications, setSelectedApplications] = useState(new Set())

  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("created_at")
  const [propertyFilter, setPropertyFilter] = useState("all")
  const [scoreFilter, setScoreFilter] = useState("all")
  const [properties, setProperties] = useState([])
  const [scoringPreferences, setScoringPreferences] = useState(null)

  // États pour la gestion des visites
  const [showVisitDialog, setShowVisitDialog] = useState(false)
  const [currentApplicationForVisit, setCurrentApplicationForVisit] = useState(null)

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  useEffect(() => {
    filterAndSortApplications()
  }, [applications, searchTerm, statusFilter, sortBy, activeTab, propertyFilter, scoreFilter])

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

  const loadScoringPreferences = async (ownerId) => {
    try {
      console.log("🎯 Chargement préférences scoring pour:", ownerId)

      const preferences = await scoringPreferencesService.getOwnerPreferences(ownerId, true)
      setScoringPreferences(preferences)

      console.log("✅ Préférences chargées:", preferences.name)
    } catch (error) {
      console.error("❌ Erreur chargement préférences scoring:", error)
    }
  }

  const loadApplications = async (ownerId) => {
    try {
      console.log("🔍 Chargement candidatures pour propriétaire:", ownerId)

      const response = await fetch(`/api/applications?owner_id=${ownerId}`)
      if (response.ok) {
        const data = await response.json()
        console.log("✅ Candidatures chargées:", data.applications?.length || 0)

        // Enrichir chaque candidature avec les données du dossier de location
        const enrichedApplications = await Promise.all(
          (data.applications || []).map(async (app) => {
            try {
              if (app.tenant_id) {
                const rentalFileResponse = await fetch(`/api/rental-files?tenant_id=${app.tenant_id}`)
                if (rentalFileResponse.ok) {
                  const rentalFileData = await rentalFileResponse.json()
                  const rentalFile = rentalFileData.rental_file

                  if (rentalFile && rentalFile.main_tenant) {
                    console.log("📊 Enrichissement candidature:", {
                      application_id: app.id,
                      tenant_name: `${rentalFile.main_tenant.first_name} ${rentalFile.main_tenant.last_name}`,
                      income: rentalFile.main_tenant.income_sources?.work_income?.amount,
                      guarantors_count: rentalFile.guarantors?.length || 0,
                    })

                    // Récupérer les revenus depuis main_tenant
                    let income = 0
                    if (rentalFile.main_tenant.income_sources?.work_income?.amount) {
                      income = rentalFile.main_tenant.income_sources.work_income.amount
                    } else if (rentalFile.main_tenant.income_sources?.work_income?.monthly_amount) {
                      income = rentalFile.main_tenant.income_sources.work_income.monthly_amount
                    } else if (rentalFile.main_tenant.monthly_income) {
                      income = rentalFile.main_tenant.monthly_income
                    } else if (app.income) {
                      income = app.income
                    }

                    // Vérifier la présence de garants
                    const hasGuarantor =
                      (rentalFile.guarantors && rentalFile.guarantors.length > 0) || app.has_guarantor || false

                    // Récupérer les revenus du garant
                    let guarantorIncome = 0
                    if (rentalFile.guarantors && rentalFile.guarantors.length > 0) {
                      guarantorIncome = rentalFile.guarantors[0].personal_info?.income_sources?.work_income?.amount || 0
                    }

                    // Récupérer la profession et l'entreprise
                    const profession = rentalFile.main_tenant.profession || app.profession || "Non spécifié"
                    const company = rentalFile.main_tenant.company || app.company || "Non spécifié"

                    // Type de contrat depuis main_activity
                    const contractType = rentalFile.main_tenant.main_activity || app.contract_type || "Non spécifié"

                    const enrichedApp = {
                      ...app,
                      income,
                      has_guarantor: hasGuarantor,
                      guarantor_income: guarantorIncome,
                      profession,
                      company,
                      contract_type: contractType,
                      rental_file_id: rentalFile.id,
                      rental_file_main_tenant: rentalFile.main_tenant,
                      rental_file_guarantors: rentalFile.guarantors,
                    }

                    // Calculer le score unifié
                    if (enrichedApp.property?.price && enrichedApp.income && ownerId) {
                      try {
                        const result = await scoringPreferencesService.calculateScore(
                          enrichedApp,
                          enrichedApp.property,
                          ownerId,
                          true, // Utiliser le cache
                        )
                        enrichedApp.match_score = result.totalScore
                        console.log("📊 Score calculé pour candidature:", {
                          id: enrichedApp.id,
                          score: result.totalScore,
                          model: result.model_used,
                        })
                      } catch (error) {
                        console.error("❌ Erreur calcul score initial:", error)
                        enrichedApp.match_score = 50
                      }
                    } else {
                      enrichedApp.match_score = 50
                    }

                    return enrichedApp
                  }
                }
              }

              // Calculer le score même sans dossier de location
              if (app.property?.price && app.income && ownerId) {
                try {
                  const result = await scoringPreferencesService.calculateScore(app, app.property, ownerId, true)
                  app.match_score = result.totalScore
                } catch (error) {
                  console.error("❌ Erreur calcul score:", error)
                  app.match_score = 50
                }
              } else {
                app.match_score = 50
              }

              return app
            } catch (error) {
              console.error("❌ Erreur enrichissement candidature:", error)
              app.match_score = 50
              return app
            }
          }),
        )

        setApplications(enrichedApplications)

        // Extraire les propriétés uniques pour le filtre
        const uniqueProperties = enrichedApplications.reduce((acc, app) => {
          if (app.property && !acc.find((p) => p.id === app.property.id)) {
            acc.push({
              id: app.property.id,
              title: app.property.title,
            })
          }
          return acc
        }, [])
        setProperties(uniqueProperties)

        console.log("✅ Candidatures enrichies et scores calculés:", enrichedApplications.length)
      } else {
        console.error("❌ Erreur chargement candidatures:", await response.text())
        toast.error("Erreur lors du chargement des candidatures")
      }
    } catch (error) {
      console.error("❌ Erreur:", error)
      toast.error("Erreur lors du chargement des candidatures")
    }
  }

  const filterAndSortApplications = () => {
    let filtered = [...applications]

    // Filtre par onglet
    if (activeTab !== "all") {
      const statusMap = {
        pending: ["pending", "analyzing", "visit_proposed", "visit_scheduled", "waiting_tenant_confirmation"],
        accepted: ["accepted", "approved"],
        rejected: ["rejected"],
      }
      filtered = filtered.filter((app) => {
        const status = app.status || "pending"
        return statusMap[activeTab]?.includes(status)
      })
    }

    // Filtre par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (app) =>
          (app.tenant?.first_name || "").toLowerCase().includes(term) ||
          (app.tenant?.last_name || "").toLowerCase().includes(term) ||
          (app.tenant?.email || "").toLowerCase().includes(term) ||
          (app.property?.title || "").toLowerCase().includes(term) ||
          (app.property?.address || "").toLowerCase().includes(term),
      )
    }

    // Filtre par statut
    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter)
    }

    // Filtre par propriété
    if (propertyFilter !== "all") {
      filtered = filtered.filter((app) => app.property_id === propertyFilter)
    }

    // Filtrer par propriété si spécifié dans l'URL
    if (propertyIdFilter) {
      filtered = filtered.filter((app) => app.property_id === propertyIdFilter)
    }

    // Filtre par score
    if (scoreFilter !== "all") {
      filtered = filtered.filter((app) => {
        const score = app.match_score || 50
        switch (scoreFilter) {
          case "excellent":
            return score >= 80
          case "good":
            return score >= 60 && score < 80
          case "average":
            return score >= 40 && score < 60
          case "poor":
            return score < 40
          default:
            return true
        }
      })
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "created_at":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "tenant_name":
          const nameA = `${a.tenant?.first_name || ""} ${a.tenant?.last_name || ""}`
          const nameB = `${b.tenant?.first_name || ""} ${b.tenant?.last_name || ""}`
          return nameA.localeCompare(nameB)
        case "property_title":
          return (a.property?.title || "").localeCompare(b.property?.title || "")
        case "score":
          return (b.match_score || 50) - (a.match_score || 50)
        default:
          return 0
      }
    })

    setFilteredApplications(filtered)
  }

  const handleApplicationAction = async (action, applicationId) => {
    console.log("🎯 Action:", action, "pour candidature:", applicationId)

    const application = applications.find((app) => app.id === applicationId)
    if (!application) {
      toast.error("Candidature introuvable")
      return
    }

    switch (action) {
      case "view_details":
      case "analyze":
        router.push(`/owner/applications/${applicationId}`)
        break
      case "accept":
        await handleStatusChange(applicationId, "accepted")
        break
      case "refuse":
        await handleStatusChange(applicationId, "rejected")
        break
      case "contact":
        if (application.tenant_id) {
          router.push(`/owner/messaging?tenant_id=${application.tenant_id}`)
        } else {
          toast.error("Impossible de contacter ce locataire")
        }
        break
      case "generate_lease":
        router.push(`/owner/leases/new?application=${applicationId}`)
        break
      case "propose_visit":
        setCurrentApplicationForVisit(application)
        setShowVisitDialog(true)
        break
      default:
        console.log("Action non reconnue:", action)
    }
  }

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      })

      if (response.ok) {
        toast.success(`Candidature ${newStatus === "accepted" ? "acceptée" : "refusée"}`)
        setApplications(applications.map((app) => (app.id === applicationId ? { ...app, status: newStatus } : app)))
      } else {
        toast.error("Erreur lors de la mise à jour du statut")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la mise à jour du statut")
    }
  }

  const handleSelectApplication = (applicationId, selected) => {
    const newSelected = new Set(selectedApplications)
    if (selected) {
      newSelected.add(applicationId)
    } else {
      newSelected.delete(applicationId)
    }
    setSelectedApplications(newSelected)
  }

  const handleVisitProposed = async (slots) => {
    if (!currentApplicationForVisit) return

    try {
      await handleStatusChange(currentApplicationForVisit.id, "visit_proposed")
      setShowVisitDialog(false)
      setCurrentApplicationForVisit(null)
      toast.success("Créneaux de visite proposés avec succès")
    } catch (error) {
      console.error("Erreur lors de la proposition de visite:", error)
      toast.error("Erreur lors de la proposition de visite")
    }
  }

  const getApplicationCounts = () => {
    return {
      all: applications.length,
      pending: applications.filter((app) => {
        const status = app.status || "pending"
        return ["pending", "analyzing", "visit_proposed", "visit_scheduled", "waiting_tenant_confirmation"].includes(
          status,
        )
      }).length,
      accepted: applications.filter((app) => {
        const status = app.status || "pending"
        return ["accepted", "approved"].includes(status)
      }).length,
      rejected: applications.filter((app) => app.status === "rejected").length,
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 md:grid-cols-1">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    )
  }

  const counts = getApplicationCounts()

  return (
    <>
      <PageHeader title="Candidatures" description="Gérez les candidatures pour vos biens">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/owner/scoring-preferences-simple")}>
            <Settings className="h-4 w-4 mr-2" />
            Préférences de scoring
          </Button>
          <Button variant="outline" size="sm" onClick={() => checkAuthAndLoadData()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </PageHeader>

      <div className="p-6 space-y-6">
        {/* Indicateur des préférences actuelles */}
        {scoringPreferences && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-900">Modèle actuel: {scoringPreferences.name}</span>
              </div>
            </div>
          </div>
        )}

        {/* Filtres et recherche */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher par nom, email, propriété..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="analyzing">En analyse</SelectItem>
                  <SelectItem value="visit_proposed">Visite proposée</SelectItem>
                  <SelectItem value="visit_scheduled">Visite planifiée</SelectItem>
                  <SelectItem value="accepted">Acceptée</SelectItem>
                  <SelectItem value="rejected">Refusée</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SortAsc className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date de candidature</SelectItem>
                  <SelectItem value="tenant_name">Nom du locataire</SelectItem>
                  <SelectItem value="property_title">Propriété</SelectItem>
                  <SelectItem value="score">Score de compatibilité</SelectItem>
                </SelectContent>
              </Select>
              <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                <SelectTrigger className="w-48">
                  <MapPin className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrer par bien" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les biens</SelectItem>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={scoreFilter} onValueChange={setScoreFilter}>
                <SelectTrigger className="w-48">
                  <Star className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrer par score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les scores</SelectItem>
                  <SelectItem value="excellent">Excellent (80-100)</SelectItem>
                  <SelectItem value="good">Bon (60-79)</SelectItem>
                  <SelectItem value="average">Moyen (40-59)</SelectItem>
                  <SelectItem value="poor">Faible (&lt;40)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="all">Toutes ({counts.all})</TabsTrigger>
            <TabsTrigger value="pending">En attente ({counts.pending})</TabsTrigger>
            <TabsTrigger value="accepted">Acceptées ({counts.accepted})</TabsTrigger>
            <TabsTrigger value="rejected">Refusées ({counts.rejected})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {filteredApplications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Aucune candidature</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchTerm || statusFilter !== "all" || propertyFilter !== "all" || scoreFilter !== "all"
                      ? "Aucune candidature ne correspond à vos filtres"
                      : activeTab === "all"
                        ? "Vous n'avez pas encore reçu de candidatures"
                        : `Vous n'avez pas de candidatures ${
                            activeTab === "pending" ? "en attente" : activeTab === "accepted" ? "acceptées" : "refusées"
                          }`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-1">
                {filteredApplications.map((application) => {
                  const tenant = application.tenant || {}
                  const property = application.property || {}

                  const applicationData = {
                    id: application.id,
                    tenant: {
                      first_name: tenant.first_name || "Prénom",
                      last_name: tenant.last_name || "Nom",
                      email: tenant.email || "email@example.com",
                      phone: tenant.phone || "Non renseigné",
                    },
                    property: {
                      title: property.title || "Propriété inconnue",
                      address: property.address || "Adresse inconnue",
                      price: property.price || 0,
                      owner_id: property.owner_id,
                    },
                    profession: application.profession || "Non spécifié",
                    income: application.income || 0,
                    has_guarantor: application.has_guarantor || false,
                    guarantor_income: application.guarantor_income || 0,
                    documents_complete: application.documents_complete || false,
                    status: application.status || "pending",
                    match_score: application.match_score || 50,
                    created_at: application.created_at || new Date().toISOString(),
                    tenant_id: application.tenant_id,
                    contract_type: application.contract_type,
                    message: application.message,
                    visit_requested: application.visit_requested,
                    rental_file_main_tenant: application.rental_file_main_tenant,
                    rental_file_guarantors: application.rental_file_guarantors,
                  }

                  return (
                    <ModernApplicationCard
                      key={application.id}
                      application={applicationData}
                      isSelected={selectedApplications.has(application.id)}
                      onSelect={(selected) => handleSelectApplication(application.id, selected)}
                      onAction={(action) => handleApplicationAction(action, application.id)}
                      rentalFile={
                        application.rental_file_main_tenant
                          ? {
                              main_tenant: application.rental_file_main_tenant,
                              guarantors: application.rental_file_guarantors,
                            }
                          : null
                      }
                      scoringPreferences={scoringPreferences}
                    />
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogue de proposition de visite */}
      {showVisitDialog && currentApplicationForVisit && (
        <VisitProposalManager
          isOpen={showVisitDialog}
          onClose={() => {
            setShowVisitDialog(false)
            setCurrentApplicationForVisit(null)
          }}
          propertyId={currentApplicationForVisit.property_id}
          propertyTitle={currentApplicationForVisit.property?.title || "Propriété"}
          applicationId={currentApplicationForVisit.id}
          tenantName={
            `${currentApplicationForVisit.tenant?.first_name || ""} ${currentApplicationForVisit.tenant?.last_name || ""}`.trim() ||
            "Candidat"
          }
          onSlotsProposed={handleVisitProposed}
        />
      )}
    </>
  )
}
