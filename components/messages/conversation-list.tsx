"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchIcon, UserIcon, HomeIcon } from "lucide-react"

interface Conversation {
  id: number
  participantName: string
  participantRole: string
  propertyTitle: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  status: string
  avatar: string
  isOnline: boolean
  priority?: string
}

interface ConversationListProps {
  conversations: Conversation[]
  selectedConversation: number | null
  onSelectConversation: (id: number) => void
  userType: "tenant" | "landlord"
}

export function ConversationList({
  conversations,
  selectedConversation,
  onSelectConversation,
  userType,
}: ConversationListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      conv.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase())

    let matchesFilter = true
    if (filterStatus === "unread") {
      matchesFilter = conv.unreadCount > 0
    } else if (filterStatus === "urgent" && userType === "landlord") {
      matchesFilter = conv.priority === "urgent"
    } else if (filterStatus !== "all") {
      matchesFilter = conv.status === filterStatus
    }

    return matchesSearch && matchesFilter
  })

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

  const getPriorityBadge = (priority?: string) => {
    if (priority === "urgent") {
      return (
        <Badge variant="destructive" className="text-xs">
          Urgent
        </Badge>
      )
    }
    return null
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Rechercher une conversation..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b">
        <Tabs value={filterStatus} onValueChange={setFilterStatus}>
          <TabsList className={`grid w-full ${userType === "landlord" ? "grid-cols-4" : "grid-cols-3"}`}>
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="unread">Non lues ({conversations.filter((c) => c.unreadCount > 0).length})</TabsTrigger>
            {userType === "landlord" && (
              <TabsTrigger value="urgent">
                Urgentes ({conversations.filter((c) => c.priority === "urgent").length})
              </TabsTrigger>
            )}
            <TabsTrigger value="archived">Archivées</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.map((conversation) => (
          <div
            key={conversation.id}
            className={`p-4 border-b cursor-pointer transition-colors ${
              selectedConversation === conversation.id ? "bg-primary/10 border-l-4 border-l-primary" : "hover:bg-muted"
            }`}
            onClick={() => onSelectConversation(conversation.id)}
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
                    {userType === "landlord" && getPriorityBadge(conversation.priority)}
                    {conversation.unreadCount > 0 && (
                      <Badge className="bg-primary text-primary-foreground">{conversation.unreadCount}</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{formatTime(conversation.lastMessageTime)}</span>
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
    </div>
  )
}
