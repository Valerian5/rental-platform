"use client"

import { useState, useEffect } from "react"
import { Search, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import Link from "next/link"
import { toast } from "sonner"

export default function PropertiesPage() {
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    city: "",
    property_type: "all",
    min_price: 0,
    max_price: 2000,
    min_rooms: 0,
    min_bedrooms: 0,
    min_surface: 0,
    max_surface: 200,
    furnished: false,
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    loadProperties()
  }, [currentPage])

  const loadProperties = async () => {
    try {
      setLoading(true)
      const searchParams = new URLSearchParams()

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== "" && value !== undefined && value !== null && value !== "all") {
          searchParams.append(key, value.toString())
        }
      })

      searchParams.append("page", currentPage.toString())
      searchParams.append("limit", "10")

      const response = await fetch(`/api/search?${searchParams}`)
      if (response.ok) {
        const data = await response.json()
        setProperties(data.properties)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      } else {
        toast.error("Erreur lors du chargement des propriétés")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du chargement des propriétés")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    loadProperties()
  }

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
                  <Input
                    type="search"
                    placeholder="Ville, quartier..."
                    className="pl-8"
                    value={filters.city}
                    onChange={(e) => setFilters((prev) => ({ ...prev, city: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Type de bien</label>
                <Select
                  value={filters.property_type}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, property_type: value }))}
                >
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
                  <Slider
                    value={[filters.max_price]}
                    max={5000}
                    step={100}
                    onValueChange={([value]) => setFilters((prev) => ({ ...prev, max_price: value }))}
                  />
                </div>
                <div className="text-sm text-right">Jusqu'à {filters.max_price} €</div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Chambres</label>
                <Select
                  value={filters.min_bedrooms.toString()}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, min_bedrooms: Number.parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nombre de chambres" />
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

              <div>
                <label className="text-sm font-medium mb-1 block">Surface min (m²)</label>
                <div className="pt-2 pb-6">
                  <Slider
                    value={[filters.min_surface]}
                    max={200}
                    step={10}
                    onValueChange={([value]) => setFilters((prev) => ({ ...prev, min_surface: value }))}
                  />
                </div>
                <div className="text-sm text-right">À partir de {filters.min_surface} m²</div>
              </div>

              <Button className="w-full" onClick={handleSearch}>
                Appliquer les filtres
              </Button>
            </div>
          </div>
        </div>

        {/* Liste des propriétés */}
        <div className="lg:col-span-3">
          <div className="flex justify-between items-center mb-4">
            <p className="text-muted-foreground">{total} biens trouvés</p>
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

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {properties.map((property) => {
                const primaryImage =
                  property.property_images?.find((img) => img.is_primary) || property.property_images?.[0]

                return (
                  <Card key={property.id} className="overflow-hidden">
                    <Link href={`/properties/${property.id}`}>
                      <div className="aspect-video w-full overflow-hidden">
                        <img
                          src={primaryImage?.url || "/placeholder.svg?height=200&width=300"}
                          alt={property.title}
                          className="h-full w-full object-cover transition-transform hover:scale-105"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "/placeholder.svg?height=200&width=300"
                          }}
                        />
                      </div>
                    </Link>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <Link href={`/properties/${property.id}`}>
                          <CardTitle className="text-lg hover:text-blue-600 transition-colors">
                            {property.title}
                          </CardTitle>
                        </Link>
                        <Badge variant={property.available ? "default" : "secondary"}>
                          {property.available ? "Disponible" : "Loué"}
                        </Badge>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 mr-1" />
                        {property.address}, {property.city}
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
                          <p className="font-medium">{property.surface} m²</p>
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
                )
              })}
            </div>
          )}

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

          {properties.length === 0 && !loading && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Aucun bien trouvé</h3>
              <p className="text-muted-foreground mb-4">
                Essayez de modifier vos critères de recherche pour voir plus de résultats.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({
                    city: "",
                    property_type: "all",
                    min_price: 0,
                    max_price: 2000,
                    min_rooms: 0,
                    min_bedrooms: 0,
                    min_surface: 0,
                    max_surface: 200,
                    furnished: false,
                  })
                  handleSearch()
                }}
              >
                Réinitialiser les filtres
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
