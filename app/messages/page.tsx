"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchIcon, MessageSquareIcon, UserIcon, HomeIcon, PinIcon, ArchiveIcon, SendIcon } from "lucide-react"

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  // Mock data - in real app, this would come from API
  const conversations = [
    {
      id: 1,
      participantName: "Jean Martin",
      participantRole: "Propriétaire",
      propertyTitle: "Appartement 3P - Belleville",
      lastMessage: "Parfait, je vous confirme le rendez-vous pour demain à 14h.",
      lastMessageTime: "2025-05-23T10:30:00",
      unreadCount: 0,
      status: "active",
      avatar: "JM",
      isOnline: true,
    },
    {
      id: 2,
      participantName: "Marie Dubois",
      participantRole: "Propriétaire",
      propertyTitle: "Studio meublé - République",
      lastMessage: "Avez-vous reçu les documents que j'ai envoyés ?",
      lastMessageTime: "2025-05-23T09:15:00",
      unreadCount: 2,
      status: "active",
      avatar: "MD",
      isOnline: false,
    },
    {
      id: 3,
      participantName: "Pierre Leroy",
      participantRole: "Locataire",
      propertyTitle: "Maison 4P - Montreuil",
      lastMessage: "Merci pour votre réponse rapide !",
      lastMessageTime: "2025-05-22T16:45:00",
      unreadCount: 0,
      status: "archived",
      avatar: "PL",
      isOnline: false,
    },
  ]

  const messages = [
    {
      id: 1,
      conversationId: 1,
      senderId: "landlord_1",
      senderName: "Jean Martin",
      content: "Bonjour, j'ai bien reçu votre candidature pour l'appartement. Pouvons-nous organiser une visite ?",
      timestamp: "2025-05-22T14:30:00",
      type: "text",
    },
    {
      id: 2,
      conversationId: 1,
      senderId: "tenant_1",
      senderName: "Vous",
      content: "Bonjour, oui bien sûr ! Je suis disponible cette semaine. Quels créneaux vous conviennent ?",
      timestamp: "2025-05-22T15:15:00",
      type: "text",
    },
    {
      id: 3,
      conversationId: 1,
      senderId: "landlord_1",
      senderName: "Jean Martin",
      content:
        "Parfait ! Je vous propose demain (jeudi) à 14h ou vendredi à 16h. Qu'est-ce qui vous arrange le mieux ?",
      timestamp: "2025-05-22T15:45:00",
      type: "text",
    },
    {
      id: 4,
      conversationId: 1,
      senderId: "tenant_1",
      senderName: "Vous",
      content: "Jeudi à 14h me convient parfaitement !",
      timestamp: "2025-05-22T16:00:00",
      type: "text",
    },
    {
      id: 5,
      conversationId: 1,
      senderId: "landlord_1",
      senderName: "Jean Martin",
      content:
        "Parfait, je vous confirme le rendez-vous pour demain à 14h. L'adresse exacte est 15 rue de Belleville, 3ème étage sans ascenseur. L'interphone est au nom de Martin.",
      timestamp: "2025-05-23T10:30:00",
      type: "text",
    },
  ]

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      conv.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || conv.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const selectedConversationData = conversations.find((c) => c.id === selectedConversation)
  const conversationMessages = messages.filter((m) => m.conversationId === selectedConversation)

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    } else if (diffInHours < 48) {
      return "Hier"
    } else {
      return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
    }
  }

  const getUnreadCount = () => {
    return conversations.reduce((total, conv) => total + conv.unreadCount, 0)
  }

  return (
    <div className="container mx-auto py-6 h-screen max-h-screen overflow-hidden">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Messages</h1>
        <p className="text-muted-foreground">Communiquez avec les propriétaires et locataires</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <div className="lg:col-span-1 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardContent className="p-4 flex-1 flex flex-col">
              {/* Search and Filters */}
              <div className="space-y-4 mb-4">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Rechercher une conversation..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Tabs value={filterStatus} onValueChange={setFilterStatus}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all">Toutes ({conversations.length})</TabsTrigger>
                    <TabsTrigger value="active">
                      Actives ({conversations.filter((c) => c.status === "active").length})
                    </TabsTrigger>
                    <TabsTrigger value="archived">
                      Archivées ({conversations.filter((c) => c.status === "archived").length})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Conversations */}
              <div className="flex-1 overflow-y-auto space-y-2">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedConversation === conversation.id
                        ? "bg-primary/10 border border-primary"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedConversation(conversation.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-medium">
                          {conversation.avatar}
                        </div>
                        {conversation.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium truncate">{conversation.participantName}</h3>
                          <div className="flex items-center gap-1">
                            {conversation.unreadCount > 0 && (
                              <Badge className="bg-primary text-primary-foreground">{conversation.unreadCount}</Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatTime(conversation.lastMessageTime)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mb-1">
                          <UserIcon className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{conversation.participantRole}</span>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          <HomeIcon className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground truncate">{conversation.propertyTitle}</span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2 flex flex-col">
          {selectedConversationData ? (
            <Card className="flex-1 flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-medium">
                        {selectedConversationData.avatar}
                      </div>
                      {selectedConversationData.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{selectedConversationData.participantName}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <UserIcon className="h-3 w-3" />
                          {selectedConversationData.participantRole}
                        </div>
                        <div className="flex items-center gap-1">
                          <HomeIcon className="h-3 w-3" />
                          {selectedConversationData.propertyTitle}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <PinIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <ArchiveIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {conversationMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderName === "Vous" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        message.senderName === "Vous" ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span
                          className={`text-xs ${
                            message.senderName === "Vous" ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}
                        >
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex items-center gap-2">
                  <Input placeholder="Tapez votre message..." className="flex-1" />
                  <Button size="sm">
                    <SendIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquareIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Sélectionnez une conversation</h3>
                <p className="text-muted-foreground">
                  Choisissez une conversation dans la liste pour commencer à discuter
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
