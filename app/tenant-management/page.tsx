import { Search, Plus, Filter, Mail, Phone, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Exemple de données de locataires
const tenants = [
  {
    id: 1,
    name: "Sophie Martin",
    email: "sophie.martin@example.com",
    phone: "06 12 34 56 78",
    property: "Appartement moderne au centre-ville",
    status: "Actif",
    leaseStart: "2023-01-15",
    leaseEnd: "2024-01-14",
    rentAmount: 1200,
    paymentStatus: "À jour",
    avatar: "/placeholder.svg?height=40&width=40&text=SM",
  },
  {
    id: 2,
    name: "Thomas Bernard",
    email: "thomas.bernard@example.com",
    phone: "06 23 45 67 89",
    property: "Studio étudiant rénové",
    status: "Actif",
    leaseStart: "2023-03-01",
    leaseEnd: "2024-02-28",
    rentAmount: 550,
    paymentStatus: "À jour",
    avatar: "/placeholder.svg?height=40&width=40&text=TB",
  },
  {
    id: 3,
    name: "Emma Petit",
    email: "emma.petit@example.com",
    phone: "06 34 56 78 90",
    property: "Loft industriel spacieux",
    status: "Actif",
    leaseStart: "2022-09-01",
    leaseEnd: "2023-08-31",
    rentAmount: 1500,
    paymentStatus: "Retard",
    avatar: "/placeholder.svg?height=40&width=40&text=EP",
  },
  {
    id: 4,
    name: "Lucas Dubois",
    email: "lucas.dubois@example.com",
    phone: "06 45 67 89 01",
    property: "Appartement avec vue sur mer",
    status: "Préavis",
    leaseStart: "2022-06-15",
    leaseEnd: "2023-06-14",
    rentAmount: 2200,
    paymentStatus: "À jour",
    avatar: "/placeholder.svg?height=40&width=40&text=LD",
  },
  {
    id: 5,
    name: "Chloé Leroy",
    email: "chloe.leroy@example.com",
    phone: "06 56 78 90 12",
    property: "Maison familiale avec jardin",
    status: "Ancien",
    leaseStart: "2021-04-01",
    leaseEnd: "2023-03-31",
    rentAmount: 1800,
    paymentStatus: "Terminé",
    avatar: "/placeholder.svg?height=40&width=40&text=CL",
  },
]

// Exemple de données de paiements
const payments = [
  {
    id: 1,
    tenantName: "Sophie Martin",
    property: "Appartement moderne au centre-ville",
    date: "2023-05-03",
    amount: 1200,
    status: "Payé",
  },
  {
    id: 2,
    tenantName: "Thomas Bernard",
    property: "Studio étudiant rénové",
    date: "2023-05-02",
    amount: 550,
    status: "Payé",
  },
  {
    id: 3,
    tenantName: "Emma Petit",
    property: "Loft industriel spacieux",
    date: "2023-05-10",
    amount: 1500,
    status: "En retard",
  },
  {
    id: 4,
    tenantName: "Lucas Dubois",
    property: "Appartement avec vue sur mer",
    date: "2023-05-01",
    amount: 2200,
    status: "Payé",
  },
  {
    id: 5,
    tenantName: "Sophie Martin",
    property: "Appartement moderne au centre-ville",
    date: "2023-04-05",
    amount: 1200,
    status: "Payé",
  },
]

export default function TenantManagementPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Gestion des Locataires</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un locataire
        </Button>
      </div>

      <Tabs defaultValue="tenants" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tenants">Locataires</TabsTrigger>
          <TabsTrigger value="payments">Paiements</TabsTrigger>
          <TabsTrigger value="requests">Demandes</TabsTrigger>
        </TabsList>

        <TabsContent value="tenants">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="col-span-1 md:col-span-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Rechercher un locataire..." className="pl-8" />
              </div>
            </div>
            <div className="flex gap-2">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="notice">Préavis</SelectItem>
                  <SelectItem value="former">Ancien</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenants.map((tenant) => (
              <Card key={tenant.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage src={tenant.avatar || "/placeholder.svg"} alt={tenant.name} />
                        <AvatarFallback>
                          {tenant.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{tenant.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{tenant.property}</p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        tenant.status === "Actif" ? "default" : tenant.status === "Préavis" ? "warning" : "secondary"
                      }
                    >
                      {tenant.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      {tenant.email}
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      {tenant.phone}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Début du bail</p>
                      <p className="text-sm font-medium">{new Date(tenant.leaseStart).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Fin du bail</p>
                      <p className="text-sm font-medium">{new Date(tenant.leaseEnd).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Loyer mensuel</p>
                      <p className="text-sm font-medium">{tenant.rentAmount} €</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Statut paiement</p>
                      <p className={`text-sm font-medium ${tenant.paymentStatus === "Retard" ? "text-red-500" : ""}`}>
                        {tenant.paymentStatus}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm">
                    Voir détails
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Envoyer un message</DropdownMenuItem>
                      <DropdownMenuItem>Gérer le bail</DropdownMenuItem>
                      <DropdownMenuItem>Historique des paiements</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-500">Mettre fin au bail</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="payments">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Historique des paiements</h2>
            <div className="flex gap-2">
              <Select defaultValue="current">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Mois en cours</SelectItem>
                  <SelectItem value="last">Mois précédent</SelectItem>
                  <SelectItem value="all">Tous</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">Exporter</Button>
            </div>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Locataire</TableHead>
                  <TableHead>Bien</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.tenantName}</TableCell>
                    <TableCell>{payment.property}</TableCell>
                    <TableCell>{new Date(payment.date).toLocaleDateString("fr-FR")}</TableCell>
                    <TableCell>{payment.amount} €</TableCell>
                    <TableCell>
                      <Badge variant={payment.status === "Payé" ? "success" : "destructive"}>{payment.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Détails
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-gray-100 p-6 rounded-full mb-4">
              <Mail className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Aucune demande en attente</h2>
            <p className="text-muted-foreground max-w-md">
              Les demandes des locataires apparaîtront ici lorsqu'ils vous contacteront pour des réparations, des
              questions ou d'autres requêtes.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
