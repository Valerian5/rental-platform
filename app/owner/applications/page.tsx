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
import { Filter, Download, Users, CheckCircle, XCircle, Clock } from "lucide-react"

export default function ApplicationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState([])
  const [activeTab, setActiveTab] = useState("all")
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
        setApplications(data.applications || [])
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
    return applications.filter((app) => app.status === activeTab)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "approved":
        return <CheckCircle className="h-4 w-4" />
      case "rejected":
        return <XCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  // Fonction sécurisée pour formater les dates
  const formatDate = (dateString) => {
    if (!dateString) return "Non spécifié"

    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    } catch (error) {
      console.error("Erreur formatage date:", error)
      return "Date invalide"
    }
  }

  // Fonction sécurisée pour formater les montants
  const formatAmount = (amount) => {
    if (amount === null || amount === undefined) return "Non spécifié"

    try {
      return Number(amount).toLocaleString("fr-FR", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      })
    } catch (error) {
      console.error("Erreur formatage montant:", error)
      return "Montant invalide"
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
            <TabsTrigger value="approved">Acceptées</TabsTrigger>
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
                          activeTab === "pending" ? "en attente" : activeTab === "approved" ? "acceptées" : "refusées"
                        }`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {getFilteredApplications().map((application) => (
                  <ModernApplicationCard
                    key={application.id}
                    application={{
                      id: application.id,
                      propertyTitle: application.property?.title || "Propriété inconnue",
                      propertyAddress: application.property?.address || "Adresse inconnue",
                      propertyImage: application.property?.images?.[0] || "/placeholder.svg",
                      tenantName: `${application.tenant?.first_name || "Prénom"} ${
                        application.tenant?.last_name || "Nom"
                      }`,
                      tenantEmail: application.tenant?.email || "Email non disponible",
                      tenantPhone: application.tenant?.phone || "Téléphone non disponible",
                      tenantAvatar: application.tenant?.avatar_url || "/placeholder.svg?height=40&width=40",
                      profession: application.profession || "Non spécifié",
                      company: application.company || "Non spécifié",
                      income: formatAmount(application.income),
                      message: application.message || application.presentation || "Pas de message",
                      status: application.status || "pending",
                      matchScore: application.match_score || 0,
                      createdAt: formatDate(application.created_at),
                      moveInDate: formatDate(application.move_in_date),
                      hasGuarantor: application.has_guarantor || false,
                    }}
                    onStatusChange={(status) => {
                      console.log("Changement de statut:", status)
                      // Implémenter la mise à jour du statut
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
