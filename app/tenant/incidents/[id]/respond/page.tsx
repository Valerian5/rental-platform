"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Send, Upload, X } from "lucide-react"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"
import Link from "next/link"

export default function RespondIncidentPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [incident, setIncident] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [attachmentPreviews, setAttachmentPreviews] = useState<string[]>([])

  useEffect(() => {
    const initializeData = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "tenant") {
          router.push("/login")
          return
        }

        setCurrentUser(user)
        await loadIncident(params.id)
      } catch (error) {
        console.error("Erreur initialisation:", error)
        toast.error("Erreur lors du chargement")
      } finally {
        setIsLoading(false)
      }
    }

    initializeData()
  }, [params.id, router])

  const loadIncident = async (incidentId: string) => {
    try {
      const res = await fetch(`/api/incidents/${incidentId}`)
      const data = await res.json()

      if (data.success) {
        setIncident(data.incident)
      } else {
        toast.error("Incident non trouvé")
        router.push("/tenant/rental-management")
      }
    } catch (error) {
      console.error("Erreur chargement incident:", error)
      toast.error("Erreur lors du chargement")
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    if (attachments.length + files.length > 3) {
      toast.error("Maximum 3 fichiers autorisés")
      return
    }

    const validFiles = files.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} est trop volumineux (max 5MB)`)
        return false
      }
      return true
    })

    setAttachments((prev) => [...prev, ...validFiles])

    // Créer les aperçus pour les images
    validFiles.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setAttachmentPreviews((prev) => [...prev, e.target?.result as string])
        }
        reader.readAsDataURL(file)
      } else {
        setAttachmentPreviews((prev) => [...prev, file.name])
      }
    })
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
    setAttachmentPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim()) {
      toast.error("Veuillez saisir un message")
      return
    }

    setIsSubmitting(true)

    try {
      // Upload des fichiers si nécessaire
      let attachmentUrls: string[] = []
      if (attachments.length > 0) {
        const formData = new FormData()
        attachments.forEach((file) => {
          formData.append("file", file)
        })

        const uploadRes = await fetch("/api/upload-supabase", {
          method: "POST",
          body: formData,
        })

        const uploadData = await uploadRes.json()
        if (uploadRes.ok && uploadData.success) {
          attachmentUrls = uploadData.urls || []
        }
      }

      // Envoyer la réponse
      const responseData = {
        incident_id: params.id,
        user_id: currentUser.id,
        message: message.trim(),
        user_type: "tenant",
        attachments: attachmentUrls.length > 0 ? attachmentUrls : null,
      }

      const res = await fetch(`/api/incidents/${params.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(responseData),
      })

      if (!res.ok) throw new Error("Erreur envoi réponse")

      toast.success("Réponse envoyée avec succès")
      router.push(`/tenant/incidents/${params.id}`)
    } catch (error) {
      console.error("Erreur envoi réponse:", error)
      toast.error("Erreur lors de l'envoi de la réponse")
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
        <Link href={`/tenant/incidents/${params.id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold">Répondre à l'incident</h1>
          <p className="text-sm sm:text-base text-gray-600">{incident?.title}</p>
        </div>
      </div>

      {/* Formulaire de réponse */}
      <Card>
        <CardHeader>
          <CardTitle>Votre réponse</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ajoutez des informations complémentaires, des précisions ou des questions..."
                rows={6}
                required
              />
            </div>

            {/* Pièces jointes */}
            <div className="space-y-2">
              <Label>Pièces jointes (optionnel)</Label>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">Cliquez pour ajouter des fichiers</p>
                    <p className="text-xs text-gray-500 mt-1">Images, PDF, Word - Maximum 3 fichiers, 5MB chacun</p>
                  </label>
                </div>

                {attachmentPreviews.length > 0 && (
                  <div className="space-y-2">
                    {attachmentPreviews.map((preview, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          {attachments[index].type.startsWith("image/") ? (
                            <img
                              src={preview || "/placeholder.svg"}
                              alt="Aperçu"
                              className="w-8 h-8 object-cover rounded"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-xs">
                              📄
                            </div>
                          )}
                          <span className="text-sm truncate">{attachments[index].name}</span>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeAttachment(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
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
              <Link href={`/tenant/incidents/${params.id}`} className="sm:w-auto">
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
