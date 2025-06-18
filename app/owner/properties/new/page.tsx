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
import { ArrowLeft, ArrowRight, Home, Upload, FileText, Check } from "lucide-react"
import Link from "next/link"
import { propertyService } from "@/lib/property-service"
import { authService } from "@/lib/auth-service"
import { FileUpload } from "@/components/file-upload"
import { PropertyDocumentsUpload } from "@/components/property-documents-upload"
import { toast } from "sonner"

interface PropertyFormData {
  title: string
  description: string
  address: string
  city: string
  postal_code: string
  price: number
  surface: number
  rooms: number
  bedrooms: number
  bathrooms: number
  property_type: string
  furnished: boolean
  available: boolean
  owner_id: string
}

const PROPERTY_TYPES = [
  { value: "apartment", label: "Appartement" },
  { value: "house", label: "Maison" },
  { value: "studio", label: "Studio" },
  { value: "loft", label: "Loft" },
]

export default function NewPropertyPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([])
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null)

  const [formData, setFormData] = useState<PropertyFormData>({
    title: "",
    description: "",
    address: "",
    city: "",
    postal_code: "",
    price: 0,
    surface: 0,
    rooms: 1,
    bedrooms: 0,
    bathrooms: 0,
    property_type: "apartment",
    furnished: false,
    available: true,
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
        return true // Documents optionnels pour l'instant
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
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
      // Créer la propriété
      const property = await propertyService.createProperty(formData)
      setCreatedPropertyId(property.id)

      // Uploader les images si présentes
      if (uploadedImages.length > 0) {
        await propertyService.uploadPropertyImages(property.id, uploadedImages as any)
      }

      toast.success("Annonce créée avec succès !")
      router.push(`/owner/properties/${property.id}/success`)
    } catch (error: any) {
      console.error("Erreur création propriété:", error)
      toast.error("Erreur lors de la création de l'annonce")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStepProgress = () => {
    return (currentStep / 4) * 100
  }

  const isStepCompleted = (step: number) => {
    if (step < currentStep) return true
    if (step === currentStep) return validateStep(step)
    return false
  }

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
            { step: 3, title: "Documents", icon: FileText },
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
                <div className={`w-16 h-0.5 ml-4 ${isStepCompleted(step) ? "bg-blue-600" : "bg-gray-300"}`} />
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
                Informations de base
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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
                  <Label htmlFor="address">Adresse *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="15 rue de la République"
                  />
                </div>

                <div>
                  <Label htmlFor="city">Ville *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="Lyon"
                  />
                </div>

                <div>
                  <Label htmlFor="postal_code">Code postal *</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => handleInputChange("postal_code", e.target.value)}
                    placeholder="69001"
                  />
                </div>

                <div>
                  <Label htmlFor="price">Loyer mensuel (€) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price || ""}
                    onChange={(e) => handleInputChange("price", Number(e.target.value))}
                    placeholder="1200"
                  />
                </div>

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
                  <Label htmlFor="rooms">Nombre de pièces</Label>
                  <Input
                    id="rooms"
                    type="number"
                    value={formData.rooms}
                    onChange={(e) => handleInputChange("rooms", Number(e.target.value))}
                    min="1"
                  />
                </div>

                <div>
                  <Label htmlFor="bedrooms">Chambres</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => handleInputChange("bedrooms", Number(e.target.value))}
                    min="0"
                  />
                </div>

                <div>
                  <Label htmlFor="bathrooms">Salles de bain</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => handleInputChange("bathrooms", Number(e.target.value))}
                    min="0"
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

                <div className="md:col-span-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="furnished"
                      checked={formData.furnished}
                      onCheckedChange={(checked) => handleInputChange("furnished", checked)}
                    />
                    <Label htmlFor="furnished">Logement meublé</Label>
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
                onFilesUploaded={setUploadedImages}
                maxFiles={10}
                acceptedTypes={["image/*"]}
                folder="properties"
                existingFiles={uploadedImages}
              />
            </CardContent>
          </Card>
        )}

        {/* Étape 3: Documents */}
        {currentStep === 3 && createdPropertyId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Documents obligatoires
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PropertyDocumentsUpload
                propertyId={createdPropertyId}
                onDocumentsChange={setUploadedDocuments}
                showRequiredOnly={true}
              />
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
                      <strong>Loyer:</strong> {formData.price} €/mois
                    </p>
                    <p>
                      <strong>Surface:</strong> {formData.surface} m²
                    </p>
                    <p>
                      <strong>Type:</strong> {PROPERTY_TYPES.find((t) => t.value === formData.property_type)?.label}
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
                      <Badge variant={uploadedDocuments.length > 0 ? "default" : "secondary"}>
                        {uploadedDocuments.length > 0 ? "✓" : "○"} Documents ({uploadedDocuments.length})
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
