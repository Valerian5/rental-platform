"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  FileText,
  Home,
  AlertTriangle,
  Wrench,
  Download,
  CheckCircle,
  TrendingUp,
  Receipt,
  Shield,
  Calculator,
  Plus,
  Eye,
} from "lucide-react"
import { authService } from "@/lib/auth-service"
import { rentalManagementService } from "@/lib/rental-management-service"
import { toast } from "sonner"

export default function RentalManagementPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [leases, setLeases] = useState<any[]>([])
  const [selectedLease, setSelectedLease] = useState<any>(null)
  const [receipts, setReceipts] = useState<any[]>([])
  const [incidents, setIncidents] = useState<any[]>([])
  const [maintenanceWorks, setMaintenanceWorks] = useState<any[]>([])
  const [annualDocuments, setAnnualDocuments] = useState<any[]>([])
  const [expiringDocuments, setExpiringDocuments] = useState<any[]>([])
  const [taxReports, setTaxReports] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
          router.push("/login")
          return
        }
        setCurrentUser(user)
        await loadRentalData(user.id)
      } catch (error) {
        console.error("Erreur initialisation:", error)
        toast.error("Erreur lors du chargement")
      } finally {
        setIsLoading(false)
      }
    }

    initializeData()
  }, [router])

  const loadRentalData = async (ownerId: string) => {
    try {
      // Charger les baux
      const leasesData = await rentalManagementService.getOwnerLeases(ownerId)
      setLeases(leasesData)

      if (leasesData.length > 0) {
        const firstLease = leasesData[0]
        setSelectedLease(firstLease)
        await loadLeaseDetails(firstLease.id, firstLease.property.id)
      }

      // Charger les bilans fiscaux
      const taxReportsData = await rentalManagementService.getOwnerTaxReports(ownerId)
      setTaxReports(taxReportsData)
    } catch (error) {
      console.error("Erreur chargement données:", error)
    }
  }

  const loadLeaseDetails = async (leaseId: string, propertyId: string) => {
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

  const handleLeaseChange = (lease: any) => {
    setSelectedLease(lease)
    loadLeaseDetails(lease.id, lease.property.id)
  }

  const handleGenerateReceipts = async () => {
    try {
      await rentalManagementService.generateMonthlyReceipts()
      toast.success("Quittances générées avec succès")
      if (selectedLease) {
        await loadLeaseDetails(selectedLease.id, selectedLease.property.id)
      }
    } catch (error) {
      toast.error("Erreur lors de la génération des quittances")
    }
  }

  const handleMarkReceiptPaid = async (receiptId: string) => {
    try {
      await rentalManagementService.markReceiptAsPaid(receiptId, new Date().toISOString())
      toast.success("Quittance marquée comme payée")
      if (selectedLease) {
        await loadLeaseDetails(selectedLease.id, selectedLease.property.id)
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour")
    }
  }

  const handleCreateIncident = async () => {
    if (!selectedLease) return

    try {
      await rentalManagementService.reportIncident({
        ...newIncident,
        lease_id: selectedLease.id,
        property_id: selectedLease.property.id,
        reported_by: currentUser.id,
      })
      toast.success("Incident signalé avec succès")
      setNewIncident({ title: "", description: "", category: "", priority: "medium" })
      await loadLeaseDetails(selectedLease.id, selectedLease.property.id)
    } catch (error) {
      toast.error("Erreur lors du signalement")
    }
  }

  const handleScheduleMaintenance = async () => {
    if (!selectedLease) return

    try {
      await rentalManagementService.scheduleMaintenanceWork({
        ...newMaintenance,
        property_id: selectedLease.property.id,
        lease_id: selectedLease.id,
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
      await loadLeaseDetails(selectedLease.id, selectedLease.property.id)
    } catch (error) {
      toast.error("Erreur lors de la programmation")
    }
  }

  const handleGenerateTaxReport = async () => {
    if (!currentUser) return

    try {
      const currentYear = new Date().getFullYear() - 1
      await rentalManagementService.generateTaxReport(currentUser.id, currentYear)
      toast.success("Bilan fiscal généré avec succès")
      const taxReportsData = await rentalManagementService.getOwnerTaxReports(currentUser.id)
      setTaxReports(taxReportsData)
    } catch (error) {
      toast.error("Erreur lors de la génération du bilan")
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Chargement de la gestion locative...</p>
          </div>
        </div>
      </div>
    )
  }

  if (leases.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center space-y-4">
          <Home className="h-16 w-16 text-gray-400 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900">Aucun bail actif</h2>
          <p className="text-gray-600">Vous n'avez pas encore de baux signés à gérer.</p>
          <Button onClick={() => router.push("/owner/dashboard")}>Retour au tableau de bord</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion Locative</h1>
            <p className="text-gray-600">Gérez vos baux, paiements, incidents et documents</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => window.open('/owner/rental-management/rent-revision', '_blank')}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Révision loyer
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open('/owner/rental-management/revision', '_blank')}
            >
              <Calculator className="h-4 w-4 mr-2" />
              Régularisation charges
            </Button>
          </div>
        </div>
      </div>

      {/* Sélecteur de bail */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Sélectionner un bail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leases.map((lease) => (
              <Card
                key={lease.id}
                className={`cursor-pointer transition-all ${
                  selectedLease?.id === lease.id ? "ring-2 ring-blue-500 bg-blue-50" : "hover:shadow-md"
                }`}
                onClick={() => handleLeaseChange(lease)}
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold">{lease.property.title}</h3>
                    <p className="text-sm text-gray-600">{lease.property.address}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {lease.tenant.first_name} {lease.tenant.last_name}
                      </span>
                      <Badge variant={lease.status === "active" ? "default" : "secondary"}>
                        {lease.status === "active" ? "Actif" : "Terminé"}
                      </Badge>
                    </div>
                    <div className="text-lg font-bold text-blue-600">{lease.monthly_rent + lease.charges}€/mois</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alertes documents expirants */}
      {expiringDocuments.length > 0 && (
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>{expiringDocuments.length} document(s)</strong> expire(nt) bientôt et nécessite(nt) un
            renouvellement.
          </AlertDescription>
        </Alert>
      )}

      {selectedLease && (
        <Tabs defaultValue="payments" className="space-y-6">
          {/* Responsive: défilement horizontal sur mobile, grille sur md+ */}
          <div className="w-full overflow-x-auto">
            <TabsList className="flex md:grid md:grid-cols-5 min-w-max md:min-w-0 gap-1">
              <TabsTrigger value="payments">Paiements</TabsTrigger>
              <TabsTrigger value="incidents">Incidents</TabsTrigger>
              <TabsTrigger value="maintenance">Travaux</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="fiscal">Fiscal</TabsTrigger>
            </TabsList>
          </div>

          {/* ONGLET PAIEMENTS */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-2" />
                      Gestion des paiements
                    </CardTitle>
                    <CardDescription>
                      Suivez les paiements de loyer pour {selectedLease.tenant.first_name}{" "}
                      {selectedLease.tenant.last_name}
                    </CardDescription>
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
                          Paiement {receipt.month} {receipt.year}
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
                          {receipt.status === "paid"
                            ? "Payé"
                            : receipt.status === "overdue"
                              ? "En retard"
                              : "En attente"}
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ONGLET INCIDENTS */}
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

          {/* ONGLET TRAVAUX */}
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

          {/* ONGLET DOCUMENTS */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Documents annuels obligatoires
                </CardTitle>
                <CardDescription>Suivi des documents que le locataire doit fournir annuellement</CardDescription>
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


          {/* ONGLET FISCAL */}
          <TabsContent value="fiscal">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Bilan fiscal
                    </CardTitle>
                    <CardDescription>Générez votre bilan pour la déclaration d'impôts</CardDescription>
                  </div>
                  <Button onClick={handleGenerateTaxReport}>
                    <Plus className="h-4 w-4 mr-2" />
                    Générer bilan {new Date().getFullYear() - 1}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {taxReports.map((report) => (
                    <div key={report.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <h3 className="font-medium">Bilan fiscal {report.year}</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Revenus locatifs</span>
                              <div className="font-semibold text-green-600">+{report.total_rental_income}€</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Charges</span>
                              <div className="font-semibold">{report.total_charges}€</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Dépenses</span>
                              <div className="font-semibold text-red-600">-{report.total_expenses}€</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Revenus imposables</span>
                              <div className="font-semibold text-blue-600">{report.taxable_income}€</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={report.status === "generated" ? "default" : "secondary"}>
                            {report.status === "generated" ? "Généré" : "Brouillon"}
                          </Badge>
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {taxReports.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Aucun bilan fiscal généré</p>
                      <p className="text-sm">Générez votre premier bilan pour la déclaration d'impôts</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
