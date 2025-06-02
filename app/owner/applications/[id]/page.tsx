"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { authService } from "@/lib/auth-service"
import { PageHeader } from "@/components/page-header"
import { CircularScore } from "@/components/circular-score"
import { ArrowLeft, User, MapPin, Briefcase, Shield, FileText, MessageSquare, CheckCircle, XCircle } from "lucide-react"

export default function ApplicationDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [application, setApplication] = useState(null)
  const [rentalFile, setRentalFile] = useState(null)
  const [rentalFileData, setRentalFileData] = useState(null)
  const [user, setUser] = useState(null)

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

      // Récupérer les détails de la candidature
      const response = await fetch(`/api/applications/${params.id}`)
      if (!response.ok) {
        toast.error("Erreur lors du chargement de la candidature")
        return
      }

      const data = await response.json()
      console.log("✅ Candidature chargée:", data.application)
      setApplication(data.application)

      // Récupérer le dossier de location si disponible
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
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du chargement des détails")
    }
  }

  const handleStatusChange = async (newStatus) => {
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

  const formatDate = (dateString) => {
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

  const formatAmount = (amount) => {
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
    if (!application || !application.property) return 50

    let score = 0
    const property = application.property

    // Utiliser les données du dossier de location en priorité
    const mainTenant = rentalFile?.main_tenant || {}
    const income = mainTenant.income_sources?.work_income?.amount || application.income || 0
    const hasGuarantor =
      (rentalFile?.guarantors && rentalFile.guarantors.length > 0) || application.has_guarantor || false
    const contractType = mainTenant.main_activity || application.contract_type

    // Ratio revenus/loyer (40 points max)
    if (income && property.price) {
      const rentRatio = income / property.price
      if (rentRatio >= 3) score += 40
      else if (rentRatio >= 2.5) score += 30
      else if (rentRatio >= 2) score += 20
      else score += 10
    } else {
      score += 10
    }

    // Stabilité professionnelle (20 points max)
    if (contractType === "CDI" || contractType === "cdi") score += 20
    else if (contractType === "CDD" || contractType === "cdd") score += 15
    else score += 10

    // Présence d'un garant (20 points max)
    if (hasGuarantor) score += 20

    // Documents et présentation (20 points max)
    if (application.presentation && application.presentation.length > 50) score += 10
    if (application.profession && application.company) score += 10

    return Math.min(score, 100)
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
  const mainTenant = rentalFileData?.main_tenant || {}

  // Utiliser les données du dossier de location en priorité
  const mainTenant2 = rentalFile?.main_tenant || {}
  const income = mainTenant2.income_sources?.work_income?.amount || application.income || 0
  const hasGuarantor =
    (rentalFile?.guarantors && rentalFile.guarantors.length > 0) || application.has_guarantor || false
  const profession = mainTenant2.profession || application.profession || "Non spécifié"
  const company = mainTenant2.company || application.company || "Non spécifié"
  const contractType = mainTenant2.main_activity || application.contract_type || "Non spécifié"

  const matchScore = calculateMatchScore()

  return (
    <>
      <PageHeader
        title={`Candidature de ${tenant.first_name} ${tenant.last_name}`}
        description={`Pour ${property.title}`}
      >
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
      </PageHeader>

      <div className="container mx-auto py-6 space-y-6">
        {/* Score et actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <CircularScore score={matchScore} size="lg" />
            <div>
              <h2 className="text-xl font-semibold">Score de compatibilité</h2>
              <p className="text-sm text-muted-foreground">
                Basé sur les revenus, la stabilité professionnelle et les garants
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/owner/messaging?tenant_id=${application.tenant_id}`)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Contacter
            </Button>
            <Button
              variant="outline"
              onClick={() => handleStatusChange("accepted")}
              disabled={application.status === "accepted"}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Accepter
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleStatusChange("rejected")}
              disabled={application.status === "rejected"}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Refuser
            </Button>
          </div>
        </div>

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
                <MapPin className="h-5 w-5" />
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
                {income && property.price ? `${(income / property.price).toFixed(1)}x` : "N/A"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Garants</label>
              <Badge variant={hasGuarantor ? "default" : "secondary"}>
                {hasGuarantor ? "Avec garants" : "Sans garants"}
              </Badge>
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
                {rentalFile.guarantors.map((guarantor, index) => (
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

        {/* Actions */}
        <div className="flex justify-center gap-4">
          {rentalFile && (
            <Button variant="outline" onClick={() => router.push(`/rental-files/${rentalFile.id}/view`)}>
              <FileText className="mr-2 h-4 w-4" />
              Voir le dossier complet
            </Button>
          )}
          <Button onClick={() => router.push(`/owner/leases/new?application=${application.id}`)}>
            Générer le bail
          </Button>
        </div>
      </div>
    </>
  )
}
