"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { authService } from "@/lib/auth-service"
import { PageHeader } from "@/components/page-header"
import { CircularScore } from "@/components/circular-score"
import { MatchingScore } from "@/components/matching-score"
import { scoringPreferencesService } from "@/lib/scoring-preferences-service"
import {
  User,
  Building,
  Euro,
  Shield,
  FileText,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Download,
  RefreshCw,
  BarChart3,
  Eye,
  Settings,
} from "lucide-react"

interface ApplicationDetailPageProps {
  params: {
    id: string
  }
}

export default function ApplicationDetailPage({ params }: ApplicationDetailPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [application, setApplication] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("overview")

  // États pour le scoring unifié
  const [scoringResult, setScoringResult] = useState<any>(null)
  const [scoringLoading, setScoreLoading] = useState(false)
  const [scoringPreferences, setScoringPreferences] = useState<any>(null)

  useEffect(() => {
    checkAuthAndLoadData()
  }, [params.id])

  const checkAuthAndLoadData = async () => {
    try {
      const currentUser = await authService.getCurrentUser()
      if (!currentUser || currentUser.user_type !== "owner") {
        router.push("/login")
        return
      }

      setUser(currentUser)
      await Promise.all([loadApplication(params.id), loadScoringPreferences(currentUser.id)])
    } catch (error) {
      console.error("Erreur auth:", error)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  const loadScoringPreferences = async (ownerId: string) => {
    try {
      const preferences = await scoringPreferencesService.getOwnerPreferences(ownerId, true)
      setScoringPreferences(preferences)
    } catch (error) {
      console.error("Erreur chargement préférences:", error)
    }
  }

  const loadApplication = async (applicationId: string) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}`)
      if (response.ok) {
        const data = await response.json()
        const app = data.application

        // Enrichir avec les données du dossier de location
        if (app.tenant_id) {
          try {
            const rentalFileResponse = await fetch(`/api/rental-files?tenant_id=${app.tenant_id}`)
            if (rentalFileResponse.ok) {
              const rentalFileData = await rentalFileResponse.json()
              const rentalFile = rentalFileData.rental_file

              if (rentalFile && rentalFile.main_tenant) {
                // Enrichir les données de candidature
                app.income = rentalFile.main_tenant.income_sources?.work_income?.amount || app.income
                app.profession = rentalFile.main_tenant.profession || app.profession
                app.company = rentalFile.main_tenant.company || app.company
                app.contract_type = rentalFile.main_tenant.main_activity || app.contract_type
                app.rental_file_main_tenant = rentalFile.main_tenant
                app.rental_file_guarantors = rentalFile.guarantors || []

                // Vérifier la présence de garants
                app.has_guarantor = (rentalFile.guarantors && rentalFile.guarantors.length > 0) || app.has_guarantor

                // Récupérer les revenus du garant
                if (rentalFile.guarantors && rentalFile.guarantors.length > 0) {
                  app.guarantor_income =
                    rentalFile.guarantors[0].personal_info?.income_sources?.work_income?.amount || 0
                }
              }
            }
          } catch (error) {
            console.error("Erreur chargement dossier de location:", error)
          }
        }

        setApplication(app)

        // Calculer le score unifié
        if (app.property?.owner_id && app.property?.price) {
          await calculateUnifiedScore(app)
        }
      } else {
        toast.error("Candidature introuvable")
        router.push("/owner/applications")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du chargement de la candidature")
    }
  }

  const calculateUnifiedScore = async (app: any, forceRecalculation = false) => {
    if (!app.property?.owner_id || !app.property?.price) {
      console.warn("Données insuffisantes pour le calcul de score")
      return
    }

    try {
      setScoreLoading(true)

      console.log("🎯 ApplicationDetail - Calcul score unifié pour:", {
        applicationId: app.id,
        propertyPrice: app.property.price,
        ownerId: app.property.owner_id,
        forceRecalculation,
      })

      // Utiliser le service unifié
      const result = await scoringPreferencesService.calculateScore(
        app,
        app.property,
        app.property.owner_id,
        !forceRecalculation, // Utiliser le cache sauf si force
      )

      console.log("📊 ApplicationDetail - Score calculé:", {
        totalScore: result.totalScore,
        compatible: result.compatible,
        model: result.model_used,
        breakdown: Object.entries(result.breakdown).map(([key, value]) => ({
          critere: key,
          score: value.score,
          max: value.max,
        })),
      })

      setScoringResult(result)
    } catch (error) {
      console.error("❌ Erreur calcul score ApplicationDetail:", error)
      setScoringResult({
        totalScore: 50,
        compatible: false,
        model_used: "Erreur",
        breakdown: {},
        recommendations: ["Erreur lors du calcul du score"],
        warnings: ["Impossible de calculer le score"],
        exclusions: [],
      })
    } finally {
      setScoreLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/applications/${params.id}`, {
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
        setApplication({ ...application, status: newStatus })
      } else {
        toast.error("Erreur lors de la mise à jour du statut")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la mise à jour du statut")
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (e) {
      return "Date inconnue"
    }
  }

  const formatAmount = (amount: number) => {
    try {
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(amount)
    } catch (e) {
      return "Montant inconnu"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
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

  if (!application) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Candidature introuvable</h2>
          <Button onClick={() => router.push("/owner/applications")} className="mt-4">
            Retour aux candidatures
          </Button>
        </div>
      </div>
    )
  }

  const tenant = application.tenant || {}
  const property = application.property || {}

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${tenant.first_name || "Prénom"} ${tenant.last_name || "Nom"}`}
        description={`Candidature pour ${property.title || "Propriété inconnue"}`}
        backButton={{
          href: "/owner/applications",
          label: "Retour aux candidatures",
        }}
      >
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => calculateUnifiedScore(application, true)}
            disabled={scoringLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${scoringLoading ? "animate-spin" : ""}`} />
            Recalculer score
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push("/owner/scoring-preferences-simple")}>
            <Settings className="h-4 w-4 mr-2" />
            Préférences
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* En-tête avec statut et actions */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">
                      {tenant.first_name} {tenant.last_name}
                    </h2>
                    <p className="text-muted-foreground">{application.profession || "Profession non spécifiée"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(application.status)}
                  {scoringResult && (
                    <CircularScore
                      score={scoringResult.totalScore}
                      loading={scoringLoading}
                      showDetails={false}
                      breakdown={scoringResult.breakdown}
                      recommendations={scoringResult.recommendations}
                      warnings={scoringResult.warnings}
                      compatible={scoringResult.compatible}
                      modelUsed={scoringResult.model_used}
                      size="md"
                    />
                  )}
                </div>
              </div>

              {/* Actions rapides */}
              <div className="flex gap-2">
                {application.status === "pending" && (
                  <>
                    <Button onClick={() => handleStatusChange("analyzing")}>
                      <Eye className="h-4 w-4 mr-2" />
                      Analyser
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/owner/messaging?tenant_id=${application.tenant_id}`)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contacter
                    </Button>
                  </>
                )}
                {application.status === "analyzing" && (
                  <>
                    <Button onClick={() => handleStatusChange("accepted")} className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accepter
                    </Button>
                    <Button variant="destructive" onClick={() => handleStatusChange("rejected")}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Refuser
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/owner/messaging?tenant_id=${application.tenant_id}`)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contacter
                    </Button>
                  </>
                )}
                {application.status === "accepted" && (
                  <Button onClick={() => router.push(`/owner/leases/new?application=${application.id}`)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Générer bail
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Onglets de détail */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="scoring">Analyse scoring</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="history">Historique</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Informations personnelles */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informations personnelles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{tenant.email || "Non renseigné"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Téléphone</p>
                        <p className="font-medium">{tenant.phone || "Non renseigné"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Date de candidature</p>
                        <p className="font-medium">{formatDate(application.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Entreprise</p>
                        <p className="font-medium">{application.company || "Non spécifiée"}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Informations financières */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Euro className="h-5 w-5" />
                    Informations financières
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-700 font-medium">Revenus mensuels</p>
                      <p className="text-2xl font-bold text-green-800">{formatAmount(application.income || 0)}</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700 font-medium">Loyer du bien</p>
                      <p className="text-2xl font-bold text-blue-800">{formatAmount(property.price || 0)}</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-purple-700 font-medium">Ratio revenus/loyer</p>
                      <p className="text-2xl font-bold text-purple-800">
                        {application.income && property.price
                          ? `${(application.income / property.price).toFixed(1)}x`
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  {application.has_guarantor && (
                    <div className="mt-4 p-4 bg-amber-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-amber-600" />
                        <p className="font-medium text-amber-800">Garant présent</p>
                      </div>
                      {application.guarantor_income > 0 && (
                        <p className="text-sm text-amber-700">
                          Revenus du garant: {formatAmount(application.guarantor_income)}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Informations sur le bien */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Bien concerné
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{property.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <p className="text-muted-foreground">{property.address}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Loyer</p>
                      <p className="font-medium">{formatAmount(property.price || 0)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Surface</p>
                      <p className="font-medium">{property.surface || "N/A"} m²</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Pièces</p>
                      <p className="font-medium">{property.rooms || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p className="font-medium">{property.type || "N/A"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Message de candidature */}
              {application.message && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Message de candidature
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm leading-relaxed">{application.message}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="scoring" className="space-y-6">
              {scoringResult ? (
                <>
                  {/* Score global */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Score de compatibilité
                      </CardTitle>
                      <div className="text-sm text-muted-foreground">
                        Modèle utilisé: {scoringResult.model_used}
                        {scoringPreferences && (
                          <span className="ml-2">
                            •{" "}
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 h-auto text-blue-600"
                              onClick={() => router.push("/owner/scoring-preferences-simple")}
                            >
                              Modifier les préférences
                            </Button>
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
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
                    </CardContent>
                  </Card>

                  {/* Détail par critère */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Détail par critère</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {Object.entries(scoringResult.breakdown).map(([key, item]: [string, any]) => (
                        <div key={key} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium capitalize">{key.replace("_", " ")}</h4>
                            <Badge variant={item.compatible ? "default" : "destructive"}>
                              {item.score}/{item.max} points
                            </Badge>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${item.compatible ? "bg-green-500" : "bg-red-500"}`}
                              style={{ width: `${(item.score / item.max) * 100}%` }}
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">{item.details}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Exclusions */}
                  {scoringResult.exclusions && scoringResult.exclusions.length > 0 && (
                    <Card className="border-red-200">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-700">
                          <XCircle className="h-5 w-5" />
                          Règles d'exclusion
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {scoringResult.exclusions.map((exclusion: string, index: number) => (
                            <li key={index} className="flex items-start gap-2 text-red-700">
                              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{exclusion}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center py-10">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium">Score en cours de calcul</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Veuillez patienter pendant l'analyse de la candidature
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="documents" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documents fournis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${application.documents_complete ? "bg-green-500" : "bg-red-500"}`}
                        />
                        <span>Dossier complet</span>
                      </div>
                      <Badge variant={application.documents_complete ? "default" : "destructive"}>
                        {application.documents_complete ? "Oui" : "Non"}
                      </Badge>
                    </div>

                    {application.rental_file_main_tenant && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Dossier de location disponible</h4>
                        <p className="text-sm text-muted-foreground">
                          Le candidat a complété son dossier de location sur la plateforme.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 bg-transparent"
                          onClick={() => router.push(`/rental-files/${application.rental_file_id}/view`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir le dossier complet
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Historique de la candidature
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                      <div>
                        <p className="font-medium">Candidature soumise</p>
                        <p className="text-sm text-muted-foreground">{formatDate(application.created_at)}</p>
                      </div>
                    </div>

                    {application.updated_at !== application.created_at && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                        <div>
                          <p className="font-medium">Dernière mise à jour</p>
                          <p className="text-sm text-muted-foreground">{formatDate(application.updated_at)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Score rapide */}
          {scoringResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Score de compatibilité</CardTitle>
              </CardHeader>
              <CardContent>
                <CircularScore
                  score={scoringResult.totalScore}
                  loading={scoringLoading}
                  showDetails={true}
                  breakdown={scoringResult.breakdown}
                  recommendations={scoringResult.recommendations}
                  warnings={scoringResult.warnings}
                  compatible={scoringResult.compatible}
                  modelUsed={scoringResult.model_used}
                  size="lg"
                />
              </CardContent>
            </Card>
          )}

          {/* Actions rapides */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => router.push(`/owner/messaging?tenant_id=${application.tenant_id}`)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Contacter le candidat
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => router.push(`/owner/properties/${property.id}`)}
              >
                <Building className="h-4 w-4 mr-2" />
                Voir le bien
              </Button>

              {application.rental_file_id && (
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => router.push(`/rental-files/${application.rental_file_id}/view`)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Dossier de location
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => calculateUnifiedScore(application, true)}
                disabled={scoringLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${scoringLoading ? "animate-spin" : ""}`} />
                Recalculer le score
              </Button>
            </CardContent>
          </Card>

          {/* Informations sur le modèle de scoring */}
          {scoringPreferences && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Modèle de scoring</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{scoringPreferences.name}</p>
                  <p className="text-sm text-muted-foreground">{scoringPreferences.description}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-transparent"
                  onClick={() => router.push("/owner/scoring-preferences-simple")}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Modifier les préférences
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
