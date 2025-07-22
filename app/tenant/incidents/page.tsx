"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Upload, X, ArrowLeft } from "lucide-react"
import { authService } from "@/lib/auth-service"
import { rentalManagementService } from "@/lib/rental-management-service"
import { toast } from "sonner"
import Link from "next/link"

export default function NewIncidentPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeLease, setActiveLease] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])

  const [incident, setIncident] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium",
  })

  useEffect(() => {
    const initializeData = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "tenant") {
          router.push("/login")
          return
        }

        setCurrentUser(user)

        // Récupérer le bail actif du locataire
        const res = await fetch(`/api/leases/tenant/${user.id}/active`)
        const data = await res.json()

        if (data.success && data.lease) {
          setActiveLease(data.lease)
        } else {
          toast.error("Aucun bail actif trouvé")
          router.push("/tenant/dashboard")
        }
      } catch (error) {
        console.error("Erreur initialisation:", error)
        toast.error("Erreur lors du chargement")
      } finally {
        setIsLoading(false)
      }
    }

    initializeData()
  }, [router])

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    if (photos.length + files.length > 5) {
      toast.error("Maximum 5 photos autorisées")
      return
    }

    const validFiles = files.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} est trop volumineux (max 5MB)`)
        return false
      }
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} n'est pas une image`)
        return false
      }
      return true
    })

    setPhotos((prev) => [...prev, ...validFiles])

    // Créer les aperçus
    validFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreviews((prev) => [...prev, e.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!incident.title || !incident.description || !incident.category) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }

    setIsSubmitting(true)

    try {
      // Upload des photos si nécessaire
      let photoUrls: string[] = []
      if (photos.length > 0) {
        console.log("📸 Upload de", photos.length, "photos...")

        const formData = new FormData()
        photos.forEach((photo, index) => {
          formData.append(`file`, photo) // Utiliser 'file' au lieu de 'photo_${index}'
        })

        const uploadRes = await fetch("/api/upload-supabase", {
          method: "POST",
          body: formData,
        })

        const uploadData = await uploadRes.json()
        console.log("📸 Résultat upload:", uploadData)

        if (uploadRes.ok && uploadData.success) {
          photoUrls = uploadData.urls || []
          console.log("✅ Photos uploadées:", photoUrls)
        } else {
          console.error("❌ Erreur upload photos:", uploadData)
          toast.error("Erreur lors de l'upload des photos")
        }
      }

      // Créer l'incident
      const incidentData = {
        ...incident,
        property_id: activeLease.property.id,
        lease_id: activeLease.id,
        reported_by: currentUser.id,
        photos: photoUrls.length > 0 ? photoUrls : null, // null au lieu de []
      }

      console.log("📝 Données incident:", incidentData)

      await rentalManagementService.reportIncident(incidentData)

      toast.success("Incident signalé avec succès")
      router.push("/tenant/incidents")
    } catch (error) {
      console.error("Erreur signalement:", error)
      toast.error("Erreur lors du signalement")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Link href="/tenant/incidents">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold">Signaler un incident</h1>
          <p className="text-sm sm:text-base text-gray-600">Décrivez le problème rencontré dans votre logement</p>
        </div>
      </div>

      {/* Informations du logement */}
      {activeLease && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Logement concerné</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-medium">{activeLease.property.title}</p>
              <p className="text-gray-600 text-sm">
                {activeLease.property.address}, {activeLease.property.city}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulaire */}
      <Card>
        <CardHeader>
          <CardTitle>Détails de l'incident</CardTitle>
          <CardDescription>Fournissez le maximum d'informations pour permettre une résolution rapide</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Titre */}
            <div className="space-y-2">
              <Label htmlFor="title">Titre de l'incident *</Label>
              <Input
                id="title"
                value={incident.title}
                onChange={(e) => setIncident({ ...incident, title: e.target.value })}
                placeholder="Ex: Fuite d'eau dans la salle de bain"
                required
              />
            </div>

            {/* Catégorie */}
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie *</Label>
              <Select
                value={incident.category}
                onValueChange={(value) => setIncident({ ...incident, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plumbing">Plomberie</SelectItem>
                  <SelectItem value="electrical">Électricité</SelectItem>
                  <SelectItem value="heating">Chauffage</SelectItem>
                  <SelectItem value="security">Sécurité</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priorité */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priorité</Label>
              <Select
                value={incident.priority}
                onValueChange={(value) => setIncident({ ...incident, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Faible - Peut attendre</SelectItem>
                  <SelectItem value="medium">Moyen - À traiter prochainement</SelectItem>
                  <SelectItem value="high">Élevé - Urgent</SelectItem>
                  <SelectItem value="urgent">Urgent - Intervention immédiate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description détaillée *</Label>
              <Textarea
                id="description"
                value={incident.description}
                onChange={(e) => setIncident({ ...incident, description: e.target.value })}
                placeholder="Décrivez le problème en détail : quand est-il apparu, où se situe-t-il, quelle est son ampleur..."
                rows={5}
                required
              />
            </div>

            {/* Photos */}
            <div className="space-y-2">
              <Label>Photos (optionnel)</Label>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <Upload className="h-6 sm:h-8 w-6 sm:w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm sm:text-base text-gray-600">Cliquez pour ajouter des photos</p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">Maximum 5 photos, 5MB chacune</p>
                  </label>
                </div>

                {photoPreviews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {photoPreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview || "/placeholder.svg"}
                          alt={`Aperçu ${index + 1}`}
                          className="w-full h-24 sm:h-32 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0"
                          onClick={() => removePhoto(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Conseils */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-2">Conseils pour un signalement efficace :</p>
                  <ul className="space-y-1 list-disc list-inside text-xs sm:text-sm">
                    <li>Soyez précis dans votre description</li>
                    <li>Indiquez si le problème s'aggrave</li>
                    <li>Ajoutez des photos si possible</li>
                    <li>Mentionnez si cela affecte votre sécurité</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signalement en cours...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Signaler l'incident
                  </>
                )}
              </Button>
              <Link href="/tenant/incidents" className="sm:w-auto">
                <Button type="button" variant="outline" className="w-full sm:w-auto bg-transparent">
                  Annuler
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
