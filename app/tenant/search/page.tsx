"use client"

import { useState, useEffect } from "react"
import { Search, MapPin, Heart, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import Link from "next/link"
import { toast } from "sonner"

interface Property {
  id: string
  title: string
  address: string
  city: string
  price: number
  surface: number
  rooms: number
  bedrooms: number
  bathrooms: number
  property_type: string
  furnished: boolean
  available: boolean
  property_images: Array<{ id: string; url: string; is_primary: boolean }>
}

interface SearchFilters {
  city: string
  property_type: string
  min_price: number
  max_price: number
  min_rooms: number
  min_bedrooms: number
  min_surface: number
  max_surface: number
  furnished?: boolean
}

export default function TenantSearchPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [filters, setFilters] = useState<SearchFilters>({
    city: "",
    property_type: "",
    min_price: 0,
    max_price: 3000,
    min_rooms: 1,
    min_bedrooms: 0,
    min_surface: 0,
    max_surface: 200,
  })

  useEffect(() => {
    searchProperties()
  }, [currentPage])

  useEffect(() => {
    loadUserFavorites()
  }, [])

  const searchProperties = async () => {
    try {
      setLoading(true)
      const searchParams = new URLSearchParams()

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== "" && value !== undefined && value !== null) {
          searchParams.append(key, value.toString())
        }
      })

      searchParams.append("page", currentPage.toString())
      searchParams.append("limit", "12")

      const response = await fetch(`/api/search?${searchParams}`)
      if (response.ok) {
        const data = await response.json()
        setProperties(data.properties)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      }
    } catch (error) {
      console.error("Erreur recherche:", error)
      toast.error("Erreur lors de la recherche")
    } finally {
      setLoading(false)
    }
  }

  const loadUserFavorites = async () => {
    try {
      // Récupérer l'utilisateur connecté depuis le localStorage ou context
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      if (!user.id) return

      const response = await fetch(`/api/favorites?user_id=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        const favoriteIds = new Set(data.favorites.map((f: any) => f.property_id))
        setFavorites(favoriteIds)
      }
    } catch (error) {
      console.error("Erreur chargement favoris:", error)
    }
  }

  const toggleFavorite = async (propertyId: string) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      if (!user.id) {
        toast.error("Vous devez être connecté pour ajouter des favoris")
        return
      }

      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          property_id: propertyId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const newFavorites = new Set(favorites)

        if (data.isFavorite) {
          newFavorites.add(propertyId)
          toast.success("Ajouté aux favoris")
        } else {
          newFavorites.delete(propertyId)
          toast.success("Retiré des favoris")
        }

        setFavorites(newFavorites)
      }
    } catch (error) {
      console.error("Erreur toggle favori:", error)
      toast.error("Erreur lors de la modification des favoris")
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    searchProperties()
  }

  const resetFilters = () => {
    setFilters({
      city: "",
      property_type: "",
      min_price: 0,
      max_price: 3000,
      min_rooms: 1,
      min_bedrooms: 0,
      min_surface: 0,
      max_surface: 200,
    })
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Rechercher un logement</h1>
          <p className="text-muted-foreground">{total > 0 ? `${total} bien(s) trouvé(s)` : "Aucun bien trouvé"}</p>
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filtres
        </Button>
      </div>

      {/* Barre de recherche rapide */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Ville, quartier..."
                  className="pl-8"
                  value={filters.city}
                  onChange={(e) => setFilters((prev) => ({ ...prev, city: e.target.value }))}
                />
              </div>
            </div>
            <Select
              value={filters.property_type}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, property_type: value }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type de bien" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les types</SelectItem>
                <SelectItem value="apartment">Appartement</SelectItem>
                <SelectItem value="house">Maison</SelectItem>
                <SelectItem value="studio">Studio</SelectItem>
                <SelectItem value="loft">Loft</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? "Recherche..." : "Rechercher"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filtres avancés */}
      <Collapsible open={showFilters} onOpenChange={setShowFilters}>
        <CollapsibleContent>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filtres avancés</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Budget (€/mois)</Label>
                  <div className="px-2">
                    <Slider
                      value={[filters.min_price, filters.max_price]}
                      onValueChange={([min, max]) =>
                        setFilters((prev) => ({ ...prev, min_price: min, max_price: max }))
                      }
                      max={5000}
                      step={50}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>{filters.min_price}€</span>
                      <span>{filters.max_price}€</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Surface (m²)</Label>
                  <div className="px-2">
                    <Slider
                      value={[filters.min_surface, filters.max_surface]}
                      onValueChange={([min, max]) =>
                        setFilters((prev) => ({ ...prev, min_surface: min, max_surface: max }))
                      }
                      max={300}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>{filters.min_surface}m²</span>
                      <span>{filters.max_surface}m²</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Nombre de pièces minimum</Label>
                  <Select
                    value={filters.min_rooms.toString()}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, min_rooms: Number(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1+</SelectItem>
                      <SelectItem value="2">2+</SelectItem>
                      <SelectItem value="3">3+</SelectItem>
                      <SelectItem value="4">4+</SelectItem>
                      <SelectItem value="5">5+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Chambres minimum</Label>
                  <Select
                    value={filters.min_bedrooms.toString()}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, min_bedrooms: Number(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Peu importe</SelectItem>
                      <SelectItem value="1">1+</SelectItem>
                      <SelectItem value="2">2+</SelectItem>
                      <SelectItem value="3">3+</SelectItem>
                      <SelectItem value="4">4+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={filters.furnished === true}
                  onCheckedChange={(checked) =>
                    setFilters((prev) => ({ ...prev, furnished: checked ? true : undefined }))
                  }
                />
                <Label>Meublé uniquement</Label>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSearch} disabled={loading}>
                  Appliquer les filtres
                </Button>
                <Button variant="outline" onClick={resetFilters}>
                  Réinitialiser
                </Button>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Résultats */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-video bg-muted animate-pulse" />
              <CardContent className="p-4 space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded" />
                <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
                <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => {
              const primaryImage =
                property.property_images?.find((img) => img.is_primary) || property.property_images?.[0]
              const isFavorite = favorites.has(property.id)

              return (
                <Card key={property.id} className="overflow-hidden group">
                  <div className="relative aspect-video overflow-hidden">
                    <Link href={`/properties/${property.id}`}>
                      <img
                        src={primaryImage?.url || "/placeholder.svg?height=200&width=300"}
                        alt={property.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`absolute top-2 right-2 h-8 w-8 rounded-full ${
                        isFavorite
                          ? "bg-red-500 text-white hover:bg-red-600"
                          : "bg-white/80 text-gray-600 hover:bg-white"
                      }`}
                      onClick={() => toggleFavorite(property.id)}
                    >
                      <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
                    </Button>
                    <Badge className="absolute bottom-2 left-2">
                      {property.property_type === "apartment" && "Appartement"}
                      {property.property_type === "house" && "Maison"}
                      {property.property_type === "studio" && "Studio"}
                      {property.property_type === "loft" && "Loft"}
                    </Badge>
                  </div>

                  <CardHeader className="pb-2">
                    <Link href={`/properties/${property.id}`}>
                      <CardTitle className="text-lg hover:text-blue-600 transition-colors line-clamp-2">
                        {property.title}
                      </CardTitle>
                    </Link>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 mr-1" />
                      {property.address}, {property.city}
                    </div>
                  </CardHeader>

                  <CardContent className="pb-2">
                    <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                      <div>
                        <p className="text-muted-foreground">Pièces</p>
                        <p className="font-medium">{property.rooms}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Chambres</p>
                        <p className="font-medium">{property.bedrooms}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Surface</p>
                        <p className="font-medium">{property.surface} m²</p>
                      </div>
                    </div>

                    {property.furnished && (
                      <Badge variant="secondary" className="text-xs">
                        Meublé
                      </Badge>
                    )}
                  </CardContent>

                  <CardFooter className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-lg">{property.price} €/mois</p>
                    </div>
                    <Button asChild>
                      <Link href={`/properties/${property.id}`}>Voir détails</Link>
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                >
                  &lt;
                </Button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="icon"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  )
                })}

                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  &gt;
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {properties.length === 0 && !loading && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Aucun bien trouvé</h3>
          <p className="text-muted-foreground mb-4">
            Essayez de modifier vos critères de recherche pour voir plus de résultats.
          </p>
          <Button variant="outline" onClick={resetFilters}>
            Réinitialiser les filtres
          </Button>
        </div>
      )}
    </div>
  )
}
