"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  ImageIcon, 
  Clock,
  User,
  Building
} from "lucide-react"
import { incidentTicketingService, IncidentTicket } from "@/lib/incident-ticketing-service"
import { toast } from "sonner"

interface IncidentTicketingProps {
  incidentId: string
  currentUser: {
    id: string
    user_type: "owner" | "tenant"
    first_name: string
    last_name: string
  }
  onTicketSent?: () => void
}

export default function IncidentTicketing({ 
  incidentId, 
  currentUser, 
  onTicketSent 
}: IncidentTicketingProps) {
  const [tickets, setTickets] = useState<IncidentTicket[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [attachments, setAttachments] = useState<FileList | null>(null)
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadTickets()
  }, [incidentId])

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [tickets])

  const loadTickets = async () => {
    try {
      setLoading(true)
      const ticketsData = await incidentTicketingService.getIncidentTickets(incidentId)
      setTickets(ticketsData)
    } catch (error) {
      console.error("❌ Erreur chargement tickets:", error)
      toast.error("Erreur lors du chargement des messages")
    } finally {
      setLoading(false)
    }
  }

  const sendTicket = async () => {
    if (!newMessage.trim()) {
      toast.error("Veuillez saisir un message")
      return
    }

    try {
      setSending(true)
      
      // Traitement des pièces jointes si nécessaire
      const attachmentUrls: string[] = []
      if (attachments && attachments.length > 0) {
        // Ici vous pouvez implémenter l'upload des fichiers
        // Pour l'instant, on stocke juste les noms
        attachmentUrls.push(...Array.from(attachments).map(file => file.name))
      }

      const ticketData = {
        incident_id: incidentId,
        user_id: currentUser.id,
        user_type: currentUser.user_type,
        message: newMessage.trim(),
        attachments: attachmentUrls
      }

      const newTicket = await incidentTicketingService.createIncidentTicket(ticketData)
      setTickets(prev => [...prev, newTicket])
      setNewMessage("")
      setAttachments(null)
      
      toast.success("Message envoyé avec succès")
      onTicketSent?.()
    } catch (error) {
      console.error("❌ Erreur envoi ticket:", error)
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

  const getAuthorInitials = (authorName: string) => {
    return authorName
      .split(" ")
      .map(name => name.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getAuthorBadgeColor = (authorType: string) => {
    return authorType === "owner" ? "bg-blue-600" : "bg-gray-600"
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages de l'incident
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Chargement des messages...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Messages de l'incident
          {tickets.length > 0 && (
            <Badge variant="secondary">{tickets.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Zone des messages */}
        <ScrollArea 
          ref={scrollAreaRef}
          className="h-[400px] p-4 border-b"
        >
          {tickets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aucun message pour le moment</p>
              <p className="text-sm">Soyez le premier à envoyer un message</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`flex gap-3 ${
                    ticket.author_id === currentUser.id ? "flex-row-reverse" : ""
                  }`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className={getAuthorBadgeColor(ticket.author_type)}>
                      {getAuthorInitials(ticket.author_name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div
                    className={`max-w-[70%] ${
                      ticket.author_id === currentUser.id ? "items-end" : "items-start"
                    } flex flex-col`}
                  >
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        ticket.author_id === currentUser.id
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {ticket.author_id === currentUser.id ? "Vous" : ticket.author_name}
                        </span>
                        <Badge 
                          variant={ticket.author_type === "owner" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {ticket.author_type === "owner" ? "Propriétaire" : "Locataire"}
                        </Badge>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{ticket.message}</p>
                      
                      {/* Pièces jointes */}
                      {ticket.attachments && ticket.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {ticket.attachments.map((attachment, index) => {
                            const isImage = attachment.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                            const isPdf = attachment.match(/\.pdf$/i)
                            
                            return (
                              <div
                                key={index}
                                className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded"
                              >
                                <Paperclip className="h-3 w-3" />
                                {isImage ? (
                                  <img
                                    src={attachment.startsWith("http") ? attachment : `/api/incidents/${incidentId}/photos/${attachment}`}
                                    alt={`Pièce jointe ${index + 1}`}
                                    className="w-16 h-16 object-cover rounded border cursor-pointer hover:opacity-80"
                                    onClick={() => window.open(attachment.startsWith("http") ? attachment : `/api/incidents/${incidentId}/photos/${attachment}`, "_blank")}
                                    onError={(e) => {
                                      e.currentTarget.src = "/placeholder.svg?height=64&width=64&text=Image+non+disponible"
                                    }}
                                  />
                                ) : (
                                  <a
                                    href={attachment.startsWith("http") ? attachment : `/api/incidents/${incidentId}/photos/${attachment}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline cursor-pointer"
                                  >
                                    {isPdf ? "📄 " : "📎 "}{attachment.split('/').pop()}
                                  </a>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(ticket.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Zone de saisie */}
        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Tapez votre message..."
              className="flex-1 min-h-[80px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  sendTicket()
                }
              }}
            />
          </div>
          
          {/* Pièces jointes */}
          <div className="flex items-center gap-2">
            <Input
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              onChange={(e) => setAttachments(e.target.files)}
              className="hidden"
              id="attachments"
            />
            <label
              htmlFor="attachments"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
            >
              <Paperclip className="h-4 w-4" />
              <span>Pièces jointes</span>
            </label>
            
            {attachments && attachments.length > 0 && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <span>{attachments.length} fichier(s) sélectionné(s)</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAttachments(null)}
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              Appuyez sur Entrée pour envoyer, Maj+Entrée pour une nouvelle ligne
            </div>
            <Button
              onClick={sendTicket}
              disabled={!newMessage.trim() || sending}
              className="flex items-center gap-2"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
              {sending ? "Envoi..." : "Envoyer"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
