"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { authService } from "@/lib/auth-service"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Users, Search, Filter, Eye, Check, X, Clock, Star, MapPin, Euro, Calendar, Phone, Mail } from "lucide-react"

interface Application {
  id: string
  tenant_id: string
  property_id: string
  status: "pending" | "approved" | "rejected"
  score: number
  created_at: string
  tenant: {
    first_name: string
    last_name: string
    email: string
    phone: string
    income: number
    profession: string
  }
  property: {
    title: string
    address: string
    price: number
    type: string
  }
  documents: any[]
  message: string
}

export default function ApplicationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<Application[]>([])
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [filters, setFilters] = useState({
    status: "all",
    property: "all",
    search: "",
    dateRange: "all",
  })

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [applications, filters])

  const checkAuthAndLoadData = async () => {
    try {
      const user = await authService.getCurrentUser()
      if (!user || user.user_type !== "owner") {
        router.push("/login")
        return
      }

      await loadApplications(user.id)
      await loadProperties(user.id)
    } catch (error) {
      console.error("Erreur auth:", error)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  const loadApplications = async (ownerId: string) => {
    try {
      const data = await applicationService.getOwnerApplications(ownerId)
      setApplications(data)
    } catch (error) {
      console.error("Erreur chargement candidatures:", error)
      toast.error("Erreur lors du chargement des candidatures")
    }
  }

  const loadProperties = async (ownerId: string) => {
    try {
      const response = await fetch(`/api/properties?owner_id=${ownerId}`)
      if (response.ok) {
        const data = await response.json()
        setProperties(data.properties || [])
      }
    } catch (error) {
      console.error("Erreur chargement propriétés:", error)
    }
  }

  const applyFilters = () => {
    let filtered = [...applications]

    // Filtre par statut
    if (filters.status !== "all") {
      filtered = filtered.filter((app) => app.status === filters.status)
    }

    // Filtre par propriété
    if (filters.property !== "all") {
      filtered = filtered.filter((app) => app.property_id === filters.property)
    }

    // Filtre par recherche
    if (filters.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter(
        (app) =>
          app.tenant.first_name.toLowerCase().includes(search) ||
          app.tenant.last_name.toLowerCase().includes(search) ||
          app.property.title.toLowerCase().includes(search) ||
          app.property.address.toLowerCase().includes(search),
      )
    }

    // Filtre par date
    if (filters.dateRange !== "all") {
      const now = new Date()
      const days = filters.dateRange === "week" ? 7 : filters.dateRange === "month" ? 30 : 90
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      filtered = filtered.filter((app) => new Date(app.created_at) >= cutoff)
    }

    setFilteredApplications(filtered)
  }

  const handleStatusChange = async (applicationId: string, newStatus: "approved" | "rejected") => {
    try {
      await applicationService.updateApplicationStatus(applicationId, newStatus)
      toast.success(`Candidature ${newStatus === "approved" ? "approuvée" : "rejetée"}`)

      // Recharger les données
      const user = await authService.getCurrentUser()
      if (user) {
        await loadApplications(user.id)
      }
    } catch (error) {
      console.error("Erreur mise à jour statut:", error)
      toast.error("Erreur lors de la mise à jour")
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">En attente</Badge>
      case "approved":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Approuvée
          </Badge>
        )
      case "rejected":
        return <Badge variant="destructive">Rejetée</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Candidatures</h1>
            <p className="text-muted-foreground">Gérez les demandes de location</p>
          </div>
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Candidatures</h1>
          <p className="text-muted-foreground">
            {applications.length} candidature{applications.length > 1 ? "s" : ""} au total
          </p>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>

            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="approved">Approuvées</SelectItem>
                <SelectItem value="rejected">Rejetées</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.property} onValueChange={(value) => setFilters({ ...filters, property: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Propriété" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les propriétés</SelectItem>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.dateRange} onValueChange={(value) => setFilters({ ...filters, dateRange: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les dates</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
                <SelectItem value="quarter">Ce trimestre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold">{applications.filter((a) => a.status === "pending").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Check className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Approuvées</p>
                <p className="text-2xl font-bold">{applications.filter((a) => a.status === "approved").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <X className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Rejetées</p>
                <p className="text-2xl font-bold">{applications.filter((a) => a.status === "rejected").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Score moyen</p>
                <p className="text-2xl font-bold">
                  {applications.length > 0
                    ? Math.round(applications.reduce((sum, app) => sum + app.score, 0) / applications.length)
                    : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des candidatures */}
      <div className="space-y-4">
        {filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune candidature</h3>
              <p className="text-muted-foreground">
                {filters.status !== "all" || filters.property !== "all" || filters.search
                  ? "Aucune candidature ne correspond à vos filtres"
                  : "Vous n'avez pas encore reçu de candidatures"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredApplications.map((application) => (
            <Card key={application.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {application.tenant.first_name[0]}
                            {application.tenant.last_name[0]}
                          </span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border-2 border-white flex items-center justify-center">
                          <div
                            className={`w-4 h-4 rounded-full ${getScoreProgressColor(application.score)}`}
                            style={{
                              background: `conic-gradient(${getScoreProgressColor(application.score).replace("bg-", "")} ${application.score * 3.6}deg, #e5e7eb 0deg)`,
                            }}
                          ></div>
                          <span className={`absolute text-xs font-bold ${getScoreColor(application.score)}`}>
                            {application.score}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">
                          {application.tenant.first_name} {application.tenant.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{application.tenant.profession}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-1" />
                            {application.tenant.email}
                          </div>
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-1" />
                            {application.tenant.phone}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-medium mb-2">Propriété demandée</h4>
                        <div className="space-y-1 text-sm">
                          <p className="font-medium">{application.property.title}</p>
                          <div className="flex items-center text-muted-foreground">
                            <MapPin className="h-4 w-4 mr-1" />
                            {application.property.address}
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <Euro className="h-4 w-4 mr-1" />
                            {application.property.price}€/mois
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Informations financières</h4>
                        <div className="space-y-1 text-sm">
                          <p>Revenus: {application.tenant.income}€/mois</p>
                          <p>Ratio: {((application.property.price / application.tenant.income) * 100).toFixed(1)}%</p>
                          <p>Documents: {application.documents.length} fournis</p>
                        </div>
                      </div>
                    </div>

                    {application.message && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Message du candidat</h4>
                        <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">{application.message}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end space-y-3">
                    {getStatusBadge(application.status)}

                    <div className="text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {new Date(application.created_at).toLocaleDateString()}
                    </div>

                    <div className="flex flex-col space-y-2">
                      <Button size="sm" variant="outline" asChild>
                        <a href={`/owner/applications/${application.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          Détails
                        </a>
                      </Button>

                      {application.status === "pending" && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleStatusChange(application.id, "approved")}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approuver
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusChange(application.id, "rejected")}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Rejeter
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
