"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { Calendar, MapPin, Euro, Clock, AlertTriangle, CheckCircle, XCircle, Eye, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

interface Application {
  id: string
  property_id: string
  status: "pending" | "accepted" | "rejected" | "visit_proposed" | "visit_scheduled" | "withdrawn"
  message?: string
  created_at: string
  updated_at: string
  visit_slots?: Array<{
    id: string
    date: string
    time: string
    available: boolean
  }>
  properties: {
    id: string
    title: string
    location: string
    price: number
    images: string[]
    bedrooms: number
    bathrooms: number
    surface_area: number
  }
}

export default function TenantApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [withdrawing, setWithdrawing] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      setLoading(true)

      // Récupérer l'utilisateur connecté
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        toast({
          title: "Erreur",
          description: "Vous devez être connecté pour voir vos candidatures",
          variant: "destructive",
        })
        return
      }

      // Récupérer les candidatures avec les informations des propriétés
      const { data, error } = await supabase
        .from("applications")
        .select(`
          id,
          property_id,
          status,
          message,
          created_at,
          updated_at,
          visit_slots,
          properties (
            id,
            title,
            location,
            price,
            images,
            bedrooms,
            bathrooms,
            surface_area
          )
        `)
        .eq("tenant_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Erreur récupération candidatures:", error)
        toast({
          title: "Erreur",
          description: "Impossible de récupérer vos candidatures",
          variant: "destructive",
        })
        return
      }

      setApplications(data || [])
    } catch (error) {
      console.error("Erreur:", error)
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            En analyse
          </Badge>
        )
      case "accepted":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Acceptée
          </Badge>
        )
      case "rejected":
        return <Badge variant="destructive">Refusée</Badge>
      case "visit_proposed":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            Visite proposée
          </Badge>
        )
      case "visit_scheduled":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800">
            Visite programmée
          </Badge>
        )
      case "withdrawn":
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            Retirée
          </Badge>
        )
      default:
        return <Badge variant="secondary">Statut inconnu</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "accepted":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "visit_proposed":
        return <Calendar className="h-4 w-4 text-blue-600" />
      case "visit_scheduled":
        return <Calendar className="h-4 w-4 text-purple-600" />
      case "withdrawn":
        return <XCircle className="h-4 w-4 text-gray-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />
    }
  }

  const handleWithdrawApplication = async (applicationId: string) => {
    try {
      setWithdrawing(applicationId)

      const { error } = await supabase
        .from("applications")
        .update({
          status: "withdrawn",
          updated_at: new Date().toISOString(),
        })
        .eq("id", applicationId)

      if (error) {
        console.error("Erreur retrait candidature:", error)
        toast({
          title: "Erreur",
          description: "Impossible de retirer votre candidature",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Candidature retirée",
        description: "Votre candidature a été retirée avec succès",
      })

      // Rafraîchir la liste
      fetchApplications()
    } catch (error) {
      console.error("Erreur:", error)
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive",
      })
    } finally {
      setWithdrawing(null)
    }
  }

  const handleChooseVisitSlot = async (applicationId: string, slotId: string) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}/choose-visit-slot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slot_id: slotId }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la sélection du créneau")
      }

      toast({
        title: "Créneau sélectionné",
        description: "Votre créneau de visite a été confirmé",
      })

      // Rafraîchir la liste
      fetchApplications()
    } catch (error) {
      console.error("Erreur sélection créneau:", error)
      toast({
        title: "Erreur",
        description: "Impossible de sélectionner ce créneau",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement de vos candidatures...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes candidatures</h1>
        <p className="text-gray-600">Suivez l'état de vos candidatures et gérez vos visites</p>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Eye className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune candidature</h3>
            <p className="text-gray-600 mb-4">Vous n'avez pas encore postulé à des logements.</p>
            <Button onClick={() => (window.location.href = "/tenant/search")}>Rechercher des logements</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {applications.map((application) => (
            <Card key={application.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{application.properties.title}</CardTitle>
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="text-sm">{application.properties.location}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Euro className="h-4 w-4 mr-1" />
                      <span className="font-semibold">{application.properties.price}€/mois</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(application.status)}
                      {getStatusBadge(application.status)}
                    </div>
                    <span className="text-sm text-gray-500">
                      Candidature du {new Date(application.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="grid grid-cols-3 gap-4 mb-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">{application.properties.bedrooms}</span> chambre
                    {application.properties.bedrooms > 1 ? "s" : ""}
                  </div>
                  <div>
                    <span className="font-medium">{application.properties.bathrooms}</span> salle
                    {application.properties.bathrooms > 1 ? "s" : ""} de bain
                  </div>
                  <div>
                    <span className="font-medium">{application.properties.surface_area}</span> m²
                  </div>
                </div>

                {/* Encart visite proposée */}
                {application.status === "visit_proposed" &&
                  application.visit_slots &&
                  application.visit_slots.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center mb-3">
                        <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                        <h4 className="font-semibold text-blue-900">Créneaux de visite proposés</h4>
                      </div>
                      <p className="text-blue-800 text-sm mb-3">
                        Le propriétaire vous propose plusieurs créneaux de visite. Choisissez celui qui vous convient le
                        mieux.
                      </p>
                      <div className="space-y-2">
                        {application.visit_slots
                          .filter((slot) => slot.available)
                          .map((slot) => (
                            <div
                              key={slot.id}
                              className="flex items-center justify-between bg-white rounded-lg p-3 border"
                            >
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                                <span className="font-medium">
                                  {new Date(slot.date).toLocaleDateString("fr-FR", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </span>
                                <span className="ml-2 text-gray-600">à {slot.time}</span>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleChooseVisitSlot(application.id, slot.id)}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Choisir ce créneau
                              </Button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                {/* Message de candidature */}
                {application.message && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Votre message</h4>
                    <p className="text-gray-700 text-sm">{application.message}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => (window.location.href = `/properties/${application.property_id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Voir le logement
                    </Button>
                  </div>

                  {/* Bouton retirer candidature avec confirmation */}
                  {application.status !== "withdrawn" && application.status !== "rejected" && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                          disabled={withdrawing === application.id}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          {withdrawing === application.id ? "Retrait..." : "Retirer"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center">
                            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                            Retirer votre candidature
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir retirer votre candidature pour ce logement ?
                            <br />
                            <strong>Cette action est irréversible.</strong>
                            <br />
                            <br />
                            <span className="text-sm text-gray-600">
                              Logement : {application.properties.title} - {application.properties.location}
                            </span>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleWithdrawApplication(application.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Confirmer le retrait
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
