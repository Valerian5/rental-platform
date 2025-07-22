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
    <Card className="w-full max-w-full hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 overflow-hidden">
      <CardHeader className="pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
        <div className="flex flex-col space-y-3">
          {/* Première ligne : Avatar + Nom + Score + Status */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start space-x-3 min-w-0 flex-1">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                <AvatarImage src="/placeholder.svg?height=48&width=48" />
                <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-sm">
                  {application.tenant?.name
                    ?.split(" ")
                    .map((n: string) => n[0])
                    .join("") || "T"}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                  {application.tenant?.name || "Candidat anonyme"}
                </CardTitle>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              {application.score && <CircularScore score={application.score} size="sm" />}
              <Badge className={`${getStatusColor(application.status)} text-xs px-2 py-1`}>
                {getStatusText(application.status)}
              </Badge>
            </div>
          </div>

          {/* Deuxième ligne : Contact info */}
          <div className="flex flex-col gap-1 pl-0 sm:pl-15">
            <div className="flex items-center text-xs sm:text-sm text-gray-600 min-w-0">
              <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
              <span className="truncate">{application.tenant?.email}</span>
            </div>
            {application.tenant?.phone && (
              <div className="flex items-center text-xs sm:text-sm text-gray-600">
                <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{application.tenant.phone}</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 px-3 sm:px-6 pb-3 sm:pb-6">
        {/* Propriété */}
        {application.property && (
          <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
            <div className="flex items-start space-x-2">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-xs sm:text-sm text-gray-900 truncate">{application.property.title}</h4>
                <p className="text-xs text-gray-600 truncate">{application.property.address}</p>
              </div>
            </div>
          </div>
        )}

        {/* Informations financières et professionnelles */}
        <div className="grid grid-cols-1 gap-2 sm:gap-3">
          <div className="flex items-center space-x-2">
            <Euro className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500">Revenus mensuels</p>
              <p className="font-semibold text-xs sm:text-sm truncate">{application.income?.toLocaleString()} €</p>
            </div>
          </div>

          {application.profession && (
            <div className="flex items-center space-x-2">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500">Profession</p>
                <p className="font-semibold text-xs sm:text-sm truncate">{application.profession}</p>
              </div>
            </div>
          )}
        </div>

        {/* Badges et informations supplémentaires */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          {application.has_guarantor && (
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 px-2 py-0.5">
              Avec garant
            </Badge>
          )}
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="whitespace-nowrap">{new Date(application.created_at).toLocaleDateString("fr-FR")}</span>
          </div>
          {application.visit_requested && (
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 px-2 py-0.5">
              <Clock className="h-3 w-3 mr-1" />
              Visite demandée
            </Badge>
          )}
        </div>

        {/* Message de candidature */}
        {application.message && (
          <div className="bg-blue-50 rounded-lg p-2 sm:p-3 border border-blue-100">
            <p className="text-xs text-gray-600 mb-1">Message de candidature :</p>
            <p className="text-xs sm:text-sm text-gray-800 line-clamp-3 break-words leading-relaxed">
              {application.message}
            </p>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex flex-col gap-2 pt-2 border-t">
            {/* Première ligne : Bouton Examiner */}
            <Button asChild variant="outline" size="sm" className="w-full bg-transparent">
              <Link href={`/owner/applications/${application.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                Examiner
              </Link>
            </Button>

            {/* Deuxième ligne : Actions selon le statut */}
            <div className="flex flex-col sm:flex-row gap-2">
              {application.status === "pending" && (
                <>
                  {onAccept && (
                    <Button
                      onClick={() => onAccept(application.id)}
                      size="sm"
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Accepter
                    </Button>
                  )}

                  {onReject && (
                    <Button onClick={() => onReject(application.id)} variant="destructive" size="sm" className="w-full">
                      <X className="h-4 w-4 mr-2" />
                      Refuser
                    </Button>
                  )}
                </>
              )}

              {onContact && (
                <Button onClick={() => onContact(application.id)} variant="outline" size="sm" className="w-full">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contacter
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
