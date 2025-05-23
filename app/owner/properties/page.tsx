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
import { Calendar } from "@/components/ui/calendar"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, Upload, X } from "lucide-react"
import Link from "next/link"
import { propertyService } from "@/lib/property-service"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"

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

  // Critères locataire
  required_income: string
  professional_situation: string
  guarantor_required: boolean
  lease_duration: string
  move_in_date: string
  rent_payment_day: string

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
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [timeSlots, setTimeSlots] = useState<Array<{ start: string; end: string }>>([])

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
    required_income: "",
    professional_situation: "",
    guarantor_required: false,
    lease_duration: "",
    move_in_date: "",
    rent_payment_day: "",
    documents: [],
    visit_availabilities: [],
  })

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "owner") {
          toast.error("Vous devez être connecté en tant que propriétaire")
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

  const addTimeSlot = () => {
    setTimeSlots((prev) => [...prev, { start: "", end: "" }])
  }

  const updateTimeSlot = (index: number, field: "start" | "end", value: string) => {
    setTimeSlots((prev) => prev.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot)))
  }

  const removeTimeSlot = (index: number) => {
    setTimeSlots((prev) => prev.filter((_, i) => i !== index))
  }

  const addAvailability = () => {
    if (selectedDate && timeSlots.length > 0) {
      setFormData((prev) => ({
        ...prev,
        visit_availabilities: [
          ...prev.visit_availabilities,
          {
            date: selectedDate,
            timeSlots: [...timeSlots],
          },
        ],
      }))
      setSelectedDate(undefined)
      setTimeSlots([])
      toast.success("Disponibilité ajoutée")
    }
  }

  const removeAvailability = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      visit_availabilities: prev.visit_availabilities.filter((_, i) => i !== index),
    }))
  }

  const nextStep = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!currentUser) {
      toast.error("Vous devez être connecté pour ajouter un bien")
      return
    }

    setIsLoading(true)

    try {
      const propertyData = {
        title: formData.title,
        description: formData.description,
        address: formData.address,
        city: formData.city,
        postal_code: formData.postal_code,
        hide_exact_address: formData.hide_exact_address,
        surface: Number.parseInt(formData.surface),
        rent_excluding_charges: Number.parseFloat(formData.rent_excluding_charges),
        charges_amount: Number.parseFloat(formData.charges_amount),
        property_type: formData.property_type as "apartment" | "house" | "studio" | "loft",
        rental_type: formData.rental_type as "unfurnished" | "furnished" | "shared",
        construction_year: Number.parseInt(formData.construction_year),
        security_deposit: Number.parseFloat(formData.security_deposit),
        rooms: Number.parseInt(formData.rooms),
        bedrooms: Number.parseInt(formData.bedrooms),
        bathrooms: Number.parseInt(formData.bathrooms),
        exterior_type: formData.exterior_type,
        equipment: formData.equipment,
        energy_class: formData.energy_class,
        ges_class: formData.ges_class,
        heating_type: formData.heating_type,
        required_income: Number.parseFloat(formData.required_income),
        professional_situation: formData.professional_situation,
        guarantor_required: formData.guarantor_required,
        lease_duration: Number.parseInt(formData.lease_duration),
        move_in_date: formData.move_in_date,
        rent_payment_day: Number.parseInt(formData.rent_payment_day),
        owner_id: currentUser.id,
      }

      const newProperty = await propertyService.createProperty(propertyData)

      // Ajouter les disponibilités de visite
      for (const availability of formData.visit_availabilities) {
        for (const timeSlot of availability.timeSlots) {
          await propertyService.addVisitAvailability(
            newProperty.id,
            availability.date.toISOString().split("T")[0],
            timeSlot.start,
            timeSlot.end,
          )
        }
      }

      toast.success("Annonce créée avec succès !")
      router.push(`/owner/properties/${newProperty.id}/success`)
    } catch (error) {
      console.error("Erreur lors de la création de l'annonce:", error)
      toast.error("Erreur lors de la création de l'annonce")
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
            <h2 className="text-2xl font-bold">Critères vis-à-vis du locataire</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="required_income">Revenus minimum requis (€)</Label>
                <Input
                  id="required_income"
                  type="number"
                  value={formData.required_income}
                  onChange={(e) => handleChange("required_income", e.target.value)}
                  placeholder="3000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="professional_situation">Situation professionnelle souhaitée</Label>
                <Input
                  id="professional_situation"
                  value={formData.professional_situation}
                  onChange={(e) => handleChange("professional_situation", e.target.value)}
                  placeholder="CDI, Fonctionnaire, etc."
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="guarantor_required"
                checked={formData.guarantor_required}
                onCheckedChange={(checked) => handleChange("guarantor_required", checked)}
              />
              <Label htmlFor="guarantor_required">Garant requis</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lease_duration">Durée de location (mois)</Label>
                <Input
                  id="lease_duration"
                  type="number"
                  value={formData.lease_duration}
                  onChange={(e) => handleChange("lease_duration", e.target.value)}
                  placeholder="12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="move_in_date">Date d'emménagement</Label>
                <Input
                  id="move_in_date"
                  type="date"
                  value={formData.move_in_date}
                  onChange={(e) => handleChange("move_in_date", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rent_payment_day">Jour de paiement du loyer</Label>
                <Input
                  id="rent_payment_day"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.rent_payment_day}
                  onChange={(e) => handleChange("rent_payment_day", e.target.value)}
                  placeholder="5"
                />
              </div>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Disponibilités pour les visites</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Ajouter une disponibilité</h3>

                <div className="space-y-2">
                  <Label>Sélectionnez une date</Label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border"
                  />
                </div>

                {selectedDate && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Créneaux horaires</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addTimeSlot}>
                        Ajouter un créneau
                      </Button>
                    </div>

                    {timeSlots.map((slot, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          type="time"
                          value={slot.start}
                          onChange={(e) => updateTimeSlot(index, "start", e.target.value)}
                          placeholder="Début"
                        />
                        <span>à</span>
                        <Input
                          type="time"
                          value={slot.end}
                          onChange={(e) => updateTimeSlot(index, "end", e.target.value)}
                          placeholder="Fin"
                        />
                        <Button type="button" variant="destructive" size="sm" onClick={() => removeTimeSlot(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    {timeSlots.length > 0 && (
                      <Button type="button" onClick={addAvailability} className="w-full">
                        Ajouter cette disponibilité
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Disponibilités ajoutées</h3>

                {formData.visit_availabilities.length === 0 ? (
                  <p className="text-gray-500">Aucune disponibilité ajoutée</p>
                ) : (
                  <div className="space-y-2">
                    {formData.visit_availabilities.map((availability, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{availability.date.toLocaleDateString("fr-FR")}</div>
                            <div className="text-sm text-gray-600">
                              {availability.timeSlots.map((slot, i) => (
                                <span key={i}>
                                  {slot.start} - {slot.end}
                                  {i < availability.timeSlots.length - 1 && ", "}
                                </span>
                              ))}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeAvailability(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
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

  const progress = (currentStep / 6) * 100

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
              <span>Étape {currentStep} sur 6</span>
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

            {currentStep < 6 ? (
              <Button type="button" onClick={nextStep}>
                Suivant
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? "Création en cours..." : "Créer l'annonce"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
