"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { User, MapPin, Calendar, Euro, FileText, Eye, Check, X, TrendingUp } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface ModernApplicationCardProps {
  application: {
    id: string
    status: string
    created_at: string
    tenant: {
      id: string
      first_name: string
      last_name: string
      email: string
      phone?: string
      avatar_url?: string
    }
    property: {
      id: string
      title: string
      address: string
      price: number
      type: string
    }
    rental_file?: {
      id: string
      completion_percentage: number
      monthly_income?: number
      employment_type?: string
      guarantor_type?: string
    }
    matching_score?: number
  }
  onStatusChange?: (applicationId: string, newStatus: string) => void
  showActions?: boolean
}

export function ModernApplicationCard({ application, onStatusChange, showActions = true }: ModernApplicationCardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [matchingScore, setMatchingScore] = useState<number | null>(null)
  const [scoreLoading, setScoreLoading] = useState(true)

  useEffect(() => {
    if (application.matching_score !== undefined) {
      setMatchingScore(application.matching_score)
      setScoreLoading(false)
    } else {
      calculateMatchingScore()
    }
  }, [application])

  const calculateMatchingScore = async () => {
    try {
      setScoreLoading(true)

      // Récupérer les préférences de scoring du propriétaire
      const preferencesResponse = await fetch(`/api/scoring-preferences/${application.property.id}`)
      let preferences = null

      if (preferencesResponse.ok) {
        const preferencesData = await preferencesResponse.json()
        preferences = preferencesData.preferences
      }

      // Calculer le score avec les préférences personnalisées ou les critères par défaut
      let score = 0
      let totalWeight = 0

      if (application.rental_file) {
        const file = application.rental_file

        // Critères de base avec poids par défaut ou personnalisés
        const criteria = preferences
          ? {
              income: preferences.income_weight || 30,
              employment: preferences.employment_weight || 25,
              guarantor: preferences.guarantor_weight || 20,
              completion: preferences.completion_weight || 25,
            }
          : {
              income: 30,
              employment: 25,
              guarantor: 20,
              completion: 25,
            }

        // Score basé sur les revenus
        if (file.monthly_income && application.property.price) {
          const incomeRatio = file.monthly_income / application.property.price
          let incomeScore = 0

          if (incomeRatio >= 3) incomeScore = 100
          else if (incomeRatio >= 2.5) incomeScore = 80
          else if (incomeRatio >= 2) incomeScore = 60
          else if (incomeRatio >= 1.5) incomeScore = 40
          else incomeScore = 20

          score += (incomeScore * criteria.income) / 100
          totalWeight += criteria.income
        }

        // Score basé sur le type d'emploi
        if (file.employment_type) {
          let employmentScore = 0

          switch (file.employment_type) {
            case "cdi":
              employmentScore = 100
              break
            case "cdd":
              employmentScore = 70
              break
            case "freelance":
              employmentScore = 60
              break
            case "student":
              employmentScore = 50
              break
            case "unemployed":
              employmentScore = 20
              break
            default:
              employmentScore = 40
          }

          score += (employmentScore * criteria.employment) / 100
          totalWeight += criteria.employment
        }

        // Score basé sur le garant
        if (file.guarantor_type) {
          let guarantorScore = 0

          switch (file.guarantor_type) {
            case "family":
              guarantorScore = 90
              break
            case "professional":
              guarantorScore = 100
              break
            case "insurance":
              guarantorScore = 80
              break
            case "none":
              guarantorScore = 30
              break
            default:
              guarantorScore = 50
          }

          score += (guarantorScore * criteria.guarantor) / 100
          totalWeight += criteria.guarantor
        }

        // Score basé sur la complétude du dossier
        const completionScore = file.completion_percentage || 0
        score += (completionScore * criteria.completion) / 100
        totalWeight += criteria.completion
      }

      // Normaliser le score sur 100
      const finalScore = totalWeight > 0 ? Math.round((score / totalWeight) * 100) : 0
      setMatchingScore(Math.min(100, Math.max(0, finalScore)))
    } catch (error) {
      console.error("Erreur calcul score:", error)
      setMatchingScore(0)
    } finally {
      setScoreLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      setLoading(true)

      const response = await fetch(`/api/applications/${application.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour")
      }

      toast.success(
        newStatus === "accepted"
          ? "Candidature acceptée"
          : newStatus === "rejected"
            ? "Candidature refusée"
            : "Statut mis à jour",
      )

      if (onStatusChange) {
        onStatusChange(application.id, newStatus)
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la mise à jour")
    } finally {
      setLoading(false)
    }
  }

  const handleViewAnalysis = () => {
    router.push(`/owner/applications/${application.id}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "accepted":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "under_review":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "En attente"
      case "accepted":
        return "Acceptée"
      case "rejected":
        return "Refusée"
      case "under_review":
        return "En cours d'examen"
      default:
        return status
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent"
    if (score >= 60) return "Bon"
    if (score >= 40) return "Moyen"
    return "Faible"
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={application.tenant.avatar_url || "/placeholder.svg"} />
              <AvatarFallback>
                {application.tenant.first_name[0]}
                {application.tenant.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">
                {application.tenant.first_name} {application.tenant.last_name}
              </CardTitle>
              <p className="text-sm text-muted-foreground flex items-center">
                <User className="h-4 w-4 mr-1" />
                {application.tenant.email}
              </p>
            </div>
          </div>
          <Badge className={getStatusColor(application.status)}>{getStatusLabel(application.status)}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informations sur le bien */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="font-medium text-sm mb-2">{application.property.title}</h4>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {application.property.address}
            </span>
            <span className="flex items-center font-medium">
              <Euro className="h-4 w-4 mr-1" />
              {application.property.price}€/mois
            </span>
          </div>
        </div>

        {/* Score de matching */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              Score de compatibilité
            </span>
            {scoreLoading ? (
              <div className="animate-pulse bg-gray-200 h-4 w-12 rounded"></div>
            ) : (
              <span className={`text-sm font-bold ${getScoreColor(matchingScore || 0)}`}>
                {matchingScore || 0}% - {getScoreLabel(matchingScore || 0)}
              </span>
            )}
          </div>
          {!scoreLoading && <Progress value={matchingScore || 0} className="h-2" />}
        </div>

        {/* Informations sur le dossier */}
        {application.rental_file && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center">
                <FileText className="h-4 w-4 mr-1" />
                Dossier locataire
              </span>
              <span className="text-sm text-muted-foreground">
                {application.rental_file.completion_percentage}% complété
              </span>
            </div>
            <Progress value={application.rental_file.completion_percentage} className="h-2" />

            {application.rental_file.monthly_income && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Revenus mensuels:</span>
                <span className="font-medium">
                  {application.rental_file.monthly_income}€
                  {application.property.price && (
                    <span className="text-muted-foreground ml-1">
                      ({(application.rental_file.monthly_income / application.property.price).toFixed(1)}x)
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Date de candidature */}
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 mr-1" />
          Candidature du {format(new Date(application.created_at), "dd MMMM yyyy", { locale: fr })}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center space-x-2 pt-2">
            <Button variant="outline" size="sm" onClick={handleViewAnalysis} className="flex-1">
              <Eye className="h-4 w-4 mr-1" />
              Voir analyse
            </Button>

            {application.status === "pending" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange("accepted")}
                  disabled={loading}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange("rejected")}
                  disabled={loading}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}

            {application.status === "accepted" && (
              <Button
                size="sm"
                onClick={() => router.push(`/owner/leases/new?application=${application.id}`)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <FileText className="h-4 w-4 mr-1" />
                Générer bail
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
