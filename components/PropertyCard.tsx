import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Euro, Home, Calendar } from "lucide-react"
import Link from "next/link"

interface Property {
  id: string
  title: string
  address: string
  price: number
  type: string
  status: string
  images?: string[]
  created_at: string
}

interface PropertyCardProps {
  property: Property
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800"
      case "rented":
        return "bg-blue-100 text-blue-800"
      case "maintenance":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "available":
        return "Disponible"
      case "rented":
        return "Loué"
      case "maintenance":
        return "Maintenance"
      default:
        return status
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold line-clamp-2">{property.title}</CardTitle>
          <Badge className={getStatusColor(property.status)}>{getStatusText(property.status)}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {property.images && property.images.length > 0 && (
          <div className="aspect-video relative overflow-hidden rounded-md">
            <img
              src={property.images[0] || "/placeholder.svg"}
              alt={property.title}
              className="object-cover w-full h-full"
            />
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            <span className="line-clamp-1">{property.address}</span>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <Home className="h-4 w-4 mr-2" />
            <span>{property.type}</span>
          </div>

          <div className="flex items-center font-semibold text-lg">
            <Euro className="h-4 w-4 mr-1" />
            <span>{property.price?.toLocaleString()} €/mois</span>
          </div>

          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="h-3 w-3 mr-1" />
            <span>Ajouté le {new Date(property.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button asChild size="sm" className="flex-1">
            <Link href={`/owner/properties/${property.id}`}>Voir détails</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href={`/owner/properties/${property.id}/edit`}>Modifier</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
