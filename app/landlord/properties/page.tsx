import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HomeIcon, PlusIcon, SearchIcon, EyeIcon, EditIcon, CalendarIcon, FileTextIcon, MapPinIcon } from "lucide-react"

export default function LandlordPropertiesPage() {
  // Mock data - in real app, this would come from API
  const properties = [
    {
      id: 1,
      title: "Appartement 3 pièces - Belleville",
      address: "15 rue de Belleville, 75020 Paris",
      type: "Appartement",
      rentalType: "Vide",
      price: 1200,
      surface: 65,
      rooms: 3,
      status: "active",
      publishedAt: "2025-05-15",
      views: 45,
      favorites: 8,
      applications: 3,
      visits: 5,
      images: ["/placeholder.svg?height=200&width=300"],
    },
    {
      id: 2,
      title: "Studio meublé - République",
      address: "8 rue du Temple, 75003 Paris",
      type: "Studio",
      rentalType: "Meublé",
      price: 850,
      surface: 25,
      rooms: 1,
      status: "rented",
      publishedAt: "2025-04-20",
      views: 78,
      favorites: 12,
      applications: 8,
      visits: 12,
      images: ["/placeholder.svg?height=200&width=300"],
      tenant: "Marie Dupont",
      leaseEnd: "2026-04-20",
    },
    {
      id: 3,
      title: "Maison 4 pièces avec jardin - Montreuil",
      address: "25 avenue de la République, 93100 Montreuil",
      type: "Maison",
      rentalType: "Vide",
      price: 1600,
      surface: 90,
      rooms: 4,
      status: "draft",
      publishedAt: null,
      views: 0,
      favorites: 0,
      applications: 0,
      visits: 0,
      images: ["/placeholder.svg?height=200&width=300"],
    },
    {
      id: 4,
      title: "Loft moderne - Bastille",
      address: "12 rue de la Roquette, 75011 Paris",
      type: "Loft",
      rentalType: "Vide",
      price: 1800,
      surface: 80,
      rooms: 2,
      status: "active",
      publishedAt: "2025-05-10",
      views: 92,
      favorites: 15,
      applications: 6,
      visits: 8,
      images: ["/placeholder.svg?height=200&width=300"],
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Actif</Badge>
      case "rented":
        return <Badge className="bg-blue-500">Loué</Badge>
      case "draft":
        return <Badge variant="outline">Brouillon</Badge>
      case "inactive":
        return <Badge variant="secondary">Inactif</Badge>
      default:
        return <Badge variant="outline">Inconnu</Badge>
    }
  }

  const filterByStatus = (status: string) => {
    if (status === "all") return properties
    return properties.filter((property) => property.status === status)
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Mes Biens Immobiliers</h1>
            <p className="text-muted-foreground">Gérez votre portefeuille immobilier</p>
          </div>
          <Link href="/landlord/properties/new">
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Ajouter un bien
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters and search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input placeholder="Rechercher un bien..." className="pl-10" />
              </div>
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="rented">Loué</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Type de bien" />
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
        </CardContent>
      </Card>

      {/* Properties tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">Tous ({properties.length})</TabsTrigger>
          <TabsTrigger value="active">Actifs ({filterByStatus("active").length})</TabsTrigger>
          <TabsTrigger value="rented">Loués ({filterByStatus("rented").length})</TabsTrigger>
          <TabsTrigger value="draft">Brouillons ({filterByStatus("draft").length})</TabsTrigger>
          <TabsTrigger value="inactive">Inactifs ({filterByStatus("inactive").length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {properties.map((property) => (
              <Card key={property.id} className="overflow-hidden">
                <div className="flex">
                  {/* Property image */}
                  <div className="w-48 h-32 relative">
                    <img
                      src={property.images[0] || "/placeholder.svg"}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2">{getStatusBadge(property.status)}</div>
                  </div>

                  {/* Property details */}
                  <div className="flex-1 p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{property.title}</h3>
                        <div className="flex items-center text-sm text-muted-foreground mb-1">
                          <MapPinIcon className="h-4 w-4 mr-1" />
                          {property.address}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{property.surface}m²</span>
                          <span>{property.rooms} pièces</span>
                          <span>{property.type}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-primary">{property.price}€</div>
                        <div className="text-sm text-muted-foreground">/mois</div>
                      </div>
                    </div>

                    {/* Property stats */}
                    <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
                      <div className="text-center">
                        <div className="font-medium">{property.views}</div>
                        <div className="text-muted-foreground">Vues</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{property.favorites}</div>
                        <div className="text-muted-foreground">Favoris</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{property.applications}</div>
                        <div className="text-muted-foreground">Candidatures</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{property.visits}</div>
                        <div className="text-muted-foreground">Visites</div>
                      </div>
                    </div>

                    {/* Tenant info for rented properties */}
                    {property.status === "rented" && property.tenant && (
                      <div className="mb-3 p-2 bg-blue-50 rounded text-sm">
                        <div className="font-medium text-blue-900">Locataire: {property.tenant}</div>
                        <div className="text-blue-700">Bail jusqu'au {property.leaseEnd}</div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link href={`/landlord/properties/${property.id}`}>
                        <Button variant="outline" size="sm">
                          <EyeIcon className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm">
                        <EditIcon className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                      {property.status === "active" && (
                        <>
                          <Button variant="outline" size="sm">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            Visites
                          </Button>
                          <Button variant="outline" size="sm">
                            <FileTextIcon className="h-4 w-4 mr-1" />
                            Candidatures
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="active">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filterByStatus("active").map((property) => (
              <Card key={property.id} className="overflow-hidden">
                {/* Same card structure as above */}
                <div className="p-4">
                  <h3 className="font-semibold">{property.title}</h3>
                  <p className="text-muted-foreground">{property.address}</p>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rented">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filterByStatus("rented").map((property) => (
              <Card key={property.id} className="overflow-hidden">
                {/* Same card structure as above */}
                <div className="p-4">
                  <h3 className="font-semibold">{property.title}</h3>
                  <p className="text-muted-foreground">{property.address}</p>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="draft">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filterByStatus("draft").map((property) => (
              <Card key={property.id} className="overflow-hidden">
                {/* Same card structure as above */}
                <div className="p-4">
                  <h3 className="font-semibold">{property.title}</h3>
                  <p className="text-muted-foreground">{property.address}</p>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="inactive">
          <div className="text-center py-12">
            <HomeIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun bien inactif</h3>
            <p className="text-muted-foreground">Tous vos biens sont actuellement actifs ou loués.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
