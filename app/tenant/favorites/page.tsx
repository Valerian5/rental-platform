"use client"

import { useState, useEffect } from "react"
import { Heart, MapPin, Square, Bed, Eye, Trash2, Share, Filter, Grid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { toast } from "sonner"

interface FavoriteProperty {
  id: string
  title: string
  address: string
  city: string
  postal_code: string
  price: number
  charges?: number
  surface: number
  rooms: number
  bedrooms?: number
  bathrooms?: number
  property_type: string
  furnished: boolean
  available: boolean
  available_from?: string
  property_images: Array<{
    id: string
    url: string
    is_primary: boolean
  }>
  owner: {
    first_name: string
    last_name: string
    phone?: string
  }
  favorited_at: string
  viewed_recently?: boolean
}

export default function TenantFavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteProperty[]>([])
  const [filteredFavorites, setFilteredFavorites] = useState<FavoriteProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedFavorites, setSelectedFavorites] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState("date_added")
  const [filterType, setFilterType] = useState("all")

  // Données simulées réalistes
  useEffect(() => {
    setTimeout(() => {
      setFavorites([
        {
          id: "1",
          title: "Charmant 2 pièces avec balcon - Quartier Marais",
          address: "15 Rue des Rosiers",
          city: "Paris 4e",
          postal_code: "75004",
          price: 1450,
          charges: 150,
          surface: 45,
          rooms: 2,
          bedrooms: 1,
          bathrooms: 1,
          property_type: "apartment",
          furnished: false,
          available: true,
          available_from: "2024-02-15",
          property_images: [
            {
              id: "1",
              url: "/placeholder.svg?height=200&width=300&text=Marais",
              is_primary: true,
            },
          ],
          owner: {
            first_name: "Marie",
            last_name: "Dubois",
            phone: "06 12 34 56 78",
          },
          favorited_at: "2024-01-18T14:30:00Z",
          viewed_recently: true,
        },
        {
          id: "2",
          title: "Studio lumineux proche Sorbonne",
          address: "8 Rue Saint-Jacques",
          city: "Paris 5e",
          postal_code: "75005",
          price: 950,
          charges: 80,
          surface: 28,
          rooms: 1,
          bedrooms: 0,
          bathrooms: 1,
          property_type: "studio",
          furnished: true,
          available: true,
          property_images: [
            {
              id: "2",
              url: "/placeholder.svg?height=200&width=300&text=Studio",
              is_primary: true,
            },
          ],
          owner: {
            first_name: "Jean",
            last_name: "Martin",
          },
          favorited_at: "2024-01-16T10:15:00Z",
        },
        {
          id: "3",
          title: "Appartement familial avec vue sur parc",
          address: "22 Avenue de la République",
          city: "Paris 11e",
          postal_code: "75011",
          price: 1850,
          charges: 200,
          surface: 75,
          rooms: 3,
          bedrooms: 2,
          bathrooms: 1,
          property_type: "apartment",
          furnished: false,
          available: false,
          property_images: [
            {
              id: "3",
              url: "/placeholder.svg?height=200&width=300&text=Familial",
              is_primary: true,
            },
          ],
          owner: {
            first_name: "Sophie",
            last_name: "Laurent",
            phone: "06 98 76 54 32",
          },
          favorited_at: "2024-01-12T16:45:00Z",
        },
        {
          id: "4",
          title: "Loft atypique - Ancienne usine rénovée",
          address: "45 Rue de la Roquette",
          city: "Paris 11e",
          postal_code: "75011",
          price: 2200,
          surface: 90,
          rooms: 3,
          bedrooms: 2,
          bathrooms: 2,
          property_type: "loft",
          furnished: true,
          available: true,
          available_from: "2024-03-01",
          property_images: [
            {
              id: "4",
              url: "/placeholder.svg?height=200&width=300&text=Loft",
              is_primary: true,
            },
          ],
          owner: {
            first_name: "Thomas",
            last_name: "Moreau",
          },
          favorited_at: "2024-01-10T09:20:00Z",
        },
      ])
      setLoading(false)
    }, 1000)
  }, [])

  // Filtrage et tri
  useEffect(() => {
    let filtered = [...favorites]

    // Filtrer par type
    if (filterType !== "all") {
      if (filterType === "available") {
        filtered = filtered.filter((f) => f.available)
      } else if (filterType === "unavailable") {
        filtered = filtered.filter((f) => !f.available)
      } else {
        filtered = filtered.filter((f) => f.property_type === filterType)
      }
    }

    // Trier
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date_added":
          return new Date(b.favorited_at).getTime() - new Date(a.favorited_at).getTime()
        case "price_asc":
          return a.price - b.price
        case "price_desc":
          return b.price - a.price
        case "surface_desc":
          return b.surface - a.surface
        default:
          return 0
      }
    })

    setFilteredFavorites(filtered)
  }, [favorites, filterType, sortBy])

  const removeFavorite = (id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id))
    setSelectedFavorites((prev) => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
    toast.success("Retiré des favoris")
  }

  const removeSelectedFavorites = () => {
    setFavorites((prev) => prev.filter((f) => !selectedFavorites.has(f.id)))
    setSelectedFavorites(new Set())
    toast.success(`${selectedFavorites.size} bien(s) retiré(s) des favoris`)
  }

  const toggleSelectFavorite = (id: string) => {
    setSelectedFavorites((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const shareProperty = (property: FavoriteProperty) => {
    const url = `${window.location.origin}/properties/${property.id}`
    navigator.clipboard.writeText(url)
    toast.success("Lien copié dans le presse-papier")
  }

  const getPropertyTypeLabel = (type: string) => {
    switch (type) {
      case "apartment":
        return "Appartement"
      case "house":
        return "Maison"
      case "studio":
        return "Studio"
      case "loft":
        return "Loft"
      default:
        return type
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Chargement de vos favoris...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mes favoris</h1>
          <p className="text-muted-foreground">
            {favorites.length} bien{favorites.length > 1 ? "s" : ""} sauvegardé{favorites.length > 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedFavorites.size > 0 && (
            <Button variant="destructive" size="sm" onClick={removeSelectedFavorites}>
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer ({selectedFavorites.size})
            </Button>
          )}

          <Button variant="outline" size="icon" onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}>
            {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Filtres et tri */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="available">Disponibles</SelectItem>
              <SelectItem value="unavailable">Non disponibles</SelectItem>
              <SelectItem value="apartment">Appartements</SelectItem>
              <SelectItem value="house">Maisons</SelectItem>
              <SelectItem value="studio">Studios</SelectItem>
              <SelectItem value="loft">Lofts</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_added">Plus récemment ajouté</SelectItem>
            <SelectItem value="price_asc">Prix croissant</SelectItem>
            <SelectItem value="price_desc">Prix décroissant</SelectItem>
            <SelectItem value="surface_desc">Surface décroissante</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredFavorites.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">{favorites.length === 0 ? "Aucun favori" : "Aucun résultat"}</h3>
          <p className="text-muted-foreground mb-4">
            {favorites.length === 0
              ? "Ajoutez des biens à vos favoris pour les retrouver facilement"
              : "Aucun bien ne correspond aux filtres sélectionnés"}
          </p>
          {favorites.length === 0 && (
            <Button asChild>
              <Link href="/tenant/search">Découvrir des biens</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {filteredFavorites.map((property) => {
            const primaryImage = property.property_images.find((img) => img.is_primary) || property.property_images[0]
            const isSelected = selectedFavorites.has(property.id)

            return (
              <Card
                key={property.id}
                className={`overflow-hidden ${isSelected ? "ring-2 ring-blue-500" : ""} ${viewMode === "list" ? "flex" : ""}`}
              >
                <div className={viewMode === "list" ? "w-1/3" : "w-full"}>
                  <div className="relative aspect-video overflow-hidden">
                    <Link href={`/properties/${property.id}`}>
                      <img
                        src={primaryImage?.url || "/placeholder.svg?height=200&width=300"}
                        alt={property.title}
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                      />
                    </Link>

                    {/* Badges en overlay */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <Badge variant={property.available ? "default" : "secondary"}>
                        {property.available ? "Disponible" : "Loué"}
                      </Badge>
                      {property.viewed_recently && (
                        <Badge variant="outline" className="bg-white/90">
                          <Eye className="h-3 w-3 mr-1" />
                          Vu récemment
                        </Badge>
                      )}
                    </div>

                    {/* Actions en overlay */}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 bg-white/90 hover:bg-white"
                        onClick={() => toggleSelectFavorite(property.id)}
                      >
                        <Checkbox checked={isSelected} onChange={() => {}} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 bg-white/90 hover:bg-white"
                        onClick={() => shareProperty(property)}
                      >
                        <Share className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 bg-white/90 hover:bg-white text-red-600 hover:text-red-700"
                        onClick={() => removeFavorite(property.id)}
                      >
                        <Heart className="h-4 w-4 fill-current" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className={viewMode === "list" ? "flex-1" : ""}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <Link href={`/properties/${property.id}`}>
                        <h3 className="font-semibold hover:text-blue-600 transition-colors line-clamp-2">
                          {property.title}
                        </h3>
                      </Link>

                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 mr-1" />
                        {property.address}, {property.city}
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center">
                          <Square className="h-3.5 w-3.5 mr-1" />
                          {property.surface} m²
                        </div>
                        <div className="flex items-center">
                          <Bed className="h-3.5 w-3.5 mr-1" />
                          {property.rooms} pièce{property.rooms > 1 ? "s" : ""}
                        </div>
                        {property.bedrooms && (
                          <div className="flex items-center">
                            <Bed className="h-3.5 w-3.5 mr-1" />
                            {property.bedrooms} ch.
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{getPropertyTypeLabel(property.property_type)}</Badge>
                        {property.furnished && <Badge variant="secondary">Meublé</Badge>}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Ajouté le {new Date(property.favorited_at).toLocaleDateString("fr-FR")}
                        {property.available_from && (
                          <span>
                            {" "}
                            • Disponible à partir du {new Date(property.available_from).toLocaleDateString("fr-FR")}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="flex justify-between items-center p-4 pt-0">
                    <div>
                      <div className="font-bold text-lg">{property.price} €/mois</div>
                      {property.charges && (
                        <div className="text-sm text-muted-foreground">+ {property.charges} € de charges</div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/properties/${property.id}`}>Voir détails</Link>
                      </Button>
                      {property.available && (
                        <Button size="sm" asChild>
                          <Link href={`/properties/${property.id}/apply`}>Postuler</Link>
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
