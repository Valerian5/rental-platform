"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { XIcon, UploadIcon } from "lucide-react"

export function PropertyForm() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    rentalType: "",
    address: "",
    city: "",
    postalCode: "",
    district: "",
    price: "",
    charges: "",
    deposit: "",
    surface: "",
    rooms: "",
    bedrooms: "",
    bathrooms: "",
    floor: "",
    totalFloors: "",
    energyClass: "",
    availableFrom: "",
    furnished: false,
    features: [] as string[],
    images: [] as File[],
  })

  const [availableFeatures] = useState([
    "Balcon",
    "Terrasse",
    "Jardin",
    "Parking",
    "Cave",
    "Ascenseur",
    "Interphone",
    "Digicode",
    "Gardien",
    "Piscine",
    "Climatisation",
    "Cheminée",
    "Parquet",
    "Carrelage",
    "Cuisine équipée",
    "Lave-vaisselle",
    "Lave-linge",
    "Sèche-linge",
    "Internet",
    "Fibre optique",
  ])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleFeatureToggle = (feature: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }))
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...files],
    }))
  }

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    console.log("Form submitted:", formData)
    // Here you would typically send the data to your API
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
          <CardDescription>Décrivez votre bien immobilier</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre de l'annonce *</Label>
              <Input
                id="title"
                placeholder="Ex: Appartement 3 pièces - Belleville"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type de bien *</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Appartement</SelectItem>
                  <SelectItem value="house">Maison</SelectItem>
                  <SelectItem value="studio">Studio</SelectItem>
                  <SelectItem value="loft">Loft</SelectItem>
                  <SelectItem value="duplex">Duplex</SelectItem>
                  <SelectItem value="penthouse">Penthouse</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Décrivez votre bien en détail..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rentalType">Type de location *</Label>
              <Select value={formData.rentalType} onValueChange={(value) => handleInputChange("rentalType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="empty">Vide</SelectItem>
                  <SelectItem value="furnished">Meublé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="availableFrom">Disponible à partir du</Label>
              <Input
                id="availableFrom"
                type="date"
                value={formData.availableFrom}
                onChange={(e) => handleInputChange("availableFrom", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle>Localisation</CardTitle>
          <CardDescription>Où se situe votre bien ?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Adresse complète *</Label>
            <Input
              id="address"
              placeholder="Ex: 15 rue de Belleville"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Ville *</Label>
              <Input
                id="city"
                placeholder="Ex: Paris"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">Code postal *</Label>
              <Input
                id="postalCode"
                placeholder="Ex: 75020"
                value={formData.postalCode}
                onChange={(e) => handleInputChange("postalCode", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="district">Quartier</Label>
              <Input
                id="district"
                placeholder="Ex: Belleville"
                value={formData.district}
                onChange={(e) => handleInputChange("district", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Property Details */}
      <Card>
        <CardHeader>
          <CardTitle>Caractéristiques</CardTitle>
          <CardDescription>Détails techniques du bien</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="surface">Surface (m²) *</Label>
              <Input
                id="surface"
                type="number"
                placeholder="65"
                value={formData.surface}
                onChange={(e) => handleInputChange("surface", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rooms">Nombre de pièces *</Label>
              <Input
                id="rooms"
                type="number"
                placeholder="3"
                value={formData.rooms}
                onChange={(e) => handleInputChange("rooms", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bedrooms">Chambres</Label>
              <Input
                id="bedrooms"
                type="number"
                placeholder="2"
                value={formData.bedrooms}
                onChange={(e) => handleInputChange("bedrooms", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bathrooms">Salles de bain</Label>
              <Input
                id="bathrooms"
                type="number"
                placeholder="1"
                value={formData.bathrooms}
                onChange={(e) => handleInputChange("bathrooms", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="floor">Étage</Label>
              <Input
                id="floor"
                type="number"
                placeholder="3"
                value={formData.floor}
                onChange={(e) => handleInputChange("floor", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalFloors">Nombre d'étages total</Label>
              <Input
                id="totalFloors"
                type="number"
                placeholder="5"
                value={formData.totalFloors}
                onChange={(e) => handleInputChange("totalFloors", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="energyClass">Classe énergétique</Label>
              <Select value={formData.energyClass} onValueChange={(value) => handleInputChange("energyClass", value)}>
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
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Informations financières</CardTitle>
          <CardDescription>Définissez le prix de votre bien</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Loyer mensuel (€) *</Label>
              <Input
                id="price"
                type="number"
                placeholder="1200"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="charges">Charges (€)</Label>
              <Input
                id="charges"
                type="number"
                placeholder="150"
                value={formData.charges}
                onChange={(e) => handleInputChange("charges", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deposit">Dépôt de garantie (€)</Label>
              <Input
                id="deposit"
                type="number"
                placeholder="1200"
                value={formData.deposit}
                onChange={(e) => handleInputChange("deposit", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Équipements et services</CardTitle>
          <CardDescription>Sélectionnez les équipements disponibles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {availableFeatures.map((feature) => (
              <div key={feature} className="flex items-center space-x-2">
                <Checkbox
                  id={feature}
                  checked={formData.features.includes(feature)}
                  onCheckedChange={() => handleFeatureToggle(feature)}
                />
                <Label htmlFor={feature} className="text-sm">
                  {feature}
                </Label>
              </div>
            ))}
          </div>

          {formData.features.length > 0 && (
            <div className="mt-4">
              <Label className="text-sm font-medium">Équipements sélectionnés:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.features.map((feature) => (
                  <Badge
                    key={feature}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => handleFeatureToggle(feature)}
                  >
                    {feature}
                    <XIcon className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle>Photos du bien</CardTitle>
          <CardDescription>Ajoutez des photos attractives de votre bien</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <UploadIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <div className="space-y-2">
              <Label htmlFor="images" className="cursor-pointer">
                <span className="text-sm font-medium">Cliquez pour ajouter des photos</span>
                <Input
                  id="images"
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </Label>
              <p className="text-xs text-muted-foreground">PNG, JPG, JPEG jusqu'à 10MB chacune</p>
            </div>
          </div>

          {formData.images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {formData.images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(image) || "/placeholder.svg"}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0"
                    onClick={() => removeImage(index)}
                  >
                    <XIcon className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex gap-4">
        <Button type="submit" className="flex-1">
          Publier l'annonce
        </Button>
        <Button type="button" variant="outline" className="flex-1">
          Sauvegarder en brouillon
        </Button>
      </div>
    </form>
  )
}
