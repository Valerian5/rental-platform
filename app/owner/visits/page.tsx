"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/page-header"
import { EnhancedVisitCalendar } from "@/components/enhanced-visit-calendar"
import { OwnerVisitFeedback } from "@/components/owner-visit-feedback"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"
import {
  CalendarIcon,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  Building,
} from "lucide-react"

interface Visit {
  id: string
  visit_date: string
  visit_time: string
  start_time?: string
  end_time?: string
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
  tenant_interest?: "interested" | "not_interested"
  feedback?: {
    rating: number
    comment: string
    submitted_at: string
  }
  owner_feedback?: any
}

export default function OwnerVisitsPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [visits, setVisits] = useState<Visit[]>([])
  const [filteredVisits, setFilteredVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const statusConfig = {
    scheduled: { label: "Programmée", variant: "default" as const, icon: Clock },
    completed: { label: "Terminée", variant: "outline" as const, icon: CheckCircle },
    cancelled: { label: "Annulée", variant: "destructive" as const, icon: XCircle },
    interested: { label: "Intéressé", variant: "default" as const, icon: CheckCircle },
    not_interested: { label: "Pas intéressé", variant: "destructive" as const, icon: XCircle },
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

  // Fonction pour marquer automatiquement les visites passées comme "completed"
  const markPastVisitsAsCompleted = (visits: Visit[]) => {
    const now = new Date()
    return visits.map(visit => {
      if (visit.status === "scheduled" || visit.status === "confirmed") {
        const visitDateTime = new Date(`${visit.visit_date}T${visit.visit_time || "00:00"}`)
        // Si la visite est passée de plus de 30 minutes, la marquer comme terminée
        if (visitDateTime < now && (now.getTime() - visitDateTime.getTime()) > 30 * 60 * 1000) {
          return { ...visit, status: "completed" }
        }
      }
      return visit
    })
  }

  const loadVisits = async (ownerId: string) => {
    try {
      const response = await fetch(`/api/visits?owner_id=${ownerId}`)
      if (response.ok) {
        const data = await response.json()
        const visitsWithCompletedStatus = markPastVisitsAsCompleted(data.visits || [])
        setVisits(visitsWithCompletedStatus)
        setFilteredVisits(visitsWithCompletedStatus)
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

    setFilteredVisits(filtered)
  }, [visits, searchQuery, statusFilter])

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

  const stats = {
    total: visits.length,
    scheduled: visits.filter((v) => v.status === "scheduled").length,
    completed: visits.filter((v) => v.status === "completed").length,
    interested: visits.filter((v) => v.status === "interested" || v.tenant_interest === "interested").length,
    not_interested: visits.filter((v) => v.status === "not_interested" || v.tenant_interest === "not_interested").length,
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                <p className="text-sm font-medium text-muted-foreground">Intéressés</p>
                <p className="text-2xl font-bold text-green-600">{stats.interested}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pas intéressés</p>
                <p className="text-2xl font-bold text-red-600">{stats.not_interested}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <SelectItem value="interested">Intéressés</SelectItem>
                <SelectItem value="not_interested">Pas intéressés</SelectItem>
                <SelectItem value="cancelled">Annulées</SelectItem>
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
        userType="owner"
        onVisitUpdate={handleVisitUpdate}
      />
    </div>
  )
}
