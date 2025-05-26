import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageCircle, User, Calendar, Clock } from "lucide-react"
import Link from "next/link"

interface Conversation {
  id: string
  subject: string
  created_at: string
  updated_at: string
  participants?: Array<{
    user_id: string
    user?: {
      name: string
      email: string
      role: string
    }
  }>
  last_message?: {
    content: string
    created_at: string
    sender_name: string
  }
  unread_count?: number
}

interface ConversationCardProps {
  conversation: Conversation
}

export default function ConversationCard({ conversation }: ConversationCardProps) {
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      return "Il y a moins d'une heure"
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours}h`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `Il y a ${diffInDays}j`
    }
  }

  const otherParticipants = conversation.participants?.filter((p) => p.user?.role !== "owner") || []

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold line-clamp-1">{conversation.subject}</CardTitle>
          {conversation.unread_count && conversation.unread_count > 0 && (
            <Badge className="bg-red-100 text-red-800">
              {conversation.unread_count} nouveau{conversation.unread_count > 1 ? "x" : ""}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-2">
          {otherParticipants.length > 0 && (
            <div className="flex items-center text-sm">
              <User className="h-4 w-4 mr-2 text-gray-500" />
              <span className="font-medium">{otherParticipants.map((p) => p.user?.name).join(", ")}</span>
            </div>
          )}

          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="h-3 w-3 mr-1" />
            <span>Créée le {new Date(conversation.created_at).toLocaleDateString()}</span>
          </div>

          {conversation.last_message && (
            <>
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="h-3 w-3 mr-1" />
                <span>Dernière activité: {getTimeAgo(conversation.last_message.created_at)}</span>
              </div>

              <div className="p-2 bg-gray-50 rounded text-sm">
                <p className="text-xs text-gray-600 mb-1">{conversation.last_message.sender_name}:</p>
                <p className="line-clamp-2">{conversation.last_message.content}</p>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button asChild size="sm" className="flex-1">
            <Link href={`/messaging?conversation=${conversation.id}`}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Ouvrir
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
