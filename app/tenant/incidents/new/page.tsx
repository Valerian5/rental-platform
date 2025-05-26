"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Upload, AlertTriangle, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function NewIncidentPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium",
    photos: [] as File[],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simuler l'envoi
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Rediriger vers la page de gestion locative
      router.push("/tenant/rental-management?tab=incidents&success=incident-reported")
    } catch (error) {
      console.error("Erreur lors du signalement:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, ...newFiles].slice(0, 5), // Max 5 photos
      }))
    }
  }

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }))
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-8">
        <Link href="/tenant/rental-management" className="text-blue-600 hover:underline flex items-center mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour à mon espace locataire
        </Link>
        <h1 className="text-3xl font-bold mb-2">Signaler un incident</h1>
        <p className="text-muted-foreground">Décrivez le problème rencontré dans votre logement</p>
      </div>

      <Alert className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Urgence :</strong> En cas d'urgence (fuite importante, panne électrique, etc.), contactez
          immédiatement votre propriétaire par téléphone.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Détails de l'incident</CardTitle>
          <CardDescription>
            Plus vous fournirez d'informations, plus votre propriétaire pourra intervenir rapidement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Titre de l'incident *</Label>
              <Input
                id="title"
                placeholder="Ex: Fuite d'eau dans la salle de bain"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Catégorie *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une catégorie" />
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

            <div className="space-y-3">
              <Label>Niveau de priorité *</Label>
              <RadioGroup
                value={formData.priority}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="low" />
                  <Label htmlFor="low" className="flex items-center">
                    <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                    Faible - Peut attendre quelques jours
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="medium" />
                  <Label htmlFor="medium" className="flex items-center">
                    <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                    Moyen - À traiter dans la semaine
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="high" />
                  <Label htmlFor="high" className="flex items-center">
                    <span className="w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
                    Élevé - À traiter rapidement
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="urgent" id="urgent" />
                  <Label htmlFor="urgent" className="flex items-center">
                    <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                    Urgent - Intervention immédiate requise
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description détaillée *</Label>
              <Textarea
                id="description"
                placeholder="Décrivez le problème en détail : où se situe-t-il, depuis quand, dans quelles circonstances..."
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-3">
              <Label>Photos (optionnel)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Camera className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-muted-foreground mb-3">
                  Ajoutez des photos pour aider à comprendre le problème
                </p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <Button type="button" variant="outline" size="sm" asChild>
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Choisir des photos
                  </label>
                </Button>
                <p className="text-xs text-muted-foreground mt-2">Maximum 5 photos, formats JPG, PNG</p>
              </div>

              {formData.photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(photo) || "/placeholder.svg"}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                        onClick={() => removePhoto(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Que se passe-t-il après ?</h4>
              <ul className="text-sm space-y-1">
                <li>• Votre propriétaire sera immédiatement notifié</li>
                <li>• Vous recevrez une confirmation par email</li>
                <li>• Le propriétaire vous contactera pour organiser l'intervention</li>
                <li>• Vous pourrez suivre l'avancement dans votre espace locataire</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" className="flex-1" asChild>
                <Link href="/tenant/rental-management">Annuler</Link>
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Envoi en cours..." : "Signaler l'incident"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
