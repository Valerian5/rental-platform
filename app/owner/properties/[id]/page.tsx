"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Trash2, Eye, Calendar, MapPin, Home, Bed, Bath, Square, Upload, X } from "lucide-react"
import Link from "next/link"
import { propertyService } from "@/lib/property-service"
import { authService } from "@/lib/auth-service"
import { imageService } from "@/lib/image-service"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VisitScheduler } from "@/components/visit-scheduler"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function PropertyDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [property, setProperty] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [visitSlots, setVisitSlots] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isUploadingImages, setIsUploadingImages] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      console.log("🔄 Chargement des données de la propriété...")
      setIsLoading(true)
      setError(null)

      try {
        // Vérifier l'authentification
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "owner") {
          toast({
            title: "Erreur",
            description: "Vous devez être connecté en tant que propriétaire",
            variant: "destructive",
          })
          router.push("/login")
          return
        }
        setCurrentUser(user)
        console.log("✅ Utilisateur connecté:", user.id)

        if (!params.id) {
          throw new Error("ID de propriété manquant")
        }

        // Récupérer la propriété
        console.log("📋 Récupération de la propriété:", params.id)
        const propertyData = await propertyService.getPropertyById(params.id as string)

        // Vérifier que le bien appartient au propriétaire connecté
        if (propertyData.owner_id !== user.id) {
          toast({ title: "Erreur", description: "Vous n'avez pas accès à ce bien", variant: "destructive" })
          router.push("/owner/dashboard")
          return
        }

        setProperty(propertyData)
        console.log("✅ Propriété chargée:", propertyData)

        // Récupérer les créneaux de visite
        console.log("📅 Récupération des créneaux de visite...")
        const slotsData = await propertyService.getPropertyVisitAvailabilities(params.id as string)
        setVisitSlots(slotsData)
        console.log("✅ Créneaux chargés:", slotsData.length)
      } catch (error: any) {
        console.error("❌ Erreur lors du chargement:", error)
        setError(error.message || "Erreur lors du chargement du bien")
        toast({ title: "Erreur", description: "Erreur lors du chargement du bien", variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params.id, router])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !property) return

    setIsUploadingImages(true)
    toast({ title: "Info", description: "Upload des images en cours..." })

    try {
      const uploadPromises = Array.from(files).map(async (file, index) => {
        const url = await imageService.uploadPropertyImage(file, property.id)
        return await imageService.savePropertyImageMetadata(
          property.id,
          url,
          index === 0 && (!property.property_images || property.property_images.length === 0),
        )
      })

      const newImages = await Promise.all(uploadPromises)

      // Mettre à jour la propriété avec les nouvelles images
      const updatedProperty = {
        ...property,
        property_images: [...(property.property_images || []), ...newImages],
      }
      setProperty(updatedProperty)

      toast({ title: "Succès", description: `${files.length} image(s) ajoutée(s) avec succès` })

      // Reset l'input
      e.target.value = ""
    } catch (error: any) {
      console.error("Erreur lors de l'upload:", error)
      toast({ title: "Erreur", description: "Erreur lors de l'upload des images", variant: "destructive" })
    } finally {
      setIsUploadingImages(false)
    }
  }

  const handleDeleteImage = async (imageId: string, imageUrl: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette image ?")) return

    try {
      await imageService.deletePropertyImage(imageId, imageUrl)

      // Mettre à jour la propriété
      const updatedProperty = {
        ...property,
        property_images: property.property_images.filter((img: any) => img.id !== imageId),
      }
      setProperty(updatedProperty)

      toast({ title: "Succès", description: "Image supprimée avec succès" })
    } catch (error: any) {
      console.error("Erreur lors de la suppression:", error)
      toast({ title: "Erreur", description: "Erreur lors de la suppression de l'image", variant: "destructive" })
    }
  }

  const handleDelete = async () => {
    if (!property || !confirm("Êtes-vous sûr de vouloir supprimer ce bien ?")) {
      return
    }

    try {
      await propertyService.deleteProperty(property.id)
      toast({ title: "Succès", description: "Bien supprimé avec succès" })
      router.push("/owner/dashboard")
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      toast({ title: "Erreur", description: "Erreur lors de la suppression du bien", variant: "destructive" })
    }
  }

  // Composant de gestion des visites
  const VisitManagement = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Gestion des visites</h3>
          <Badge variant="outline">{visitSlots.length} créneaux disponibles</Badge>
        </div>

        <VisitScheduler
          propertyId={property.id}
          visitSlots={visitSlots}
          onSlotsChange={setVisitSlots}
          mode="management"
        />
      </div>
    )
  }

  // États de chargement et d'erreur
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Chargement du bien...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center space-y-4">
          <div className="text-red-600 text-lg font-medium">{error || "Bien non trouvé"}</div>
          <Button onClick={() => router.push("/owner/dashboard")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {/* En-tête avec navigation */}
      <div className="mb-6">
        <Link href="/owner/dashboard" className="text-blue-600 hover:underline flex items-center mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour au tableau de bord
        </Link>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">{property.title}</h1>
            <div className="flex items-center text-gray-600">
              <MapPin className="h-4 w-4 mr-1" />
              <span>
                {property.address}, {property.city} {property.postal_code}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={property.available ? "default" : "secondary"} className="text-sm">
              {property.available ? "Disponible" : "Loué"}
            </Badge>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{property.price} €</div>
              <div className="text-sm text-gray-500">par mois</div>
            </div>
          </div>
        </div>
      </div>

      {/* Onglets principaux */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="visits">Gestion des visites</TabsTrigger>
          <TabsTrigger value="applications">Candidatures</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contenu principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Caractéristiques principales */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Home className="h-5 w-5 mr-2" />
                    Caractéristiques
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                      <Square className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Surface</p>
                        <p className="font-medium">{property.surface} m²</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Home className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Pièces</p>
                        <p className="font-medium">{property.rooms}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Bed className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Chambres</p>
                        <p className="font-medium">{property.bedrooms || "Non spécifié"}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Bath className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Salles de bain</p>
                        <p className="font-medium">{property.bathrooms || "Non spécifié"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4">
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
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{property.description}</p>
                </CardContent>
              </Card>

              {/* Photos du bien */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Photos du bien</CardTitle>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="image-upload" className="cursor-pointer">
                        <Button variant="outline" size="sm" disabled={isUploadingImages} asChild>
                          <span>
                            <Upload className="h-4 w-4 mr-2" />
                            {isUploadingImages ? "Upload..." : "Ajouter"}
                          </span>
                        </Button>
                      </Label>
                      <Input
                        id="image-upload"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {property.property_images && property.property_images.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {property.property_images.map((image: any, index: number) => (
                        <div
                          key={image.id}
                          className="relative group aspect-video rounded-lg overflow-hidden bg-gray-100"
                        >
                          <img
                            src={image.url || "/placeholder.svg"}
                            alt={`Photo ${index + 1} du bien`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = `/placeholder.svg?height=200&width=300&text=Erreur de chargement`
                            }}
                          />
                          {image.is_primary && (
                            <Badge className="absolute top-2 left-2 text-xs">Photo principale</Badge>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteImage(image.id, image.url)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                      <div className="space-y-3">
                        <div className="w-16 h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
                          <Home className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-lg font-medium">Aucune photo ajoutée</p>
                        <p className="text-sm">Ajoutez des photos pour rendre votre annonce plus attractive</p>
                        <Label htmlFor="image-upload-empty" className="cursor-pointer">
                          <Button variant="outline" className="mt-4" asChild>
                            <span>
                              <Upload className="h-4 w-4 mr-2" />
                              Ajouter des photos
                            </span>
                          </Button>
                        </Label>
                        <Input
                          id="image-upload-empty"
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Actions rapides */}
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
                      Modifier le bien
                    </Link>
                  </Button>

                  <Button variant="destructive" className="w-full" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer le bien
                  </Button>
                </CardContent>
              </Card>

              {/* Statistiques des visites */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Visites
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Créneaux disponibles</span>
                      <Badge variant="outline">{visitSlots.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Réservations</span>
                      <Badge variant="outline">
                        {visitSlots.reduce((sum, slot) => sum + (slot.current_bookings || 0), 0)}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => {
                        const visitsTab = document.querySelector('[value="visits"]') as HTMLElement
                        visitsTab?.click()
                      }}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Gérer les visites
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Informations générales */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Créé le</span>
                      <span className="text-sm font-medium">
                        {new Date(property.created_at).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Modifié le</span>
                      <span className="text-sm font-medium">
                        {new Date(property.updated_at).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">ID du bien</span>
                      <span className="text-sm font-mono text-gray-500">{property.id}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="visits">
          <VisitManagement />
        </TabsContent>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>Candidatures reçues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <p>Aucune candidature pour le moment</p>
                <p className="text-sm mt-2">
                  Les candidatures apparaîtront ici une fois que des locataires auront postulé
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents du bien</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <p>Fonctionnalité en cours de développement</p>
                <p className="text-sm mt-2">Vous pourrez bientôt gérer les documents liés à ce bien</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
