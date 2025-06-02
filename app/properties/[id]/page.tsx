"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  MapPin,
  Home,
  Bed,
  Bath,
  Square,
  Phone,
  Mail,
  Heart,
  Send,
  AlertTriangle,
  CheckCircle,
  Wifi,
  Car,
  BuildingIcon as Balcony,
  CableCarIcon as Elevator,
  LockIcon as Security,
  DogIcon as Pet,
} from "lucide-react"
import Link from "next/link"
import { propertyService } from "@/lib/property-service"
import { applicationService } from "@/lib/application-service"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"
import { rentalFileService } from "@/lib/rental-file-service"

export default function PropertyPublicPage() {
  const router = useRouter()
  const params = useParams()
  const [property, setProperty] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [rentalFile, setRentalFile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showApplicationDialog, setShowApplicationDialog] = useState(false)
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false)
  const [applicationData, setApplicationData] = useState({
    message: "",
    income: "",
    profession: "",
    company: "",
    move_in_date: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      console.log("🌐 Chargement de l'annonce publique...")
      setIsLoading(true)
      setError(null)

      try {
        if (!params.id) {
          throw new Error("ID de propriété manquant")
        }

        // Récupérer la propriété
        console.log("📋 Récupération de la propriété publique:", params.id)
        const propertyData = await propertyService.getPublicPropertyById(params.id as string)
        setProperty(propertyData)

        // Récupérer l'utilisateur connecté
        const user = await authService.getCurrentUser()
        setCurrentUser(user)

        // Si l'utilisateur est un locataire, récupérer son dossier
        if (user && user.user_type === "tenant") {
          const fileData = await rentalFileService.getRentalFile(user.id)
          setRentalFile(fileData)
        }

        console.log("✅ Données chargées")
      } catch (error: any) {
        console.error("❌ Erreur lors du chargement:", error)
        setError(error.message || "Erreur lors du chargement de l'annonce")
        toast.error("Erreur lors du chargement de l'annonce")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params.id])

  const nextImage = () => {
    if (property?.property_images?.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % property.property_images.length)
    }
  }

  const prevImage = () => {
    if (property?.property_images?.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + property.property_images.length) % property.property_images.length)
    }
  }

  const handleSendApplication = async () => {
    if (!currentUser) {
      toast.error("Vous devez être connecté pour postuler")
      router.push(`/login?redirect=/properties/${params.id}`)
      return
    }

    if (currentUser.user_type !== "tenant") {
      toast.error("Seuls les locataires peuvent postuler à une annonce")
      return
    }

    // Pré-remplir avec les données du dossier
    if (rentalFile) {
      setApplicationData({
        message: rentalFile.presentation_message || "",
        income: rentalFile.monthly_income?.toString() || "",
        profession: rentalFile.profession || "",
        company: rentalFile.company || "",
        move_in_date: rentalFile.desired_move_date || "",
      })
    }

    setShowApplicationDialog(true)
  }

  const handleSubmitApplication = async () => {
    if (!currentUser || !property) return

    setIsSubmittingApplication(true)

    try {
      const applicationPayload = {
        property_id: property.id,
        tenant_id: currentUser.id,
        message: applicationData.message,
        income: applicationData.income ? Number.parseFloat(applicationData.income) : undefined,
        profession: applicationData.profession,
        company: applicationData.company,
        move_in_date: applicationData.move_in_date,
      }

      await applicationService.createApplication(applicationPayload)

      toast.success("Votre candidature a été envoyée avec succès!")
      setShowApplicationDialog(false)

      // Rediriger vers le tableau de bord
      router.push("/tenant/dashboard?tab=applications")
    } catch (error: any) {
      console.error("❌ Erreur candidature:", error)
      toast.error(error.message || "Erreur lors de l'envoi de la candidature")
    } finally {
      setIsSubmittingApplication(false)
    }
  }

  const handleFavorite = () => {
    toast.info("Fonctionnalité favoris en cours de développement")
  }

  const getCompatibilityCheck = () => {
    if (!rentalFile || !property) return null

    const income = applicationData.income ? Number.parseFloat(applicationData.income) : undefined
    return rentalFileService.checkCompatibility(rentalFile, property, income)
  }

  const compatibilityCheck = getCompatibilityCheck()

  // États de chargement et d'erreur
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600">Chargement de l'annonce...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8">
          <div className="text-center space-y-4">
            <div className="text-red-600 text-lg font-medium">{error || "Annonce non trouvée"}</div>
            <Button onClick={() => router.push("/")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const currentImage = property.property_images?.[currentImageIndex]
  const hasImages = property.property_images && property.property_images.length > 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-blue-600 hover:underline flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour aux annonces
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleFavorite}>
                <Heart className="h-4 w-4 mr-2" />
                Favoris
              </Button>
              <Button size="sm" onClick={handleSendApplication}>
                <Send className="h-4 w-4 mr-2" />
                Envoyer mon dossier
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenu principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            <Card className="overflow-hidden">
              <div className="relative aspect-video bg-gray-200">
                {hasImages ? (
                  <>
                    <img
                      src={currentImage?.url || "/placeholder.svg"}
                      alt={`Photo ${currentImageIndex + 1} de ${property.title}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = `/placeholder.svg?height=400&width=600&text=Image non disponible`
                      }}
                    />
                    {property.property_images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                        >
                          ←
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                        >
                          →
                        </button>
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                          {currentImageIndex + 1} / {property.property_images.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <Home className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p>Aucune photo disponible</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Miniatures */}
              {hasImages && property.property_images.length > 1 && (
                <div className="p-4">
                  <div className="flex gap-2 overflow-x-auto">
                    {property.property_images.map((image: any, index: number) => (
                      <button
                        key={image.id}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                          index === currentImageIndex ? "border-blue-500" : "border-gray-200"
                        }`}
                      >
                        <img
                          src={image.url || "/placeholder.svg"}
                          alt={`Miniature ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = `/placeholder.svg?height=80&width=80&text=${index + 1}`
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Titre et localisation */}
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
                <div className="flex items-center text-gray-600 mb-4">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span>
                    {property.address}, {property.city} {property.postal_code}
                  </span>
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {property.price} € <span className="text-lg font-normal text-gray-500">/ mois</span>
                  {property.charges && <div className="text-lg text-gray-500">+ {property.charges} € de charges</div>}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={property.available ? "default" : "secondary"}>
                  {property.available ? "Disponible" : "Loué"}
                </Badge>
                <Badge variant="outline">
                  {property.property_type === "apartment" && "Appartement"}
                  {property.property_type === "house" && "Maison"}
                  {property.property_type === "studio" && "Studio"}
                  {property.property_type === "loft" && "Loft"}
                </Badge>
                {property.furnished && <Badge variant="outline">Meublé</Badge>}
                {property.floor && <Badge variant="outline">{property.floor}e étage</Badge>}
              </div>
            </div>

            {/* Caractéristiques */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Home className="h-5 w-5 mr-2" />
                  Caractéristiques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="flex items-center space-x-3">
                    <Square className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Surface</p>
                      <p className="font-semibold">{property.surface} m²</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Home className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Pièces</p>
                      <p className="font-semibold">{property.rooms}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Bed className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Chambres</p>
                      <p className="font-semibold">{property.bedrooms || "Non spécifié"}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Bath className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Salles de bain</p>
                      <p className="font-semibold">{property.bathrooms || "Non spécifié"}</p>
                    </div>
                  </div>
                </div>

                {(property.energy_class || property.ges_class) && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-medium mb-3">Performance énergétique</h4>
                    <div className="flex gap-4">
                      {property.energy_class && (
                        <div>
                          <p className="text-sm text-gray-500">Classe énergétique</p>
                          <Badge variant="outline" className="text-lg font-bold">
                            {property.energy_class}
                          </Badge>
                        </div>
                      )}
                      {property.ges_class && (
                        <div>
                          <p className="text-sm text-gray-500">Émissions CO₂</p>
                          <Badge variant="outline" className="text-lg font-bold">
                            {property.ges_class}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Équipements et services */}
            {(property.equipment || property.has_parking || property.has_balcony || property.has_elevator) && (
              <Card>
                <CardHeader>
                  <CardTitle>Équipements et services</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {property.has_parking && (
                      <div className="flex items-center space-x-2">
                        <Car className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Parking</span>
                      </div>
                    )}
                    {property.has_balcony && (
                      <div className="flex items-center space-x-2">
                        <Balcony className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Balcon/Terrasse</span>
                      </div>
                    )}
                    {property.has_elevator && (
                      <div className="flex items-center space-x-2">
                        <Elevator className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Ascenseur</span>
                      </div>
                    )}
                    {property.has_security && (
                      <div className="flex items-center space-x-2">
                        <Security className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Sécurisé</span>
                      </div>
                    )}
                    {property.internet && (
                      <div className="flex items-center space-x-2">
                        <Wifi className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Internet inclus</span>
                      </div>
                    )}
                    {property.pets_allowed && (
                      <div className="flex items-center space-x-2">
                        <Pet className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Animaux acceptés</span>
                      </div>
                    )}
                  </div>

                  {property.equipment && Array.isArray(property.equipment) && property.equipment.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Équipements supplémentaires</h4>
                      <div className="flex flex-wrap gap-2">
                        {property.equipment.map((item: string, index: number) => (
                          <Badge key={index} variant="secondary">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{property.description}</p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact propriétaire */}
            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {property.owner && (
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {property.owner.first_name} {property.owner.last_name}
                      </p>
                      <p className="text-sm text-gray-500">Propriétaire</p>
                    </div>

                    {property.owner.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{property.owner.phone}</span>
                      </div>
                    )}

                    {property.owner.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{property.owner.email}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Button className="w-full" onClick={handleSendApplication}>
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer mon dossier
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Phone className="h-4 w-4 mr-2" />
                    Contacter le propriétaire
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Vérification du dossier pour les locataires connectés */}
            {currentUser && currentUser.user_type === "tenant" && compatibilityCheck && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {compatibilityCheck.compatible ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
                    )}
                    Compatibilité de votre dossier
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Score de compatibilité</span>
                      <Badge variant={compatibilityCheck.score >= 70 ? "default" : "secondary"}>
                        {compatibilityCheck.score}%
                      </Badge>
                    </div>

                    {compatibilityCheck.warnings.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Points d'attention :</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {compatibilityCheck.warnings.map((warning, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-orange-500 mr-2">•</span>
                              {warning}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {!compatibilityCheck.compatible && (
                      <p className="text-sm text-orange-600">
                        Votre dossier présente quelques points à améliorer, mais vous pouvez tout de même postuler.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Informations complémentaires */}
            <Card>
              <CardHeader>
                <CardTitle>Informations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Publié le</span>
                    <span className="text-sm font-medium">
                      {new Date(property.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Référence</span>
                    <span className="text-sm font-mono text-gray-500">{property.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  {property.available_from && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Disponible à partir du</span>
                      <span className="text-sm font-medium">
                        {new Date(property.available_from).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialog de candidature */}
      <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Envoyer votre candidature</DialogTitle>
            <DialogDescription>
              Complétez les informations suivantes pour envoyer votre dossier de location.
            </DialogDescription>
          </DialogHeader>

          {compatibilityCheck && (
            <div
              className={`p-3 rounded-lg border ${
                compatibilityCheck.compatible ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"
              }`}
            >
              <div className="flex items-start">
                {compatibilityCheck.compatible ? (
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-orange-600 mr-2 mt-0.5" />
                )}
                <div className="text-sm">
                  <p
                    className={`font-medium mb-1 ${
                      compatibilityCheck.compatible ? "text-green-800" : "text-orange-800"
                    }`}
                  >
                    Score de compatibilité : {compatibilityCheck.score}%
                  </p>

                  {compatibilityCheck.warnings.length > 0 && (
                    <div className="mb-2">
                      <p className="font-medium text-orange-800">Points d'attention :</p>
                      <ul className="text-orange-700 space-y-1">
                        {compatibilityCheck.warnings.map((warning, index) => (
                          <li key={index}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {compatibilityCheck.recommendations.length > 0 && (
                    <div>
                      <p className="font-medium text-blue-800">Recommandations :</p>
                      <ul className="text-blue-700 space-y-1">
                        {compatibilityCheck.recommendations.map((rec, index) => (
                          <li key={index}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="message">Message de motivation</Label>
              <Textarea
                id="message"
                placeholder="Présentez-vous et expliquez pourquoi ce logement vous intéresse..."
                value={applicationData.message}
                onChange={(e) => setApplicationData({ ...applicationData, message: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="income">Revenus mensuels (€)</Label>
                <Input
                  id="income"
                  type="number"
                  placeholder="3000"
                  value={applicationData.income}
                  onChange={(e) => setApplicationData({ ...applicationData, income: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="profession">Profession</Label>
                <Input
                  id="profession"
                  placeholder="Ingénieur"
                  value={applicationData.profession}
                  onChange={(e) => setApplicationData({ ...applicationData, profession: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="company">Entreprise</Label>
              <Input
                id="company"
                placeholder="Nom de l'entreprise"
                value={applicationData.company}
                onChange={(e) => setApplicationData({ ...applicationData, company: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="move_in_date">Date d'emménagement souhaitée</Label>
              <Input
                id="move_in_date"
                type="date"
                value={applicationData.move_in_date}
                onChange={(e) => setApplicationData({ ...applicationData, move_in_date: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApplicationDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmitApplication} disabled={isSubmittingApplication}>
              {isSubmittingApplication ? "Envoi..." : "Envoyer ma candidature"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
