"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { authService } from "@/lib/auth-service"
import { PageHeader } from "@/components/page-header"
import { MatchingScore } from "@/components/matching-score"
import { VisitProposalManager } from "@/components/visit-proposal-manager"
import { TenantAndGuarantorDocumentsSection } from "@/components/TenantAndGuarantorDocumentsSection"
import { scoringPreferencesService } from "@/lib/scoring-preferences-service"
import {
  ArrowLeft,
  User,
  Briefcase,
  Shield,
  FileText,
  MessageSquare,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  Building,
  BarChart3,
} from "lucide-react"

export default function ApplicationDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [application, setApplication] = useState<any>(null)
  const [rentalFile, setRentalFile] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [showVisitDialog, setShowVisitDialog] = useState(false)
  const [currentApplication, setCurrentApplication] = useState<any>(null)
  const [showRefuseDialog, setShowRefuseDialog] = useState(false)
  const [documents, setDocuments] = useState<any[]>([])
  const [scoringResult, setScoringResult] = useState<any>(null)

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

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
      await loadApplicationDetails()
    } catch (error) {
      console.error("Erreur auth:", error)
      toast.error("Erreur d'authentification")
    } finally {
      setLoading(false)
    }
  }

  const loadApplicationDetails = async () => {
    try {
      console.log("🔍 Chargement détails candidature:", params.id)

      const response = await fetch(`/api/applications/${params.id}`)
      if (!response.ok) {
        toast.error("Erreur lors du chargement de la candidature")
        return
      }

      const data = await response.json()
      console.log("✅ Candidature chargée:", data.application)

      if (data.application.status === "pending") {
        await updateApplicationStatus("analyzing")
        data.application.status = "analyzing"
      }

      setApplication(data.application)
      setDocuments(flattenDocuments(data.application))

      // Charger le dossier de location avec enrichissement des données
      if (data.application?.tenant_id) {
        try {
          const rentalFileResponse = await fetch(`/api/rental-files?tenant_id=${data.application.tenant_id}`)
          if (rentalFileResponse.ok) {
            const rentalFileData = await rentalFileResponse.json()
            const rentalFile = rentalFileData.rental_file

            if (rentalFile) {
              console.log("✅ Dossier de location chargé:", {
                id: rentalFile.id,
                main_tenant: rentalFile.main_tenant?.first_name + " " + rentalFile.main_tenant?.last_name,
                income: rentalFile.main_tenant?.income_sources?.work_income?.amount,
                guarantors_count: rentalFile.guarantors?.length || 0,
              })

              setRentalFile(rentalFile)

              // Enrichir l'application avec les données du dossier de location
              let income = 0
              if (rentalFile.main_tenant?.income_sources?.work_income?.amount) {
                income = rentalFile.main_tenant.income_sources.work_income.amount
              } else if (rentalFile.main_tenant?.income_sources?.work_income?.monthly_amount) {
                income = rentalFile.main_tenant.income_sources.work_income.monthly_amount
              } else if (rentalFile.main_tenant?.monthly_income) {
                income = rentalFile.main_tenant.monthly_income
              } else if (data.application.income) {
                income = data.application.income
              }

              // Mettre à jour l'application avec les données enrichies
              setApplication((prev) => ({
                ...prev,
                income,
                has_guarantor:
                  (rentalFile.guarantors && rentalFile.guarantors.length > 0) || prev.has_guarantor || false,
                profession: rentalFile.main_tenant?.profession || prev.profession || "Non spécifié",
                company: rentalFile.main_tenant?.company || prev.company || "Non spécifié",
                contract_type: rentalFile.main_tenant?.main_activity || prev.contract_type || "Non spécifié",
              }))

              // Calculer le score avec le service unifié
              await recalculateScore(data.application, rentalFile)
            }
          }
        } catch (error) {
          console.error("Erreur chargement dossier location:", error)
        }
      } else {
        // Calculer le score même sans dossier de location
        await recalculateScore(data.application)
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du chargement des détails")
    }
  }

  const recalculateScore = async (app: any, rentalFile?: any) => {
    if (!app || !app.property || !app.property.owner_id) return

    try {
      // Préparer les données enrichies pour le calcul
      const enrichedApp = {
        ...app,
        income: rentalFile?.main_tenant?.income_sources?.work_income?.amount || app.income,
        has_guarantor: (rentalFile?.guarantors && rentalFile.guarantors.length > 0) || app.has_guarantor,
        guarantor_income: rentalFile?.guarantors?.[0]?.personal_info?.income_sources?.work_income?.amount || 0,
        contract_type: rentalFile?.main_tenant?.main_activity || app.contract_type,
        documents_complete: app.documents_complete,
        has_verified_documents: rentalFile?.has_verified_documents || false,
      }

      const result = await scoringPreferencesService.calculateScore(
        enrichedApp,
        app.property,
        app.property.owner_id,
        true,
      )
      setScoringResult(result)
      console.log("📊 Score calculé pour détail:", result.totalScore)
    } catch (error) {
      console.error("Erreur recalcul score:", error)
      setScoringResult({
        totalScore: 50,
        breakdown: {},
        compatible: false,
        model_used: "Erreur",
        recommendations: [],
        warnings: [],
        exclusions: [],
      })
    }
  }

  const updateApplicationStatus = async (newStatus: string, notes?: string) => {
    try {
      const response = await fetch(`/api/applications/${params.id}`, {
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
        setApplication({ ...application, status: newStatus })
        return true
      } else {
        toast.error("Erreur lors de la mise à jour du statut")
        return false
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la mise à jour du statut")
      return false
    }
  }

  const handleProposeVisit = () => {
    setCurrentApplication(application)
    setShowVisitDialog(true)
  }

  const handleVisitProposed = async (slots: any[]) => {
    try {
      const response = await fetch(`/api/applications/${params.id}/propose-visit-slots`, {
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

      loadApplicationDetails()
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la proposition de visite")
    }
  }

  const handleRefuse = () => {
    setShowRefuseDialog(true)
  }

  const handleRefuseConfirm = async (reason: string, type: string) => {
    let notes = ""

    const refusalReasons: { [key: string]: string } = {
      insufficient_income: "Revenus insuffisants",
      incomplete_file: "Dossier incomplet",
      missing_guarantor: "Absence de garant",
      unstable_situation: "Situation professionnelle instable",
      other: reason,
    }

    notes = refusalReasons[type] || reason

    const success = await updateApplicationStatus("rejected", notes)
    if (success) {
      setShowRefuseDialog(false)
    }
  }

  const handleAccept = async () => {
    await updateApplicationStatus("accepted")
  }

  const handleContact = async () => {
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

  const handleViewAnalysis = () => {
    setActiveTab("financial")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Non spécifié"
    try {
      return new Date(dateString).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    } catch (e) {
      return "Date invalide"
    }
  }

  const formatAmount = (amount: number | undefined) => {
    if (amount === null || amount === undefined) return "Non spécifié"
    try {
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(amount)
    } catch (e) {
      return "Montant invalide"
    }
  }

  const getStatusBadge = () => {
    if (!application) return null

    switch (application.status) {
      case "pending":
        return <Badge variant="outline">En attente</Badge>
      case "analyzing":
      case "pending":
        return <Badge variant="outline">En attente</Badge>
      case "analyzing":
        return <Badge variant="secondary">En analyse</Badge>
      case "visit_proposed":
        return (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-200">
            Visite proposée
          </Badge>
        )
      case "visit_scheduled":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
            Visite planifiée
          </Badge>
        )
      case "accepted":
      case "approved":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
            Acceptée
          </Badge>
        )
      case "rejected":
        return <Badge variant="destructive">Refusée</Badge>
      case "waiting_tenant_confirmation":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
            En attente de confirmation
          </Badge>
        )
      default:
        return <Badge variant="outline">Statut inconnu</Badge>
    }
  }

  const getActionButtons = () => {
    if (!application) return null

    const viewAnalysisButton =
      application.status !== "analyzing" ? (
        <Button variant="outline" onClick={handleViewAnalysis}>
          <BarChart3 className="h-4 w-4 mr-2" />
          Voir analyse
        </Button>
      ) : null

    switch (application.status) {
      case "analyzing":
        return (
          <>
            <Button onClick={handleProposeVisit}>
              <Calendar className="h-4 w-4 mr-2" />
              Proposer une visite
            </Button>
            <Button variant="destructive" onClick={handleRefuse}>
              <XCircle className="h-4 w-4 mr-2" />
              Refuser
            </Button>
            <Button variant="outline" onClick={handleContact}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Contacter
            </Button>
          </>
        )
      case "visit_proposed":
        return (
          <>
            <Button variant="outline" disabled>
              <Clock className="h-4 w-4 mr-2" />
              En attente de réponse
            </Button>
            <Button variant="outline" onClick={handleContact}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Contacter
            </Button>
            {viewAnalysisButton}
          </>
        )
      case "visit_scheduled":
        return (
          <>
            <Button onClick={handleAccept}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Accepter le dossier
            </Button>
            <Button variant="destructive" onClick={handleRefuse}>
              <XCircle className="h-4 w-4 mr-2" />
              Refuser
            </Button>
            <Button variant="outline" onClick={handleContact}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Contacter
            </Button>
            {viewAnalysisButton}
          </>
        )
      case "waiting_tenant_confirmation":
        return (
          <>
            <Button variant="outline" disabled>
              <Clock className="h-4 w-4 mr-2" />
              En attente du locataire
            </Button>
            <Button variant="outline" onClick={handleContact}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Contacter
            </Button>
            {viewAnalysisButton}
          </>
        )
      case "accepted":
      case "approved":
        return (
          <>
            <Button onClick={() => router.push(`/owner/leases/new?application=${application.id}`)}>
              <FileText className="h-4 w-4 mr-2" />
              Générer le bail
            </Button>
            <Button variant="outline" onClick={handleContact}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Contacter
            </Button>
            {viewAnalysisButton}
          </>
        )
      case "rejected":
        return (
          <>
            <Button variant="outline" onClick={handleContact}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Contacter
            </Button>
            {viewAnalysisButton}
          </>
        )
      default:
        return (
          <>
            <Button variant="outline" onClick={handleContact}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Contacter
            </Button>
            {viewAnalysisButton}
          </>
        )
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!application) {
    return (
      <div className="container mx-auto py-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <h3 className="text-lg font-medium">Candidature introuvable</h3>
            <p className="text-sm text-muted-foreground mt-1">
              La candidature demandée n'existe pas ou vous n'avez pas les permissions nécessaires.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const tenant = application.tenant || {}
  const property = application.property || {}
  const mainTenant = rentalFile?.main_tenant || {}

  // Récupérer les revenus avec plusieurs sources possibles
  let income = 0
  if (mainTenant.income_sources?.work_income?.amount) {
    income = mainTenant.income_sources.work_income.amount
  } else if (mainTenant.income_sources?.work_income?.monthly_amount) {
    income = mainTenant.income_sources.work_income.monthly_amount
  } else if (mainTenant.monthly_income) {
    income = mainTenant.monthly_income
  } else if (application.income) {
    income = application.income
  }

  const hasGuarantor =
    (rentalFile?.guarantors && rentalFile.guarantors.length > 0) || application.has_guarantor || false
  const profession = mainTenant.profession || application.profession || "Non spécifié"
  const company = mainTenant.company || application.company || "Non spécifié"
  const contractType = mainTenant.main_activity || application.contract_type || "Non spécifié"

  const rentRatio = income && property.price ? (income / property.price).toFixed(1) : "N/A"

  return (
    <>
      <PageHeader
        title={`Candidature de ${tenant.first_name} ${tenant.last_name}`}
        description={`Pour ${property.title}`}
      >
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </div>
      </PageHeader>

      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            {scoringResult && (
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                {scoringResult.totalScore}
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold">Score de compatibilité</h2>
              <p className="text-sm text-muted-foreground">
                {scoringResult ? scoringResult.model_used : "Calcul en cours..."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">{getActionButtons()}</div>
        </div>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="financial">Analyse financière</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Informations du candidat */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informations du candidat
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nom complet</label>
                    <p className="text-lg">
                      {tenant.first_name} {tenant.last_name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p>{tenant.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Téléphone</label>
                    <p>{tenant.phone || "Non renseigné"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date de candidature</label>
                    <p>{formatDate(application.created_at)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Informations du bien */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Bien concerné
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Titre</label>
                    <p className="text-lg">{property.title}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Adresse</label>
                    <p>{property.address}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Loyer</label>
                    <p>{formatAmount(property.price)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Type</label>
                    <p>{property.type || "Non spécifié"}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Informations professionnelles et financières */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Situation professionnelle et financière
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Profession</label>
                  <p>{profession}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Entreprise</label>
                  <p>{company}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type de contrat</label>
                  <p>{contractType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Revenus mensuels</label>
                  <p className="text-lg font-semibold text-green-600">{formatAmount(income)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Ratio revenus/loyer</label>
                  <p className="text-lg font-semibold">
                    {rentRatio !== "N/A" ? (
                      <>
                        {rentRatio}x
                        {Number(rentRatio) >= 3 ? (
                          <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-200">Excellent</Badge>
                        ) : Number(rentRatio) >= 2.5 ? (
                          <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-200">Bon</Badge>
                        ) : Number(rentRatio) >= 2 ? (
                          <Badge className="ml-2 bg-amber-100 text-amber-800 hover:bg-amber-200">Acceptable</Badge>
                        ) : (
                          <Badge className="ml-2 bg-red-100 text-red-800 hover:bg-red-200">Insuffisant</Badge>
                        )}
                      </>
                    ) : (
                      "N/A"
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Garants</label>
                  {hasGuarantor ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                      {rentalFile?.guarantors?.length || 1} garant(s)
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Sans garant</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Message de candidature */}
            {(application.message || application.presentation || rentalFile?.presentation_message) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Message de candidature
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">
                    {rentalFile?.presentation_message || application.presentation || application.message}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Informations sur les garants */}
            {rentalFile?.guarantors && rentalFile.guarantors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Garants ({rentalFile.guarantors.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {rentalFile.guarantors.map((guarantor: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">Garant {index + 1}</h4>
                        <div className="grid gap-2 md:grid-cols-3">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Type</label>
                            <p>{guarantor.type === "physical" ? "Personne physique" : "Personne morale"}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Nom</label>
                            <p>
                              {guarantor.personal_info?.first_name} {guarantor.personal_info?.last_name}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Revenus</label>
                            <p>{formatAmount(guarantor.personal_info?.income_sources?.work_income?.amount)}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Activité</label>
                            <p>{guarantor.personal_info?.main_activity || "Non spécifié"}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Situation logement</label>
                            <p>{guarantor.personal_info?.current_housing_situation || "Non spécifié"}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Analyse financière */}
          <TabsContent value="financial" className="space-y-6">
            {scoringResult ? (
              <MatchingScore
                application={application}
                property={property}
                size="lg"
                detailed={true}
                score={scoringResult.totalScore}
                breakdown={scoringResult.breakdown}
                recommendations={scoringResult.recommendations}
                warnings={scoringResult.warnings}
                compatible={scoringResult.compatible}
                modelUsed={scoringResult.model_used}
              />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-10">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-sm text-muted-foreground">Calcul du score en cours...</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documents fournis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user && (
                  <TenantAndGuarantorDocumentsSection
                    applicationId={application.id}
                    mainTenant={rentalFile?.main_tenant}
                    guarantors={rentalFile?.guarantors || []}
                    userId={user.id}
                    userName={`${user.first_name} ${user.last_name}`}
                    rentalFile={rentalFile}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogue de proposition de visite */}
      {showVisitDialog && currentApplication && (
        <VisitProposalManager
          isOpen={showVisitDialog}
          onClose={() => setShowVisitDialog(false)}
          propertyId={currentApplication.property_id}
          propertyTitle={currentApplication.property?.title || ""}
          applicationId={currentApplication.id}
          tenantName={`${currentApplication.tenant?.first_name || ""} ${currentApplication.tenant?.last_name || ""}`}
          onSlotsProposed={async (slots) => {
            await updateApplicationStatus("visit_proposed")
            setShowVisitDialog(false)
            toast.success("Créneaux de visite proposés avec succès")
          }}
        />
      )}
    </>
  )
}

function flattenDocuments(application: any): any[] {
  if (!application) return []

  const now = new Date().toISOString()
  const docs: any[] = []

  // Documents du locataire principal
  if (application.documents) {
    application.documents.forEach((doc: any) => {
      docs.push({
        document_id: doc.id || `doc-${docs.length}`,
        label: doc.type || "Document",
        file_url: doc.url,
        category: doc.category || "other",
        verified: doc.verified || false,
        created_at: doc.created_at || now,
        file_type: doc.file_type,
      })
    })
  }

  // Documents des garants
  if (application.guarantors) {
    application.guarantors.forEach((guarantor: any, index: number) => {
      if (guarantor.documents) {
        guarantor.documents.forEach((doc: any) => {
          docs.push({
            document_id: doc.id || `guarantor-${index}-doc-${docs.length}`,
            label: `${doc.type || "Document"} (Garant ${index + 1})`,
            file_url: doc.url,
            category: doc.category || "other",
            verified: doc.verified || false,
            created_at: doc.created_at || now,
            guarantor_id: guarantor.id || index.toString(),
            guarantor_name: guarantor.name || `Garant ${index + 1}`,
            file_type: doc.file_type,
          })
        })
      }
    })
  }

  return docs
}
