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
import { Filter, Download, Users } from "lucide-react"

// Version simplifiée de la carte d'application pour éviter les erreurs
function SimpleApplicationCard({ application, onStatusChange }) {
  const formatDate = (dateString) => {
    if (!dateString) return "Non spécifié"
    try {
      return new Date(dateString).toLocaleDateString()
    } catch (e) {
      return "Date invalide"
    }
  }

  const formatAmount = (amount) => {
    if (amount === null || amount === undefined) return "Non spécifié"
    try {
      return Number(amount).toLocaleString("fr-FR", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      })
    } catch (e) {
      return "Montant invalide"
    }
  }

  // Récupération sécurisée des données
  const property = application.property || {}
  const tenant = application.tenant || {}

  // Valeurs par défaut pour éviter les erreurs
  const propertyTitle = property.title || "Propriété inconnue"
  const propertyAddress = property.address || "Adresse inconnue"
  const tenantName = tenant.first_name ? `${tenant.first_name} ${tenant.last_name || ""}` : "Locataire inconnu"
  const profession = application.profession || "Non spécifié"
  const income = formatAmount(application.income)
  const createdAt = formatDate(application.created_at)
  const status = application.status || "pending"

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">{propertyTitle}</h3>
              <p className="text-sm text-muted-foreground">{propertyAddress}</p>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                status === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : status === "approved"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
              }`}
            >
              {status === "pending" ? "En attente" : status === "approved" ? "Acceptée" : "Refusée"}
            </div>
          </div>

          <div className="border-t border-b py-3">
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-medium">Candidat</p>
                <p className="text-sm">{tenantName}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Profession</p>
                <p className="text-sm">{profession}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Revenus</p>
                <p className="text-sm">{income}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">Candidature reçue le {createdAt}</div>
            <div className="space-x-2">
              <Button
                size="sm"
                variant={status === "approved" ? "default" : "outline"}
                onClick={() => onStatusChange("approved")}
                disabled={status === "approved"}
              >
                Accepter
              </Button>
              <Button
                size="sm"
                variant={status === "rejected" ? "destructive" : "outline"}
                onClick={() => onStatusChange("rejected")}
                disabled={status === "rejected"}
              >
                Refuser
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ApplicationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState([])
  const [activeTab, setActiveTab] = useState("all")
  const [user, setUser] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      setLoading(true)
      setError(null)
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
      setError("Erreur d'authentification: " + error.message)
      toast.error("Erreur d'authentification")
    } finally {
      setLoading(false)
    }
  }

  const loadApplications = async (ownerId) => {
    try {
      console.log("Chargement des candidatures pour le propriétaire:", ownerId)
      const response = await fetch(`/api/applications?owner_id=${ownerId}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Erreur chargement candidatures:", errorText)
        setError("Erreur lors du chargement des candidatures: " + errorText)
        toast.error("Erreur lors du chargement des candidatures")
        return
      }

      const data = await response.json()
      console.log("Applications chargées:", data)

      if (!data.applications) {
        console.error("Format de réponse invalide:", data)
        setError("Format de réponse invalide")
        return
      }

      setApplications(data.applications || [])
    } catch (error) {
      console.error("Erreur:", error)
      setError("Erreur: " + error.message)
      toast.error("Erreur lors du chargement des candidatures")
    }
  }

  const getFilteredApplications = () => {
    if (activeTab === "all") return applications
    return applications.filter((app) => app.status === activeTab)
  }

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: applicationId,
          status: newStatus,
        }),
      })

      if (response.ok) {
        toast.success(`Candidature ${newStatus === "approved" ? "acceptée" : "refusée"}`)
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

  if (error) {
    return (
      <div className="p-6">
        <PageHeader title="Erreur" description="Une erreur est survenue lors du chargement des candidatures">
          <Button onClick={checkAuthAndLoadData}>Réessayer</Button>
        </PageHeader>
        <Card className="mt-6">
          <CardContent className="p-6">
            <pre className="whitespace-pre-wrap text-red-500">{error}</pre>
          </CardContent>
        </Card>
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
                  <SimpleApplicationCard
                    key={application.id}
                    application={application}
                    onStatusChange={(status) => handleStatusChange(application.id, status)}
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
