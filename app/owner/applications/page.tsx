"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { ModernApplicationCard } from "@/components/modern-application-card"
import { RefusalDialog } from "@/components/refusal-dialog"
import { VisitProposalManager } from "@/components/visit-proposal-manager"
import { Search, Filter, SortAsc, SortDesc, CheckCircle, XCircle } from "lucide-react"

export default function ApplicationsPage() {
  const router = useRouter()
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState("created_at")
  const [sortDirection, setSortDirection] = useState("desc")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedApplications, setSelectedApplications] = useState<string[]>([])
  const [showRefuseDialog, setShowRefuseDialog] = useState(false)
  const [currentApplication, setCurrentApplication] = useState<any>(null)

  // Ajout des états pour la gestion des visites
  const [showVisitDialog, setShowVisitDialog] = useState(false)
  const [propertyForVisit, setPropertyForVisit] = useState<any>(null)
  const [applicationForVisit, setApplicationForVisit] = useState<any>(null)
  const [tenantForVisit, setTenantForVisit] = useState<any>(null)

  useEffect(() => {
    loadApplications()
  }, [sortField, sortDirection, statusFilter])

  const loadApplications = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/applications?sort=${sortField}&direction=${sortDirection}&status=${statusFilter}`,
      )
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des candidatures")
      }
      const data = await response.json()
      setApplications(data.applications || [])
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du chargement des candidatures")
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: string, application: any) => {
    console.log("Action:", action, "pour candidature:", application.id)
    setCurrentApplication(application)

    switch (action) {
      case "view_details":
        router.push(`/owner/applications/${application.id}`)
        break
      case "analyze":
        await updateApplicationStatus(application.id, "analyzing")
        router.push(`/owner/applications/${application.id}`)
        break
      case "accept":
        await updateApplicationStatus(application.id, "accepted")
        break
      case "refuse":
        setShowRefuseDialog(true)
        break
      case "contact":
        if (application.tenant_id) {
          router.push(`/owner/messaging?tenant_id=${application.tenant_id}`)
        } else {
          toast.error("Impossible de contacter ce locataire")
        }
        break
      case "generate_lease":
        router.push(`/owner/leases/new?application=${application.id}`)
        break
      case "propose_visit":
        // Préparer les données pour la proposition de visite
        setPropertyForVisit({
          id: application.property_id,
          title: application.property?.title || "Propriété",
        })
        setApplicationForVisit({
          id: application.id,
        })
        setTenantForVisit({
          name: `${application.tenant?.first_name || ""} ${application.tenant?.last_name || ""}`,
        })
        setShowVisitDialog(true)
        break
      default:
        toast.error("Action non reconnue")
    }
  }

  const updateApplicationStatus = async (id: string, status: string, notes?: string) => {
    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          notes,
        }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour du statut")
      }

      toast.success("Statut mis à jour avec succès")
      loadApplications()
      return true
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la mise à jour du statut")
      return false
    }
  }

  const handleRefuseConfirm = async (reason: string, type: string) => {
    if (!currentApplication) return

    // Préparer le message de refus
    let notes = ""
    const refusalReasons: { [key: string]: string } = {
      insufficient_income: "Revenus insuffisants",
      incomplete_file: "Dossier incomplet",
      missing_guarantor: "Absence de garant",
      unstable_situation: "Situation professionnelle instable",
      other: reason,
    }
    notes = refusalReasons[type] || reason

    const success = await updateApplicationStatus(currentApplication.id, "rejected", notes)
    if (success) {
      setShowRefuseDialog(false)
    }
  }

  // Gestionnaire pour la proposition de visite
  const handleVisitProposed = async (slots: any[]) => {
    if (!applicationForVisit) return

    try {
      // Mettre à jour le statut de la candidature
      const success = await updateApplicationStatus(applicationForVisit.id, "visit_proposed")

      if (success) {
        toast.success("Créneaux de visite proposés avec succès")
        setShowVisitDialog(false)
      }
    } catch (error) {
      console.error("Erreur lors de la proposition de visite:", error)
      toast.error("Erreur lors de la proposition de visite")
    }
  }

  const filteredApplications = applications.filter((app) => {
    if (searchTerm === "") return true
    const searchLower = searchTerm.toLowerCase()
    return (
      app.tenant?.first_name?.toLowerCase().includes(searchLower) ||
      app.tenant?.last_name?.toLowerCase().includes(searchLower) ||
      app.property?.title?.toLowerCase().includes(searchLower) ||
      app.property?.address?.toLowerCase().includes(searchLower)
    )
  })

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const toggleSelectApplication = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedApplications([...selectedApplications, id])
    } else {
      setSelectedApplications(selectedApplications.filter((appId) => appId !== id))
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedApplications.length === 0) {
      toast.error("Aucune candidature sélectionnée")
      return
    }

    switch (action) {
      case "accept":
        for (const id of selectedApplications) {
          await updateApplicationStatus(id, "accepted")
        }
        setSelectedApplications([])
        break
      case "refuse":
        // Pour le refus en masse, on utilise une raison générique
        for (const id of selectedApplications) {
          await updateApplicationStatus(id, "rejected", "Refus groupé")
        }
        setSelectedApplications([])
        break
      default:
        toast.error("Action non reconnue")
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Candidatures" description="Gérez les candidatures pour vos biens immobiliers">
        <div className="flex gap-2">
          {selectedApplications.length > 0 && (
            <>
              <Button variant="outline" onClick={() => handleBulkAction("accept")}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Accepter ({selectedApplications.length})
              </Button>
              <Button variant="outline" onClick={() => handleBulkAction("refuse")}>
                <XCircle className="h-4 w-4 mr-2" />
                Refuser ({selectedApplications.length})
              </Button>
            </>
          )}
        </div>
      </PageHeader>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <div className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrer par statut" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="analyzing">En analyse</SelectItem>
              <SelectItem value="visit_scheduled">Visite planifiée</SelectItem>
              <SelectItem value="accepted">Acceptées</SelectItem>
              <SelectItem value="rejected">Refusées</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortField} onValueChange={setSortField}>
            <SelectTrigger className="w-full md:w-[180px]">
              <div className="flex items-center">
                {sortDirection === "asc" ? <SortAsc className="h-4 w-4 mr-2" /> : <SortDesc className="h-4 w-4 mr-2" />}
                <SelectValue placeholder="Trier par" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Date de candidature</SelectItem>
              <SelectItem value="income">Revenus</SelectItem>
              <SelectItem value="match_score">Score de compatibilité</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => toggleSort(sortField)}
            title={sortDirection === "asc" ? "Tri croissant" : "Tri décroissant"}
          >
            {sortDirection === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Chargement des candidatures...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-lg font-medium">Aucune candidature trouvée</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchTerm
                ? "Essayez de modifier vos critères de recherche"
                : "Vous n'avez pas encore reçu de candidatures"}
            </p>
          </div>
        ) : (
          filteredApplications.map((application) => (
            <ModernApplicationCard
              key={application.id}
              application={application}
              isSelected={selectedApplications.includes(application.id)}
              onSelect={(selected) => toggleSelectApplication(application.id, selected)}
              onAction={(action) => handleAction(action, application)}
            />
          ))
        )}
      </div>

      <RefusalDialog
        open={showRefuseDialog}
        onClose={() => setShowRefuseDialog(false)}
        onConfirm={handleRefuseConfirm}
      />

      {/* Dialogue de proposition de visite */}
      {showVisitDialog && propertyForVisit && applicationForVisit && (
        <VisitProposalManager
          isOpen={showVisitDialog}
          onClose={() => setShowVisitDialog(false)}
          propertyId={propertyForVisit.id}
          propertyTitle={propertyForVisit.title}
          applicationId={applicationForVisit.id}
          tenantName={tenantForVisit?.name || "Candidat"}
          onSlotsProposed={handleVisitProposed}
        />
      )}
    </div>
  )
}
