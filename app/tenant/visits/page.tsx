"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { authService } from "@/lib/auth-service"
import { visitService } from "@/lib/visit-service"
import { toast } from "sonner"
import { CalendarIcon, Clock, CheckCircle, XCircle, Filter, Search, MapPin, User, Building } from "lucide-react"
import { EnhancedVisitCalendar } from "@/components/enhanced-visit-calendar"

// ====================================
// Page principale
// ====================================
export default function VisitsPage() {
  const [visits, setVisits] = useState<any[]>([])
  const [filteredVisits, setFilteredVisits] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // ====================================
  // Chargement des données utilisateur + visites
  // ====================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("⏳ Chargement des visites locataire...")
        setIsLoading(true)

        const user = await authService.getCurrentUser()
        console.log("🔐 Utilisateur récupéré:", user)

        if (!user) {
          toast.error("Vous devez être connecté pour voir vos visites")
          return
        }

        if (user.user_type !== "tenant") {
          toast.error("Accès réservé aux locataires")
          return
        }

        setCurrentUser(user)

        const visitsData = await visitService.getTenantVisits(user.id)
        setVisits(visitsData)
        setFilteredVisits(visitsData)
      } catch (error) {
        console.error("❌ Erreur chargement visites:", error)
        toast.error("Erreur lors du chargement des visites")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // ====================================
  // Filtrage des visites
  // ====================================
  useEffect(() => {
    let filtered = visits

    if (searchQuery) {
      filtered = filtered.filter(
        (visit) =>
          visit.property?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          visit.property?.address?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((visit) => visit.status === statusFilter)
    }

    setFilteredVisits(filtered)
  }, [visits, searchQuery, statusFilter])

  // ====================================
  // Gestion des mises à jour de visites
  // ====================================
  const handleVisitUpdate = async (visitId: string, updates: any) => {
    try {
      const response = await fetch(`/api/visits`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: visitId, ...updates }),
      })

      if (response.ok) {
        const { visit } = await response.json()
        setVisits(prev => prev.map(v => v.id === visitId ? { ...v, ...visit, ...updates } : v))
        setFilteredVisits(prev => prev.map(v => v.id === visitId ? { ...v, ...visit, ...updates } : v))
        toast.success("Visite mise à jour avec succès")
      } else {
        toast.error("Erreur lors de la mise à jour")
      }
    } catch (error) {
      console.error("Erreur mise à jour visite:", error)
      toast.error("Erreur lors de la mise à jour")
    }
  }

  // ====================================
  // Fonctions utilitaires
  // ====================================
  function getStatusBadgeVariant(status: string) {
    switch (status) {
      case "proposed":
        return "secondary"
      case "confirmed":
      case "scheduled":
      case "completed":
        return "default"
      case "cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case "proposed":
        return "Proposée"
      case "confirmed":
        return "Confirmée"
      case "scheduled":
        return "Programmée"
      case "completed":
        return "Terminée"
      case "cancelled":
        return "Annulée"
      default:
        return status
    }
  }

  function formatDateTime(dateString: string, timeString?: string) {
    const date = new Date(dateString)
    const time = timeString || "00:00"

    return {
      date: date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
      time,
    }
  }

  async function handleConfirmVisit(visitId: string) {
    try {
      await visitService.updateVisitStatus(visitId, "confirmed")
      toast.success("Visite confirmée")
      const visitsData = await visitService.getTenantVisits(currentUser.id)
      setVisits(visitsData)
      setFilteredVisits(visitsData)
    } catch (error) {
      console.error("❌ Erreur confirmation visite:", error)
      toast.error("Erreur lors de la confirmation")
    }
  }

  async function handleCancelVisit(visitId: string) {
    try {
      await visitService.updateVisitStatus(visitId, "cancelled")
      toast.success("Visite annulée")
      const visitsData = await visitService.getTenantVisits(currentUser.id)
      setVisits(visitsData)
      setFilteredVisits(visitsData)
    } catch (error) {
      console.error("❌ Erreur annulation visite:", error)
      toast.error("Erreur lors de l'annulation")
    }
  }

  // ====================================
  // Statistiques
  // ====================================
  const stats = {
    total: visits.length,
    upcoming: visits.filter((v) => {
      const visitDate = new Date(v.visit_date)
      return visitDate > new Date() && ["scheduled", "confirmed", "proposed"].includes(v.status)
    }).length,
    completed: visits.filter((v) => v.status === "completed").length,
    interested: visits.filter((v) => v.tenant_interest === "interested").length,
    not_interested: visits.filter((v) => v.tenant_interest === "not_interested").length,
  }

  // ====================================
  // Rendu principal
  // ====================================
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Chargement de vos visites...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <p className="text-red-600">Vous devez être connecté pour voir vos visites</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Mes visites</h1>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
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
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">À venir</p>
                <p className="text-2xl font-bold text-blue-600">{stats.upcoming}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
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
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Intéressé</p>
                <p className="text-2xl font-bold text-green-600">{stats.interested}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pas intéressé</p>
                <p className="text-2xl font-bold text-red-600">{stats.not_interested}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Input
                placeholder="Rechercher une propriété..."
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
                <SelectItem value="proposed">Proposées</SelectItem>
                <SelectItem value="confirmed">Confirmées</SelectItem>
                <SelectItem value="scheduled">Programmées</SelectItem>
                <SelectItem value="completed">Terminées</SelectItem>
                <SelectItem value="interested">Intéressé</SelectItem>
                <SelectItem value="not_interested">Pas intéressé</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("")
                setStatusFilter("all")
              }}
              className="w-full sm:w-auto"
            >
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calendrier des visites */}
      <EnhancedVisitCalendar
        visits={filteredVisits}
        userType="tenant"
        onVisitUpdate={handleVisitUpdate}
      />
    </div>
  )
}
