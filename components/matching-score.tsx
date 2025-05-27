"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Shield, FileText, MessageSquare, Euro, Briefcase, CheckCircle2, AlertTriangle, XCircle } from "lucide-react"

interface MatchingScoreProps {
  application: any
  size?: "sm" | "md" | "lg"
  showDetails?: boolean
}

export function MatchingScore({ application, size = "md", showDetails = false }: MatchingScoreProps) {
  const calculateScoreBreakdown = () => {
    const property = application.property
    const breakdown = {
      financial: 0,
      stability: 0,
      guarantor: 0,
      documents: 0,
      presentation: 0,
      total: 0,
    }

    // Ratio revenus/loyer (40 points max)
    if (application.income && property?.price) {
      const ratio = application.income / property.price
      if (ratio >= 3) breakdown.financial = 40
      else if (ratio >= 2.5) breakdown.financial = 30
      else if (ratio >= 2) breakdown.financial = 20
      else breakdown.financial = 10
    } else {
      breakdown.financial = 10
    }

    // Stabilité professionnelle (20 points max)
    if (application.contract_type === "CDI") breakdown.stability = 20
    else if (application.contract_type === "CDD") breakdown.stability = 15
    else breakdown.stability = 10

    // Présence d'un garant (20 points max)
    if (application.has_guarantor) {
      breakdown.guarantor = 20
      if (application.guarantor_income && property?.price && application.guarantor_income >= property.price * 3) {
        breakdown.guarantor += 5
      }
    }

    // Documents (10 points max)
    breakdown.documents = 8 // Score de base

    // Présentation (10 points max)
    if (application.presentation && application.presentation.length > 50) {
      breakdown.presentation = 10
    } else if (application.message && application.message.length > 20) {
      breakdown.presentation = 6
    }

    breakdown.total = Math.min(
      breakdown.financial + breakdown.stability + breakdown.guarantor + breakdown.documents + breakdown.presentation,
      100,
    )

    return breakdown
  }

  const breakdown = calculateScoreBreakdown()
  const score = breakdown.total

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent"
    if (score >= 60) return "Bon"
    if (score >= 40) return "Moyen"
    return "Faible"
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle2 className="h-4 w-4 text-green-600" />
    if (score >= 60) return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    return <XCircle className="h-4 w-4 text-red-600" />
  }

  if (size === "sm") {
    return (
      <div className="flex items-center space-x-2">
        <div className="relative">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${getScoreBgColor(score)}`}
          >
            {score}
          </div>
        </div>
        <div className="text-xs">
          <div className={`font-medium ${getScoreColor(score)}`}>{getScoreLabel(score)}</div>
        </div>
      </div>
    )
  }

  if (size === "md") {
    return (
      <div className="flex items-center space-x-3">
        <div className="relative">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${getScoreBgColor(score)}`}
          >
            {score}
          </div>
          <div className="absolute -top-1 -right-1">{getScoreIcon(score)}</div>
        </div>
        <div>
          <div className={`font-semibold ${getScoreColor(score)}`}>{getScoreLabel(score)}</div>
          <div className="text-sm text-muted-foreground">Score de compatibilité</div>
        </div>
      </div>
    )
  }

  // size === "lg" avec détails
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold ${getScoreBgColor(score)}`}
            >
              {score}
            </div>
            <div>
              <div className={`text-lg font-semibold ${getScoreColor(score)}`}>{getScoreLabel(score)}</div>
              <div className="text-sm text-muted-foreground">Score de compatibilité</div>
            </div>
          </div>
          <Badge variant={score >= 80 ? "default" : score >= 60 ? "secondary" : "destructive"}>{score}/100</Badge>
        </div>

        {showDetails && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Euro className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Capacité financière</span>
              </div>
              <div className="flex items-center space-x-2">
                <Progress value={(breakdown.financial / 40) * 100} className="w-16 h-2" />
                <span className="text-sm font-medium">{breakdown.financial}/40</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Briefcase className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Stabilité professionnelle</span>
              </div>
              <div className="flex items-center space-x-2">
                <Progress value={(breakdown.stability / 20) * 100} className="w-16 h-2" />
                <span className="text-sm font-medium">{breakdown.stability}/20</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Garant</span>
              </div>
              <div className="flex items-center space-x-2">
                <Progress value={(breakdown.guarantor / 25) * 100} className="w-16 h-2" />
                <span className="text-sm font-medium">{breakdown.guarantor}/25</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Documents</span>
              </div>
              <div className="flex items-center space-x-2">
                <Progress value={(breakdown.documents / 10) * 100} className="w-16 h-2" />
                <span className="text-sm font-medium">{breakdown.documents}/10</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-medium">Présentation</span>
              </div>
              <div className="flex items-center space-x-2">
                <Progress value={(breakdown.presentation / 10) * 100} className="w-16 h-2" />
                <span className="text-sm font-medium">{breakdown.presentation}/10</span>
              </div>
            </div>

            {application.income && application.property?.price && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span>Revenus mensuels:</span>
                    <span className="font-medium">{application.income}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Loyer demandé:</span>
                    <span className="font-medium">{application.property.price}€</span>
                  </div>
                  <div className="flex justify-between border-t pt-1 mt-1">
                    <span>Ratio revenus/loyer:</span>
                    <span
                      className={`font-medium ${(application.income / application.property.price) >= 3 ? "text-green-600" : "text-red-600"}`}
                    >
                      {(application.income / application.property.price).toFixed(1)}x
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
