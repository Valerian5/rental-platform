"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  User,
  FileText,
  CreditCard,
  AlertTriangle,
  Wrench,
  Shield,
  TrendingUp,
  Calculator,
  Plus,
  Eye,
  Download,
  CheckCircle,
  Home,
  ArrowLeft,
} from "lucide-react"
import { propertyService } from "@/lib/property-service"
import { rentalManagementService } from "@/lib/rental-management-service"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"
import Link from "next/link"

export default function PropertyManagementPage() {
  const params = useParams()
  const propertyId = params.id as string
  const [property, setProperty] = useState<any>(null)
  const [lease, setLease] = useState<any>(null)
  const [receipts, setReceipts] = useState<any[]>([])
  const [incidents, setIncidents] = useState<any[]>([])
  const [maintenanceWorks, setMaintenanceWorks] = useState<any[]>([])
  const [annualDocuments, setAnnualDocuments] = useState<any[]>([])
  const [expiringDocuments, setExpiringDocuments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // États pour les formulaires
  const [newIncident, setNewIncident] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium",
  })
  const [newMaintenance, setNewMaintenance] = useState({
    title: "",
    description: "",
    type: "preventive",
    category: "",
    scheduled_date: "",
    cost: 0,
    provider_name: "",
    provider_contact: "",
  })

  useEffect(() => {
    const initializeData = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "owner") {
          return
        }
        setCurrentUser(user)
        await loadPropertyData()
      } catch (error) {
        console.error("Erreur initialisation:", error)
        toast.error("Erreur lors du chargement")
      } finally {
        setIsLoading(false)
      }
    }

    initializeData()
  }, [propertyId])

  const loadPropertyData = async () => {
    try {
      // Charger les données de la propriété
      const propertyData = await propertyService.getPropertyById(propertyId)
      setProperty(propertyData)

      // Charger le bail actif
      const leaseData = await rentalManagementService.getActiveLease(propertyId)
      if (leaseData) {
        setLease(leaseData)
        await loadLeaseDetails(leaseData.id)
      }
    } catch (error) {
      console.error("Erreur chargement propriété:", error)
      toast.error("Erreur lors du chargement de la propriété")
    }
  }

  const loadLeaseDetails = async (leaseId: string) => {
    try {
      // Charger les quittances
      const receiptsData = await rentalManagementService.getLeaseReceipts(leaseId)
      setReceipts(receiptsData)

      // Charger les incidents
      const incidentsData = await rentalManagementService.getPropertyIncidents(propertyId)
      setIncidents(incidentsData)

      // Charger les travaux
      const maintenanceData = await rentalManagementService.getPropertyMaintenanceWorks(propertyId)
      setMaintenanceWorks(maintenanceData)

      // Charger les documents annuels
      const { allDocuments, expiringDocuments } = await rentalManagementService.checkAnnualDocuments(leaseId)
      setAnnualDocuments(allDocuments)
      setExpiringDocuments(expiringDocuments)
    } catch (error) {
      console.error("Erreur chargement détails bail:", error)
    }
  }

  const handleGenerateReceipts = async () => {
    try {
      await rentalManagementService.generateMonthlyReceipts()
      toast.success("Quittances générées avec succès")
      if (lease) {
        await loadLeaseDetails(lease.id)
      }
    } catch (error) {
      toast.error("Erreur lors de la génération des quittances")
    }
  }

  const handleMarkReceiptPaid = async (receiptId: string) => {
    try {
      await rentalManagementService.markReceiptAsPaid(receiptId, new Date().toISOString())
      toast.success("Quittance marquée comme payée")
      if (lease) {
        await loadLeaseDetails(lease.id)
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour")
    }
  }

  const handleCreateIncident = async () => {
    if (!lease) return

    try {
      await rentalManagementService.reportIncident({
        ...newIncident,
        lease_id: lease.id,
        property_id: propertyId,
        reported_by: currentUser.id,
      })
      toast.success("Incident signalé avec succès")
      setNewIncident({ title: "", description: "", category: "", priority: "medium" })
      await loadLeaseDetails(lease.id)
    } catch (error) {
      toast.error("Erreur lors du signalement")
    }
  }

  const handleScheduleMaintenance = async () => {
    if (!lease) return

    try {
      await rentalManagementService.scheduleMaintenanceWork({
        ...newMaintenance,
        property_id: propertyId,
        lease_id: lease.id,
      })
      toast.success("Travaux programmés avec succès")
      setNewMaintenance({
        title: "",
        description: "",
        type: "preventive",
        category: "",
        scheduled_date: "",
        cost: 0,
        provider_name: "",
        provider_contact: "",
      })
      await loadLeaseDetails(lease.id)
    } catch (error) {
      toast.error("Erreur lors de la programmation")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Chargement de la gestion du bien...</p>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="text-center py-8">
        <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Bien non trouvé</h2>
        <p className="text-gray-600 mb-4">Ce bien n'existe pas ou vous n'y avez pas accès.</p>
        <Link href="/owner/properties">
          <Button>Retour à mes biens</Button>
        </Link>
      </div>
    )
  }

  if (!lease) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{property.title}</h1>
            <p className="text-gray-600">
              {property.address}, {property.city}
            </p>
          </div>
          <Link href="/owner/properties">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
        </div>

        <Alert className="border-blue-200 bg-blue-50">
          <Home className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Aucun bail actif</strong> pour ce bien. La gestion locative sera disponible une fois qu'un bail sera
            signé.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Informations du bien</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Type</p>
                <p className="font-semibold">{property.property_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Surface</p>
                <p className="font-semibold">{property.surface}m²</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Pièces</p>
                <p className="font-semibold">{property.rooms}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Prix</p>
                <p className="font-semibold">{property.price}€</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{property.title}</h1>
          <p className="text-gray-600">
            {property.address}, {property.city}
          </p>
          <div className="flex items-center mt-2">
            <Badge className="bg-green-100 text-green-800">Bien en location</Badge>
            <span className="ml-2 text-sm text-gray-600">
              Locataire: {lease.tenant.first_name} {lease.tenant.last_name}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/owner/properties">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <Button variant="outline">Modifier le bien</Button>
        </div>
      </div>

      {/* Alertes documents expirants */}
      {expiringDocuments.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>{expiringDocuments.length} document(s)</strong> expire(nt) bientôt et nécessite(nt) un
            renouvellement.
          </AlertDescription>
        </Alert>
      )}

      {/* Cartes de résumé */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Locataire</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold">
                  {lease.tenant.first_name} {lease.tenant.last_name}
                </p>
                <p className="text-sm text-gray-600">{lease.tenant.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Bail</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold">{lease.monthly_rent + lease.charges}€ / mois</p>
                <p className="text-sm text-gray-600">
                  Du {new Date(lease.start_date).toLocaleDateString()} au{" "}
                  {new Date(lease.end_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Statut paiements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold">
                  {receipts.filter((r) => r.status === "paid").length} / {receipts.length} payées
                </p>
                <p className="text-sm text-gray-600">
                  {receipts.filter((r) => r.status === "pending").length} en attente
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="receipts">Quittances</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="maintenance">Travaux</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="revision">Révision</TabsTrigger>
        </TabsList>

        {/* VUE D'ENSEMBLE */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Paiements récents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {receipts.slice(0, 5).map((receipt) => (
                    <div key={receipt.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">
                          {receipt.month} {receipt.year}
                        </p>
                        <p className="text-sm text-gray-500">{receipt.total_amount}€</p>
                      </div>
                      <Badge
                        variant={
                          receipt.status === "paid"
                            ? "default"
                            : receipt.status === "overdue"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {receipt.status === "paid" ? "Payé" : receipt.status === "overdue" ? "En retard" : "En attente"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Incidents récents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {incidents.slice(0, 5).map((incident) => (
                    <div key={incident.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{incident.title}</p>
                        <p className="text-sm text-gray-500">{new Date(incident.created_at).toLocaleDateString()}</p>
                      </div>
                      <Badge
                        variant={
                          incident.status === "resolved"
                            ? "default"
                            : incident.status === "in_progress"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {incident.status === "resolved"
                          ? "Résolu"
                          : incident.status === "in_progress"
                            ? "En cours"
                            : "Signalé"}
                      </Badge>
                    </div>
                  ))}
                  {incidents.length === 0 && <p className="text-center text-gray-500 py-4">Aucun incident signalé</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* QUITTANCES */}
        <TabsContent value="receipts">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Gestion des quittances
                  </CardTitle>
                </div>
                <Button onClick={handleGenerateReceipts}>
                  <Plus className="h-4 w-4 mr-2" />
                  Générer quittances du mois
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {receipts.map((receipt) => (
                  <div key={receipt.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h3 className="font-medium">
                        Quittance {receipt.month} {receipt.year}
                      </h3>
                      <div className="text-sm text-gray-600">
                        Loyer: {receipt.rent_amount}€ + Charges: {receipt.charges_amount}€ = {receipt.total_amount}€
                      </div>
                      {receipt.payment_date && (
                        <div className="text-sm text-green-600">
                          Payé le {new Date(receipt.payment_date).toLocaleDateString("fr-FR")}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          receipt.status === "paid"
                            ? "default"
                            : receipt.status === "overdue"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {receipt.status === "paid" ? "Payé" : receipt.status === "overdue" ? "En retard" : "En attente"}
                      </Badge>
                      {receipt.status === "pending" && (
                        <Button size="sm" onClick={() => handleMarkReceiptPaid(receipt.id)}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Marquer payé
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </div>
                ))}
                {receipts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucune quittance générée</p>
                    <p className="text-sm">Générez les quittances mensuelles pour ce bail</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* INCIDENTS */}
        <TabsContent value="incidents">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Incidents signalés
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {incidents.map((incident) => (
                      <div key={incident.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <h3 className="font-medium">{incident.title}</h3>
                            <p className="text-sm text-gray-600">{incident.description}</p>
                            <div className="flex items-center space-x-4 text-sm">
                              <Badge variant="outline">{incident.category}</Badge>
                              <Badge
                                variant={
                                  incident.priority === "urgent"
                                    ? "destructive"
                                    : incident.priority === "high"
                                      ? "secondary"
                                      : "outline"
                                }
                              >
                                {incident.priority}
                              </Badge>
                              <span className="text-gray-500">
                                {new Date(incident.created_at).toLocaleDateString("fr-FR")}
                              </span>
                            </div>
                          </div>
                          <Badge
                            variant={
                              incident.status === "resolved"
                                ? "default"
                                : incident.status === "in_progress"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {incident.status === "resolved"
                              ? "Résolu"
                              : incident.status === "in_progress"
                                ? "En cours"
                                : "Signalé"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {incidents.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Aucun incident signalé</p>
                        <p className="text-sm">Les incidents signalés par le locataire apparaîtront ici</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Signaler un incident</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="incident-title">Titre</Label>
                  <Input
                    id="incident-title"
                    value={newIncident.title}
                    onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                    placeholder="Ex: Fuite d'eau salle de bain"
                  />
                </div>
                <div>
                  <Label htmlFor="incident-description">Description</Label>
                  <Textarea
                    id="incident-description"
                    value={newIncident.description}
                    onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                    placeholder="Décrivez le problème..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="incident-category">Catégorie</Label>
                  <Select
                    value={newIncident.category}
                    onValueChange={(value) => setNewIncident({ ...newIncident, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plumbing">Plomberie</SelectItem>
                      <SelectItem value="electrical">Électricité</SelectItem>
                      <SelectItem value="heating">Chauffage</SelectItem>
                      <SelectItem value="security">Sécurité</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="incident-priority">Priorité</Label>
                  <Select
                    value={newIncident.priority}
                    onValueChange={(value) => setNewIncident({ ...newIncident, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Faible</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="high">Élevée</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateIncident} className="w-full">
                  Signaler l'incident
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TRAVAUX */}
        <TabsContent value="maintenance">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Wrench className="h-5 w-5 mr-2" />
                    Travaux programmés
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {maintenanceWorks.map((work) => (
                      <div key={work.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <h3 className="font-medium">{work.title}</h3>
                            <p className="text-sm text-gray-600">{work.description}</p>
                            <div className="flex items-center space-x-4 text-sm">
                              <Badge variant="outline">{work.type}</Badge>
                              <Badge variant="outline">{work.category}</Badge>
                              <span className="text-gray-500">
                                Prévu le {new Date(work.scheduled_date).toLocaleDateString("fr-FR")}
                              </span>
                              {work.cost > 0 && <span className="font-medium">{work.cost}€</span>}
                            </div>
                            {work.provider_name && (
                              <div className="text-sm text-gray-600">Prestataire: {work.provider_name}</div>
                            )}
                          </div>
                          <Badge
                            variant={
                              work.status === "completed"
                                ? "default"
                                : work.status === "in_progress"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {work.status === "completed"
                              ? "Terminé"
                              : work.status === "in_progress"
                                ? "En cours"
                                : "Programmé"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {maintenanceWorks.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Wrench className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Aucun travaux programmés</p>
                        <p className="text-sm">Programmez des travaux de maintenance pour ce bien</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Programmer des travaux</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="maintenance-title">Titre</Label>
                  <Input
                    id="maintenance-title"
                    value={newMaintenance.title}
                    onChange={(e) => setNewMaintenance({ ...newMaintenance, title: e.target.value })}
                    placeholder="Ex: Révision chaudière"
                  />
                </div>
                <div>
                  <Label htmlFor="maintenance-description">Description</Label>
                  <Textarea
                    id="maintenance-description"
                    value={newMaintenance.description}
                    onChange={(e) => setNewMaintenance({ ...newMaintenance, description: e.target.value })}
                    placeholder="Détails des travaux..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="maintenance-type">Type</Label>
                    <Select
                      value={newMaintenance.type}
                      onValueChange={(value) => setNewMaintenance({ ...newMaintenance, type: value })}
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
                  <div>
                    <Label htmlFor="maintenance-category">Catégorie</Label>
                    <Select
                      value={newMaintenance.category}
                      onValueChange={(value) => setNewMaintenance({ ...newMaintenance, category: value })}
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
                </div>
                <div>
                  <Label htmlFor="maintenance-date">Date prévue</Label>
                  <Input
                    id="maintenance-date"
                    type="date"
                    value={newMaintenance.scheduled_date}
                    onChange={(e) => setNewMaintenance({ ...newMaintenance, scheduled_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="maintenance-cost">Coût estimé (€)</Label>
                  <Input
                    id="maintenance-cost"
                    type="number"
                    value={newMaintenance.cost}
                    onChange={(e) => setNewMaintenance({ ...newMaintenance, cost: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="maintenance-provider">Prestataire</Label>
                  <Input
                    id="maintenance-provider"
                    value={newMaintenance.provider_name}
                    onChange={(e) => setNewMaintenance({ ...newMaintenance, provider_name: e.target.value })}
                    placeholder="Nom du prestataire"
                  />
                </div>
                <div>
                  <Label htmlFor="maintenance-contact">Contact prestataire</Label>
                  <Input
                    id="maintenance-contact"
                    value={newMaintenance.provider_contact}
                    onChange={(e) => setNewMaintenance({ ...newMaintenance, provider_contact: e.target.value })}
                    placeholder="Téléphone ou email"
                  />
                </div>
                <Button onClick={handleScheduleMaintenance} className="w-full">
                  Programmer les travaux
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* DOCUMENTS */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Documents annuels obligatoires
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {annualDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h3 className="font-medium">{doc.document_name}</h3>
                      <div className="text-sm text-gray-600">
                        Type:{" "}
                        {doc.document_type === "insurance"
                          ? "Assurance habitation"
                          : doc.document_type === "boiler_maintenance"
                            ? "Révision chaudière"
                            : doc.document_type}
                      </div>
                      <div className="text-sm">Expire le {new Date(doc.expiry_date).toLocaleDateString("fr-FR")}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          doc.status === "valid" ? "default" : doc.status === "expiring" ? "secondary" : "destructive"
                        }
                      >
                        {doc.status === "valid" ? "Valide" : doc.status === "expiring" ? "Expire bientôt" : "Expiré"}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        Voir
                      </Button>
                    </div>
                  </div>
                ))}

                {annualDocuments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucun document annuel enregistré</p>
                    <p className="text-sm">Les documents fournis par le locataire apparaîtront ici</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RÉVISION */}
        <TabsContent value="revision">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Révision de loyer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Loyer actuel</h3>
                  <div className="text-2xl font-bold text-blue-600">{lease.monthly_rent}€</div>
                  <div className="text-sm text-gray-600">+ {lease.charges}€ de charges</div>
                </div>

                <div>
                  <Label htmlFor="insee-index">Nouvel indice INSEE</Label>
                  <Input id="insee-index" type="number" step="0.01" placeholder="Ex: 130.52" />
                  <p className="text-xs text-gray-500 mt-1">
                    Consultez l'indice de référence des loyers sur le site de l'INSEE
                  </p>
                </div>

                <Button className="w-full">
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculer la révision
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Régularisation des charges</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="actual-charges">Charges réelles de l'année</Label>
                  <Input id="actual-charges" type="number" placeholder="Montant total des charges" />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Charges provisionnelles payées</h3>
                  <div className="text-lg font-semibold">
                    {receipts.reduce((sum, receipt) => sum + receipt.charges_amount, 0)}€
                  </div>
                  <div className="text-sm text-gray-600">Sur {receipts.length} mois</div>
                </div>

                <Button className="w-full">Calculer la régularisation</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
