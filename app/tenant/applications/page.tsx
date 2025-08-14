"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { authService } from "@/lib/auth-service"
import { PageHeader } from "@/components/page-header"
import {
  ArrowLeft,
  Calendar,
  Clock,
  Building,
  MapPin,
  Bed,
  Bath,
  Square,
  Eye,
  Trash2,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  CalendarCheck,
} from "lucide-react"

interface Application {
  id: string
  status: string
  created_at: string
  updated_at: string
  presentation?: string
  property: {
    id: string
    title: string
    address: string
    city: string
    postal_code: string
    rent: number
    bedrooms?: number
    bathrooms?: number
    surface_area?: number
    property_images?: Array<{
      id: string
      url: string
      is_main: boolean
    }>
  }
  visit_slots?: Array<{
    id: string
    start_time: string
    end_time: string
    date: string
    is_available: boolean
  }>
  proposed_visit_slots?: Array<{
    id: string
    start_time: string
    end_time: string
    date: string
    is_available: boolean
  }>
}

export default function TenantApplicationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<Application[]>([])
  const [user, setUser] = useState<any>(null)
  const [withdrawDialog, setWithdrawDialog] = useState<{
    isOpen: boolean
    applicationId: string | null
    propertyTitle: string
  }>({
    isOpen: false,
    applicationId: null,
    propertyTitle: "",
  })
  const [loadingActions, setLoadingActions] = useState<{ [key: string]: boolean }>({})

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

      if (currentUser.user_type !== "tenant") {
        toast.error("Accès réservé aux locataires")
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

  const loadApplications = async (tenantId: string) => {
    try {
      console.log("🔍 Chargement candidatures pour:", tenantId)

      const response = await fetch(`/api/applications/tenant?tenant_id=${tenantId}`)
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des candidatures")
      }

      const data = await response.json()
      console.log("✅ Candidatures chargées:", data.applications?.length || 0)

      setApplications(data.applications || [])
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du chargement des candidatures")
    }
  }

  const handleChooseVisitSlot = async (applicationId: string, slotId: string) => {
    try {
      setLoadingActions((prev) => ({ ...prev, [slotId]: true }))

      const response = await fetch(`/api/applications/${applicationId}/choose-visit-slot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slot_id: slotId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de la sélection du créneau")
      }

      const data = await response.json()
      toast.success(data.message || "Créneau sélectionné avec succès")

      // Recharger les candidatures
      if (user) {
        await loadApplications(user.id)
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de la sélection du créneau")
    } finally {
      setLoadingActions((prev) => ({ ...prev, [slotId]: false }))
    }
  }

  const handleWithdrawApplication = async () => {
    if (!withdrawDialog.applicationId) return

    try {
      setLoadingActions((prev) => ({ ...prev, withdraw: true }))

      const response = await fetch(`/api/applications/${withdrawDialog.applicationId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors du retrait de la candidature")
      }

      const data = await response.json()
      toast.success(data.message || "Candidature retirée avec succès")
      setWithdrawDialog({ isOpen: false, applicationId: null, propertyTitle: "" })

      // Recharger les candidatures
      if (user) {
        await loadApplications(user.id)
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error(error instanceof Error ? error.message : "Erreur lors du retrait de la candidature")
    } finally {
      setLoadingActions((prev) => ({ ...prev, withdraw: false }))
    }
  }

  const formatDate = (dateString: string) => {
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

  const formatDateTime = (dateString: string, timeString: string) => {
    try {
      const date = new Date(dateString)
      const [hours, minutes] = timeString.split(":")
      return {
        date: date.toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        }),
        time: `${hours}:${minutes}`,
      }
    } catch (e) {
      return { date: "Date invalide", time: "Heure invalide" }
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        )
      case "analyzing":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            <RefreshCw className="h-3 w-3 mr-1" />
            En analyse
          </Badge>
        )
      case "visit_proposed":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            <Calendar className="h-3 w-3 mr-1" />
            Visite proposée
          </Badge>
        )
      case "visit_scheduled":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CalendarCheck className="h-3 w-3 mr-1" />
            Visite planifiée
          </Badge>
        )
      case "accepted":
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Acceptée
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Refusée
          </Badge>
        )
      case "withdrawn":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <Trash2 className="h-3 w-3 mr-1" />
            Retirée
          </Badge>
        )
      default:
        return <Badge variant="outline">Statut inconnu</Badge>
    }
  }

  const getStatusMessage = (application: Application) => {
    switch (application.status) {
      case "pending":
        return "Votre candidature a été envoyée et est en attente d'examen par le propriétaire."
      case "analyzing":
        return "Le propriétaire examine actuellement votre dossier."
      case "visit_proposed":
        return "Bonne nouvelle ! Le propriétaire vous propose des créneaux de visite. Sélectionnez celui qui vous convient le mieux ci-dessous."
      case "visit_scheduled":
        return "Votre visite est confirmée ! Vous recevrez bientôt les détails par email."
      case "accepted":
      case "approved":
        return "Félicitations ! Votre candidature a été acceptée. Le propriétaire va vous contacter pour finaliser le bail."
      case "rejected":
        return "Malheureusement, votre candidature n'a pas été retenue pour ce logement."
      case "withdrawn":
        return "Vous avez retiré cette candidature."
      default:
        return "Statut de candidature inconnu."
    }
  }

  const canWithdraw = (status: string) => {
    return ["pending", "analyzing", "visit_proposed", "visit_scheduled"].includes(status)
  }

  const getMainImage = (property: Application["property"]) => {
    if (!property.property_images || property.property_images.length === 0) {
      return "/placeholder.svg?height=200&width=300&text=Pas+d'image"
    }

    const mainImage = property.property_images.find((img) => img.is_main)
    return mainImage ? mainImage.url : property.property_images[0].url
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Mes candidatures"
        description={`${applications.length} candidature${applications.length > 1 ? "s" : ""} envoyée${
          applications.length > 1 ? "s" : ""
        }`}
      >
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
      </PageHeader>

      <div className="p-6">
        {applications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune candidature</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Vous n'avez pas encore envoyé de candidature pour un logement.
              </p>
              <Button onClick={() => router.push("/tenant/search")}>
                <Building className="mr-2 h-4 w-4" />
                Rechercher un logement
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {applications.map((application) => (
              <Card key={application.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="grid md:grid-cols-3 gap-0">
                    {/* Image du bien */}
                    <div className="relative">
                      <div className="aspect-video md:aspect-square relative overflow-hidden">
                        <img
                          src={getMainImage(application.property) || "/placeholder.svg"}
                          alt={application.property.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3">{getStatusBadge(application.status)}</div>
                      </div>
                    </div>

                    {/* Contenu principal */}
                    <div className="md:col-span-2 p-6">
                      <div className="flex flex-col h-full">
                        {/* En-tête */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-semibold mb-2">{application.property.title}</h3>
                              <div className="flex items-center text-muted-foreground mb-2">
                                <MapPin className="h-4 w-4 mr-1" />
                                <span className="text-sm">
                                  {application.property.address}, {application.property.city}{" "}
                                  {application.property.postal_code}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                {application.property.bedrooms && (
                                  <div className="flex items-center gap-1">
                                    <Bed className="h-4 w-4" />
                                    <span>{application.property.bedrooms} ch.</span>
                                  </div>
                                )}
                                {application.property.bathrooms && (
                                  <div className="flex items-center gap-1">
                                    <Bath className="h-4 w-4" />
                                    <span>{application.property.bathrooms} sdb</span>
                                  </div>
                                )}
                                {application.property.surface_area && (
                                  <div className="flex items-center gap-1">
                                    <Square className="h-4 w-4" />
                                    <span>{application.property.surface_area} m²</span>
                                  </div>
                                )}
                              </div>
                              <p className="text-2xl font-bold text-green-600">
                                {formatAmount(application.property.rent)}
                                <span className="text-sm font-normal text-muted-foreground">/mois</span>
                              </p>
                            </div>
                          </div>

                          {/* Message de statut */}
                          <Alert className="mb-4">
                            <AlertDescription>{getStatusMessage(application)}</AlertDescription>
                          </Alert>

                          {/* Créneaux de visite */}
                          {application.status === "visit_proposed" &&
                            application.proposed_visit_slots &&
                            application.proposed_visit_slots.length > 0 && (
                              <div className="mb-4">
                                <h4 className="font-medium mb-3">Créneaux de visite proposés :</h4>
                                <div className="space-y-2">
                                  {application.proposed_visit_slots
                                    .filter((slot) => slot.is_available)
                                    .map((slot) => {
                                      const { date, time } = formatDateTime(slot.date, slot.start_time)
                                      const endTime = slot.end_time.split(":").slice(0, 2).join(":")
                                      return (
                                        <div
                                          key={slot.id}
                                          className="flex items-center justify-between p-3 border rounded-lg"
                                        >
                                          <div>
                                            <p className="font-medium capitalize">{date}</p>
                                            <p className="text-sm text-muted-foreground">
                                              {time} - {endTime}
                                            </p>
                                          </div>
                                          <Button
                                            onClick={() => handleChooseVisitSlot(application.id, slot.id)}
                                            disabled={loadingActions[slot.id]}
                                            size="sm"
                                          >
                                            {loadingActions[slot.id] ? (
                                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                              <Calendar className="h-4 w-4 mr-2" />
                                            )}
                                            Choisir ce créneau
                                          </Button>
                                        </div>
                                      )
                                    })}
                                </div>
                              </div>
                            )}

                          {/* Informations de candidature */}
                          <div className="text-sm text-muted-foreground mb-4">
                            <p>Candidature envoyée le {formatDate(application.created_at)}</p>
                            {application.updated_at !== application.created_at && (
                              <p>Dernière mise à jour le {formatDate(application.updated_at)}</p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t">
                          <Button
                            variant="outline"
                            onClick={() => router.push(`/properties/${application.property.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Voir le logement
                          </Button>

                          {canWithdraw(application.status) && (
                            <Button
                              variant="outline"
                              onClick={() =>
                                setWithdrawDialog({
                                  isOpen: true,
                                  applicationId: application.id,
                                  propertyTitle: application.property.title,
                                })
                              }
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Retirer
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de confirmation de retrait */}
      <Dialog
        open={withdrawDialog.isOpen}
        onOpenChange={(open) => !open && setWithdrawDialog({ isOpen: false, applicationId: null, propertyTitle: "" })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retirer votre candidature</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir retirer votre candidature pour "{withdrawDialog.propertyTitle}" ?
            </DialogDescription>
          </DialogHeader>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Cette action est irréversible. Vous devrez postuler à nouveau si vous changez d'avis.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setWithdrawDialog({ isOpen: false, applicationId: null, propertyTitle: "" })}
            >
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleWithdrawApplication} disabled={loadingActions.withdraw}>
              {loadingActions.withdraw ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Retirer la candidature
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
