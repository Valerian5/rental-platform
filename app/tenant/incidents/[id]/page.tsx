"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, User, Building, MessageSquare, AlertTriangle } from "lucide-react"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"
import Link from "next/link"

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
  property?: {
    id: string
    title: string
    address: string
    city: string
  }
  lease?: {
    owner: {
      first_name: string
      last_name: string
      email: string
      phone: string
    }
  }
  responses?: Array<{
    id: string
    message: string
    user_type: "owner" | "tenant"
    created_at: string
  }>
}

export default function IncidentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [incident, setIncident] = useState<Incident | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initializeData = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "tenant") {
          router.push("/login")
          return
        }

        setCurrentUser(user)
        await loadIncident(params.id)
      } catch (error) {
        console.error("Erreur initialisation:", error)
        toast.error("Erreur lors du chargement")
      } finally {
        setIsLoading(false)
      }
    }

    initializeData()
  }, [params.id, router])

  const loadIncident = async (incidentId: string) => {
    try {
      const res = await fetch(`/api/incidents/${incidentId}`)
      const data = await res.json()

      if (data.success) {
        setIncident(data.incident)
      } else {
        toast.error("Incident non trouvé")
        router.push("/tenant/rental-management")
      }
    } catch (error) {
      console.error("Erreur chargement incident:", error)
      toast.error("Erreur lors du chargement")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return <Badge className="bg-green-600">Résolu</Badge>
      case "in_progress":
        return <Badge className="bg-orange-600">En cours</Badge>
      case "reported":
        return <Badge variant="secondary">Signalé</Badge>
      case "closed":
        return <Badge variant="outline">Fermé</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="destructive">Urgent</Badge>
      case "high":
        return <Badge className="bg-orange-600">Élevé</Badge>
      case "medium":
        return <Badge variant="secondary">Moyen</Badge>
      case "low":
        return <Badge variant="outline">Faible</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  const getCategoryLabel = (category: string) => {
    const categories = {
      plumbing: "Plomberie",
      electrical: "Électricité",
      heating: "Chauffage",
      security: "Sécurité",
      other: "Autre",
    }
    return categories[category as keyof typeof categories] || category
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Chargement de l'incident...</p>
        </div>
      </div>
    )
  }

  if (!incident) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 mx-auto text-gray-300" />
          <p className="text-gray-600">Incident non trouvé</p>
          <Link href="/tenant/rental-management">
            <Button>Retour à mes incidents</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Link href="/tenant/rental-management">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold">{incident.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {getStatusBadge(incident.status)}
            {getPriorityBadge(incident.priority)}
            <Badge variant="outline">{getCategoryLabel(incident.category)}</Badge>
          </div>
        </div>
      </div>

      {/* Informations principales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Détails de l'incident */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{incident.description}</p>
            </CardContent>
          </Card>

          {/* Photos */}
          {incident.photos && incident.photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {incident.photos.map((photo, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={photo || "/placeholder.svg"}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg border cursor-pointer hover:opacity-80"
                        onClick={() => window.open(photo, "_blank")}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Résolution */}
          {incident.status === "resolved" && incident.resolution_notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-green-800">Résolution</CardTitle>
              </CardHeader>
              <CardContent className="bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 mb-3">{incident.resolution_notes}</p>
                <div className="flex flex-col sm:flex-row gap-4 text-sm text-green-700">
                  {incident.cost && (
                    <div>
                      <strong>Coût des réparations :</strong> {incident.cost}€
                    </div>
                  )}
                  {incident.resolved_date && (
                    <div>
                      <strong>Résolu le :</strong> {new Date(incident.resolved_date).toLocaleDateString("fr-FR")}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Échanges */}
          {incident.responses && incident.responses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Échanges</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {incident.responses.map((response) => (
                    <div
                      key={response.id}
                      className={`p-4 rounded-lg ${
                        response.user_type === "owner"
                          ? "bg-blue-50 border border-blue-200"
                          : "bg-gray-50 border border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-sm">
                          {response.user_type === "owner" ? "Propriétaire" : "Vous"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(response.created_at).toLocaleDateString("fr-FR")} à{" "}
                          {new Date(response.created_at).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-sm">{response.message}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="font-medium">Signalé le</p>
                  <p className="text-gray-600">{new Date(incident.created_at).toLocaleDateString("fr-FR")}</p>
                </div>
              </div>

              {incident.property && (
                <div className="flex items-start gap-2 text-sm">
                  <Building className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">Logement</p>
                    <p className="text-gray-600">{incident.property.title}</p>
                    <p className="text-gray-500 text-xs">
                      {incident.property.address}, {incident.property.city}
                    </p>
                  </div>
                </div>
              )}

              {incident.lease?.owner && (
                <div className="flex items-start gap-2 text-sm">
                  <User className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">Propriétaire</p>
                    <p className="text-gray-600">
                      {incident.lease.owner.first_name} {incident.lease.owner.last_name}
                    </p>
                    <p className="text-gray-500 text-xs">{incident.lease.owner.email}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          {incident.status !== "resolved" && incident.status !== "closed" && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/tenant/incidents/${incident.id}/respond`}>
                  <Button className="w-full">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Répondre
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
