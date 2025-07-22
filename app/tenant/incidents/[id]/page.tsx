"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, AlertTriangle, Clock, CheckCircle, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"

interface Incident {
  id: string
  title: string
  description: string
  category: string
  priority: string
  status: string
  photos?: string[]
  resolution_notes?: string
  cost?: number
  resolved_date?: string
  created_at: string
  updated_at?: string
  responses?: IncidentResponse[]
  property: {
    title: string
    address: string
  }
  owner: {
    first_name: string
    last_name: string
  }
}

interface IncidentResponse {
  id: string
  incident_id: string
  message: string
  author_type: "owner" | "tenant"
  author_name: string
  created_at: string
  attachments?: string[]
}

export default function IncidentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [incident, setIncident] = useState<Incident | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "tenant") {
          toast.error("Accès non autorisé")
          router.push("/login")
          return
        }

        setCurrentUser(user)

        // Récupérer les détails de l'incident
        const response = await fetch(`/api/incidents/${params.id}`)
        const data = await response.json()

        if (data.success) {
          setIncident(data.incident)
        } else {
          toast.error("Incident non trouvé")
          router.push("/tenant/rental-management?tab=incidents")
        }
      } catch (error) {
        console.error("Erreur:", error)
        toast.error("Erreur lors du chargement")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params.id, router])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200"
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "reported":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "closed":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "resolved":
        return "Résolu"
      case "in_progress":
        return "En cours"
      case "reported":
        return "Signalé"
      case "closed":
        return "Fermé"
      default:
        return status
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "Urgent"
      case "high":
        return "Élevé"
      case "medium":
        return "Moyen"
      case "low":
        return "Faible"
      default:
        return priority
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "plumbing":
        return "Plomberie"
      case "electrical":
        return "Électricité"
      case "heating":
        return "Chauffage"
      case "security":
        return "Sécurité"
      case "other":
        return "Autre"
      default:
        return category
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "in_progress":
        return <Clock className="h-5 w-5 text-blue-600" />
      case "reported":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Chargement de l'incident...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!incident) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Incident non trouvé</h3>
            <p className="text-muted-foreground mb-4">L'incident demandé n'existe pas ou n'est plus accessible.</p>
            <Button asChild>
              <Link href="/tenant/rental-management?tab=incidents">Retour aux incidents</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <Link
          href="/tenant/rental-management?tab=incidents"
          className="text-blue-600 hover:underline flex items-center mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour à mes incidents
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{incident.title}</h1>
            <p className="text-muted-foreground">
              {incident.property.title} - {incident.property.address}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(incident.status)}
            <Badge className={getStatusColor(incident.status)}>{getStatusLabel(incident.status)}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contenu principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations principales */}
          <Card>
            <CardHeader>
              <CardTitle>Détails de l'incident</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Badge className={getPriorityColor(incident.priority)}>{getPriorityLabel(incident.priority)}</Badge>
                <span className="text-sm text-muted-foreground">Catégorie: {getCategoryLabel(incident.category)}</span>
                <span className="text-sm text-muted-foreground">
                  Signalé le {new Date(incident.created_at).toLocaleDateString("fr-FR")}
                </span>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{incident.description}</p>
              </div>

              {incident.photos && incident.photos.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Photos</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {incident.photos.map((photo, index) => (
                      <div key={index} className="relative aspect-video">
                        <img
                          src={photo || "/placeholder.svg"}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(photo, "_blank")}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Résolution */}
          {incident.status === "resolved" && incident.resolution_notes && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Incident résolu
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-medium text-green-800 mb-2">Notes de résolution</h4>
                  <p className="text-sm text-green-700">{incident.resolution_notes}</p>
                </div>

                {incident.cost && (
                  <div>
                    <h4 className="font-medium text-green-800 mb-1">Coût des réparations</h4>
                    <p className="text-lg font-semibold text-green-800">{incident.cost}€</p>
                  </div>
                )}

                {incident.resolved_date && (
                  <div>
                    <h4 className="font-medium text-green-800 mb-1">Date de résolution</h4>
                    <p className="text-sm text-green-700">
                      {new Date(incident.resolved_date).toLocaleDateString("fr-FR")} à{" "}
                      {new Date(incident.resolved_date).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Échanges */}
          {incident.responses && incident.responses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Échanges avec le propriétaire</CardTitle>
                <CardDescription>Historique des communications concernant cet incident</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {incident.responses.map((response, index) => (
                    <div key={response.id}>
                      <div
                        className={`p-4 rounded-lg ${
                          response.author_type === "owner"
                            ? "bg-blue-50 border border-blue-200 ml-4"
                            : "bg-gray-50 border border-gray-200 mr-4"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">
                              {response.author_type === "owner"
                                ? `${incident.owner.first_name} ${incident.owner.last_name}`
                                : "Vous"}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {response.author_type === "owner" ? "Propriétaire" : "Locataire"}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(response.created_at).toLocaleDateString("fr-FR")} à{" "}
                            {new Date(response.created_at).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <p className="text-sm leading-relaxed mb-3">{response.message}</p>

                        {response.attachments && response.attachments.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {response.attachments.map((attachment, attachIndex) => (
                              <div key={attachIndex} className="relative aspect-square">
                                <img
                                  src={attachment || "/placeholder.svg"}
                                  alt={`Pièce jointe ${attachIndex + 1}`}
                                  className="w-full h-full object-cover rounded border cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(attachment, "_blank")}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {index < incident.responses.length - 1 && <Separator className="my-4" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {incident.status !== "resolved" && incident.status !== "closed" && (
                <Button className="w-full" asChild>
                  <Link href={`/tenant/incidents/${incident.id}/respond`}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Ajouter un message
                  </Link>
                </Button>
              )}

              <Button variant="outline" className="w-full bg-transparent" asChild>
                <Link href={`/tenant/messaging?owner=${incident.owner}&subject=Incident: ${incident.title}`}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contacter le propriétaire
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Informations */}
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Statut</p>
                <div className="flex items-center space-x-2 mt-1">
                  {getStatusIcon(incident.status)}
                  <span className="font-medium">{getStatusLabel(incident.status)}</span>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-muted-foreground">Priorité</p>
                <Badge className={`${getPriorityColor(incident.priority)} mt-1`}>
                  {getPriorityLabel(incident.priority)}
                </Badge>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-muted-foreground">Catégorie</p>
                <p className="font-medium mt-1">{getCategoryLabel(incident.category)}</p>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-muted-foreground">Date de signalement</p>
                <p className="font-medium mt-1">{new Date(incident.created_at).toLocaleDateString("fr-FR")}</p>
              </div>

              {incident.updated_at && incident.updated_at !== incident.created_at && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Dernière mise à jour</p>
                    <p className="font-medium mt-1">{new Date(incident.updated_at).toLocaleDateString("fr-FR")}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Propriétaire */}
          <Card>
            <CardHeader>
              <CardTitle>Propriétaire</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">
                  {incident.owner.first_name} {incident.owner.last_name}
                </p>
                <Button variant="outline" size="sm" className="w-full bg-transparent" asChild>
                  <Link href={`/tenant/messaging?owner=${incident.owner}`}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Envoyer un message
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
