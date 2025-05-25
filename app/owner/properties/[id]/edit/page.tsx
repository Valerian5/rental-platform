"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { propertyService } from "@/lib/property-service"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"

export default function EditPropertyPage() {
  const router = useRouter()
  const params = useParams()
  const [property, setProperty] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    address: "",
    city: "",
    postal_code: "",
    surface: "",
    price: "",
    rooms: "",
    bedrooms: "",
    bathrooms: "",
    property_type: "apartment",
    furnished: false,
    available: true,
  })

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
          address: propertyData.address || "",
          city: propertyData.city || "",
          postal_code: propertyData.postal_code || "",
          surface: propertyData.surface?.toString() || "",
          price: propertyData.price?.toString() || "",
          rooms: propertyData.rooms?.toString() || "",
          bedrooms: propertyData.bedrooms?.toString() || "",
          bathrooms: propertyData.bathrooms?.toString() || "",
          property_type: propertyData.property_type || "apartment",
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

    fetchData()
  }, [params.id, router])

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!property) return

    setIsSaving(true)
    toast.info("Sauvegarde en cours...")

    try {
      const updateData = {
        title: formData.title,
        description: formData.description,
        address: formData.address,
        city: formData.city,
        postal_code: formData.postal_code,
        surface: Number.parseInt(formData.surface),
        price: Number.parseFloat(formData.price),
        rooms: Number.parseInt(formData.rooms),
        bedrooms: formData.bedrooms ? Number.parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? Number.parseInt(formData.bathrooms) : null,
        property_type: formData.property_type,
        furnished: formData.furnished,
        available: formData.available,
      }

      await propertyService.updateProperty(property.id, updateData)
      toast.success("Bien mis à jour avec succès")
      router.push(`/owner/properties/${property.id}`)
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour:", error)
      toast.error("Erreur lors de la mise à jour du bien")
    } finally {
      setIsSaving(false)
    }
  }

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

  if (!property) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center space-y-4">
          <div className="text-red-600 text-lg font-medium">Bien non trouvé</div>
          <Button onClick={() => router.push("/owner/dashboard")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Link href={`/owner/properties/${property.id}`} className="text-blue-600 hover:underline flex items-center mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Retour au bien
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Modifier le bien</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations de base */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informations de base</h3>

              <div className="space-y-2">
                <Label htmlFor="title">Titre de l'annonce *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="Ex: Appartement moderne au centre-ville"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Décrivez votre bien en détail..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    placeholder="123 Rue de la Paix"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ville *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    placeholder="Paris"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal_code">Code postal</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => handleChange("postal_code", e.target.value)}
                  placeholder="75001"
                />
              </div>
            </div>

            {/* Caractéristiques */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Caractéristiques</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="surface">Surface (m²) *</Label>
                  <Input
                    id="surface"
                    type="number"
                    value={formData.surface}
                    onChange={(e) => handleChange("surface", e.target.value)}
                    placeholder="65"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Prix (€) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleChange("price", e.target.value)}
                    placeholder="1200"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rooms">Nombre de pièces *</Label>
                  <Input
                    id="rooms"
                    type="number"
                    value={formData.rooms}
                    onChange={(e) => handleChange("rooms", e.target.value)}
                    placeholder="3"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Nombre de chambres</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => handleChange("bedrooms", e.target.value)}
                    placeholder="2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Nombre de salles de bain</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => handleChange("bathrooms", e.target.value)}
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="property_type">Type de bien *</Label>
                <Select value={formData.property_type} onValueChange={(value) => handleChange("property_type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Appartement</SelectItem>
                    <SelectItem value="house">Maison</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="loft">Loft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="furnished"
                  checked={formData.furnished}
                  onCheckedChange={(checked) => handleChange("furnished", checked)}
                />
                <Label htmlFor="furnished">Meublé</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="available"
                  checked={formData.available}
                  onCheckedChange={(checked) => handleChange("available", checked)}
                />
                <Label htmlFor="available">Disponible à la location</Label>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end space-x-4 pt-6">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
