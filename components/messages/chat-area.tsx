"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  SendIcon,
  PinIcon,
  ArchiveIcon,
  UserIcon,
  HomeIcon,
  MessageSquareIcon,
  PaperclipIcon,
  SmileIcon,
} from "lucide-react"

interface Message {
  id: number
  conversationId: number
  senderId: string
  senderName: string
  content: string
  timestamp: string
  type: string
}

interface Conversation {
  id: number
  participantName: string
  participantRole: string
  propertyTitle: string
  avatar: string
  isOnline: boolean
  priority?: string
}

interface ChatAreaProps {
  conversation: Conversation | null
  messages: Message[]
  userType: "tenant" | "landlord"
}

export function ChatArea({ conversation, messages, userType }: ChatAreaProps) {
  const [newMessage, setNewMessage] = useState("")

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

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Here you would typically send the message to your API
      console.log("Sending message:", newMessage)
      setNewMessage("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!conversation) {
    return (
      <Card className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <MessageSquareIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Sélectionnez une conversation</h3>
          <p className="text-muted-foreground">Choisissez une conversation dans la liste pour commencer à discuter</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-medium">
                {conversation.avatar}
              </div>
              {conversation.isOnline && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{conversation.participantName}</h3>
                {userType === "landlord" && getPriorityBadge(conversation.priority)}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <UserIcon className="h-3 w-3" />
                  {conversation.participantRole}
                </div>
                <div className="flex items-center gap-1">
                  <HomeIcon className="h-3 w-3" />
                  {conversation.propertyTitle}
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
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.senderName === "Vous" ? "justify-end" : "justify-start"}`}>
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
          <Button variant="ghost" size="sm">
            <PaperclipIcon className="h-4 w-4" />
          </Button>
          <Input
            placeholder="Tapez votre message..."
            className="flex-1"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button variant="ghost" size="sm">
            <SmileIcon className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={handleSendMessage} disabled={!newMessage.trim()}>
            <SendIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
