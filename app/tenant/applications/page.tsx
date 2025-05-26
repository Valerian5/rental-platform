"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Calendar, Clock, FileText, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

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

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    try {
      setLoading(true)
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      if (!user.id) {
        toast.error("Vous devez être connecté")
        return
      }

      const response = await fetch(`/api/applications?tenant_id=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications || [])
      }
    } catch (error) {
      console.error("Erreur chargement candidatures:", error)
      toast.error("Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary"
      case "under_review":
        return "secondary"
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
        <div className="text-center">Chargement de vos candidatures...</div>
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
                        src={primaryImage?.url || "/placeholder.svg?height=200&width=300"}
                        alt={application.property.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h2 className="text-xl font-semibold">{application.property.title}</h2>
                          <p className="text-muted-foreground">
                            {application.property.address}, {application.property.city}
                          </p>
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

                      {application.status === "visit_scheduled" &&
                        application.visits &&
                        application.visits.length > 0 && (
                          <div className="bg-blue-50 p-3 rounded-md mb-4">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 text-blue-600 mr-2" />
                              <span className="font-medium text-blue-800">Visite programmée</span>
                            </div>
                            {application.visits.map((visit) => (
                              <p key={visit.id} className="text-sm text-blue-700 mt-1">
                                Le{" "}
                                {new Date(visit.visit_date).toLocaleDateString("fr-FR", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })}{" "}
                                à {visit.start_time}
                              </p>
                            ))}
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
                        {application.status === "pending" && (
                          <Button variant="destructive" size="sm">
                            Retirer ma candidature
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
