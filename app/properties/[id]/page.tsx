"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MapPin, Home, Bed, Bath, Square, Calendar, Phone, Mail, Heart } from "lucide-react"
import Link from "next/link"
import { propertyService } from "@/lib/property-service"
import { toast } from "sonner"

export default function PropertyPublicPage() {
  const router = useRouter()
  const params = useParams()
  const [property, setProperty] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    const fetchProperty = async () => {
      console.log("🌐 Chargement de l'annonce publique...")
      setIsLoading(true)
      setError(null)

      try {
        if (!params.id) {
          throw new Error("ID de propriété manquant")
        }

        console.log("📋 Récupération de la propriété publique:", params.id)
        const propertyData = await propertyService.getPublicPropertyById(params.id as string)

        setProperty(propertyData)
        console.log("✅ Propriété publique chargée:", propertyData)
      } catch (error: any) {
        console.error("❌ Erreur lors du chargement:", error)
        setError(error.message || "Erreur lors du chargement de l'annonce")
        toast.error("Erreur lors du chargement de l'annonce")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProperty()
  }, [params.id])

  const nextImage = () => {
    if (property?.property_images?.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % property.property_images.length)
    }
  }

  const prevImage = () => {
    if (property?.property_images?.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + property.property_images.length) % property.property_images.length)
    }
  }

  const handleContact = () => {
    toast.info("Fonctionnalité de contact en cours de développement")
  }

  const handleFavorite = () => {
    toast.info("Fonctionnalité favoris en cours de développement")
  }

  // États de chargement et d'erreur
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600">Chargement de l'annonce...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8">
          <div className="text-center space-y-4">
            <div className="text-red-600 text-lg font-medium">{error || "Annonce non trouvée"}</div>
            <Button onClick={() => router.push("/")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const currentImage = property.property_images?.[currentImageIndex]
  const hasImages = property.property_images && property.property_images.length > 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-blue-600 hover:underline flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour aux annonces
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleFavorite}>
                <Heart className="h-4 w-4 mr-2" />
                Favoris
              </Button>
              <Button size="sm" onClick={handleContact}>
                Contacter
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenu principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            <Card className="overflow-hidden">
              <div className="relative aspect-video bg-gray-200">
                {hasImages ? (
                  <>
                    <img
                      src={currentImage?.url || "/placeholder.svg"}
                      alt={`Photo ${currentImageIndex + 1} de ${property.title}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = `/placeholder.svg?height=400&width=600&text=Image non disponible`
                      }}
                    />
                    {property.property_images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                        >
                          ←
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                        >
                          →
                        </button>
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                          {currentImageIndex + 1} / {property.property_images.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <Home className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p>Aucune photo disponible</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Miniatures */}
              {hasImages && property.property_images.length > 1 && (
                <div className="p-4">
                  <div className="flex gap-2 overflow-x-auto">
                    {property.property_images.map((image: any, index: number) => (
                      <button
                        key={image.id}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                          index === currentImageIndex ? "border-blue-500" : "border-gray-200"
                        }`}
                      >
                        <img
                          src={image.url || "/placeholder.svg"}
                          alt={`Miniature ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = `/placeholder.svg?height=80&width=80&text=${index + 1}`
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Titre et localisation */}
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
                <div className="flex items-center text-gray-600 mb-4">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span>
                    {property.address}, {property.city} {property.postal_code}
                  </span>
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {property.price} € <span className="text-lg font-normal text-gray-500">/ mois</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={property.available ? "default" : "secondary"}>
                  {property.available ? "Disponible" : "Loué"}
                </Badge>
                <Badge variant="outline">
                  {property.property_type === "apartment" && "Appartement"}
                  {property.property_type === "house" && "Maison"}
                  {property.property_type === "studio" && "Studio"}
                  {property.property_type === "loft" && "Loft"}
                </Badge>
                {property.furnished && <Badge variant="outline">Meublé</Badge>}
              </div>
            </div>

            {/* Caractéristiques */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Home className="h-5 w-5 mr-2" />
                  Caractéristiques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="flex items-center space-x-3">
                    <Square className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Surface</p>
                      <p className="font-semibold">{property.surface} m²</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Home className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Pièces</p>
                      <p className="font-semibold">{property.rooms}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Bed className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Chambres</p>
                      <p className="font-semibold">{property.bedrooms || "Non spécifié"}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Bath className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Salles de bain</p>
                      <p className="font-semibold">{property.bathrooms || "Non spécifié"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{property.description}</p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact propriétaire */}
            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {property.owner && (
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {property.owner.first_name} {property.owner.last_name}
                      </p>
                      <p className="text-sm text-gray-500">Propriétaire</p>
                    </div>

                    {property.owner.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{property.owner.phone}</span>
                      </div>
                    )}

                    {property.owner.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{property.owner.email}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Button className="w-full" onClick={handleContact}>
                    <Phone className="h-4 w-4 mr-2" />
                    Contacter le propriétaire
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleContact}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Demander une visite
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Informations complémentaires */}
            <Card>
              <CardHeader>
                <CardTitle>Informations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Publié le</span>
                    <span className="text-sm font-medium">
                      {new Date(property.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Référence</span>
                    <span className="text-sm font-mono text-gray-500">{property.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}