"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Euro, Home, Calendar, Eye, Heart } from "lucide-react"
import { FavoriteButton } from "@/components/favorite-button"
import { Property } from "@/lib/property-service"
import Link from "next/link"
import Image from "next/image"

interface EnhancedPropertyCardProps {
  property: Property
  userId?: string
  showFavoriteButton?: boolean
  onFavoriteToggle?: (propertyId: string, isFavorite: boolean) => void
  className?: string
}

export function EnhancedPropertyCard({
  property,
  userId,
  showFavoriteButton = true,
  onFavoriteToggle,
  className = "",
}: EnhancedPropertyCardProps) {
  const [isFavorite, setIsFavorite] = useState(false)

  const getMainImage = () => {
    if (property.property_images && property.property_images.length > 0) {
      const primaryImage = property.property_images.find(img => img.is_primary)
      return primaryImage?.url || property.property_images[0]?.url
    }
    return "/placeholder.svg?height=200&width=300"
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

  const handleFavoriteToggle = (favorite: boolean) => {
    setIsFavorite(favorite)
    onFavoriteToggle?.(property.id, favorite)
  }

  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-shadow ${className}`}>
      <div className="relative">
        {/* Image du bien */}
        <div className="w-full h-48 relative">
          <Image
            src={getMainImage()}
            alt={property.title}
            fill
            className="object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = "/placeholder.svg?height=200&width=300&text=Erreur de chargement"
            }}
          />
          
          {/* Bouton favori */}
          {showFavoriteButton && (
            <div className="absolute top-2 right-2">
              <FavoriteButton
                propertyId={property.id}
                userId={userId}
                initialIsFavorite={isFavorite}
                size="sm"
                variant="ghost"
                className="bg-white/80 hover:bg-white"
                onToggle={handleFavoriteToggle}
              />
            </div>
          )}

          {/* Badges */}
          <div className="absolute bottom-2 left-2 flex gap-1">
            <Badge variant="secondary" className="text-xs">
              {getPropertyTypeLabel(property.property_type)}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {property.furnished ? "Meublé" : "Non meublé"}
            </Badge>
            {!property.available && (
              <Badge variant="destructive" className="text-xs">
                Non disponible
              </Badge>
            )}
          </div>
        </div>

        {/* Contenu de la carte */}
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Titre et prix */}
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg font-semibold line-clamp-2 flex-1">
                {property.title}
              </CardTitle>
              <div className="text-right ml-2">
                <div className="text-xl font-bold text-blue-600">
                  {property.price} €
                </div>
                <div className="text-sm text-gray-500">par mois</div>
              </div>
            </div>

            {/* Adresse */}
            <div className="flex items-center text-gray-500 text-sm">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="line-clamp-1">
                {property.address}, {property.city} {property.postal_code}
              </span>
            </div>

            {/* Caractéristiques */}
            <div className="grid grid-cols-3 gap-2 text-sm text-gray-600">
              <div className="flex items-center">
                <Home className="h-4 w-4 mr-1" />
                <span>{property.rooms} pièces</span>
              </div>
              <div className="flex items-center">
                <div className="h-4 w-4 mr-1 flex items-center justify-center">
                  🛏️
                </div>
                <span>{property.bedrooms || 0} ch.</span>
              </div>
              <div className="flex items-center">
                <div className="h-4 w-4 mr-1 flex items-center justify-center">
                  📐
                </div>
                <span>{property.surface} m²</span>
              </div>
            </div>

            {/* Propriétaire */}
            {property.owner && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Propriétaire :</span>{" "}
                {property.owner.first_name} {property.owner.last_name}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button asChild className="flex-1">
                <Link href={`/properties/${property.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  Voir le bien
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}
