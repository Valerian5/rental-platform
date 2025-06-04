"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Users, Settings, MapPin, Home, Bed, Bath, Square, Calendar } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface HorizontalPropertyCardProps {
  property: any
}

export default function HorizontalPropertyCard({ property }: HorizontalPropertyCardProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Trouver l'image principale
  const mainImage =
    property.property_images?.find((img: any) => img.is_primary)?.url ||
    property.property_images?.[0]?.url ||
    `/placeholder.svg?height=200&width=300&text=Pas d'image disponible`

  // Formater le statut pour l'affichage
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "active":
        return { label: "En diffusion", color: "bg-green-100 text-green-800" }
      case "rented":
        return { label: "En location", color: "bg-blue-100 text-blue-800" }
      case "paused":
        return { label: "En pause", color: "bg-orange-100 text-orange-800" }
      default:
        return { label: "Brouillon", color: "bg-gray-100 text-gray-800" }
    }
  }

  const statusInfo = getStatusInfo(property.status)

  const handleViewApplications = () => {
    // Rediriger vers les candidatures avec un filtre pour ce bien
    router.push(`/owner/applications?propertyId=${property.id}`)
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Image du bien */}
        <div className="w-full md:w-1/4 h-48 md:h-auto relative">
          <img
            src={mainImage || "/placeholder.svg"}
            alt={property.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = `/placeholder.svg?height=200&width=300&text=Erreur de chargement`
            }}
          />
          <Badge className={`absolute top-2 right-2 ${statusInfo.color}`}>{statusInfo.label}</Badge>
        </div>

        {/* Contenu */}
        <div className="flex-1 p-4">
          <div className="flex flex-col h-full justify-between">
            {/* En-tête */}
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{property.title}</h3>
                <span className="font-bold text-blue-600">{property.price} €</span>
              </div>
              <div className="flex items-center text-gray-500 text-sm mt-1">
                <MapPin className="h-3.5 w-3.5 mr-1" />
                <span>
                  {property.address}, {property.city} {property.postal_code}
                </span>
              </div>
            </div>

            {/* Caractéristiques */}
            <div className="grid grid-cols-4 gap-2 my-3">
              <div className="flex items-center text-sm text-gray-600">
                <Home className="h-3.5 w-3.5 mr-1" />
                <span>{property.property_type}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Square className="h-3.5 w-3.5 mr-1" />
                <span>{property.surface} m²</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Bed className="h-3.5 w-3.5 mr-1" />
                <span>{property.bedrooms || property.rooms} pièce(s)</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Bath className="h-3.5 w-3.5 mr-1" />
                <span>{property.bathrooms || "N/A"} SDB</span>
              </div>
            </div>

            {/* Informations supplémentaires selon le statut */}
            {property.status === "rented" && (
              <div className="bg-blue-50 p-2 rounded-md text-sm mb-3">
                <div className="font-medium">Loué à {property.tenant_name}</div>
                <div className="text-gray-600">
                  Depuis le {new Date(property.rental_start_date).toLocaleDateString("fr-FR")}
                </div>
              </div>
            )}

            {property.status === "active" && property.applications_count > 0 && (
              <div className="bg-green-50 p-2 rounded-md text-sm mb-3">
                <div className="font-medium">{property.applications_count} candidature(s) reçue(s)</div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 mt-auto">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/properties/${property.id}`}>
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  Voir l'annonce
                </Link>
              </Button>

              {property.status === "active" && (
                <Button variant="outline" size="sm" onClick={handleViewApplications}>
                  <Users className="h-3.5 w-3.5 mr-1" />
                  Voir les candidatures
                </Button>
              )}

              <Button variant="outline" size="sm" asChild>
                <Link href={`/owner/properties/${property.id}`}>
                  <Settings className="h-3.5 w-3.5 mr-1" />
                  Gérer
                </Link>
              </Button>

              {property.status === "active" && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/owner/properties/${property.id}?tab=visits`}>
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    Créneaux de visite
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
