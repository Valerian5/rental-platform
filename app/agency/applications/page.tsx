"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, FileText, User, MapPin, Euro, Calendar, Phone, Mail, Star, Search, Filter } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { authService } from "@/lib/auth-service"
import { PageHeader } from "@/components/page-header"

// RÉUTILISE les types et constantes des candidatures propriétaire
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

export default function AgencyApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([])
  const [filteredApplications, setFilteredApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [agency, setAgency] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true)

        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "agency") {
          toast.error("Accès non autorisé")
          router.push("/login")
          return
        }
        setCurrentUser(user)

        // Récupérer les informations de l'agence
        const agencyResponse = await fetch(`/api/agencies/${user.agency_id}`)
        const agencyData = await agencyResponse.json()
        if (agencyData.success) {
          setAgency(agencyData.agency)
        }

        // Récupérer les candidatures de l'agence
        const response = await fetch(`/api/agencies/${user.agency_id}/applications`)

        if (!response.ok) {
          throw new Error("Erreur lors du chargement")
        }

        const data = await response.json()
        setApplications(data.applications || [])
        setFilteredApplications(data.applications || [])
      } catch (error: any) {
        console.error("Erreur chargement candidatures:", error)
        toast.error("Erreur lors du chargement des candidatures")
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [router])

  useEffect(() => {
    let filtered = applications.filter(
      (application) =>
        application.tenant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        application.property?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        application.property?.address?.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    if (filter !== "all") {
      filtered = filtered.filter((application) => application.status === filter)
    }

    setFilteredApplications(filtered)
  }, [searchTerm, applications, filter])

  // RÉUTILISE les fonctions de gestion des candidatures
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
      window.location.reload()
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
      window.location.reload()
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du refus")
    }
  }

  const handleContact = (id: string) => {
    router.push(`/agency/messaging?application=${id}`)
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
    <div className="container mx-auto py-6">
      <PageHeader
        title="Candidatures reçues"
        description={`${applications.length} candidature(s) pour ${agency?.name || "votre agence"}`}
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </PageHeader>

      {/* Barre de recherche et filtres */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Rechercher par candidat ou bien..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs defaultValue="all" value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">Toutes ({applications.length})</TabsTrigger>
            {Object.entries(statusLabels).map(([status, label]) => {
              const count = applications.filter((app) => app.status === status).length
              if (count === 0) return null
              return (
                <TabsTrigger key={status} value={status}>
                  {label} ({count})
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>
      </div>

      {/* Liste des candidatures - RÉUTILISE la structure des cartes propriétaire */}
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
                      <AvatarFallback>
                        {application.tenant_name
                          ?.split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase() || "T"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/agency/applications/${application.id}`}
                        className="hover:text-blue-600 transition-colors"
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
                          <Badge className="bg-blue-100 text-blue-800">
                            <Star className="h-3 w-3 mr-1" />
                            {application.matching_score}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {application.status !== "pending" && (
                    <div className="absolute top-4 right-4">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/agency/applications/${application.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Link>
                      </Button>
                    </div>
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
                {/* Informations du bien */}
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

                {/* Informations du candidat */}
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

                <Separator />

                {/* Actions - RÉUTILISE la logique propriétaire */}
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
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent" asChild>
                      <Link href={`/agency/applications/${application.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        Analyser
                      </Link>
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
                      <Link href={`/agency/applications/${application.id}/propose-visit`}>
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
