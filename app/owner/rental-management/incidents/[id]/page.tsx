"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
} from "lucide-react"
import { authService } from "@/lib/auth-service"
import { rentalManagementService } from "@/lib/rental-management-service"
import { toast } from "sonner"
import Link from "next/link"
import IncidentTicketing from "@/components/incident-ticketing"
import IncidentPriorityManager from "@/components/incident-priority-manager"
import IncidentInterventionInfo from "@/components/incident-intervention-info"

export default function IncidentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [incident, setIncident] = useState<any>(null)
  const [responses, setResponses] = useState<any[]>([])
  const [interventions, setInterventions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showResponseDialog, setShowResponseDialog] = useState(false)
  const [showInterventionDialog, setShowInterventionDialog] = useState(false)
  const [showResolveDialog, setShowResolveDialog] = useState(false)
  

  // Formulaires
  const [response, setResponse] = useState({ message: "", status: "", cost: "" })
  const [intervention, setIntervention] = useState({
    type: "owner",
    scheduled_date: "",
    description: "",
    provider_name: "",
    provider_contact: "",
    estimated_cost: "",
  })
  const [resolveForm, setResolveForm] = useState({
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    description: "",
    category: "repair",
    file: null as File | null,
  })

  useEffect(() => {
    const initializeData = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "owner") {
          router.push("/login")
          return
        }
        setCurrentUser(user)
        await Promise.all([loadIncidentData(), loadInterventions()])
      } catch (error) {
        console.error("Erreur initialisation:", error)
        toast.error("Erreur lors du chargement")
      } finally {
        setIsLoading(false)
      }
    }
    initializeData()
  }, [params.id])

  const loadIncidentData = async () => {
    try {
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(7)
      console.log("🔍 [OWNER INCIDENT DETAIL] Chargement incident:", params.id, "timestamp:", timestamp, "randomId:", randomId)
      const res = await fetch(`/api/incidents/${params.id}?t=${timestamp}&r=${randomId}`, { 
        cache: "no-store",
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      if (!res.ok) throw new Error(`Erreur serveur: ${res.status}`)
      const data = await res.json()
      
      console.log("📊 [OWNER INCIDENT DETAIL] Réponse brute API:", {
        timestamp: data.timestamp,
        responseCount: data.incident?.responses?.length || 0,
        responseIds: data.incident?.responses?.map((r: any) => r.id) || [],
        responseMessages: data.incident?.responses?.map((r: any) => ({ id: r.id, message: r.message?.substring(0, 50), created_at: r.created_at })) || []
      })
      
      if (data.success) {
        console.log("✅ [OWNER INCIDENT DETAIL] Mise à jour état React avec", data.incident.responses?.length || 0, "réponses")
        setIncident(data.incident)
        setResponses(data.incident.responses || [])
        
        // Vérification supplémentaire pour s'assurer que les réponses sont bien chargées
        if (data.incident.responses && data.incident.responses.length > 0) {
          console.log("✅ [OWNER INCIDENT DETAIL] Réponses chargées avec succès:", data.incident.responses.length)
          
          // Log détaillé de chaque réponse reçue
          console.log("🔍 [OWNER INCIDENT DETAIL] Détail des réponses reçues:")
          data.incident.responses.forEach((response, index) => {
            console.log(`   ${index + 1}. ID: ${response.id}`)
            console.log(`      Message: ${response.message}`)
            console.log(`      User Type: ${response.user_type}`)
            console.log(`      User Name: ${response.user_name}`)
            console.log(`      Created At: ${response.created_at}`)
          })
        } else {
          console.log("⚠️ [OWNER INCIDENT DETAIL] Aucune réponse trouvée")
        }
      } else {
        console.error("❌ [OWNER INCIDENT DETAIL] Erreur API:", data.error)
        toast.error("Incident non trouvé")
        router.push("/owner/rental-management/incidents")
      }
    } catch (error) {
      console.error("❌ [OWNER INCIDENT DETAIL] Erreur chargement incident:", error)
      toast.error("Erreur lors du chargement")
    }
  }

  // Rafraîchir les données quand l'onglet redevient visible
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        // Délai pour éviter les rechargements trop fréquents
        setTimeout(() => {
          loadIncidentData()
        }, 1000)
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)
    return () => document.removeEventListener("visibilitychange", handleVisibility)
  }, [params.id])

  // Realtime supprimé - utiliser le système de messagerie dédié

  const loadInterventions = async () => {
    try {
      const response = await fetch(`/api/incidents/${params.id}/interventions`)
      if (response.ok) {
        const data = await response.json()
        setInterventions(data.interventions || [])
      }
    } catch (error) {
      console.error("❌ Erreur chargement interventions:", error)
    }
  }


  const handleSendResponse = async () => {
    if (!response.message) return toast.error("Veuillez saisir un message")
    try {
      const responseData = { incident_id: incident.id, user_id: currentUser.id, message: response.message, user_type: "owner" }
      const res = await fetch(`/api/incidents/${incident.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(responseData),
      })
      if (!res.ok) throw new Error("Erreur envoi réponse")
      
      const data = await res.json()
      
      // Recharger immédiatement les données comme dans le système de messagerie
      console.log("✅ [OWNER INCIDENT DETAIL] Réponse envoyée - rechargement des données")
      await loadIncidentData()
      
      if (response.status) {
        await rentalManagementService.updateIncidentStatus(
          incident.id,
          response.status,
          response.message,
          response.cost ? Number(response.cost) : undefined
        )
      }
      toast.success("Réponse envoyée avec succès")
      setResponse({ message: "", status: "", cost: "" })
      setShowResponseDialog(false)
    } catch (error) {
      toast.error("Erreur lors de l'envoi de la réponse")
    }
  }

  const handleScheduleIntervention = async () => {
    if (!intervention.scheduled_date || !intervention.description)
      return toast.error("Veuillez remplir les champs obligatoires")
    try {
      const response = await fetch(`/api/incidents/${incident.id}/interventions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: intervention.type,
          scheduled_date: intervention.scheduled_date,
          description: intervention.description,
          provider_name: intervention.provider_name || null,
          provider_contact: intervention.provider_contact || null,
          estimated_cost: intervention.estimated_cost || null,
          user_id: currentUser.id
        })
      })

      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data?.error || 'Erreur programmation intervention')

      toast.success("Intervention programmée avec succès - Le locataire a été notifié")
      setIntervention({ type: "owner", scheduled_date: "", description: "", provider_name: "", provider_contact: "", estimated_cost: "" })
      setShowInterventionDialog(false)
      
      // Recharger les interventions et les données de l'incident
      await Promise.all([loadInterventions(), loadIncidentData()])
    } catch (error) {
      console.error("❌ Erreur programmation intervention:", error)
      toast.error("Erreur lors de la programmation")
    }
  }

  const handleResolveIncident = async () => {
    if (!resolveForm.amount || !resolveForm.description)
      return toast.error("Veuillez remplir les champs obligatoires")
    try {
      const formData = new FormData()
      formData.append('amount', resolveForm.amount)
      formData.append('date', resolveForm.date)
      formData.append('description', resolveForm.description)
      formData.append('category', resolveForm.category)
      if (resolveForm.file) formData.append('file', resolveForm.file)

      const res = await fetch(`/api/incidents/${incident.id}/resolve`, { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data?.error || 'Erreur résolution incident')

      toast.success("Incident résolu et dépense créée")
      setResolveForm({ amount: "", date: new Date().toISOString().slice(0, 10), description: "", category: "repair", file: null })
      setShowResolveDialog(false)
      
      console.log("✅ [OWNER INCIDENT DETAIL] Action effectuée - Realtime va mettre à jour l'affichage")
    } catch (error) {
      toast.error("Erreur lors de la résolution")
    }
  }

  // --- Fonctions utilitaires pour badges et icônes ---
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent": return <AlertTriangle className="h-5 w-5 text-red-600" />
      case "high": return <AlertCircle className="h-5 w-5 text-orange-600" />
      case "medium": return <Clock className="h-5 w-5 text-yellow-600" />
      case "low": return <CheckCircle className="h-5 w-5 text-green-600" />
      default: return <Clock className="h-5 w-5 text-gray-600" />
    }
  }
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved": return <Badge className="bg-green-600">Résolu</Badge>
      case "in_progress": return <Badge className="bg-orange-600">En cours</Badge>
      case "reported": return <Badge variant="secondary">Signalé</Badge>
      case "closed": return <Badge variant="outline">Fermé</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const getInterventionBadge = () => {
    if (interventions.length > 0) {
      const hasScheduledIntervention = interventions.some(intervention => 
        intervention.status === "scheduled" || intervention.status === "in_progress"
      )
      if (hasScheduledIntervention) {
        return <Badge className="bg-blue-600">Intervention programmée</Badge>
      }
    }
    return null
  }
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent": return <Badge variant="destructive">Urgent</Badge>
      case "high": return <Badge className="bg-orange-600">Élevé</Badge>
      case "medium": return <Badge variant="secondary">Moyen</Badge>
      case "low": return <Badge variant="outline">Faible</Badge>
      default: return <Badge variant="outline">{priority}</Badge>
    }
  }
  const getCategoryLabel = (category: string) => {
    const categories = { plumbing: "Plomberie", electrical: "Électricité", heating: "Chauffage", security: "Sécurité", other: "Autre" }
    return categories[category as keyof typeof categories] || category
  }

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><div className="text-center space-y-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div><p className="text-gray-600">Chargement de l'incident...</p></div></div>
  if (!incident) return <div className="text-center py-8"><AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" /><p className="text-gray-600">Incident non trouvé</p><Link href="/owner/rental-management/incidents"><Button className="mt-4">Retour aux incidents</Button></Link></div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/owner/rental-management/incidents">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {getPriorityIcon(incident.priority)}
            <h1 className="text-2xl font-bold">{incident.title}</h1>
            {getStatusBadge(incident.status)}
            {getPriorityBadge(incident.priority)}
            {getInterventionBadge()}
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
                <Button>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Répondre
                </Button>
              </DialogTrigger>
            </Dialog>

            <Dialog open={showInterventionDialog} onOpenChange={setShowInterventionDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Calendar className="h-4 w-4 mr-2" />
                  Programmer intervention
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

          {/* Interventions programmées */}
          {interventions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Interventions programmées</h3>
              {interventions.map((intervention) => (
                <IncidentInterventionInfo
                  key={intervention.id}
                  intervention={intervention}
                  isOwner={true}
                />
              ))}
            </div>
          )}

          {/* Système de ticketing */}
          <IncidentTicketing
            incidentId={incident.id}
            currentUser={currentUser}
            onTicketSent={loadIncidentData}
          />

          {/* Résolution - Ne s'affiche que si l'incident est résolu */}
          {incident.status === "resolved" && incident.resolution_notes && (
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

          {/* Locataire */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Locataire
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-medium">
                {incident.lease?.tenant?.first_name} {incident.lease?.tenant?.last_name}
              </p>
              {incident.lease?.tenant?.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${incident.lease.tenant.email}`} className="text-blue-600 hover:underline">
                    {incident.lease.tenant.email}
                  </a>
                </div>
              )}
              {incident.lease?.tenant?.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${incident.lease.tenant.phone}`} className="text-blue-600 hover:underline">
                    {incident.lease.tenant.phone}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gestion de la priorité */}
          <IncidentPriorityManager
            incidentId={incident.id}
            currentPriority={incident.priority}
            onPriorityChange={(newPriority) => {
              setIncident(prev => ({ ...prev, priority: newPriority }))
            }}
            isOwner={true}
          />

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
                  Répondre au locataire
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => setShowInterventionDialog(true)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Programmer intervention
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => setShowResolveDialog(true)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marquer comme résolu
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
            <DialogDescription>Envoyer une réponse au locataire</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Message *</label>
              <Textarea
                value={response.message}
                onChange={(e) => setResponse({ ...response, message: e.target.value })}
                placeholder="Votre réponse au locataire..."
                rows={4}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Changer le statut</label>
              <Select value={response.status} onValueChange={(value) => setResponse({ ...response, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Garder le statut actuel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="resolved">Résolu</SelectItem>
                  <SelectItem value="closed">Fermé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {response.status === "resolved" && (
              <div>
                <label className="text-sm font-medium">Coût (€)</label>
                <Input
                  type="number"
                  value={response.cost}
                  onChange={(e) => setResponse({ ...response, cost: e.target.value })}
                  placeholder="Coût de la réparation"
                />
              </div>
            )}
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

      {/* Dialog Intervention */}
      <Dialog open={showInterventionDialog} onOpenChange={setShowInterventionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Programmer une intervention</DialogTitle>
            <DialogDescription>Planifier une intervention pour résoudre cet incident</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Type d'intervention *</label>
              <Select
                value={intervention.type}
                onValueChange={(value) => setIntervention({ ...intervention, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Par moi-même</SelectItem>
                  <SelectItem value="external">Par un professionnel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {intervention.type === "external" && (
              <>
                <div>
                  <label className="text-sm font-medium">Nom du prestataire</label>
                  <Input
                    value={intervention.provider_name}
                    onChange={(e) => setIntervention({ ...intervention, provider_name: e.target.value })}
                    placeholder="Nom de l'entreprise/artisan"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Contact</label>
                  <Input
                    value={intervention.provider_contact}
                    onChange={(e) => setIntervention({ ...intervention, provider_contact: e.target.value })}
                    placeholder="Téléphone ou email"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-sm font-medium">Date prévue *</label>
              <Input
                type="datetime-local"
                value={intervention.scheduled_date}
                onChange={(e) => setIntervention({ ...intervention, scheduled_date: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description *</label>
              <Textarea
                value={intervention.description}
                onChange={(e) => setIntervention({ ...intervention, description: e.target.value })}
                placeholder="Description de l'intervention prévue"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Coût estimé (€)</label>
              <Input
                type="number"
                value={intervention.estimated_cost}
                onChange={(e) => setIntervention({ ...intervention, estimated_cost: e.target.value })}
                placeholder="Coût estimé"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleScheduleIntervention} className="flex-1">
                <Calendar className="h-4 w-4 mr-2" />
                Programmer
              </Button>
              <Button variant="outline" onClick={() => setShowInterventionDialog(false)}>
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Résolution */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Marquer comme résolu</DialogTitle>
            <DialogDescription>Créer une dépense et marquer l'incident comme résolu</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Montant (€) *</label>
              <Input
                type="number"
                value={resolveForm.amount}
                onChange={(e) => setResolveForm({ ...resolveForm, amount: e.target.value })}
                placeholder="Coût de la réparation"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Date *</label>
              <Input
                type="date"
                value={resolveForm.date}
                onChange={(e) => setResolveForm({ ...resolveForm, date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Type de dépense</label>
              <Select value={resolveForm.category} onValueChange={(value) => setResolveForm({ ...resolveForm, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="repair">Réparation</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="improvement">Amélioration</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Description *</label>
              <Textarea
                value={resolveForm.description}
                onChange={(e) => setResolveForm({ ...resolveForm, description: e.target.value })}
                placeholder="Description de la résolution"
                rows={3}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Justificatif (optionnel)</label>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setResolveForm({ ...resolveForm, file: e.target.files?.[0] || null })}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleResolveIncident} className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                Résoudre
              </Button>
              <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
