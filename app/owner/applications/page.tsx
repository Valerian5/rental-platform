"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { authService } from "@/lib/auth-service"
import { PageHeader } from "@/components/page-header"
import { ModernApplicationCard } from "@/components/modern-application-card"
import { Filter, Download, Users } from "lucide-react"

export default function ApplicationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState([])
  const [activeTab, setActiveTab] = useState("all")
  const [user, setUser] = useState(null)
  const [selectedApplications, setSelectedApplications] = useState(new Set())

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
      await loadApplications(currentUser.id)
    } catch (error) {
      console.error("Erreur auth:", error)
      toast.error("Erreur d'authentification")
    } finally {
      setLoading(false)
    }
  }

  const loadApplications = async (ownerId) => {
    try {
      const response = await fetch(`/api/applications?owner_id=${ownerId}`)
      if (response.ok) {
        const data = await response.json()
        console.log("Applications chargées:", data.applications)

        // Récupérer les données du dossier de location pour chaque candidature
        const applicationsWithRentalFiles = await Promise.all(
          (data.applications || []).map(async (app) => {
            try {
              if (app.tenant_id) {
                const rentalFileResponse = await fetch(`/api/rental-files?tenant_id=${app.tenant_id}`)
                if (rentalFileResponse.ok) {
                  const rentalFileData = await rentalFileResponse.json()
                  if (rentalFileData.rental_file) {
                    // Enrichir l'application avec les données du dossier de location
                    const mainTenant = rentalFileData.rental_file.main_tenant || {}
                    const income = mainTenant.income_sources?.work_income?.amount || app.income || 0
                    const hasGuarantor = rentalFileData.rental_file.guarantors?.length > 0 || app.has_guarantor || false
                    const profession = mainTenant.profession || app.profession || "Non spécifié"
                    const contractType = mainTenant.contract_type || app.contract_type || "Non spécifié"

                    return {
                      ...app,
                      income,
                      has_guarantor: hasGuarantor,
                      profession,
                      contract_type: contractType,
                      rental_file_id: rentalFileData.rental_file.id,
                    }
                  }
                }
              }
              return app
            } catch (error) {
              console.error("Erreur récupération dossier location:", error)
              return app
            }
          }),
        )

        setApplications(applicationsWithRentalFiles)
      } else {
        console.error("Erreur chargement candidatures:", await response.text())
        toast.error("Erreur lors du chargement des candidatures")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du chargement des candidatures")
    }
  }

  const getFilteredApplications = () => {
    if (activeTab === "all") return applications

    // Mapper les statuts de l'interface vers les statuts en base de données
    const statusMap = {
      pending: ["pending", "analyzing", "visit_scheduled", "waiting_tenant_confirmation"],
      accepted: ["accepted", "approved"],
      rejected: ["rejected"],
    }

    return applications.filter((app) => {
      const status = app.status || "pending"
      return statusMap[activeTab]?.includes(status)
    })
  }

  const handleApplicationAction = async (action, applicationId) => {
    console.log("Action:", action, "pour candidature:", applicationId)

    const application = applications.find((app) => app.id === applicationId)
    if (!application) {
      toast.error("Candidature introuvable")
      return
    }

    switch (action) {
      case "view_details":
        // Rediriger vers la visionneuse de dossier PDF
        if (application.rental_file_id) {
          router.push(`/rental-files/${application.rental_file_id}/view`)
        } else {
          toast.error("Dossier de location non disponible")
        }
        break
      case "analyze":
        // Rediriger vers la page de détails de la candidature
        router.push(`/owner/applications/${applicationId}`)
        break
      case "accept":
        await handleStatusChange(applicationId, "accepted")
        break
      case "refuse":
        await handleStatusChange(applicationId, "rejected")
        break
      case "contact":
        // Rediriger vers la messagerie avec ce locataire
        if (application.tenant_id) {
          router.push(`/owner/messaging?tenant_id=${application.tenant_id}`)
        } else {
          toast.error("Impossible de contacter ce locataire")
        }
        break
      case "generate_lease":
        router.push(`/owner/leases/new?application=${applicationId}`)
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
        // Mettre à jour l'état local
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

  // Fonction pour calculer le score de matching de manière sécurisée
  const calculateMatchScore = (application) => {
    if (!application.property || !application.income) return 50 // Score par défaut

    const property = application.property
    let score = 0

    // Ratio revenus/loyer (40 points max)
    if (application.income && property.price) {
      const rentRatio = application.income / property.price
      if (rentRatio >= 3) score += 40
      else if (rentRatio >= 2.5) score += 30
      else if (rentRatio >= 2) score += 20
      else score += 10
    } else {
      score += 10
    }

    // Stabilité professionnelle (20 points max)
    if (application.contract_type === "CDI") score += 20
    else if (application.contract_type === "CDD") score += 15
    else score += 10

    // Présence d'un garant (20 points max)
    if (application.has_guarantor) score += 20

    // Documents et présentation (20 points max)
    if (application.presentation && application.presentation.length > 50) score += 10
    if (application.profession && application.company) score += 10

    return Math.min(score, 100)
  }

  const getStatusConfig = (status) => {
    switch (status) {
      case "pending":
        return {
          label: "Nouveau",
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          message: "Analysez le dossier et proposez une visite ou refusez la candidature.",
          actions: ["analyze", "refuse", "contact"],
        }
      case "analyzing":
        return {
          label: "En cours d'analyse",
          color: "text-orange-600",
          bgColor: "bg-orange-50",
          message: "Complétez l'analyse du dossier pour prendre une décision.",
          actions: ["accept", "contact"],
        }
      case "visit_scheduled":
        return {
          label: "Visite programée",
          color: "text-purple-600",
          bgColor: "bg-purple-50",
          message: "Une visite est programmée. Vous pourrez accepter ou refuser après la visite.",
          actions: ["accept", "refuse", "contact"],
        }
      case "waiting_tenant_confirmation":
        return {
          label: "En attente d'acceptation",
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          message: "Le locataire doit confirmer son choix pour cet appartement.",
          actions: ["contact"],
        }
      case "accepted":
      case "approved":
        return {
          label: "Candidature acceptée",
          color: "text-green-600",
          bgColor: "bg-green-50",
          message: "La candidature a été acceptée. Vous pouvez maintenant générer le bail.",
          actions: ["generate_lease", "contact"],
        }
      case "rejected":
        return {
          label: "Dossier refusé",
          color: "text-red-600",
          bgColor: "bg-red-50",
          message: "Cette candidature a été refusée.",
          actions: ["contact"],
        }
      default:
        return {
          label: status,
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          message: "",
          actions: ["contact"],
        }
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
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <PageHeader title="Candidatures" description="Gérez les candidatures pour vos biens">
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtres
          </Button>
        </div>
      </PageHeader>

      <div className="p-6 space-y-6">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="pending">En attente</TabsTrigger>
            <TabsTrigger value="accepted">Acceptées</TabsTrigger>
            <TabsTrigger value="rejected">Refusées</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {getFilteredApplications().length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Aucune candidature</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {activeTab === "all"
                      ? "Vous n'avez pas encore reçu de candidatures"
                      : `Vous n'avez pas de candidatures ${
                          activeTab === "pending" ? "en attente" : activeTab === "accepted" ? "acceptées" : "refusées"
                        }`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-1">
                {getFilteredApplications().map((application) => {
                  // Gestion sécurisée des données du tenant
                  const tenant = application.tenant || {}
                  const property = application.property || {}

                  // Calcul du score de matching
                  const matchScore = calculateMatchScore(application)

                  // Préparation des données pour le composant ModernApplicationCard
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
                    },
                    profession: application.profession || "Non spécifié",
                    income: application.income || 0,
                    has_guarantor: application.has_guarantor || false,
                    documents_complete: true, // Valeur par défaut
                    status: application.status || "pending",
                    match_score: matchScore,
                    created_at: application.created_at || new Date().toISOString(),
                  }

                  return (
                    <ModernApplicationCard
                      key={application.id}
                      application={applicationData}
                      isSelected={selectedApplications.has(application.id)}
                      onSelect={(selected) => handleSelectApplication(application.id, selected)}
                      onAction={(action) => handleApplicationAction(action, application.id)}
                    />
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
