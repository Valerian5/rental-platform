"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, Upload, X } from "lucide-react"
import Link from "next/link"
import { propertyService } from "@/lib/property-service"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"
import { VisitScheduler } from "@/components/visit-scheduler"

interface FormData {
  // Informations de base
  title: string
  description: string
  address: string
  city: string
  postal_code: string
  hide_exact_address: boolean

  // Caractéristiques du bien
  surface: string
  rent_excluding_charges: string
  charges_amount: string
  property_type: string
  rental_type: string
  construction_year: string
  security_deposit: string
  rooms: string
  bedrooms: string
  bathrooms: string
  exterior_type: string
  equipment: string[]

  // Performance énergétique
  energy_class: string
  ges_class: string
  heating_type: string

  // Documents et disponibilités
  documents: File[]
  visit_availabilities: Array<{
    date: Date
    timeSlots: Array<{ start: string; end: string }>
  }>
}

const EQUIPMENT_OPTIONS = [
  "Cuisine équipée",
  "Baignoire",
  "Douche",
  "Lave-vaisselle",
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
]

const ENERGY_CLASSES = ["A", "B", "C", "D", "E", "F", "G"]

export default function NewPropertyPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [visitSlots, setVisitSlots] = useState<any[]>([])

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    address: "",
    city: "",
    postal_code: "",
    hide_exact_address: false,
    surface: "",
    rent_excluding_charges: "",
    charges_amount: "",
    property_type: "apartment",
    rental_type: "unfurnished",
    construction_year: "",
    security_deposit: "",
    rooms: "",
    bedrooms: "",
    bathrooms: "",
    exterior_type: "",
    equipment: [],
    energy_class: "",
    ges_class: "",
    heating_type: "",
    documents: [],
    visit_availabilities: [],
  })

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "owner") {
          toast.error("Vous devez être connecté en tant que propriétaire", {
            title: "Erreur",
          })
          router.push("/login")
          return
        }
        setCurrentUser(user)
      } catch (error) {
        console.error("Erreur lors de la récupération de l'utilisateur:", error)
        router.push("/login")
      }
    }

    fetchUser()
  }, [router])

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleEquipmentToggle = (equipment: string) => {
    setFormData((prev) => ({
      ...prev,
      equipment: prev.equipment.includes(equipment)
        ? prev.equipment.filter((e) => e !== equipment)
        : [...prev.equipment, equipment],
    }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedImages(Array.from(e.target.files))
    }
  }

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
  }

  const nextStep = () => {
    if (currentStep < 5) {
      // Maintenant 5 étapes au lieu de 6
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error("Le titre est obligatoire", { title: "Erreur" })
      return false
    }
    if (!formData.description.trim()) {
      toast.error("La description est obligatoire", { title: "Erreur" })
      return false
    }
    if (!formData.address.trim()) {
      toast.error("L'adresse est obligatoire", { title: "Erreur" })
      return false
    }
    if (!formData.city.trim()) {
      toast.error("La ville est obligatoire", { title: "Erreur" })
      return false
    }
    if (!formData.surface || Number.parseInt(formData.surface) <= 0) {
      toast.error("La surface doit être supérieure à 0", { title: "Erreur" })
      return false
    }
    if (!formData.rent_excluding_charges || Number.parseFloat(formData.rent_excluding_charges) <= 0) {
      toast.error("Le loyer doit être supérieur à 0", { title: "Erreur" })
      return false
    }
    if (!formData.charges_amount || Number.parseFloat(formData.charges_amount) < 0) {
      toast.error("Le montant des charges doit être positif", { title: "Erreur" })
      return false
    }
    if (!formData.security_deposit || Number.parseFloat(formData.security_deposit) < 0) {
      toast.error("Le dépôt de garantie doit être positif", { title: "Erreur" })
      return false
    }
    if (!formData.rooms || Number.parseInt(formData.rooms) <= 0) {
      toast.error("Le nombre de pièces doit être supérieur à 0", { title: "Erreur" })
      return false
    }

    // VALIDATION OBLIGATOIRE DES CRÉNEAUX
    if (visitSlots.length === 0) {
      toast.error("Vous devez ajouter au moins un créneau de visite", { title: "Erreur" })
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    console.log("🚀 Début de la soumission")

    if (!currentUser) {
      toast.error("Vous devez être connecté pour ajouter un bien", { title: "Erreur" })
      return
    }

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    toast.info("Création de l'annonce en cours...")

    try {
      console.log("📝 Données du formulaire:", formData)

      const propertyData = {
        title: formData.title,
        description: formData.description,
        address: formData.address,
        city: formData.city,
        postal_code: formData.postal_code,
        hide_exact_address: formData.hide_exact_address,
        surface: Number.parseInt(formData.surface),
        price: Number.parseFloat(formData.rent_excluding_charges),
        charges_amount: Number.parseFloat(formData.charges_amount),
        property_type: formData.property_type as "apartment" | "house" | "studio" | "loft",
        rental_type: formData.rental_type as "unfurnished" | "furnished" | "shared",
        construction_year: formData.construction_year ? Number.parseInt(formData.construction_year) : null,
        security_deposit: Number.parseFloat(formData.security_deposit),
        rooms: Number.parseInt(formData.rooms),
        bedrooms: formData.bedrooms ? Number.parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? Number.parseInt(formData.bathrooms) : null,
        exterior_type: formData.exterior_type || null,
        equipment: formData.equipment,
        energy_class: formData.energy_class || null,
        ges_class: formData.ges_class || null,
        heating_type: formData.heating_type || null,
        owner_id: currentUser.id,
        available: true,
        furnished: formData.rental_type === "furnished",
      }

      console.log("🏠 Données de la propriété:", propertyData)

      const newProperty = await propertyService.createProperty(propertyData)
      console.log("✅ Propriété créée:", newProperty)

      // Ajouter les images si elles existent
      if (selectedImages.length > 0) {
        console.log("📸 Upload des images:", selectedImages.length)
        try {
          await propertyService.uploadPropertyImages(newProperty.id, selectedImages)
          console.log("✅ Toutes les images ont été uploadées")
        } catch (imageError) {
          console.error("❌ Erreur lors de l'upload des images:", imageError)
          toast.warning("Annonce créée mais certaines images n'ont pas pu être uploadées")
        }
      }

      // Ajouter les créneaux de visite dans property_visit_slots
      if (visitSlots.length > 0) {
        console.log("📅 Ajout des créneaux personnalisés:", visitSlots)
        await propertyService.savePropertyVisitSlots(newProperty.id, visitSlots)
      }

      toast.success("Annonce créée avec succès !", { duration: 2000 })
      console.log("🎉 Redirection vers la page de succès")
      router.push(`/owner/properties/${newProperty.id}/success`)
    } catch (error) {
      console.error("❌ Erreur lors de la création de l'annonce:", error)
      toast.error(`Erreur lors de la création de l'annonce: ${error.message || "Erreur inconnue"}`, {
        title: "Erreur",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Informations de base</h2>

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

            <div className="space-y-2">
              <Label htmlFor="address">Adresse complète *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="123 Rue de la Paix"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hide_address"
                checked={formData.hide_exact_address}
                onCheckedChange={(checked) => handleChange("hide_exact_address", checked)}
              />
              <Label htmlFor="hide_address">Masquer l'adresse exacte sur l'annonce publique</Label>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Photos du bien</h2>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <Label htmlFor="images" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Cliquez pour ajouter des photos
                    </span>
                    <Input
                      id="images"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </Label>
                </div>
              </div>

              {selectedImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(image) || "/placeholder.svg"}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Caractéristiques du bien</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="construction_year">Année de construction</Label>
                <Input
                  id="construction_year"
                  type="number"
                  value={formData.construction_year}
                  onChange={(e) => handleChange("construction_year", e.target.value)}
                  placeholder="2020"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rent_excluding_charges">Loyer hors charges (€) *</Label>
                <Input
                  id="rent_excluding_charges"
                  type="number"
                  value={formData.rent_excluding_charges}
                  onChange={(e) => handleChange("rent_excluding_charges", e.target.value)}
                  placeholder="1000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="charges_amount">Montant des charges (€) *</Label>
                <Input
                  id="charges_amount"
                  type="number"
                  value={formData.charges_amount}
                  onChange={(e) => handleChange("charges_amount", e.target.value)}
                  placeholder="200"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="security_deposit">Dépôt de garantie (€) *</Label>
                <Input
                  id="security_deposit"
                  type="number"
                  value={formData.security_deposit}
                  onChange={(e) => handleChange("security_deposit", e.target.value)}
                  placeholder="1000"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label htmlFor="rental_type">Type de location *</Label>
                <Select value={formData.rental_type} onValueChange={(value) => handleChange("rental_type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unfurnished">Non meublé</SelectItem>
                    <SelectItem value="furnished">Meublé</SelectItem>
                    <SelectItem value="shared">Colocation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Label htmlFor="exterior_type">Extérieur</Label>
              <Select value={formData.exterior_type} onValueChange={(value) => handleChange("exterior_type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aucun">Aucun</SelectItem>
                  <SelectItem value="balcon">Balcon</SelectItem>
                  <SelectItem value="terrasse">Terrasse</SelectItem>
                  <SelectItem value="jardin">Jardin</SelectItem>
                  <SelectItem value="loggia">Loggia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label>Équipements</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {EQUIPMENT_OPTIONS.map((equipment) => (
                  <div key={equipment} className="flex items-center space-x-2">
                    <Checkbox
                      id={equipment}
                      checked={formData.equipment.includes(equipment)}
                      onCheckedChange={() => handleEquipmentToggle(equipment)}
                    />
                    <Label htmlFor={equipment} className="text-sm">
                      {equipment}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Performance énergétique</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="energy_class">Classe énergétique</Label>
                <Select value={formData.energy_class} onValueChange={(value) => handleChange("energy_class", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENERGY_CLASSES.map((classe) => (
                      <SelectItem key={classe} value={classe}>
                        Classe {classe}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ges_class">Classe GES</Label>
                <Select value={formData.ges_class} onValueChange={(value) => handleChange("ges_class", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENERGY_CLASSES.map((classe) => (
                      <SelectItem key={classe} value={classe}>
                        Classe {classe}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="heating_type">Type de chauffage</Label>
              <Select value={formData.heating_type} onValueChange={(value) => handleChange("heating_type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual_electric">Individuel électrique</SelectItem>
                  <SelectItem value="individual_gas">Individuel gaz</SelectItem>
                  <SelectItem value="collective">Collectif</SelectItem>
                  <SelectItem value="heat_pump">Pompe à chaleur</SelectItem>
                  <SelectItem value="wood">Bois</SelectItem>
                  <SelectItem value="fuel">Fioul</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Documents obligatoires</h3>
              <p className="text-sm text-gray-600">
                Vous pourrez ajouter les documents (DPE, CREP, etc.) après la création de l'annonce.
              </p>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Configuration des visites *</h2>

            <div className="bg-orange-50 p-4 rounded-lg mb-6 border border-orange-200">
              <h3 className="font-semibold text-orange-800 mb-2">⚠️ Créneaux obligatoires</h3>
              <p className="text-orange-700 text-sm mb-3">
                Vous devez configurer au moins un créneau de visite pour publier votre annonce. Les locataires pourront
                réserver ces créneaux pour visiter votre bien.
              </p>
              <div className="text-sm text-orange-600">
                💡 Conseil : Ajoutez plusieurs créneaux sur différents jours pour maximiser vos chances de location
              </div>
            </div>

            <VisitScheduler visitSlots={visitSlots} onSlotsChange={setVisitSlots} mode="creation" />

            {visitSlots.length === 0 && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-red-700 text-sm font-medium">
                  ❌ Aucun créneau configuré. Vous devez ajouter au moins un créneau pour continuer.
                </p>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  if (!currentUser) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Chargement...</div>
      </div>
    )
  }

  const progress = (currentStep / 5) * 100 // Maintenant sur 5 étapes

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Link href="/owner/dashboard" className="text-blue-600 hover:underline flex items-center mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Retour au tableau de bord
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Créer une nouvelle annonce</CardTitle>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Étape {currentStep} sur 5</span>
              <span>{Math.round(progress)}% complété</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </CardHeader>
        <CardContent>
          {renderStep()}

          <div className="flex justify-between mt-8">
            <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Précédent
            </Button>

            {currentStep < 5 ? (
              <Button type="button" onClick={nextStep}>
                Suivant
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={isLoading || visitSlots.length === 0}>
                {isLoading ? "Création en cours..." : "Créer l'annonce"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
