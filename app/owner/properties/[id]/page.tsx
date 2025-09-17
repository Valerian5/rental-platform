"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  Calendar,
  MapPin,
  Home,
  Bed,
  Bath,
  Square,
  Upload,
  X,
  Pause,
  Play,
} from "lucide-react"
import Link from "next/link"
import { propertyService } from "@/lib/property-service"
import { authService } from "@/lib/auth-service"
import { imageService } from "@/lib/image-service"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VisitScheduler } from "@/components/visit-scheduler"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { PropertyDocumentsManager } from "@/components/property-documents-manager"
import { ApplicationsList } from "@/components/applications-list"

export default function PropertyDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") || "overview"

  const [property, setProperty] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [visitSlots, setVisitSlots] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [activeTab, setActiveTab] = useState(initialTab)
  const [slotsLoaded, setSlotsLoaded] = useState(false)

  // Gestionnaire de changement de créneaux - MÉMORISÉ et STABLE
  const handleSlotsChange = useCallback((newSlots: any[]) => {
    console.log("🔄 Mise à jour des créneaux:", newSlots.length)
    setVisitSlots(newSlots)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      console.log("🔄 Chargement des données de la propriété...")
      setIsLoading(true)
      setError(null)

      try {
        // Vérifier l'authentification
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "owner") {
          toast("Vous devez être connecté en tant que propriétaire", {
            description: "Erreur",
            type: "error",
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
          toast("Vous n'avez pas accès à ce bien", {
            description: "Erreur",
            type: "error",
          })
          router.push("/owner/dashboard")
          return
        }

        setProperty(propertyData)
        console.log("✅ Propriété chargée:", propertyData)

        // Marquer comme chargé
        setSlotsLoaded(true)
      } catch (error: any) {
        console.error("❌ Erreur lors du chargement:", error)
        setError(error.message || "Erreur lors du chargement du bien")
        toast("Erreur lors du chargement du bien", {
          description: "Erreur",
          type: "error",
        })
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
    toast("Upload des images en cours...", {
      description: "Info",
    })

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

      toast(`${files.length} image(s) ajoutée(s) avec succès`, {
        description: "Succès",
      })

      // Reset l'input
      e.target.value = ""
    } catch (error: any) {
      console.error("Erreur lors de l'upload:", error)
      toast("Erreur lors de l'upload des images", {
        description: "Erreur",
        type: "error",
      })
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

      toast("Image supprimée avec succès", {
        description: "Succès",
      })
    } catch (error: any) {
      console.error("Erreur lors de la suppression:", error)
      toast("Erreur lors de la suppression de l'image", {
        description: "Erreur",
        type: "error",
      })
    }
  }

  const handleDelete = async () => {
    if (!property || !confirm("Êtes-vous sûr de vouloir supprimer ce bien ?")) {
      return
    }

    try {
      await propertyService.deleteProperty(property.id)
      toast("Bien supprimé avec succès", {
        description: "Succès",
      })
      router.push("/owner/dashboard")
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      toast("Erreur lors de la suppression du bien", {
        description: "Erreur",
        type: "error",
      })
    }
  }

  // Composant de gestion des visites - SIMPLIFIÉ
  const VisitManagement = () => {
    if (!slotsLoaded) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Chargement des créneaux...</p>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Gestion des visites</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{visitSlots.length} créneaux disponibles</Badge>
          </div>
        </div>

        <VisitScheduler
          propertyId={property.id}
          visitSlots={visitSlots}
          onSlotsChange={handleSlotsChange}
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
        <Link href="/owner/properties" className="text-blue-600 hover:underline flex items-center mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour à mes annonces
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
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
                <CardContent className="space-y-6">
                  {/* Caractéristiques de base */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Caractéristiques de base</h4>
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
                  </div>

                  {/* Caractéristiques détaillées */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Caractéristiques détaillées</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Type de bien</p>
                        <p className="font-medium">
                          {property.property_type === "apartment" && "Appartement"}
                          {property.property_type === "house" && "Maison"}
                          {property.property_type === "studio" && "Studio"}
                          {property.property_type === "loft" && "Loft"}
                          {property.property_type === "duplex" && "Duplex"}
                          {property.property_type === "townhouse" && "Maison de ville"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Étage</p>
                        <p className="font-medium">{property.floor || "Non spécifié"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Nombre d'étages</p>
                        <p className="font-medium">{property.total_floors || "Non spécifié"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Année de construction</p>
                        <p className="font-medium">{property.construction_year || "Non spécifié"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Exposition</p>
                        <p className="font-medium">
                          {property.orientation === "north" && "Nord"}
                          {property.orientation === "south" && "Sud"}
                          {property.orientation === "east" && "Est"}
                          {property.orientation === "west" && "Ouest"}
                          {property.orientation === "northeast" && "Nord-Est"}
                          {property.orientation === "northwest" && "Nord-Ouest"}
                          {property.orientation === "southeast" && "Sud-Est"}
                          {property.orientation === "southwest" && "Sud-Ouest"}
                          {!property.orientation && "Non spécifié"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Meublé</p>
                        <p className="font-medium">{property.furnished ? "Oui" : "Non"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Sanitaires */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Sanitaires</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Nombre de WC</p>
                        <p className="font-medium">{property.wc_count || "Non spécifié"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">WC séparé</p>
                        <p className="font-medium">{property.wc_separate ? "Oui" : "Non"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Accessible fauteuils roulants</p>
                        <p className="font-medium">{property.wheelchair_accessible ? "Oui" : "Non"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Énergie et chauffage */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Énergie et chauffage</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Classe énergétique</p>
                        <p className="font-medium">{property.energy_class || "Non spécifié"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Classe GES</p>
                        <p className="font-medium">{property.ges_class || "Non spécifié"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Production eau chaude</p>
                        <p className="font-medium">
                          {property.hot_water_production === "individual_electric" && "Individuel - Électrique"}
                          {property.hot_water_production === "individual_oil" && "Individuel - Fioul"}
                          {property.hot_water_production === "individual_gas" && "Individuel - Gaz"}
                          {property.hot_water_production === "individual_solar" && "Individuel - Solaire"}
                          {property.hot_water_production === "individual_other" && "Individuel - Autre"}
                          {property.hot_water_production === "collective_electric" && "Collectif - Électrique"}
                          {property.hot_water_production === "collective_oil" && "Collectif - Fioul"}
                          {property.hot_water_production === "collective_gas" && "Collectif - Gaz"}
                          {property.hot_water_production === "collective_solar" && "Collectif - Solaire"}
                          {property.hot_water_production === "collective_other" && "Collectif - Autre"}
                          {!property.hot_water_production && "Non spécifié"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Mode de chauffage</p>
                        <p className="font-medium">
                          {property.heating_mode === "individual_electric" && "Individuel - Électrique"}
                          {property.heating_mode === "individual_oil" && "Individuel - Fioul"}
                          {property.heating_mode === "individual_gas" && "Individuel - Gaz"}
                          {property.heating_mode === "individual_solar" && "Individuel - Solaire"}
                          {property.heating_mode === "individual_other" && "Individuel - Autre"}
                          {property.heating_mode === "collective_electric" && "Collectif - Électrique"}
                          {property.heating_mode === "collective_oil" && "Collectif - Fioul"}
                          {property.heating_mode === "collective_gas" && "Collectif - Gaz"}
                          {property.heating_mode === "collective_solar" && "Collectif - Solaire"}
                          {property.heating_mode === "collective_other" && "Collectif - Autre"}
                          {!property.heating_mode && "Non spécifié"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Type de location */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Type de location</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Colocation possible</p>
                        <p className="font-medium">{property.colocation_possible ? "Oui" : "Non"}</p>
                      </div>
                      {property.colocation_possible && (
                        <div>
                          <p className="text-sm text-gray-500">Nombre max d'occupants</p>
                          <p className="font-medium">{property.max_colocation_occupants || "Non spécifié"}</p>
                        </div>
                      )}
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

                  <Button
                    variant={property.available ? "secondary" : "default"}
                    className="w-full"
                    onClick={async () => {
                      try {
                        await propertyService.updateProperty(property.id, {
                          available: !property.available,
                        })
                        setProperty((prev) => ({ ...prev, available: !prev.available }))
                        toast.success(property.available ? "Annonce mise en pause" : "Annonce réactivée")
                      } catch (error) {
                        toast.error("Erreur lors de la modification")
                      }
                    }}
                  >
                    {property.available ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Mettre en pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Réactiver l'annonce
                      </>
                    )}
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
                        setActiveTab("visits")
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
              <div className="flex items-center justify-between">
                <CardTitle>Candidatures reçues</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/owner/applications?propertyId=${property.id}`}>Voir toutes les candidatures</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ApplicationsList propertyId={property.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <PropertyDocumentsManager propertyId={property.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
