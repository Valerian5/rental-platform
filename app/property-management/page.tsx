import { Building, Plus, Filter, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Exemple de données de propriétés
const properties = [
  {
    id: 1,
    title: "Appartement moderne au centre-ville",
    address: "123 Rue Principale, Paris",
    price: 1200,
    type: "Appartement",
    bedrooms: 2,
    bathrooms: 1,
    area: 65,
    status: "Disponible",
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: 2,
    title: "Maison familiale avec jardin",
    address: "45 Avenue des Fleurs, Lyon",
    price: 1800,
    type: "Maison",
    bedrooms: 4,
    bathrooms: 2,
    area: 120,
    status: "Loué",
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: 3,
    title: "Studio étudiant rénové",
    address: "78 Rue des Étudiants, Bordeaux",
    price: 550,
    type: "Studio",
    bedrooms: 1,
    bathrooms: 1,
    area: 30,
    status: "Disponible",
    image: "/placeholder.svg?height=200&width=300",
  },
]

export default function PropertyManagement() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Building className="h-6 w-6 mr-2" />
          <h1 className="text-2xl font-bold">Gestion des Biens</h1>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un bien
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="col-span-1 md:col-span-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Rechercher un bien..." className="pl-8" />
          </div>
        </div>
        <div className="flex gap-2">
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Type de bien" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="apartment">Appartement</SelectItem>
              <SelectItem value="house">Maison</SelectItem>
              <SelectItem value="studio">Studio</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <Card key={property.id} className="overflow-hidden">
            <div className="aspect-video w-full overflow-hidden">
              <img
                src={property.image || "/placeholder.svg"}
                alt={property.title}
                className="h-full w-full object-cover"
              />
            </div>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{property.title}</CardTitle>
                <Badge variant={property.status === "Disponible" ? "default" : "secondary"}>{property.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{property.address}</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Chambres</p>
                  <p className="font-medium">{property.bedrooms}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">SdB</p>
                  <p className="font-medium">{property.bathrooms}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Surface</p>
                  <p className="font-medium">{property.area} m²</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <p className="font-bold">{property.price} €/mois</p>
              <Button variant="outline" size="sm">
                Gérer
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
