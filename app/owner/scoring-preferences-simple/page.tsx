"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { authService } from "@/lib/auth-service"
import { PageHeader } from "@/components/page-header"
import { CircularScore } from "@/components/circular-score"
import { scoringPreferencesService } from "@/lib/scoring-preferences-service"
import { useScoringPreferences } from "@/hooks/use-scoring-preferences"
import {
  Save,
  RefreshCw,
  CheckCircle,
  Shield,
  Euro,
  TrendingUp,
  User,
  GraduationCap,
  Building,
  Zap,
  Settings,
  FileText,
  Home,
  Users,
  BarChart3,
} from "lucide-react"

// Types pour les préférences de scoring
interface ScoringCriteria {
  income_ratio: {
    weight: number
    thresholds: {
      excellent: number
      good: number
      acceptable: number
      minimum: number
    }
    per_person_check: boolean
  }
  guarantor: {
    weight: number
    required_if_income_below: number
    minimum_income_ratio: number
    verification_required: boolean
  }
  professional_stability: {
    weight: number
    contract_preferences: {
      cdi_confirmed: string
      cdi_trial: string
      cdd_long: string
      cdd_short: string
      freelance: string
      student: string
      unemployed: string
      retired: string
      civil_servant: string
    }
    seniority_bonus: boolean
    trial_period_penalty: boolean
  }
  file_quality: {
    weight: number
    complete_documents_required: boolean
    verified_documents_required: boolean
    presentation_important: boolean
  }
  property_coherence: {
    weight: number
    household_size_check: boolean
    colocation_structure_check: boolean
    location_relevance: boolean
  }
  income_distribution: {
    weight: number
    balance_required: boolean
    compensation_allowed: boolean
  }
}

// Personas prédéfinis avec salaires médians
const PERSONAS = {
  young_professional: {
    name: "Jeune cadre",
    icon: User,
    age: 28,
    income: 3200,
    contract: "CDI confirmé",
    profession: "Ingénieur",
    guarantor: true,
    guarantor_income: 4500,
    complete_file: true,
    verified_docs: true,
    presentation: "Excellente présentation avec projet professionnel",
    color: "text-blue-600",
  },
  student: {
    name: "Étudiant",
    icon: GraduationCap,
    age: 22,
    income: 800,
    contract: "Étudiant",
    profession: "Master en commerce",
    guarantor: true,
    guarantor_income: 3800,
    complete_file: true,
    verified_docs: false,
    presentation: "Présentation soignée avec garants solides",
    color: "text-green-600",
  },
  freelancer: {
    name: "Freelance",
    icon: Zap,
    age: 32,
    income: 2800,
    contract: "Indépendant",
    profession: "Consultant digital",
    guarantor: false,
    guarantor_income: 0,
    complete_file: true,
    verified_docs: false,
    presentation: "Bonne présentation avec justificatifs revenus",
    color: "text-purple-600",
  },
  employee: {
    name: "Employé CDD",
    icon: Building,
    age: 26,
    income: 2400,
    contract: "CDD 12 mois",
    profession: "Assistant marketing",
    guarantor: true,
    guarantor_income: 3200,
    complete_file: false,
    verified_docs: false,
    presentation: "Présentation basique",
    color: "text-orange-600",
  },
}

// Modèles prédéfinis
const PREDEFINED_MODELS = [
  {
    id: "strict",
    name: "Strict (GLI)",
    description: "Critères stricts inspirés des assurances GLI",
    color: "border-red-200 bg-red-50",
    icon: "🔒",
    details: {
      revenus: "≥ 3,5x le loyer",
      contrats: "CDI privilégié",
      garants: "Obligatoire si < 3,5x",
      documents: "Vérifiés requis",
      exclusions: "Strictes",
    },
  },
  {
    id: "standard",
    name: "Standard (Agence)",
    description: "Pratiques standards d'agence immobilière",
    color: "border-blue-200 bg-blue-50",
    icon: "⚖️",
    details: {
      revenus: "≥ 3x le loyer",
      contrats: "CDI/CDD acceptés",
      garants: "Recommandé si < 3x",
      documents: "Complets requis",
      exclusions: "Modérées",
    },
  },
  {
    id: "flexible",
    name: "Souple (Particulier)",
    description: "Approche humaine et flexible pour particuliers",
    color: "border-green-200 bg-green-50",
    icon: "🤝",
    details: {
      revenus: "≥ 2,5x le loyer",
      contrats: "Tous acceptés",
      garants: "Optionnel",
      documents: "Basiques suffisants",
      exclusions: "Limitées",
    },
  },
]

export default function ScoringPreferencesSimplePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get("return") || "/owner/applications"

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("models")
  const [selectedModel, setSelectedModel] = useState("standard")
  const [customCriteria, setCustomCriteria] = useState<ScoringCriteria | null>(null)
  const [previewScores, setPreviewScores] = useState<{ [key: string]: number }>({})

  // Hook pour les préférences en temps réel
  const {
    preferences: currentPreferences,
    loading: preferencesLoading,
    version: currentVersion,
    refresh: refreshPreferences,
  } = useScoringPreferences({
    ownerId: user?.id || "",
    autoRefresh: true,
  })

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  useEffect(() => {
    if (currentPreferences) {
      setSelectedModel(currentPreferences.model_type || "standard")
      if (currentPreferences.model_type === "custom") {
        setCustomCriteria(currentPreferences.criteria)
      }
    }
  }, [currentPreferences])

  useEffect(() => {
    calculatePreviewScores()
  }, [selectedModel, customCriteria])

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
    } catch (error) {
      console.error("Erreur auth:", error)
      toast.error("Erreur d'authentification")
    } finally {
      setLoading(false)
    }
  }

  const calculatePreviewScores = () => {
    if (!user?.id) return

    const scores: { [key: string]: number } = {}

    Object.entries(PERSONAS).forEach(([key, persona]) => {
      try {
        // Créer une candidature fictive basée sur le persona
        const mockApplication = {
          id: `mock-${key}`,
          income: persona.income,
          contract_type: persona.contract,
          profession: persona.profession,
          has_guarantor: persona.guarantor,
          guarantor_income: persona.guarantor_income,
          file_complete: persona.complete_file,
          has_verified_documents: persona.verified_docs,
          message: persona.presentation,
        }

        const mockProperty = {
          price: 1000, // Loyer de référence pour les calculs
          rooms: 2,
        }

        // Utiliser les préférences actuelles ou le modèle sélectionné
        let preferences
        if (selectedModel === "custom" && customCriteria) {
          preferences = {
            owner_id: user.id,
            name: "Modèle personnalisé",
            model_type: "custom",
            criteria: customCriteria,
            exclusion_rules: {
              incomplete_file: false,
              no_guarantor_when_required: true,
              income_ratio_below_2: false,
              unverified_documents: false,
              manifest_incoherence: true,
            },
            is_default: true,
            version: 1,
          }
        } else {
          const modelMap = {
            strict: scoringPreferencesService.getStrictModel(),
            standard: scoringPreferencesService.getStandardModel(),
            flexible: scoringPreferencesService.getFlexibleModel(),
          }
          const model = modelMap[selectedModel as keyof typeof modelMap] || modelMap.standard
          preferences = {
            owner_id: user.id,
            name: model.name,
            model_type: selectedModel,
            criteria: model.criteria,
            exclusion_rules: model.exclusion_rules,
            is_default: true,
            version: 1,
          }
        }

        const result = scoringPreferencesService.calculateScore(mockApplication, mockProperty, preferences)
        scores[key] = result.totalScore
      } catch (error) {
        console.error(`Erreur calcul score pour ${key}:`, error)
        scores[key] = 0
      }
    })

    setPreviewScores(scores)
  }

  const handleModelSelect = async (modelId: string) => {
    try {
      setSaving(true)
      setSelectedModel(modelId)

      console.log("🔄 Application du modèle:", modelId)

      const response = await fetch("/api/scoring-preferences/use-system", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          owner_id: user.id,
          system_preference_id: modelId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || "Modèle appliqué avec succès")

        // Actualiser les préférences
        await refreshPreferences()

        // Recalculer les scores de prévisualisation
        setTimeout(() => {
          calculatePreviewScores()
        }, 500)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Erreur lors de l'application du modèle")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de l'application du modèle")
    } finally {
      setSaving(false)
    }
  }

  const handleCustomCriteriaChange = (path: string, value: any) => {
    if (!customCriteria) {
      // Initialiser avec le modèle standard
      const standardModel = scoringPreferencesService.getStandardModel()
      setCustomCriteria(standardModel.criteria)
      return
    }

    const newCriteria = { ...customCriteria }
    const keys = path.split(".")
    let current: any = newCriteria

    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]]
    }

    current[keys[keys.length - 1]] = value
    setCustomCriteria(newCriteria)
  }

  const handleSaveCustomModel = async () => {
    if (!customCriteria || !user?.id) return

    try {
      setSaving(true)

      // Valider les critères
      const validation = scoringPreferencesService.validatePreferences({
        owner_id: user.id,
        name: "Modèle personnalisé",
        model_type: "custom",
        criteria: customCriteria,
        exclusion_rules: {
          incomplete_file: false,
          no_guarantor_when_required: true,
          income_ratio_below_2: false,
          unverified_documents: false,
          manifest_incoherence: true,
        },
        is_default: true,
      })

      if (!validation.valid) {
        toast.error(`Erreur de validation: ${validation.errors.join(", ")}`)
        return
      }

      const response = await fetch("/api/scoring-preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          owner_id: user.id,
          name: "Modèle personnalisé",
          model_type: "custom",
          criteria: customCriteria,
          exclusion_rules: {
            incomplete_file: false,
            no_guarantor_when_required: true,
            income_ratio_below_2: false,
            unverified_documents: false,
            manifest_incoherence: true,
          },
          is_default: true,
        }),
      })

      if (response.ok) {
        toast.success("Modèle personnalisé sauvegardé avec succès")
        await refreshPreferences()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Erreur lors de la sauvegarde")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-blue-600"
    if (score >= 40) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>
    if (score >= 60) return <Badge className="bg-blue-100 text-blue-800">Bon</Badge>
    if (score >= 40) return <Badge className="bg-yellow-100 text-yellow-800">Moyen</Badge>
    return <Badge className="bg-red-100 text-red-800">Faible</Badge>
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="grid gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <PageHeader title="Préférences de scoring" description="Configurez vos critères d'évaluation des candidatures">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(returnUrl)}>
            Retour
          </Button>
          {currentPreferences && (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-900">{currentPreferences.name}</span>
              <span className="text-xs text-blue-600">v{currentVersion}</span>
            </div>
          )}
        </div>
      </PageHeader>

      <div className="p-6 space-y-6">
        <Tabs defaultValue="models" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="models">Modèles prédéfinis</TabsTrigger>
            <TabsTrigger value="custom">Personnalisation</TabsTrigger>
            <TabsTrigger value="preview">Aperçu</TabsTrigger>
          </TabsList>

          {/* Modèles prédéfinis */}
          <TabsContent value="models" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              {PREDEFINED_MODELS.map((model) => (
                <Card
                  key={model.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    selectedModel === model.id ? "ring-2 ring-blue-500 border-blue-200 bg-blue-50" : model.color
                  }`}
                  onClick={() => handleModelSelect(model.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{model.icon}</span>
                        <div>
                          <CardTitle className="text-lg">{model.name}</CardTitle>
                          <CardDescription className="text-sm">{model.description}</CardDescription>
                        </div>
                      </div>
                      {selectedModel === model.id && <CheckCircle className="h-5 w-5 text-blue-600" />}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Revenus minimum</span>
                        <span className="font-medium">{model.details.revenus}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Contrats</span>
                        <span className="font-medium">{model.details.contrats}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Garants</span>
                        <span className="font-medium">{model.details.garants}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Documents</span>
                        <span className="font-medium">{model.details.documents}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Exclusions</span>
                        <span className="font-medium">{model.details.exclusions}</span>
                      </div>
                    </div>

                    {selectedModel === model.id && (
                      <div className="pt-3 border-t">
                        <Button
                          size="sm"
                          className="w-full"
                          disabled={saving}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleModelSelect(model.id)
                          }}
                        >
                          {saving ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Application...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Modèle actuel
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Settings className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-2">Besoin de plus de contrôle ?</h3>
                    <p className="text-blue-700 mb-4">
                      Créez votre propre modèle de scoring en personnalisant chaque critère selon vos besoins
                      spécifiques.
                    </p>
                    <Button
                      variant="outline"
                      className="border-blue-300 text-blue-700 hover:bg-blue-100 bg-transparent"
                      onClick={() => {
                        setActiveTab("custom")
                        if (!customCriteria) {
                          const standardModel = scoringPreferencesService.getStandardModel()
                          setCustomCriteria(standardModel.criteria)
                        }
                      }}
                    >
                      Créer un modèle personnalisé
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Personnalisation */}
          <TabsContent value="custom" className="space-y-6">
            {!customCriteria ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <Settings className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Créer un modèle personnalisé</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Commencez par sélectionner un modèle de base à personnaliser
                  </p>
                  <Button
                    onClick={() => {
                      const standardModel = scoringPreferencesService.getStandardModel()
                      setCustomCriteria(standardModel.criteria)
                      setSelectedModel("custom")
                    }}
                  >
                    Commencer la personnalisation
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Critère: Ratio revenus/loyer */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Euro className="h-5 w-5 text-green-600" />
                      Ratio revenus/loyer
                      <Badge variant="outline">{customCriteria.income_ratio.weight} points</Badge>
                    </CardTitle>
                    <CardDescription>
                      Évaluation de la capacité financière du candidat par rapport au loyer
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Poids du critère (0-20 points)</Label>
                      <Slider
                        value={[customCriteria.income_ratio.weight]}
                        onValueChange={([value]) => handleCustomCriteriaChange("income_ratio.weight", value)}
                        max={20}
                        step={1}
                        className="mt-2"
                      />
                      <div className="text-sm text-muted-foreground mt-1">
                        Actuellement: {customCriteria.income_ratio.weight} points
                      </div>
                    </div>

                    <Separator />

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Ratio excellent (score max)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={customCriteria.income_ratio.thresholds.excellent}
                          onChange={(e) =>
                            handleCustomCriteriaChange(
                              "income_ratio.thresholds.excellent",
                              Number.parseFloat(e.target.value),
                            )
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Ratio bon</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={customCriteria.income_ratio.thresholds.good}
                          onChange={(e) =>
                            handleCustomCriteriaChange(
                              "income_ratio.thresholds.good",
                              Number.parseFloat(e.target.value),
                            )
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Ratio acceptable</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={customCriteria.income_ratio.thresholds.acceptable}
                          onChange={(e) =>
                            handleCustomCriteriaChange(
                              "income_ratio.thresholds.acceptable",
                              Number.parseFloat(e.target.value),
                            )
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Ratio minimum</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={customCriteria.income_ratio.thresholds.minimum}
                          onChange={(e) =>
                            handleCustomCriteriaChange(
                              "income_ratio.thresholds.minimum",
                              Number.parseFloat(e.target.value),
                            )
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={customCriteria.income_ratio.per_person_check}
                        onCheckedChange={(checked) =>
                          handleCustomCriteriaChange("income_ratio.per_person_check", checked)
                        }
                      />
                      <Label>Vérifier le ratio par personne en colocation</Label>
                    </div>
                  </CardContent>
                </Card>

                {/* Critère: Garants */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      Garants
                      <Badge variant="outline">{customCriteria.guarantor.weight} points</Badge>
                    </CardTitle>
                    <CardDescription>Évaluation des garanties financières apportées</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Poids du critère (0-20 points)</Label>
                      <Slider
                        value={[customCriteria.guarantor.weight]}
                        onValueChange={([value]) => handleCustomCriteriaChange("guarantor.weight", value)}
                        max={20}
                        step={1}
                        className="mt-2"
                      />
                      <div className="text-sm text-muted-foreground mt-1">
                        Actuellement: {customCriteria.guarantor.weight} points
                      </div>
                    </div>

                    <Separator />

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Garant requis si ratio {"<"}</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={customCriteria.guarantor.required_if_income_below}
                          onChange={(e) =>
                            handleCustomCriteriaChange(
                              "guarantor.required_if_income_below",
                              Number.parseFloat(e.target.value),
                            )
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Ratio minimum du garant</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={customCriteria.guarantor.minimum_income_ratio}
                          onChange={(e) =>
                            handleCustomCriteriaChange(
                              "guarantor.minimum_income_ratio",
                              Number.parseFloat(e.target.value),
                            )
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={customCriteria.guarantor.verification_required}
                        onCheckedChange={(checked) =>
                          handleCustomCriteriaChange("guarantor.verification_required", checked)
                        }
                      />
                      <Label>Vérification des documents du garant requise</Label>
                    </div>
                  </CardContent>
                </Card>

                {/* Critère: Stabilité professionnelle */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      Stabilité professionnelle
                      <Badge variant="outline">{customCriteria.professional_stability.weight} points</Badge>
                    </CardTitle>
                    <CardDescription>Évaluation de la stabilité de l'emploi et des revenus</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Poids du critère (0-20 points)</Label>
                      <Slider
                        value={[customCriteria.professional_stability.weight]}
                        onValueChange={([value]) => handleCustomCriteriaChange("professional_stability.weight", value)}
                        max={20}
                        step={1}
                        className="mt-2"
                      />
                      <div className="text-sm text-muted-foreground mt-1">
                        Actuellement: {customCriteria.professional_stability.weight} points
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={customCriteria.professional_stability.seniority_bonus}
                          onCheckedChange={(checked) =>
                            handleCustomCriteriaChange("professional_stability.seniority_bonus", checked)
                          }
                        />
                        <Label>Bonus pour l'ancienneté professionnelle</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={customCriteria.professional_stability.trial_period_penalty}
                          onCheckedChange={(checked) =>
                            handleCustomCriteriaChange("professional_stability.trial_period_penalty", checked)
                          }
                        />
                        <Label>Pénalité pour période d'essai</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Critère: Qualité du dossier */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-orange-600" />
                      Qualité du dossier
                      <Badge variant="outline">{customCriteria.file_quality.weight} points</Badge>
                    </CardTitle>
                    <CardDescription>Évaluation de la complétude et qualité des documents</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Poids du critère (0-20 points)</Label>
                      <Slider
                        value={[customCriteria.file_quality.weight]}
                        onValueChange={([value]) => handleCustomCriteriaChange("file_quality.weight", value)}
                        max={20}
                        step={1}
                        className="mt-2"
                      />
                      <div className="text-sm text-muted-foreground mt-1">
                        Actuellement: {customCriteria.file_quality.weight} points
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={customCriteria.file_quality.complete_documents_required}
                          onCheckedChange={(checked) =>
                            handleCustomCriteriaChange("file_quality.complete_documents_required", checked)
                          }
                        />
                        <Label>Documents complets requis</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={customCriteria.file_quality.verified_documents_required}
                          onCheckedChange={(checked) =>
                            handleCustomCriteriaChange("file_quality.verified_documents_required", checked)
                          }
                        />
                        <Label>Documents vérifiés requis</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={customCriteria.file_quality.presentation_important}
                          onCheckedChange={(checked) =>
                            handleCustomCriteriaChange("file_quality.presentation_important", checked)
                          }
                        />
                        <Label>Qualité de la présentation importante</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Critère: Cohérence avec le bien */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="h-5 w-5 text-indigo-600" />
                      Cohérence avec le bien
                      <Badge variant="outline">{customCriteria.property_coherence.weight} points</Badge>
                    </CardTitle>
                    <CardDescription>Évaluation de l'adéquation candidat/logement</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Poids du critère (0-20 points)</Label>
                      <Slider
                        value={[customCriteria.property_coherence.weight]}
                        onValueChange={([value]) => handleCustomCriteriaChange("property_coherence.weight", value)}
                        max={20}
                        step={1}
                        className="mt-2"
                      />
                      <div className="text-sm text-muted-foreground mt-1">
                        Actuellement: {customCriteria.property_coherence.weight} points
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={customCriteria.property_coherence.household_size_check}
                          onCheckedChange={(checked) =>
                            handleCustomCriteriaChange("property_coherence.household_size_check", checked)
                          }
                        />
                        <Label>Vérifier la taille du foyer vs logement</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={customCriteria.property_coherence.colocation_structure_check}
                          onCheckedChange={(checked) =>
                            handleCustomCriteriaChange("property_coherence.colocation_structure_check", checked)
                          }
                        />
                        <Label>Vérifier la structure de colocation</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={customCriteria.property_coherence.location_relevance}
                          onCheckedChange={(checked) =>
                            handleCustomCriteriaChange("property_coherence.location_relevance", checked)
                          }
                        />
                        <Label>Vérifier la pertinence géographique</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Critère: Répartition des revenus (colocation) */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-teal-600" />
                      Répartition des revenus (colocation)
                      <Badge variant="outline">{customCriteria.income_distribution.weight} points</Badge>
                    </CardTitle>
                    <CardDescription>Évaluation de l'équilibre financier en colocation</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Poids du critère (0-20 points)</Label>
                      <Slider
                        value={[customCriteria.income_distribution.weight]}
                        onValueChange={([value]) => handleCustomCriteriaChange("income_distribution.weight", value)}
                        max={20}
                        step={1}
                        className="mt-2"
                      />
                      <div className="text-sm text-muted-foreground mt-1">
                        Actuellement: {customCriteria.income_distribution.weight} points
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={customCriteria.income_distribution.balance_required}
                          onCheckedChange={(checked) =>
                            handleCustomCriteriaChange("income_distribution.balance_required", checked)
                          }
                        />
                        <Label>Équilibre des revenus requis</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={customCriteria.income_distribution.compensation_allowed}
                          onCheckedChange={(checked) =>
                            handleCustomCriteriaChange("income_distribution.compensation_allowed", checked)
                          }
                        />
                        <Label>Compensation par garants autorisée</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-between items-center pt-6 border-t">
                  <div className="text-sm text-muted-foreground">
                    Total des poids:{" "}
                    {Object.values(customCriteria).reduce((sum, criterion: any) => sum + (criterion.weight || 0), 0)}
                    /100
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCustomCriteria(null)
                        setSelectedModel("standard")
                      }}
                    >
                      Annuler
                    </Button>
                    <Button onClick={handleSaveCustomModel} disabled={saving}>
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
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Aperçu */}
          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Simulation avec différents profils
                </CardTitle>
                <CardDescription>Voyez comment votre modèle évalue différents types de candidats</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  {Object.entries(PERSONAS).map(([key, persona]) => {
                    const Icon = persona.icon
                    const score = previewScores[key] || 0

                    return (
                      <div key={key} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-gray-100`}>
                              <Icon className={`h-5 w-5 ${persona.color}`} />
                            </div>
                            <div>
                              <h3 className="font-medium">{persona.name}</h3>
                              <p className="text-sm text-muted-foreground">{persona.age} ans</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <CircularScore score={score} size="sm" />
                            {getScoreBadge(score)}
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Revenus</span>
                            <span className="font-medium">{persona.income.toLocaleString()} €</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Contrat</span>
                            <span className="font-medium">{persona.contract}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Profession</span>
                            <span className="font-medium">{persona.profession}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Garant</span>
                            <span className="font-medium">
                              {persona.guarantor ? `Oui (${persona.guarantor_income.toLocaleString()} €)` : "Non"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Dossier</span>
                            <span className="font-medium">
                              {persona.complete_file ? "Complet" : "Incomplet"}
                              {persona.verified_docs && " • Vérifié"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-muted-foreground">{persona.presentation}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-900 mb-2">Modèle configuré</h3>
                    <p className="text-green-700 mb-4">
                      Votre modèle de scoring est maintenant configuré et sera appliqué automatiquement à toutes les
                      nouvelles candidatures. Les scores existants seront recalculés en temps réel.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="border-green-300 text-green-700 hover:bg-green-100 bg-transparent"
                        onClick={() => router.push(returnUrl)}
                      >
                        Voir les candidatures
                      </Button>
                      <Button
                        variant="outline"
                        className="border-green-300 text-green-700 hover:bg-green-100 bg-transparent"
                        onClick={() => setActiveTab("models")}
                      >
                        Modifier le modèle
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
