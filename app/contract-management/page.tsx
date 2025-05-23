import { Search, Plus, Filter, FileText, Download, MoreHorizontal, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"

// Exemple de données de contrats
const contracts = [
  {
    id: 1,
    tenant: "Sophie Martin",
    property: "Appartement moderne au centre-ville",
    startDate: "2023-01-15",
    endDate: "2024-01-14",
    status: "Actif",
    rentAmount: 1200,
    depositAmount: 2400,
    type: "Bail d'habitation",
    progress: 100,
  },
  {
    id: 2,
    tenant: "Thomas Bernard",
    property: "Studio étudiant rénové",
    startDate: "2023-03-01",
    endDate: "2024-02-28",
    status: "Actif",
    rentAmount: 550,
    depositAmount: 550,
    type: "Bail étudiant",
    progress: 100,
  },
  {
    id: 3,
    tenant: "Emma Petit",
    property: "Loft industriel spacieux",
    startDate: "2022-09-01",
    endDate: "2023-08-31",
    status: "Actif",
    rentAmount: 1500,
    depositAmount: 3000,
    type: "Bail d'habitation",
    progress: 100,
  },
  {
    id: 4,
    tenant: "Lucas Dubois",
    property: "Appartement avec vue sur mer",
    startDate: "2022-06-15",
    endDate: "2023-06-14",
    status: "Préavis",
    rentAmount: 2200,
    depositAmount: 4400,
    type: "Bail d'habitation",
    progress: 100,
  },
  {
    id: 5,
    tenant: "Nouveau locataire",
    property: "Maison de campagne avec terrain",
    startDate: "",
    endDate: "",
    status: "En attente",
    rentAmount: 1600,
    depositAmount: 3200,
    type: "Bail d'habitation",
    progress: 60,
  },
]

export default function ContractManagementPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FileText className="h-6 w-6 mr-2" />
          <h1 className="text-2xl font-bold">Gestion des Contrats</h1>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau contrat
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total des contrats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Contrats actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Contrats en préavis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Contrats en attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="col-span-1 md:col-span-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Rechercher un contrat..." className="pl-8" />
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
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="expired">Expiré</SelectItem>
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
              <TableHead>Type</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Loyer</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Progression</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((contract) => (
              <TableRow key={contract.id}>
                <TableCell className="font-medium">{contract.tenant}</TableCell>
                <TableCell>{contract.property}</TableCell>
                <TableCell>{contract.type}</TableCell>
                <TableCell>
                  {contract.startDate ? (
                    <div className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                      <span>{new Date(contract.startDate).toLocaleDateString("fr-FR")}</span>
                      <span className="mx-1">-</span>
                      <span>{new Date(contract.endDate).toLocaleDateString("fr-FR")}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Non défini</span>
                  )}
                </TableCell>
                <TableCell>{contract.rentAmount} €/mois</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      contract.status === "Actif"
                        ? "default"
                        : contract.status === "Préavis"
                          ? "warning"
                          : contract.status === "En attente"
                            ? "outline"
                            : "secondary"
                    }
                  >
                    {contract.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={contract.progress} className="h-2 w-20" />
                    <span className="text-xs">{contract.progress}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {contract.progress === 100 && (
                      <Button variant="outline" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Voir détails</DropdownMenuItem>
                        <DropdownMenuItem>Modifier</DropdownMenuItem>
                        {contract.status === "En attente" && (
                          <DropdownMenuItem>Continuer la rédaction</DropdownMenuItem>
                        )}
                        {contract.status === "Actif" && <DropdownMenuItem>Initier préavis</DropdownMenuItem>}
                        <DropdownMenuItem className="text-red-500">Supprimer</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Contrats à renouveler prochainement</h2>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Contrat de Lucas Dubois</h3>
                <p className="text-sm text-muted-foreground">
                  Expire le {new Date("2023-06-14").toLocaleDateString("fr-FR")}
                </p>
              </div>
              <Button>Renouveler</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
