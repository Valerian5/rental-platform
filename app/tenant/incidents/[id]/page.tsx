"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  AlertTriangle,
  ArrowLeft,
  MessageSquare,
  Calendar,
  User,
  Building,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Camera,
} from "lucide-react"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"
import Link from "next/link"

interface Incident {
  id: string
  title: string
  description: string
  category: string
  priority: string
  status: string
  photos?: string[]
  resolution_notes?: string
  cost?: number
  resolved_date?: string
  created_at: string
  property?: {
    id: string
    title: string
    address: string
    city: string
  }
  lease?: {
    owner: {
      first_name: string
      last_name: string
      email: string
      phone: string
    }
  }
  responses?: Array<{
    id: string
    message: string
    user_type: "owner" | "tenant"
    created_at: string
  }>
}

export default function IncidentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [incident, setIncident] = useState<Incident | null>(null)
  const [responses, setResponses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showResponseDialog, setShowResponseDialog] = useState(false)
  const [showPhotoDialog, setShowPhotoDialog] = useState(false)

  // Formulaire réponse
  const [response, setResponse] = useState({
    message: "",
  })

  // Formulaire photos
  const [photos, setPhotos] = useState<FileList | null>(null)

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

  // Supabase Realtime pour les réponses en temps réel
  useEffect(() => {
    if (!incident?.id) return

    console.log("🔌 [TENANT REALTIME] Connexion Realtime pour incident:", incident.id)
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const channel = supabase
      .channel(`incident_responses_${incident.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incident_responses',
          filter: `incident_id=eq.${incident.id}`
        },
        (payload) => {
          console.log("📡 [TENANT REALTIME] Changement détecté:", payload)
          
          if (payload.eventType === 'INSERT') {
            console.log("✅ [TENANT REALTIME] Nouvelle réponse ajoutée:", payload.new)
            // Vérifier si la réponse existe déjà pour éviter les doublons
            setResponses(prev => {
              const exists = prev.some(r => r.id === payload.new.id)
              if (exists) {
                console.log("⚠️ [TENANT REALTIME] Réponse déjà présente, ignorée")
                return prev
              }
              // Mettre à jour l'état local directement
              const newResponse = {
                id: payload.new.id,
                message: payload.new.message,
                user_type: payload.new.author_type,
                user_id: payload.new.author_id,
                user_name: payload.new.author_name || "Utilisateur",
                created_at: payload.new.created_at,
                attachments: payload.new.attachments || [],
              }
              return [...prev, newResponse]
            })
          } else if (payload.eventType === 'DELETE') {
            console.log("🗑️ [TENANT REALTIME] Réponse supprimée:", payload.old)
            // Supprimer de l'état local
            setResponses(prev => prev.filter(r => r.id !== payload.old.id))
          } else if (payload.eventType === 'UPDATE') {
            console.log("🔄 [TENANT REALTIME] Réponse mise à jour:", payload.new)
            // Mettre à jour dans l'état local
            setResponses(prev => prev.map(r => 
              r.id === payload.new.id 
                ? {
                    ...r,
                    message: payload.new.message,
                    user_name: payload.new.author_name || r.user_name,
                    attachments: payload.new.attachments || r.attachments,
                  }
                : r
            ))
          }
        }
      )
      .subscribe()

    return () => {
      console.log("🔌 [TENANT REALTIME] Déconnexion Realtime")
      supabase.removeChannel(channel)
    }
  }, [incident?.id])

  const loadIncident = async (incidentId: string) => {
    try {
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(7)
      console.log("🔍 [TENANT INCIDENT DETAIL] Chargement incident:", incidentId, "timestamp:", timestamp, "randomId:", randomId)
      const res = await fetch(`/api/incidents/${incidentId}?t=${timestamp}&r=${randomId}`, { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      const data = await res.json()

      console.log("📊 [TENANT INCIDENT DETAIL] Réponse brute API:", {
        timestamp: data.timestamp,
        responseCount: data.incident?.responses?.length || 0,
        responseIds: data.incident?.responses?.map((r: any) => r.id) || [],
        responseMessages: data.incident?.responses?.map((r: any) => ({ id: r.id, message: r.message?.substring(0, 50), created_at: r.created_at })) || []
      })

      if (data.success) {
        console.log("✅ [TENANT INCIDENT DETAIL] Mise à jour état React avec", data.incident.responses?.length || 0, "réponses")
        setIncident(data.incident)
        setResponses(data.incident.responses || [])
        
        // Vérification supplémentaire pour s'assurer que les réponses sont bien chargées
        if (data.incident.responses && data.incident.responses.length > 0) {
          console.log("✅ [TENANT INCIDENT DETAIL] Réponses chargées avec succès:", data.incident.responses.length)
        } else {
          console.log("⚠️ [TENANT INCIDENT DETAIL] Aucune réponse trouvée")
        }
      } else {
        console.error("❌ [TENANT INCIDENT DETAIL] Erreur API:", data.error)
        toast.error("Incident non trouvé")
        router.push("/tenant/rental-management/incidents")
      }
    } catch (error) {
      console.error("❌ [TENANT INCIDENT DETAIL] Erreur fetch:", error)
      toast.error("Erreur lors du chargement")
    }
  }

  const handleSendResponse = async () => {
    if (!response.message) {
      toast.error("Veuillez saisir un message")
      return
    }

    try {
      const responseData = {
        incident_id: incident?.id,
        user_id: currentUser?.id,
        message: response.message,
        user_type: "tenant",
      }

      const res = await fetch(`/api/incidents/${incident?.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(responseData),
      })

      if (!res.ok) throw new Error("Erreur envoi réponse")

      const data = await res.json()
      
      // Ne pas ajouter localement - laisser le Realtime s'en charger
      // pour éviter les doublons
      console.log("✅ [TENANT INCIDENT DETAIL] Réponse envoyée - Realtime va mettre à jour l'affichage")

      toast.success("Réponse envoyée avec succès")
      setResponse({ message: "" })
      setShowResponseDialog(false)
    } catch (error) {
      toast.error("Erreur lors de l'envoi de la réponse")
    }
  }

  const handleAddPhotos = async () => {
    if (!photos || photos.length === 0) {
      toast.error("Veuillez sélectionner des photos")
      return
    }

    try {
      const formData = new FormData()
      Array.from(photos).forEach((photo) => {
        formData.append("photos", photo)
      })

      const res = await fetch(`/api/incidents/${incident?.id}/photos`, {
        method: "POST",
        body: formData,
      })

      if (!res.ok) throw new Error("Erreur ajout photos")

      toast.success("Photos ajoutées avec succès")
      setPhotos(null)
      setShowPhotoDialog(false)

      console.log("✅ [TENANT INCIDENT DETAIL] Réponse envoyée - Realtime va mettre à jour l'affichage")
    } catch (error) {
      toast.error("Erreur lors de l'ajout des photos")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return <Badge className="bg-green-600">Résolu</Badge>
      case "in_progress":
        return <Badge className="bg-orange-600">En cours</Badge>
      case "reported":
        return <Badge variant="secondary">Signalé</Badge>
      case "closed":
        return <Badge variant="outline">Fermé</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="destructive">Urgent</Badge>
      case "high":
        return <Badge className="bg-orange-600">Élevé</Badge>
      case "medium":
        return <Badge variant="secondary">Moyen</Badge>
      case "low":
        return <Badge variant="outline">Faible</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  const getCategoryLabel = (category: string) => {
    const categories = {
      plumbing: "Plomberie",
      electrical: "Électricité",
      heating: "Chauffage",
      security: "Sécurité",
      other: "Autre",
    }
    return categories[category as keyof typeof categories] || category
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case "high":
        return <AlertCircle className="h-5 w-5 text-orange-600" />
      case "medium":
        return <Clock className="h-5 w-5 text-yellow-600" />
      case "low":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Chargement de l'incident...</p>
        </div>
      </div>
    )
  }

  if (!incident) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 mx-auto text-gray-300" />
          <p className="text-gray-600">Incident non trouvé</p>
          <Link href="/tenant/rental-management">
            <Button>Retour à mes incidents</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/tenant/rental-management/incidents">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{incident.title}</h1>
            {getStatusBadge(incident.status)}
            {getPriorityBadge(incident.priority)}
          </div>
          <p className="text-gray-600">
            Signalé le {new Date(incident.created_at).toLocaleDateString("fr-FR")} à{" "}
            {new Date(incident.created_at).toLocaleTimeString("fr-FR")}
          </p>
        </div>

        {incident.status !== "resolved" && incident.status !== "closed" && (
          <div className="flex gap-2">
            <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Répondre
                </Button>
              </DialogTrigger>
            </Dialog>

            <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Camera className="h-4 w-4 mr-2" />
                  Ajouter photos
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contenu principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{incident.description}</p>
            </CardContent>
          </Card>

          {/* Photos */}
          {incident.photos && incident.photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Photos ({incident.photos.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {incident.photos.map((photo: string, index: number) => (
                    <div key={index} className="aspect-square">
                      <img
                        src={photo.startsWith("http") ? photo : `/api/documents/${photo}`}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg border cursor-pointer hover:opacity-80"
                        onClick={() =>
                          window.open(photo.startsWith("http") ? photo : `/api/documents/${photo}`, "_blank")
                        }
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg?height=200&width=200&text=Image+non+disponible"
                        }}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Historique des échanges */}
          <Card>
            <CardHeader>
              <CardTitle>Historique des échanges</CardTitle>
            </CardHeader>
            <CardContent>
              {responses.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucun échange pour le moment</p>
              ) : (
                <div className="space-y-4">
                  {responses.map((resp: any, index: number) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg ${resp.user_type === "owner" ? "bg-blue-50 ml-8" : "bg-gray-50 mr-8"}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${resp.user_type === "owner" ? "bg-blue-600" : "bg-gray-600"}`}
                          >
                            {resp.user_type === "owner" ? "P" : "L"}
                          </div>
                          <span className="font-medium">
                            {resp.user_type === "owner" ? "Propriétaire" : "Vous"}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(resp.created_at).toLocaleDateString("fr-FR")} à{" "}
                          {new Date(resp.created_at).toLocaleTimeString("fr-FR")}
                        </span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{resp.message}</p>
                      {resp.attachments && resp.attachments.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {resp.attachments.map((attachment: string, i: number) => (
                            <img
                              key={i}
                              src={attachment || "/placeholder.svg"}
                              alt={`Pièce jointe ${i + 1}`}
                              className="w-16 h-16 object-cover rounded border cursor-pointer"
                              onClick={() => window.open(attachment, "_blank")}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Résolution */}
          {incident.resolution_notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-green-700">Résolution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 mb-2">{incident.resolution_notes}</p>
                  {incident.cost && (
                    <p className="text-green-800">
                      <strong>Coût :</strong> {incident.cost}€
                    </p>
                  )}
                  {incident.resolved_date && (
                    <p className="text-sm text-green-600 mt-2">
                      Résolu le {new Date(incident.resolved_date).toLocaleDateString("fr-FR")}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Informations */}
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Catégorie</label>
                <p className="font-medium">{getCategoryLabel(incident.category)}</p>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium text-gray-600">Priorité</label>
                <div className="flex items-center gap-2 mt-1">
                  {getPriorityIcon(incident.priority)}
                  <span className="font-medium">{incident.priority}</span>
                </div>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium text-gray-600">Statut</label>
                <div className="mt-1">{getStatusBadge(incident.status)}</div>
              </div>
            </CardContent>
          </Card>

          {/* Propriété */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Propriété
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{incident.property?.title}</p>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  {incident.property?.address}, {incident.property?.city}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Propriétaire */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Propriétaire
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-medium">
                {incident.lease?.owner?.first_name} {incident.lease?.owner?.last_name}
              </p>
              {incident.lease?.owner?.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${incident.lease.owner.email}`} className="text-blue-600 hover:underline">
                    {incident.lease.owner.email}
                  </a>
                </div>
              )}
              {incident.lease?.owner?.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${incident.lease.owner.phone}`} className="text-blue-600 hover:underline">
                    {incident.lease.owner.phone}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions rapides */}
          {incident.status !== "resolved" && incident.status !== "closed" && (
            <Card>
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => setShowResponseDialog(true)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Répondre au propriétaire
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => setShowPhotoDialog(true)}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Ajouter des photos
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialog Réponse */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Répondre à l'incident</DialogTitle>
            <DialogDescription>Envoyer une réponse au propriétaire</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Message *</label>
              <Textarea
                value={response.message}
                onChange={(e) => setResponse({ ...response, message: e.target.value })}
                placeholder="Votre réponse au propriétaire..."
                rows={4}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSendResponse} className="flex-1">
                Envoyer
              </Button>
              <Button variant="outline" onClick={() => setShowResponseDialog(false)}>
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Photos */}
      <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter des photos</DialogTitle>
            <DialogDescription>Ajouter de nouvelles photos à cet incident</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Photos *</label>
              <Input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setPhotos(e.target.files)}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleAddPhotos} className="flex-1">
                <Camera className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
              <Button variant="outline" onClick={() => setShowPhotoDialog(false)}>
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
