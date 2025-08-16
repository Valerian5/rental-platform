"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/page-header"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"
import {
  CalendarIcon,
  Clock,
  User,
  Phone,
  Mail,
  Building2,
  Filter,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react"

interface Visit {
  id: string
  visit_date: string
  visit_time: string
  status: string
  created_at: string
  visitor_name: string
  visitor_phone?: string
  tenant_email?: string
  property: {
    id: string
    title: string
    address: string
    city: string
    property_images?: Array<{ url: string; is_primary: boolean }>
  }
  application?: {
    id: string
    status: string
  }
}

export default function OwnerVisitsPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [visits, setVisits] = useState<Visit[]>([])
  const [filteredVisits, setFilteredVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")

  const statusConfig = {
    scheduled: { label: "Programmée", variant: "default" as const, icon: Clock },
    completed: { label: "Terminée", variant: "outline" as const, icon: CheckCircle },
    cancelled: { label: "Annulée", variant: "destructive" as const, icon: XCircle },
    pending: { label: "En attente", variant: "secondary" as const, icon: AlertCircle },
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "owner") {
          router.push("/login")
          return
        }

        setCurrentUser(user)
        await loadVisits(user.id)
      } catch (error) {
        console.error("Erreur auth:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const loadVisits = async (ownerId: string) => {
    try {
      const response = await fetch(`/api/visits?owner_id=${ownerId}`)
      if (response.ok) {
        const data = await response.json()
        setVisits(data.visits || [])
        setFilteredVisits(data.visits || [])
      } else {
        toast.error("Erreur lors du chargement des visites")
      }
    } catch (error) {
      console.error("Erreur chargement visites:", error)
      toast.error("Erreur lors du chargement des visites")
    }
  }

  // Filtrage des visites
  useEffect(() => {
    let filtered = visits

    // Filtre par recherche
    if (searchQuery) {
      filtered = filtered.filter(
        (visit) =>
          visit.visitor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          visit.property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          visit.property.address.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Filtre par statut
    if (statusFilter !== "all") {
      filtered = filtered.filter((visit) => visit.status === statusFilter)
    }

    // Filtre par date
    if (selectedDate) {
      filtered = filtered.filter((visit) => {
        const visitDate = new Date(visit.visit_date)
        return visitDate.toDateString() === selectedDate.toDateString()
      })
    }

    setFilteredVisits(filtered)
  }, [visits, searchQuery, statusFilter, selectedDate])

  const getPropertyImage = (property: Visit["property"]) => {
    if (!property.property_images?.length) {
      return "/placeholder.svg?height=80&width=80&text=Apt"
    }
    const primaryImage = property.property_images.find((img) => img.is_primary)
    return primaryImage?.url || property.property_images[0]?.url || "/placeholder.svg?height=80&width=80&text=Apt"
  }

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3 flex-shrink-0" />
        <span className="truncate">{config.label}</span>
      </Badge>
    )
  }

  const formatDateTime = (date: string, time: string) => {
    const visitDate = new Date(date)
    return {
      date: visitDate.toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: time,
    }
  }

  const getVisitsByDate = () => {
    const visitsByDate: { [key: string]: Visit[] } = {}
    filteredVisits.forEach((visit) => {
      const dateKey = new Date(visit.visit_date).toDateString()
      if (!visitsByDate[dateKey]) {
        visitsByDate[dateKey] = []
      }
      visitsByDate[dateKey].push(visit)
    })
    return visitsByDate
  }

  const stats = {
    total: visits.length,
    scheduled: visits.filter((v) => v.status === "scheduled").length,
    completed: visits.filter((v) => v.status === "completed").length,
    cancelled: visits.filter((v) => v.status === "cancelled").length,
  }

  const hasVisitsOnDate = (date: Date) => {
    return filteredVisits.some((visit) => {
      const visitDate = new Date(visit.visit_date)
      return visitDate.toDateString() === date.toDateString()
    })
  }

  const getVisitCountForDate = (date: Date) => {
    return filteredVisits.filter((visit) => {
      const visitDate = new Date(visit.visit_date)
      return visitDate.toDateString() === date.toDateString()
    }).length
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-full overflow-x-hidden">
        <PageHeader title="Visites" description="Chargement..." />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 max-w-full overflow-x-hidden">
      <PageHeader title="Visites" description="Gérez les visites de vos propriétés" />

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Programmées</p>
                <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Terminées</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Annulées</p>
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2 flex-shrink-0" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="scheduled">Programmées</SelectItem>
                <SelectItem value="completed">Terminées</SelectItem>
                <SelectItem value="cancelled">Annulées</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={selectedDate ? "default" : "outline"}
              onClick={() => setSelectedDate(selectedDate ? undefined : new Date())}
              className="justify-start"
            >
              <CalendarIcon className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">{selectedDate ? "Date sélectionnée" : "Filtrer par date"}</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("")
                setStatusFilter("all")
                setSelectedDate(undefined)
              }}
              className="w-full sm:w-auto"
            >
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Onglets Vue */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "list" | "calendar")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Vue liste</TabsTrigger>
          <TabsTrigger value="calendar">Vue calendrier</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {filteredVisits.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Aucune visite</h3>
                <p className="text-muted-foreground">
                  {visits.length === 0
                    ? "Aucune visite programmée pour le moment"
                    : "Aucune visite ne correspond aux filtres sélectionnés"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredVisits.map((visit) => {
                const { date, time } = formatDateTime(visit.visit_date, visit.visit_time)
                return (
                  <Card key={visit.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        {/* Image de la propriété */}
                        {/* <div className="flex-shrink-0">
                          <img
                            src={getPropertyImage(visit.property) || "/placeholder.svg"}
                            alt={visit.property.title}
                            className="w-full lg:w-20 h-48 lg:h-20 object-cover rounded-lg"
                          />
                        </div> */}

                        {/* Informations principales */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                              <User className="h-6 w-6 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-lg font-semibold truncate">{visit.visitor_name || "Visiteur"}</h3>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center min-w-0">
                                  <Mail className="h-4 w-4 mr-1 flex-shrink-0" />
                                  <span className="truncate">{visit.tenant_email || "Email non renseigné"}</span>
                                </div>
                                <div className="flex items-center">
                                  <Phone className="h-4 w-4 mr-1 flex-shrink-0" />
                                  <span className="truncate">{visit.visitor_phone || "Téléphone non renseigné"}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Informations visiteur */}
                            {/* <div className="space-y-2">
                              <h4 className="font-medium text-sm text-muted-foreground">Visiteur</h4>
                              <div className="space-y-1">
                                <p className="flex items-center gap-2 text-sm">
                                  <User className="h-4 w-4 flex-shrink-0" />
                                  <span className="truncate">
                                    {visit.visitor_name || "Visiteur"}
                                  </span>
                                </p>
                                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Mail className="h-4 w-4 flex-shrink-0" />
                                  <span className="truncate">{visit.tenant_email || "Email non renseigné"}</span>
                                </p>
                                {visit.visitor_phone && (
                                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Phone className="h-4 w-4 flex-shrink-0" />
                                    <span className="truncate">{visit.visitor_phone || "Téléphone non renseigné"}</span>
                                  </p>
                                )}
                              </div>
                            </div> */}

                            {/* Informations visite */}
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm text-muted-foreground">Visite</h4>
                              <div className="space-y-1">
                                <p className="flex items-center gap-2 text-sm">
                                  <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                                  <span className="truncate">{date}</span>
                                </p>
                                <p className="flex items-center gap-2 text-sm">
                                  <Clock className="h-4 w-4 flex-shrink-0" />
                                  <span className="truncate">{time}</span>
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full lg:w-auto">
                            <Button variant="outline" size="sm" className="w-full sm:w-auto bg-transparent">
                              <Eye className="h-4 w-4 mr-2 flex-shrink-0" />
                              Voir détails
                            </Button>
                            {visit.application && (
                              <Button variant="outline" size="sm" className="w-full sm:w-auto bg-transparent">
                                <Building2 className="h-4 w-4 mr-2 flex-shrink-0" />
                                Voir candidature
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <Card>
                <CardHeader>
                  <CardTitle>Calendrier des visites</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="rounded-md border"
                        hasVisitsOnDate={hasVisitsOnDate}
                        getVisitCountForDate={getVisitCountForDate}
                      />
                    </div>
                    <div className="lg:col-span-2">
                      {selectedDate ? (
                        <div className="space-y-4">
                          <h3 className="font-semibold">Visites du {selectedDate.toLocaleDateString("fr-FR")}</h3>
                          {(() => {
                            const dayVisits = filteredVisits.filter((visit) => {
                              const visitDate = new Date(visit.visit_date)
                              return visitDate.toDateString() === selectedDate.toDateString()
                            })

                            if (dayVisits.length === 0) {
                              return <p className="text-muted-foreground">Aucune visite ce jour</p>
                            }

                            return (
                              <div className="space-y-3">
                                {dayVisits.map((visit) => (
                                  <div
                                    key={visit.id}
                                    className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <p className="font-medium truncate">{visit.visit_time}</p>
                                      {getStatusBadge(visit.status)}
                                    </div>
                                    <p className="text-sm font-medium truncate">{visit.property.title}</p>
                                    <p className="text-sm text-muted-foreground truncate">
                                      {visit.property.address}, {visit.property.city}
                                    </p>
                                    <p className="text-sm text-muted-foreground truncate">
                                      {visit.visitor_name || "Visiteur"}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )
                          })()}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <h3 className="font-semibold">Prochaines visites</h3>
                          {(() => {
                            const upcomingVisits = filteredVisits
                              .filter((visit) => {
                                const visitDate = new Date(visit.visit_date)
                                return visitDate >= new Date() && visit.status === "scheduled"
                              })
                              .sort((a, b) => new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime())
                              .slice(0, 5)

                            if (upcomingVisits.length === 0) {
                              return (
                                <div className="text-center py-8">
                                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                  <p className="text-muted-foreground">Aucune visite programmée à venir</p>
                                  <p className="text-sm text-muted-foreground mt-2">
                                    Sélectionnez une date dans le calendrier pour voir les visites
                                  </p>
                                </div>
                              )
                            }

                            return (
                              <div className="space-y-3">
                                {upcomingVisits.map((visit) => {
                                  const { date, time } = formatDateTime(visit.visit_date, visit.visit_time)
                                  return (
                                    <div
                                      key={visit.id}
                                      className="p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                                      onClick={() => setSelectedDate(new Date(visit.visit_date))}
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <p className="font-medium truncate">{time}</p>
                                        {getStatusBadge(visit.status)}
                                      </div>
                                      <p className="text-sm font-medium truncate">{visit.property.title}</p>
                                      <p className="text-sm text-muted-foreground truncate">
                                        {visit.property.address}, {visit.property.city}
                                      </p>
                                      <p className="text-sm text-muted-foreground truncate">
                                        {visit.visitor_name || "Visiteur"}
                                      </p>
                                      <p className="text-xs text-blue-600 mt-1">{date}</p>
                                    </div>
                                  )
                                })}
                                <p className="text-xs text-muted-foreground text-center mt-4">
                                  Cliquez sur une visite ou sélectionnez une date dans le calendrier
                                </p>
                              </div>
                            )
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
