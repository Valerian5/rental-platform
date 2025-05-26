"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Euro,
  Download,
  Send,
  Eye,
  MoreHorizontal,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react"

// Données simulées pour les paiements
const payments = [
  {
    id: 1,
    tenant: "Jean Dupont",
    property: "Appartement moderne au centre-ville",
    amount: 1350,
    type: "rent",
    dueDate: "2024-01-05",
    paidDate: "2024-01-03",
    status: "paid",
    method: "virement",
    reference: "RENT-2024-001",
  },
  {
    id: 2,
    tenant: "Marie Leroy",
    property: "Studio étudiant rénové",
    amount: 750,
    type: "rent",
    dueDate: "2024-01-05",
    paidDate: "2024-01-05",
    status: "paid",
    method: "prelevement",
    reference: "RENT-2024-002",
  },
  {
    id: 3,
    tenant: "Sophie Martin",
    property: "Maison familiale avec jardin",
    amount: 1800,
    type: "rent",
    dueDate: "2024-01-05",
    status: "overdue",
    method: "virement",
    reference: "RENT-2024-003",
  },
  {
    id: 4,
    tenant: "Pierre Dubois",
    property: "Loft industriel spacieux",
    amount: 2400,
    type: "deposit",
    dueDate: "2024-01-15",
    paidDate: "2024-01-12",
    status: "paid",
    method: "virement",
    reference: "DEP-2024-001",
  },
  {
    id: 5,
    tenant: "Jean Dupont",
    property: "Appartement moderne au centre-ville",
    amount: 1350,
    type: "rent",
    dueDate: "2024-02-05",
    status: "pending",
    method: "virement",
    reference: "RENT-2024-004",
  },
]

const paymentTypes = {
  rent: { label: "Loyer", color: "blue" },
  deposit: { label: "Dépôt de garantie", color: "green" },
  charges: { label: "Charges", color: "orange" },
  fees: { label: "Frais", color: "purple" },
}

const statusConfig = {
  paid: { label: "Payé", color: "green", icon: CheckCircle },
  pending: { label: "En attente", color: "orange", icon: Clock },
  overdue: { label: "En retard", color: "red", icon: AlertCircle },
  cancelled: { label: "Annulé", color: "gray", icon: AlertCircle },
}

const paymentMethods = {
  virement: "Virement bancaire",
  prelevement: "Prélèvement automatique",
  cheque: "Chèque",
  especes: "Espèces",
}

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedPeriod, setSelectedPeriod] = useState("month")

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.tenant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.reference.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = selectedStatus === "all" || payment.status === selectedStatus
    const matchesType = selectedType === "all" || payment.type === selectedType

    return matchesSearch && matchesStatus && matchesType
  })

  // Calculs pour les statistiques
  const totalReceived = payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0)
  const totalPending = payments.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0)
  const totalOverdue = payments.filter((p) => p.status === "overdue").reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des paiements</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button>
            <Send className="h-4 w-4 mr-2" />
            Envoyer rappel
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{totalReceived.toLocaleString()} €</p>
                <p className="text-sm text-muted-foreground">Reçu ce mois</p>
              </div>
              <div className="flex items-center text-green-500">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="text-sm">+12%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600">{totalPending.toLocaleString()} €</p>
                <p className="text-sm text-muted-foreground">En attente</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">{totalOverdue.toLocaleString()} €</p>
                <p className="text-sm text-muted-foreground">En retard</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">96%</p>
                <p className="text-sm text-muted-foreground">Taux de recouvrement</p>
              </div>
              <div className="flex items-center text-green-500">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span className="text-sm">+2%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un paiement..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="paid">Payé</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="overdue">En retard</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="rent">Loyer</SelectItem>
                <SelectItem value="deposit">Dépôt de garantie</SelectItem>
                <SelectItem value="charges">Charges</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Ce mois</SelectItem>
                <SelectItem value="quarter">Ce trimestre</SelectItem>
                <SelectItem value="year">Cette année</SelectItem>
                <SelectItem value="all">Toutes les périodes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des paiements */}
      <Card>
        <CardHeader>
          <CardTitle>Paiements ({filteredPayments.length})</CardTitle>
          <CardDescription>Suivez tous vos encaissements et échéances</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPayments.map((payment) => {
              const paymentType = paymentTypes[payment.type as keyof typeof paymentTypes]
              const status = statusConfig[payment.status as keyof typeof statusConfig]
              const StatusIcon = status?.icon || Clock

              return (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Euro className="h-5 w-5 text-blue-600" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{payment.tenant}</h3>
                        <Badge
                          variant="outline"
                          className={`text-${paymentType?.color}-600 border-${paymentType?.color}-200`}
                        >
                          {paymentType?.label}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{payment.property}</span>
                        <span>•</span>
                        <span>{paymentMethods[payment.method as keyof typeof paymentMethods]}</span>
                        <span>•</span>
                        <span>Réf: {payment.reference}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>Échéance: {new Date(payment.dueDate).toLocaleDateString("fr-FR")}</span>
                        {payment.paidDate && (
                          <>
                            <span>•</span>
                            <span>Payé le: {new Date(payment.paidDate).toLocaleDateString("fr-FR")}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-lg font-bold">{payment.amount.toLocaleString()} €</p>
                      <Badge
                        variant={
                          status?.color === "green" ? "default" : status?.color === "red" ? "destructive" : "secondary"
                        }
                        className="mt-1"
                      >
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status?.label}
                      </Badge>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir détails
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger reçu
                        </DropdownMenuItem>
                        {payment.status === "overdue" && (
                          <DropdownMenuItem>
                            <Send className="h-4 w-4 mr-2" />
                            Envoyer rappel
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
