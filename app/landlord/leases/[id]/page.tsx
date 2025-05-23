import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  FileText,
  Download,
  Calendar,
  Euro,
  User,
  Home,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Edit,
  Send,
} from "lucide-react"
import { LeaseTimeline } from "@/components/leases/lease-timeline"
import { LeaseDocuments } from "@/components/leases/lease-documents"
import { RentPayments } from "@/components/leases/rent-payments"

// Same interface as tenant view but with additional landlord actions
interface LeaseDetails {
  id: string
  property: {
    address: string
    type: string
    surface: number
    rooms: number
    furnished: boolean
  }
  landlord: {
    name: string
    email: string
    phone: string
  }
  tenant: {
    name: string
    email: string
    phone: string
  }
  terms: {
    startDate: string
    endDate: string
    monthlyRent: number
    charges: number
    deposit: number
    noticePeriod: number
    renewalType: "automatic" | "manual"
  }
  status: "draft" | "pending_signature" | "active" | "expired" | "terminated" | "renewed"
  signedDate?: string
  documents: Array<{
    id: string
    name: string
    type: string
    url: string
    uploadDate: string
    signed: boolean
  }>
  payments: Array<{
    id: string
    dueDate: string
    amount: number
    status: "pending" | "paid" | "overdue"
    paidDate?: string
  }>
  timeline: Array<{
    id: string
    date: string
    type: "created" | "signed" | "payment" | "renewal" | "termination"
    description: string
    user: string
  }>
}

// Mock data (same as tenant view)
const mockLease: LeaseDetails = {
  id: "1",
  property: {
    address: "123 Rue de la Paix, 75001 Paris",
    type: "Appartement",
    surface: 65,
    rooms: 3,
    furnished: false,
  },
  landlord: {
    name: "Marie Dubois",
    email: "marie.dubois@email.com",
    phone: "+33 1 23 45 67 89",
  },
  tenant: {
    name: "Jean Dupont",
    email: "jean.dupont@email.com",
    phone: "+33 6 12 34 56 78",
  },
  terms: {
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    monthlyRent: 1200,
    charges: 150,
    deposit: 2400,
    noticePeriod: 3,
    renewalType: "automatic",
  },
  status: "active",
  signedDate: "2023-12-15",
  documents: [
    {
      id: "1",
      name: "Contrat de bail signé",
      type: "lease",
      url: "#",
      uploadDate: "2023-12-15",
      signed: true,
    },
    {
      id: "2",
      name: "État des lieux d'entrée",
      type: "inventory",
      url: "#",
      uploadDate: "2023-12-20",
      signed: true,
    },
    {
      id: "3",
      name: "Attestation d'assurance",
      type: "insurance",
      url: "#",
      uploadDate: "2023-12-18",
      signed: false,
    },
  ],
  payments: [
    {
      id: "1",
      dueDate: "2024-01-01",
      amount: 1350,
      status: "paid",
      paidDate: "2023-12-28",
    },
    {
      id: "2",
      dueDate: "2024-02-01",
      amount: 1350,
      status: "pending",
    },
  ],
  timeline: [
    {
      id: "1",
      date: "2023-12-10",
      type: "created",
      description: "Bail créé par le propriétaire",
      user: "Marie Dubois",
    },
    {
      id: "2",
      date: "2023-12-15",
      type: "signed",
      description: "Bail signé par le locataire",
      user: "Jean Dupont",
    },
    {
      id: "3",
      date: "2023-12-28",
      type: "payment",
      description: "Paiement du premier loyer",
      user: "Jean Dupont",
    },
  ],
}

const statusConfig = {
  draft: { label: "Brouillon", color: "bg-gray-100 text-gray-800", icon: Edit },
  pending_signature: { label: "En attente de signature", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  active: { label: "Actif", color: "bg-green-100 text-green-800", icon: CheckCircle },
  expired: { label: "Expiré", color: "bg-red-100 text-red-800", icon: AlertCircle },
  terminated: { label: "Résilié", color: "bg-gray-100 text-gray-800", icon: AlertCircle },
  renewed: { label: "Renouvelé", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
}

export default function LandlordLeaseDetailPage({ params }: { params: { id: string } }) {
  const lease = mockLease // In real app, fetch by params.id
  const status = statusConfig[lease.status]
  const StatusIcon = status.icon

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Gestion du Bail</h1>
          <p className="text-muted-foreground">{lease.property.address}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={status.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
          <Button variant="outline" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Contacter locataire
          </Button>
          <Button size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Euro className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Loyer mensuel</p>
                <p className="text-lg font-semibold">{lease.terms.monthlyRent}€</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fin du bail</p>
                <p className="text-lg font-semibold">{new Date(lease.terms.endDate).toLocaleDateString("fr-FR")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Home className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Surface</p>
                <p className="text-lg font-semibold">{lease.property.surface}m²</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <User className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Locataire</p>
                <p className="text-lg font-semibold">{lease.tenant.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="payments">Paiements</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="timeline">Historique</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Same content as tenant view */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Détails du Bien
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <p className="font-medium">{lease.property.type}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Surface:</span>
                    <p className="font-medium">{lease.property.surface}m²</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Pièces:</span>
                    <p className="font-medium">{lease.property.rooms}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Meublé:</span>
                    <p className="font-medium">{lease.property.furnished ? "Oui" : "Non"}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <span className="text-muted-foreground text-sm">Adresse:</span>
                  <p className="font-medium">{lease.property.address}</p>
                </div>
              </CardContent>
            </Card>

            {/* Lease Terms */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Conditions du Bail
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Début:</span>
                    <p className="font-medium">{new Date(lease.terms.startDate).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fin:</span>
                    <p className="font-medium">{new Date(lease.terms.endDate).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Loyer:</span>
                    <p className="font-medium">{lease.terms.monthlyRent}€</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Charges:</span>
                    <p className="font-medium">{lease.terms.charges}€</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Dépôt:</span>
                    <p className="font-medium">{lease.terms.deposit}€</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Préavis:</span>
                    <p className="font-medium">{lease.terms.noticePeriod} mois</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <span className="text-muted-foreground text-sm">Renouvellement:</span>
                  <p className="font-medium">{lease.terms.renewalType === "automatic" ? "Automatique" : "Manuel"}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations de Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-3">Propriétaire</h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Nom:</span> {lease.landlord.name}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Email:</span> {lease.landlord.email}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Téléphone:</span> {lease.landlord.phone}
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Locataire</h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Nom:</span> {lease.tenant.name}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Email:</span> {lease.tenant.email}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Téléphone:</span> {lease.tenant.phone}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <RentPayments payments={lease.payments} />
        </TabsContent>

        <TabsContent value="documents">
          <LeaseDocuments documents={lease.documents} />
        </TabsContent>

        <TabsContent value="timeline">
          <LeaseTimeline timeline={lease.timeline} />
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions Propriétaire</CardTitle>
              <CardDescription>Gérez le bail et effectuez les actions nécessaires</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {lease.status === "draft" && (
                <>
                  <Button className="w-full justify-start">
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer pour signature
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier le bail
                  </Button>
                </>
              )}

              {lease.status === "pending_signature" && (
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Relancer le locataire
                </Button>
              )}

              {lease.status === "active" && (
                <>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger le bail signé
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Proposer un renouvellement
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Générer un avenant
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Initier une résiliation
                  </Button>
                </>
              )}

              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                Contacter le locataire
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
