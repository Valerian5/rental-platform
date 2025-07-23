"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, Home, Upload } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { authService } from "@/lib/auth-service"
// RÉUTILISE les composants existants
import { FileUpload } from "@/components/file-upload"

// RÉUTILISE les types et constantes du formulaire propriétaire
const PROPERTY_TYPES = [
  { value: "apartment", label: "Appartement" },
  { value: "house", label: "Maison" },
  { value: "studio", label: "Studio" },
  { value: "loft", label: "Loft" },
  { value: "duplex", label: "Duplex" },
  { value: "townhouse", label: "Maison de ville" },
]

const ENERGY_CLASSES = ["A", "B", "C", "D", "E", "F", "G"]

export default function NewAgencyPropertyPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [agency, setAgency] = useState<any>(null)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([])
  const [visitSlots, setVisitSlots] = useState<any[]>([])
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null)

  // RÉUTILISE la structure de données du formulaire propriétaire
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    address: "",
    city: "",
    postal_code: "",
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
    // Champs spécifiques agence
    agency_reference: "",
    owner_id: "", // Propriétaire mandant
    commission_rate: 0,
    exclusive_mandate: false,
    mandate_end_date: "",
    // ... autres champs réutilisés
  })

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "agency") {
          toast.error("Accès non autorisé")
          router.push("/login")
          return
        }
        setCurrentUser(user)

        // Récupérer les informations de l'agence
        const agencyResponse = await fetch(`/api/agencies/${user.agency_id}`)
        const agencyData = await agencyResponse.json()
        if (agencyData.success) {
          setAgency(agencyData.agency)
        }
      } catch (error) {
        console.error("Erreur authentification:", error)
        router.push("/login")
      }
    }

    checkAuth()
  }, [router])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          formData.title &&
          formData.description &&
          formData.address &&
          formData.city &&
          formData.postal_code &&
          formData.price > 0 &&
          formData.surface > 0
        )
      case 2:
        return uploadedImages.length > 0
      case 3:
        return visitSlots.length > 0
      case 4:
        return true // Documents optionnels
      default:
        return true
    }
  }

  const nextStep = async () => {
    if (validateStep(currentStep)) {
      if (currentStep === 2 && !createdPropertyId) {
        // Créer la propriété avec les données agence
        setIsSubmitting(true)
        try {
          const propertyData = {
            ...formData,
            agency_id: currentUser.agency_id,
            created_by: currentUser.id,
          }

          const response = await fetch(`/api/agencies/${currentUser.agency_id}/properties`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(propertyData),
          })

          const result = await response.json()
          if (result.success) {
            setCreatedPropertyId(result.property.id)
            toast.success("Propriété créée, vous pouvez maintenant configurer les créneaux de visite")
          } else {
            throw new Error(result.error)
          }
        } catch (error: any) {
          console.error("Erreur création propriété:", error)
          toast.error("Erreur lors de la création de la propriété")
          setIsSubmitting(false)
          return
        } finally {
          setIsSubmitting(false)
        }
      }
      setCurrentStep((prev) => prev + 1)
    } else {
      toast.error("Veuillez remplir tous les champs obligatoires")
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1)
  }

  const handleSubmit = async () => {
    if (!validateStep(1)) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }

    setIsSubmitting(true)
    try {
      toast.success("Annonce créée avec succès !")
      router.push(`/agency/properties/${createdPropertyId}/success`)
    } catch (error: any) {
      console.error("Erreur création propriété:", error)
      toast.error("Erreur lors de la création de l'annonce")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!currentUser || !agency) {
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
      {/* En-tête avec branding agence */}
      <div className="mb-8">
        <Link href="/agency/properties" className="text-blue-600 hover:underline flex items-center mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour au portefeuille
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ajouter un bien</h1>
            <p className="text-gray-600 mt-2">
              Étape {currentStep} sur 5 - {agency.name}
            </p>
          </div>
          <div className="text-right">
            <Progress value={(currentStep / 5) * 100} className="w-32 mb-2" />
            <p className="text-sm text-gray-500">{Math.round((currentStep / 5) * 100)}% complété</p>
          </div>
        </div>
      </div>

      {/* RÉUTILISE la structure du formulaire propriétaire avec adaptations agence */}
      <div className="space-y-6">
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Home className="h-5 w-5 mr-2" />
                Informations du bien
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Champs spécifiques agence */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Informations agence</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="agency_reference">Référence agence</Label>
                    <Input
                      id="agency_reference"
                      value={formData.agency_reference}
                      onChange={(e) => handleInputChange("agency_reference", e.target.value)}
                      placeholder="REF-2024-001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="commission_rate">Taux de commission (%)</Label>
                    <Input
                      id="commission_rate"
                      type="number"
                      step="0.1"
                      value={formData.commission_rate}
                      onChange={(e) => handleInputChange("commission_rate", Number.parseFloat(e.target.value))}
                      placeholder="5.0"
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center space-x-2">
                  <Checkbox
                    id="exclusive_mandate"
                    checked={formData.exclusive_mandate}
                    onCheckedChange={(checked) => handleInputChange("exclusive_mandate", checked)}
                  />
                  <Label htmlFor="exclusive_mandate">Mandat exclusif</Label>
                </div>
              </div>

              {/* RÉUTILISE les champs du formulaire propriétaire */}
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
                      placeholder="Décrivez le bien..."
                      rows={4}
                    />
                  </div>

                  {/* ... Autres champs réutilisés du formulaire propriétaire ... */}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* RÉUTILISE les autres étapes du formulaire propriétaire */}
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
                onFilesUploaded={setUploadedImages}
                maxFiles={10}
                acceptedTypes={["image/*"]}
                folder="agency-properties"
                existingFiles={uploadedImages}
              />
            </CardContent>
          </Card>
        )}

        {/* ... Autres étapes ... */}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Précédent
        </Button>

        <div className="flex gap-2">
          {currentStep < 5 ? (
            <Button onClick={nextStep} disabled={!validateStep(currentStep)}>
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
