"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { authService } from "@/lib/auth-service"
import { PageHeader } from "@/components/page-header"
import { VisitProposalManager } from "@/components/visit-proposal-manager"
import { scoringPreferencesService } from "@/lib/scoring-preferences-service"
import { applicationEnrichmentService } from "@/lib/application-enrichment-service"
import { CircularScore } from "@/components/circular-score"
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
  AlertTriangle,
  CreditCard,
  AlertCircle,
  Settings,
  Users,
  Phone,
  Mail,
  MapPin,
  Euro,
  Home,
  Star,
  TrendingUp,
  Award,
  Heart,
} from "lucide-react"
import { TenantAndGuarantorDocumentsSection } from "@/components/TenantAndGuarantorDocumentsSection"

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
  const [scoringResult, setScoringResult] = useState<any>(null)
  const [scoringPreferences, setScoringPreferences] = useState<any>(null)

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
      await Promise.all([loadApplicationDetails(currentUser.id), loadScoringPreferences(currentUser.id)])
    } catch (error) {
      console.error("Erreur auth:", error)
      toast.error("Erreur d'authentification")
    } finally {
      setLoading(false)
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

  const loadApplicationDetails = async (ownerId: string) => {
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

      // Charger le dossier de location
      let rentalFile = null
      if (data.application?.tenant_id) {
        try {
          const rentalFileResponse = await fetch(`/api/rental-files?tenant_id=${data.application.tenant_id}`)
          if (rentalFileResponse.ok) {
            const rentalFileData = await rentalFileResponse.json()
            rentalFile = rentalFileData.rental_file

            if (rentalFile) {
              console.log("✅ Dossier de location chargé:", {
                id: rentalFile.id,
                main_tenant: rentalFile.main_tenant?.first_name + " " + rentalFile.main_tenant?.last_name,
                income: rentalFile.main_tenant?.income_sources?.work_income?.amount,
                guarantors_count: rentalFile.guarantors?.length || 0,
                completion_percentage: rentalFile.completion_percentage,
              })

              setRentalFile(rentalFile)
            }
          }
        } catch (error) {
          console.error("Erreur chargement dossier location:", error)
        }
      }

      // Enrichir l'application avec les données du dossier de location
      const enrichedApplication = await applicationEnrichmentService.enrichApplication(data.application, rentalFile)
      setApplication(enrichedApplication)

      // Calculer le score avec le service unifié
      await recalculateScore(enrichedApplication, ownerId)
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du chargement des détails")
    }
  }

  const recalculateScore = async (app: any, ownerId?: string) => {
    if (!app || !app.property || !app.property.owner_id) return

    try {
      console.log(`🎯 Recalcul score pour candidature ${app.id}`)

      const result = await scoringPreferencesService.calculateScore(
        app,
        app.property,
        ownerId || app.property.owner_id,
        false, // Ne pas utiliser le cache pour avoir le score le plus récent
      )

      setScoringResult(result)
      console.log(`📊 Score recalculé: ${result.totalScore}/100 - Compatible: ${result.compatible}`)
    } catch (error) {
      console.error("❌ Erreur recalcul score:", error)
      setScoringResult({
        totalScore: 50,
        breakdown: {},
        compatible: false,
        model_used: "Erreur",
        model_version: "error",
        calculated_at: new Date().toISOString(),
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

      if (user) {
        await loadApplicationDetails(user.id)
      }
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

  const formatAmount = (amount: number | undefined | null) => {
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

    switch (application.status) {
      case "analyzing":
        return (
          <>
            <Button onClick={handleProposeVisit} className="bg-blue-600 hover:bg-blue-700">
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
          </>
        )
      case "visit_scheduled":
        return (
          <>
            <Button onClick={handleAccept} className="bg-green-600 hover:bg-green-700">
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
          </>
        )
      case "accepted":
      case "approved":
        return (
          <>
            <Button
              onClick={() => router.push(`/owner/leases/new?application=${application.id}`)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <FileText className="h-4 w-4 mr-2" />
              Générer le bail
            </Button>
            <Button variant="outline" onClick={handleContact}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Contacter
            </Button>
          </>
        )
      case "rejected":
        return (
          <>
            <Button variant="outline" onClick={handleContact}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Contacter
            </Button>
          </>
        )
      default:
        return (
          <>
            <Button variant="outline" onClick={handleContact}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Contacter
            </Button>
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

  // Utiliser les données enrichies ou les données de base
  const totalIncome = application.income || 0
  const hasGuarantor = application.has_guarantor || false
  const profession = application.profession || mainTenant.profession || "Non spécifié"
  const company = application.company || mainTenant.company || "Non spécifié"
  const contractType = application.contract_type || mainTenant.main_activity || "Non spécifié"

  const rentRatio = totalIncome && property.price ? (totalIncome / property.price).toFixed(1) : "N/A"

  // Statut du dossier basé sur completion_percentage
  const completionPercentage = application.completion_percentage || rentalFile?.completion_percentage || 0
  const isComplete = application.documents_complete || completionPercentage >= 80

  return (
    <>
      <PageHeader
        title={`Candidature de ${tenant.first_name || "Prénom"} ${tenant.last_name || "Nom"}`}
        description={`Pour ${property.title || "le bien"}`}
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
        {/* Score et actions - Design amélioré */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-6">
              {scoringResult && (
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <CircularScore score={scoringResult.totalScore} size="xl" />
                    {scoringResult.compatible && (
                      <div className="absolute -top-1 -right-1">
                        <div className="bg-green-500 text-white rounded-full p-1">
                          <CheckCircle className="h-3 w-3" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Score de compatibilité</h2>
                    <p className="text-sm text-gray-600 mb-2">Modèle: {scoringResult.model_used}</p>
                    <div className="flex items-center gap-3">
                      {scoringResult.compatible ? (
                        <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                          <Award className="h-3 w-3 mr-1" />
                          Profil compatible
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Profil à risque
                        </Badge>
                      )}
                      {scoringResult.totalScore >= 80 && (
                        <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">
                          <Star className="h-3 w-3 mr-1" />
                          Excellent candidat
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/owner/scoring-preferences-simple")}
                size="sm"
                className="border-gray-300"
              >
                <Settings className="h-4 w-4 mr-2" />
                Modifier critères
              </Button>
              {getActionButtons()}
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-6 bg-gray-100">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white">
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="financial" className="data-[state=active]:bg-white">
              Analyse financière
            </TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:bg-white">
              Documents
            </TabsTrigger>
          </TabsList>

          {/* Vue d'ensemble - Sans couleurs de gradients */}
          <TabsContent value="overview" className="space-y-6">
            {/* Résumé rapide en haut */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-600">Revenus mensuels</p>
                      <p className="text-lg font-bold text-green-600">{formatAmount(totalIncome)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-sm text-gray-600">Ratio revenus/loyer</p>
                      <p className="text-lg font-bold">{rentRatio !== "N/A" ? `${rentRatio}x` : "N/A"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600">Garants</p>
                      <p className="text-lg font-bold">
                        {hasGuarantor ? `${rentalFile?.guarantors?.length || 1}` : "0"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-amber-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="text-sm text-gray-600">Complétude</p>
                      <p className="text-lg font-bold">{completionPercentage}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Informations du candidat principal */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Candidat principal
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Nom complet</label>
                        <p className="text-lg font-semibold text-gray-900">
                          {tenant.first_name || mainTenant.first_name || "Prénom"}{" "}
                          {tenant.last_name || mainTenant.last_name || "Nom"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <p className="text-gray-900">{tenant.email || "Non renseigné"}</p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Téléphone</label>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <p className="text-gray-900">{tenant.phone || "Non renseigné"}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Date de naissance</label>
                        <p className="text-gray-900">
                          {mainTenant.birth_date ? formatDate(mainTenant.birth_date) : "Non renseigné"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Lieu de naissance</label>
                        <p className="text-gray-900">{mainTenant.birth_place || "Non renseigné"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Nationalité</label>
                        <p className="text-gray-900">{mainTenant.nationality || "Non renseigné"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Statut du dossier</label>
                        <div className="flex items-center gap-2 mt-1">
                          {isComplete ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Complet ({completionPercentage}%)
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Incomplet ({completionPercentage}%)
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <label className="text-sm font-medium text-gray-500">Date de candidature</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <p className="text-gray-900">{formatDate(application.created_at)}</p>
                        </div>
                      </div>
                    </div>
                    {!isComplete && <Progress value={completionPercentage} className="mt-3" />}
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
                <CardContent className="p-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Titre</label>
                    <p className="text-lg font-semibold text-gray-900">{property.title || "Titre non spécifié"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Adresse</label>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-gray-900">{property.address || "Adresse non spécifiée"}</p>
                        <p className="text-sm text-gray-600">{property.city || "Ville non spécifiée"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Loyer</label>
                      <div className="flex items-center gap-2">
                        <Euro className="h-4 w-4 text-green-500" />
                        <p className="text-lg font-bold text-green-600">{formatAmount(property.price)}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Charges</label>
                      <p className="text-gray-900">{formatAmount(property.charges)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Type</label>
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-gray-400" />
                        <p className="text-gray-900">{property.type || "Non spécifié"}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Surface</label>
                      <p className="text-gray-900">{property.surface ? `${property.surface} m²` : "Non spécifié"}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nombre de pièces</label>
                    <p className="text-gray-900">{property.rooms ? `${property.rooms} pièces` : "Non spécifié"}</p>
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
              <CardContent className="p-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Profession</label>
                      <p className="text-gray-900 font-medium">{profession}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Entreprise</label>
                      <p className="text-gray-900">{company}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Type de contrat</label>
                      <p className="text-gray-900">{contractType}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Revenus mensuels</label>
                      <p className="text-xl font-bold text-green-600">{formatAmount(totalIncome)}</p>
                      {rentalFile?.cotenants && rentalFile.cotenants.length > 0 && (
                        <p className="text-xs text-gray-500">Incluant {rentalFile.cotenants.length} colocataire(s)</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Ratio revenus/loyer</label>
                      <div className="flex items-center gap-2">
                        <p className="text-xl font-bold">{rentRatio !== "N/A" ? `${rentRatio}x` : "N/A"}</p>
                        {rentRatio !== "N/A" && (
                          <>
                            {Number(rentRatio) >= 3 ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Excellent</Badge>
                            ) : Number(rentRatio) >= 2.5 ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Bon</Badge>
                            ) : Number(rentRatio) >= 2 ? (
                              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">Acceptable</Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Insuffisant</Badge>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Garants</label>
                      <div className="flex items-center gap-2">
                        {hasGuarantor ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                            <Shield className="h-3 w-3 mr-1" />
                            {rentalFile?.guarantors?.length || 1} garant(s)
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Sans garant</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Situation de location */}
            {rentalFile?.rental_situation && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Situation de location
                    {rentalFile.rental_situation === "couple" && (
                      <Badge variant="outline" className="ml-2 text-pink-700 border-pink-300 bg-pink-50">
                        <Heart className="h-3 w-3 mr-1" />
                        En couple
                      </Badge>
                    )}
                    {rentalFile.rental_situation === "colocation" && (
                      <Badge variant="outline" className="ml-2 text-blue-700 border-blue-300 bg-blue-50">
                        <Users className="h-3 w-3 mr-1" />
                        Colocation
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-500">Type de location</label>
                    <p className="text-lg font-semibold text-gray-900">
                      {rentalFile.rental_situation === "alone" && "Seul(e)"}
                      {rentalFile.rental_situation === "couple" && "En couple"}
                      {rentalFile.rental_situation === "colocation" && "En colocation"}
                    </p>
                  </div>

                  {/* Colocataires/Conjoint */}
                  {rentalFile.cotenants && rentalFile.cotenants.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        {rentalFile.rental_situation === "couple" ? (
                          <>
                            <Heart className="h-4 w-4 text-pink-500" />
                            Conjoint(e)
                          </>
                        ) : (
                          <>
                            <Users className="h-4 w-4 text-blue-500" />
                            Colocataires
                          </>
                        )}{" "}
                        ({rentalFile.cotenants.length})
                      </h4>
                      {rentalFile.cotenants.map((cotenant: any, index: number) => (
                        <Card key={index} className="border-l-4 border-l-indigo-300">
                          <CardContent className="p-4">
                            <h5 className="font-medium mb-3 text-gray-900">
                              {rentalFile.rental_situation === "couple" ? "Conjoint(e)" : `Colocataire ${index + 1}`}
                            </h5>
                            <div className="grid gap-3 md:grid-cols-3">
                              <div>
                                <label className="text-sm font-medium text-gray-500">Nom</label>
                                <p className="text-gray-900 font-medium">
                                  {cotenant.first_name} {cotenant.last_name}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500">Profession</label>
                                <p className="text-gray-900">{cotenant.profession || "Non spécifié"}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500">Activité</label>
                                <p className="text-gray-900">{cotenant.main_activity || "Non spécifié"}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500">Revenus</label>
                                <p className="text-green-600 font-semibold">
                                  {formatAmount(cotenant.income_sources?.work_income?.amount)}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500">Date de naissance</label>
                                <p className="text-gray-900">
                                  {cotenant.birth_date ? formatDate(cotenant.birth_date) : "Non spécifié"}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500">Nationalité</label>
                                <p className="text-gray-900">{cotenant.nationality || "Non renseigné"}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Message de candidature */}
            {(application.presentation || application.message || rentalFile?.presentation_message) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Message de candidature
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-l-amber-400">
                    <p className="whitespace-pre-wrap text-gray-900 leading-relaxed">
                      {application.presentation || application.message || rentalFile?.presentation_message}
                    </p>
                  </div>
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
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {rentalFile.guarantors.map((guarantor: any, index: number) => (
                      <Card key={index} className="border-l-4 border-l-green-300">
                        <CardContent className="p-4">
                          <h4 className="font-medium mb-3 text-gray-900">Garant {index + 1}</h4>
                          <div className="grid gap-3 md:grid-cols-3">
                            <div>
                              <label className="text-sm font-medium text-gray-500">Type</label>
                              <p className="text-gray-900">
                                {guarantor.type === "physical" && "Personne physique"}
                                {guarantor.type === "organism" && "Organisme"}
                                {guarantor.type === "moral_person" && "Personne morale"}
                              </p>
                            </div>
                            {guarantor.type === "physical" && guarantor.personal_info && (
                              <>
                                <div>
                                  <label className="text-sm font-medium text-gray-500">Nom</label>
                                  <p className="text-gray-900 font-medium">
                                    {guarantor.personal_info.first_name} {guarantor.personal_info.last_name}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-500">Revenus</label>
                                  <p className="text-green-600 font-semibold">
                                    {formatAmount(guarantor.personal_info.income_sources?.work_income?.amount)}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-500">Activité</label>
                                  <p className="text-gray-900">
                                    {guarantor.personal_info.main_activity || "Non spécifié"}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-500">Profession</label>
                                  <p className="text-gray-900">
                                    {guarantor.personal_info.profession || "Non spécifié"}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-500">Situation logement</label>
                                  <p className="text-gray-900">
                                    {guarantor.personal_info.current_housing_situation || "Non spécifié"}
                                  </p>
                                </div>
                              </>
                            )}
                            {guarantor.type === "organism" && (
                              <>
                                <div>
                                  <label className="text-sm font-medium text-gray-500">Organisme</label>
                                  <p className="text-gray-900">{guarantor.organism_name || "Non spécifié"}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-500">Type d'organisme</label>
                                  <p className="text-gray-900">{guarantor.organism_type || "Non spécifié"}</p>
                                </div>
                              </>
                            )}
                            {guarantor.type === "moral_person" && (
                              <div>
                                <label className="text-sm font-medium text-gray-500">Entreprise</label>
                                <p className="text-gray-900">{guarantor.company_name || "Non spécifié"}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Analyse financière */}
          <TabsContent value="financial" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Revenus et charges
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Revenus du locataire principal</span>
                      <span className="font-medium">
                        {formatAmount(
                          rentalFile?.main_tenant?.income_sources?.work_income?.amount || application.income,
                        )}
                      </span>
                    </div>

                    {rentalFile?.cotenants && rentalFile.cotenants.length > 0 && (
                      <>
                        {rentalFile.cotenants.map((cotenant: any, index: number) => (
                          <div key={index} className="flex justify-between">
                            <span className="text-sm text-muted-foreground">
                              Revenus {cotenant.first_name} {cotenant.last_name}
                            </span>
                            <span className="font-medium">
                              {formatAmount(cotenant.income_sources?.work_income?.amount || 0)}
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-sm font-medium text-muted-foreground">Total des revenus</span>
                          <span className="font-bold text-green-600">{formatAmount(totalIncome)}</span>
                        </div>
                      </>
                    )}

                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Loyer proposé</span>
                      <span className="font-medium">{formatAmount(property.price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Charges estimées</span>
                      <span className="font-medium">{formatAmount(property.charges || 0)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-medium">Ratio revenus/loyer</span>
                      <span className="font-bold">{rentRatio !== "N/A" ? `${rentRatio}x` : "N/A"}</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <h4 className="font-medium mb-2">Analyse du ratio</h4>
                    {rentRatio !== "N/A" ? (
                      <div className="space-y-2">
                        {Number(rentRatio) >= 3 ? (
                          <div className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                            <div>
                              <p className="font-medium text-green-700">Excellent ratio (≥ 3)</p>
                              <p className="text-sm text-muted-foreground">
                                Le candidat dispose de revenus largement suffisants pour assumer le loyer.
                              </p>
                            </div>
                          </div>
                        ) : Number(rentRatio) >= 2.5 ? (
                          <div className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                            <div>
                              <p className="font-medium text-green-700">Bon ratio (≥ 2.5)</p>
                              <p className="text-sm text-muted-foreground">
                                Le candidat dispose de revenus confortables par rapport au loyer demandé.
                              </p>
                            </div>
                          </div>
                        ) : Number(rentRatio) >= 2 ? (
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                            <div>
                              <p className="font-medium text-amber-700">Ratio acceptable (≥ 2)</p>
                              <p className="text-sm text-muted-foreground">
                                Le candidat dispose de revenus suffisants mais sa marge financière est limitée.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                            <div>
                              <p className="font-medium text-red-700">Ratio insuffisant ({"<"} 2)</p>
                              <p className="text-sm text-muted-foreground">
                                Le candidat risque d'avoir des difficultés à assumer le loyer sur la durée.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Impossible de calculer le ratio (revenus ou loyer non spécifiés).
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Stabilité financière
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Type de contrat</span>
                      <span className="font-medium">{contractType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Ancienneté professionnelle</span>
                      <span className="font-medium">
                        {application.seniority_months ? `${application.seniority_months} mois` : "Non spécifié"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Période d'essai</span>
                      <span className="font-medium">{application.trial_period ? "Oui" : "Non"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Complétude du dossier</span>
                      <span className="font-medium">
                        {completionPercentage}%
                        {isComplete ? (
                          <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-200">Complet</Badge>
                        ) : (
                          <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-800 hover:bg-amber-200">
                            Incomplet
                          </Badge>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <h4 className="font-medium mb-2">Analyse de la stabilité</h4>
                    <div className="space-y-2">
                      {contractType?.toLowerCase().includes("cdi") ? (
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-green-700">Contrat stable (CDI)</p>
                            <p className="text-sm text-muted-foreground">
                              Le candidat bénéficie d'une stabilité professionnelle optimale.
                            </p>
                          </div>
                        </div>
                      ) : contractType?.toLowerCase().includes("cdd") ? (
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-amber-700">Contrat à durée déterminée (CDD)</p>
                            <p className="text-sm text-muted-foreground">
                              Stabilité limitée dans le temps. Vérifier la durée restante du contrat.
                            </p>
                          </div>
                        </div>
                      ) : contractType?.toLowerCase().includes("freelance") ||
                        contractType?.toLowerCase().includes("indépendant") ? (
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-amber-700">Travailleur indépendant</p>
                            <p className="text-sm text-muted-foreground">
                              Revenus potentiellement variables. Vérifier l'historique des revenus.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-red-700">Situation à clarifier</p>
                            <p className="text-sm text-muted-foreground">
                              Le type de contrat n'est pas clairement identifié ou présente des risques
                            </p>
                          </div>
                        </div>
                      )}

                      {application.trial_period && (
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-red-700">Période d'essai en cours</p>
                            <p className="text-sm text-muted-foreground">
                              Le candidat est encore en période d'essai, ce qui représente un risque.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Garanties
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hasGuarantor ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-700">
                          {rentalFile?.guarantors?.length || 1} garant(s) disponible(s)
                        </p>
                        <p className="text-sm text-muted-foreground">
                          La présence de garant(s) renforce considérablement la sécurité financière du dossier.
                        </p>
                      </div>
                    </div>

                    {rentalFile?.guarantors?.map((guarantor: any, index: number) => {
                      const guarantorIncome = guarantor.personal_info?.income_sources?.work_income?.amount || 0
                      const guarantorRatio =
                        guarantorIncome && property.price ? (guarantorIncome / property.price).toFixed(1) : "N/A"

                      return (
                        <div key={index} className="border rounded-lg p-4">
                          <h4 className="font-medium mb-2">Garant {index + 1}</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Revenus mensuels</span>
                              <span className="font-medium">{formatAmount(guarantorIncome)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Ratio revenus/loyer</span>
                              <span className="font-medium">
                                {guarantorRatio !== "N/A" ? `${guarantorRatio}x` : "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Type de contrat</span>
                              <span className="font-medium">
                                {guarantor.personal_info?.main_activity || "Non spécifié"}
                              </span>
                            </div>
                          </div>

                          {guarantorRatio !== "N/A" && (
                            <div className="mt-2 pt-2 border-t">
                              {Number(guarantorRatio) >= 3 ? (
                                <Badge className="bg-green-100 text-green-800">Excellent garant</Badge>
                              ) : Number(guarantorRatio) >= 2 ? (
                                <Badge className="bg-green-100 text-green-800">Bon garant</Badge>
                              ) : (
                                <Badge className="bg-amber-100 text-amber-800">Garant limité</Badge>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-700">Aucun garant</p>
                      <p className="text-sm text-muted-foreground">
                        L'absence de garant augmente le risque financier, surtout si le ratio revenus/loyer est faible.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
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
          onSlotsProposed={handleVisitProposed}
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
