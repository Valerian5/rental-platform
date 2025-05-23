"use client"

import { CheckCircleIcon, ClockIcon, XCircleIcon, CalendarIcon, MessageSquareIcon } from "lucide-react"

interface VisitTimelineProps {
  visitId: string
}

export function VisitTimeline({ visitId }: VisitTimelineProps) {
  // Mock data - in real app, this would come from API based on visitId
  const events = [
    {
      id: 1,
      type: "created",
      date: "2025-05-20T10:30:00",
      description: "Proposition de visite envoyée",
    },
    {
      id: 2,
      type: "message",
      date: "2025-05-20T14:45:00",
      description: "Message du candidat",
      content: "Bonjour, je suis très intéressé par ce bien. Je confirme ma disponibilité pour le créneau proposé.",
      sender: "tenant",
    },
    {
      id: 3,
      type: "confirmed",
      date: "2025-05-21T09:45:00",
      description: "Visite confirmée",
      slot: { date: "2025-05-25", startTime: "14:00", endTime: "14:30" },
    },
    {
      id: 4,
      type: "message",
      date: "2025-05-22T11:30:00",
      description: "Message du propriétaire",
      content:
        "Parfait, je vous confirme le rendez-vous. L'interphone est au nom de Martin, 3ème étage sans ascenseur.",
      sender: "landlord",
    },
  ]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case "created":
        return <CalendarIcon className="h-5 w-5 text-blue-500" />
      case "confirmed":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case "completed":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case "cancelled":
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case "declined":
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case "message":
        return <MessageSquareIcon className="h-5 w-5 text-purple-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        {events.map((event, index) => (
          <div key={event.id} className="mb-8 flex gap-4">
            <div className="flex flex-col items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                {getEventIcon(event.type)}
              </div>
              {index < events.length - 1 && <div className="h-full w-px bg-muted-foreground/20"></div>}
            </div>
            <div className="flex-1 pt-1.5 space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{event.description}</h3>
                <div className="text-sm text-muted-foreground">
                  {formatDate(event.date)} à {formatTime(event.date)}
                </div>
              </div>

              {event.type === "message" && event.content && (
                <div
                  className={`p-3 rounded-lg text-sm ${
                    event.sender === "tenant"
                      ? "bg-blue-50 border border-blue-200"
                      : "bg-gray-50 border border-gray-200"
                  }`}
                >
                  {event.content}
                </div>
              )}

              {event.type === "confirmed" && event.slot && (
                <div className="text-sm">
                  Créneau confirmé: {formatDate(event.slot.date)} de {event.slot.startTime} à {event.slot.endTime}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
