"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { authService } from "@/lib/auth-service"
import { PageHeader } from "@/components/page-header"
import { useScoringEventBus } from "@/lib/scoring-event-bus"
import {
  Settings,
  Save,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Info,
  Zap,
  Shield,
  TrendingUp,
  Users,
  ArrowLeft,
  XCircle,
} from "lucide-react"

export default function ScoringPreferencesSimplePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("presets")
  const [selectedPreset, setSelectedPreset] = useState("standard")
  const [customPreferences, setCustomPreferences] = useState<any>(null)
  const eventBus = useScoringEventBus()

  // Modèles prédéfinis
  const presetModels = {
    strict: {
      name: "Strict (GLI)",
      description: "Critères stricts inspirés des assurances GLI",
      icon: Shield,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      criteria: {
        income_ratio: { weight: 20 },
        guarantor: { weight: 20 },
        professional_stability: { weight: 20 },
        file_quality: { weight: 20 },
        property_coherence: { weight: 10 },
        income_distribution: { weight: 10 },
      },
      exclusion_rules: {
        incomplete_file: true,
        no_guarantor_when_required: true,
        income_ratio_below_2: true,
        unverified_documents: true,
        manifest_incoherence: true,
      },
    },
    standard: {
      name: "Standard (Agence)",
      description: "Pratiques standards d'agence immobilière",
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      criteria: {
        income_ratio: { weight: 18 },
        guarantor: { weight: 17 },
        professional_stability: { weight: 17 },
        file_quality: { weight: 16 },
        property_coherence: { weight: 16 },
        income_distribution: { weight: 16 },
      },
      exclusion_rules: {
        incomplete_file: false,
        no_guarantor_when_required: true,
        income_ratio_below_2: false,
        unverified_documents: false,
        manifest_incoherence: false,
      },
    },
    flexible: {
      name: "Souple (Particulier)",
      description: "Approche humaine et flexible pour particuliers",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      criteria: {
        income_ratio: { weight: 15 },
        guarantor: { weight: 15 },
        professional_stability: { weight: 15 },
        file_quality: { weight: 15 },
        property_coherence: { weight: 20 },
        income_distribution: { weight: 20 },
      },
      exclusion_rules: {
        incomplete_file: false,
        no_guarantor_when_required: false,
        income_ratio_below_2: false,
        unverified_documents: false,
        manifest_incoherence: false,
      },
    },
  }

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
      await loadCurrentPreferences(currentUser.id)
    } catch (error) {
      console.error("Erreur auth:", error)
      toast.error("Erreur d'authentification")
    } finally {
      setLoading(false)
    }
  }

  const loadCurrentPreferences = async (ownerId: string) => {
    try {
      // Vérifier d'abord le cache de l'Event Bus
      const cachedPrefs = eventBus.getPreferences(ownerId)
      if (cachedPrefs) {
        setCustomPreferences(cachedPrefs)
        determineSelectedPreset(cachedPrefs)
        return
      }

      const response = await fetch(`/api/scoring-preferences?owner_id=${ownerId}&default_only=true`)
      if (response.ok) {
        const data = await response.json()
        if (data.preferences && data.preferences.length > 0) {
          const prefs = data.preferences[0]
          setCustomPreferences(prefs)
          determineSelectedPreset(prefs)
        } else {
          // Utiliser le modèle standard par défaut
          setCustomPreferences(presetModels.standard)
          setSelectedPreset("standard")
        }
      }
    } catch (error) {
      console.error("Erreur chargement préférences:", error)
      setCustomPreferences(presetModels.standard)
      setSelectedPreset("standard")
    }
  }

  const determineSelectedPreset = (preferences: any) => {
    // Déterminer quel preset correspond le mieux aux préférences actuelles
    const presetKeys = Object.keys(presetModels)
    for (const key of presetKeys) {
      const preset = presetModels[key as keyof typeof presetModels]
      if (preferences.model_type === key || preferences.name?.includes(preset.name)) {
        setSelectedPreset(key)
        return
      }
    }
    setSelectedPreset("standard")
  }

  const handlePresetSelect = (presetKey: string) => {
    const preset = presetModels[presetKey as keyof typeof presetModels]
    setSelectedPreset(presetKey)
    setCustomPreferences({
      ...preset,
      model_type: presetKey,
      owner_id: user.id,
      is_default: true,
    })
  }

  const handleCustomChange = (field: string, value: any) => {
    setCustomPreferences((prev: any) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleCriteriaChange = (criteriaKey: string, field: string, value: any) => {
    setCustomPreferences((prev: any) => ({
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

  const handleExclusionRuleChange = (ruleKey: string, value: boolean) => {
    setCustomPreferences((prev: any) => ({
      ...prev,
      exclusion_rules: {
        ...prev.exclusion_rules,
        [ruleKey]: value,
      },
    }))
  }

  const handleSave = async () => {
    if (!customPreferences || !user) return

    try {
      setSaving(true)

      const response = await fetch("/api/scoring-preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          owner_id: user.id,
          name: customPreferences.name,
          model_type: customPreferences.model_type || "custom",
          is_default: true,
          criteria: customPreferences.criteria,
          exclusion_rules: customPreferences.exclusion_rules,
        }),
      })

      if (response.ok) {
        toast.success("Préférences sauvegardées avec succès")

        // Mettre à jour l'Event Bus pour déclencher la synchronisation
        eventBus.updatePreferences(user.id, customPreferences)

        // Optionnel : rediriger vers la liste des candidatures
        setTimeout(() => {
          router.push("/owner/applications")
        }, 1000)
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

  const handleReset = () => {
    const preset = presetModels[selectedPreset as keyof typeof presetModels]
    setCustomPreferences({
      ...preset,
      model_type: selectedPreset,
      owner_id: user.id,
      is_default: true,
    })
    toast.info("Préférences réinitialisées")
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  const getTotalWeight = () => {
    if (!customPreferences?.criteria) return 0
    return Object.values(customPreferences.criteria).reduce(
      (sum: number, criteria: any) => sum + (criteria.weight || 0),
      0,
    )
  }

  return (
    <>
      <PageHeader title="Préférences de scoring" description="Configurez vos critères d'évaluation des candidatures">
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </div>
      </PageHeader>

      <div className="p-6 space-y-6">
        <Tabs defaultValue="presets" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="presets">Modèles prédéfinis</TabsTrigger>
            <TabsTrigger value="assistant">Assistant de configuration</TabsTrigger>
          </TabsList>

          {/* Modèles prédéfinis */}
          <TabsContent value="presets" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {Object.entries(presetModels).map(([key, model]) => {
                const Icon = model.icon
                const isSelected = selectedPreset === key

                return (
                  <Card
                    key={key}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? `${model.borderColor} border-2 ${model.bgColor}` : ""
                    }`}
                    onClick={() => handlePresetSelect(key)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-5 w-5 ${model.color}`} />
                          <CardTitle className="text-lg">{model.name}</CardTitle>
                        </div>
                        {isSelected && <CheckCircle className="h-5 w-5 text-green-600" />}
                      </div>
                      <p className="text-sm text-muted-foreground">{model.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Revenus/Loyer</span>
                          <Badge variant="outline">{model.criteria.income_ratio.weight}pts</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Garants</span>
                          <Badge variant="outline">{model.criteria.guarantor.weight}pts</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Stabilité pro.</span>
                          <Badge variant="outline">{model.criteria.professional_stability.weight}pts</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Qualité dossier</span>
                          <Badge variant="outline">{model.criteria.file_quality.weight}pts</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {customPreferences && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Aperçu du modèle sélectionné
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-medium mb-2">Critères de scoring</h4>
                      <div className="space-y-2">
                        {Object.entries(customPreferences.criteria || {}).map(([key, criteria]: [string, any]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="capitalize">
                              {key.replace(/_/g, " ").replace("income ratio", "Revenus/Loyer")}
                            </span>
                            <Badge variant="outline">{criteria.weight}pts</Badge>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-t">
                        <div className="flex justify-between font-medium">
                          <span>Total</span>
                          <Badge
                            className={
                              getTotalWeight() === 100 ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                            }
                          >
                            {getTotalWeight()}/100pts
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Règles d'exclusion</h4>
                      <div className="space-y-2">
                        {Object.entries(customPreferences.exclusion_rules || {}).map(
                          ([key, enabled]: [string, any]) => (
                            <div key={key} className="flex items-center justify-between text-sm">
                              <span className="capitalize">{key.replace(/_/g, " ")}</span>
                              {enabled ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Assistant de configuration */}
          <TabsContent value="assistant" className="space-y-6">
            {customPreferences && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Configuration avancée
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Personnalisez finement vos critères de scoring</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Critères de scoring */}
                    <div>
                      <h4 className="font-medium mb-4">Poids des critères (Total: {getTotalWeight()}/100)</h4>
                      <div className="space-y-4">
                        {Object.entries(customPreferences.criteria || {}).map(([key, criteria]: [string, any]) => (
                          <div key={key} className="space-y-2">
                            <div className="flex justify-between">
                              <Label className="capitalize">
                                {key.replace(/_/g, " ").replace("income ratio", "Revenus/Loyer")}
                              </Label>
                              <Badge variant="outline">{criteria.weight}pts</Badge>
                            </div>
                            <Slider
                              value={[criteria.weight]}
                              onValueChange={([value]) => handleCriteriaChange(key, "weight", value)}
                              max={30}
                              min={0}
                              step={1}
                              className="w-full"
                            />
                          </div>
                        ))}
                      </div>

                      {getTotalWeight() !== 100 && (
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <span className="text-sm text-amber-800">
                              Le total des poids devrait être de 100 points pour un scoring optimal
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Règles d'exclusion */}
                    <div>
                      <h4 className="font-medium mb-4">Règles d'exclusion automatique</h4>
                      <div className="space-y-3">
                        {Object.entries(customPreferences.exclusion_rules || {}).map(
                          ([key, enabled]: [string, any]) => (
                            <div key={key} className="flex items-center justify-between">
                              <div className="space-y-1">
                                <Label className="capitalize">{key.replace(/_/g, " ")}</Label>
                                <p className="text-xs text-muted-foreground">
                                  {key === "incomplete_file" && "Exclure les dossiers incomplets"}
                                  {key === "no_guarantor_when_required" && "Exclure si garant requis mais absent"}
                                  {key === "income_ratio_below_2" && "Exclure si ratio revenus/loyer < 2"}
                                  {key === "unverified_documents" && "Exclure les documents non vérifiés"}
                                  {key === "manifest_incoherence" && "Exclure les incohérences manifestes"}
                                </p>
                              </div>
                              <Switch
                                checked={enabled}
                                onCheckedChange={(checked) => handleExclusionRuleChange(key, checked)}
                              />
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Info className="h-5 w-5 text-blue-600" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Impact en temps réel</p>
                    <p>Vos modifications seront appliquées immédiatement à toutes les candidatures existantes.</p>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex justify-between items-center pt-6 border-t">
          <Button variant="outline" onClick={handleReset} disabled={saving}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/owner/applications")}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving || getTotalWeight() !== 100}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
