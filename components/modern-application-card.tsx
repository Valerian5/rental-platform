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
}

export default function ModernApplicationCard({
  application,
  onAccept,
  onReject,
  onContact,
  showActions = true,
}: ModernApplicationCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "approved":
        return "bg-green-100 text-green-800 border-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      case "withdrawn":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-blue-100 text-blue-800 border-blue-200"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "En attente"
      case "approved":
        return "Approuvée"
      case "rejected":
        return "Refusée"
      case "withdrawn":
        return "Retirée"
      default:
        return status
    }
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
      <CardHeader className="pb-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
          <div className="flex items-start space-x-3 min-w-0 flex-1">
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarImage src="/placeholder.svg?height=48&width=48" />
              <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                {application.tenant?.name
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("") || "T"}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                {application.tenant?.name || "Candidat anonyme"}
              </CardTitle>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
                <div className="flex items-center text-sm text-gray-600 min-w-0">
                  <Mail className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span className="truncate">{application.tenant?.email}</span>
                </div>
                {application.tenant?.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="truncate">{application.tenant.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {application.score && (
              <div className="flex-shrink-0">
                <CircularScore score={application.score} size="sm" />
              </div>
            )}
            <Badge className={`${getStatusColor(application.status)} text-xs whitespace-nowrap`}>
              {getStatusText(application.status)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Propriété */}
        {application.property && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-sm text-gray-900 truncate">{application.property.title}</h4>
                <p className="text-xs text-gray-600 truncate">{application.property.address}</p>
              </div>
            </div>
          </div>
        )}

        {/* Informations financières et professionnelles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center space-x-2">
            <Euro className="h-4 w-4 text-green-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Revenus mensuels</p>
              <p className="font-semibold text-sm truncate">{application.income?.toLocaleString()} €</p>
            </div>
          </div>

          {application.profession && (
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
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
            <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="whitespace-nowrap">{new Date(application.created_at).toLocaleDateString("fr-FR")}</span>
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
            <p className="text-sm text-gray-800 line-clamp-3 break-words">{application.message}</p>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
            <Button asChild variant="outline" size="sm" className="w-full sm:w-auto bg-transparent">
              <Link href={`/owner/applications/${application.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                Examiner
              </Link>
            </Button>

            {application.status === "pending" && (
              <>
                {onAccept && (
                  <Button
                    onClick={() => onAccept(application.id)}
                    size="sm"
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Accepter
                  </Button>
                )}

                {onReject && (
                  <Button
                    onClick={() => onReject(application.id)}
                    variant="destructive"
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Refuser
                  </Button>
                )}
              </>
            )}

            {onContact && (
              <Button
                onClick={() => onContact(application.id)}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Contacter
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
