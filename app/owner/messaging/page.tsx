"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"
import { MessageSquare, Send, ArrowLeft, Loader2, AlertCircle, Calendar } from "lucide-react"
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
  price?: number
  images?: Array<{ url: string; is_primary: boolean }>
}

interface Application {
  id: string
  status: string
  created_at: string
  message?: string
  property: Property
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
}

interface Conversation {
  id: string
  tenant_id: string
  owner_id: string
  property_id?: string
  subject: string
  created_at: string
  updated_at: string
  tenant?: User
  owner?: User
  property?: Property
  messages: Message[]
}

export default function OwnerMessagingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [creatingConversation, setCreatingConversation] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [tenantApplications, setTenantApplications] = useState<Application[]>([])
  const [loadingApplications, setLoadingApplications] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  useEffect(() => {
    // Gérer les paramètres URL après le chargement des données
    if (currentUser && !loading) {
      handleUrlParams()
    }
  }, [currentUser, loading, searchParams])

  useEffect(() => {
    // Charger les candidatures du locataire quand une conversation est sélectionnée
    if (selectedConversation && currentUser) {
      loadTenantApplications(selectedConversation.tenant_id, currentUser.id)
    }
  }, [selectedConversation, currentUser])

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
      await loadConversations(user.id)
    } catch (error) {
      console.error("❌ Erreur auth:", error)
      setError("Erreur d'authentification")
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  const loadConversations = async (userId: string) => {
    try {
      console.log("🔍 Chargement conversations pour:", userId)
      const response = await fetch(`/api/conversations?user_id=${userId}`)

      console.log("📡 Réponse API conversations:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("✅ Conversations chargées:", data.conversations?.length || 0)
        setConversations(data.conversations || [])
      } else {
        const errorData = await response.text()
        console.error("❌ Erreur API conversations:", response.status, errorData)
        setError(`Erreur API: ${response.status}`)
        setConversations([])
      }
    } catch (error) {
      console.error("❌ Erreur chargement conversations:", error)
      setError("Erreur de connexion")
      setConversations([])
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      console.log("🔍 Chargement messages pour conversation:", conversationId)
      const response = await fetch(`/api/conversations/${conversationId}/messages`)

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

  const loadTenantApplications = async (tenantId: string, ownerId: string) => {
    try {
      setLoadingApplications(true)
      console.log("🔍 Chargement candidatures locataire:", { tenantId, ownerId })

      const response = await fetch(`/api/applications/tenant-owner?tenant_id=${tenantId}&owner_id=${ownerId}`)

      if (response.ok) {
        const data = await response.json()
        console.log("✅ Candidatures chargées:", data.applications?.length || 0)
        setTenantApplications(data.applications || [])
      } else {
        console.error("❌ Erreur chargement candidatures:", response.status)
        setTenantApplications([])
      }
    } catch (error) {
      console.error("❌ Erreur chargement candidatures:", error)
      setTenantApplications([])
    } finally {
      setLoadingApplications(false)
    }
  }

  const handleUrlParams = async () => {
    const conversationId = searchParams.get("conversation_id")
    const tenantId = searchParams.get("tenant_id")

    console.log("🔗 Paramètres URL détectés:", { conversationId, tenantId })

    if (conversationId) {
      // Sélectionner une conversation spécifique
      const conversation = conversations.find((c) => c.id === conversationId)
      if (conversation) {
        console.log("✅ Conversation trouvée par ID:", conversation.id)
        setSelectedConversation(conversation)
        await loadMessages(conversation.id)
      } else {
        console.warn("⚠️ Conversation non trouvée:", conversationId)
      }
    } else if (tenantId) {
      // Chercher ou créer une conversation avec ce locataire
      console.log("🎯 Gestion conversation avec locataire:", tenantId)
      await handleTenantConversation(tenantId)
    }
  }

  const handleTenantConversation = async (tenantId: string) => {
    try {
      console.log("🔍 Recherche conversation existante avec locataire:", tenantId)

      // Chercher une conversation existante avec ce locataire
      const existingConversation = conversations.find((c) => c.tenant_id === tenantId)

      if (existingConversation) {
        console.log("✅ Conversation existante trouvée:", existingConversation.id)
        setSelectedConversation(existingConversation)
        await loadMessages(existingConversation.id)
        return
      }

      // Créer une nouvelle conversation
      console.log("🆕 Aucune conversation trouvée, création en cours...")
      setCreatingConversation(true)

      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          owner_id: currentUser.id,
          subject: "Nouvelle conversation",
        }),
      })

      console.log("📡 Réponse création conversation:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("✅ Conversation créée:", data.conversation)

        // Recharger les conversations pour inclure la nouvelle
        await loadConversations(currentUser.id)

        toast.success("Conversation créée avec succès")

        // Chercher la nouvelle conversation dans la liste mise à jour
        const newConversation = conversations.find((c) => c.id === data.conversation.id)
        if (newConversation) {
          console.log("✅ Nouvelle conversation trouvée dans la liste:", newConversation.id)
          setSelectedConversation(newConversation)
          setMessages([]) // Pas de messages dans une nouvelle conversation
        } else {
          console.log("⚠️ Nouvelle conversation non trouvée dans la liste, utilisation directe")
          // Utiliser directement la conversation créée
          setSelectedConversation({
            ...data.conversation,
            messages: [],
          })
        }
      } else {
        const errorData = await response.text()
        console.error("❌ Erreur création conversation:", response.status, errorData)
        toast.error("Erreur lors de la création de la conversation")
        setError(`Erreur création: ${response.status}`)
      }
    } catch (error) {
      console.error("❌ Erreur handleTenantConversation:", error)
      toast.error("Erreur lors de la création de la conversation")
      setError("Erreur de connexion")
    } finally {
      setCreatingConversation(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUser) return

    try {
      setSending(true)
      console.log("📤 Envoi message:", {
        conversation_id: selectedConversation.id,
        sender_id: currentUser.id,
        content: newMessage.trim(),
      })

      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "send_message",
          conversation_id: selectedConversation.id,
          sender_id: currentUser.id,
          content: newMessage.trim(),
        }),
      })

      if (response.ok) {
        console.log("✅ Message envoyé avec succès")
        setNewMessage("")
        // Recharger les messages pour voir le nouveau message
        await loadMessages(selectedConversation.id)
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

  const handleConversationSelect = async (conversation: Conversation) => {
    setSelectedConversation(conversation)
    await loadMessages(conversation.id)
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

  const getPropertyImage = (property: Property) => {
    if (!property.images?.length) {
      return "/placeholder.svg?height=60&width=60&text=Apt"
    }

    const primaryImage = property.images.find((img) => img.is_primary)
    return primaryImage?.url || property.images[0]?.url || "/placeholder.svg?height=60&width=60&text=Apt"
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "En attente", variant: "secondary" as const },
      accepted: { label: "Acceptée", variant: "default" as const },
      rejected: { label: "Refusée", variant: "destructive" as const },
      visit_scheduled: { label: "Visite programmée", variant: "outline" as const },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Messagerie" description="Chargement..." />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Messagerie" description="Erreur de chargement" />
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

  return (
    <div className="space-y-6">
      <PageHeader title="Messagerie" description="Communiquez avec vos locataires">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
      </PageHeader>

      {creatingConversation && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="flex items-center gap-3 py-4">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-blue-800">Création de la conversation en cours...</span>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Liste des conversations */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Conversations</span>
              <Badge>{conversations.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {conversations.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Aucune conversation</h3>
                <p className="text-muted-foreground text-sm">
                  {creatingConversation
                    ? "Création en cours..."
                    : "Les conversations avec vos locataires apparaîtront ici"}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-1">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 border-b transition-colors ${
                        selectedConversation?.id === conversation.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                      }`}
                      onClick={() => handleConversationSelect(conversation)}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src="/placeholder.svg" />
                          <AvatarFallback>
                            {conversation.tenant?.first_name?.[0] || "?"}
                            {conversation.tenant?.last_name?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {conversation.tenant?.first_name} {conversation.tenant?.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{conversation.subject}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Zone de messages */}
        <Card className="lg:col-span-2">
          {selectedConversation ? (
            <>
              <CardHeader className="border-b">
                <CardTitle>
                  {selectedConversation.tenant?.first_name} {selectedConversation.tenant?.last_name}
                </CardTitle>

                {/* Section candidatures du locataire */}
                {loadingApplications ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Chargement des candidatures...
                  </div>
                ) : tenantApplications.length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Candidature{tenantApplications.length > 1 ? "s" : ""} de ce locataire :
                    </h4>
                    <div className="space-y-2">
                      {tenantApplications.map((application) => (
                        <div key={application.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex gap-3">
                            <img
                              src={getPropertyImage(application.property) || "/placeholder.svg"}
                              alt={application.property.title}
                              className="w-12 h-12 rounded object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h5 className="font-medium text-sm truncate">{application.property.title}</h5>
                                {getStatusBadge(application.status)}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {application.property.address}, {application.property.city}
                              </p>
                              {application.property.price && (
                                <p className="text-sm font-semibold text-blue-600">
                                  {application.property.price} €/mois
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(application.created_at).toLocaleDateString("fr-FR")}
                                </span>
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/owner/applications/${application.id}`}>Voir candidature</Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucune candidature trouvée pour ce locataire</p>
                )}
              </CardHeader>

              <CardContent className="p-0 flex flex-col h-[400px]">
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
                          className={`flex ${message.sender_id === currentUser?.id ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.sender_id === currentUser?.id
                                ? "bg-blue-500 text-white"
                                : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${message.sender_id === currentUser?.id ? "text-blue-100" : "text-gray-500"}`}
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
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  {creatingConversation ? "Création en cours..." : "Sélectionnez une conversation"}
                </h3>
                <p className="text-muted-foreground">
                  {creatingConversation
                    ? "Veuillez patienter pendant la création de la conversation"
                    : "Choisissez une conversation dans la liste pour commencer à échanger"}
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
