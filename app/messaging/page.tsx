"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Search, Send, Paperclip, ImageIcon, Home, MoreHorizontal, MessageSquare } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Données simulées
const conversations = [
  {
    id: 1,
    contact: {
      id: 101,
      name: "Jean Dupont",
      avatar: "/placeholder.svg?height=40&width=40&text=JD",
      status: "online",
      lastSeen: new Date(),
      role: "Propriétaire",
    },
    property: {
      id: 1,
      title: "Appartement moderne au centre-ville",
    },
    lastMessage: {
      content: "Bonjour, je voulais savoir si la visite de demain est toujours d'actualité ?",
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      isRead: false,
      sender: "them",
    },
    unreadCount: 1,
  },
  {
    id: 2,
    contact: {
      id: 102,
      name: "Marie Leroy",
      avatar: "/placeholder.svg?height=40&width=40&text=ML",
      status: "offline",
      lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      role: "Propriétaire",
    },
    property: {
      id: 2,
      title: "Studio étudiant rénové",
    },
    lastMessage: {
      content: "Merci pour les informations. Je vous confirme que votre dossier a été accepté.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      isRead: true,
      sender: "them",
    },
    unreadCount: 0,
  },
  {
    id: 3,
    contact: {
      id: 103,
      name: "Sophie Martin",
      avatar: "/placeholder.svg?height=40&width=40&text=SM",
      status: "offline",
      lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
      role: "Locataire",
    },
    property: {
      id: 3,
      title: "Maison familiale avec jardin",
    },
    lastMessage: {
      content: "J'ai bien reçu votre quittance de loyer, merci beaucoup.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
      isRead: true,
      sender: "them",
    },
    unreadCount: 0,
  },
]

const messages = [
  {
    id: 1,
    content: "Bonjour, je suis intéressé par votre appartement. Est-il toujours disponible ?",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    sender: "me",
  },
  {
    id: 2,
    content: "Bonjour, oui l'appartement est toujours disponible. Souhaitez-vous organiser une visite ?",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 30), // 2 days ago + 30 minutes
    sender: "them",
  },
  {
    id: 3,
    content: "Oui, je serais disponible ce week-end. Samedi matin vous conviendrait ?",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1), // 1 day ago
    sender: "me",
  },
  {
    id: 4,
    content: "Samedi matin serait parfait. Disons 10h30 ? Voici l'adresse exacte : 123 Rue Principale, Paris.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1 + 1000 * 60 * 45), // 1 day ago + 45 minutes
    sender: "them",
  },
  {
    id: 5,
    content: "C'est noté pour samedi 10h30. J'ai hâte de découvrir l'appartement.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1 + 1000 * 60 * 60), // 1 day ago + 1 hour
    sender: "me",
  },
  {
    id: 6,
    content: "Bonjour, je voulais savoir si la visite de demain est toujours d'actualité ?",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    sender: "them",
  },
]

