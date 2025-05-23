"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HeartIcon, MapPinIcon, BedIcon, BathIcon, SquareIcon, CalendarIcon, EyeIcon } from "lucide-react"

export function PropertyList() {
  const [sortBy, setSortBy] = useState("date_desc")
  const [favorites, setFavorites] = useState<number[]>([])

  // Mock data - in real app, this would come from API
  const properties = [
    {
      id: 1,
      title: "Appartement 3 pièces - Belleville",
      description: "Charmant appartement rénové dans un quartier dynamique",
      price: 1200,
      deposit: 1200,
      charges: 150,
      surface: 65,
      rooms: 3,
      bedrooms: 2,
      bathrooms: 1,
      floor: 3,
      totalFloors: 5,
      address: "15 rue de Belleville, 75020 Paris",
      district: "Belleville",
      city: "Paris",
      postalCode: "75020",
      propertyType: "Appartement",
      rentalType: "Vide",
      availableFrom: "2025-06-01",
      energyClass: "C",
      features: ["Balcon", "Ascenseur", "Cave"],
      images: ["/placeholder.svg?height=200&width=300"],
      landlord: {
        name: "M. Martin",
        rating: 4.5,
        responseTime: "2h",
      },
      publishedAt: "2025-05-20",
      viewCount: 45,
    },
    {
      id: 2,
      title: "Studio meublé - République",
      description: "Studio moderne entièrement équipé, idéal pour étudiant ou jeune actif",
      price: 850,
      deposit: 850,
      charges: 80,
      surface: 25,
      rooms: 1,
      bedrooms: 0,
      bathrooms: 1,
      floor: 2,
      totalFloors: 6,
      address: "8 rue du Temple, 75003 Paris",
      district: "République",
      city: "Paris",
      postalCode: "75003",
      propertyType: "Studio",
      rentalType: "Meublé",
      availableFrom: "2025-05-25",
      energyClass: "D",
      features: ["Meublé", "Internet", "Lave-linge"],
      images: ["/placeholder.svg?height=200&width=300"],
      landlord: {
        name: "Mme Dubois",
        rating: 4.8,
        responseTime: "1h",
      },
      publishedAt: "2025-05-22",
      viewCount: 78,
    },
    {
      id: 3,
      title: "Maison 4 pièces avec jardin - Montreuil",
      description: "Belle maison avec jardin privatif, proche transports",
      price: 1600,
      deposit: 1600,
      charges: 200,
      surface: 90,
      rooms: 4,
      bedrooms: 3,
      bathrooms: 2,
      floor: 0,
      totalFloors: 2,
      address: "25 avenue de la République, 93100 Montreuil",
      district: "Centre-ville",
      city: "Montreuil",
      postalCode: "93100",
      propertyType: "Maison",
      rentalType: "Vide",
      availableFrom: "2025-07-01",
      energyClass: "B",
      features: ["Jardin", "Parking", "Terrasse"],
      images: ["/placeholder.svg?height=200&width=300"],
      landlord: {
        name: "M. Leroy",
        rating: 4.2,
        responseTime: "4h",
      },
      publishedAt: "2025-05-18",
      viewCount: 32,
    },
  ]

  const toggleFavorite = (propertyId: number) => {
    setFavorites((prev) => (prev.includes(propertyId) ? prev.filter((id) => id !== propertyId) : [...prev, propertyId]))
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
    <div className="space-y-6">
      {/* Results header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{properties.length} biens trouvés</h2>
          <p className="text-sm text-muted-foreground">Résultats de recherche dans Paris et environs</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Trier par:</span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Plus récent</SelectItem>
              <SelectItem value="date_asc">Plus ancien</SelectItem>
              <SelectItem value="price_asc">Prix croissant</SelectItem>
              <SelectItem value="price_desc">Prix décroissant</SelectItem>
              <SelectItem value="surface_desc">Surface décroissante</SelectItem>
              <SelectItem value="surface_asc">Surface croissante</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Property cards */}
      <div className="space-y-4">
        {properties.map((property) => (
          <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="flex flex-col lg:flex-row">
              {/* Property image */}
              <div className="lg:w-80 h-48 lg:h-auto relative">
                <img
                  src={property.images[0] || "/placeholder.svg"}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                  onClick={() => toggleFavorite(property.id)}
                >
                  <HeartIcon
                    className={`h-4 w-4 ${
                      favorites.includes(property.id) ? "fill-red-500 text-red-500" : "text-gray-600"
                    }`}
                  />
                </Button>
                <div className="absolute bottom-2 left-2 flex gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {property.propertyType}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {property.rentalType}
                  </Badge>
                </div>
              </div>

              {/* Property details */}
              <div className="flex-1 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{property.title}</h3>
                    <div className="flex items-center text-sm text-muted-foreground mb-2">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      {property.address}
                    </div>
                    <p className="text-sm text-muted-foreground">{property.description}</p>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{property.price}€</div>
                    <div className="text-sm text-muted-foreground">+ {property.charges}€ charges</div>
                    <div className="text-xs text-muted-foreground">Dépôt: {property.deposit}€</div>
                  </div>
                </div>

                {/* Property features */}
                <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <SquareIcon className="h-4 w-4" />
                    {property.surface}m²
                  </div>
                  <div className="flex items-center gap-1">
                    <BedIcon className="h-4 w-4" />
                    {property.rooms} pièces
                  </div>
                  {property.bedrooms > 0 && (
                    <div className="flex items-center gap-1">
                      <BedIcon className="h-4 w-4" />
                      {property.bedrooms} chambres
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <BathIcon className="h-4 w-4" />
                    {property.bathrooms} sdb
                  </div>
                  <div className="flex items-center gap-1">
                    <div
                      className={`w-4 h-4 rounded text-white text-xs flex items-center justify-center ${getEnergyClassColor(property.energyClass)}`}
                    >
                      {property.energyClass}
                    </div>
                    DPE
                  </div>
                </div>

                {/* Property amenities */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {property.features.slice(0, 3).map((feature) => (
                    <Badge key={feature} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                  {property.features.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{property.features.length - 3} autres
                    </Badge>
                  )}
                </div>

                {/* Property meta */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      Disponible le {new Date(property.availableFrom).toLocaleDateString("fr-FR")}
                    </div>
                    <div className="flex items-center gap-1">
                      <EyeIcon className="h-3 w-3" />
                      {property.viewCount} vues
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      Visiter
                    </Button>
                    <Button size="sm">Candidater</Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Load more */}
      <div className="text-center">
        <Button variant="outline">Charger plus de résultats</Button>
      </div>
    </div>
  )
}
