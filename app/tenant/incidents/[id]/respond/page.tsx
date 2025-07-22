"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Send, Upload, X, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"

export default function RespondToIncidentPage() {
  const params = useParams()
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [incident, setIncident] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "tenant") {
          toast.error("Accès non autorisé")
          router.push("/login")
          return
        }

        setCurrentUser(user)

        // Récupérer les détails de l'incident
        const response = await fetch(`/api/incidents/${params.id}`)
        const data = await response.json()

        if (data.success) {
          setIncident(data.incident)
        } else {
          toast.error("Incident non trouvé")
          router.push("/tenant/rental-management?tab=incidents")
        }
      } catch (error) {
        console.error("Erreur:", error)
        toast.error("Erreur lors du chargement")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params.id, router])

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return

    setUploadingFiles(true)
    try {
      const newFiles = Array.from(files)

      // Vérifier la taille et le type des fichiers
      for (const file of newFiles) {
        if (file.size > 10 * 1024 * 1024) {
          // 10MB max
          toast.error(`Le fichier ${file.name} est trop volumineux (max 10MB)`)
          return
        }
        if (!file.type.startsWith("image/")) {
          toast.error(`Le fichier ${file.name} n'est pas une image`)
          return
        }
      }

      // Limiter à 5 fichiers au total
      const totalFiles = attachments.length + newFiles.length
      if (totalFiles > 5) {
        toast.error("Maximum 5 fichiers autorisés")
        return
      }

      setAttachments((prev) => [...prev, ...newFiles])
      toast.success(`${newFiles.length} fichier(s) ajouté(s)`)
    } catch (error) {
      console.error("Erreur upload:", error)
      toast.error("Erreur lors de l'ajout des fichiers")
    } finally {
      setUploadingFiles(false)
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim()) {
      toast.error("Veuillez saisir un message")
      return
    }

    setIsSubmitting(true)

    try {
      // Upload des fichiers d'abord si nécessaire
      const attachmentUrls: string[] = []

      if (attachments.length > 0) {
        for (const file of attachments) {
          const formData = new FormData()
          formData.append("file", file)
          formData.append("folder", "incident-responses")

          const uploadResponse = await fetch("/api/upload-blob", {
            method: "POST",
            body: formData,
          })

          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json()
            attachmentUrls.push(uploadData.url)
          }
        }
      }

      // Envoyer la réponse
      const response = await fetch(`/api/incidents/${params.id}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message.trim(),
          attachments: attachmentUrls,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Réponse envoyée avec succès")
        router.push(`/tenant/incidents/${params.id}`)
      } else {
        toast.error(data.error || "Erreur lors de l'envoi")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de l'envoi de la réponse")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!incident) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">Incident non trouvé</h3>
            <Button asChild>
              <Link href="/tenant/rental-management?tab=incidents">Retour aux incidents</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-8">
        <Link href={`/tenant/incidents/${params.id}`} className="text-blue-600 hover:underline flex items-center mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour à l'incident
        </Link>
        <h1 className="text-3xl font-bold mb-2">Répondre à l'incident</h1>
        <p className="text-muted-foreground">{incident.title}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ajouter un message</CardTitle>
          <CardDescription>Communiquez avec votre propriétaire concernant cet incident</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                placeholder="Décrivez l'évolution de la situation, posez vos questions ou apportez des précisions..."
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground">Soyez précis et courtois dans votre communication</p>
            </div>

            <div className="space-y-3">
              <Label>Pièces jointes (optionnel)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Camera className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-muted-foreground mb-3">Ajoutez des photos pour illustrer votre message</p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  id="file-upload"
                  disabled={uploadingFiles}
                />
                <Button type="button" variant="outline" size="sm" asChild disabled={uploadingFiles}>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadingFiles ? "Ajout en cours..." : "Choisir des photos"}
                  </label>
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Maximum 5 photos, formats JPG, PNG (max 10MB chacune)
                </p>
              </div>

              {attachments.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {attachments.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file) || "/placeholder.svg"}
                        alt={`Pièce jointe ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                        onClick={() => removeAttachment(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <p className="text-xs text-center mt-1 truncate">{file.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">À savoir</h4>
              <ul className="text-sm space-y-1">
                <li>• Votre propriétaire sera notifié de votre message</li>
                <li>• Vous recevrez une notification de sa réponse</li>
                <li>• Restez courtois et professionnel</li>
                <li>• Les photos peuvent aider à mieux comprendre la situation</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" className="flex-1 bg-transparent" asChild>
                <Link href={`/tenant/incidents/${params.id}`}>Annuler</Link>
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting || !message.trim()}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer la réponse
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
