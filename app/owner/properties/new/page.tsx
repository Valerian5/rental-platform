"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, Home, Upload, Check, Calendar } from "lucide-react"
import Link from "next/link"
import { propertyService } from "@/lib/property-service"
import { authService } from "@/lib/auth-service"
import { FileUpload } from "@/components/file-upload"
import { VisitScheduler } from "@/components/visit-scheduler"
import { CityAutocomplete } from "@/components/ui/city-autocomplete"
import { toast } from "sonner"

interface PropertyFormData {
  // Informations de base
  title: string
  description: string
  address: string
  city: string
  postal_code: string
  latitude: number | null
  longitude: number | null
  hide_exact_address: boolean

  // Caractéristiques du bien
  surface: number
  construction_year: number | null
  price: number // loyer hors charges
  charges: number
  deposit: number
  property_type: string
  furnished: boolean // type de location (meublé/non meublé)
  rooms: number
  bedrooms: number
  bathrooms: number
  floor: number | null
  total_floors: number | null

  // Extérieur
  balcony: boolean
  terrace: boolean
  garden: boolean
  loggia: boolean

  // Équipements
  equipped_kitchen: boolean
  bathtub: boolean
  shower: boolean
  dishwasher: boolean
  washing_machine: boolean
  dryer: boolean
  fridge: boolean
  oven: boolean
  microwave: boolean
  air_conditioning: boolean
  fireplace: boolean
  parking: boolean
  cellar: boolean
  elevator: boolean
  intercom: boolean
  digicode: boolean

  // Informations financières
  fees: number

  // Disponibilité
  available: boolean
  availability_date: string

  // Autres informations
  energy_class: string
  ges_class: string
  heating_type: string

  // Champ technique
  owner_id: string
}

const PROPERTY_TYPES = [
  { value: "apartment", label: "Appartement" },
  { value: "house", label: "Maison" },
  { value: "studio", label: "Studio" },
  { value: "loft", label: "Loft" },
  { value: "duplex", label: "Duplex" },
  { value: "townhouse", label: "Maison de ville" },
]

const ENERGY_CLASSES = ["A", "B", "C", "D", "E", "F", "G"]

const HEATING_TYPES = [
  { value: "individual_gas", label: "Gaz individuel" },
  { value: "collective_gas", label: "Gaz collectif" },
  { value: "individual_electric", label: "Électrique individuel" },
  { value: "collective_electric", label: "Électrique collectif" },
  { value: "fuel", label: "Fioul" },
  { value: "wood", label: "Bois" },
  { value: "heat_pump", label: "Pompe à chaleur" },
  { value: "district_heating", label: "Chauffage urbain" },
]

