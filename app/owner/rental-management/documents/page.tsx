"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Shield,
  AlertTriangle,
  Download,
  Eye,
  Upload,
  Calendar,
  FileText,
  Search,
  CheckCircle,
  Clock,
  Mail,
} from "lucide-react"
import { authService } from "@/lib/auth-service"
import { rentalManagementService } from "@/lib/rental-management-service"
import { toast } from "sonner"

export default function DocumentsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [leases, setLeases] = useState<any[]>([])
  const [allDocuments, setAllDocuments] = useState<any[]>([])
  const [expiringDocuments, setExpiringDocuments] = useState<any[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: "all",
    type: "all",
    lease: "all",
    search: "",
  })

  useEffect(() => {
    const initializeData = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "owner") return

        setCurrentUser(user)
        const leasesData = await rentalManagementService.getOwnerLeases(user.id)
        setLeases(leasesData)

        // Charger tous les documents de tous les baux
        const allDocs = []
        const expiringDocs = []

        for (const lease of leasesData) {
          const { allDocuments, expiringDocuments } = await rentalManagementService.checkAnnualDocuments(lease.id)

          // Enrichir avec les infos du bail
          const enrichedDocs = allDocuments.map((doc) => ({
            ...doc,
            lease: lease,
            tenant: lease.tenant,
            property: lease.property,
          }))

          const enrichedExpiringDocs = expiringDocuments.map((doc) => ({
            ...doc,
            lease: lease,
            tenant: lease.tenant,
            property: lease.property,
          }))

          allDocs.push(...enrichedDocs)
          expiringDocs.push(...enrichedExpiringDocs)
        }

        setAllDocuments(allDocs)
        setExpiringDocuments(expiringDocs)
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
  }, [allDocuments, filters])

  const applyFilters = () => {
    let filtered = allDocuments

    if (filters.status !== "all") {
      filtered = filtered.filter((doc) => doc.status === filters.status)
    }

    if (filters.type !== "all") {
      filtered = filtered.filter((doc) => doc.document_type === filters.type)
    }

    if (filters.lease !== "all") {
      filtered = filtered.filter((doc) => doc.lease_id === filters.lease)
    }

    if (filters.search) {
      filtered = filtered.filter(
        (doc) =>
          doc.document_name.toLowerCase().includes(filters.search.toLowerCase()) ||
          doc.tenant.first_name.toLowerCase().includes(filters.search.toLowerCase()) ||
          doc.tenant.last_name.toLowerCase().includes(filters.search.toLowerCase()),
      )
    }

    setFilteredDocuments(filtered)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "valid":
        return <Badge className="bg-green-600">Valide</Badge>
      case "expiring":
        return <Badge className="bg-orange-600">Expire bientôt</Badge>
      case "expired":
        return <Badge variant="destructive">Expiré</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case "insurance":
        return "Assurance habitation"
      case "boiler_maintenance":
        return "Révision chaudière"
      case "energy_certificate":
        return "Certificat énergétique"
      case "other":
        return "Autre"
      default:
        return type
    }
  }

  const getDocumentStats = () => {
    const valid = allDocuments.filter((d) => d.status === "valid").length
    const expiring = allDocuments.filter((d) => d.status === "expiring").length
    const expired = allDocuments.filter((d) => d.status === "expired").length
    const total = allDocuments.length

    return { valid, expiring, expired, total }
  }

  const sendReminderEmail = async (documentId: string) => {
    try {
      // Simuler l'envoi d'email de rappel
      toast.success("Email de rappel envoyé au locataire")
    } catch (error) {
      toast.error("Erreur lors de l'envoi de l'email")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Chargement des documents...</p>
        </div>
      </div>
    )
  }

  const stats = getDocumentStats()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documents Obligatoires</h1>
          <p className="text-gray-600">Suivi des documents annuels fournis par vos locataires</p>
        </div>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Ajouter un document
        </Button>
      </div>

      {/* Alertes documents expirants */}
      {expiringDocuments.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>{expiringDocuments.length} document(s)</strong> expire(nt) bientôt et nécessite(nt) un
            renouvellement de la part de vos locataires.
          </AlertDescription>
        </Alert>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total documents</p>
                <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valides</p>
                <p className="text-3xl font-bold text-green-600">{stats.valid}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expirent bientôt</p>
                <p className="text-3xl font-bold text-orange-600">{stats.expiring}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expirés</p>
                <p className="text-3xl font-bold text-red-600">{stats.expired}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
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
                  placeholder="Rechercher par document ou locataire..."
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
                  <SelectItem value="valid">Valide</SelectItem>
                  <SelectItem value="expiring">Expire bientôt</SelectItem>
                  <SelectItem value="expired">Expiré</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={filters.type} onValueChange={(value) => setFilters((prev) => ({ ...prev, type: value }))}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="insurance">Assurance</SelectItem>
                  <SelectItem value="boiler_maintenance">Révision chaudière</SelectItem>
                  <SelectItem value="energy_certificate">Certificat énergétique</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="lease">Bail</Label>
              <Select
                value={filters.lease}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, lease: value }))}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les baux</SelectItem>
                  {leases.map((lease) => (
                    <SelectItem key={lease.id} value={lease.id}>
                      {lease.property.title} - {lease.tenant.first_name} {lease.tenant.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents expirants - Section prioritaire */}
      {expiringDocuments.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Documents expirant bientôt
            </CardTitle>
            <CardDescription>Ces documents nécessitent une action immédiate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expiringDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border border-orange-200 rounded-lg bg-orange-50"
                >
                  <div className="space-y-1">
                    <h3 className="font-medium">{doc.document_name}</h3>
                    <div className="text-sm text-gray-600">
                      <span>{getDocumentTypeLabel(doc.document_type)} - </span>
                      <span>
                        {doc.tenant.first_name} {doc.tenant.last_name}
                      </span>
                    </div>
                    <div className="text-sm text-orange-700">
                      Expire le {new Date(doc.expiry_date).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(doc.status)}
                    <Button size="sm" variant="outline" onClick={() => sendReminderEmail(doc.id)}>
                      <Mail className="h-4 w-4 mr-1" />
                      Rappel
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      Voir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste complète des documents */}
      <Card>
        <CardHeader>
          <CardTitle>Tous les documents</CardTitle>
          <CardDescription>Vue d'ensemble de tous les documents obligatoires</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredDocuments.length > 0 ? (
              filteredDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <h3 className="font-medium">{doc.document_name}</h3>
                    <div className="text-sm text-gray-600">
                      <span>{getDocumentTypeLabel(doc.document_type)} - </span>
                      <span>
                        {doc.tenant.first_name} {doc.tenant.last_name}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {doc.property.title} - Expire le {new Date(doc.expiry_date).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(doc.status)}
                    {(doc.status === "expiring" || doc.status === "expired") && (
                      <Button size="sm" variant="outline" onClick={() => sendReminderEmail(doc.id)}>
                        <Mail className="h-4 w-4 mr-1" />
                        Rappel
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      Voir
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-1" />
                      Télécharger
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Aucun document trouvé</p>
                <p className="text-sm">Les documents fournis par vos locataires apparaîtront ici</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Guide des documents obligatoires */}
      <Card>
        <CardHeader>
          <CardTitle>Documents obligatoires à demander</CardTitle>
          <CardDescription>Liste des documents que vos locataires doivent fournir annuellement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Attestation d'assurance habitation</h4>
                  <p className="text-sm text-gray-600">
                    Document obligatoire à renouveler chaque année. Couvre la responsabilité civile du locataire.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Certificat d'entretien chaudière</h4>
                  <p className="text-sm text-gray-600">
                    Obligatoire pour les logements équipés d'une chaudière gaz. Entretien annuel requis.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Certificat énergétique</h4>
                  <p className="text-sm text-gray-600">
                    Diagnostic de performance énergétique, valable 10 ans selon la réglementation.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Rappels automatiques</h4>
                  <p className="text-sm text-gray-600">
                    Le système envoie automatiquement des rappels 30 jours avant expiration.
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
