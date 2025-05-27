"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { authService } from "@/lib/auth-service"
import { visitService } from "@/lib/visit-service"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon, Clock, MapPin, User, Phone, Mail, Check, X, Filter, Search } from "lucide-react"

interface Visit {
  id: string
  property_id: string
  visitor_name: string
  visitor_email: string
  visitor_phone: string
  visit_date: string
  visit_time: string
  status: "scheduled" | "completed" | "cancelled" | "no_show"
  notes: string
  property: {
    title: string
    address: string
    type: string
  }
}

export default function VisitsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [visits, setVisits] = useState<Visit[]>([])
  const [filteredVisits, setFilteredVisits] = useState<Visit[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [filters, setFilters] = useState({
    status: "all",
    property: "all",
    search: "",
    date: null as Date | null,
  })

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [visits, filters])

  const checkAuthAndLoadData = async () => {
    try {
      const user = await authService.getCurrentUser()
      if (!user || user.user_type !== "owner") {
        router.push("/login")
        return
      }

      await loadVisits(user.id)
      await loadProperties(user.id)
    } catch (error) {
      console.error("Erreur auth:", error)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  const loadVisits = async (ownerId: string) => {
    try {
      const data = await visitService.getOwnerVisits(ownerId)
      setVisits(data)
    } catch (error) {
      console.error("Erreur chargement visites:", error)
      toast.error("Erreur lors du chargement des visites")
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
    let filtered = [...visits]

    if (filters.status !== "all") {
      filtered = filtered.filter((visit) => visit.status === filters.status)
    }

    if (filters.property !== "all") {
      filtered = filtered.filter((visit) => visit.property_id === filters.property)
    }

    if (filters.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter(
        (visit) =>
          visit.visitor_name.toLowerCase().includes(search) ||
          visit.property.title.toLowerCase().includes(search) ||
          visit.property.address.toLowerCase().includes(search),
      )
    }

    if (filters.date) {
      const filterDate = format(filters.date, "yyyy-MM-dd")
      filtered = filtered.filter((visit) => visit.visit_date === filterDate)
    }

    setFilteredVisits(filtered)
  }

  const handleStatusChange = async (visitId: string, newStatus: Visit["status"]) => {
    try {
      await visitService.updateVisitStatus(visitId, newStatus)
      toast.success("Statut de la visite mis à jour")

      const user = await authService.getCurrentUser()
      if (user) {
        await loadVisits(user.id)
      }
    } catch (error) {
      console.error("Erreur mise à jour statut:", error)
      toast.error("Erreur lors de la mise à jour")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="default">Programmée</Badge>
      case "completed":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Effectuée
          </Badge>
        )
      case "cancelled":
        return <Badge variant="secondary">Annulée</Badge>
      case "no_show":
        return <Badge variant="destructive">Absent</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getUpcomingVisits = () => {
    const now = new Date()
    return visits.filter((visit) => {
      const visitDateTime = new Date(`${visit.visit_date}T${visit.visit_time}`)
      return visitDateTime > now && visit.status === "scheduled"
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Visites</h1>
            <p className="text-muted-foreground">Gérez vos visites de propriétés</p>
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

  const upcomingVisits = getUpcomingVisits()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Visites</h1>
          <p className="text-muted-foreground">
            {visits.length} visite{visits.length > 1 ? "s" : ""} au total
          </p>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Programmées</p>
                <p className="text-2xl font-bold">{visits.filter((v) => v.status === "scheduled").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Check className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Effectuées</p>
                <p className="text-2xl font-bold">{visits.filter((v) => v.status === "completed").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <X className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Annulées</p>
                <p className="text-2xl font-bold">{visits.filter((v) => v.status === "cancelled").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">À venir</p>
                <p className="text-2xl font-bold">{upcomingVisits.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                <SelectItem value="scheduled">Programmées</SelectItem>
                <SelectItem value="completed">Effectuées</SelectItem>
                <SelectItem value="cancelled">Annulées</SelectItem>
                <SelectItem value="no_show">Absents</SelectItem>
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

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.date ? format(filters.date, "PPP", { locale: fr }) : "Sélectionner une date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.date || undefined}
                  onSelect={(date) => setFilters({ ...filters, date: date || null })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              onClick={() => setFilters({ status: "all", property: "all", search: "", date: null })}
            >
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des visites */}
      <div className="space-y-4">
        {filteredVisits.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune visite</h3>
              <p className="text-muted-foreground">
                {filters.status !== "all" || filters.property !== "all" || filters.search || filters.date
                  ? "Aucune visite ne correspond à vos filtres"
                  : "Vous n'avez pas encore de visites programmées"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredVisits.map((visit) => (
            <Card key={visit.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{visit.visitor_name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-1" />
                            {visit.visitor_email}
                          </div>
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-1" />
                            {visit.visitor_phone}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Propriété</h4>
                        <div className="space-y-1 text-sm">
                          <p className="font-medium">{visit.property.title}</p>
                          <div className="flex items-center text-muted-foreground">
                            <MapPin className="h-4 w-4 mr-1" />
                            {visit.property.address}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Date et heure</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {format(new Date(visit.visit_date), "PPP", { locale: fr })}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {visit.visit_time}
                          </div>
                        </div>
                      </div>
                    </div>

                    {visit.notes && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Notes</h4>
                        <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">{visit.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end space-y-3">
                    {getStatusBadge(visit.status)}

                    <div className="flex flex-col space-y-2">
                      {visit.status === "scheduled" && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleStatusChange(visit.id, "completed")}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Effectuée
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusChange(visit.id, "cancelled")}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Annuler
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
