import { Search, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import Link from "next/link"

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
  {
    id: 4,
    title: "Loft industriel spacieux",
    address: "12 Rue des Artistes, Marseille",
    price: 1500,
    type: "Loft",
    bedrooms: 2,
    bathrooms: 2,
    area: 90,
    status: "Disponible",
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: 5,
    title: "Appartement avec vue sur mer",
    address: "56 Boulevard Maritime, Nice",
    price: 2200,
    type: "Appartement",
    bedrooms: 3,
    bathrooms: 2,
    area: 110,
    status: "Disponible",
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: 6,
    title: "Maison de campagne avec terrain",
    address: "23 Chemin des Vignes, Aix-en-Provence",
    price: 1600,
    type: "Maison",
    bedrooms: 3,
    bathrooms: 1,
    area: 95,
    status: "Loué",
    image: "/placeholder.svg?height=200&width=300",
  },
]

export default function PropertiesPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Rechercher un bien</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filtres */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border p-4 sticky top-4">
            <h2 className="font-semibold text-lg mb-4">Filtres</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Recherche</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder="Ville, quartier..." className="pl-8" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Type de bien</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="apartment">Appartement</SelectItem>
                    <SelectItem value="house">Maison</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="loft">Loft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Budget max (€/mois)</label>
                <div className="pt-2 pb-6">
                  <Slider defaultValue={[2000]} max={5000} step={100} />
                </div>
                <div className="text-sm text-right">Jusqu'à 2000 €</div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Chambres</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Nombre de chambres" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Peu importe</SelectItem>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Surface min (m²)</label>
                <div className="pt-2 pb-6">
                  <Slider defaultValue={[50]} max={200} step={10} />
                </div>
                <div className="text-sm text-right">À partir de 50 m²</div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Disponibilité</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Disponibilité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="available">Disponible</SelectItem>
                    <SelectItem value="rented">Loué</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full">Appliquer les filtres</Button>
            </div>
          </div>
        </div>

        {/* Liste des propriétés */}
        <div className="lg:col-span-3">
          <div className="flex justify-between items-center mb-4">
            <p className="text-muted-foreground">{properties.length} biens trouvés</p>
            <Select defaultValue="price-asc">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price-asc">Prix croissant</SelectItem>
                <SelectItem value="price-desc">Prix décroissant</SelectItem>
                <SelectItem value="area-desc">Surface décroissante</SelectItem>
                <SelectItem value="newest">Plus récents</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {properties.map((property) => (
              <Card key={property.id} className="overflow-hidden">
                <Link href={`/properties/${property.id}`}>
                  <div className="aspect-video w-full overflow-hidden">
                    <img
                      src={property.image || "/placeholder.svg"}
                      alt={property.title}
                      className="h-full w-full object-cover transition-transform hover:scale-105"
                    />
                  </div>
                </Link>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <Link href={`/properties/${property.id}`}>
                      <CardTitle className="text-lg hover:text-blue-600 transition-colors">{property.title}</CardTitle>
                    </Link>
                    <Badge variant={property.status === "Disponible" ? "default" : "secondary"}>
                      {property.status}
                    </Badge>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 mr-1" />
                    {property.address}
                  </div>
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
                  <p className="font-bold text-lg">{property.price} €/mois</p>
                  <Button asChild>
                    <Link href={`/properties/${property.id}`}>Voir détails</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="flex justify-center mt-8">
            <div className="flex gap-1">
              <Button variant="outline" size="icon" disabled>
                &lt;
              </Button>
              <Button variant="default" size="icon">
                1
              </Button>
              <Button variant="outline" size="icon">
                2
              </Button>
              <Button variant="outline" size="icon">
                3
              </Button>
              <Button variant="outline" size="icon">
                &gt;
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
