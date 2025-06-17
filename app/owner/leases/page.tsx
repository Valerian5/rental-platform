"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { FileText, Plus, Search, Eye, Calendar, User, Home, Euro, Filter } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { authService } from "@/lib/auth-service"
import { supabase } from "@/lib/supabase"

// Fonction formatCurrency définie localement
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Fonction formatDate définie localement
const formatDate = (dateString?: string): string => {
  if (!dateString) return "Non spécifié"
  try {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  } catch (e) {
    return "Date invalide"
  }
}

export default function LeasesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [leases, setLeases] = useState<any[]>([])
  const [filteredLeases, setFilteredLeases] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadLeases()
  }, [])

  useEffect(() => {
    filterLeases()
  }, [leases, searchTerm, statusFilter])

  const loadLeases = async () => {
    try {
      setLoading(true)

      // Vérifier l'authentification
      const currentUser = await authService.getCurrentUser()
      if (!currentUser) {
        toast.error("Vous devez être connecté")
        router.push("/login")
        return
      }
      setUser(currentUser)

      // Récupérer le token de session
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session?.access_token) {
        toast.error("Session expirée")
        router.push("/login")
        return
      }

      // Charger les baux du propriétaire
      const response = await fetch(`/api/leases?owner_id=${currentUser.id}`, {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      })

      if (!response.ok) {
        toast.error("Erreur lors du chargement des baux")
        return
      }

      const data = await response.json()
      console.log("📋 Baux chargés:", data.leases?.length || 0)
      setLeases(data.leases || [])
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }

  const filterLeases = () => {
    let filtered = leases

    // Filtrer par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(
        (lease) =>
          lease.tenant?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lease.tenant?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lease.property?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lease.property?.address?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filtrer par statut
    if (statusFilter !== "all") {
      filtered = filtered.filter((lease) => lease.status === statusFilter)
    }

    setFilteredLeases(filtered)
  }

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    pending_signatures: "bg-amber-100 text-amber-800",
    signed: "bg-green-100 text-green-800",
    active: "bg-blue-100 text-blue-800",
    terminated: "bg-red-100 text-red-800",
  }

  const statusLabels: Record<string, string> = {
    draft: "Brouillon",
    pending_signatures: "En attente de signatures",
    signed: "Signé",
    active: "Actif",
    terminated: "Terminé",
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Chargement des baux...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <BreadcrumbNav
        items={[
          { label: "Tableau de bord", href: "/owner/dashboard" },
          { label: "Baux", href: "/owner/leases" },
        ]}
      />

      <PageHeader title="Mes baux" description="Gérez tous vos contrats de location">
        <Button onClick={() => router.push("/owner/leases/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau bail
        </Button>
      </PageHeader>

      <div className="mt-6 space-y-6">
        {/* Filtres */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par locataire ou propriété..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                >
                  Tous
                </Button>
                <Button
                  variant={statusFilter === "draft" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("draft")}
                >
                  Brouillons
                </Button>
                <Button
                  variant={statusFilter === "active" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("active")}
                >
                  Actifs
                </Button>
                <Button
                  variant={statusFilter === "signed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("signed")}
                >
                  Signés
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des baux */}
        {filteredLeases.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">{leases.length === 0 ? "Aucun bail" : "Aucun résultat"}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {leases.length === 0
                  ? "Vous n'avez pas encore créé de bail."
                  : "Aucun bail ne correspond à vos critères de recherche."}
              </p>
              {leases.length === 0 && (
                <Button onClick={() => router.push("/owner/leases/new")} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Créer mon premier bail
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredLeases.map((lease) => (
              <Card key={lease.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <Badge className={statusColors[lease.status] || "bg-gray-100 text-gray-800"}>
                          {statusLabels[lease.status] || "Statut inconnu"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">Bail #{lease.id.slice(0, 8)}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {lease.tenant?.first_name} {lease.tenant?.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">{lease.tenant?.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{lease.property?.title}</p>
                            <p className="text-sm text-muted-foreground">{lease.property?.address}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Euro className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{formatCurrency(lease.monthly_rent)}</p>
                            <p className="text-sm text-muted-foreground">par mois</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Du {formatDate(lease.start_date)} au {formatDate(lease.end_date)}
                          </span>
                        </div>
                        <div>Type: {lease.lease_type === "furnished" ? "Meublé" : "Non meublé"}</div>
                      </div>

                      {/* Statut des signatures */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${lease.signed_by_owner ? "bg-green-500" : "bg-gray-300"}`}
                          ></div>
                          <span className={lease.signed_by_owner ? "text-green-700" : "text-muted-foreground"}>
                            Propriétaire {lease.signed_by_owner ? "signé" : "non signé"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${lease.signed_by_tenant ? "bg-green-500" : "bg-gray-300"}`}
                          ></div>
                          <span className={lease.signed_by_tenant ? "text-green-700" : "text-muted-foreground"}>
                            Locataire {lease.signed_by_tenant ? "signé" : "non signé"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/owner/leases/${lease.id}`)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Voir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
