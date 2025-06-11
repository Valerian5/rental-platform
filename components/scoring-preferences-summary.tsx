"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Settings, Target, Euro, Briefcase, Shield, FileCheck, AlertCircle, CheckCircle } from "lucide-react"
import { scoringPreferencesService, type ScoringPreference } from "@/lib/scoring-preferences-service"
import { authService } from "@/lib/auth-service"
import { useRouter } from "next/navigation"

export function ScoringPreferencesSummary() {
  const router = useRouter()
  const [preferences, setPreferences] = useState<ScoringPreference | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      const user = await authService.getCurrentUser()
      if (!user || user.user_type !== "owner") return

      const prefs = await scoringPreferencesService.getOwnerDefaultPreference(user.id)
      setPreferences(prefs)
    } catch (error) {
      console.error("Erreur chargement préférences:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!preferences) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Aucune préférence de scoring configurée</span>
          </div>
          <Button size="sm" className="mt-2" onClick={() => router.push("/owner/scoring-preferences-simple")}>
            Configurer maintenant
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Critères de scoring actifs
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/owner/scoring-preferences-simple")}>
            <Settings className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{preferences.name}</span>
          {preferences.is_system && (
            <Badge variant="outline" className="text-xs">
              Modèle système
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Euro className="h-3 w-3 text-blue-500" />
            <span>Revenus min: {preferences.min_income_ratio}x</span>
          </div>

          <div className="flex items-center gap-2">
            <Briefcase className="h-3 w-3 text-green-500" />
            <span>{preferences.accepted_contracts.length} contrats</span>
          </div>

          <div className="flex items-center gap-2">
            <Shield className="h-3 w-3 text-purple-500" />
            <span>{preferences.guarantor_required ? <>Garant requis</> : <>Garant optionnel</>}</span>
          </div>

          <div className="flex items-center gap-2">
            <FileCheck className="h-3 w-3 text-orange-500" />
            <span>Dossier: {preferences.min_file_completion}%</span>
          </div>
        </div>

        {preferences.verified_documents_required && (
          <div className="flex items-center gap-2 text-xs text-blue-600">
            <CheckCircle className="h-3 w-3" />
            <span>Documents vérifiés requis</span>
          </div>
        )}

        <div className="text-xs text-gray-500 pt-2 border-t">
          Pondération: Revenus {preferences.weights.income}% • Stabilité {preferences.weights.stability}% • Garant{" "}
          {preferences.weights.guarantor}% • Dossier {preferences.weights.file_quality}%
        </div>
      </CardContent>
    </Card>
  )
}
