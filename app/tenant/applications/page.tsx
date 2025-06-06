"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Calendar, Clock, FileText, Search, MapPin, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { authService } from "@/lib/auth-service"

interface Application {
  id: string
  status: string
  created_at: string
  updated_at: string
  income: number
  profession: string
  property: {
    id: string
    title: string
    address: string
    city: string
    price: number
    property_images: Array<{ id: string; url: string; is_primary: boolean }>
  }
  proposed_visit_slots?: Array<{
    id: string
    date: string
    start_time: string
    end_time: string
  }>
  visits?: Array<{
    id: string
    visit_date: string
    start_time: string
    end_time: string
    status: string
  }>
}

export default function TenantApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortOrder, setSortOrder] = useState("date-desc")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [showSlotDialog, setShowSlotDialog] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<string>("")
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    try {
      setLoading(true)
      const user = await authService.getCurrentUser()
      if (!user || user.user_type !== "tenant") {
        toast.error("Vous devez être connecté en tant que locataire")
        return
      }

      setCurrentUser(user)
      console.log("🔍 Chargement candidatures pour:", user.id)

      const response = await fetch(`/api/applications?tenant_id=${user.id}`, {
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("📊 Réponse API:", response.status, data)
        setApplications(data.applications || [])
      } else {
        const errorData = await response.json()
        console.error("❌ Erreur API:", response.status, errorData)
        toast.error(errorData.error || "Erreur lors du chargement")
      }
    } catch (error) {
      console.error("❌ Erreur chargement candidatures:", error)
      toast.error("Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }

  const handleChooseVisitSlot = async (applicationId: string, slotId: string) => {
    try {
      console.log("📅 Choix du créneau:", { applicationId, slotId })

      const response = await fetch(`/api/applications/${applicationId}/choose-visit-slot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slot_id: slotId }),
      })

      if (response.ok) {
        toast.success("Créneau de visite confirmé !")
        setShowSlotDialog(false)
        setSelectedSlot("")
        // Recharger les candidatures
        await loadApplications()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Erreur lors de la confirmation")
      }
    } catch (error) {
      console.error("❌ Erreur choix créneau:", error)
      toast.error("Erreur lors de la confirmation du créneau")
    }
  }

  const handleWithdrawApplication = async (applicationId: string) => {
    try {
      console.log("🗑️ Retrait candidature:", applicationId)

      const response = await fetch(`/api/applications?id=${applicationId}&tenant_id=${currentUser.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        toast.success("Candidature retirée avec succès")
        // Recharger les candidatures
        await loadApplications()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Erreur lors du retrait")
      }
    } catch (error) {
      console.error("❌ Erreur retrait candidature:", error)
      toast.error("Erreur lors du retrait de la candidature")
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary"
      case "under_review":
        return "secondary"
      case "visit_proposed":
        return "default"
      case "visit_scheduled":
        return "default"
      case "accepted":
        return "default"
      case "rejected":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "En attente"
      case "under_review":
        return "En cours d'analyse"
      case "visit_proposed":
        return "Créneaux proposés"
      case "visit_scheduled":
        return "Visite programmée"
      case "accepted":
        return "Dossier accepté"
      case "rejected":
        return "Refusé"
      default:
        return status
    }
  }

  const canWithdrawApplication = (status: string) => {
    return ["pending", "under_review", "visit_proposed"].includes(status)
  }

  // Filtrer les candidatures
  const filteredApplications = applications.filter((application) => {
    if (statusFilter !== "all" && application.status !== statusFilter) {
      return false
    }
    if (searchQuery && !application.property.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })

  // Trier les candidatures
  const sortedApplications = [...filteredApplications].sort((a, b) => {
    if (sortOrder === "date-desc") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    } else if (sortOrder === "date-asc") {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    }
    return 0
  })

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Chargement de vos candidatures...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Mes candidatures</h1>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="w-full md:w-1/2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher par nom de bien..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="under_review">En cours d'analyse</SelectItem>
              <SelectItem value="visit_proposed">Créneaux proposés</SelectItem>
              <SelectItem value="visit_scheduled">Visite programmée</SelectItem>
              <SelectItem value="accepted">Dossier accepté</SelectItem>
              <SelectItem value="rejected">Refusé</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Date (plus récent)</SelectItem>
              <SelectItem value="date-asc">Date (plus ancien)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-6">
        {sortedApplications.length > 0 ? (
          sortedApplications.map((application) => {
            const primaryImage =
              application.property.property_images?.find((img) => img.is_primary) ||
              application.property.property_images?.[0]

            return (
              <Card key={application.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-1/3 h-48 md:h-auto">
                      <img
                        src={primaryImage?.url || "/placeholder.svg?height=200&width=300&text=Pas d'image"}
                        alt={application.property.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg?height=200&width=300&text=Image non disponible"
                        }}
                      />
                    </div>
                    <div className="flex-1 p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h2 className="text-xl font-semibold">{application.property.title}</h2>
                          <div className="flex items-center text-muted-foreground mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>
                              {application.property.address}, {application.property.city}
                            </span>
                          </div>
                        </div>
                        <Badge variant={getStatusBadgeVariant(application.status)}>
                          {getStatusLabel(application.status)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-start">
                          <FileText className="h-5 w-5 mr-2 text-blue-600" />
                          <div>
                            <p className="font-medium">Candidature</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(application.created_at).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <Clock className="h-5 w-5 mr-2 text-blue-600" />
                          <div>
                            <p className="font-medium">Dernière mise à jour</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(application.updated_at).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="mr-2 flex items-center">
                            <span className="font-medium mr-2">Loyer</span>
                            <span className="text-lg font-bold">{application.property.price} €/mois</span>
                          </div>
                        </div>
                      </div>

                      {/* Créneaux proposés */}
                      {application.status === "visit_proposed" && application.proposed_visit_slots && (
                        <div className="bg-blue-50 p-4 rounded-md mb-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 text-blue-600 mr-2" />
                              <span className="font-medium text-blue-800">Créneaux de visite proposés</span>
                            </div>
                            <Dialog open={showSlotDialog} onOpenChange={setShowSlotDialog}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedApplication(application)
                                    setSelectedSlot("")
                                  }}
                                >
                                  Choisir un créneau
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Choisir un créneau de visite</DialogTitle>
                                  <DialogDescription>
                                    Sélectionnez le créneau qui vous convient le mieux pour visiter{" "}
                                    {selectedApplication?.property.title}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-3">
                                  {selectedApplication?.proposed_visit_slots?.map((slot) => (
                                    <div
                                      key={slot.id}
                                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                        selectedSlot === slot.id
                                          ? "border-blue-500 bg-blue-50"
                                          : "border-gray-200 hover:border-gray-300"
                                      }`}
                                      onClick={() => setSelectedSlot(slot.id)}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="font-medium">
                                            {new Date(slot.date).toLocaleDateString("fr-FR", {
                                              weekday: "long",
                                              day: "numeric",
                                              month: "long",
                                              year: "numeric",
                                            })}
                                          </p>
                                          <p className="text-sm text-gray-600">
                                            {slot.start_time} - {slot.end_time}
                                          </p>
                                        </div>
                                        <div
                                          className={`w-4 h-4 rounded-full border-2 ${
                                            selectedSlot === slot.id ? "border-blue-500 bg-blue-500" : "border-gray-300"
                                          }`}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex justify-end gap-2 pt-4">
                                  <Button variant="outline" onClick={() => setShowSlotDialog(false)}>
                                    Annuler
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      selectedApplication &&
                                      selectedSlot &&
                                      handleChooseVisitSlot(selectedApplication.id, selectedSlot)
                                    }
                                    disabled={!selectedSlot}
                                  >
                                    Confirmer ce créneau
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                          <div className="text-sm text-blue-700">
                            Le propriétaire vous a proposé {application.proposed_visit_slots.length} créneau(x) de
                            visite. Cliquez sur "Choisir un créneau" pour sélectionner celui qui vous convient.
                          </div>
                        </div>
                      )}

                      {/* Visite programmée */}
                      {application.status === "visit_scheduled" &&
                        application.visits &&
                        application.visits.length > 0 && (
                          <div className="bg-green-50 p-3 rounded-md mb-4">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 text-green-600 mr-2" />
                              <span className="font-medium text-green-800">Visite confirmée</span>
                            </div>
                            {application.visits.map((visit) => (
                              <p key={visit.id} className="text-sm text-green-700 mt-1">
                                Le{" "}
                                {new Date(visit.visit_date).toLocaleDateString("fr-FR", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })}{" "}
                                de {visit.start_time} à {visit.end_time}
                              </p>
                            ))}
                          </div>
                        )}

                      {/* Statut visit_scheduled sans visite */}
                      {application.status === "visit_scheduled" &&
                        (!application.visits || application.visits.length === 0) && (
                          <div className="bg-orange-50 p-3 rounded-md mb-4">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 text-orange-600 mr-2" />
                              <span className="font-medium text-orange-800">Problème de synchronisation</span>
                            </div>
                            <p className="text-sm text-orange-700 mt-1">
                              Votre candidature indique qu'une visite est programmée mais aucune visite n'est trouvée.
                              Contactez le propriétaire pour clarifier.
                            </p>
                          </div>
                        )}

                      {application.status === "accepted" && (
                        <div className="bg-green-50 p-3 rounded-md mb-4">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 text-green-600 mr-2" />
                            <span className="font-medium text-green-800">
                              Félicitations ! Votre dossier a été accepté
                            </span>
                          </div>
                          <p className="text-sm text-green-700 mt-1">
                            Le propriétaire a accepté votre candidature. Vous allez bientôt recevoir le bail à signer.
                          </p>
                        </div>
                      )}

                      {application.status === "rejected" && (
                        <div className="bg-red-50 p-3 rounded-md mb-4">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 text-red-600 mr-2" />
                            <span className="font-medium text-red-800">Candidature refusée</span>
                          </div>
                          <p className="text-sm text-red-700 mt-1">
                            Votre candidature n'a pas été retenue pour ce bien.
                          </p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 justify-end">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/properties/${application.property.id}`}>Voir l'annonce</Link>
                        </Button>
                        <Button variant="outline" size="sm">
                          Contacter le propriétaire
                        </Button>
                        {canWithdrawApplication(application.status) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Retirer ma candidature
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Retirer votre candidature</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir retirer votre candidature pour "{application.property.title}"
                                  ? Cette action est irréversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleWithdrawApplication(application.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Retirer ma candidature
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        {application.status === "visit_scheduled" && (
                          <Button size="sm" asChild>
                            <Link href="/tenant/visits">Voir mes visites</Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="text-center py-12">
            <div className="bg-gray-100 p-6 rounded-full inline-block mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucune candidature trouvée</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== "all"
                ? "Aucune candidature ne correspond à vos critères de recherche."
                : "Vous n'avez pas encore postulé à des annonces."}
            </p>
            <Button asChild>
              <Link href="/tenant/search">Rechercher des biens</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
