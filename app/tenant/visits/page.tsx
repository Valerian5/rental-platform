"use client"

import { useState, useEffect, useRef } from "react"
import { Send, Search, Phone, Video, MoreVertical, Paperclip, Smile, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { toast } from "sonner"

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
  is_read: boolean
}

interface Conversation {
  id: string
  subject: string
  created_at: string
  updated_at: string
  tenant_id: string
  owner_id: string
  property_id?: string
  property?: {
    id: string
    title: string
    address: string
    city: string
    price?: number
    images?: Array<{ url: string; is_primary: boolean }>
  }
  owner: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone?: string
  }
  tenant: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone?: string
  }
  messages: Message[]
}

export default function TenantMessagingPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Récupérer l'ID utilisateur depuis le localStorage ou une autre source
  useEffect(() => {
    const userId = localStorage.getItem("user_id") || "64504874-4a99-4da5-938b-0858caf27044" // ID par défaut pour test
    setCurrentUserId(userId)
    console.log("👤 ID utilisateur locataire:", userId)
  }, [])

  // Charger les conversations
  useEffect(() => {
    if (!currentUserId) return

    const loadConversations = async () => {
      try {
        console.log("🔍 Chargement conversations pour:", currentUserId)
        setLoading(true)

        const response = await fetch(`/api/conversations?user_id=${currentUserId}`)
        console.log("📡 Réponse API conversations:", response.status)

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}`)
        }

        const data = await response.json()
        console.log("✅ Conversations chargées:", data.conversations?.length || 0)
        console.log("📋 Détail conversations:", data.conversations)

        setConversations(data.conversations || [])
      } catch (error) {
        console.error("❌ Erreur chargement conversations:", error)
        toast.error("Erreur lors du chargement des conversations")
      } finally {
        setLoading(false)
      }
    }

    loadConversations()
  }, [currentUserId])

  // Gérer les paramètres URL (conversation_id, owner_id)
  useEffect(() => {
    if (!currentUserId || conversations.length === 0) return

    const urlParams = new URLSearchParams(window.location.search)
    const conversationId = urlParams.get("conversation")
    const ownerId = urlParams.get("owner_id")

    console.log("🔗 Paramètres URL détectés:", { conversationId, ownerId })

    if (conversationId) {
      // Sélectionner une conversation spécifique
      const conversation = conversations.find((c) => c.id === conversationId)
      if (conversation) {
        console.log("✅ Conversation trouvée et sélectionnée:", conversationId)
        setSelectedConversation(conversation)
        markAsRead(conversationId)
      }
    } else if (ownerId) {
      // Créer ou trouver une conversation avec ce propriétaire
      handleOwnerConversation(ownerId)
    }
  }, [conversations, currentUserId])

  // Gérer la conversation avec un propriétaire spécifique
  const handleOwnerConversation = async (ownerId: string) => {
    if (!currentUserId) return

    try {
      console.log("🎯 Gestion conversation avec propriétaire:", ownerId)

      // Chercher une conversation existante avec ce propriétaire
      const existingConversation = conversations.find((c) => c.owner_id === ownerId)

      if (existingConversation) {
        console.log("✅ Conversation existante trouvée:", existingConversation.id)
        setSelectedConversation(existingConversation)
        markAsRead(existingConversation.id)
        return
      }

      console.log("🆕 Aucune conversation trouvée, création en cours...")

      // Créer une nouvelle conversation
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: currentUserId,
          owner_id: ownerId,
          subject: "Nouvelle conversation",
        }),
      })

      console.log("📡 Réponse création conversation:", response.status)

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`)
      }

      const data = await response.json()
      console.log("✅ Conversation créée:", data.conversation)

      // Recharger les conversations pour inclure la nouvelle
      const refreshResponse = await fetch(`/api/conversations?user_id=${currentUserId}`)
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json()
        setConversations(refreshData.conversations || [])

        // Sélectionner la nouvelle conversation
        const newConversation = refreshData.conversations?.find((c: Conversation) => c.id === data.conversation.id)
        if (newConversation) {
          setSelectedConversation(newConversation)
        }
      }
    } catch (error) {
      console.error("❌ Erreur gestion conversation propriétaire:", error)
      toast.error("Erreur lors de la création de la conversation")
    }
  }

  // Auto-scroll vers le bas des messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [selectedConversation?.messages])

  // Détecter mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUserId) return

    try {
      console.log("📤 Envoi message:", { conversation: selectedConversation.id, content: newMessage.trim() })

      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "send_message",
          conversation_id: selectedConversation.id,
          sender_id: currentUserId,
          content: newMessage.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`)
      }

      const data = await response.json()
      console.log("✅ Message envoyé:", data.message.id)

      // Ajouter le message à la conversation locale
      const newMessageObj: Message = {
        id: data.message.id,
        sender_id: currentUserId,
        content: newMessage.trim(),
        created_at: new Date().toISOString(),
        is_read: true,
      }

      setSelectedConversation((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, newMessageObj],
            }
          : null,
      )

      setNewMessage("")
      toast.success("Message envoyé")
    } catch (error) {
      console.error("❌ Erreur envoi message:", error)
      toast.error("Erreur lors de l'envoi du message")
    }
  }

  const markAsRead = async (conversationId: string) => {
    if (!currentUserId) return

    try {
      await fetch(`/api/conversations/${conversationId}/mark-read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: currentUserId }),
      })
    } catch (error) {
      console.error("❌ Erreur marquage lu:", error)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = diff / (1000 * 60 * 60)

    if (hours < 24) {
      return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    } else {
      return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
    }
  }

  const getUnreadCount = (conversation: Conversation) => {
    return conversation.messages.filter((msg) => !msg.is_read && msg.sender_id !== currentUserId).length
  }

  const getLastMessage = (conversation: Conversation) => {
    const lastMessage = conversation.messages[conversation.messages.length - 1]
    if (!lastMessage) return null

    return {
      content: lastMessage.content,
      timestamp: lastMessage.created_at,
      sender_id: lastMessage.sender_id,
      sender_name: lastMessage.sender_id === currentUserId ? "Vous" : conversation.owner.first_name,
    }
  }

  const getPropertyImage = (conversation: Conversation) => {
    if (!conversation.property?.images?.length) {
      return "/placeholder.svg?height=60&width=60&text=Apt"
    }

    const primaryImage = conversation.property.images.find((img) => img.is_primary)
    return primaryImage?.url || conversation.property.images[0]?.url || "/placeholder.svg?height=60&width=60&text=Apt"
  }

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.owner.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.owner.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.property?.title.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Chargement de vos conversations...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
        {/* Liste des conversations */}
        <div className={`${isMobile && selectedConversation ? "hidden" : ""} lg:block`}>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Messages</h2>
                <Badge variant="secondary">
                  {conversations.reduce((sum, conv) => sum + getUnreadCount(conv), 0)} non lus
                </Badge>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une conversation..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-12rem)]">
                <div className="space-y-1 p-3">
                  {filteredConversations.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Aucune conversation</p>
                    </div>
                  ) : (
                    filteredConversations.map((conversation) => {
                      const unreadCount = getUnreadCount(conversation)
                      const lastMessage = getLastMessage(conversation)

                      return (
                        <div
                          key={conversation.id}
                          className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                            selectedConversation?.id === conversation.id ? "bg-blue-50 border border-blue-200" : ""
                          }`}
                          onClick={() => {
                            setSelectedConversation(conversation)
                            markAsRead(conversation.id)
                          }}
                        >
                          <div className="flex gap-3">
                            <div className="relative">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src="/placeholder.svg?height=40&width=40&text=Owner" />
                                <AvatarFallback>
                                  {conversation.owner.first_name[0]}
                                  {conversation.owner.last_name[0]}
                                </AvatarFallback>
                              </Avatar>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">
                                    {conversation.owner.first_name} {conversation.owner.last_name}
                                  </p>
                                  {conversation.property && (
                                    <p className="text-xs text-muted-foreground truncate">
                                      {conversation.property.title}
                                    </p>
                                  )}
                                </div>
                                <div className="flex flex-col items-end">
                                  {lastMessage && (
                                    <span className="text-xs text-muted-foreground">
                                      {formatTime(lastMessage.timestamp)}
                                    </span>
                                  )}
                                  {unreadCount > 0 && (
                                    <Badge
                                      variant="destructive"
                                      className="text-xs h-4 w-4 p-0 flex items-center justify-center mt-1"
                                    >
                                      {unreadCount}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {lastMessage && (
                                <p className="text-sm text-muted-foreground truncate mt-1">
                                  {lastMessage.sender_name}: {lastMessage.content}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Zone de conversation */}
        <div className={`lg:col-span-2 ${isMobile && !selectedConversation ? "hidden" : ""}`}>
          {selectedConversation ? (
            <Card className="h-full flex flex-col">
              {/* En-tête de conversation */}
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isMobile && (
                      <Button variant="ghost" size="icon" onClick={() => setSelectedConversation(null)}>
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                    )}

                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="/placeholder.svg?height=40&width=40&text=Owner" />
                        <AvatarFallback>
                          {selectedConversation.owner.first_name[0]}
                          {selectedConversation.owner.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {selectedConversation.owner.first_name} {selectedConversation.owner.last_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">Propriétaire</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Informations sur la propriété */}
                {selectedConversation.property && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex gap-3">
                      <img
                        src={getPropertyImage(selectedConversation) || "/placeholder.svg"}
                        alt={selectedConversation.property.title}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{selectedConversation.property.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {selectedConversation.property.address}, {selectedConversation.property.city}
                        </p>
                        {selectedConversation.property.price && (
                          <p className="text-sm font-semibold text-blue-600">
                            {selectedConversation.property.price} €/mois
                          </p>
                        )}
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/properties/${selectedConversation.property.id}`}>Voir l'annonce</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[calc(100vh-20rem)] p-4">
                  <div className="space-y-4">
                    {selectedConversation.messages.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">Aucun message dans cette conversation</p>
                        <p className="text-sm text-gray-400 mt-1">Envoyez le premier message !</p>
                      </div>
                    ) : (
                      selectedConversation.messages.map((message) => {
                        const isOwn = message.sender_id === currentUserId
                        return (
                          <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[70%] ${isOwn ? "order-2" : ""}`}>
                              <div
                                className={`p-3 rounded-lg ${
                                  isOwn ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                                }`}
                              >
                                <p className="text-sm">{message.content}</p>
                                <p className={`text-xs mt-1 ${isOwn ? "text-blue-100" : "text-gray-500"}`}>
                                  {formatTime(message.created_at)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Zone de saisie */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 relative">
                    <Textarea
                      placeholder="Tapez votre message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="min-h-[40px] max-h-32 resize-none pr-12"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          sendMessage()
                        }
                      }}
                    />
                    <Button variant="ghost" size="icon" className="absolute right-1 top-1">
                      <Smile className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button onClick={sendMessage} disabled={!newMessage.trim()} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="h-12 w-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Send className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Sélectionnez une conversation</h3>
                <p className="text-muted-foreground">
                  Choisissez une conversation dans la liste pour commencer à échanger
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
