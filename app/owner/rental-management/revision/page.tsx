"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { TrendingUp, Calculator, FileText, AlertCircle, Euro, Calendar, BarChart3, Search } from "lucide-react"
import { authService } from "@/lib/auth-service"
import { rentalManagementService } from "@/lib/rental-management-service"
import { toast } from "sonner"

export default function RevisionPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [leases, setLeases] = useState<any[]>([])
  const [revisions, setRevisions] = useState<any[]>([])
  const [filteredRevisions, setFilteredRevisions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: "all",
    year: new Date().getFullYear().toString(),
    search: "",
  })

  // Formulaire nouvelle révision
  const [newRevision, setNewRevision] = useState({
    lease_id: "",
    current_rent: "",
    insee_index_reference: "",
    insee_index_current: "",
    revision_date: "",
  })

  useEffect(() => {
    const initializeData = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "owner") return

        setCurrentUser(user)
        const leasesData = await rentalManagementService.getOwnerLeases(user.id)
        setLeases(leasesData)

        // Charger les révisions existantes
        const revisionsData = await rentalManagementService.getRentRevisions(user.id)
        setRevisions(revisionsData)
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
  }, [revisions, filters])

  const applyFilters = () => {
    let filtered = revisions

    if (filters.status !== "all") {
      filtered = filtered.filter((revision) => revision.status === filters.status)
    }

    if (filters.year !== "all") {
      filtered = filtered.filter(
        (revision) => new Date(revision.revision_date).getFullYear().toString() === filters.year,
      )
    }

    if (filters.search) {
      filtered = filtered.filter(
        (revision) =>
          revision.lease?.property?.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          revision.lease?.tenant?.first_name.toLowerCase().includes(filters.search.toLowerCase()) ||
          revision.lease?.tenant?.last_name.toLowerCase().includes(filters.search.toLowerCase()),
      )
    }

    setFilteredRevisions(filtered)
  }

  const calculateRevision = () => {
    if (!newRevision.current_rent || !newRevision.insee_index_reference || !newRevision.insee_index_current) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }

    const currentRent = Number.parseFloat(newRevision.current_rent)
    const indexRef = Number.parseFloat(newRevision.insee_index_reference)
    const indexCurrent = Number.parseFloat(newRevision.insee_index_current)

    const revisionPercentage = ((indexCurrent - indexRef) / indexRef) * 100
    const newRent = currentRent * (1 + revisionPercentage / 100)

    return {
      revisionPercentage: revisionPercentage.toFixed(2),
      newRent: newRent.toFixed(2),
      increase: (newRent - currentRent).toFixed(2),
    }
  }

  const handleCreateRevision = async () => {
    const calculation = calculateRevision()
    if (!calculation) return

    try {
      await rentalManagementService.createRentRevision({
        ...newRevision,
        new_rent: Number.parseFloat(calculation.newRent),
        revision_percentage: Number.parseFloat(calculation.revisionPercentage),
        status: "pending",
      })

      toast.success("Révision calculée et enregistrée avec succès")
      setNewRevision({
        lease_id: "",
        current_rent: "",
        insee_index_reference: "",
        insee_index_current: "",
        revision_date: "",
      })

      // Recharger les révisions
      const revisionsData = await rentalManagementService.getRentRevisions(currentUser.id)
      setRevisions(revisionsData)
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement")
    }
  }

  const handleApplyRevision = async (revisionId: string) => {
    try {
      await rentalManagementService.applyRentRevision(revisionId)
      toast.success("Révision appliquée avec succès")

      // Recharger les révisions
      const revisionsData = await rentalManagementService.getRentRevisions(currentUser.id)
      setRevisions(revisionsData)
    } catch (error) {
      toast.error("Erreur lors de l'application de la révision")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "applied":
        return <Badge className="bg-green-600">Appliquée</Badge>
      case "pending":
        return <Badge variant="secondary">En attente</Badge>
      case "cancelled":
        return <Badge variant="destructive">Annulée</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getRevisionStats = () => {
    const applied = revisions.filter((r) => r.status === "applied").length
    const pending = revisions.filter((r) => r.status === "pending").length
    const totalIncrease = revisions
      .filter((r) => r.status === "applied")
      .reduce((sum, r) => sum + (r.new_rent - r.current_rent), 0)
    const avgIncrease =
      revisions.length > 0 ? revisions.reduce((sum, r) => sum + r.revision_percentage, 0) / revisions.length : 0

    return { applied, pending, totalIncrease, avgIncrease }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Chargement des révisions...</p>
        </div>
      </div>
    )
  }

  const stats = getRevisionStats()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Révision des Loyers</h1>
          <p className="text-gray-600">Gérez les révisions annuelles selon l'indice INSEE</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Calculator className="h-4 w-4 mr-2" />
              Calculer une révision
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Calculer une révision de loyer</DialogTitle>
              <DialogDescription>Utilisez l'indice INSEE pour calculer la nouvelle révision</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="revision-lease">Bail concerné *</Label>
                <Select
                  value={newRevision.lease_id}
                  onValueChange={(value) => {
                    const selectedLease = leases.find((l) => l.id === value)
                    setNewRevision((prev) => ({
                      ...prev,
                      lease_id: value,
                      current_rent: selectedLease ? selectedLease.monthly_rent.toString() : "",
                    }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un bail" />
                  </SelectTrigger>
                  <SelectContent>
                    {leases.map((lease) => (
                      <SelectItem key={lease.id} value={lease.id}>
                        {lease.property.title} - {lease.tenant.first_name} {lease.tenant.last_name} (
                        {lease.monthly_rent}€)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="current-rent">Loyer actuel (€) *</Label>
                  <Input
                    id="current-rent"
                    type="number"
                    value={newRevision.current_rent}
                    onChange={(e) => setNewRevision((prev) => ({ ...prev, current_rent: e.target.value }))}
                    placeholder="1200"
                  />
                </div>
                <div>
                  <Label htmlFor="revision-date">Date de révision *</Label>
                  <Input
                    id="revision-date"
                    type="date"
                    value={newRevision.revision_date}
                    onChange={(e) => setNewRevision((prev) => ({ ...prev, revision_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="index-ref">Indice de référence *</Label>
                  <Input
                    id="index-ref"
                    type="number"
                    step="0.01"
                    value={newRevision.insee_index_reference}
                    onChange={(e) => setNewRevision((prev) => ({ ...prev, insee_index_reference: e.target.value }))}
                    placeholder="130.52"
                  />
                  <p className="text-xs text-gray-500 mt-1">Indice du trimestre de signature du bail</p>
                </div>
                <div>
                  <Label htmlFor="index-current">Indice actuel *</Label>
                  <Input
                    id="index-current"
                    type="number"
                    step="0.01"
                    value={newRevision.insee_index_current}
                    onChange={(e) => setNewRevision((prev) => ({ ...prev, insee_index_current: e.target.value }))}
                    placeholder="134.50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Dernier indice publié par l'INSEE</p>
                </div>
              </div>

              {newRevision.current_rent && newRevision.insee_index_reference && newRevision.insee_index_current && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Calcul de la révision</h4>
                  {(() => {
                    const calc = calculateRevision()
                    return calc ? (
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-blue-700">Augmentation</p>
                          <p className="font-bold text-blue-900">+{calc.revisionPercentage}%</p>
                        </div>
                        <div>
                          <p className="text-blue-700">Nouveau loyer</p>
                          <p className="font-bold text-blue-900">{calc.newRent}€</p>
                        </div>
                        <div>
                          <p className="text-blue-700">Différence</p>
                          <p className="font-bold text-blue-900">+{calc.increase}€</p>
                        </div>
                      </div>
                    ) : null
                  })()}
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline">Annuler</Button>
                <Button onClick={handleCreateRevision}>Enregistrer la révision</Button>
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
                <p className="text-sm font-medium text-gray-600">Appliquées</p>
                <p className="text-3xl font-bold text-green-600">{stats.applied}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gain total</p>
                <p className="text-3xl font-bold text-blue-600">+{stats.totalIncrease.toFixed(0)}€</p>
              </div>
              <Euro className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Augmentation moy.</p>
                <p className="text-3xl font-bold text-purple-600">{stats.avgIncrease.toFixed(1)}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
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
                  placeholder="Rechercher par propriété ou locataire..."
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
                  <SelectItem value="applied">Appliquée</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="cancelled">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="year">Année</Label>
              <Select value={filters.year} onValueChange={(value) => setFilters((prev) => ({ ...prev, year: value }))}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des révisions */}
      <Card>
        <CardHeader>
          <CardTitle>Révisions de loyer</CardTitle>
          <CardDescription>Historique et suivi des révisions annuelles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRevisions.length > 0 ? (
              filteredRevisions.map((revision) => (
                <div key={revision.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">
                          {revision.lease?.property?.title} - {revision.lease?.tenant?.first_name}{" "}
                          {revision.lease?.tenant?.last_name}
                        </h3>
                        {getStatusBadge(revision.status)}
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Loyer actuel: </span>
                          <span className="font-medium">{revision.current_rent}€</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Nouveau loyer: </span>
                          <span className="font-medium text-green-600">{revision.new_rent}€</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Augmentation: </span>
                          <span className="font-medium">+{revision.revision_percentage}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Date: </span>
                          <span className="font-medium">
                            {new Date(revision.revision_date).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        Indice de référence: {revision.insee_index_reference} → Indice actuel:{" "}
                        {revision.insee_index_current}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {revision.status === "pending" && (
                        <Button size="sm" onClick={() => handleApplyRevision(revision.id)}>
                          Appliquer
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <FileText className="h-4 w-4 mr-1" />
                        Courrier
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Aucune révision trouvée</p>
                <p className="text-sm">Calculez votre première révision de loyer</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Guide des révisions */}
      <Card>
        <CardHeader>
          <CardTitle>Guide de révision des loyers</CardTitle>
          <CardDescription>Informations importantes sur la procédure légale</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Quand réviser ?</h4>
                  <p className="text-sm text-gray-600">
                    Une fois par an, à la date anniversaire du bail ou à une date convenue dans le contrat.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <BarChart3 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Indice de référence</h4>
                  <p className="text-sm text-gray-600">
                    Utilisez l'IRL (Indice de Référence des Loyers) publié par l'INSEE chaque trimestre.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Procédure</h4>
                  <p className="text-sm text-gray-600">
                    Envoyez un courrier recommandé avec accusé de réception au locataire.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Délai</h4>
                  <p className="text-sm text-gray-600">
                    La révision prend effet au plus tôt 1 mois après la demande du propriétaire.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
