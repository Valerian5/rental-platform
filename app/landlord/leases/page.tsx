import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, FileText, Calendar, Euro, Eye, Edit, Users } from "lucide-react"
import Link from "next/link"

// Types
interface LandlordLease {
  id: string
  propertyAddress: string
  tenantName: string
  tenantEmail: string
  startDate: string
  endDate: string
  monthlyRent: number
  deposit: number
  status: "draft" | "pending_signature" | "active" | "expired" | "terminated" | "renewed"
  signedDate?: string
  nextPaymentDate: string
  paymentStatus: "up_to_date" | "pending" | "overdue"
  daysUntilExpiry: number
}

// Mock data
const mockLeases: LandlordLease[] = [
  {
    id: "1",
    propertyAddress: "123 Rue de la Paix, 75001 Paris",
    tenantName: "Jean Dupont",
    tenantEmail: "jean.dupont@email.com",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    monthlyRent: 1200,
    deposit: 2400,
    status: "active",
    signedDate: "2023-12-15",
    nextPaymentDate: "2024-02-01",
    paymentStatus: "up_to_date",
    daysUntilExpiry: 305,
  },
  {
    id: "2",
    propertyAddress: "456 Avenue des Champs, 75008 Paris",
    tenantName: "Marie Martin",
    tenantEmail: "marie.martin@email.com",
    startDate: "2024-03-01",
    endDate: "2025-02-28",
    monthlyRent: 1800,
    deposit: 3600,
    status: "pending_signature",
    nextPaymentDate: "2024-03-01",
    paymentStatus: "pending",
    daysUntilExpiry: 365,
  },
  {
    id: "3",
    propertyAddress: "789 Boulevard Saint-Germain, 75006 Paris",
    tenantName: "Pierre Dubois",
    tenantEmail: "pierre.dubois@email.com",
    startDate: "2023-06-01",
    endDate: "2024-05-31",
    monthlyRent: 2200,
    deposit: 4400,
    status: "active",
    signedDate: "2023-05-15",
    nextPaymentDate: "2024-02-01",
    paymentStatus: "overdue",
    daysUntilExpiry: 120,
  },
]

const statusConfig = {
  draft: { label: "Brouillon", color: "bg-gray-100 text-gray-800" },
  pending_signature: { label: "En attente de signature", color: "bg-yellow-100 text-yellow-800" },
  active: { label: "Actif", color: "bg-green-100 text-green-800" },
  expired: { label: "Expiré", color: "bg-red-100 text-red-800" },
  terminated: { label: "Résilié", color: "bg-gray-100 text-gray-800" },
  renewed: { label: "Renouvelé", color: "bg-blue-100 text-blue-800" },
}

const paymentStatusConfig = {
  up_to_date: { label: "À jour", color: "bg-green-100 text-green-800" },
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-800" },
  overdue: { label: "En retard", color: "bg-red-100 text-red-800" },
}

function LeaseCard({ lease }: { lease: LandlordLease }) {
  const status = statusConfig[lease.status]
  const paymentStatus = paymentStatusConfig[lease.paymentStatus]

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{lease.propertyAddress}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {lease.tenantName}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-1">
            <Badge className={status.color}>{status.label}</Badge>
            <Badge variant="outline" className={paymentStatus.color}>
              {paymentStatus.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Période:</span>
            <p className="font-medium">
              {new Date(lease.startDate).toLocaleDateString("fr-FR")} -{" "}
              {new Date(lease.endDate).toLocaleDateString("fr-FR")}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Loyer mensuel:</span>
            <p className="font-medium">{lease.monthlyRent}€</p>
          </div>
          <div>
            <span className="text-muted-foreground">Prochain paiement:</span>
            <p className="font-medium">{new Date(lease.nextPaymentDate).toLocaleDateString("fr-FR")}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Expire dans:</span>
            <p className="font-medium">{lease.daysUntilExpiry} jours</p>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button asChild size="sm" className="flex-1">
            <Link href={`/landlord/leases/${lease.id}`}>
              <Eye className="h-4 w-4 mr-2" />
              Voir détails
            </Link>
          </Button>
          <Button size="sm" variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function LeaseStats() {
  const totalLeases = mockLeases.length
  const activeLeases = mockLeases.filter((l) => l.status === "active").length
  const pendingSignature = mockLeases.filter((l) => l.status === "pending_signature").length
  const overduePayments = mockLeases.filter((l) => l.paymentStatus === "overdue").length
  const totalRevenue = mockLeases.filter((l) => l.status === "active").reduce((sum, l) => sum + l.monthlyRent, 0)

  return (
    <div className="grid gap-4 md:grid-cols-5">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total baux</p>
              <p className="text-2xl font-bold">{totalLeases}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Baux actifs</p>
              <p className="text-2xl font-bold">{activeLeases}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">En attente</p>
              <p className="text-2xl font-bold">{pendingSignature}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Calendar className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Retards</p>
              <p className="text-2xl font-bold">{overduePayments}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Euro className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Revenus/mois</p>
              <p className="text-2xl font-bold">{totalRevenue}€</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function LeaseFilters() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input placeholder="Rechercher par adresse ou locataire..." className="pl-10" />
      </div>
      <Select>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          <SelectItem value="active">Actif</SelectItem>
          <SelectItem value="pending_signature">En attente</SelectItem>
          <SelectItem value="expired">Expiré</SelectItem>
          <SelectItem value="terminated">Résilié</SelectItem>
        </SelectContent>
      </Select>
      <Select>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Paiements" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous</SelectItem>
          <SelectItem value="up_to_date">À jour</SelectItem>
          <SelectItem value="pending">En attente</SelectItem>
          <SelectItem value="overdue">En retard</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

export default function LandlordLeasesPage() {
  const activeLeases = mockLeases.filter((lease) => lease.status === "active")
  const pendingLeases = mockLeases.filter((lease) => lease.status === "pending_signature")
  const expiredLeases = mockLeases.filter((lease) => ["expired", "terminated"].includes(lease.status))
  const draftLeases = mockLeases.filter((lease) => lease.status === "draft")

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Baux</h1>
          <p className="text-muted-foreground">Gérez tous vos contrats de location</p>
        </div>
        <Button asChild>
          <Link href="/landlord/leases/new">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau bail
          </Link>
        </Button>
      </div>

      <LeaseStats />
      <LeaseFilters />

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Actifs ({activeLeases.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            En attente ({pendingLeases.length})
          </TabsTrigger>
          <TabsTrigger value="draft" className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            Brouillons ({draftLeases.length})
          </TabsTrigger>
          <TabsTrigger value="expired" className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            Terminés ({expiredLeases.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            Tous ({mockLeases.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeLeases.map((lease) => (
              <LeaseCard key={lease.id} lease={lease} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingLeases.map((lease) => (
              <LeaseCard key={lease.id} lease={lease} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {draftLeases.map((lease) => (
              <LeaseCard key={lease.id} lease={lease} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="expired" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {expiredLeases.map((lease) => (
              <LeaseCard key={lease.id} lease={lease} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockLeases.map((lease) => (
              <LeaseCard key={lease.id} lease={lease} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
