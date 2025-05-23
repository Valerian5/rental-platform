import {
  Search,
  Plus,
  Filter,
  Download,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  MoreHorizontal,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Exemple de données de paiements
const payments = [
  {
    id: 1,
    tenant: "Sophie Martin",
    property: "Appartement moderne au centre-ville",
    date: "2023-05-03",
    amount: 1200,
    type: "Loyer",
    status: "Payé",
    method: "Virement bancaire",
  },
  {
    id: 2,
    tenant: "Thomas Bernard",
    property: "Studio étudiant rénové",
    date: "2023-05-02",
    amount: 550,
    type: "Loyer",
    status: "Payé",
    method: "Prélèvement automatique",
  },
  {
    id: 3,
    tenant: "Emma Petit",
    property: "Loft industriel spacieux",
    date: "2023-05-10",
    amount: 1500,
    type: "Loyer",
    status: "En retard",
    method: "En attente",
  },
  {
    id: 4,
    tenant: "Lucas Dubois",
    property: "Appartement avec vue sur mer",
    date: "2023-05-01",
    amount: 2200,
    type: "Loyer",
    status: "Payé",
    method: "Virement bancaire",
  },
  {
    id: 5,
    tenant: "Sophie Martin",
    property: "Appartement moderne au centre-ville",
    date: "2023-04-05",
    amount: 1200,
    type: "Loyer",
    status: "Payé",
    method: "Virement bancaire",
  },
  {
    id: 6,
    tenant: "Thomas Bernard",
    property: "Studio étudiant rénové",
    date: "2023-04-03",
    amount: 550,
    type: "Loyer",
    status: "Payé",
    method: "Prélèvement automatique",
  },
  {
    id: 7,
    tenant: "Emma Petit",
    property: "Loft industriel spacieux",
    date: "2023-04-08",
    amount: 1500,
    type: "Loyer",
    status: "Payé",
    method: "Virement bancaire",
  },
  {
    id: 8,
    tenant: "Lucas Dubois",
    property: "Appartement avec vue sur mer",
    date: "2023-04-02",
    amount: 2200,
    type: "Loyer",
    status: "Payé",
    method: "Virement bancaire",
  },
  {
    id: 9,
    tenant: "Sophie Martin",
    property: "Appartement moderne au centre-ville",
    date: "2023-03-04",
    amount: 1200,
    type: "Loyer",
    status: "Payé",
    method: "Virement bancaire",
  },
  {
    id: 10,
    tenant: "Thomas Bernard",
    property: "Studio étudiant rénové",
    date: "2023-03-02",
    amount: 550,
    type: "Loyer",
    status: "Payé",
    method: "Prélèvement automatique",
  },
]

// Exemple de données de dépenses
const expenses = [
  {
    id: 1,
    property: "Appartement moderne au centre-ville",
    date: "2023-04-15",
    amount: 350,
    category: "Réparation",
    description: "Plomberie salle de bain",
    status: "Payé",
  },
  {
    id: 2,
    property: "Maison familiale avec jardin",
    date: "2023-04-10",
    amount: 180,
    category: "Entretien",
    description: "Jardinage mensuel",
    status: "Payé",
  },
  {
    id: 3,
    property: "Loft industriel spacieux",
    date: "2023-03-28",
    amount: 520,
    category: "Réparation",
    description: "Électricité",
    status: "Payé",
  },
  {
    id: 4,
    property: "Appartement avec vue sur mer",
    date: "2023-03-15",
    amount: 420,
    category: "Entretien",
    description: "Nettoyage des vitres",
    status: "Payé",
  },
]

export default function PaymentManagementPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <CreditCard className="h-6 w-6 mr-2" />
          <h1 className="text-2xl font-bold">Gestion des Paiements</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Enregistrer un paiement
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenus du mois</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-2xl font-bold">5 450 €</div>
              <div className="ml-2 flex items-center text-green-500 text-sm">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                +8%
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dépenses du mois</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-2xl font-bold">1 470 €</div>
              <div className="ml-2 flex items-center text-red-500 text-sm">
                <ArrowDownRight className="h-4 w-4 mr-1" />
                +12%
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Solde net</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-2xl font-bold">3 980 €</div>
              <div className="ml-2 flex items-center text-green-500 text-sm">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                +6%
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payments" className="space-y-6">
        <TabsList>
          <TabsTrigger value="payments">Paiements reçus</TabsTrigger>
          <TabsTrigger value="expenses">Dépenses</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="col-span-1 md:col-span-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Rechercher un paiement..." className="pl-8" />
              </div>
            </div>
            <div className="flex gap-2">
              <Select defaultValue="current">
                <SelectTrigger>
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Mois en cours</SelectItem>
                  <SelectItem value="last">Mois précédent</SelectItem>
                  <SelectItem value="all">Tous</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
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
                  <TableHead>Type</TableHead>
                  <TableHead>Méthode</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.tenant}</TableCell>
                    <TableCell>{payment.property}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                        {new Date(payment.date).toLocaleDateString("fr-FR")}
                      </div>
                    </TableCell>
                    <TableCell>{payment.amount} €</TableCell>
                    <TableCell>{payment.type}</TableCell>
                    <TableCell>{payment.method}</TableCell>
                    <TableCell>
                      <Badge variant={payment.status === "Payé" ? "success" : "destructive"}>{payment.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Voir détails</DropdownMenuItem>
                          <DropdownMenuItem>Télécharger reçu</DropdownMenuItem>
                          <DropdownMenuItem>Envoyer rappel</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Dépenses</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une dépense
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bien</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.property}</TableCell>
                    <TableCell>{new Date(expense.date).toLocaleDateString("fr-FR")}</TableCell>
                    <TableCell>{expense.amount} €</TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>
                      <Badge variant={expense.status === "Payé" ? "success" : "outline"}>{expense.status}</Badge>
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

        <TabsContent value="reports">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenus par bien</CardTitle>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                <div className="text-center">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Graphique des revenus par bien</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Évolution des revenus</CardTitle>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                <div className="text-center">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Graphique d'évolution des revenus</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
