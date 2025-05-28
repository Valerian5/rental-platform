import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Property {
  id: string
  title: string
  address: string
  city: string
  price: number
  surface: number
  rooms: number
  status: "active" | "rented" | "paused"
  created_at: string
  tenant_name?: string
  rental_start_date?: string
  applications_count?: number
  image?: string
}

interface HorizontalPropertyCardProps {
  property: Property
}

export default function HorizontalPropertyCard({ property }: HorizontalPropertyCardProps) {
  // Déterminer le statut et le badge correspondant
  const getStatusBadge = () => {
    switch (property.status) {
      case "active":
        return <Badge className="ml-auto bg-blue-500 hover:bg-blue-600">Annonce en cours de diffusion</Badge>
      case "rented":
        return <Badge className="ml-auto bg-blue-500 hover:bg-blue-600">Appartement en location</Badge>
      case "paused":
        return <Badge className="ml-auto bg-blue-500 hover:bg-blue-600">Annonce en pause</Badge>
      default:
        return null
    }
  }

  // Déterminer les actions en fonction du statut
  const renderActions = () => {
    switch (property.status) {
      case "active":
        return (
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href={`/properties/${property.id}`}>Voir l'annonce</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/owner/properties/${property.id}/applications`}>Voir les candidatures</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/owner/properties/${property.id}/edit`}>Modifier</Link>
            </Button>
          </div>
        )
      case "rented":
        return (
          <div className="flex gap-3 justify-end">
            <Button variant="outline" asChild>
              <Link href={`/owner/properties/${property.id}/manage`}>Gérer</Link>
            </Button>
          </div>
        )
      case "paused":
        return (
          <div className="flex gap-3 justify-end">
            <Button variant="outline" asChild>
              <Link href={`/owner/properties/${property.id}/reactivate`}>Réactiver</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/owner/properties/${property.id}/manage`}>Gérer</Link>
            </Button>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col border rounded-lg overflow-hidden bg-white">
      <div className="flex">
        {/* Image à gauche */}
        <div className="w-64 h-48 bg-gray-200">
          {property.image ? (
            <img
              src={property.image || "/placeholder.svg"}
              alt={property.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200" />
          )}
        </div>

        {/* Contenu à droite */}
        <div className="flex-1 p-4">
          <div className="flex items-start">
            <div>
              <h3 className="text-lg font-semibold">{property.title}</h3>
              <p className="text-sm text-gray-600">
                {property.address}, {property.city}
              </p>
            </div>
            {getStatusBadge()}
          </div>

          <div className="grid grid-cols-4 gap-8 mt-4">
            <div>
              <p className="text-sm text-gray-600">Loyer</p>
              <p className="font-semibold">{property.price}€</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Surface</p>
              <p className="font-semibold">{property.surface}m²</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pièces</p>
              <p className="font-semibold">{property.rooms}</p>
            </div>
            {property.status === "rented" ? (
              <div>
                <p className="text-sm text-gray-600">Mon locataire</p>
                <p className="font-semibold">{property.tenant_name}</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600">Candidatures</p>
                <p className="font-semibold">{property.applications_count || 0}</p>
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {property.status === "rented" ? (
                <>En location depuis le {new Date(property.rental_start_date || "").toLocaleDateString()}</>
              ) : (
                <>Créée le {new Date(property.created_at).toLocaleDateString()}</>
              )}
            </div>
            {renderActions()}
          </div>
        </div>
      </div>
    </div>
  )
}
