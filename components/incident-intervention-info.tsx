"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Euro,
  Building,
  Wrench
} from "lucide-react"

interface InterventionInfo {
  id: string
  type: "owner" | "external"
  scheduled_date: string
  description: string
  provider_name?: string
  provider_contact?: string
  estimated_cost?: number
  status: "scheduled" | "in_progress" | "completed" | "cancelled"
  created_at: string
  updated_at: string
}

interface IncidentInterventionInfoProps {
  intervention: InterventionInfo
  isOwner?: boolean
}

export default function IncidentInterventionInfo({ 
  intervention, 
  isOwner = false 
}: IncidentInterventionInfoProps) {
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString("fr-FR", { 
        weekday: "long", 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      }),
      time: date.toLocaleTimeString("fr-FR", { 
        hour: "2-digit", 
        minute: "2-digit" 
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled": return <Badge className="bg-blue-600">Programmée</Badge>
      case "in_progress": return <Badge className="bg-orange-600">En cours</Badge>
      case "completed": return <Badge className="bg-green-600">Terminée</Badge>
      case "cancelled": return <Badge variant="destructive">Annulée</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeLabel = (type: string) => {
    return type === "owner" ? "Par le propriétaire" : "Par un professionnel"
  }

  const { date, time } = formatDateTime(intervention.scheduled_date)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Intervention programmée
          {getStatusBadge(intervention.status)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date et heure */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-600" />
          <div>
            <p className="font-medium">{date}</p>
            <p className="text-sm text-gray-600">à {time}</p>
          </div>
        </div>

        {/* Type d'intervention */}
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-gray-600" />
          <span className="text-sm">{getTypeLabel(intervention.type)}</span>
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium text-gray-600">Description :</label>
          <p className="text-sm mt-1 p-3 bg-gray-50 rounded-lg">
            {intervention.description}
          </p>
        </div>

        {/* Informations du prestataire (si intervention externe) */}
        {intervention.type === "external" && intervention.provider_name && (
          <div className="space-y-2 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              <span className="font-medium">{intervention.provider_name}</span>
            </div>
            
            {intervention.provider_contact && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3 w-3" />
                <span>{intervention.provider_contact}</span>
              </div>
            )}
          </div>
        )}

        {/* Coût estimé */}
        {intervention.estimated_cost && (
          <div className="flex items-center gap-2">
            <Euro className="h-4 w-4 text-green-600" />
            <span className="text-sm">
              <strong>Coût estimé :</strong> {intervention.estimated_cost}€
            </span>
          </div>
        )}

        {/* Informations supplémentaires pour le propriétaire */}
        {isOwner && (
          <div className="pt-3 border-t">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>
                Programmée le {new Date(intervention.created_at).toLocaleDateString("fr-FR")}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
