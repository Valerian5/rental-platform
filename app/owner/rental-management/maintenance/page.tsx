"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Wrench, Plus, Search, CalendarIcon, CheckCircle, Clock, Euro, Phone, User, Edit, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { authService } from "@/lib/auth-service"
import { rentalManagementService } from "@/lib/rental-management-service"
import { EditMaintenanceDialog } from "@/components/maintenance/EditMaintenanceDialog"
import { ValidateMaintenanceDialog } from "@/components/maintenance/ValidateMaintenanceDialog"
import { toast } from "sonner"

export default function MaintenancePage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [leases, setLeases] = useState<any[]>([])
  const [maintenanceWorks, setMaintenanceWorks] = useState<any[]>([])
  const [filteredWorks, setFilteredWorks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [scheduledDate, setScheduledDate] = useState<Date>()
  const [filters, setFilters] = useState({
    status: "all",
    type: "all",
    category: "all",
    property: "all",
    search: "",
  })

  // Formulaire nouveaux travaux
  const [newMaintenance, setNewMaintenance] = useState({
    title: "",
    description: "",
    type: "preventive",
    category: "",
    property_id: "",
    lease_id: "",
    cost: "",
    provider_name: "",
    provider_contact: "",
  })

  // États pour modification et validation
  const [editingWork, setEditingWork] = useState<any>(null)
  const [validatingWork, setValidatingWork] = useState<any>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showValidateDialog, setShowValidateDialog] = useState(false)

  useEffect(() => {
    const initializeData = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "owner") return

        setCurrentUser(user)
        const leasesData = await rentalManagementService.getOwnerLeases(user.id)
        setLeases(leasesData)

        // Charger tous les travaux de toutes les propriétés
        const allWorks = []
        for (const lease of leasesData) {
          const propertyWorks = await rentalManagementService.getPropertyMaintenanceWorks(lease.property.id)
          allWorks.push(...propertyWorks)
        }
        setMaintenanceWorks(allWorks)
      } catch (error) {
        console.error("Erreur initialisation:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [maintenanceWorks, filters])

  const applyFilters = () => {
    let filtered = maintenanceWorks

    if (filters.status !== "all") {
      filtered = filtered.filter((work) => work.status === filters.status)
    }

    if (filters.type !== "all") {
      filtered = filtered.filter((work) => work.type === filters.type)
    }

    if (filters.category !== "all") {
      filtered = filtered.filter((work) => work.category === filters.category)
    }

    if (filters.property !== "all") {
      filtered = filtered.filter((work) => work.property_id === filters.property)
    }

    if (filters.search) {
      filtered = filtered.filter(
        (work) =>
          work.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          work.description.toLowerCase().includes(filters.search.toLowerCase()) ||
          work.provider_name?.toLowerCase().includes(filters.search.toLowerCase()),
      )
    }

    setFilteredWorks(filtered)
  }

  const handleScheduleMaintenance = async () => {
    if (
      !newMaintenance.title ||
      !newMaintenance.description ||
      !newMaintenance.category ||
      !newMaintenance.property_id ||
      !scheduledDate
    ) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }

    try {
      const selectedLease = leases.find((lease) => lease.property.id === newMaintenance.property_id)
      if (!selectedLease) {
        toast.error("Bail non trouvé pour cette propriété")
        return
      }

      await rentalManagementService.scheduleMaintenanceWork({
        ...newMaintenance,
        lease_id: selectedLease.id,
        scheduled_date: scheduledDate.toISOString(),
        cost: newMaintenance.cost ? Number(newMaintenance.cost) : 0,
      })

      toast.success("Travaux programmés avec succès")
      setNewMaintenance({
        title: "",
        description: "",
        type: "preventive",
        category: "",
        property_id: "",
        lease_id: "",
        cost: "",
        provider_name: "",
        provider_contact: "",
      })
      setScheduledDate(undefined)

      // Recharger les travaux
      const allWorks = []
      for (const lease of leases) {
        const propertyWorks = await rentalManagementService.getPropertyMaintenanceWorks(lease.property.id)
        allWorks.push(...propertyWorks)
      }
      setMaintenanceWorks(allWorks)
    } catch (error) {
      toast.error("Erreur lors de la programmation")
    }
  }

  const handleEditWork = (work: any) => {
    setEditingWork(work)
    setShowEditDialog(true)
  }

  const handleValidateWork = (work: any) => {
    setValidatingWork(work)
    setShowValidateDialog(true)
  }

  const handleUpdateWork = async (updatedWork: any) => {
    try {
      // Appel API pour mettre à jour le travail
      const response = await fetch(`/api/maintenance/${updatedWork.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedWork)
      })

      if (response.ok) {
        toast.success("Travaux modifiés avec succès")
        setShowEditDialog(false)
        setEditingWork(null)
        
        // Recharger les travaux
        const allWorks = []
        for (const lease of leases) {
          const propertyWorks = await rentalManagementService.getPropertyMaintenanceWorks(lease.property.id)
          allWorks.push(...propertyWorks)
        }
        setMaintenanceWorks(allWorks)
      } else {
        toast.error("Erreur lors de la modification")
      }
    } catch (error) {
      toast.error("Erreur lors de la modification")
    }
  }

  const handleCreateExpenseFromWork = async (work: any, expenseData: any) => {
    try {
      // Créer la dépense dans la table expenses
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          property_id: work.property_id,
          lease_id: work.lease_id,
          type: "maintenance",
          category: expenseData.category,
          amount: expenseData.amount,
          date: expenseData.date,
          description: expenseData.description,
          deductible: expenseData.deductible,
          receipt_url: expenseData.receipt_url || null
        })
      })

      if (response.ok) {
        // Marquer le travail comme terminé
        await fetch(`/api/maintenance/${work.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "completed",
            completed_date: expenseData.date,
            cost: expenseData.amount
          })
        })

        toast.success("Travaux validé et dépense créée avec succès")
        setShowValidateDialog(false)
        setValidatingWork(null)
        
        // Recharger les travaux
        const allWorks = []
        for (const lease of leases) {
          const propertyWorks = await rentalManagementService.getPropertyMaintenanceWorks(lease.property.id)
          allWorks.push(...propertyWorks)
        }
        setMaintenanceWorks(allWorks)
      } else {
        toast.error("Erreur lors de la création de la dépense")
      }
    } catch (error) {
      toast.error("Erreur lors de la validation")
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

  const getMaintenanceStats = () => {
    const scheduled = maintenanceWorks.filter((w) => w.status === "scheduled").length
    const inProgress = maintenanceWorks.filter((w) => w.status === "in_progress").length
    const completed = maintenanceWorks.filter((w) => w.status === "completed").length
    const totalCost = maintenanceWorks
      .filter((w) => w.status === "completed")
      .reduce((sum, w) => sum + (w.cost || 0), 0)

    return { scheduled, inProgress, completed, totalCost }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Chargement des travaux...</p>
        </div>
      </div>
    )
  }

  const stats = getMaintenanceStats()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Travaux de Maintenance</h1>
          <p className="text-gray-600">Planifiez et suivez les interventions sur vos propriétés</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Programmer des travaux
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Programmer de nouveaux travaux</DialogTitle>
              <DialogDescription>Planifiez une intervention de maintenance sur une de vos propriétés</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maintenance-property">Propriété *</Label>
                  <Select
                    value={newMaintenance.property_id}
                    onValueChange={(value) => setNewMaintenance((prev) => ({ ...prev, property_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une propriété" />
                    </SelectTrigger>
                    <SelectContent>
                      {leases.map((lease) => (
                        <SelectItem key={lease.property.id} value={lease.property.id}>
                          {lease.property.title} - {lease.tenant.first_name} {lease.tenant.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="maintenance-type">Type *</Label>
                  <Select
                    value={newMaintenance.type}
                    onValueChange={(value) => setNewMaintenance((prev) => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preventive">Préventif</SelectItem>
                      <SelectItem value="corrective">Correctif</SelectItem>
                      <SelectItem value="improvement">Amélioration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="maintenance-title">Titre *</Label>
                <Input
                  id="maintenance-title"
                  value={newMaintenance.title}
                  onChange={(e) => setNewMaintenance((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Révision chaudière annuelle"
                />
              </div>

              <div>
                <Label htmlFor="maintenance-description">Description *</Label>
                <Textarea
                  id="maintenance-description"
                  value={newMaintenance.description}
                  onChange={(e) => setNewMaintenance((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Décrivez les travaux à effectuer..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maintenance-category">Catégorie *</Label>
                  <Select
                    value={newMaintenance.category}
                    onValueChange={(value) => setNewMaintenance((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plumbing">Plomberie</SelectItem>
                      <SelectItem value="electrical">Électricité</SelectItem>
                      <SelectItem value="heating">Chauffage</SelectItem>
                      <SelectItem value="painting">Peinture</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date prévue *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !scheduledDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {scheduledDate ? format(scheduledDate, "PPP", { locale: fr }) : "Sélectionner une date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={scheduledDate}
                        onSelect={setScheduledDate}
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maintenance-provider">Prestataire</Label>
                  <Input
                    id="maintenance-provider"
                    value={newMaintenance.provider_name}
                    onChange={(e) => setNewMaintenance((prev) => ({ ...prev, provider_name: e.target.value }))}
                    placeholder="Nom du prestataire"
                  />
                </div>
                <div>
                  <Label htmlFor="maintenance-contact">Contact</Label>
                  <Input
                    id="maintenance-contact"
                    value={newMaintenance.provider_contact}
                    onChange={(e) => setNewMaintenance((prev) => ({ ...prev, provider_contact: e.target.value }))}
                    placeholder="Téléphone ou email"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="maintenance-cost">Coût estimé (€)</Label>
                <Input
                  id="maintenance-cost"
                  type="number"
                  value={newMaintenance.cost}
                  onChange={(e) => setNewMaintenance((prev) => ({ ...prev, cost: e.target.value }))}
                  placeholder="0"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline">Annuler</Button>
                <Button onClick={handleScheduleMaintenance}>Programmer les travaux</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Programmés</p>
                <p className="text-3xl font-bold text-blue-600">{stats.scheduled}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En cours</p>
                <p className="text-3xl font-bold text-orange-600">{stats.inProgress}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Terminés</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Coût total</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalCost}€</p>
              </div>
              <Euro className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Rechercher</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Rechercher dans les travaux..."
                  value={filters.search}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Statut</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="scheduled">Programmé</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={filters.type} onValueChange={(value) => setFilters((prev) => ({ ...prev, type: value }))}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="preventive">Préventif</SelectItem>
                  <SelectItem value="corrective">Correctif</SelectItem>
                  <SelectItem value="improvement">Amélioration</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Catégorie</Label>
              <Select
                value={filters.category}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="plumbing">Plomberie</SelectItem>
                  <SelectItem value="electrical">Électricité</SelectItem>
                  <SelectItem value="heating">Chauffage</SelectItem>
                  <SelectItem value="painting">Peinture</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des travaux */}
      <Card>
        <CardHeader>
          <CardTitle>Travaux de maintenance</CardTitle>
          <CardDescription>Planification et suivi des interventions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredWorks.length > 0 ? (
              filteredWorks.map((work) => (
                <div key={work.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{work.title}</h3>
                        {getTypeBadge(work.type)}
                      </div>
                      <p className="text-sm text-gray-600">{work.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Catégorie: {work.category}</span>
                        <span>Prévu le {new Date(work.scheduled_date).toLocaleDateString("fr-FR")}</span>
                        {work.cost > 0 && <span>Coût: {work.cost}€</span>}
                      </div>
                      {work.provider_name && (
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1 text-gray-400" />
                            <span>{work.provider_name}</span>
                          </div>
                          {work.provider_contact && (
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-1 text-gray-400" />
                              <span>{work.provider_contact}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {work.completed_date && (
                        <div className="mt-2 p-3 bg-green-50 rounded-lg">
                          <p className="text-sm text-green-800">
                            <strong>Terminé le {new Date(work.completed_date).toLocaleDateString("fr-FR")}</strong>
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(work.status)}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEditWork(work)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                      {work.status === "scheduled" && (
                        <Button 
                          size="sm" 
                          onClick={() => handleValidateWork(work)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Valider
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Wrench className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Aucun travaux trouvés</p>
                <p className="text-sm">Programmez des travaux de maintenance pour vos propriétés</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialogues */}
      <EditMaintenanceDialog
        work={editingWork}
        isOpen={showEditDialog}
        onClose={() => {
          setShowEditDialog(false)
          setEditingWork(null)
        }}
        onSave={handleUpdateWork}
      />

      <ValidateMaintenanceDialog
        work={validatingWork}
        isOpen={showValidateDialog}
        onClose={() => {
          setShowValidateDialog(false)
          setValidatingWork(null)
        }}
        onValidate={handleCreateExpenseFromWork}
      />
    </div>
  )
}
