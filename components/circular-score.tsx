"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Loader2, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2 } from "lucide-react"

interface CircularScoreProps {
  score: number
  size?: "sm" | "md" | "lg"
  loading?: boolean
  showDetails?: boolean
  breakdown?: any
  recommendations?: string[]
  warnings?: string[]
  compatible?: boolean
  modelUsed?: string
  className?: string
}

export function CircularScore({
  score,
  size = "md",
  loading = false,
  showDetails = false,
  breakdown,
  recommendations = [],
  warnings = [],
  compatible,
  modelUsed,
  className = "",
}: CircularScoreProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBackground = (score: number) => {
    if (score >= 80) return "bg-green-100"
    if (score >= 60) return "bg-yellow-100"
    return "bg-red-100"
  }

  const getScoreBorder = (score: number) => {
    if (score >= 80) return "border-green-200"
    if (score >= 60) return "border-yellow-200"
    return "border-red-200"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 85) return "Excellent"
    if (score >= 70) return "Très bon"
    if (score >= 55) return "Bon"
    if (score >= 40) return "Moyen"
    return "Faible"
  }

  const getScoreIcon = (score: number) => {
    if (score >= 70) return <TrendingUp className="h-3 w-3" />
    if (score >= 40) return <Minus className="h-3 w-3" />
    return <TrendingDown className="h-3 w-3" />
  }

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return {
          container: "w-12 h-12",
          text: "text-xs font-semibold",
          circle: "w-10 h-10",
        }
      case "lg":
        return {
          container: "w-24 h-24",
          text: "text-xl font-bold",
          circle: "w-20 h-20",
        }
      default: // md
        return {
          container: "w-16 h-16",
          text: "text-sm font-semibold",
          circle: "w-14 h-14",
        }
    }
  }

  const sizeClasses = getSizeClasses()
  const scoreColor = getScoreColor(score)
  const scoreBg = getScoreBackground(score)
  const scoreBorder = getScoreBorder(score)

  if (loading) {
    return (
      <div className={`${sizeClasses.container} flex items-center justify-center ${className}`}>
        <div
          className={`${sizeClasses.circle} rounded-full border-2 border-gray-200 bg-gray-50 flex items-center justify-center`}
        >
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  const circularScore = (
    <div className={`${sizeClasses.container} flex items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses.circle} rounded-full border-2 ${scoreBorder} ${scoreBg} flex items-center justify-center relative overflow-hidden`}
      >
        {/* Cercle de progression */}
        <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-gray-200"
            stroke="currentColor"
            strokeWidth="2"
            fill="transparent"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className={scoreColor}
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={`${score}, 100`}
            strokeLinecap="round"
            fill="transparent"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>

        {/* Score au centre */}
        <div className="flex flex-col items-center justify-center z-10">
          <span className={`${sizeClasses.text} ${scoreColor}`}>{score}</span>
          {size !== "sm" && <span className="text-xs text-muted-foreground">%</span>}
        </div>
      </div>
    </div>
  )

  if (!showDetails && size === "sm") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{circularScore}</TooltipTrigger>
          <TooltipContent side="top" className="w-64">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Score de compatibilité</span>
                <Badge variant="outline" className={`${scoreBg} ${scoreColor} border-0`}>
                  {getScoreLabel(score)}
                </Badge>
              </div>
              {modelUsed && <div className="text-xs text-muted-foreground">Modèle: {modelUsed}</div>}
              {breakdown && (
                <div className="space-y-1">
                  {Object.entries(breakdown)
                    .slice(0, 4)
                    .map(([key, item]: [string, any]) => (
                      <div key={key} className="flex items-center justify-between text-xs">
                        <span className="capitalize">{key.replace("_", " ")}</span>
                        <span>
                          {item.score}/{item.max}
                        </span>
                      </div>
                    ))}
                </div>
              )}
              {compatible !== undefined && (
                <div className="flex items-center gap-1 text-xs">
                  {compatible ? (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                  )}
                  <span>{compatible ? "Compatible" : "Non compatible"}</span>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (showDetails && size === "lg") {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            {circularScore}
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">Score: {score}%</h3>
                  <Badge variant="outline" className={`${scoreBg} ${scoreColor} border-0`}>
                    {getScoreLabel(score)}
                  </Badge>
                  {getScoreIcon(score)}
                </div>
                {modelUsed && <p className="text-sm text-muted-foreground">Modèle: {modelUsed}</p>}
                {compatible !== undefined && (
                  <div className="flex items-center gap-1 mt-2">
                    {compatible ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm font-medium">
                      {compatible ? "Candidature compatible" : "Candidature non compatible"}
                    </span>
                  </div>
                )}
              </div>

              {breakdown && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Détail par critère</h4>
                  {Object.entries(breakdown).map(([key, item]: [string, any]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize font-medium">{key.replace("_", " ")}</span>
                        <span className="text-muted-foreground">
                          {item.score}/{item.max}
                        </span>
                      </div>
                      <Progress value={(item.score / item.max) * 100} className="h-1.5" />
                    </div>
                  ))}
                </div>
              )}

              {recommendations.length > 0 && (
                <div className="space-y-1">
                  <h4 className="font-medium text-sm text-green-700">Recommandations</h4>
                  <ul className="text-xs space-y-1">
                    {recommendations.slice(0, 3).map((rec, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {warnings.length > 0 && (
                <div className="space-y-1">
                  <h4 className="font-medium text-sm text-amber-700">Points d'attention</h4>
                  <ul className="text-xs space-y-1">
                    {warnings.slice(0, 3).map((warning, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Taille md par défaut
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {circularScore}
      <div>
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${scoreColor}`}>{getScoreLabel(score)}</span>
          {getScoreIcon(score)}
        </div>
        <div className="text-xs text-muted-foreground">{modelUsed || "Score de compatibilité"}</div>
        {compatible !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {compatible ? (
              <CheckCircle2 className="h-3 w-3 text-green-500" />
            ) : (
              <AlertTriangle className="h-3 w-3 text-red-500" />
            )}
            <span className="text-xs">{compatible ? "Compatible" : "Non compatible"}</span>
          </div>
        )}
      </div>
    </div>
  )
}
