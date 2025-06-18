"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, ArrowRight, Upload, Edit } from "lucide-react"
import Link from "next/link"
import { propertyService } from "@/lib/property-service"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"

export default function PropertySuccessPage() {
  const router = useRouter()
  const params = useParams()
  const [property, setProperty] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "owner") {
          router.push("/login")
          return
        }

        if (params.id) {
          const propertyData = await propertyService.getPropertyById(params.id as string)
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

    fetchProperty()
  }, [params.id, router])

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
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-green-800 mb-2">Félicitations !</h1>
        <p className="text-gray-600">Votre annonce a été créée avec succès</p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Récapitulatif de votre annonce</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{property.title}</h3>
                <p className="text-gray-600">
                  {property.hide_exact_address ? property.city : `${property.address}, ${property.city}`}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Loyer hors charges</p>
                  <p className="font-medium">{property.price || 0} €/mois</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Charges</p>
                  <p className="font-medium">{property.charges_amount || 0} €/mois</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Surface</p>
                  <p className="font-medium">{property.surface} m²</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pièces</p>
                  <p className="font-medium">{property.rooms}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Type de bien</p>
                <Badge variant="outline">
                  {property.property_type === "apartment" && "Appartement"}
                  {property.property_type === "house" && "Maison"}
                  {property.property_type === "studio" && "Studio"}
                  {property.property_type === "loft" && "Loft"}
                </Badge>
              </div>

              <div>
                <p className="text-sm text-gray-500">Type de location</p>
                <Badge variant="outline">{property.furnished ? "Meublé" : "Non meublé"}</Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Statut</p>
                <Badge variant="default">En diffusion</Badge>
                <p className="text-xs text-gray-500 mt-1">Votre annonce est maintenant visible par les locataires.</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Prochaines étapes</p>
                <ul className="text-sm space-y-1 mt-2">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Informations de base ajoutées
                  </li>
                  <li className="flex items-center">
                    {property.property_images && property.property_images.length > 0 ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <div className="h-4 w-4 border-2 border-gray-300 rounded-full mr-2"></div>
                    )}
                    Ajouter des photos{" "}
                    {property.property_images && property.property_images.length > 0
                      ? `(${property.property_images.length} ajoutées)`
                      : ""}
                  </li>
                  <li className="flex items-center text-gray-500">
                    <div className="h-4 w-4 border-2 border-gray-300 rounded-full mr-2"></div>
                    Ajouter les documents obligatoires
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Annonce publiée
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardContent className="p-6 text-center">
            <Upload className="h-8 w-8 mx-auto mb-3 text-blue-600" />
            <h3 className="font-semibold mb-2">Ajouter des photos</h3>
            <p className="text-sm text-gray-600 mb-4">
              {property.property_images && property.property_images.length > 0
                ? `${property.property_images.length} photo(s) ajoutée(s)`
                : "Ajoutez des photos pour rendre votre annonce plus attractive"}
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/owner/properties/${property.id}?tab=overview`}>
                {property.property_images && property.property_images.length > 0
                  ? "Gérer les photos"
                  : "Ajouter des photos"}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Edit className="h-8 w-8 mx-auto mb-3 text-purple-600" />
            <h3 className="font-semibold mb-2">Ajouter des documents</h3>
            <p className="text-sm text-gray-600 mb-4">Ajoutez les documents obligatoires</p>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/owner/properties/${property.id}?tab=documents`}>Ajouter des documents</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button variant="outline" asChild>
          <Link href="/owner/dashboard">Retour au tableau de bord</Link>
        </Button>
        <Button asChild>
          <Link href={`/owner/properties/${property.id}`}>
            Voir le détail du bien
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
