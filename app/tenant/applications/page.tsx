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
import { TenantVisitSlotSelector } from "@/components/tenant-visit-slot-selector"
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
import { TenantApplicationConfirmBanner } from "@/components/tenant-application-confirm-banner"

interface Application {
  id: string
  status: string
  created_at: string
  updated_at: string
  presentation?: string
  tenant: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone?: string
  }
  property: {
    id: string
    title: string
    address: string
    city: string
    postal_code: string
    price: number
    bedrooms?: number
    bathrooms?: number
    surface?: number
    property_images?: Array<{
      id: string
      url: string
      is_primary: boolean
    }>
    owner?: {
      id: string
      first_name: string
      last_name: string
      email: string
    }
  }
  proposed_visit_slots?: Array<{
    id: string
    start_time: string
    end_time: string
    date: string
    is_available: boolean
    max_capacity: number
    current_bookings: number
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
  const [visitSlotDialog, setVisitSlotDialog] = useState<{
    isOpen: boolean
    application: Application | null
  }>({
    isOpen: false,
    application: null,
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
      console.log("🔍 Données reçues:", data)

      setApplications(data.applications || [])
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du chargement des candidatures")
    }
  }

  const handleOpenVisitSlotSelector = (application: Application) => {
    setVisitSlotDialog({
      isOpen: true,
      application,
    })
  }

  const handleSlotSelected = async (slotId: string) => {
    // Fermer le dialog
    setVisitSlotDialog({
      isOpen: false,
      application: null,
    })

    // Recharger les candidatures
    if (user) {
      await loadApplications(user.id)
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
        return "Bonne nouvelle ! Le propriétaire vous propose des créneaux de visite. Cliquez sur le bouton ci-dessous pour choisir votre créneau."
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
    // Vérification de sécurité pour éviter l'erreur
    if (
      !property ||
      !property.property_images ||
      !Array.isArray(property.property_images) ||
      property.property_images.length === 0
    ) {
      return "/placeholder.svg?height=150&width=200&text=Pas+d'image"
    }

    const mainImage = property.property_images.find((img) => img.is_primary)
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
              <div key={application.id} className="space-y-3">
                {/* ta carte existante, ex ModernApplicationCard */}
                <TenantApplicationConfirmBanner
                  applicationId={application.id}
                  propertyTitle={application.property?.title || "Ce logement"}
                  ownerName={application.property?.owner
                    ? `${application.property.owner.first_name} ${application.property.owner.last_name}`
                    : undefined}
                />
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="grid md:grid-cols-4 gap-0">
                      {/* Image du bien - taille réduite */}
                      <div className="relative">
                        <div className="aspect-video md:aspect-[4/3] relative overflow-hidden">
                          <img
                            src={getMainImage(application.property) || "/placeholder.svg"}
                            alt={application.property?.title || "Propriété"}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2">{getStatusBadge(application.status)}</div>
                        </div>
                      </div>

                      {/* Contenu principal - plus d'espace */}
                      <div className="md:col-span-3 p-6">
                        <div className="flex flex-col h-full">
                          {/* En-tête */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="text-xl font-semibold mb-2">
                                  {application.property?.title || "Propriété inconnue"}
                                </h3>
                                <div className="flex items-center text-muted-foreground mb-2">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  <span className="text-sm">
                                    {application.property?.address || "Adresse inconnue"},{" "}
                                    {application.property?.city || ""} {application.property?.postal_code || ""}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                  {application.property?.bedrooms && (
                                    <div className="flex items-center gap-1">
                                      <Bed className="h-4 w-4" />
                                      <span>{application.property.bedrooms} ch.</span>
                                    </div>
                                  )}
                                  {application.property?.bathrooms && (
                                    <div className="flex items-center gap-1">
                                      <Bath className="h-4 w-4" />
                                      <span>{application.property.bathrooms} sdb</span>
                                    </div>
                                  )}
                                  {application.property?.surface && (
                                    <div className="flex items-center gap-1">
                                      <Square className="h-4 w-4" />
                                      <span>{application.property.surface} m²</span>
                                    </div>
                                  )}
                                </div>
                                <p className="text-2xl font-bold text-green-600">
                                  {formatAmount(application.property?.price || 0)}
                                  <span className="text-sm font-normal text-muted-foreground">/mois</span>
                                </p>
                              </div>
                            </div>

                            {/* Message de statut */}
                            <Alert className="mb-4">
                              <AlertDescription>{getStatusMessage(application)}</AlertDescription>
                            </Alert>

                            {application.status === "waiting_tenant_confirmation" && (
                              <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-4">
                                <p className="font-medium">
                                  Félicitations, votre dossier a été retenu
                                  {application.property?.title ? <> pour “{application.property.title}”</> : null}
                                  {application.property?.owner
                                    ? <> par {application.property.owner.first_name} {application.property.owner.last_name}</>
                                    : null}
                                  .
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  Veuillez confirmer votre choix pour que le propriétaire puisse créer le bail dès maintenant.
                                </p>

                                <div className="mt-3 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                                    onClick={async () => {
                                      try {
                                        const res = await fetch(`/api/applications/${application.id}/tenant-decision`, {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ decision: "accept" }),
                                        })
                                        if (!res.ok) throw new Error()
                                        location.reload()
                                      } catch {
                                        // toast si tu utilises sonner
                                      }
                                    }}
                                  >
                                    Je confirme mon choix
                                  </button>

                                  <TenantRefuseWithReason applicationId={application.id} />
                                </div>
                              </div>
                            )}

                            {/* Bouton pour choisir un créneau de visite */}
                            {application.status === "visit_proposed" &&
                              application.proposed_visit_slots &&
                              application.proposed_visit_slots.length > 0 && (
                                <div className="mb-4">
                                  <Button
                                    onClick={() => handleOpenVisitSlotSelector(application)}
                                    className="w-full"
                                    size="lg"
                                  >
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Choisir un créneau de visite
                                    <Badge variant="secondary" className="ml-2">
                                      {application.proposed_visit_slots.length} disponible
                                      {application.proposed_visit_slots.length > 1 ? "s" : ""}
                                    </Badge>
                                  </Button>
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
                              onClick={() => router.push(`/properties/${application.property?.id}`)}
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
                                    propertyTitle: application.property?.title || "Propriété",
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de sélection de créneaux de visite */}
      <Dialog
        open={visitSlotDialog.isOpen}
        onOpenChange={(open) => !open && setVisitSlotDialog({ isOpen: false, application: null })}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choisir un créneau de visite</DialogTitle>
            <DialogDescription>
              Sélectionnez le créneau qui vous convient le mieux pour visiter ce logement.
            </DialogDescription>
          </DialogHeader>
          {visitSlotDialog.application && (
            <TenantVisitSlotSelector
              applicationId={visitSlotDialog.application.id}
              propertyTitle={visitSlotDialog.application.property?.title || "Propriété"}
              propertyAddress={`${visitSlotDialog.application.property?.address || ""}, ${visitSlotDialog.application.property?.city || ""}`}
              ownerName="Propriétaire" // TODO: récupérer le nom du propriétaire
              onSlotSelected={handleSlotSelected}
              onCancel={() => setVisitSlotDialog({ isOpen: false, application: null })}
            />
          )}
        </DialogContent>
      </Dialog>

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

function TenantRefuseWithReason({ applicationId }: { applicationId: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/applications/${applicationId}/tenant-decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "refuse", reason }),
      })
      if (!res.ok) throw new Error()
      setOpen(false)
      location.reload()
    } catch {
      // toast si besoin
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
        onClick={() => setOpen(true)}
      >
        Refuser
      </button>

      {open && (
        <div className="mt-3 w-full rounded-md border bg-white p-3">
          <p className="text-sm font-medium">Motif (optionnel)</p>
          <textarea
            className="mt-2 w-full rounded-md border p-2 text-sm"
            rows={2}
            maxLength={180}
            placeholder="J'ai eu une autre réponse positive, etc."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className="inline-flex items-center rounded-md bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200"
              onClick={() => setOpen(false)}
            >
              Annuler
            </button>
            <button
              type="button"
              className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              disabled={loading}
              onClick={submit}
            >
              {loading ? "Envoi..." : "Envoyer le refus"}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
