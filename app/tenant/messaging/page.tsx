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
  timestamp: string
  read: boolean
  type: "text" | "image" | "document"
}

interface Conversation {
  id: string
  property?: {
    id: string
    title: string
    address: string
    price: number
    image: string
  }
  owner: {
    id: string
    first_name: string
    last_name: string
    avatar?: string
    last_seen?: string
    online?: boolean
  }
  last_message: {
    content: string
    timestamp: string
    sender_id: string
  }
  unread_count: number
  messages: Message[]
}

export default function TenantMessagingPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Données simulées réalistes
  useEffect(() => {
    setTimeout(() => {
      setConversations([
        {
          id: "1",
          property: {
            id: "1",
            title: "Appartement 2 pièces - Marais",
            address: "15 Rue des Rosiers, Paris 4e",
            price: 1450,
            image: "/placeholder.svg?height=60&width=60&text=Apt",
          },
          owner: {
            id: "owner1",
            first_name: "Marie",
            last_name: "Dubois",
            avatar: "/placeholder.svg?height=40&width=40&text=MD",
            last_seen: "2024-01-20T15:30:00Z",
            online: true,
          },
          last_message: {
            content: "Parfait ! Je confirme la visite pour demain à 14h. À bientôt !",
            timestamp: "2024-01-20T15:30:00Z",
            sender_id: "owner1",
          },
          unread_count: 1,
          messages: [
            {
              id: "1",
              sender_id: "tenant1",
              content:
                "Bonjour, je suis très intéressé par votre appartement dans le Marais. Serait-il possible d'organiser une visite cette semaine ?",
              timestamp: "2024-01-20T10:00:00Z",
              read: true,
              type: "text",
            },
            {
              id: "2",
              sender_id: "owner1",
              content:
                "Bonjour ! Merci pour votre intérêt. Je serais ravi de vous faire visiter l'appartement. Êtes-vous disponible demain après-midi vers 14h ?",
              timestamp: "2024-01-20T11:15:00Z",
              read: true,
              type: "text",
            },
            {
              id: "3",
              sender_id: "tenant1",
              content:
                "Oui, cela me convient parfaitement ! Demain 14h c'est parfait. Faut-il que je vous apporte des documents particuliers ?",
              timestamp: "2024-01-20T11:30:00Z",
              read: true,
              type: "text",
            },
            {
              id: "4",
              sender_id: "owner1",
              content: "Parfait ! Je confirme la visite pour demain à 14h. À bientôt !",
              timestamp: "2024-01-20T15:30:00Z",
              read: false,
              type: "text",
            },
          ],
        },
        {
          id: "2",
          property: {
            id: "2",
            title: "Studio lumineux - Quartier Latin",
            address: "8 Rue Saint-Jacques, Paris 5e",
            price: 950,
            image: "/placeholder.svg?height=60&width=60&text=Studio",
          },
          owner: {
            id: "owner2",
            first_name: "Jean",
            last_name: "Martin",
            avatar: "/placeholder.svg?height=40&width=40&text=JM",
            last_seen: "2024-01-20T09:45:00Z",
            online: false,
          },
          last_message: {
            content: "D'accord, je vais réfléchir et vous recontacter rapidement. Merci pour les informations !",
            timestamp: "2024-01-19T16:20:00Z",
            sender_id: "tenant1",
          },
          unread_count: 0,
          messages: [
            {
              id: "5",
              sender_id: "tenant1",
              content:
                "Bonjour, pouvez-vous me donner plus d'informations sur les charges du studio ? Qu'est-ce qui est inclus exactement ?",
              timestamp: "2024-01-19T14:00:00Z",
              read: true,
              type: "text",
            },
            {
              id: "6",
              sender_id: "owner2",
              content:
                "Bonjour ! Les charges de 80€/mois incluent l'eau, le chauffage et l'entretien des parties communes. L'électricité et internet sont à votre charge.",
              timestamp: "2024-01-19T15:30:00Z",
              read: true,
              type: "text",
            },
            {
              id: "7",
              sender_id: "tenant1",
              content: "D'accord, je vais réfléchir et vous recontacter rapidement. Merci pour les informations !",
              timestamp: "2024-01-19T16:20:00Z",
              read: true,
              type: "text",
            },
          ],
        },
        {
          id: "3",
          owner: {
            id: "owner3",
            first_name: "Sophie",
            last_name: "Laurent",
            avatar: "/placeholder.svg?height=40&width=40&text=SL",
            last_seen: "2024-01-18T20:15:00Z",
            online: false,
          },
          last_message: {
            content:
              "Merci pour votre candidature. Malheureusement, nous avons sélectionné un autre profil. Bonne recherche !",
            timestamp: "2024-01-18T20:15:00Z",
            sender_id: "owner3",
          },
          unread_count: 0,
          messages: [
            {
              id: "8",
              sender_id: "tenant1",
              content:
                "Bonjour, j'aimerais soumettre ma candidature pour votre appartement familial. Mon dossier est complet et disponible.",
              timestamp: "2024-01-17T18:00:00Z",
              read: true,
              type: "text",
            },
            {
              id: "9",
              sender_id: "owner3",
              content:
                "Merci pour votre candidature. Malheureusement, nous avons sélectionné un autre profil. Bonne recherche !",
              timestamp: "2024-01-18T20:15:00Z",
              read: true,
              type: "text",
            },
          ],
        },
      ])
      setLoading(false)
    }, 1000)

    // Détecter mobile
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Auto-scroll vers le bas des messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [selectedConversation?.messages])

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return

    const message: Message = {
      id: Date.now().toString(),
      sender_id: "tenant1",
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      read: true,
      type: "text",
    }

    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === selectedConversation.id) {
          return {
            ...conv,
            messages: [...conv.messages, message],
            last_message: {
              content: message.content,
              timestamp: message.timestamp,
              sender_id: message.sender_id,
            },
          }
        }
        return conv
      }),
    )

    setSelectedConversation((prev) =>
      prev
        ? {
            ...prev,
            messages: [...prev.messages, message],
          }
        : null,
    )

    setNewMessage("")
    toast.success("Message envoyé")
  }

  const markAsRead = (conversationId: string) => {
    setConversations((prev) => prev.map((conv) => (conv.id === conversationId ? { ...conv, unread_count: 0 } : conv)))
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
                  {conversations.reduce((sum, conv) => sum + conv.unread_count, 0)} non lus
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
                  {filteredConversations.map((conversation) => (
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
                            <AvatarImage src={conversation.owner.avatar || "/placeholder.svg"} />
                            <AvatarFallback>
                              {conversation.owner.first_name[0]}
                              {conversation.owner.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          {conversation.owner.online && (
                            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {conversation.owner.first_name} {conversation.owner.last_name}
                              </p>
                              {conversation.property && (
                                <p className="text-xs text-muted-foreground truncate">{conversation.property.title}</p>
                              )}
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-xs text-muted-foreground">
                                {formatTime(conversation.last_message.timestamp)}
                              </span>
                              {conversation.unread_count > 0 && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs h-4 w-4 p-0 flex items-center justify-center mt-1"
                                >
                                  {conversation.unread_count}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {conversation.last_message.sender_id === "tenant1" ? "Vous: " : ""}
                            {conversation.last_message.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
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
                        <AvatarImage src={selectedConversation.owner.avatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {selectedConversation.owner.first_name[0]}
                          {selectedConversation.owner.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      {selectedConversation.owner.online && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {selectedConversation.owner.first_name} {selectedConversation.owner.last_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedConversation.owner.online
                          ? "En ligne"
                          : `Vu ${formatTime(selectedConversation.owner.last_seen || "")}`}
                      </p>
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
                        src={selectedConversation.property.image || "/placeholder.svg"}
                        alt={selectedConversation.property.title}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{selectedConversation.property.title}</h4>
                        <p className="text-xs text-muted-foreground">{selectedConversation.property.address}</p>
                        <p className="text-sm font-semibold text-blue-600">
                          {selectedConversation.property.price} €/mois
                        </p>
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
                    {selectedConversation.messages.map((message) => {
                      const isOwn = message.sender_id === "tenant1"
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
                                {formatTime(message.timestamp)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
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
