"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"
import { MessageSquare, Send } from "lucide-react"
import { PageHeader } from "@/components/page-header"

interface Conversation {
  id: string
  participant: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  last_message?: {
    content: string
    created_at: string
  }
  unread_count: number
}

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  sender: {
    first_name: string
    last_name: string
  }
}

export default function OwnerMessagingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  useEffect(() => {
    const conversationParam = searchParams.get("conversation")
    if (conversationParam) {
      setSelectedConversation(conversationParam)
    }
  }, [searchParams])

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

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error("Erreur chargement messages:", error)
      setMessages([])
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
          conversation_id: selectedConversation,
          sender_id: currentUser.id,
          content: newMessage.trim(),
        }),
      })

      if (response.ok) {
        setNewMessage("")
        await loadMessages(selectedConversation)
        await loadConversations(currentUser.id)
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

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversation(conversationId)
    loadMessages(conversationId)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Messagerie" description="Chargement..." />
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Messagerie" description="Communiquez avec vos locataires" />

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
              <div className="space-y-1">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 border-b ${
                      selectedConversation === conversation.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                    }`}
                    onClick={() => handleConversationSelect(conversation.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="/placeholder.svg" />
                        <AvatarFallback>
                          {conversation.participant.first_name[0]}
                          {conversation.participant.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">
                            {conversation.participant.first_name} {conversation.participant.last_name}
                          </p>
                          {conversation.unread_count > 0 && (
                            <Badge className="bg-red-500 text-white text-xs">{conversation.unread_count}</Badge>
                          )}
                        </div>
                        {conversation.last_message && (
                          <p className="text-xs text-muted-foreground truncate">{conversation.last_message.content}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Zone de messages */}
        <Card className="lg:col-span-2">
          {selectedConversation ? (
            <>
              <CardHeader className="border-b">
                <CardTitle>
                  {conversations.find((c) => c.id === selectedConversation)?.participant.first_name}{" "}
                  {conversations.find((c) => c.id === selectedConversation)?.participant.last_name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex flex-col h-[500px]">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">Aucun message dans cette conversation</p>
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
                          <p className="text-xs mt-1 opacity-70">
                            {new Date(message.created_at).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

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
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Sélectionnez une conversation</h3>
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
