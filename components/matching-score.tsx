"use client"

import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Euro, Briefcase, Shield, FileText, AlertTriangle, CheckCircle2, Info, Home, Users } from "lucide-react"

interface MatchingScoreProps {
  application: any
  property?: any
  size?: "sm" | "md" | "lg"
  detailed?: boolean
  score?: number
  breakdown?: any
  recommendations?: string[]
  warnings?: string[]
  compatible?: boolean
  modelUsed?: string
}

export function MatchingScore({
  application,
  property,
  size = "md",
  detailed = false,
  score,
  breakdown,
  recommendations = [],
  warnings = [],
  compatible,
  modelUsed,
}: MatchingScoreProps) {
  // Utiliser le score passé en prop ou calculer un score de base
  const displayScore = score !== undefined ? score : calculateBasicScore(application, property)
  const displayBreakdown = breakdown || getBasicBreakdown(application, property)

  const getScoreColor = (score: number) => {
    if (score >= 80) return { color: "text-green-600", bg: "bg-green-100", border: "border-green-200" }
    if (score >= 60) return { color: "text-yellow-600", bg: "bg-yellow-100", border: "border-yellow-200" }
    return { color: "text-red-600", bg: "bg-red-100", border: "border-red-200" }
  }

  const getScoreLabel = (score: number) => {
    if (score >= 85) return "Excellent"
    if (score >= 70) return "Très bon"
    if (score >= 55) return "Bon"
    if (score >= 40) return "Moyen"
    return "Faible"
  }

  const scoreStyle = getScoreColor(displayScore)

  if (size === "sm") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge className={`${scoreStyle.bg} ${scoreStyle.color} ${scoreStyle.border} border`}>
              {displayScore}%
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="w-64">
            <div className="space-y-2">
              <div className="font-medium">Score de compatibilité</div>
              {modelUsed && <div className="text-xs text-muted-foreground">Modèle: {modelUsed}</div>}
              {displayBreakdown &&
                Object.entries(displayBreakdown).map(([key, item]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      {getIconForCriteria(key)}
                      {getCriteriaLabel(key)}
                    </div>
                    <span>
                      {item.score}/{item.max}
                    </span>
                  </div>
                ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (size === "md") {
    return (
      <div className="flex items-center space-x-2">
        <div
          className={`w-12 h-12 rounded-full ${scoreStyle.bg} ${scoreStyle.border} border-2 flex items-center justify-center`}
        >
          <span className={`font-bold text-sm ${scoreStyle.color}`}>{displayScore}</span>
        </div>
        <div>
          <div className={`font-medium text-sm ${scoreStyle.color}`}>{getScoreLabel(displayScore)}</div>
          <div className="text-xs text-muted-foreground">{modelUsed ? `${modelUsed}` : "Score de compatibilité"}</div>
        </div>
      </div>
    )
  }

  // Size lg - detailed view
  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Score de compatibilité</h3>
            <p className="text-sm text-muted-foreground">
              {modelUsed ? `Modèle: ${modelUsed}` : "Analyse automatique du profil"}
            </p>
          </div>
          <div className={`text-3xl font-bold ${scoreStyle.color}`}>{displayScore}%</div>
        </div>

        {displayBreakdown && (
          <div className="space-y-3">
            {Object.entries(displayBreakdown).map(([key, item]: [string, any]) => (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {getIconForCriteria(key)}
                    <span className="font-medium">{getCriteriaLabel(key)}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {item.score}/{item.max}
                  </span>
                </div>
                <Progress value={(item.score / item.max) * 100} className="h-2" />
                {item.details && <div className="text-xs text-muted-foreground">{item.details}</div>}
              </div>
            ))}
          </div>
        )}

        <div className={`mt-4 p-3 rounded-lg ${scoreStyle.bg}`}>
          <div className="flex items-start gap-2">
            {displayScore >= 70 ? (
              <CheckCircle2 className={`h-4 w-4 mt-0.5 ${scoreStyle.color}`} />
            ) : displayScore >= 50 ? (
              <Info className={`h-4 w-4 mt-0.5 ${scoreStyle.color}`} />
            ) : (
              <AlertTriangle className={`h-4 w-4 mt-0.5 ${scoreStyle.color}`} />
            )}
            <div className="text-sm">
              <div className={`font-medium ${scoreStyle.color}`}>{getScoreLabel(displayScore)} candidat</div>
              <div className={`text-xs ${scoreStyle.color} opacity-80 mt-1`}>
                {displayScore >= 70 && "Profil très intéressant, candidature recommandée"}
                {displayScore >= 50 && displayScore < 70 && "Profil correct, à examiner en détail"}
                {displayScore < 50 && "Profil à risque, vérification approfondie nécessaire"}
              </div>
            </div>
          </div>
        </div>

        {/* Affichage des recommandations et avertissements */}
        {recommendations.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium text-sm mb-2">Recommandations</h4>
            <ul className="text-xs space-y-1">
              {recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium text-sm mb-2">Points d'attention</h4>
            <ul className="text-xs space-y-1">
              {warnings.map((warning, index) => (
                <li key={index} className="flex items-start gap-1">
                  <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Fonctions utilitaires
function getIconForCriteria(key: string) {
  const icons = {
    income_ratio: <Euro className="h-3 w-3" />,
    guarantor: <Shield className="h-3 w-3" />,
    professional_stability: <Briefcase className="h-3 w-3" />,
    file_quality: <FileText className="h-3 w-3" />,
    property_coherence: <Home className="h-3 w-3" />,
    income_distribution: <Users className="h-3 w-3" />,
  }
  return icons[key as keyof typeof icons] || <Info className="h-3 w-3" />
}

function getCriteriaLabel(key: string) {
  const labels = {
    income_ratio: "Revenus",
    guarantor: "Garant",
    professional_stability: "Stabilité",
    file_quality: "Dossier",
    property_coherence: "Cohérence",
    income_distribution: "Répartition",
  }
  return labels[key as keyof typeof labels] || key
}

// Calcul de score de base (fallback)
function calculateBasicScore(application: any, property: any): number {
  if (!application || !property?.price) return 50

  let score = 0
  const rent = property.price

  // Ratio revenus/loyer (40 points)
  if (application.income && rent) {
    const ratio = application.income / rent
    if (ratio >= 3.5) score += 40
    else if (ratio >= 3) score += 35
    else if (ratio >= 2.5) score += 25
    else if (ratio >= 2) score += 15
    else score += 5
  }

  // Garant (20 points)
  if (application.has_guarantor) {
    score += 20
  }

  // Stabilité professionnelle (20 points)
  const contractType = (application.contract_type || "").toLowerCase()
  if (contractType.includes("cdi")) score += 20
  else if (contractType.includes("cdd")) score += 15
  else if (contractType.includes("freelance")) score += 10
  else score += 5

  // Qualité du dossier (20 points)
  if (application.documents_complete) score += 10
  if (application.profession && application.company) score += 10

  return Math.min(100, score)
}

// Breakdown de base (fallback)
function getBasicBreakdown(application: any, property: any) {
  const rent = property?.price || 1
  const income = application?.income || 0
  const ratio = income / rent

  return {
    income_ratio: {
      score: ratio >= 3 ? 18 : ratio >= 2.5 ? 15 : ratio >= 2 ? 10 : 5,
      max: 18,
      details: `Ratio: ${ratio.toFixed(1)}x`,
    },
    guarantor: {
      score: application?.has_guarantor ? 17 : 0,
      max: 17,
      details: application?.has_guarantor ? "Garant présent" : "Pas de garant",
    },
    professional_stability: {
      score: 15,
      max: 17,
      details: application?.contract_type || "Non spécifié",
    },
    file_quality: {
      score: application?.documents_complete ? 16 : 8,
      max: 16,
      details: application?.documents_complete ? "Dossier complet" : "Dossier incomplet",
    },
  }
}
