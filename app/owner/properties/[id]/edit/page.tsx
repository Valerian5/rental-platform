"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save, Upload, X } from "lucide-react"
import Link from "next/link"
import { propertyService } from "@/lib/property-service"
import { authService } from "@/lib/auth-service"
import { imageService } from "@/lib/image-service"
import { toast } from "sonner"

export default function EditPropertyPage() {
  const router = useRouter()
  const params = useParams()
  const [property, setProperty] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    surface: "",
    rooms: "",
    bedrooms: "",
    bathrooms: "",
    property_type: "",
    address: "",
    city: "",
    postal_code: "",
    furnished: false,
    available: true,
  })

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "owner") {
          toast.error("Vous devez être connecté en tant que propriétaire")
          router.push("/login")
          return
        }

        if (!params.id) {
          throw new Error("ID de propriété manquant")
        }

        const propertyData = await propertyService.getPropertyById(params.id as string)

        if (propertyData.owner_id !== user.id) {
          toast.error("Vous n'avez pas accès à ce bien")
          router.push("/owner/dashboard")
          return
        }

        setProperty(propertyData)
        setFormData({
          title: propertyData.title || "",
          description: propertyData.description || "",
          price: propertyData.price?.toString() || "",
          surface: propertyData.surface?.toString() || "",
          rooms: propertyData.rooms?.toString() || "",
          bedrooms: propertyData.bedrooms?.toString() || "",
          bathrooms: propertyData.bathrooms?.toString() || "",
          property_type: propertyData.property_type || "",
          address: propertyData.address || "",
          city: propertyData.city || "",
          postal_code: propertyData.postal_code || "",
          furnished: propertyData.furnished || false,
          available: propertyData.available !== false,
        })
      } catch (error: any) {
        console.error("Erreur lors du chargement:", error)
        toast.error("Erreur lors du chargement du bien")
        router.push("/owner/dashboard")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProperty()
  }, [params.id, router])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!property) return

    setIsSaving(true)

    try {
      const updateData = {
        ...formData,
        price: Number.parseFloat(formData.price),
        surface: Number.parseInt(formData.surface),
        rooms: Number.parseInt(formData.rooms),
        bedrooms: formData.bedrooms ? Number.parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? Number.parseInt(formData.bathrooms) : null,
      }

      await propertyService.updateProperty(property.id, updateData)
      toast.success("Bien modifié avec succès")
      router.push(`/owner/properties/${property.id}`)
    } catch (error: any) {
      console.error("Erreur lors de la sauvegarde:", error)
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setIsSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !property) return

    setIsUploadingImages(true)
    toast.info("Upload des images en cours...")

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

      const updatedProperty = {
        ...property,
        property_images: [...(property.property_images || []), ...newImages],
      }
      setProperty(updatedProperty)

      toast.success(`${files.length} image(s) ajoutée(s) avec succès`)
      e.target.value = ""
    } catch (error: any) {
      console.error("Erreur lors de l'upload:", error)
      toast.error("Erreur lors de l'upload des images")
    } finally {
      setIsUploadingImages(false)
    }
  }

  const handleDeleteImage = async (imageId: string, imageUrl: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette image ?")) return

    try {
      await imageService.deletePropertyImage(imageId, imageUrl)

      const updatedProperty = {
        ...property,
        property_images: property.property_images.filter((img: any) => img.id !== imageId),
      }
      setProperty(updatedProperty)

      toast.success("Image supprimée avec succès")
    } catch (error: any) {
      console.error("Erreur lors de la suppression:", error)
      toast.error("Erreur lors de la suppression de l'image")
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-red-600">Bien non trouvé</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <Link
          href={`/owner/properties/${property.id}`}
          className="text-blue-600 hover:underline flex items-center mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour à la gestion du bien
        </Link>
        <h1 className="text-3xl font-bold">Modifier le bien</h1>
        <p className="text-gray-600">{property.title}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Titre de l'annonce *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Ex: Bel appartement 3 pièces centre-ville"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Décrivez votre bien..."
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Loyer mensuel (€) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  placeholder="800"
                  required
                />
              </div>

              <div>
                <Label htmlFor="property_type">Type de bien *</Label>
                <Select
                  value={formData.property_type}
                  onValueChange={(value) => handleInputChange("property_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Appartement</SelectItem>
                    <SelectItem value="house">Maison</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="loft">Loft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Caractéristiques */}
        <Card>
          <CardHeader>
            <CardTitle>Caractéristiques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="surface">Surface (m²) *</Label>
                <Input
                  id="surface"
                  type="number"
                  value={formData.surface}
                  onChange={(e) => handleInputChange("surface", e.target.value)}
                  placeholder="50"
                  required
                />
              </div>

              <div>
                <Label htmlFor="rooms">Nombre de pièces *</Label>
                <Input
                  id="rooms"
                  type="number"
                  value={formData.rooms}
                  onChange={(e) => handleInputChange("rooms", e.target.value)}
                  placeholder="3"
                  required
                />
              </div>

              <div>
                <Label htmlFor="bedrooms">Chambres</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => handleInputChange("bedrooms", e.target.value)}
                  placeholder="2"
                />
              </div>

              <div>
                <Label htmlFor="bathrooms">Salles de bain</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => handleInputChange("bathrooms", e.target.value)}
                  placeholder="1"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="furnished"
                checked={formData.furnished}
                onCheckedChange={(checked) => handleInputChange("furnished", checked)}
              />
              <Label htmlFor="furnished">Bien meublé</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="available"
                checked={formData.available}
                onCheckedChange={(checked) => handleInputChange("available", checked)}
              />
              <Label htmlFor="available">Disponible à la location</Label>
            </div>
          </CardContent>
        </Card>

        {/* Localisation */}
        <Card>
          <CardHeader>
            <CardTitle>Localisation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address">Adresse *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="123 rue de la Paix"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Ville *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="Paris"
                  required
                />
              </div>

              <div>
                <Label htmlFor="postal_code">Code postal *</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => handleInputChange("postal_code", e.target.value)}
                  placeholder="75001"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Photos du bien</CardTitle>
              <div className="flex items-center gap-2">
                <Label htmlFor="image-upload-edit" className="cursor-pointer">
                  <Button variant="outline" size="sm" disabled={isUploadingImages} asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploadingImages ? "Upload..." : "Ajouter"}
                    </span>
                  </Button>
                </Label>
                <Input
                  id="image-upload-edit"
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
                  <div key={image.id} className="relative group aspect-video rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={image.url || "/placeholder.svg"}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
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
              <div className="text-center py-8 text-gray-500">
                <p>Aucune photo ajoutée</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Boutons d'action */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isSaving} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Sauvegarde..." : "Sauvegarder les modifications"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/owner/properties/${property.id}`}>Annuler</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
