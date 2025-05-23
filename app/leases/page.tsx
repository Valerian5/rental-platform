import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, FileText, Eye } from "lucide-react"
import Link from "next/link"

// Types
interface Lease {
  id: string
  propertyAddress: string
  landlordName: string
  startDate: string
  endDate: string
  monthlyRent: number
  deposit: number
  status: "draft" | "pending_signature" | "active" | "expired" | "terminated" | "renewed"
  signedDate?: string
  nextPaymentDate: string
  documents: Array<{
    id: string
    name: string
    type: string
    url: string
  }>
}

// Mock data
const mockLeases: Lease[] = [
  {
    id: "1",
    propertyAddress: "123 Rue de la Paix, 75001 Paris",
    landlordName: "Marie Dubois",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    monthlyRent: 1200,
    deposit: 2400,
    status: "active",
    signedDate: "2023-12-15",
    nextPaymentDate: "2024-02-01",
    documents: [
      { id: "1", name: "Contrat de bail", type: "lease", url: "#" },
      { id: "2", name: "État des lieux d'entrée", type: "inventory", url: "#" },
    ],
  },
  {
    id: "2",
    propertyAddress: "456 Avenue des Champs, 75008 Paris",
    landlordName: "Pierre Martin",
    startDate: "2024-03-01",
    endDate: "2025-02-28",
    monthlyRent: 1800,
    deposit: 3600,
    status: "pending_signature",
    nextPaymentDate: "2024-03-01",
    documents: [{ id: "3", name: "Contrat de bail (brouillon)", type: "lease", url: "#" }],
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

function LeaseCard({ lease }: { lease: Lease }) {
  const status = statusConfig[lease.status]

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{lease.propertyAddress}</CardTitle>
            <CardDescription>Propriétaire: {lease.landlordName}</CardDescription>
          </div>
          <Badge className={status.color}>{status.label}</Badge>
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
            <span className="text-muted-foreground">Dépôt de garantie:</span>
            <p className="font-medium">{lease.deposit}€</p>
          </div>
          <div>
            <span className="text-muted-foreground">Prochain paiement:</span>
            <p className="font-medium">{new Date(lease.nextPaymentDate).toLocaleDateString("fr-FR")}</p>
          </div>
        </div>

        {lease.documents.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Documents:</span>
            <div className="flex flex-wrap gap-2">
              {lease.documents.map((doc) => (
                <Button key={doc.id} variant="outline" size="sm" className="h-8">
                  <FileText className="h-3 w-3 mr-1" />
                  {doc.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button asChild size="sm" className="flex-1">
            <Link href={`/leases/${lease.id}`}>
              <Eye className="h-4 w-4 mr-2" />
              Voir détails
            </Link>
          </Button>
          {lease.status === "pending_signature" && (
            <Button size="sm" variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Signer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function LeaseFilters() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input placeholder="Rechercher par adresse ou propriétaire..." className="pl-10" />
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
          <SelectValue placeholder="Année" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="2024">2024</SelectItem>
          <SelectItem value="2023">2023</SelectItem>
          <SelectItem value="2022">2022</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

export default function LeasesPage() {
  const activeLeases = mockLeases.filter((lease) => lease.status === "active")
  const pendingLeases = mockLeases.filter((lease) => lease.status === "pending_signature")
  const expiredLeases = mockLeases.filter((lease) => ["expired", "terminated"].includes(lease.status))

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mes Baux</h1>
          <p className="text-muted-foreground">Gérez vos contrats de location</p>
        </div>
      </div>

      <LeaseFilters />

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Actifs ({activeLeases.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            En attente ({pendingLeases.length})
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
