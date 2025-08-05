"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { authService } from "@/lib/auth-service"
import { PageHeader } from "@/components/page-header"
import { scoringPreferencesService } from "@/lib/scoring-preferences-service"
import { Save, RefreshCw, Settings } from "lucide-react"

export default function ScoringPreferencesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [preferences, setPreferences] = useState<any>(null)

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      setLoading(true)
      const currentUser = await authService.getCurrentUser()

      if (!currentUser) {
        toast.error("Vous devez être connecté pour accéder à cette page")
        router.push("/login")
        return
      }

      if (currentUser.user_type !== "owner") {
        toast.error("Accès réservé aux propriétaires")
        router.push("/")
        return
      }

      setUser(currentUser)
      await loadPreferences(currentUser.id)
    } catch (error) {
      console.error("Erreur auth:", error)
      toast.error("Erreur d'authentification")
    } finally {
      setLoading(false)
    }
  }

  const loadPreferences = async (ownerId: string) => {
    try {
      const prefs = await scoringPreferencesService.getOwnerPreferences(ownerId, false)
      setPreferences(prefs)
    } catch (error) {
      console.error("Erreur chargement préférences:", error)
      toast.error("Erreur lors du chargement des préférences")
    }
  }

  const handleSave = async () => {
    if (!user || !preferences) return

    try {
      setSaving(true)

      const response = await fetch("/api/scoring-preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...preferences,
          owner_id: user.id,
        }),
      })

      if (response.ok) {
        toast.success("Préférences sauvegardées avec succès")
        scoringPreferencesService.invalidateCache(user.id)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Erreur lors de la sauvegarde")
      }
    } catch (error) {
      console.error("Erreur sauvegarde:", error)
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  const updateCriteria = (criteriaKey: string, field: string, value: any) => {
    setPreferences((prev: any) => ({
      ...prev,
      criteria: {
        ...prev.criteria,
        [criteriaKey]: {
          ...prev.criteria[criteriaKey],
          [field]: value,
        },
      },
    }))
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (!preferences) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Settings className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Erreur de chargement</h3>
            <p className="text-sm text-muted-foreground mt-1">Impossible de charger vos préférences de scoring.</p>
            <Button onClick={() => checkAuthAndLoadData()} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Préférences de scoring"
        description="Configurez vos critères d'évaluation des candidatures"
        backButton={{
          href: "/owner/applications",
          label: "Retour aux candidatures",
        }}
      >
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder
            </>
          )}
        </Button>
      </PageHeader>

      <div className="p-6 space-y-6">
        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nom du modèle</Label>
              <Input
                id="name"
                value={preferences.name}
                onChange={(e) => setPreferences({ ...preferences, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={preferences.description || ""}
                onChange={(e) => setPreferences({ ...preferences, description: e.target.value })}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Ratio revenus/loyer */}
        <Card>
          <CardHeader>
            <CardTitle>Ratio revenus/loyer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Poids du critère: {preferences.criteria.income_ratio.weight} points</Label>
              <Slider
                value={[preferences.criteria.income_ratio.weight]}
                onValueChange={([value]) => updateCriteria("income_ratio", "weight", value)}
                max={50}
                step={1}
                className="mt-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min_ratio">Ratio minimum</Label>
                <Input
                  id="min_ratio"
                  type="number"
                  step="0.1"
                  value={preferences.criteria.income_ratio.min_ratio}
                  onChange={(e) => updateCriteria("income_ratio", "min_ratio", Number.parseFloat(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="ideal_ratio">Ratio idéal</Label>
                <Input
                  id="ideal_ratio"
                  type="number"
                  step="0.1"
                  value={preferences.criteria.income_ratio.ideal_ratio}
                  onChange={(e) => updateCriteria("income_ratio", "ideal_ratio", Number.parseFloat(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stabilité professionnelle */}
        <Card>
          <CardHeader>
            <CardTitle>Stabilité professionnelle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Poids du critère: {preferences.criteria.professional_stability.weight} points</Label>
              <Slider
                value={[preferences.criteria.professional_stability.weight]}
                onValueChange={([value]) => updateCriteria("professional_stability", "weight", value)}
                max={50}
                step={1}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="min_seniority">Ancienneté minimum (mois)</Label>
              <Input
                id="min_seniority"
                type="number"
                value={preferences.criteria.professional_stability.min_seniority_months}
                onChange={(e) =>
                  updateCriteria("professional_stability", "min_seniority_months", Number.parseInt(e.target.value))
                }
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Garants */}
        <Card>
          <CardHeader>
            <CardTitle>Garants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Poids du critère: {preferences.criteria.guarantor.weight} points</Label>
              <Slider
                value={[preferences.criteria.guarantor.weight]}
                onValueChange={([value]) => updateCriteria("guarantor", "weight", value)}
                max={50}
                step={1}
                className="mt-2"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="guarantor_required">Garant obligatoire</Label>
              <Switch
                id="guarantor_required"
                checked={preferences.criteria.guarantor.required}
                onCheckedChange={(checked) => updateCriteria("guarantor", "required", checked)}
              />
            </div>
            <div>
              <Label htmlFor="min_guarantor_ratio">Ratio minimum du garant</Label>
              <Input
                id="min_guarantor_ratio"
                type="number"
                step="0.1"
                value={preferences.criteria.guarantor.min_guarantor_ratio}
                onChange={(e) => updateCriteria("guarantor", "min_guarantor_ratio", Number.parseFloat(e.target.value))}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Qualité du dossier */}
        <Card>
          <CardHeader>
            <CardTitle>Qualité du dossier</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Poids du critère: {preferences.criteria.file_quality.weight} points</Label>
              <Slider
                value={[preferences.criteria.file_quality.weight]}
                onValueChange={([value]) => updateCriteria("file_quality", "weight", value)}
                max={50}
                step={1}
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Règles d'exclusion */}
        <Card>
          <CardHeader>
            <CardTitle>Règles d'exclusion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="min_income_ratio">Ratio minimum absolu</Label>
              <Input
                id="min_income_ratio"
                type="number"
                step="0.1"
                value={preferences.exclusion_rules?.min_income_ratio || ""}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    exclusion_rules: {
                      ...preferences.exclusion_rules,
                      min_income_ratio: Number.parseFloat(e.target.value),
                    },
                  })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="required_guarantor_ratio">Garant requis si ratio inférieur à</Label>
              <Input
                id="required_guarantor_ratio"
                type="number"
                step="0.1"
                value={preferences.exclusion_rules?.required_guarantor_if_ratio_below || ""}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    exclusion_rules: {
                      ...preferences.exclusion_rules,
                      required_guarantor_if_ratio_below: Number.parseFloat(e.target.value),
                    },
                  })
                }
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Bouton de sauvegarde */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Sauvegarde en cours...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder les préférences
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  )
}
