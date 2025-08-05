"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { scoringPreferencesService } from "@/lib/scoring-preferences-service"
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle, XCircle, RefreshCw, Info } from "lucide-react"

interface MatchingScoreProps {
  application: any
  property: any
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
  recommendations,
  warnings,
  compatible,
  modelUsed,
}: MatchingScoreProps) {
  const [calculatedScore, setCalculatedScore] = useState(score || 0)
  const [scoreBreakdown, setScoreBreakdown] = useState(breakdown || {})
  const [scoreRecommendations, setScoreRecommendations] = useState(recommendations || [])
  const [scoreWarnings, setScoreWarnings] = useState(warnings || [])
  const [isCompatible, setIsCompatible] = useState(compatible || false)
  const [model, setModel] = useState(modelUsed || "")
  const [loading, setLoading] = useState(!score)

  useEffect(() => {
    if (!score && application && property && property.owner_id) {
      calculateScore()
    }
  }, [application, property, score])

  const calculateScore = async () => {
    if (!application || !property || !property.owner_id) return

    try {
      setLoading(true)
      const result = await scoringPreferencesService.calculateScore(application, property, property.owner_id, true)

      setCalculatedScore(result.totalScore)
      setScoreBreakdown(result.breakdown)
      setScoreRecommendations(result.recommendations)
      setScoreWarnings(result.warnings)
      setIsCompatible(result.compatible)
      setModel(result.model_used)
    } catch (error) {
      console.error("Erreur calcul score:", error)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-blue-600"
    if (score >= 40) return "text-orange-600"
    return "text-red-600"
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100"
    if (score >= 60) return "bg-blue-100"
    if (score >= 40) return "bg-orange-100"
    return "bg-red-100"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent"
    if (score >= 60) return "Bon"
    if (score >= 40) return "Moyen"
    return "Faible"
  }

  if (loading) {
    return (
      <Card className={size === "sm" ? "p-2" : ""}>
        <CardContent className={size === "sm" ? "p-2" : "p-4"}>
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (size === "sm") {
    return (
      <div className="flex items-center gap-2">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getScoreBgColor(calculatedScore)} ${getScoreColor(calculatedScore)}`}
        >
          {calculatedScore}
        </div>
        <div className="text-xs">
          <div className="font-medium">{getScoreLabel(calculatedScore)}</div>
          {isCompatible ? (
            <CheckCircle className="h-3 w-3 text-green-500" />
          ) : (
            <XCircle className="h-3 w-3 text-red-500" />
          )}
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Score de compatibilité
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={calculateScore} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        {model && <p className="text-sm text-muted-foreground">Modèle: {model}</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score principal */}
        <div className="flex items-center gap-4">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${getScoreBgColor(calculatedScore)} ${getScoreColor(calculatedScore)}`}
          >
            {calculatedScore}
          </div>
          <div>
            <div className="text-lg font-semibold">{getScoreLabel(calculatedScore)}</div>
            <div className="flex items-center gap-2">
              {isCompatible ? (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Compatible
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Non compatible
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Détail par critère */}
        {detailed && Object.keys(scoreBreakdown).length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Détail par critère</h4>
            {Object.entries(scoreBreakdown).map(([key, item]: [string, any]) => (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize">{key.replace("_", " ")}</span>
                  <span className="font-medium">
                    {item.score}/{item.max}
                  </span>
                </div>
                <Progress value={(item.score / item.max) * 100} className="h-2" />
                {item.details && <p className="text-xs text-muted-foreground">{item.details}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Recommandations */}
        {scoreRecommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Recommandations
            </h4>
            <ul className="space-y-1">
              {scoreRecommendations.map((rec, index) => (
                <li key={index} className="text-sm text-blue-700 flex items-start gap-2">
                  <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Avertissements */}
        {scoreWarnings.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-4 w-4" />
              Avertissements
            </h4>
            <ul className="space-y-1">
              {scoreWarnings.map((warning, index) => (
                <li key={index} className="text-sm text-orange-700 flex items-start gap-2">
                  <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