export default function MessagingPage() {
  const [activeConversation, setActiveConversation] = useState(conversations[0])
  const [messageInput, setMessageInput] = useState("")

  const formatTime = (date: Date) => {
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

  const handleSendMessage = () => {
    if (messageInput.trim() === "") return
    // Logique pour envoyer le message
    setMessageInput("")
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Messagerie</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)] min-h-[500px]">
        {/* Liste des conversations */}
        <div className="md:col-span-1 border rounded-lg overflow-hidden flex flex-col">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Rechercher..." className="pl-8" />
            </div>
          </div>

          <Tabs defaultValue="all" className="flex-1 flex flex-col">
            <div className="px-3 pt-2">
              <TabsList className="w-full">
                <TabsTrigger value="all" className="flex-1">
                  Tous
                </TabsTrigger>
                <TabsTrigger value="unread" className="flex-1">
                  Non lus
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${
                      activeConversation.id === conversation.id ? "bg-gray-50" : ""
                    }`}
                    onClick={() => setActiveConversation(conversation)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage
                            src={conversation.contact.avatar || "/placeholder.svg"}
                            alt={conversation.contact.name}
                          />
                          <AvatarFallback>
                            {conversation.contact.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                            conversation.contact.status === "online" ? "bg-green-500" : "bg-gray-300"
                          }`}
                        ></span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-sm truncate">{conversation.contact.name}</h3>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatTime(conversation.lastMessage.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mb-1">
                          <Home className="h-3 w-3 inline mr-1" />
                          {conversation.property.title}
                        </p>
                        <div className="flex justify-between items-center">
                          <p className="text-sm truncate">{conversation.lastMessage.content}</p>
                          {conversation.unreadCount > 0 && (
                            <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="unread" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                {conversations
                  .filter((c) => c.unreadCount > 0)
                  .map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${
                        activeConversation.id === conversation.id ? "bg-gray-50" : ""
                      }`}
                      onClick={() => setActiveConversation(conversation)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <Avatar>
                            <AvatarImage
                              src={conversation.contact.avatar || "/placeholder.svg"}
                              alt={conversation.contact.name}
                            />
                            <AvatarFallback>
                              {conversation.contact.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                              conversation.contact.status === "online" ? "bg-green-500" : "bg-gray-300"
                            }`}
                          ></span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium text-sm truncate">{conversation.contact.name}</h3>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatTime(conversation.lastMessage.timestamp)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mb-1">
                            <Home className="h-3 w-3 inline mr-1" />
                            {conversation.property.title}
                          </p>
                          <div className="flex justify-between items-center">
                            <p className="text-sm truncate">{conversation.lastMessage.content}</p>
                            {conversation.unreadCount > 0 && (
                              <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Conversation active */}
        <div className="md:col-span-2 border rounded-lg overflow-hidden flex flex-col">
          {activeConversation ? (
            <>
              <div className="p-3 border-b flex justify-between items-center">
                <div className="flex items-center">
                  <div className="relative mr-3">
                    <Avatar>
                      <AvatarImage
                        src={activeConversation.contact.avatar || "/placeholder.svg"}
                        alt={activeConversation.contact.name}
                      />
                      <AvatarFallback>
                        {activeConversation.contact.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                        activeConversation.contact.status === "online" ? "bg-green-500" : "bg-gray-300"
                      }`}
                    ></span>
                  </div>
                  <div>
                    <h3 className="font-medium">{activeConversation.contact.name}</h3>
                    <div className="flex items-center">
                      <p className="text-xs text-muted-foreground">
                        {activeConversation.contact.status === "online"
                          ? "En ligne"
                          : `Vu ${formatTime(activeConversation.contact.lastSeen)}`}
                      </p>
                      <span className="mx-1 text-muted-foreground">•</span>
                      <p className="text-xs text-muted-foreground">{activeConversation.contact.role}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Voir le profil</DropdownMenuItem>
                      <DropdownMenuItem>Voir l'annonce</DropdownMenuItem>
                      <DropdownMenuItem>Marquer comme lu</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Bloquer</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    <div className="text-center">
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                        Début de la conversation
                      </span>
                    </div>

                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] ${
                            message.sender === "me"
                              ? "bg-blue-600 text-white rounded-tl-lg rounded-tr-lg rounded-bl-lg"
                              : "bg-gray-100 text-gray-800 rounded-tl-lg rounded-tr-lg rounded-br-lg"
                          } p-3`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${message.sender === "me" ? "text-blue-100" : "text-gray-500"}`}>
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div className="p-3 border-t">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="rounded-full">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full">
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder="Écrivez votre message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendMessage()
                    }}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={messageInput.trim() === ""}
                    size="icon"
                    className="rounded-full"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="bg-gray-100 p-6 rounded-full inline-block mb-4">
                  <MessageSquare className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Aucune conversation sélectionnée</h3>
                <p className="text-muted-foreground">Sélectionnez une conversation pour commencer à discuter</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
