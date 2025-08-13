"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Shield,
  Star,
  User,
  Euro,
  Briefcase,
  FileText,
  Eye,
  MessageSquare,
  Calendar,
  CheckCircle,
  XCircle,
} from "lucide-react"

interface ApplicationCardWithDossierFacileBadgeProps {
  application: any
  onAction: (action: string) => void
}

export function ApplicationCardWithDossierFacileBadge({
  application,
  onAction,
}: ApplicationCardWithDossierFacileBadgeProps) {
  const isDossierFacileCertified =
    application.is_dossierfacile_certified || application.creation_method === "dossierfacile"

  const formatAmount = (amount: number | undefined) => {
    if (!amount) return "Non spécifié"
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = () => {
    switch (application.status) {
      case "pending":
        return <Badge variant="outline">En attente</Badge>
      case "analyzing":
        return <Badge variant="secondary">En analyse</Badge>
      case "accepted":
        return <Badge className="bg-green-100 text-green-800">Acceptée</Badge>
      case "rejected":
        return <Badge variant="destructive">Refusée</Badge>
      default:
        return <Badge variant="outline">{application.status}</Badge>
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <User className="h-5 w-5 text-blue-600" />
            <span>
              {application.tenant?.first_name} {application.tenant?.last_name}
            </span>
            {isDossierFacileCertified && (
              <Badge className="bg-green-100 text-green-800 border-green-300">
                <Shield className="h-3 w-3 mr-1" />
                <Star className="h-3 w-3 mr-1" />
                DossierFacile Certifié
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge()}
            {application.match_score && (
              <Badge variant="outline" className="bg-blue-50">
                Score: {application.match_score}/100
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informations principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Euro className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Revenus</p>
              <p className="font-medium">{formatAmount(application.monthly_income)}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Briefcase className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Profession</p>
              <p className="font-medium">{application.profession || "Non spécifié"}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Garant</p>
              <p className="font-medium">{application.has_guarantor ? "Oui" : "Non"}</p>
            </div>
          </div>
        </div>

        {/* Badge spécial DossierFacile */}
        {isDossierFacileCertified && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-green-600" />
              <Star className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800">Dossier certifié DossierFacile</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Ce candidat a un dossier certifié conforme par le service public DossierFacile. Tous les documents ont été
              vérifiés officiellement.
            </p>
            {application.dossierfacile_verification_code && (
              <p className="text-xs text-green-600 mt-1">
                Code de vérification: {application.dossierfacile_verification_code}
              </p>
            )}
          </div>
        )}

        {/* Message de présentation */}
        {application.presentation_message && (
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="font-medium text-gray-900 mb-2">Message du candidat :</h4>
            <p className="text-sm text-gray-700 line-clamp-3">{application.presentation_message}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Button size="sm" onClick={() => onAction("analyze")} className="flex-1 min-w-[120px]">
            <Eye className="h-4 w-4 mr-1" />
            Analyser
          </Button>

          {isDossierFacileCertified && application.dossierfacile_pdf_url && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAction("view_dossierfacile")}
              className="flex-1 min-w-[120px]"
            >
              <FileText className="h-4 w-4 mr-1" />
              Voir PDF
            </Button>
          )}

          <Button size="sm" variant="outline" onClick={() => onAction("contact")}>
            <MessageSquare className="h-4 w-4 mr-1" />
            Contacter
          </Button>

          {application.status === "analyzing" && (
            <>
              <Button size="sm" variant="outline" onClick={() => onAction("propose_visit")}>
                <Calendar className="h-4 w-4 mr-1" />
                Visite
              </Button>

              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => onAction("accept")}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Accepter
              </Button>

              <Button size="sm" variant="destructive" onClick={() => onAction("refuse")}>
                <XCircle className="h-4 w-4 mr-1" />
                Refuser
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
