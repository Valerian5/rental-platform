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
import { Checkbox } from "@/components/ui/checkbox"
import { CityAutocomplete } from "@/components/ui/city-autocomplete"
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
    // Nouveaux champs ajoutés
    floor: "",
    total_floors: "",
    latitude: null as number | null,
    longitude: null as number | null,
    heating_type: "",
    energy_class: "",
    ges_class: "",
    hot_water_production: "",
    heating_mode: "",
    orientation: "",
    wc_count: 1,
    wc_separate: false,
    wheelchair_accessible: false,
    internet: false,
    pets_allowed: false,
    smoking_allowed: false,
    charges: "",
    deposit: "",
    availability_date: "",
    minimum_lease_duration: "",
    maximum_lease_duration: "",
    utilities_included: false,
    furnished_details: "",
    // Équipements (stockés dans l'array equipment)
    equipment: [] as string[],
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
          // Nouveaux champs
          floor: propertyData.floor?.toString() || "",
          total_floors: propertyData.total_floors?.toString() || "",
          latitude: propertyData.latitude || null,
          longitude: propertyData.longitude || null,
          heating_type: propertyData.heating_type || "",
          energy_class: propertyData.energy_class || "",
          ges_class: propertyData.ges_class || "",
          hot_water_production: propertyData.hot_water_production || "",
          heating_mode: propertyData.heating_mode || "",
          orientation: propertyData.orientation || "",
          wc_count: propertyData.wc_count || 1,
          wc_separate: propertyData.wc_separate || false,
          wheelchair_accessible: propertyData.wheelchair_accessible || false,
          internet: propertyData.internet || false,
          pets_allowed: propertyData.pets_allowed || false,
          smoking_allowed: propertyData.smoking_allowed || false,
          charges: propertyData.charges?.toString() || "",
          deposit: propertyData.deposit?.toString() || "",
          availability_date: propertyData.availability_date || "",
          minimum_lease_duration: propertyData.minimum_lease_duration?.toString() || "",
          maximum_lease_duration: propertyData.maximum_lease_duration?.toString() || "",
          utilities_included: propertyData.utilities_included || false,
          furnished_details: propertyData.furnished_details || "",
          // Équipements depuis l'array equipment
          equipment: propertyData.equipment || [],
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

  const handleEquipmentChange = (equipment: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      equipment: checked
        ? [...prev.equipment, equipment]
        : prev.equipment.filter((item) => item !== equipment),
    }))
  }

  const handleCityChange = (value: string) => {
    const match = value.match(/^(.+?)\s*\((\d{5})\)$/)
    if (match) {
      const [, cityName, postalCode] = match
      setFormData((prev) => ({
        ...prev,
        city: cityName,
        postal_code: postalCode,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        city: value,
        postal_code: "",
      }))
    }
  }

  const geocodeCity = async (city: string, postalCode: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          `${city}, ${postalCode}, France`
        )}&limit=1`
      )
      const data = await response.json()
      if (data && data.length > 0) {
        const { lat, lon } = data[0]
        setFormData((prev) => ({
          ...prev,
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
        }))
      }
    } catch (error) {
      console.error("Erreur géocodage:", error)
    }
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
        floor: formData.floor ? Number.parseInt(formData.floor) : null,
        total_floors: formData.total_floors ? Number.parseInt(formData.total_floors) : null,
        wc_count: Number.parseInt(formData.wc_count.toString()),
        charges: formData.charges ? Number.parseFloat(formData.charges) : null,
        deposit: formData.deposit ? Number.parseFloat(formData.deposit) : null,
        minimum_lease_duration: formData.minimum_lease_duration
          ? Number.parseInt(formData.minimum_lease_duration)
          : null,
        maximum_lease_duration: formData.maximum_lease_duration
          ? Number.parseInt(formData.maximum_lease_duration)
          : null,
        // Supprimer les champs qui ne sont pas dans la table
        equipment: formData.equipment,
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="charges">Charges (€)</Label>
                <Input
                  id="charges"
                  type="number"
                  value={formData.charges}
                  onChange={(e) => handleInputChange("charges", e.target.value)}
                  placeholder="50"
                />
              </div>

              <div>
                <Label htmlFor="deposit">Dépôt de garantie (€)</Label>
                <Input
                  id="deposit"
                  type="number"
                  value={formData.deposit}
                  onChange={(e) => handleInputChange("deposit", e.target.value)}
                  placeholder="800"
                />
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="floor">Étage</Label>
                <Input
                  id="floor"
                  type="number"
                  value={formData.floor}
                  onChange={(e) => handleInputChange("floor", e.target.value)}
                  placeholder="2"
                />
              </div>

              <div>
                <Label htmlFor="total_floors">Nombre d'étages total</Label>
                <Input
                  id="total_floors"
                  type="number"
                  value={formData.total_floors}
                  onChange={(e) => handleInputChange("total_floors", e.target.value)}
                  placeholder="5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="furnished"
                  checked={formData.furnished}
                  onCheckedChange={(checked) => handleInputChange("furnished", checked)}
                />
                <Label htmlFor="furnished">Meublé</Label>
              </div>

              {[
                "Ascenseur",
                "Balcon", 
                "Terrasse",
                "Jardin",
                "Parking",
                "Garage",
                "Cave",
                "Interphone",
                "Digicode",
                "Internet",
                "Climatisation",
                "Cheminée",
                "Lave-linge",
                "Lave-vaisselle",
                "Réfrigérateur",
                "Four",
                "Micro-ondes",
                "Animaux acceptés"
              ].map((equipment) => (
                <div key={equipment} className="flex items-center space-x-2">
                  <Checkbox
                    id={equipment.toLowerCase().replace(/\s+/g, '_')}
                    checked={formData.equipment.includes(equipment)}
                    onCheckedChange={(checked) => handleEquipmentChange(equipment, checked as boolean)}
                  />
                  <Label htmlFor={equipment.toLowerCase().replace(/\s+/g, '_')}>{equipment}</Label>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="heating_type">Type de chauffage</Label>
                <Select
                  value={formData.heating_type}
                  onValueChange={(value) => handleInputChange("heating_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual_gas">Gaz individuel</SelectItem>
                    <SelectItem value="collective_gas">Gaz collectif</SelectItem>
                    <SelectItem value="electric">Électrique</SelectItem>
                    <SelectItem value="fuel">Fioul</SelectItem>
                    <SelectItem value="heat_pump">Pompe à chaleur</SelectItem>
                    <SelectItem value="wood">Bois</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="energy_class">Classe énergétique</Label>
                <Select
                  value={formData.energy_class}
                  onValueChange={(value) => handleInputChange("energy_class", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                    <SelectItem value="D">D</SelectItem>
                    <SelectItem value="E">E</SelectItem>
                    <SelectItem value="F">F</SelectItem>
                    <SelectItem value="G">G</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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

            <div>
              <Label htmlFor="city">Ville et code postal *</Label>
              <CityAutocomplete
                value={`${formData.city} (${formData.postal_code})`}
                onChange={handleCityChange}
                placeholder="Rechercher une ville..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Caractéristiques détaillées */}
        <Card>
          <CardHeader>
            <CardTitle>Caractéristiques détaillées</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hot_water_production">Production eau chaude</Label>
                <Select
                  value={formData.hot_water_production}
                  onValueChange={(value) => handleInputChange("hot_water_production", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual_electric">Individuel - Électrique</SelectItem>
                    <SelectItem value="individual_oil">Individuel - Fioul</SelectItem>
                    <SelectItem value="individual_gas">Individuel - Gaz</SelectItem>
                    <SelectItem value="individual_solar">Individuel - Solaire</SelectItem>
                    <SelectItem value="individual_other">Individuel - Autre</SelectItem>
                    <SelectItem value="collective_electric">Collectif - Électrique</SelectItem>
                    <SelectItem value="collective_oil">Collectif - Fioul</SelectItem>
                    <SelectItem value="collective_gas">Collectif - Gaz</SelectItem>
                    <SelectItem value="collective_solar">Collectif - Solaire</SelectItem>
                    <SelectItem value="collective_other">Collectif - Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="heating_mode">Mode de chauffage</Label>
                <Select
                  value={formData.heating_mode}
                  onValueChange={(value) => handleInputChange("heating_mode", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual_electric">Individuel - Électrique</SelectItem>
                    <SelectItem value="individual_oil">Individuel - Fioul</SelectItem>
                    <SelectItem value="individual_gas">Individuel - Gaz</SelectItem>
                    <SelectItem value="individual_solar">Individuel - Solaire</SelectItem>
                    <SelectItem value="individual_other">Individuel - Autre</SelectItem>
                    <SelectItem value="collective_electric">Collectif - Électrique</SelectItem>
                    <SelectItem value="collective_oil">Collectif - Fioul</SelectItem>
                    <SelectItem value="collective_gas">Collectif - Gaz</SelectItem>
                    <SelectItem value="collective_solar">Collectif - Solaire</SelectItem>
                    <SelectItem value="collective_other">Collectif - Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="orientation">Exposition</Label>
                <Select
                  value={formData.orientation}
                  onValueChange={(value) => handleInputChange("orientation", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="north">Nord</SelectItem>
                    <SelectItem value="south">Sud</SelectItem>
                    <SelectItem value="east">Est</SelectItem>
                    <SelectItem value="west">Ouest</SelectItem>
                    <SelectItem value="northeast">Nord-Est</SelectItem>
                    <SelectItem value="northwest">Nord-Ouest</SelectItem>
                    <SelectItem value="southeast">Sud-Est</SelectItem>
                    <SelectItem value="southwest">Sud-Ouest</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="wc_count">Nombre de WC</Label>
                <Input
                  id="wc_count"
                  type="number"
                  min="0"
                  value={formData.wc_count}
                  onChange={(e) => handleInputChange("wc_count", Number(e.target.value))}
                  placeholder="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="wc_separate"
                  checked={formData.wc_separate}
                  onCheckedChange={(checked) => handleInputChange("wc_separate", checked as boolean)}
                />
                <Label htmlFor="wc_separate">WC séparé</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="wheelchair_accessible"
                  checked={formData.wheelchair_accessible}
                  onCheckedChange={(checked) => handleInputChange("wheelchair_accessible", checked as boolean)}
                />
                <Label htmlFor="wheelchair_accessible">Accessible fauteuils roulants</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conditions de location */}
        <Card>
          <CardHeader>
            <CardTitle>Conditions de location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="availability_date">Date de disponibilité</Label>
                <Input
                  id="availability_date"
                  type="date"
                  value={formData.availability_date}
                  onChange={(e) => handleInputChange("availability_date", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="minimum_lease_duration">Durée minimum (mois)</Label>
                <Input
                  id="minimum_lease_duration"
                  type="number"
                  value={formData.minimum_lease_duration}
                  onChange={(e) => handleInputChange("minimum_lease_duration", e.target.value)}
                  placeholder="12"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="pets_allowed"
                  checked={formData.pets_allowed}
                  onCheckedChange={(checked) => handleInputChange("pets_allowed", checked)}
                />
                <Label htmlFor="pets_allowed">Animaux autorisés</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="smoking_allowed"
                  checked={formData.smoking_allowed}
                  onCheckedChange={(checked) => handleInputChange("smoking_allowed", checked)}
                />
                <Label htmlFor="smoking_allowed">Fumeurs autorisés</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="internet"
                  checked={formData.internet}
                  onCheckedChange={(checked) => handleInputChange("internet", checked)}
                />
                <Label htmlFor="internet">Internet inclus</Label>
              </div>
            </div>

            {formData.furnished && (
              <div>
                <Label htmlFor="furnished_details">Détails ameublement</Label>
                <Textarea
                  id="furnished_details"
                  value={formData.furnished_details}
                  onChange={(e) => handleInputChange("furnished_details", e.target.value)}
                  placeholder="Décrivez l'ameublement..."
                  rows={3}
                />
              </div>
            )}
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
