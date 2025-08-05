"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CircularScore } from "@/components/circular-score"
import { Mail, Phone, Euro, Calendar, FileText, MapPin, Eye, Check, X, MessageSquare, Clock } from "lucide-react"
import Link from "next/link"

interface ModernApplicationCardProps {
  application: any
  onAccept?: (id: string) => void
  onReject?: (id: string) => void
  onContact?: (id: string) => void
  showActions?: boolean
  scoringPreferences?: any
  isSelected?: boolean
  onSelect?: (selected: boolean) => void
  onAction?: (action: string) => void
}

export default function ModernApplicationCard({
  application,
  onAccept,
  onReject,
  onContact,
  showActions = true,
  scoringPreferences,
  isSelected = false,
  onSelect,
  onAction,
}: ModernApplicationCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "approved":
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      case "withdrawn":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "visite_proposée":
      case "visit_proposed":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "analyzing":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-blue-100 text-blue-800 border-blue-200"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "En attente"
      case "approved":
      case "accepted":
        return "Approuvée"
      case "rejected":
        return "Refusée"
      case "withdrawn":
        return "Retirée"
      case "visite_proposée":
      case "visit_proposed":
        return "Visite proposée"
      case "analyzing":
        return "En analyse"
      default:
        return status
    }
  }

  const handleAction = (action: string) => {
    if (onAction) {
      onAction(action)
    } else {
      // Fallback vers les anciens handlers
      switch (action) {
        case "accept":
          onAccept?.(application.id)
          break
        case "reject":
          onReject?.(application.id)
          break
        case "contact":
          onContact?.(application.id)
          break
      }
    }
  }

  return (
    <Card className={`w-full hover:shadow-md transition-all duration-200 ${isSelected ? "ring-2 ring-blue-500" : ""}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <Avatar className="h-12 w-12">
              <AvatarImage src="/placeholder.svg?height=48&width=48" />
              <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                {application.tenant?.first_name
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("") || "T"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                {`${application.tenant?.first_name || ""} ${application.tenant?.last_name || ""}`.trim() ||
                  "Candidat anonyme"}
              </CardTitle>

              <div className="flex items-center text-sm text-gray-600 mt-1">
                <Mail className="h-4 w-4 mr-2" />
                <span className="truncate">{application.tenant?.email}</span>
              </div>

              {application.tenant?.phone && (
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>{application.tenant.phone}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end space-y-2">
            <CircularScore score={application.match_score || 50} size="sm" />
            <Badge className={`${getStatusColor(application.status)} text-xs`}>
              {getStatusText(application.status)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Propriété */}
        {application.property && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <div>
                <h4 className="font-medium text-sm text-gray-900">{application.property.title}</h4>
                <p className="text-xs text-gray-600">{application.property.address}</p>
              </div>
            </div>
          </div>
        )}

        {/* Informations financières et professionnelles */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Euro className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-xs text-gray-500">Revenus mensuels</p>
              <p className="font-semibold text-sm">{application.income?.toLocaleString()} €</p>
            </div>
          </div>

          {application.profession && (
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500">Profession</p>
                <p className="font-semibold text-sm truncate">{application.profession}</p>
              </div>
            </div>
          )}
        </div>

        {/* Badges et informations supplémentaires */}
        <div className="flex flex-wrap items-center gap-2">
          {application.has_guarantor && (
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
              Avec garant
            </Badge>
          )}
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="h-3 w-3 mr-1" />
            <span>{new Date(application.created_at).toLocaleDateString("fr-FR")}</span>
          </div>
          {application.visit_requested && (
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              <Clock className="h-3 w-3 mr-1" />
              Visite demandée
            </Badge>
          )}
        </div>

        {/* Message de candidature */}
        {application.message && (
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <p className="text-xs text-gray-600 mb-1">Message de candidature :</p>
            <p className="text-sm text-gray-800 line-clamp-2">{application.message}</p>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex flex-col gap-2 pt-2 border-t">
            <Button asChild variant="outline" size="sm" className="w-full bg-transparent">
              <Link href={`/owner/applications/${application.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                Examiner le dossier
              </Link>
            </Button>

            <div className="flex gap-2">
              {application.status === "pending" && (
                <>
                  <Button
                    onClick={() => handleAction("accept")}
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Accepter
                  </Button>
                  <Button onClick={() => handleAction("reject")} variant="destructive" size="sm" className="flex-1">
                    <X className="h-4 w-4 mr-2" />
                    Refuser
                  </Button>
                </>
              )}

              <Button onClick={() => handleAction("contact")} variant="outline" size="sm" className="flex-1">
                <MessageSquare className="h-4 w-4 mr-2" />
                Contacter
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
