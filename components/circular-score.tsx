"use client"

import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface CircularScoreProps {
  score: number
  size?: "sm" | "md" | "lg"
  className?: string
  showLabel?: boolean
  loading?: boolean
  customPreferences?: any
}

export function CircularScore({
  score,
  size = "md",
  className,
  showLabel = true,
  loading = false,
  customPreferences,
}: CircularScoreProps) {
  // Normaliser le score entre 0 et 100
  const normalizedScore = Math.max(0, Math.min(100, score))

  // Calculer le pourcentage pour le cercle
  const percentage = (normalizedScore / 100) * 283 // 283 est la circonférence approximative

  // Déterminer la couleur selon le score et les préférences personnalisées
  const getScoreColor = (score: number) => {
    // Si on a des préférences personnalisées, utiliser leurs seuils
    if (customPreferences?.criteria) {
      // Pour les nouveaux modèles avec critères détaillés
      if (score >= 80) return "text-green-600"
      if (score >= 60) return "text-blue-600"
      if (score >= 40) return "text-yellow-600"
      return "text-red-600"
    } else if (customPreferences?.excellent_income_ratio) {
      // Pour les anciens modèles avec ratios simples
      if (score >= 80) return "text-green-600"
      if (score >= 60) return "text-blue-600"
      if (score >= 40) return "text-yellow-600"
      return "text-red-600"
    } else {
      // Couleurs par défaut
      if (score >= 80) return "text-green-600"
      if (score >= 60) return "text-blue-600"
      if (score >= 40) return "text-yellow-600"
      return "text-red-600"
    }
  }

  const getStrokeColor = (score: number) => {
    if (customPreferences?.criteria) {
      if (score >= 80) return "stroke-green-600"
      if (score >= 60) return "stroke-blue-600"
      if (score >= 40) return "stroke-yellow-600"
      return "stroke-red-600"
    } else if (customPreferences?.excellent_income_ratio) {
      if (score >= 80) return "stroke-green-600"
      if (score >= 60) return "stroke-blue-600"
      if (score >= 40) return "stroke-yellow-600"
      return "stroke-red-600"
    } else {
      if (score >= 80) return "stroke-green-600"
      if (score >= 60) return "stroke-blue-600"
      if (score >= 40) return "stroke-yellow-600"
      return "stroke-red-600"
    }
  }

  // Tailles selon la prop size
  const sizeClasses = {
    sm: {
      container: "w-12 h-12",
      svg: "w-12 h-12",
      text: "text-xs font-semibold",
      label: "text-xs",
    },
    md: {
      container: "w-16 h-16",
      svg: "w-16 h-16",
      text: "text-sm font-semibold",
      label: "text-sm",
    },
    lg: {
      container: "w-24 h-24",
      svg: "w-24 h-24",
      text: "text-lg font-bold",
      label: "text-base",
    },
  }

  const currentSize = sizeClasses[size]
  const scoreColor = getScoreColor(normalizedScore)
  const strokeColor = getStrokeColor(normalizedScore)

  if (loading) {
    return (
      <div className={cn("flex flex-col items-center gap-1", className)}>
        <div className={cn("flex items-center justify-center", currentSize.container)}>
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
        {showLabel && <span className={cn("text-gray-500", currentSize.label)}>Calcul...</span>}
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className={cn("relative", currentSize.container)}>
        <svg className={currentSize.svg} viewBox="0 0 100 100">
          {/* Cercle de fond */}
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-200" />
          {/* Cercle de progression */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className={strokeColor}
            style={{
              strokeDasharray: "283",
              strokeDashoffset: 283 - percentage,
              transform: "rotate(-90deg)",
              transformOrigin: "50% 50%",
              transition: "stroke-dashoffset 0.5s ease-in-out",
            }}
          />
        </svg>
        {/* Score au centre */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(scoreColor, currentSize.text)}>{Math.round(normalizedScore)}</span>
        </div>
      </div>
      {showLabel && (
        <span className={cn("text-gray-600 text-center", currentSize.label)}>
          Score
          {customPreferences?.name && <div className="text-xs text-gray-500 mt-0.5">{customPreferences.name}</div>}
        </span>
      )}
    </div>
  )
}
