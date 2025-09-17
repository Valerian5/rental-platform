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
    // Nouveaux champs financiers
    rent_control_zone: false,
    reference_rent: null as number | null,
    reference_rent_increased: null as number | null,
    rent_supplement: null as number | null,
    agency_fees_tenant: null as number | null,
    inventory_fees_tenant: null as number | null,
    // Nouveaux champs colocation
    colocation_possible: false,
    max_colocation_occupants: null as number | null,
    // Équipements (stockés dans l'array equipment)
    equipment: [] as string[],
  })

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const propertyData = await propertyService.getPropertyById(params.id as string)
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
          charges: propertyData.charges_amount?.toString() || "",
          deposit: propertyData.security_deposit?.toString() || "",
          availability_date: propertyData.availability_date || "",
          minimum_lease_duration: propertyData.minimum_lease_duration?.toString() || "",
          maximum_lease_duration: propertyData.maximum_lease_duration?.toString() || "",
          utilities_included: propertyData.utilities_included || false,
          furnished_details: propertyData.furnished_details || "",
          // Nouveaux champs financiers
          rent_control_zone: propertyData.rent_control_zone || false,
          reference_rent: propertyData.reference_rent || null,
          reference_rent_increased: propertyData.reference_rent_increased || null,
          rent_supplement: propertyData.rent_supplement || null,
          agency_fees_tenant: propertyData.agency_fees_tenant || null,
          inventory_fees_tenant: propertyData.inventory_fees_tenant || null,
          // Nouveaux champs colocation
          colocation_possible: propertyData.colocation_possible || false,
          max_colocation_occupants: propertyData.max_colocation_occupants || null,
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
        // Correction des noms de colonnes
        charges_amount: formData.charges ? Number.parseFloat(formData.charges) : null,
        security_deposit: formData.deposit ? Number.parseFloat(formData.deposit) : null,
        minimum_lease_duration: formData.minimum_lease_duration
          ? Number.parseInt(formData.minimum_lease_duration)
          : null,
        maximum_lease_duration: formData.maximum_lease_duration
          ? Number.parseInt(formData.maximum_lease_duration)
          : null,
        // Nouveaux champs financiers
        rent_control_zone: formData.rent_control_zone,
        reference_rent: formData.reference_rent,
        reference_rent_increased: formData.reference_rent_increased,
        rent_supplement: formData.rent_supplement,
        agency_fees_tenant: formData.agency_fees_tenant,
        inventory_fees_tenant: formData.inventory_fees_tenant,
        // Nouveaux champs colocation
        colocation_possible: formData.colocation_possible,
        max_colocation_occupants: formData.max_colocation_occupants,
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
        {/* Section 1: Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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
                placeholder="Décrivez le bien en détail..."
                rows={4}
                required
              />
            </div>

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

        {/* Section 2: Caractéristiques du bien */}
        <Card>
          <CardHeader>
            <CardTitle>Caractéristiques du bien</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="surface">Surface (m²) *</Label>
                <Input
                  id="surface"
                  type="number"
                  value={formData.surface || ""}
                  onChange={(e) => handleInputChange("surface", Number(e.target.value))}
                  placeholder="75"
                />
              </div>

              <div>
                <Label htmlFor="construction_year">Année de construction</Label>
                <Input
                  id="construction_year"
                  type="number"
                  value={formData.construction_year || ""}
                  onChange={(e) =>
                    handleInputChange("construction_year", e.target.value ? Number(e.target.value) : null)
                  }
                  placeholder="2010"
                />
              </div>

              <div>
                <Label htmlFor="property_type">Type de bien</Label>
                <Select
                  value={formData.property_type}
                  onValueChange={(value) => handleInputChange("property_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Appartement</SelectItem>
                    <SelectItem value="house">Maison</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="loft">Loft</SelectItem>
                    <SelectItem value="duplex">Duplex</SelectItem>
                    <SelectItem value="townhouse">Maison de ville</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="rooms">Nombre de pièces *</Label>
                <Input
                  id="rooms"
                  type="number"
                  value={formData.rooms}
                  onChange={(e) => handleInputChange("rooms", Number(e.target.value))}
                  min="1"
                />
              </div>

              <div>
                <Label htmlFor="bedrooms">Nombre de chambres</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => handleInputChange("bedrooms", Number(e.target.value))}
                  min="0"
                />
              </div>

              <div>
                <Label htmlFor="bathrooms">Nombre de salles de bain</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => handleInputChange("bathrooms", Number(e.target.value))}
                  min="0"
                />
              </div>

              <div>
                <Label htmlFor="floor">Étage</Label>
                <Input
                  id="floor"
                  type="number"
                  value={formData.floor || ""}
                  onChange={(e) => handleInputChange("floor", e.target.value ? Number(e.target.value) : null)}
                  placeholder="3"
                />
              </div>

              <div>
                <Label htmlFor="total_floors">Nombre d'étages</Label>
                <Input
                  id="total_floors"
                  type="number"
                  value={formData.total_floors || ""}
                  onChange={(e) =>
                    handleInputChange("total_floors", e.target.value ? Number(e.target.value) : null)
                  }
                  placeholder="5"
                />
              </div>

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

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="wc_separate"
                  checked={formData.wc_separate}
                  onCheckedChange={(checked) => handleInputChange("wc_separate", checked as boolean)}
                />
                <Label htmlFor="wc_separate">WC séparé</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2.5: Logement meublé */}
        <Card>
          <CardHeader>
            <CardTitle>Type de location</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="furnished"
                  checked={formData.furnished}
                  onCheckedChange={(checked) => handleInputChange("furnished", checked as boolean)}
                />
                <div>
                  <Label htmlFor="furnished">Logement meublé</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pour être considéré comme meublé, un bien doit comporter au minimum cette liste de meubles :{' '}
                    <a 
                      href="https://www.service-public.fr/particuliers/vosdroits/F34769" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Voir la liste officielle
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="colocation_possible"
                  checked={formData.colocation_possible}
                  onCheckedChange={(checked) => handleInputChange("colocation_possible", checked as boolean)}
                />
                <div>
                  <Label htmlFor="colocation_possible">Colocation possible</Label>
                </div>
              </div>

              {formData.colocation_possible && (
                <div className="ml-6">
                  <Label htmlFor="max_colocation_occupants">Nombre de personnes maximum</Label>
                  <Input
                    id="max_colocation_occupants"
                    type="number"
                    min="2"
                    value={formData.max_colocation_occupants || ""}
                    onChange={(e) => handleInputChange("max_colocation_occupants", e.target.value ? Number(e.target.value) : null)}
                    placeholder="3"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Extérieur */}
        <Card>
          <CardHeader>
            <CardTitle>Extérieur</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="balcony"
                  checked={formData.equipment.includes("Balcon")}
                  onCheckedChange={(checked) => handleEquipmentChange("Balcon", checked as boolean)}
                />
                <Label htmlFor="balcony">Balcon</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terrace"
                  checked={formData.equipment.includes("Terrasse")}
                  onCheckedChange={(checked) => handleEquipmentChange("Terrasse", checked as boolean)}
                />
                <Label htmlFor="terrace">Terrasse</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="garden"
                  checked={formData.equipment.includes("Jardin")}
                  onCheckedChange={(checked) => handleEquipmentChange("Jardin", checked as boolean)}
                />
                <Label htmlFor="garden">Jardin</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="loggia"
                  checked={formData.equipment.includes("Loggia")}
                  onCheckedChange={(checked) => handleEquipmentChange("Loggia", checked as boolean)}
                />
                <Label htmlFor="loggia">Loggia</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Équipements */}
        <Card>
          <CardHeader>
            <CardTitle>Équipements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                "Cuisine équipée",
                "Baignoire",
                "Douche",
                "Lave-linge",
                "Sèche-linge",
                "Réfrigérateur",
                "Four",
                "Micro-ondes",
                "Climatisation",
                "Cheminée",
                "Parking",
                "Cave",
                "Ascenseur",
                "Interphone",
                "Digicode",
                "Internet",
                "Accessible fauteuils roulants"
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
          </CardContent>
        </Card>

        {/* Section 5: Informations financières */}
        <Card>
          <CardHeader>
            <CardTitle>Informations financières</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="price">Loyer hors charges (€) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", Number(e.target.value))}
                  placeholder="800"
                />
              </div>
              <div>
                <Label htmlFor="charges">Charges (€)</Label>
                <Input
                  id="charges"
                  type="number"
                  value={formData.charges}
                  onChange={(e) => handleInputChange("charges", Number(e.target.value))}
                  placeholder="100"
                />
              </div>
              <div>
                <Label htmlFor="deposit">Caution (€)</Label>
                <Input
                  id="deposit"
                  type="number"
                  value={formData.deposit}
                  onChange={(e) => handleInputChange("deposit", Number(e.target.value))}
                  placeholder="800"
                />
              </div>
            </div>

            {/* Zone soumise à l'encadrement des loyers */}
            <div className="mt-6">
              <h4 className="font-medium mb-4">Encadrement des loyers</h4>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rent_control_zone"
                    checked={formData.rent_control_zone}
                    onCheckedChange={(checked) => handleInputChange("rent_control_zone", checked as boolean)}
                  />
                  <Label htmlFor="rent_control_zone">Zone soumise à l'encadrement des loyers</Label>
                </div>

                {formData.rent_control_zone && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                    <div>
                      <Label htmlFor="reference_rent">Loyer de référence (€/m²)</Label>
                      <Input
                        id="reference_rent"
                        type="number"
                        step="0.01"
                        value={formData.reference_rent || ""}
                        onChange={(e) => handleInputChange("reference_rent", e.target.value ? Number(e.target.value) : null)}
                        placeholder="15.50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="reference_rent_increased">Loyer de référence majoré (€/m²)</Label>
                      <Input
                        id="reference_rent_increased"
                        type="number"
                        step="0.01"
                        value={formData.reference_rent_increased || ""}
                        onChange={(e) => handleInputChange("reference_rent_increased", e.target.value ? Number(e.target.value) : null)}
                        placeholder="18.50"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Autres frais */}
            <div className="mt-6">
              <h4 className="font-medium mb-4">Autres frais</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="rent_supplement">Complément de loyer (€)</Label>
                  <Input
                    id="rent_supplement"
                    type="number"
                    value={formData.rent_supplement || ""}
                    onChange={(e) => handleInputChange("rent_supplement", e.target.value ? Number(e.target.value) : null)}
                    placeholder="50"
                  />
                </div>
                <div>
                  <Label htmlFor="agency_fees_tenant">Frais d'agence pour le locataire (€)</Label>
                  <Input
                    id="agency_fees_tenant"
                    type="number"
                    value={formData.agency_fees_tenant || ""}
                    onChange={(e) => handleInputChange("agency_fees_tenant", e.target.value ? Number(e.target.value) : null)}
                    placeholder="200"
                  />
                </div>
                <div>
                  <Label htmlFor="inventory_fees_tenant">Frais état des lieux pour le locataire (€)</Label>
                  <Input
                    id="inventory_fees_tenant"
                    type="number"
                    value={formData.inventory_fees_tenant || ""}
                    onChange={(e) => handleInputChange("inventory_fees_tenant", e.target.value ? Number(e.target.value) : null)}
                    placeholder="150"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Dans le cadre si le propriétaire passe par un prestataire pour réaliser l'état des lieux
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 6: Disponibilité */}
        <Card>
          <CardHeader>
            <CardTitle>Disponibilité</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="available"
                checked={formData.available}
                onCheckedChange={(checked) => handleInputChange("available", checked)}
              />
              <Label htmlFor="available">Bien disponible à la location</Label>
            </div>
          </CardContent>
        </Card>

        {/* Section 7: Informations énergétiques */}
        <Card>
          <CardHeader>
            <CardTitle>Informations énergétiques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="energy_class">Classe énergétique</Label>
                <Select
                  value={formData.energy_class}
                  onValueChange={(value) => handleInputChange("energy_class", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="A à G" />
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
              <div>
                <Label htmlFor="ges_class">Classe GES</Label>
                <Select value={formData.ges_class} onValueChange={(value) => handleInputChange("ges_class", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="A à G" />
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

            {/* Production eau chaude et chauffage */}
            <div className="mt-6">
              <h4 className="font-medium mb-4">Production eau chaude et chauffage</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>
          </CardContent>
        </Card>

        {/* Boutons de soumission */}
        <div className="flex justify-end space-x-4">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Sauvegarde..." : "Sauvegarder"}
            <Save className="h-4 w-4 ml-2" />
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/owner/properties/${property.id}`}>Annuler</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}