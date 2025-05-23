import { Search, Plus, Filter, User, Mail, Phone, MoreHorizontal, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

// Exemple de données de propriétaires
const owners = [
  {
    id: 1,
    name: "Jean Dupont",
    email: "jean.dupont@example.com",
    phone: "06 12 34 56 78",
    properties: ["Appartement moderne au centre-ville", "Studio étudiant rénové"],
    propertiesCount: 2,
    status: "Actif",
    avatar: "/placeholder.svg?height=40&width=40&text=JD",
    joinDate: "2022-01-15",
  },
  {
    id: 2,
    name: "Marie Leroy",
    email: "marie.leroy@example.com",
    phone: "06 23 45 67 89",
    properties: ["Maison familiale avec jardin", "Loft industriel spacieux", "Appartement avec vue sur mer"],
    propertiesCount: 3,
    status: "Actif",
    avatar: "/placeholder.svg?height=40&width=40&text=ML",
    joinDate: "2022-03-10",
  },
  {
    id: 3,
    name: "Pierre Martin",
    email: "pierre.martin@example.com",
    phone: "06 34 56 78 90",
    properties: ["Maison de campagne avec terrain"],
    propertiesCount: 1,
    status: "Inactif",
    avatar: "/placeholder.svg?height=40&width=40&text=PM",
    joinDate: "2021-11-05",
  },
  {
    id: 4,
    name: "Sophie Bernard",
    email: "sophie.bernard@example.com",
    phone: "06 45 67 89 01",
    properties: [],
    propertiesCount: 0,
    status: "En attente",
    avatar: "/placeholder.svg?height=40&width=40&text=SB",
    joinDate: "2023-04-20",
  },
]

export default function OwnerManagementPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <User className="h-6 w-6 mr-2" />
          <h1 className="text-2xl font-bold">Gestion des Propriétaires</h1>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un propriétaire
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total des propriétaires</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Propriétaires actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total des biens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Biens disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="col-span-1 md:col-span-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Rechercher un propriétaire..." className="pl-8" />
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
              <SelectItem value="inactive">Inactif</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {owners.map((owner) => (
          <Card key={owner.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={owner.avatar || "/placeholder.svg"} alt={owner.name} />
                    <AvatarFallback>
                      {owner.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{owner.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Inscrit le {new Date(owner.joinDate).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    owner.status === "Actif" ? "default" : owner.status === "En attente" ? "outline" : "secondary"
                  }
                >
                  {owner.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  {owner.email}
                </div>
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  {owner.phone}
                </div>
                <div className="flex items-center text-sm">
                  <Home className="h-4 w-4 mr-2 text-muted-foreground" />
                  {owner.propertiesCount} bien{owner.propertiesCount > 1 ? "s" : ""}
                </div>
              </div>

              {owner.properties.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Biens immobiliers :</p>
                  <div className="space-y-1">
                    {owner.properties.map((property, index) => (
                      <div key={index} className="text-sm flex items-start">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-600 mr-2 mt-1.5"></div>
                        <span>{property}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                  <DropdownMenuItem>Gérer les biens</DropdownMenuItem>
                  <DropdownMenuItem>Voir les contrats</DropdownMenuItem>
                  <DropdownMenuItem>Voir les paiements</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-500">Désactiver</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
