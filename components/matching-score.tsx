"use client"

import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Euro, Briefcase, Shield, FileText, AlertTriangle, CheckCircle2, Info } from "lucide-react"
import { scoringPreferencesService, type ScoringPreferences } from "@/lib/scoring-preferences-service"

interface MatchingScoreProps {
  application: any
  size?: "sm" | "md" | "lg"
  detailed?: boolean
  customPreferences?: ScoringPreferences | null
}

export function MatchingScore({ application, size = "md", detailed = false, customPreferences }: MatchingScoreProps) {
  const calculateDetailedScore = () => {
    if (customPreferences) {
      // Utiliser le scoring personnalisé
      const result = scoringPreferencesService.calculateCustomScore(
        application,
        application.property,
        customPreferences,
      )
      return {
        breakdown: result.breakdown,
        totalScore: result.totalScore,
      }
    }

    // Garder l'ancien calcul comme fallback
    const property = application.property
    const breakdown = {
      income: { score: 0, max: 35, label: "Revenus", icon: Euro },
      stability: { score: 0, max: 25, label: "Stabilité", icon: Briefcase },
      guarantor: { score: 0, max: 20, label: "Garant", icon: Shield },
      documents: { score: 0, max: 20, label: "Dossier", icon: FileText },
    }

    // Score revenus (35 points max)
    if (application.income && property?.price) {
      const ratio = application.income / property.price
      if (ratio >= 3.5) breakdown.income.score = 35
      else if (ratio >= 3) breakdown.income.score = 30
      else if (ratio >= 2.5) breakdown.income.score = 25
      else if (ratio >= 2) breakdown.income.score = 15
      else breakdown.income.score = 5
    } else {
      breakdown.income.score = 10 // Score de base
    }

    // Score stabilité (25 points max)
    switch (application.contract_type) {
      case "CDI":
        breakdown.stability.score = 25
        break
      case "CDD":
        breakdown.stability.score = 18
        break
      case "freelance":
        breakdown.stability.score = 12
        break
      case "student":
        breakdown.stability.score = 8
        break
      default:
        breakdown.stability.score = 10
    }

    // Score garant (20 points max)
    if (application.has_guarantor) {
      breakdown.guarantor.score = 15
      if (application.guarantor_income && property?.price) {
        const guarantorRatio = application.guarantor_income / property.price
        if (guarantorRatio >= 3) breakdown.guarantor.score = 20
      }
    } else {
      breakdown.guarantor.score = 0
    }

    // Score dossier (20 points max)
    let docScore = 0
    if (application.presentation && application.presentation.length > 100) docScore += 8
    else if (application.message && application.message.length > 50) docScore += 5

    if (application.profession && application.company) docScore += 6
    if (application.move_in_date) docScore += 3
    if (application.duration_preference) docScore += 3

    breakdown.documents.score = Math.min(docScore, 20)

    const totalScore = Object.values(breakdown).reduce((sum, item) => sum + item.score, 0)

    return { breakdown, totalScore }
  }

  const { breakdown, totalScore } = calculateDetailedScore()

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

  const scoreStyle = getScoreColor(totalScore)

  if (size === "sm") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge className={`${scoreStyle.bg} ${scoreStyle.color} ${scoreStyle.border} border`}>{totalScore}%</Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="w-64">
            <div className="space-y-2">
              <div className="font-medium">Score de compatibilité</div>
              {Object.entries(breakdown).map(([key, item]) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <item.icon className="h-3 w-3" />
                    {item.label}
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
          <span className={`font-bold text-sm ${scoreStyle.color}`}>{totalScore}</span>
        </div>
        <div>
          <div className={`font-medium text-sm ${scoreStyle.color}`}>{getScoreLabel(totalScore)}</div>
          <div className="text-xs text-muted-foreground">Score de compatibilité</div>
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
            <p className="text-sm text-muted-foreground">Analyse automatique du profil</p>
          </div>
          <div className={`text-3xl font-bold ${scoreStyle.color}`}>{totalScore}%</div>
        </div>

        <div className="space-y-3">
          {Object.entries(breakdown).map(([key, item]) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  <span className="font-medium">{item.label}</span>
                </div>
                <span className="text-muted-foreground">
                  {item.score}/{item.max}
                </span>
              </div>
              <Progress value={(item.score / item.max) * 100} className="h-2" />
            </div>
          ))}
        </div>

        <div className={`mt-4 p-3 rounded-lg ${scoreStyle.bg}`}>
          <div className="flex items-start gap-2">
            {totalScore >= 70 ? (
              <CheckCircle2 className={`h-4 w-4 mt-0.5 ${scoreStyle.color}`} />
            ) : totalScore >= 50 ? (
              <Info className={`h-4 w-4 mt-0.5 ${scoreStyle.color}`} />
            ) : (
              <AlertTriangle className={`h-4 w-4 mt-0.5 ${scoreStyle.color}`} />
            )}
            <div className="text-sm">
              <div className={`font-medium ${scoreStyle.color}`}>{getScoreLabel(totalScore)} candidat</div>
              <div className={`text-xs ${scoreStyle.color} opacity-80 mt-1`}>
                {totalScore >= 70 && "Profil très intéressant, candidature recommandée"}
                {totalScore >= 50 && totalScore < 70 && "Profil correct, à examiner en détail"}
                {totalScore < 50 && "Profil à risque, vérification approfondie nécessaire"}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
