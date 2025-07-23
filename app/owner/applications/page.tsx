"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, Trash2, FileText, User, MapPin, Euro, Calendar, Phone, Mail, Star } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

interface Application {
  id: string
  tenant_name: string
  tenant_email: string
  tenant_phone?: string
  status: string
  created_at: string
  updated_at: string
  property_title?: string
  property_address?: string
  income?: number
  profession?: string
  has_guarantor?: boolean
  matching_score?: number
  message?: string
  visit_requested?: boolean
  property?: {
    id: string
    title: string
    address: string
    price: number
    type: string
    surface: number
    rooms: number
    images?: string[]
  }
  tenant?: {
    name: string
    email: string
    phone?: string
    age?: number
    profession?: string
    income?: number
  }
  rental_file?: {
    id: string
    completion_percentage: number
    documents_count: number
    income_proof_verified: boolean
    identity_verified: boolean
    guarantor_verified: boolean
  }
}

const statusLabels = {
  pending: "En attente",
  analyzing: "En cours d'analyse",
  visit_proposed: "Visite proposée",
  visit_scheduled: "Visite programmée",
  visit_completed: "Visite effectuée",
  accepted: "Acceptée",
  rejected: "Refusée",
  lease_signed: "Bail signé",
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  analyzing: "bg-blue-100 text-blue-800",
  visit_proposed: "bg-purple-100 text-purple-800",
  visit_scheduled: "bg-indigo-100 text-indigo-800",
  visit_completed: "bg-green-100 text-green-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  lease_signed: "bg-emerald-100 text-emerald-800",
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const router = useRouter()

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/applications")

        if (!response.ok) {
          throw new Error("Erreur lors du chargement")
        }

        const data = await response.json()
        setApplications(data.applications || [])
      } catch (error: any) {
        console.error("Erreur chargement candidatures:", error)
        toast.error("Erreur lors du chargement des candidatures")
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [])

  const handleAccept = async (id: string) => {
    try {
      const response = await fetch(`/api/applications/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" }),
      })

      if (!response.ok) {
        toast.error("Erreur lors de l'acceptation")
        return
      }

      toast.success("Candidature acceptée")
      // Recharger les candidatures
      const updatedResponse = await fetch("/api/applications")
      if (updatedResponse.ok) {
        const data = await updatedResponse.json()
        setApplications(data.applications || [])
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de l'acceptation")
    }
  }

  const handleReject = async (id: string) => {
    try {
      const response = await fetch(`/api/applications/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      })

      if (!response.ok) {
        toast.error("Erreur lors du refus")
        return
      }

      toast.success("Candidature refusée")
      // Recharger les candidatures
      const updatedResponse = await fetch("/api/applications")
      if (updatedResponse.ok) {
        const data = await updatedResponse.json()
        setApplications(data.applications || [])
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du refus")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette candidature ?")) {
      return
    }

    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setApplications((prev) => prev.filter((app) => app.id !== id))
      toast.success("Candidature supprimée avec succès")
    } catch (error: any) {
      console.error("Failed to delete application:", error)
      toast.error("Erreur lors de la suppression")
    }
  }

  const handleContact = (id: string) => {
    router.push(`/owner/messaging?application=${id}`)
  }

  const filteredApplications = applications.filter((app) => {
    if (filter === "all") return true
    return app.status === filter
  })

  const getScoreColor = (score?: number) => {
    if (!score) return "text-gray-400"
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadgeColor = (score?: number) => {
    if (!score) return "bg-gray-100 text-gray-600"
    if (score >= 80) return "bg-green-100 text-green-700"
    if (score >= 60) return "bg-yellow-100 text-yellow-700"
    return "bg-red-100 text-red-700"
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Candidatures reçues</h1>
          <p className="text-gray-600">
            {applications.length} candidature{applications.length > 1 ? "s" : ""} au total
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
          Toutes ({applications.length})
        </Button>
        {Object.entries(statusLabels).map(([status, label]) => {
          const count = applications.filter((app) => app.status === status).length
          if (count === 0) return null
          return (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {label} ({count})
            </Button>
          )
        })}
      </div>

      {/* Applications Grid */}
      {filteredApplications.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === "all"
                ? "Aucune candidature"
                : `Aucune candidature ${statusLabels[filter as keyof typeof statusLabels]?.toLowerCase()}`}
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              {filter === "all"
                ? "Vous n'avez pas encore reçu de candidatures pour vos biens."
                : "Aucune candidature ne correspond à ce filtre."}
            </p>
            {filter !== "all" && (
              <Button variant="outline" onClick={() => setFilter("all")}>
                Voir toutes les candidatures
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {filteredApplications.map((application) => (
            <Card key={application.id} className="relative hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${application.tenant_name}`} />
                      <AvatarFallback>
                        {application.tenant_name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase() || "T"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      {/* Nom cliquable */}
                      <Link
                        href={`/owner/applications/${application.id}`}
                        className="block hover:text-blue-600 transition-colors"
                      >
                        <CardTitle className="text-lg font-semibold truncate cursor-pointer">
                          {application.tenant_name}
                        </CardTitle>
                      </Link>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge
                          className={
                            statusColors[application.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"
                          }
                        >
                          {statusLabels[application.status as keyof typeof statusLabels] || application.status}
                        </Badge>
                        {application.matching_score && (
                          <Badge className={getScoreBadgeColor(application.matching_score)}>
                            <Star className="h-3 w-3 mr-1" />
                            {application.matching_score}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bouton "Voir" après analyse */}
                  {application.status !== "pending" && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/owner/applications/${application.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        Voir
                      </Link>
                    </Button>
                  )}
                </div>

                {application.property && (
                  <CardDescription className="flex items-center text-sm text-gray-600 mt-2">
                    <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="truncate">{application.property.title}</span>
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Property Info */}
                {application.property && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Bien concerné</span>
                      <span className="text-sm font-semibold text-gray-900">{application.property.price}€/mois</span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{application.property.address}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>{application.property.type}</span>
                      <span>{application.property.surface}m²</span>
                      <span>{application.property.rooms} pièces</span>
                    </div>
                  </div>
                )}

                {/* Tenant Info */}
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{application.tenant_email}</span>
                  </div>
                  {application.tenant_phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{application.tenant_phone}</span>
                    </div>
                  )}
                  {application.profession && (
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{application.profession}</span>
                    </div>
                  )}
                  {application.income && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Euro className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{application.income.toLocaleString()}€/mois</span>
                    </div>
                  )}
                </div>

                {/* Rental File Progress */}
                {application.rental_file && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-700">Dossier locataire</span>
                      <span className="text-sm font-semibold text-blue-900">
                        {application.rental_file.completion_percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${application.rental_file.completion_percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-blue-600">
                      <span>{application.rental_file.documents_count} documents</span>
                      {application.rental_file.income_proof_verified && <span>✓ Revenus</span>}
                      {application.rental_file.identity_verified && <span>✓ Identité</span>}
                      {application.rental_file.guarantor_verified && <span>✓ Garant</span>}
                    </div>
                  </div>
                )}

                {/* Message */}
                {application.message && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700 line-clamp-3">{application.message}</p>
                  </div>
                )}

                <Separator />

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleContact(application.id)}
                      className="flex-1"
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Contacter
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(application.id)} className="flex-1">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Supprimer
                    </Button>
                  </div>

                  {application.status === "analyzing" && (
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleAccept(application.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        Accepter
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleReject(application.id)}
                        className="flex-1"
                      >
                        Refuser
                      </Button>
                    </div>
                  )}

                  {application.status === "accepted" && (
                    <Button variant="default" size="sm" asChild className="w-full">
                      <Link href={`/owner/applications/${application.id}/propose-visit`}>
                        <Calendar className="h-4 w-4 mr-1" />
                        Proposer une visite
                      </Link>
                    </Button>
                  )}
                </div>

                {/* Date */}
                <div className="text-xs text-gray-500 text-center">
                  Candidature reçue le {new Date(application.created_at).toLocaleDateString("fr-FR")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
