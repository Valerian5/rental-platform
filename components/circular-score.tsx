"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertTriangle, XCircle, TrendingUp } from "lucide-react"

interface CircularScoreProps {
  score: number
  loading?: boolean
  size?: "sm" | "md" | "lg"
  showDetails?: boolean
  breakdown?: {
    income: { score: number; max: number; details: string; compatible: boolean }
    stability: { score: number; max: number; details: string; compatible: boolean }
    guarantor: { score: number; max: number; details: string; compatible: boolean }
    file_quality: { score: number; max: number; details: string; compatible: boolean }
  }
  recommendations?: string[]
  warnings?: string[]
  compatible?: boolean
}

export function CircularScore({
  score,
  loading = false,
  size = "md",
  showDetails = false,
  breakdown,
  recommendations = [],
  warnings = [],
  compatible,
}: CircularScoreProps) {
  const [showBreakdown, setShowBreakdown] = useState(false)

  // Déterminer la taille du cercle selon la prop size
  const dimensions = {
    sm: { size: 40, strokeWidth: 3, textSize: "text-xs" },
    md: { size: 60, strokeWidth: 4, textSize: "text-sm" },
    lg: { size: 80, strokeWidth: 5, textSize: "text-base" },
  }

  const { size: circleSize, strokeWidth, textSize } = dimensions[size]
  const radius = (circleSize - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (score / 100) * circumference

  // Déterminer la couleur selon le score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-blue-600"
    if (score >= 40) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreStroke = (score: number) => {
    if (score >= 80) return "stroke-green-500"
    if (score >= 60) return "stroke-blue-500"
    if (score >= 40) return "stroke-yellow-500"
    return "stroke-red-500"
  }

  const getCompatibilityIcon = () => {
    if (compatible === undefined) return null

    if (compatible) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getCompatibilityBadge = () => {
    if (compatible === undefined) return null

    return (
      <Badge
        variant={compatible ? "default" : "destructive"}
        className={compatible ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}
      >
        {compatible ? "Compatible" : "Non compatible"}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ width: circleSize, height: circleSize }}>
        <div
          className="animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"
          style={{ width: circleSize * 0.8, height: circleSize * 0.8 }}
        />
      </div>
    )
  }

  const ScoreCircle = () => (
    <div className="relative flex items-center justify-center" style={{ width: circleSize, height: circleSize }}>
      <svg width={circleSize} height={circleSize} className="transform -rotate-90">
        {/* Cercle de fond */}
        <circle
          cx={circleSize / 2}
          cy={circleSize / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200"
        />
        {/* Cercle de progression */}
        <circle
          cx={circleSize / 2}
          cy={circleSize / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-500 ${getScoreStroke(score)}`}
        />
      </svg>
      {/* Score au centre */}
      <div
        className={`absolute inset-0 flex items-center justify-center ${textSize} font-bold ${getScoreColor(score)}`}
      >
        {Math.round(score)}
      </div>
    </div>
  )

  if (!showDetails || !breakdown) {
    return (
      <div className="flex items-center gap-2">
        <ScoreCircle />
        {compatible !== undefined && size !== "sm" && getCompatibilityIcon()}
      </div>
    )
  }

  return (
    <Popover open={showBreakdown} onOpenChange={setShowBreakdown}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="p-0 h-auto hover:bg-transparent">
          <div className="flex items-center gap-2">
            <ScoreCircle />
            {getCompatibilityIcon()}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          {/* En-tête */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">Score détaillé</h3>
              <Badge variant="outline">{Math.round(score)}/100</Badge>
            </div>
            {getCompatibilityBadge()}
          </div>

          {/* Détail par critère */}
          <div className="space-y-3">
            {Object.entries(breakdown).map(([key, criterion]) => {
              const percentage = criterion.max > 0 ? (criterion.score / criterion.max) * 100 : 0
              const criterionNames = {
                income: "Revenus",
                stability: "Stabilité pro.",
                guarantor: "Garant",
                file_quality: "Qualité dossier",
              }

              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{criterionNames[key as keyof typeof criterionNames]}</span>
                      {criterion.compatible ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 text-yellow-500" />
                      )}
                    </div>
                    <span className="text-gray-600">
                      {Math.round(criterion.score)}/{criterion.max}
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <p className="text-xs text-gray-600">{criterion.details}</p>
                </div>
              )
            })}
          </div>

          {/* Avertissements */}
          {warnings.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Points d'attention
              </h4>
              <ul className="text-xs text-red-600 space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-red-400 mt-0.5">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommandations */}
          {recommendations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-blue-600 flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                Recommandations
              </h4>
              <ul className="text-xs text-blue-600 space-y-1">
                {recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
