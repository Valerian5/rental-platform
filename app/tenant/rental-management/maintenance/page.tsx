"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Plus, Search, Filter, Calendar, User, Building, Clock, CheckCircle } from "lucide-react"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"

interface MaintenanceRequest {
  id: string
  title: string
  description: string
  category: string
  priority: string
  status: string
  estimated_cost?: number
  created_at: string
  property?: {
    id: string
    title: string
    address: string
  }
  responses?: Array<{
    id: string
    message: string
    user_type: "owner" | "tenant"
    created_at: string
  }>
}

export default function TenantMaintenancePage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "tenant") {
          toast.error("Accès non autorisé")
          window.location.href = "/login"
          return
        }

        setCurrentUser(user)
        await loadRequests()
      } catch (error) {
        console.error("Erreur:", error)
        toast.error("Erreur lors du chargement")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const loadRequests = async () => {
    try {
      const res = await fetch("/api/maintenance/tenant", { cache: 'no-store' })
      const data = await res.json()

      if (data.success) {
        setRequests(data.requests || [])
      } else {
        console.error("❌ Erreur récupération demandes:", data.error)
        toast.error("Erreur lors du chargement des demandes")
      }
    } catch (error) {
      console.error("❌ Erreur fetch demandes:", error)
      toast.error("Erreur lors du chargement des demandes")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-600">Terminé</Badge>
      case "in_progress":
        return <Badge className="bg-orange-600">En cours</Badge>
      case "pending":
        return <Badge variant="secondary">En attente</Badge>
      case "approved":
        return <Badge className="bg-blue-600">Approuvé</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejeté</Badge>
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
      painting: "Peinture",
      flooring: "Sol",
      other: "Autre",
    }
    return categories[category as keyof typeof categories] || category
  }

  const filteredRequests = requests.filter((request) => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || request.status === statusFilter
    const matchesCategory = categoryFilter === "all" || request.category === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Chargement de vos demandes de travaux...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Demandes de travaux</h2>
          <p className="text-muted-foreground">
            Gérez vos demandes de travaux ({filteredRequests.length} demande{filteredRequests.length > 1 ? 's' : ''})
          </p>
        </div>
        <Button asChild>
          <Link href="/tenant/maintenance/new">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle demande
          </Link>
        </Button>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher une demande..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="approved">Approuvé</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
                <SelectItem value="rejected">Rejeté</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                <SelectItem value="plumbing">Plomberie</SelectItem>
                <SelectItem value="electrical">Électricité</SelectItem>
                <SelectItem value="heating">Chauffage</SelectItem>
                <SelectItem value="security">Sécurité</SelectItem>
                <SelectItem value="painting">Peinture</SelectItem>
                <SelectItem value="flooring">Sol</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des demandes */}
      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucune demande</h3>
            <p className="text-muted-foreground mb-4">
              {requests.length === 0 
                ? "Vous n'avez fait aucune demande de travaux pour le moment."
                : "Aucune demande ne correspond à vos critères de recherche."
              }
            </p>
            {requests.length === 0 && (
              <Button asChild>
                <Link href="/tenant/maintenance/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle demande
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{request.title}</h3>
                      {getStatusBadge(request.status)}
                      {getPriorityBadge(request.priority)}
                    </div>
                    
                    <p className="text-muted-foreground mb-3 line-clamp-2">{request.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Building className="h-4 w-4" />
                        <span>{request.property?.title}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(request.created_at).toLocaleDateString("fr-FR")}</span>
                      </div>
                      <Badge variant="outline">{getCategoryLabel(request.category)}</Badge>
                      {request.estimated_cost && (
                        <div className="flex items-center gap-1">
                          <span>Coût estimé : {request.estimated_cost}€</span>
                        </div>
                      )}
                      {request.responses && request.responses.length > 0 && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{request.responses.length} échange{request.responses.length > 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/tenant/maintenance/${request.id}`}>
                        Voir les détails
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
