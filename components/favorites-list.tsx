"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Heart, MapPin, Euro, Home, Calendar, Eye, Trash2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import Image from "next/image"

interface FavoriteProperty {
  id: string
  user_id: string
  property_id: string
  created_at: string
  property: {
    id: string
    title: string
    address: string
    city: string
    postal_code: string
    price: number
    surface: number
    rooms: number
    bedrooms?: number
    bathrooms?: number
    property_type: string
    furnished: boolean
    available: boolean
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
  }
}

interface FavoritesListProps {
  userId: string
  onRemove?: (propertyId: string) => void
}

export function FavoritesList({ userId, onRemove }: FavoritesListProps) {
  const [favorites, setFavorites] = useState<FavoriteProperty[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (userId) {
      loadFavorites()
    }
  }, [userId])

  const loadFavorites = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch("/api/favorites")
      if (response.ok) {
        const data = await response.json()
        setFavorites(data.data || [])
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Erreur lors du chargement des favoris")
      }
    } catch (error) {
      console.error("Erreur lors du chargement des favoris:", error)
      setError("Erreur de connexion")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveFavorite = async (propertyId: string) => {
    try {
      const response = await fetch(`/api/favorites?property_id=${propertyId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setFavorites(prev => prev.filter(fav => fav.property_id !== propertyId))
        onRemove?.(propertyId)
        toast.success("Retiré des favoris")
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || "Erreur lors de la suppression")
      }
    } catch (error) {
      console.error("Erreur lors de la suppression des favoris:", error)
      toast.error("Erreur de connexion")
    }
  }

  const getPropertyTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      apartment: "Appartement",
      house: "Maison",
      studio: "Studio",
      loft: "Loft",
    }
    return types[type] || type
  }

  const getMainImage = (images: FavoriteProperty["property"]["property_images"]) => {
    const primaryImage = images.find(img => img.is_primary)
    return primaryImage?.url || images[0]?.url || "/placeholder.svg"
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <Skeleton className="w-full md:w-80 h-48" />
              <div className="flex-1 p-6 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <div className="text-red-500 mb-4">
          <Heart className="h-12 w-12 mx-auto mb-2" />
          <p className="text-lg font-semibold">Erreur de chargement</p>
          <p className="text-sm">{error}</p>
        </div>
        <Button onClick={loadFavorites} variant="outline">
          Réessayer
        </Button>
      </Card>
    )
  }

  if (favorites.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-gray-500 mb-4">
          <Heart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-semibold">Aucun favori pour le moment</p>
          <p className="text-sm">Les biens que vous ajoutez aux favoris apparaîtront ici</p>
        </div>
        <Button asChild>
          <Link href="/properties">
            Voir les annonces
          </Link>
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          Mes favoris ({favorites.length})
        </h2>
      </div>

      <div className="space-y-4">
        {favorites.map((favorite) => (
          <Card key={favorite.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="flex flex-col md:flex-row">
              {/* Image du bien */}
              <div className="w-full md:w-80 h-48 md:h-auto relative">
                <Image
                  src={getMainImage(favorite.property.property_images)}
                  alt={favorite.property.title}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = "/placeholder.svg?height=200&width=300&text=Erreur de chargement"
                  }}
                />
                <div className="absolute top-2 right-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveFavorite(favorite.property_id)}
                    className="bg-white/80 hover:bg-white text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="absolute bottom-2 left-2 flex gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {getPropertyTypeLabel(favorite.property.property_type)}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {favorite.property.furnished ? "Meublé" : "Non meublé"}
                  </Badge>
                </div>
              </div>

              {/* Détails du bien */}
              <div className="flex-1 p-6">
                <div className="flex flex-col h-full justify-between">
                  {/* En-tête */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-semibold line-clamp-2">
                        {favorite.property.title}
                      </h3>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {favorite.property.price} €
                        </div>
                        <div className="text-sm text-gray-500">par mois</div>
                      </div>
                    </div>

                    <div className="flex items-center text-gray-500 text-sm mb-3">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>
                        {favorite.property.address}, {favorite.property.city} {favorite.property.postal_code}
                      </span>
                    </div>

                    {/* Caractéristiques */}
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Home className="h-4 w-4 mr-1" />
                        <span>{favorite.property.rooms} pièces</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <div className="h-4 w-4 mr-1 flex items-center justify-center">
                          🛏️
                        </div>
                        <span>{favorite.property.bedrooms || 0} chambres</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <div className="h-4 w-4 mr-1 flex items-center justify-center">
                          🚿
                        </div>
                        <span>{favorite.property.bathrooms || 0} sdb</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <div className="h-4 w-4 mr-1 flex items-center justify-center">
                          📐
                        </div>
                        <span>{favorite.property.surface} m²</span>
                      </div>
                    </div>

                    {/* Propriétaire */}
                    <div className="text-sm text-gray-600 mb-4">
                      <span className="font-medium">Propriétaire :</span>{" "}
                      {favorite.property.owner.first_name} {favorite.property.owner.last_name}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button asChild className="flex-1">
                      <Link href={`/properties/${favorite.property_id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        Voir le bien
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleRemoveFavorite(favorite.property_id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Heart className="h-4 w-4 mr-2 fill-current" />
                      Retirer
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
