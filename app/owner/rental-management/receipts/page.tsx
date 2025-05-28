"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Receipt,
  Download,
  CheckCircle,
  Plus,
  Search,
  Filter,
  Calendar,
  Euro,
  AlertTriangle,
  Mail,
  Printer,
} from "lucide-react"
import { authService } from "@/lib/auth-service"
import { rentalManagementService } from "@/lib/rental-management-service"
import { toast } from "sonner"

export default function ReceiptsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [leases, setLeases] = useState<any[]>([])
  const [selectedLease, setSelectedLease] = useState<any>(null)
  const [receipts, setReceipts] = useState<any[]>([])
  const [filteredReceipts, setFilteredReceipts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: "all",
    year: new Date().getFullYear().toString(),
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

        if (leasesData.length > 0) {
          setSelectedLease(leasesData[0])
          await loadReceiptsForLease(leasesData[0].id)
        }
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
  }, [receipts, filters])

  const loadReceiptsForLease = async (leaseId: string) => {
    try {
      const receiptsData = await rentalManagementService.getLeaseReceipts(leaseId)
      setReceipts(receiptsData)
    } catch (error) {
      console.error("Erreur chargement quittances:", error)
    }
  }

  const applyFilters = () => {
    let filtered = receipts

    if (filters.status !== "all") {
      filtered = filtered.filter((receipt) => receipt.status === filters.status)
    }

    if (filters.year !== "all") {
      filtered = filtered.filter((receipt) => receipt.year.toString() === filters.year)
    }

    if (filters.search) {
      filtered = filtered.filter((receipt) => receipt.month.toLowerCase().includes(filters.search.toLowerCase()))
    }

    setFilteredReceipts(filtered)
  }

  const handleGenerateReceipts = async () => {
    try {
      await rentalManagementService.generateMonthlyReceipts()
      toast.success("Quittances générées avec succès")
      if (selectedLease) {
        await loadReceiptsForLease(selectedLease.id)
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
        await loadReceiptsForLease(selectedLease.id)
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour")
    }
  }

  const handleLeaseChange = async (lease: any) => {
    setSelectedLease(lease)
    await loadReceiptsForLease(lease.id)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-600">Payé</Badge>
      case "pending":
        return <Badge variant="secondary">En attente</Badge>
      case "overdue":
        return <Badge variant="destructive">En retard</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusStats = () => {
    const paid = receipts.filter((r) => r.status === "paid").length
    const pending = receipts.filter((r) => r.status === "pending").length
    const overdue = receipts.filter((r) => r.status === "overdue").length
    const totalAmount = receipts.reduce((sum, r) => sum + r.total_amount, 0)
    const paidAmount = receipts.filter((r) => r.status === "paid").reduce((sum, r) => sum + r.total_amount, 0)

    return { paid, pending, overdue, totalAmount, paidAmount }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Chargement des quittances...</p>
        </div>
      </div>
    )
  }

  if (leases.length === 0) {
    return (
      <div className="text-center py-12">
        <Receipt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucun bail actif</h2>
        <p className="text-gray-600">Vous devez avoir des baux signés pour gérer les quittances.</p>
      </div>
    )
  }

  const stats = getStatusStats()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Quittances</h1>
          <p className="text-gray-600">Générez et suivez les quittances de loyer</p>
        </div>
        <Button onClick={handleGenerateReceipts}>
          <Plus className="h-4 w-4 mr-2" />
          Générer quittances du mois
        </Button>
      </div>

      {/* Sélecteur de bail */}
      <Card>
        <CardHeader>
          <CardTitle>Sélectionner un bail</CardTitle>
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

      {selectedLease && (
        <>
          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Quittances payées</p>
                    <p className="text-3xl font-bold text-green-600">{stats.paid}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
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
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">En retard</p>
                    <p className="text-3xl font-bold text-red-600">{stats.overdue}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Montant encaissé</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.paidAmount}€</p>
                  </div>
                  <Euro className="h-8 w-8 text-blue-600" />
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
                      placeholder="Rechercher par mois..."
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
                      <SelectItem value="paid">Payé</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="overdue">En retard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="year">Année</Label>
                  <Select
                    value={filters.year}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, year: value }))}
                  >
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

                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrer
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Liste des quittances */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Quittances de loyer</CardTitle>
                  <CardDescription>
                    {selectedLease.tenant.first_name} {selectedLease.tenant.last_name} - {selectedLease.property.title}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Mail className="h-4 w-4 mr-2" />
                    Envoyer par email
                  </Button>
                  <Button variant="outline" size="sm">
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimer tout
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredReceipts.length > 0 ? (
                  filteredReceipts.map((receipt) => (
                    <div key={receipt.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h3 className="font-medium capitalize">
                          Quittance {receipt.month} {receipt.year}
                        </h3>
                        <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span>Loyer: </span>
                            <span className="font-medium">{receipt.rent_amount}€</span>
                          </div>
                          <div>
                            <span>Charges: </span>
                            <span className="font-medium">{receipt.charges_amount}€</span>
                          </div>
                          <div>
                            <span>Total: </span>
                            <span className="font-medium">{receipt.total_amount}€</span>
                          </div>
                        </div>
                        {receipt.payment_date && (
                          <div className="text-sm text-green-600">
                            Payé le {new Date(receipt.payment_date).toLocaleDateString("fr-FR")}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(receipt.status)}
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
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucune quittance trouvée</p>
                    <p className="text-sm">Générez les quittances mensuelles pour ce bail</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
