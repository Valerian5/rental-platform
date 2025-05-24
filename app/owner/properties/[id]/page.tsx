"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Trash2, Eye } from "lucide-react"
import Link from "next/link"
import { propertyService } from "@/lib/property-service"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"

export default function PropertyDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [property, setProperty] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "owner") {
          toast.error("Vous devez être connecté en tant que propriétaire")
          router.push("/login")
          return
        }
        setCurrentUser(user)

        if (params.id) {
          const propertyData = await propertyService.getPropertyById(params.id as string)

          // Vérifier que le bien appartient au propriétaire connecté
          if (propertyData.owner_id !== user.id) {
            toast.error("Vous n'avez pas accès à ce bien")
            router.push("/owner/dashboard")
            return
          }

          setProperty(propertyData)
        }
      } catch (error) {
        console.error("Erreur lors du chargement du bien:", error)
        toast.error("Erreur lors du chargement du bien")
        router.push("/owner/dashboard")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params.id, router])

  const handleDelete = async () => {
    if (!property || !confirm("Êtes-vous sûr de vouloir supprimer ce bien ?")) {
      return
    }

    try {
      await propertyService.deleteProperty(property.id)
      toast.success("Bien supprimé avec succès")
      router.push("/owner/dashboard")
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      toast.error("Erreur lors de la suppression du bien")
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Chargement...</div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Bien non trouvé</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Link href="/owner/dashboard" className="text-blue-600 hover:underline flex items-center mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Retour au tableau de bord
      </Link>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">{property.title}</h1>
          <p className="text-gray-600">
            {property.address}, {property.city}
          </p>
        </div>
        <Badge variant={property.available ? "default" : "secondary"}>
          {property.available ? "Disponible" : "Loué"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{property.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Caractéristiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Surface</p>
                  <p className="font-medium">{property.surface} m²</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pièces</p>
                  <p className="font-medium">{property.rooms}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Chambres</p>
                  <p className="font-medium">{property.bedrooms || "Non spécifié"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Salles de bain</p>
                  <p className="font-medium">{property.bathrooms || "Non spécifié"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium">
                    {property.property_type === "apartment" && "Appartement"}
                    {property.property_type === "house" && "Maison"}
                    {property.property_type === "studio" && "Studio"}
                    {property.property_type === "loft" && "Loft"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Meublé</p>
                  <p className="font-medium">{property.furnished ? "Oui" : "Non"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Code postal</p>
                  <p className="font-medium">{property.postal_code || "Non spécifié"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Prix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{property.price} €</p>
                <p className="text-gray-500">par mois</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" asChild>
                <Link href={`/properties/${property.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  Voir l'annonce publique
                </Link>
              </Button>

              <Button variant="outline" className="w-full" asChild>
                <Link href={`/owner/properties/${property.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Link>
              </Button>

              <Button variant="destructive" className="w-full" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Créé le</span>
                  <span className="text-sm">{new Date(property.created_at).toLocaleDateString("fr-FR")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Modifié le</span>
                  <span className="text-sm">{new Date(property.updated_at).toLocaleDateString("fr-FR")}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
