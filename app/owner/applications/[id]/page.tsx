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
  AlertTriangle,
  Clock,
  Building,
  CreditCard,
  BarChart3,
  AlertCircle,
} from "lucide-react"

const DocumentPreview = ({ doc, type, index }: { doc: any; type: string; index: number }) => {
  const getDocTypeColor = (type: string) => {
    switch (type) {
      case 'identity': return 'text-blue-500';
      case 'professional': return 'text-green-500';
      case 'financial': return 'text-purple-500';
      case 'tax': return 'text-orange-500';
      case 'housing': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getDocTypeLabel = (type: string) => {
    switch (type) {
      case 'identity': return 'Pièce d\'identité';
      case 'professional': return 'Document pro';
      case 'financial': return 'Document financier';
      case 'tax': return 'Document fiscal';
      case 'housing': return 'Justificatif de domicile';
      default: return 'Document';
    }
  };

  const colorClass = getDocTypeColor(type);
  const docType = getDocTypeLabel(type);

  return (
    <div className="border rounded-lg p-3">
      <div className={`flex items-center gap-2 mb-2 ${colorClass}`}>
        <FileText className={`h-4 w-4 ${colorClass}`} />
        <span className="text-sm font-medium">{docType} {index + 1}</span>
      </div>
      {doc.file_type?.startsWith('image/') ? (
        <img
          src={doc.url}
          alt={`${docType} ${index + 1}`}
          className="w-full h-32 object-contain rounded border bg-gray-50"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
      ) : (
        <div className="w-full h-32 flex items-center justify-center bg-gray-100 rounded border">
          <FileText className="h-8 w-8 text-gray-400" />
        </div>
      )}
      <div className="hidden items-center justify-center h-32 bg-gray-100 rounded border">
        <div className="text-center">
          <FileText className="h-8 w-8 text-gray-400 mx-auto mb-1" />
          <p className="text-xs text-gray-500">{doc.name || 'Document'}</p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="w-full mt-2"
        onClick={() => window.open(doc.url, '_blank')}
      >
        Voir le document
      </Button>
    </div>
  );
};

export default function ApplicationDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [application, setApplication] = useState<any>(null)
  const [rentalFile, setRentalFile] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [showVisitDialog, setShowVisitDialog] = useState(false)
  const [showRefuseDialog, setShowRefuseDialog] = useState(false)
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
            }
          }
        } catch (error) {
          console.error("Erreur chargement dossier location:", error)
        }
      }

      if (data.application?.property?.owner_id) {
        try {
          const prefsResponse = await fetch(
            `/api/scoring-preferences?owner_id=${data.application.property.owner_id}&default_only=true`,
            {
              cache: "no-store",
              headers: {
                "Cache-Control": "no-cache",
              },
            },
          )
          if (prefsResponse.ok) {
            const prefsData = await prefsResponse.json()
            if (prefsData.preferences && prefsData.preferences.length > 0) {
              console.log("Préférences de scoring récupérées:", prefsData.preferences[0].name)
              setScoringPreferences(prefsData.preferences[0])
            } else {
              setScoringPreferences({
                min_income_ratio: 2.5,
                good_income_ratio: 3,
                excellent_income_ratio: 3.5,
                weights: {
                  income: 40,
                  stability: 25,
                  guarantor: 20,
                  file_quality: 15,
                },
              })
            }
          }
        } catch (error) {
          console.error("Erreur chargement préférences scoring:", error)
          setScoringPreferences({
            min_income_ratio: 2.5,
            good_income_ratio: 3,
            excellent_income_ratio: 3.5,
            weights: {
              income: 40,
              stability: 25,
              guarantor: 20,
              file_quality: 15,
            },
          })
        }
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du chargement des détails")
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
          visit_scheduled: "Visite proposée au candidat",
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
    setShowVisitDialog(true)
  }

  const handleVisitProposed = async (slots: any[]) => {
    const success = await updateApplicationStatus("visit_proposed")
    if (success) {
      setShowVisitDialog(false)
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

  const calculateMatchScore = () => {
    if (!application || !application.property || !scoringPreferences) return 50

    const property = application.property
    const mainTenant = rentalFile?.main_tenant || {}
    const income = mainTenant.income_sources?.work_income?.amount || application.income || 0
    const hasGuarantor =
      (rentalFile?.guarantors && rentalFile.guarantors.length > 0) || application.has_guarantor || false
    const contractType = (mainTenant.main_activity || application.contract_type || "").toLowerCase()

    let score = 0

    if (income && property.price) {
      const rentRatio = income / property.price

      if (rentRatio >= scoringPreferences.excellent_income_ratio) {
        score += scoringPreferences.weights.income
      } else if (rentRatio >= scoringPreferences.good_income_ratio) {
        const points = Math.round(scoringPreferences.weights.income * 0.8)
        score += points
      } else if (rentRatio >= scoringPreferences.min_income_ratio) {
        const points = Math.round(scoringPreferences.weights.income * 0.6)
        score += points
      } else {
        const points = Math.round(scoringPreferences.weights.income * 0.3)
        score += points
      }
    }

    if (contractType === "cdi" || contractType === "fonctionnaire") {
      score += scoringPreferences.weights.stability
    } else if (contractType === "cdd") {
      const points = Math.round(scoringPreferences.weights.stability * 0.7)
      score += points
    } else {
      const points = Math.round(scoringPreferences.weights.stability * 0.5)
      score += points
    }

    if (hasGuarantor) {
      score += scoringPreferences.weights.guarantor
    }

    let fileQualityScore = 0
    const profession = mainTenant.profession || application.profession
    const company = mainTenant.company || application.company

    if (profession && profession !== "Non spécifié") {
      fileQualityScore += Math.round(scoringPreferences.weights.file_quality * 0.5)
    }
    if (company && company !== "Non spécifié") {
      fileQualityScore += Math.round(scoringPreferences.weights.file_quality * 0.5)
    }
    score += fileQualityScore

    return Math.min(Math.round(score), 100)
  }

  const getStatusBadge = () => {
    if (!application) return null

    switch (application.status) {
      case "pending":
        return <Badge variant="outline">En attente</Badge>
      case "analyzing":
        return <Badge variant="secondary">En analyse</Badge>
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

  const hasDocuments = (docs: any) => {
    return docs && Array.isArray(docs) && docs.length > 0 && docs[0].url
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

  const income = mainTenant.income_sources?.work_income?.amount || application.income || 0
  const hasGuarantor =
    (rentalFile?.guarantors && rentalFile.guarantors.length > 0) || application.has_guarantor || false
  const profession = mainTenant.profession || application.profession || "Non spécifié"
  const company = mainTenant.company || application.company || "Non spécifié"
  const contractType = mainTenant.main_activity || application.contract_type || "Non spécifié"

  const matchScore = calculateMatchScore()
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
            <CircularScore score={matchScore} size="lg" customPreferences={scoringPreferences} />
            <div>
              <h2 className="text-xl font-semibold">Score de compatibilité</h2>
              <p className="text-sm text-muted-foreground">
                Basé sur les revenus, la stabilité professionnelle et les garants
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
                      <span className="text-sm text-muted-foreground">Revenus mensuels</span>
                      <span className="font-medium">{formatAmount(income)}</span>
                    </div>
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
                      <span className="font-medium">{mainTenant.professional_info?.seniority || "Non spécifié"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Période d'essai</span>
                      <span className="font-medium">{mainTenant.professional_info?.trial_period ? "Oui" : "Non"}</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <h4 className="font-medium mb-2">Analyse de la stabilité</h4>
                    <div className="space-y-2">
                      {contractType?.toLowerCase() === "cdi" ? (
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-green-700">Contrat stable (CDI)</p>
                            <p className="text-sm text-muted-foreground">
                              Le candidat bénéficie d'une stabilité professionnelle optimale.
                            </p>
                          </div>
                        </div>
                      ) : contractType?.toLowerCase() === "cdd" ? (
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-amber-700">Contrat à durée déterminée (CDD)</p>
                            <p className="text-sm text-muted-foreground">
                              Stabilité limitée dans le temps. Vérifier la durée restante du contrat.
                            </p>
                          </div>
                        </div>
                      ) : contractType?.toLowerCase() === "freelance" ||
                        contractType?.toLowerCase() === "indépendant" ? (
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

                      {mainTenant.professional_info?.trial_period && (
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Synthèse et recommandation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <CircularScore score={matchScore} size="md" />
                    <div>
                      <h3 className="font-medium">Score global: {matchScore}/100</h3>
                      <p className="text-sm text-muted-foreground">
                        Évaluation basée sur les revenus, la stabilité professionnelle et les garanties
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Points forts</h4>
                    <ul className="space-y-1">
                      {Number(rentRatio) >= 2.5 && (
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Ratio revenus/loyer favorable ({rentRatio}x)</span>
                        </li>
                      )}
                      {contractType?.toLowerCase() === "cdi" && (
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Stabilité professionnelle (CDI)</span>
                        </li>
                      )}
                      {hasGuarantor && (
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Présence de {rentalFile?.guarantors?.length || 1} garant(s)</span>
                        </li>
                      )}
                      {mainTenant.professional_info?.seniority && (
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Ancienneté professionnelle: {mainTenant.professional_info.seniority}</span>
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Points d'attention</h4>
                    <ul className="space-y-1">
                      {Number(rentRatio) < 2.5 && (
                        <li className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                          <span>Ratio revenus/loyer limité ({rentRatio}x)</span>
                        </li>
                      )}
                      {contractType?.toLowerCase() !== "cdi" && (
                        <li className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                          <span>Type de contrat: {contractType}</span>
                        </li>
                      )}
                      {!hasGuarantor && (
                        <li className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                          <span>Absence de garant</span>
                        </li>
                      )}
                      {mainTenant.professional_info?.trial_period && (
                        <li className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                          <span>Période d'essai en cours</span>
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Recommandation</h4>
                    {matchScore >= 80 ? (
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-green-700">Dossier solide</p>
                          <p className="text-sm text-muted-foreground">
                            Ce dossier présente d'excellentes garanties financières. Candidature à privilégier.
                          </p>
                        </div>
                      </div>
                    ) : matchScore >= 60 ? (
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-green-700">Dossier satisfaisant</p>
                          <p className="text-sm text-muted-foreground">
                            Ce dossier présente des garanties financières satisfaisantes. Candidature recommandée.
                          </p>
                        </div>
                      </div>
                    ) : matchScore >= 40 ? (
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-700">Dossier à surveiller</p>
                          <p className="text-sm text-muted-foreground">
                            Ce dossier présente quelques fragilités. Une garantie complémentaire pourrait être demandée.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-red-700">Dossier fragile</p>
                          <p className="text-sm text-muted-foreground">
                            Ce dossier présente des risques financiers importants. Candidature à considérer avec
                            prudence.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
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
                {rentalFile ? (
                  <div className="space-y-6">
                    {/* Documents d'identité */}
                    {hasDocuments(rentalFile.main_tenant?.identity_documents) && (
                      <div>
                        <h4 className="font-medium mb-3">Pièces d'identité du locataire</h4>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {rentalFile.main_tenant.identity_documents.map((doc: any, index: number) => (
                            <DocumentPreview 
                              key={index}
                              doc={doc}
                              type="identity"
                              index={index}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Documents professionnels */}
                    {hasDocuments(rentalFile.main_tenant?.professional_documents) && (
                      <div>
                        <h4 className="font-medium mb-3">Documents professionnels</h4>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {rentalFile.main_tenant.professional_documents.map((doc: any, index: number) => (
                            <DocumentPreview
                              key={index}
                              doc={doc}
                              type="professional"
                              index={index}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Documents financiers */}
                    {hasDocuments(rentalFile.main_tenant?.financial_documents) && (
                      <div>
                        <h4 className="font-medium mb-3">Documents financiers</h4>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {rentalFile.main_tenant.financial_documents.map((doc: any, index: number) => (
                            <DocumentPreview
                              key={index}
                              doc={doc}
                              type="financial"
                              index={index}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Documents fiscaux */}
                    {hasDocuments(rentalFile.main_tenant?.tax_documents) && (
                      <div>
                        <h4 className="font-medium mb-3">Documents fiscaux</h4>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {rentalFile.main_tenant.tax_documents.map((doc: any, index: number) => (
                            <DocumentPreview
                              key={index}
                              doc={doc}
                              type="tax"
                              index={index}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Documents de logement */}
                    {hasDocuments(rentalFile.main_tenant?.housing_documents) && (
                      <div>
                        <h4 className="font-medium mb-3">Justificatifs de domicile</h4>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {rentalFile.main_tenant.housing_documents.map((doc: any, index: number) => (
                            <DocumentPreview
                              key={index}
                              doc={doc}
                              type="housing"
                              index={index}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Documents des garants */}
                    {rentalFile.guarantors?.map((guarantor: any, gIndex: number) => (
                      hasDocuments(guarantor.documents) && (
                        <div key={gIndex}>
                          <h4 className="font-medium mb-3">
                            Documents du garant {gIndex + 1}: {guarantor.first_name} {guarantor.last_name}
                          </h4>
                          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {guarantor.documents.map((doc: any, index: number) => (
                              <DocumentPreview
                                key={index}
                                doc={doc}
                                type={`guarantor-${gIndex}`}
                                index={index}
                              />
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Aucun document disponible</h3>
                    <p className="text-muted-foreground">
                      Le candidat n'a pas encore fourni de documents ou le dossier n'est pas accessible.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}