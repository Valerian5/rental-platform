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
import { MessageSquare, Send, ArrowLeft, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/page-header"

interface Conversation {
  id: string
  tenant_id: string
  owner_id: string
  property_id?: string
  subject: string
  created_at: string
  updated_at: string
  tenant: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone?: string
  }
  property?: {
    id: string
    title: string
    address: string
  }
  messages: Message[]
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
}

export default function OwnerMessagingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [creatingConversation, setCreatingConversation] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  useEffect(() => {
    // Gérer les paramètres URL après le chargement des conversations
    if (conversations.length > 0 && currentUser) {
      handleUrlParams()
    }
  }, [conversations, currentUser, searchParams])

  const checkAuthAndLoadData = async () => {
    try {
      const user = await authService.getCurrentUser()
      if (!user || user.user_type !== "owner") {
        router.push("/login")
        return
      }

      setCurrentUser(user)
      await loadConversations(user.id)
    } catch (error) {
      console.error("Erreur auth:", error)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  const loadConversations = async (userId: string) => {
    try {
      console.log("🔍 Chargement conversations pour:", userId)
      const response = await fetch(`/api/conversations?user_id=${userId}`)

      if (response.ok) {
        const data = await response.json()
        console.log("✅ Conversations chargées:", data.conversations?.length || 0)
        setConversations(data.conversations || [])
      } else {
        console.warn("⚠️ Erreur chargement conversations:", response.status)
        setConversations([])
      }
    } catch (error) {
      console.error("❌ Erreur chargement conversations:", error)
      setConversations([])
    }
  }

  const handleUrlParams = async () => {
    const conversationId = searchParams.get("conversation_id")
    const tenantId = searchParams.get("tenant_id")

    console.log("🔗 Paramètres URL:", { conversationId, tenantId })

    if (conversationId) {
      // Sélectionner une conversation spécifique
      const conversation = conversations.find((c) => c.id === conversationId)
      if (conversation) {
        console.log("✅ Conversation trouvée par ID:", conversation.id)
        setSelectedConversation(conversation)
        await markMessagesAsRead(conversation.id)
      }
    } else if (tenantId) {
      // Chercher ou créer une conversation avec ce locataire
      await handleTenantConversation(tenantId)
    }
  }

  const handleTenantConversation = async (tenantId: string) => {
    try {
      console.log("🔍 Recherche conversation avec locataire:", tenantId)

      // Chercher une conversation existante avec ce locataire
      const existingConversation = conversations.find((c) => c.tenant_id === tenantId)

      if (existingConversation) {
        console.log("✅ Conversation existante trouvée:", existingConversation.id)
        setSelectedConversation(existingConversation)
        await markMessagesAsRead(existingConversation.id)
        return
      }

      // Créer une nouvelle conversation
      console.log("🆕 Création nouvelle conversation avec locataire:", tenantId)
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

      if (response.ok) {
        const data = await response.json()
        console.log("✅ Conversation créée:", data.conversation.id)

        // Recharger les conversations pour inclure la nouvelle
        await loadConversations(currentUser.id)

        // La nouvelle conversation sera sélectionnée au prochain rendu
        // grâce à l'effet qui surveille les conversations
        setTimeout(() => {
          const newConversation = conversations.find((c) => c.id === data.conversation.id)
          if (newConversation) {
            setSelectedConversation(newConversation)
          }
        }, 100)

        toast.success("Conversation créée avec succès")
      } else {
        console.error("❌ Erreur création conversation:", response.status)
        toast.error("Erreur lors de la création de la conversation")
      }
    } catch (error) {
      console.error("❌ Erreur handleTenantConversation:", error)
      toast.error("Erreur lors de la création de la conversation")
    } finally {
      setCreatingConversation(false)
    }
  }

  const markMessagesAsRead = async (conversationId: string) => {
    try {
      await fetch(`/api/conversations/${conversationId}/mark-read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: currentUser.id,
        }),
      })
    } catch (error) {
      console.error("Erreur marquage messages lus:", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUser) return

    try {
      setSending(true)
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
        setNewMessage("")
        // Recharger les conversations pour voir le nouveau message
        await loadConversations(currentUser.id)
        // Maintenir la conversation sélectionnée
        const updatedConversation = conversations.find((c) => c.id === selectedConversation.id)
        if (updatedConversation) {
          setSelectedConversation(updatedConversation)
        }
      } else {
        toast.error("Erreur lors de l'envoi du message")
      }
    } catch (error) {
      console.error("Erreur envoi message:", error)
      toast.error("Erreur lors de l'envoi du message")
    } finally {
      setSending(false)
    }
  }

  const handleConversationSelect = async (conversation: Conversation) => {
    setSelectedConversation(conversation)
    await markMessagesAsRead(conversation.id)
    // Mettre à jour l'URL sans recharger la page
    const url = new URL(window.location.href)
    url.searchParams.set("conversation_id", conversation.id)
    url.searchParams.delete("tenant_id")
    window.history.replaceState({}, "", url.toString())
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

  const getUnreadCount = (conversation: Conversation) => {
    if (!conversation.messages) return 0
    return conversation.messages.filter((msg) => !msg.is_read && msg.sender_id !== currentUser?.id).length
  }

  const getLastMessage = (conversation: Conversation) => {
    if (!conversation.messages || conversation.messages.length === 0) return null
    return conversation.messages[conversation.messages.length - 1]
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
                <p className="text-muted-foreground text-sm">Les conversations avec vos locataires apparaîtront ici</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-1">
                  {conversations.map((conversation) => {
                    const unreadCount = getUnreadCount(conversation)
                    const lastMessage = getLastMessage(conversation)

                    return (
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
                              {conversation.tenant.first_name[0]}
                              {conversation.tenant.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium truncate">
                                {conversation.tenant.first_name} {conversation.tenant.last_name}
                              </p>
                              {unreadCount > 0 && (
                                <Badge className="bg-red-500 text-white text-xs">{unreadCount}</Badge>
                              )}
                            </div>
                            {conversation.property && (
                              <p className="text-xs text-muted-foreground truncate mb-1">
                                📍 {conversation.property.title}
                              </p>
                            )}
                            {lastMessage ? (
                              <div className="flex justify-between items-center">
                                <p className="text-xs text-muted-foreground truncate">{lastMessage.content}</p>
                                <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                  {formatTime(lastMessage.created_at)}
                                </span>
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">Nouvelle conversation</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
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
                <CardTitle className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">
                      {selectedConversation.tenant.first_name} {selectedConversation.tenant.last_name}
                    </h3>
                    {selectedConversation.property && (
                      <p className="text-sm text-muted-foreground">{selectedConversation.property.title}</p>
                    )}
                  </div>
                  <Badge variant="outline">{selectedConversation.tenant.email}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex flex-col h-[500px]">
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {selectedConversation.messages.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-muted-foreground">Aucun message dans cette conversation</p>
                        <p className="text-sm text-muted-foreground mt-1">Envoyez le premier message !</p>
                      </div>
                    ) : (
                      selectedConversation.messages.map((message) => (
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
                <h3 className="text-lg font-semibold mb-2">Sélectionnez une conversation!</h3>
                <p className="text-muted-foreground">
                  Choisissez une conversation dans la liste pour commencer à échanger
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
