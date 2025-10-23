"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Wrench, 
  Plus, 
  CheckCircle, 
  Clock, 
  Euro,
  Calendar,
  User,
  Phone,
  AlertTriangle
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface MaintenanceWork {
  id: string
  title: string
  description: string
  type: string
  category: string
  status: string
  scheduled_date: string
  completed_date?: string
  cost?: number
  provider_name?: string
  provider_contact?: string
  property: {
    id: string
    title: string
    address: string
  }
  lease: {
    id: string
    tenant: {
      first_name: string
      last_name: string
    }
  }
}

interface MaintenanceExpenseConnectorProps {
  ownerId: string
  year: number
  onExpenseCreated?: () => void
}

export function MaintenanceExpenseConnector({ 
  ownerId, 
  year, 
  onExpenseCreated 
}: MaintenanceExpenseConnectorProps) {
  const [maintenanceWorks, setMaintenanceWorks] = useState<MaintenanceWork[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [creatingExpense, setCreatingExpense] = useState<string | null>(null)

  useEffect(() => {
    loadMaintenanceWorks()
  }, [ownerId, year])

  const loadMaintenanceWorks = async () => {
    try {
      setIsLoading(true)
      
      // Récupérer le token d'authentification
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session?.access_token) {
        toast.error("Session expirée, veuillez vous reconnecter")
        return
      }

      const response = await fetch(`/api/maintenance/owner?ownerId=${ownerId}&year=${year}`, {
        headers: { 
          "Authorization": `Bearer ${sessionData.session.access_token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setMaintenanceWorks(data.works || [])
      } else {
        console.error("Erreur chargement travaux:", data.error)
        toast.error("Erreur lors du chargement des travaux")
      }
    } catch (error) {
      console.error("Erreur chargement travaux:", error)
      toast.error("Erreur lors du chargement des travaux")
    } finally {
      setIsLoading(false)
    }
  }

  const createExpenseFromMaintenance = async (work: MaintenanceWork) => {
    try {
      setCreatingExpense(work.id)
      
      // Récupérer le token d'authentification
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session?.access_token) {
        toast.error("Session expirée, veuillez vous reconnecter")
        return
      }

      // Déterminer la catégorie fiscale basée sur le type de travaux
      const getFiscalCategory = (type: string, category: string) => {
        if (type === "improvement") return "improvement"
        if (category === "plumbing" || category === "electrical" || category === "heating") return "repair"
        return "maintenance"
      }

      const expenseData = {
        property_id: work.property.id,
        lease_id: work.lease.id,
        type: "maintenance",
        category: getFiscalCategory(work.type, work.category),
        amount: work.cost || 0,
        date: work.completed_date || work.scheduled_date,
        description: `${work.title} - ${work.description}`,
        receipt_url: ""
      }

      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionData.session.access_token}`
        },
        body: JSON.stringify(expenseData)
      })

      const data = await response.json()
      if (data.success) {
        toast.success("Dépense créée à partir des travaux de maintenance")
        onExpenseCreated?.()
      } else {
        toast.error(data.error || "Erreur lors de la création de la dépense")
      }
    } catch (error) {
      console.error("Erreur création dépense:", error)
      toast.error("Erreur lors de la création de la dépense")
    } finally {
      setCreatingExpense(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-600">Terminé</Badge>
      case "in_progress":
        return <Badge className="bg-orange-600">En cours</Badge>
      case "scheduled":
        return <Badge className="bg-blue-600">Programmé</Badge>
      case "cancelled":
        return <Badge variant="destructive">Annulé</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "preventive":
        return <Badge variant="secondary">Préventif</Badge>
      case "corrective":
        return <Badge className="bg-orange-600">Correctif</Badge>
      case "improvement":
        return <Badge className="bg-purple-600">Amélioration</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-muted-foreground">Chargement des travaux de maintenance...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Travaux de maintenance programmés
        </CardTitle>
        <CardDescription>
          Connectez vos travaux de maintenance aux dépenses fiscales
        </CardDescription>
      </CardHeader>
      <CardContent>
        {maintenanceWorks.length > 0 ? (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Travaux</TableHead>
                  <TableHead>Propriété</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Coût</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenanceWorks.map((work) => (
                  <TableRow key={work.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{work.title}</span>
                          {getTypeBadge(work.type)}
                        </div>
                        <p className="text-sm text-muted-foreground">{work.description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Catégorie: {work.category}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium">{work.property.title}</p>
                        <p className="text-muted-foreground">{work.property.address}</p>
                        <p className="text-xs text-muted-foreground">
                          Locataire: {work.lease.tenant.first_name} {work.lease.tenant.last_name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Prévu: {formatDate(work.scheduled_date)}</span>
                        </div>
                        {work.completed_date && (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-3 w-3" />
                            <span>Terminé: {formatDate(work.completed_date)}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Euro className="h-4 w-4" />
                        <span className="font-semibold">
                          {work.cost ? `${work.cost.toLocaleString('fr-FR')} €` : "Non défini"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(work.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => createExpenseFromMaintenance(work)}
                        disabled={creatingExpense === work.id || !work.cost || work.status === "cancelled"}
                        variant={work.status === "completed" ? "default" : "outline"}
                      >
                        {creatingExpense === work.id ? (
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4 mr-2" />
                        )}
                        {creatingExpense === work.id ? "Création..." : "Créer dépense"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun travaux de maintenance</h3>
            <p className="text-muted-foreground mb-4">
              Aucun travaux de maintenance programmé pour l'année {year}
            </p>
            <Button asChild>
              <a href="/owner/rental-management/maintenance">
                <Plus className="h-4 w-4 mr-2" />
                Programmer des travaux
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
