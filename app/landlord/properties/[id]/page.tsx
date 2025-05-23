import { PropertyStats } from "@/components/property-stats"
import { PropertyVisits } from "@/components/property-visits"
import { PropertyApplications } from "@/components/property-applications"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  EditIcon,
  ShareIcon,
  EyeIcon,
  HeartIcon,
  MapPinIcon,
  BedIcon,
  BathIcon,
  SquareIcon,
  CalendarIcon,
} from "lucide-react"

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  // Mock data - in real app, this would come from API based on params.id
  const property = {
    id: 1,
    title: "Appartement 3 pièces - Belleville",
    description:
      "Charmant appartement rénové dans un quartier dynamique de Paris. Proche des transports en commun et des commerces. Idéal pour un couple ou une petite famille.",
    address: "15 rue de Belleville, 75020 Paris",
    district: "Belleville",
    city: "Paris",
    postalCode: "75020",
    type: "Appartement",
    rentalType: "Vide",
    price: 1200,
    charges: 150,
    deposit: 1200,
    surface: 65,
    rooms: 3,
    bedrooms: 2,
    bathrooms: 1,
    floor: 3,
    totalFloors: 5,
    energyClass: "C",
    availableFrom: "2025-06-01",
    status: "active",
    publishedAt: "2025-05-15",
    features: ["Balcon", "Ascenseur", "Cave", "Interphone", "Parquet"],
    images: [
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
    ],
    stats: {
      views: 45,
      favorites: 8,
      applications: 3,
      visits: 5,
      contactRequests: 12,
    },
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Actif</Badge>
      case "rented":
        return <Badge className="bg-blue-500">Loué</Badge>
      case "draft":
        return <Badge variant="outline">Brouillon</Badge>
      default:
        return <Badge variant="outline">Inconnu</Badge>
    }
  }

  const getEnergyClassColor = (energyClass: string) => {
    const colors = {
      A: "bg-green-500",
      B: "bg-green-400",
      C: "bg-yellow-400",
      D: "bg-orange-400",
      E: "bg-orange-500",
      F: "bg-red-400",
      G: "bg-red-500",
    }
    return colors[energyClass as keyof typeof colors] || "bg-gray-400"
  }

  return (
    <div className="container mx-auto py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{property.title}</h1>
              {getStatusBadge(property.status)}
            </div>
            <div className="flex items-center text-muted-foreground mb-2">
              <MapPinIcon className="h-4 w-4 mr-1" />
              {property.address}
            </div>
            <p className="text-muted-foreground">
              Publié le {new Date(property.publishedAt).toLocaleDateString("fr-FR")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <EditIcon className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            <Button variant="outline">
              <ShareIcon className="h-4 w-4 mr-2" />
              Partager
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property images */}
          <Card>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="md:col-span-2">
                  <img
                    src={property.images[0] || "/placeholder.svg"}
                    alt={property.title}
                    className="w-full h-64 md:h-80 object-cover rounded-t-lg"
                  />
                </div>
                {property.images.slice(1).map((image, index) => (
                  <img
                    key={index}
                    src={image || "/placeholder.svg"}
                    alt={`${property.title} - ${index + 2}`}
                    className="w-full h-32 object-cover"
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Property details */}
          <Card>
            <CardHeader>
              <CardTitle>Détails du bien</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{property.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <SquareIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{property.surface}m²</span>
                </div>
                <div className="flex items-center gap-2">
                  <BedIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{property.rooms} pièces</span>
                </div>
                <div className="flex items-center gap-2">
                  <BedIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{property.bedrooms} chambres</span>
                </div>
                <div className="flex items-center gap-2">
                  <BathIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{property.bathrooms} sdb</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium mb-1">Étage</h4>
                  <p className="text-sm text-muted-foreground">
                    {property.floor}e sur {property.totalFloors}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">DPE</h4>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded text-white text-xs flex items-center justify-center ${getEnergyClassColor(property.energyClass)}`}
                    >
                      {property.energyClass}
                    </div>
                    <span className="text-sm text-muted-foreground">Classe {property.energyClass}</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Disponible</h4>
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {new Date(property.availableFrom).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Équipements</h4>
                <div className="flex flex-wrap gap-2">
                  {property.features.map((feature) => (
                    <Badge key={feature} variant="outline">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for visits and applications */}
          <Tabs defaultValue="stats" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="stats">Statistiques</TabsTrigger>
              <TabsTrigger value="visits">Visites</TabsTrigger>
              <TabsTrigger value="applications">Candidatures</TabsTrigger>
            </TabsList>

            <TabsContent value="stats">
              <PropertyStats property={property} />
            </TabsContent>

            <TabsContent value="visits">
              <PropertyVisits propertyId={property.id} />
            </TabsContent>

            <TabsContent value="applications">
              <PropertyApplications propertyId={property.id} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price info */}
          <Card>
            <CardHeader>
              <CardTitle>Informations financières</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Loyer mensuel</span>
                <span className="font-semibold">{property.price}€</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Charges</span>
                <span className="font-semibold">{property.charges}€</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="text-muted-foreground">Total mensuel</span>
                <span className="font-bold text-lg">{property.price + property.charges}€</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dépôt de garantie</span>
                <span className="font-semibold">{property.deposit}€</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick stats */}
          <Card>
            <CardHeader>
              <CardTitle>Performance</CardTitle>
              <CardDescription>Statistiques de votre annonce</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <EyeIcon className="h-4 w-4 text-blue-500" />
                    <span className="text-2xl font-bold">{property.stats.views}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Vues</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <HeartIcon className="h-4 w-4 text-red-500" />
                    <span className="text-2xl font-bold">{property.stats.favorites}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Favoris</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <CalendarIcon className="h-4 w-4 text-green-500" />
                    <span className="text-2xl font-bold">{property.stats.visits}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Visites</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <span className="text-2xl font-bold">{property.stats.applications}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Candidatures</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline">
                Planifier une visite
              </Button>
              <Button className="w-full" variant="outline">
                Voir les candidatures
              </Button>
              <Button className="w-full" variant="outline">
                Modifier l'annonce
              </Button>
              <Button className="w-full" variant="outline">
                Dupliquer l'annonce
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
