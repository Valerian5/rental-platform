"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CircularScore } from "@/components/circular-score"
import { scoringPreferencesService } from "@/lib/scoring-preferences-service"
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react"

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
  const [loading, setLoading] = useState(false)
  const [scoringResult, setScoringResult] = useState<any>(null)

  useEffect(() => {
    if (score !== undefined && breakdown) {
      // Utiliser les données passées en props
      setScoringResult({
        totalScore: score,
        breakdown,
        recommendations: recommendations || [],
        warnings: warnings || [],
        compatible: compatible !== undefined ? compatible : true,
        model_used: modelUsed || "Modèle standard",
      })
    } else if (application && property && property.owner_id) {
      calculateScore()
    }
  }, [application, property, score, breakdown])

  const calculateScore = async () => {
    if (!application || !property || !property.owner_id) return

    try {
      setLoading(true)
      const result = await scoringPreferencesService.calculateScore(application, property, property.owner_id, true)
      setScoringResult(result)
    } catch (error) {
      console.error("Erreur calcul score:", error)
      setScoringResult({
        totalScore: 50,
        breakdown: {},
        recommendations: ["Erreur lors du calcul"],
        warnings: ["Impossible de calculer le score"],
        compatible: false,
        model_used: "Erreur",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Calcul du score en cours...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!scoringResult) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Impossible de calculer le score</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (size === "sm") {
    return <CircularScore score={scoringResult.totalScore} size="sm" />
  }

  if (!detailed) {
    return (
      <div className="flex items-center gap-3">
        <CircularScore score={scoringResult.totalScore} size={size} />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Score: {scoringResult.totalScore}/100</span>
            <Badge variant={scoringResult.compatible ? "default" : "destructive"}>
              {scoringResult.compatible ? "Compatible" : "Non compatible"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{scoringResult.model_used}</p>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Analyse de compatibilité
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score global */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CircularScore score={scoringResult.totalScore} size="lg" />
            <div>
              <h3 className="text-2xl font-bold">{scoringResult.totalScore}/100</h3>
              <p className="text-muted-foreground">{scoringResult.model_used}</p>
            </div>
          </div>
          <Badge variant={scoringResult.compatible ? "default" : "destructive"} className="text-sm">
            {scoringResult.compatible ? (
              <>
                <CheckCircle className="h-4 w-4 mr-1" />
                Compatible
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 mr-1" />
                Non compatible
              </>
            )}
          </Badge>
        </div>

        {/* Détail par critère */}
        {Object.keys(scoringResult.breakdown).length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Détail par critère</h4>
            {Object.entries(scoringResult.breakdown).map(([key, item]: [string, any]) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{key.replace("_", " ")}</span>
                  <span className="text-sm text-muted-foreground">
                    {item.score}/{item.max} points
                  </span>
                </div>
                <Progress value={(item.score / item.max) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground">{item.details}</p>
              </div>
            ))}
          </div>
        )}

        {/* Recommandations */}
        {scoringResult.recommendations?.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-1 text-blue-700">
              <TrendingUp className="h-4 w-4" />
              Recommandations
            </h4>
            <ul className="space-y-1">
              {scoringResult.recommendations.map((rec: string, index: number) => (
                <li key={index} className="text-sm text-blue-700">
                  • {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Avertissements */}
        {scoringResult.warnings?.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-1 text-orange-700">
              <AlertTriangle className="h-4 w-4" />
              Points d'attention
            </h4>
            <ul className="space-y-1">
              {scoringResult.warnings.map((warning: string, index: number) => (
                <li key={index} className="text-sm text-orange-700">
                  • {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Exclusions */}
        {scoringResult.exclusions?.length > 0 && (
          <div className="space-y-2 p-3 bg-red-50 rounded-lg border border-red-200">
            <h4 className="font-medium text-red-700">Règles d'exclusion</h4>
            <ul className="space-y-1">
              {scoringResult.exclusions.map((exclusion: string, index: number) => (
                <li key={index} className="text-sm text-red-700">
                  • {exclusion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
