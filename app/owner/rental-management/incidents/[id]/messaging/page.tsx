"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"
import { MessageSquare, Send, ArrowLeft, Loader2, AlertCircle } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import Link from "next/link"

interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
}

interface Property {
  id: string
  title: string
  address: string
  city: string
}

interface Incident {
  id: string
  title: string
  description: string
  status: string
  priority: string
  created_at: string
  property: Property
  lease: {
    tenant: User
    owner: User
  }
}

interface Message {
  id: string
  message: string
  author_type: string
  author_name: string
  author_id: string
  created_at: string
  attachments?: string[]
}

export default function IncidentMessagingPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [incident, setIncident] = useState<Incident | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAuthAndLoadData()
  }, [params.id])

  const checkAuthAndLoadData = async () => {
    try {
      console.log("🔐 Vérification authentification...")
      const user = await authService.getCurrentUser()
      if (!user || user.user_type !== "owner") {
        router.push("/login")
        return
      }

      console.log("✅ Utilisateur authentifié:", user.id)
      setCurrentUser(user)
      await loadIncidentData()
    } catch (error) {
      console.error("❌ Erreur auth:", error)
      setError("Erreur d'authentification")
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  const loadIncidentData = async () => {
    try {
      console.log("🔍 Chargement incident:", params.id)
      const response = await fetch(`/api/incidents/${params.id}`)

      if (response.ok) {
        const data = await response.json()
        console.log("✅ Incident chargé:", data.incident)
        setIncident(data.incident)
        await loadMessages()
      } else {
        console.error("❌ Erreur chargement incident:", response.status)
        setError("Erreur lors du chargement de l'incident")
      }
    } catch (error) {
      console.error("❌ Erreur chargement incident:", error)
      setError("Erreur de connexion")
    }
  }

  const loadMessages = async () => {
    try {
      console.log("🔍 Chargement messages pour incident:", params.id)
      const response = await fetch(`/api/incidents/${params.id}/messages`)

      if (response.ok) {
        const data = await response.json()
        console.log("✅ Messages chargés:", data.messages?.length || 0)
        setMessages(data.messages || [])
      } else {
        console.error("❌ Erreur chargement messages:", response.status)
        setMessages([])
      }
    } catch (error) {
      console.error("❌ Erreur chargement messages:", error)
      setMessages([])
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !incident) return

    try {
      setSending(true)
      console.log("📤 Envoi message:", {
        incident_id: incident.id,
        user_id: currentUser.id,
        message: newMessage.trim(),
        user_type: "owner",
      })

      const response = await fetch(`/api/incidents/${incident.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: currentUser.id,
          message: newMessage.trim(),
          user_type: "owner",
        }),
      })

      if (response.ok) {
        console.log("✅ Message envoyé avec succès")
        setNewMessage("")
        // Recharger les messages pour voir le nouveau message
        await loadMessages()
        toast.success("Message envoyé avec succès")
      } else {
        const errorData = await response.text()
        console.error("❌ Erreur envoi message:", response.status, errorData)
        toast.error("Erreur lors de l'envoi du message")
      }
    } catch (error) {
      console.error("❌ Erreur sendMessage:", error)
      toast.error("Erreur lors de l'envoi du message")
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Hier"
    } else {
      return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
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

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Messagerie incident" description="Chargement..." />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Messagerie incident" description="Erreur de chargement" />
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-6">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-800">Erreur</h3>
              <p className="text-red-600">{error}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!incident) {
    return (
      <div className="space-y-6">
        <PageHeader title="Messagerie incident" description="Incident non trouvé" />
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-6">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-800">Incident non trouvé</h3>
              <p className="text-red-600">L'incident demandé n'existe pas ou vous n'avez pas l'autorisation de le consulter.</p>
              <Button variant="outline" size="sm" className="mt-2" asChild>
                <Link href="/owner/rental-management/incidents">Retour aux incidents</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`Messagerie - ${incident.title}`} 
        description={`Communication avec ${incident.lease.tenant.first_name} ${incident.lease.tenant.last_name}`}
      >
        <div className="flex gap-2">
          <Button variant="ghost" asChild>
            <Link href={`/owner/rental-management/incidents/${incident.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à l'incident
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Informations incident */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Informations incident</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">{incident.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{incident.description}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Statut</span>
                {getStatusBadge(incident.status)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Priorité</span>
                {getPriorityBadge(incident.priority)}
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium text-sm mb-2">Propriété</h4>
              <p className="text-sm">{incident.property.title}</p>
              <p className="text-xs text-gray-600">{incident.property.address}, {incident.property.city}</p>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium text-sm mb-2">Locataire</h4>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback>
                    {incident.lease.tenant.first_name[0]}{incident.lease.tenant.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {incident.lease.tenant.first_name} {incident.lease.tenant.last_name}
                  </p>
                  <p className="text-xs text-gray-600">{incident.lease.tenant.email}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Zone de messages */}
        <Card className="lg:col-span-3">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center justify-between">
              <span>Messages</span>
              <Badge>{messages.length}</Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0 flex flex-col h-[500px]">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">Aucun message dans cette conversation</p>
                    <p className="text-sm text-muted-foreground mt-1">Envoyez le premier message !</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.author_type === "owner" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.author_type === "owner"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">
                            {message.author_type === "owner" ? "Vous" : message.author_name}
                          </span>
                        </div>
                        <p className="text-sm">{message.message}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.author_type === "owner" ? "text-blue-100" : "text-gray-500"
                          }`}
                        >
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Zone de saisie */}
            <div className="border-t p-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Tapez votre message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  disabled={sending}
                />
                <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