export default function NewPropertyPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [visitSlots, setVisitSlots] = useState<any[]>([])
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null)

  const [formData, setFormData] = useState<PropertyFormData>({
    title: "",
    description: "",
    address: "",
    city: "",
    postal_code: "",
    latitude: null,
    longitude: null,
    hide_exact_address: false,
    surface: 0,
    construction_year: null,
    price: 0,
    charges: 0,
    deposit: 0,
    property_type: "apartment",
    furnished: false,
    rooms: 1,
    bedrooms: 0,
    bathrooms: 0,
    floor: null,
    total_floors: null,
    balcony: false,
    terrace: false,
    garden: false,
    loggia: false,
    equipped_kitchen: false,
    bathtub: false,
    shower: false,
    dishwasher: false,
    washing_machine: false,
    dryer: false,
    fridge: false,
    oven: false,
    microwave: false,
    air_conditioning: false,
    fireplace: false,
    parking: false,
    cellar: false,
    elevator: false,
    intercom: false,
    digicode: false,
    fees: 0,
    available: true,
    availability_date: "",
    energy_class: "",
    ges_class: "",
    heating_type: "",
    owner_id: "",
  })

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "owner") {
          toast.error("Vous devez être connecté en tant que propriétaire")
          router.push("/login")
          return
        }
        setCurrentUser(user)
        setFormData((prev) => ({ ...prev, owner_id: user.id }))
      } catch (error) {
        console.error("Erreur authentification:", error)
        router.push("/login")
      }
    }

    checkAuth()
  }, [router])

  const handleInputChange = (field: keyof PropertyFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCityChange = (cityValue: string) => {
    // Extraire le nom de la ville et le code postal du format "Ville (CodePostal)"
    const match = cityValue.match(/^(.+?)\s*\((\d{5})\)$/)
    if (match) {
      const [, cityName, postalCode] = match
      setFormData(prev => ({
        ...prev,
        city: cityName,
        postal_code: postalCode
      }))
      
      // Géocoder pour obtenir les coordonnées GPS
      geocodeCity(cityName, postalCode)
    } else {
      setFormData(prev => ({
        ...prev,
        city: cityValue,
        postal_code: ""
      }))
    }
  }

  const geocodeCity = async (city: string, postalCode: string) => {
    try {
      // Utiliser l'API de géocodage (ex: OpenStreetMap Nominatim)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${postalCode} ${city}, France`)}&limit=1`
      )
      const data = await response.json()
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0]
        setFormData(prev => ({
          ...prev,
          latitude: parseFloat(lat),
          longitude: parseFloat(lon)
        }))
      }
    } catch (error) {
      console.error("Erreur géocodage:", error)
    }
  }

  const handleFilesUploaded = (urls: string[] | undefined) => {
    setUploadedImages(Array.isArray(urls) ? urls : [])
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.title && formData.description && formData.address && formData.city && formData.postal_code && formData.price > 0 && formData.surface > 0)
      case 2:
        return uploadedImages.length > 0
      case 3:
        return visitSlots.length > 0
      default:
        return true
    }
  }

  const nextStep = async () => {
    if (validateStep(currentStep)) {
      if (currentStep === 2 && !createdPropertyId) {
        setIsSubmitting(true)
        try {
          const property = await propertyService.createProperty(formData)
          setCreatedPropertyId(property.id)
          if (uploadedImages.length > 0) {
            await propertyService.uploadPropertyImages(property.id, uploadedImages)
          }
          toast.success("Propriété créée, vous pouvez maintenant configurer les créneaux de visite")
        } catch (error: any) {
          toast.error("Erreur lors de la création de la propriété")
          setIsSubmitting(false)
          return
        } finally {
          setIsSubmitting(false)
        }
      }
      setCurrentStep((prev) => prev + 1)
    } else {
      let errorMessage = "Veuillez remplir tous les champs obligatoires"
      if (currentStep === 1) errorMessage = "Veuillez remplir tous les champs obligatoires (titre, description, adresse, prix, surface)"
      else if (currentStep === 2) errorMessage = "Veuillez ajouter au moins une photo de votre bien"
      else if (currentStep === 3) errorMessage = "Veuillez définir au moins un créneau de visite"
      toast.error(errorMessage)
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1)
  }

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      toast.error("Veuillez remplir toutes les étapes obligatoires")
      return
    }

    setIsSubmitting(true)
    try {
      let propertyId = createdPropertyId
      if (!propertyId) {
        const property = await propertyService.createProperty(formData)
        propertyId = property.id
        if (uploadedImages.length > 0) {
          await propertyService.uploadPropertyImages(propertyId, uploadedImages)
        }
      }

      if (visitSlots.length > 0) {
        await propertyService.savePropertyVisitSlots(propertyId, visitSlots)
      }

      toast.success("Annonce créée avec succès !")
      router.push(`/owner/properties/${propertyId}/success`)
    } catch (error: any) {
      console.error("Erreur création propriété:", error)
      toast.error("Erreur lors de la création de l'annonce")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStepProgress = () => (currentStep / 4) * 100
  const isStepCompleted = (step: number) => step < currentStep

  if (!currentUser) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Vérification des permissions...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* En-tête */}
      <div className="mb-8">
        <Link href="/owner/properties" className="text-blue-600 hover:underline flex items-center mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour à mes annonces
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Créer une nouvelle annonce</h1>
            <p className="text-gray-600 mt-2">Étape {currentStep} sur 4</p>
          </div>
          <div className="text-right">
            <Progress value={getStepProgress()} className="w-32 mb-2" />
            <p className="text-sm text-gray-500">{Math.round(getStepProgress())}% complété</p>
          </div>
        </div>
      </div>

      {/* Indicateur d'étapes */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[
            { step: 1, title: "Informations", icon: Home },
            { step: 2, title: "Photos", icon: Upload },
            { step: 3, title: "Créneaux", icon: Calendar },
            { step: 4, title: "Publication", icon: Check },
          ].map(({ step, title, icon: Icon }) => (
            <div key={step} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  isStepCompleted(step)
                    ? "bg-blue-600 border-blue-600 text-white"
                    : currentStep === step
                      ? "border-blue-600 text-blue-600"
                      : "border-gray-300 text-gray-400"
                }`}
              >
                {isStepCompleted(step) && step < currentStep ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${currentStep === step ? "text-blue-600" : "text-gray-500"}`}>
                  {title}
                </p>
              </div>
              {step < 4 && (
                <div className={`w-24 h-0.5 ml-4 ${isStepCompleted(step) ? "bg-blue-600" : "bg-gray-300"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contenu des étapes */}
      <div className="space-y-6">
        {/* Étape 1: Informations de base */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Home className="h-5 w-5 mr-2" />
                Informations du bien
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Section 1: Informations de base */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Informations de base</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <Label htmlFor="title">Titre de l'annonce *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="Ex: Appartement 3 pièces centre ville"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Décrivez votre bien..."
                      rows={4}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="address">Adresse complète *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      placeholder="15 rue de la République"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="city">Ville *</Label>
                    <CityAutocomplete
                      value={`${formData.city} (${formData.postal_code})`}
                      onChange={handleCityChange}
                      placeholder="Rechercher une ville..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hide_exact_address"
                        checked={formData.hide_exact_address}
                        onCheckedChange={(checked) => handleInputChange("hide_exact_address", checked as boolean)}
                      />
                      <Label htmlFor="hide_exact_address">Masquer l'adresse exacte sur l'annonce publique</Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Caractéristiques du bien */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Caractéristiques du bien</h3>
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
                        {PROPERTY_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
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

                  <div className="flex items-center space-x-2 pt-8">
                    <Checkbox
                      id="furnished"
                      checked={formData.furnished}
                      onCheckedChange={(checked) => handleInputChange("furnished", checked as boolean)}
                    />
                    <Label htmlFor="furnished">Logement meublé</Label>
                  </div>
                </div>
              </div>

              {/* Section 3: Extérieur */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Extérieur</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="balcony"
                      checked={formData.balcony}
                      onCheckedChange={(checked) => handleInputChange("balcony", checked as boolean)}
                    />
                    <Label htmlFor="balcony">Balcon</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terrace"
                      checked={formData.terrace}
                      onCheckedChange={(checked) => handleInputChange("terrace", checked as boolean)}
                    />
                    <Label htmlFor="terrace">Terrasse</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="garden"
                      checked={formData.garden}
                      onCheckedChange={(checked) => handleInputChange("garden", checked as boolean)}
                    />
                    <Label htmlFor="garden">Jardin</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="loggia"
                      checked={formData.loggia}
                      onCheckedChange={(checked) => handleInputChange("loggia", checked as boolean)}
                    />
                    <Label htmlFor="loggia">Loggia</Label>
                  </div>
                </div>
              </div>

              {/* Section 4: Équipements */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Équipements</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="equipped_kitchen"
                      checked={formData.equipped_kitchen}
                      onCheckedChange={(checked) => handleInputChange("equipped_kitchen", checked as boolean)}
                    />
                    <Label htmlFor="equipped_kitchen">Cuisine équipée</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="bathtub"
                      checked={formData.bathtub}
                      onCheckedChange={(checked) => handleInputChange("bathtub", checked as boolean)}
                    />
                    <Label htmlFor="bathtub">Baignoire</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="shower"
                      checked={formData.shower}
                      onCheckedChange={(checked) => handleInputChange("shower", checked as boolean)}
                    />
                    <Label htmlFor="shower">Douche</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="dishwasher"
                      checked={formData.dishwasher}
                      onCheckedChange={(checked) => handleInputChange("dishwasher", checked as boolean)}
                    />
                    <Label htmlFor="dishwasher">Lave-vaisselle</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="washing_machine"
                      checked={formData.washing_machine}
                      onCheckedChange={(checked) => handleInputChange("washing_machine", checked as boolean)}
                    />
                    <Label htmlFor="washing_machine">Lave-linge</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="dryer"
                      checked={formData.dryer}
                      onCheckedChange={(checked) => handleInputChange("dryer", checked as boolean)}
                    />
                    <Label htmlFor="dryer">Sèche-linge</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="fridge"
                      checked={formData.fridge}
                      onCheckedChange={(checked) => handleInputChange("fridge", checked as boolean)}
                    />
                    <Label htmlFor="fridge">Réfrigérateur</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="oven"
                      checked={formData.oven}
                      onCheckedChange={(checked) => handleInputChange("oven", checked as boolean)}
                    />
                    <Label htmlFor="oven">Four</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="microwave"
                      checked={formData.microwave}
                      onCheckedChange={(checked) => handleInputChange("microwave", checked as boolean)}
                    />
                    <Label htmlFor="microwave">Micro-ondes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="air_conditioning"
                      checked={formData.air_conditioning}
                      onCheckedChange={(checked) => handleInputChange("air_conditioning", checked as boolean)}
                    />
                    <Label htmlFor="air_conditioning">Climatisation</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="fireplace"
                      checked={formData.fireplace}
                      onCheckedChange={(checked) => handleInputChange("fireplace", checked as boolean)}
                    />
                    <Label htmlFor="fireplace">Cheminée</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="parking"
                      checked={formData.parking}
                      onCheckedChange={(checked) => handleInputChange("parking", checked as boolean)}
                    />
                    <Label htmlFor="parking">Parking</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="cellar"
                      checked={formData.cellar}
                      onCheckedChange={(checked) => handleInputChange("cellar", checked as boolean)}
                    />
                    <Label htmlFor="cellar">Cave</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="elevator"
                      checked={formData.elevator}
                      onCheckedChange={(checked) => handleInputChange("elevator", checked as boolean)}
                    />
                    <Label htmlFor="elevator">Ascenseur</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="intercom"
                      checked={formData.intercom}
                      onCheckedChange={(checked) => handleInputChange("intercom", checked as boolean)}
                    />
                    <Label htmlFor="intercom">Interphone</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="digicode"
                      checked={formData.digicode}
                      onCheckedChange={(checked) => handleInputChange("digicode", checked as boolean)}
                    />
                    <Label htmlFor="digicode">Digicode</Label>
                  </div>
                </div>
              </div>

              {/* Section 5: Informations financières */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Informations financières</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="price">Loyer hors charges (€) *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price || ""}
                      onChange={(e) => handleInputChange("price", Number(e.target.value))}
                      placeholder="1200"
                    />
                  </div>
                  <div>
                    <Label htmlFor="charges">Montant des charges (€)</Label>
                    <Input
                      id="charges"
                      type="number"
                      value={formData.charges || ""}
                      onChange={(e) => handleInputChange("charges", Number(e.target.value))}
                      placeholder="150"
                    />
                  </div>
                  <div>
                    <Label htmlFor="deposit">Dépôt de garantie (€)</Label>
                    <Input
                      id="deposit"
                      type="number"
                      value={formData.deposit || ""}
                      onChange={(e) => handleInputChange("deposit", Number(e.target.value))}
                      placeholder="1200"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fees">Frais d'agence (€)</Label>
                    <Input
                      id="fees"
                      type="number"
                      value={formData.fees || ""}
                      onChange={(e) => handleInputChange("fees", Number(e.target.value))}
                      placeholder="500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 6: Disponibilité */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Disponibilité</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="availability_date">Date de disponibilité</Label>
                    <Input
                      id="availability_date"
                      type="date"
                      value={formData.availability_date}
                      onChange={(e) => handleInputChange("availability_date", e.target.value)}
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-8">
                    <Checkbox
                      id="available"
                      checked={formData.available}
                      onCheckedChange={(checked) => handleInputChange("available", checked as boolean)}
                    />
                    <Label htmlFor="available">Bien disponible à la location</Label>
                  </div>
                </div>
              </div>

              {/* Section 7: Informations énergétiques */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Informations énergétiques</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                        {ENERGY_CLASSES.map((cls) => (
                          <SelectItem key={cls} value={cls}>
                            {cls}
                          </SelectItem>
                        ))}
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
                        {ENERGY_CLASSES.map((cls) => (
                          <SelectItem key={cls} value={cls}>
                            {cls}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="heating_type">Type de chauffage</Label>
                    <Select
                      value={formData.heating_type}
                      onValueChange={(value) => handleInputChange("heating_type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {HEATING_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Étape 2: Photos */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Photos du bien
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload
                onFilesUploaded={handleFilesUploaded}
                maxFiles={10}
                acceptedTypes={["image/*"]}
                folder="properties"
                existingFiles={uploadedImages}
              />
            </CardContent>
          </Card>
        )}

        {/* Étape 3: Créneaux de visite */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Créneaux de visite
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-800 mb-2">📅 Créneaux de visite obligatoires</h3>
                <div className="text-blue-700 text-sm space-y-2">
                  <p>
                    • Au moins <strong>un créneau de visite</strong> doit être défini pour publier votre annonce
                  </p>
                  <p>• Les locataires pourront choisir parmi ces créneaux pour planifier leur visite</p>
                  <p>• Vous pourrez modifier ces créneaux plus tard depuis la page de gestion du bien</p>
                </div>
              </div>
              {!createdPropertyId ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Création de la propriété en cours...</p>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mt-2"></div>
                </div>
              ) : (
                <VisitScheduler
                  propertyId={createdPropertyId}
                  visitSlots={visitSlots}
                  mode="creation"
                  onSlotsChange={setVisitSlots}
                />
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Étape 4: Publication */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Check className="h-5 w-5 mr-2" />
                Récapitulatif et publication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">Votre annonce est prête !</h3>
                <p className="text-green-700 text-sm">
                  Vérifiez les informations ci-dessous avant de publier votre annonce.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Informations principales</h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Titre:</strong> {formData.title}
                    </p>
                    <p>
                      <strong>Adresse:</strong> {formData.address}, {formData.city}
                    </p>
                    <p>
                      <strong>Loyer:</strong> {formData.price} €/mois{" "}
                      {formData.charges > 0 ? `+ ${formData.charges}€ de charges` : ""}
                    </p>
                    <p>
                      <strong>Surface:</strong> {formData.surface} m²
                    </p>
                    <p>
                      <strong>Type:</strong> {PROPERTY_TYPES.find((t) => t.value === formData.property_type)?.label}
                    </p>
                    <p>
                      <strong>Type de location:</strong> {formData.furnished ? "Meublé" : "Non meublé"}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Statut</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={uploadedImages.length > 0 ? "default" : "secondary"}>
                        {uploadedImages.length > 0 ? "✓" : "○"} Photos ({uploadedImages.length})
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={visitSlots.length > 0 ? "default" : "secondary"}>
                        {visitSlots.length > 0 ? "✓" : "○"} Créneaux ({visitSlots.length})
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Précédent
        </Button>

        <div className="flex gap-2">
          {currentStep < 4 ? (
            <Button onClick={nextStep} disabled={isSubmitting}>
              Suivant
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Publication..." : "Publier l'annonce"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
