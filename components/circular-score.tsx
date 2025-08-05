"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, Info, AlertTriangle, BarChart3 } from "lucide-react"

interface CircularScoreProps {
  score: number
  loading?: boolean
  showDetails?: boolean
  breakdown?: any
  recommendations?: string[]
  warnings?: string[]
  compatible?: boolean
  modelUsed?: string
  size?: "sm" | "md" | "lg"
}

export function CircularScore({
  score,
  loading = false,
  showDetails = false,
  breakdown = {},
  recommendations = [],
  warnings = [],
  compatible = true,
  modelUsed = "",
  size = "md",
}: CircularScoreProps) {
  const [showPopover, setShowPopover] = useState(false)

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

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-lg",
  }

  if (loading) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gray-200 animate-pulse flex items-center justify-center`}>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
      </div>
    )
  }

  const ScoreCircle = () => (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold ${getScoreBgColor(score)} ${getScoreColor(score)}`}
    >
      {score}
    </div>
  )

  if (!showDetails) {
    return <ScoreCircle />
  }

  return (
    <Popover open={showPopover} onOpenChange={setShowPopover}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="p-0 h-auto hover:bg-transparent">
          <ScoreCircle />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          {/* En-tête */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="font-medium">Score: {score}/100</span>
            </div>
            <Badge variant={compatible ? "default" : "destructive"}>
              {compatible ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Compatible
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  Non compatible
                </>
              )}
            </Badge>
          </div>

          {/* Modèle utilisé */}
          {modelUsed && <div className="text-sm text-muted-foreground">Modèle: {modelUsed}</div>}

          {/* Détail par critère */}
          {Object.keys(breakdown).length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Détail par critère</h4>
              {Object.entries(breakdown).map(([key, item]: [string, any]) => (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize">{key.replace("_", " ")}</span>
                    <span className="font-medium">
                      {item.score}/{item.max}
                    </span>
                  </div>
                  <Progress value={(item.score / item.max) * 100} className="h-1" />
                </div>
              ))}
            </div>
          )}

          {/* Recommandations */}
          {recommendations.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-1">
                <Info className="h-3 w-3" />
                Recommandations
              </h4>
              <ul className="space-y-1">
                {recommendations.slice(0, 2).map((rec, index) => (
                  <li key={index} className="text-xs text-blue-700">
                    • {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Avertissements */}
          {warnings.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-1 text-orange-700">
                <AlertTriangle className="h-3 w-3" />
                Avertissements
              </h4>
              <ul className="space-y-1">
                {warnings.slice(0, 2).map((warning, index) => (
                  <li key={index} className="text-xs text-orange-700">
                    • {warning}
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
