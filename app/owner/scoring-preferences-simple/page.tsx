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
import { Save, RefreshCw, Star, CheckCircle, FileCheck, Shield, Euro, Briefcase, AlertCircle, Home, Users, TrendingUp } from 'lucide-react'

export default function ScoringPreferencesSimplePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "assistant")
  const [systemPreferences, setSystemPreferences] = useState<any[]>([])
  const [selectedSystemPreference, setSelectedSystemPreference] = useState<string | null>(null)
  const [currentUserPreference, setCurrentUserPreference] = useState<any>(null)

  // Assistant de configuration - Critères personnalisés (0-20 points chacun)
  const [customCriteria, setCustomCriteria] = useState({
    income_ratio: {
      weight: 18,
      thresholds: { excellent: 3.5, good: 3.0, acceptable: 2.5, minimum: 2.0 },
      per_person_check: true,
    },
    guarantor: {
      weight: 17,
      required_if_income_below: 3.0,
      minimum_income_ratio: 3.0,
      verification_required: true,
    },
    professional_stability: {
      weight: 17,
      contract_preferences: {
        cdi_confirmed: "excellent",
        cdi_trial: "good",
        cdd_long: "good",
        cdd_short: "acceptable",
        freelance: "acceptable",
        student: "with_guarantor",
        unemployed: "excluded",
        retired: "good",
      },
      seniority_bonus: true,
      trial_period_penalty: true,
    },
    file_quality: {
      weight: 16,
      complete_documents_required: true,
      verified_documents_required: false,
      presentation_important: true,
    },
    property_coherence: {
      weight: 16,
      household_size_check: true,
      colocation_structure_check: true,
      location_relevance: false,
    },
    income_distribution: {
      weight: 16,
      balance_required: true,
      compensation_allowed: true,
    },
  })

  // Règles d'exclusion
  const [exclusionRules, setExclusionRules] = useState({
    incomplete_file: false,
    no_guarantor_when_required: true,
    income_ratio_below_2: false,
    unverified_documents: false,
    manifest_incoherence: true,
  })

  // Exemples pour l'assistant
  const [exampleProperty, setExampleProperty] = useState({
    rent: 1000,
    rooms: 3,
    type: "apartment",
  })

  const [exampleProfiles, setExampleProfiles] = useState({
    excellent: {
      income: 3500,
      contract: "CDI confirmé",
      guarantor: true,
      guarantor_income: 4000,
      complete_file: true,
      verified_docs: true,
      presentation: "Excellente présentation personnalisée",
    },
    good: {
      income: 3000,
      contract: "CDI période d'essai",
      guarantor: true,
      guarantor_income: 3500,
      complete_file: true,
      verified_docs: false,
      presentation: "Bonne présentation",
    },
    acceptable: {
      income: 2500,
      contract: "CDD long terme",
      guarantor: false,
      guarantor_income: 0,
      complete_file: false,
      verified_docs: false,
      presentation: "Présentation basique",
    },
    excluded: {
      income: 1800,
      contract: "Sans emploi",
      guarantor: false,
      guarantor_income: 0,
      complete_file: false,
      verified_docs: false,
      presentation: "Aucune présentation",
    },
  })

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      const currentUser = await authService.getCurrentUser()
      if (!currentUser || currentUser.user_type !== "owner") {
        router.push("/login")
        return
      }

      setUser(currentUser)
      await Promise.all([loadSystemPreferences(), loadUserPreference(currentUser.id)])
    } catch (error) {
      console.error("Erreur auth:", error)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  const loadSystemPreferences = async () => {
    try {
      console.log("🔍 Chargement des modèles système...")
      const response = await fetch("/api/admin/scoring-preferences")
      if (response.ok) {
        const data = await response.json()
        console.log("📊 Modèles système reçus:", data.preferences?.length || 0)
        
        // Ajouter les modèles prédéfinis si pas déjà présents
        const predefinedModels = [
          {
            id: "strict",
            name: "Strict (GLI)",
            description: "Critères stricts inspirés des assurances GLI. Revenus ≥ 3,5x, CDI privilégié, garant obligatoire, documents vérifiés requis.",
            model_type: "strict",
            criteria: {
              income_ratio: { weight: 20, thresholds: { excellent: 4.0, good: 3.5, acceptable: 3.0, minimum: 2.5 } },
              guarantor: { weight: 20, required_if_income_below: 3.5 },
              professional_stability: { weight: 20 },
              file_quality: { weight: 20 },
              property_coherence: { weight: 10 },
              income_distribution: { weight: 10 },
            },
          },
          {
            id: "standard",
            name: "Standard (Agence)",
            description: "Pratiques standards d'agence. Revenus ≥ 3x, CDI/CDD acceptés, garant requis si revenus < 3x, approche équilibrée.",
            model_type: "standard",
            criteria: {
              income_ratio: { weight: 18, thresholds: { excellent: 3.5, good: 3.0, acceptable: 2.5, minimum: 2.0 } },
              guarantor: { weight: 17, required_if_income_below: 3.0 },
              professional_stability: { weight: 17 },
              file_quality: { weight: 16 },
              property_coherence: { weight: 16 },
              income_distribution: { weight: 16 },
            },
          },
          {
            id: "flexible",
            name: "Souple (Particulier)",
            description: "Approche humaine et flexible. Revenus ≥ 2,5x, étudiants/freelances acceptés, garant recommandé, priorité à l'équilibre global.",
            model_type: "flexible",
            criteria: {
              income_ratio: { weight: 15, thresholds: { excellent: 3.0, good: 2.5, acceptable: 2.0, minimum: 1.8 } },
              guarantor: { weight: 15, required_if_income_below: 2.5 },
              professional_stability: { weight: 15 },
              file_quality: { weight: 15 },
              property_coherence: { weight: 20 },
              income_distribution: { weight: 20 },
            },
          },
        ]

        setSystemPreferences([...predefinedModels, ...(data.preferences || [])])
      } else {
        console.error("Erreur HTTP:", response.status, response.statusText)
        toast.error("Erreur lors du chargement des modèles")
      }
    } catch (error) {
      console.error("Erreur chargement préférences système:", error)
      toast.error("Erreur lors du chargement des modèles")
    }
  }

  const loadUserPreference = async (ownerId: string) => {
    try {
      const response = await fetch(`/api/scoring-preferences?owner_id=${ownerId}&default_only=true`)
      if (response.ok) {
        const data = await response.json()
        if (data.preferences && data.preferences.length > 0) {
          const pref = data.preferences[0]
          setCurrentUserPreference(pref)

          // Si l'utilisateur a une préférence basée sur un modèle système
          if (pref.system_preference_id || pref.model_type) {
            setSelectedSystemPreference(pref.system_preference_id || pref.model_type)
          } else {
            setSelectedSystemPreference(null)
            // Charger les critères personnalisés dans l'assistant
            if (pref.criteria) {
              setCustomCriteria({
                income_ratio: pref.criteria.income_ratio || customCriteria.income_ratio,
                guarantor: pref.criteria.guarantor || customCriteria.guarantor,
                professional_stability: pref.criteria.professional_stability || customCriteria.professional_stability,
                file_quality: pref.criteria.file_quality || customCriteria.file_quality,
                property_coherence: pref.criteria.property_coherence || customCriteria.property_coherence,
                income_distribution: pref.criteria.income_distribution || customCriteria.income_distribution,
              })
            }
            if (pref.exclusion_rules) {
              setExclusionRules(pref.exclusion_rules)
            }
          }
        }
      }
    } catch (error) {
      console.error("Erreur chargement préférence utilisateur:", error)
    }
  }

  const handleUseSystemPreference = async (systemPreferenceId: string) => {
    if (!user) return

    try {
      setSaving(true)
      console.log("🔄 Utilisation du modèle système:", systemPreferenceId)

      const selectedModel = systemPreferences.find(p => p.id === systemPreferenceId || p.model_type === systemPreferenceId)
      if (!selectedModel) {
        toast.error("Modèle non trouvé")
        return
      }

      const response = await fetch("/api/scoring-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_id: user.id,
          name: selectedModel.name,
          model_type: selectedModel.model_type || systemPreferenceId,
          is_default: true,
          criteria: selectedModel.criteria,
          exclusion_rules: selectedModel.exclusion_rules || {
            incomplete_file: systemPreferenceId === "strict",
            no_guarantor_when_required: true,
            income_ratio_below_2: systemPreferenceId === "strict",
            unverified_documents: systemPreferenceId === "strict",
            manifest_incoherence: true,
          },
          system_preference_id: systemPreferenceId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success("Modèle appliqué avec succès")
        setSelectedSystemPreference(systemPreferenceId)
        setCurrentUserPreference(data.preference || data.preferences)
        await loadUserPreference(user.id)
      } else {
        const errorData = await response.json()
        console.error("Erreur API:", errorData)
        toast.error(errorData.error || "Erreur lors de l'application du modèle")
      }
    } catch (error) {
      console.error("Erreur application modèle:", error)
      toast.error("Erreur lors de l'application du modèle")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveFromAssistant = async () => {
    if (!user) return

    try {
      setSaving(true)

      // Vérifier que le total des poids ne dépasse pas 100
      const totalWeight = Object.values(customCriteria).reduce((sum, criteria) => sum + criteria.weight, 0)
      if (totalWeight > 100) {
        toast.error(`Le total des poids ne peut pas dépasser 100 (actuellement: ${totalWeight})`)
        return
      }

      // Construire les critères selon la nouvelle structure
      const newPreferences = {
        owner_id: user.id,
        name: "Préférences personnalisées",
        model_type: "custom",
        is_default: true,
        criteria: {
          income_ratio: {
            weight: customCriteria.income_ratio.weight,
            thresholds: customCriteria.income_ratio.thresholds,
            per_person_check: customCriteria.income_ratio.per_person_check,
          },
          guarantor: {
            weight: customCriteria.guarantor.weight,
            required_if_income_below: customCriteria.guarantor.required_if_income_below,
            types_accepted: {
              parent: true,
              visale: true,
              garantme: true,
              other_physical: true,
              company: true,
            },
            minimum_income_ratio: customCriteria.guarantor.minimum_income_ratio,
            verification_required: customCriteria.guarantor.verification_required,
          },
          professional_stability: {
            weight: customCriteria.professional_stability.weight,
            contract_scoring: {
              cdi_confirmed: 20,
              cdi_trial: 15,
              cdd_long: 14,
              cdd_short: 10,
              freelance: customCriteria.professional_stability.contract_preferences.freelance === "excluded" ? 0 : 8,
              student: customCriteria.professional_stability.contract_preferences.student === "excluded" ? 0 : 6,
              unemployed: 0,
              retired: 15,
              civil_servant: 20,
            },
            seniority_bonus: {
              enabled: customCriteria.professional_stability.seniority_bonus,
              min_months: 6,
              bonus_points: 2,
            },
            trial_period_penalty: customCriteria.professional_stability.trial_period_penalty ? 3 : 0,
          },
          file_quality: {
            weight: customCriteria.file_quality.weight,
            complete_documents_required: customCriteria.file_quality.complete_documents_required,
            verified_documents_required: customCriteria.file_quality.verified_documents_required,
            presentation_quality_weight: customCriteria.file_quality.presentation_important ? 6 : 2,
            coherence_check_weight: 8,
          },
          property_coherence: {
            weight: customCriteria.property_coherence.weight,
            household_size_vs_property: customCriteria.property_coherence.household_size_check,
            colocation_structure_check: customCriteria.property_coherence.colocation_structure_check,
            location_relevance_check: customCriteria.property_coherence.location_relevance,
            family_situation_coherence: true,
          },
          income_distribution: {
            weight: customCriteria.income_distribution.weight,
            balance_check: customCriteria.income_distribution.balance_required,
            compensation_allowed: customCriteria.income_distribution.compensation_allowed,
          },
        },
        exclusion_rules: exclusionRules,
      }

      console.log("💾 Sauvegarde des préférences:", newPreferences)

      const response = await fetch("/api/scoring-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPreferences),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success("Préférences sauvegardées avec succès")
        setCurrentUserPreference(data.preferences || data.preference)
        setSelectedSystemPreference(null) // Marquer comme personnalisé
        await loadUserPreference(user.id)

        // Conserver l'onglet actif après la sauvegarde
        router.push(`/owner/scoring-preferences-simple?tab=${activeTab}`)
      } else {
        const errorData = await response.json()
        console.error("Erreur API:", errorData)
        toast.error("Erreur lors de la sauvegarde")
      }
    } catch (error) {
      console.error("Erreur sauvegarde préférence:", error)
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    router.push(`/owner/scoring-preferences-simple?tab=${value}`)
  }

  const updateCriteriaWeight = (criteria: string, weight: number) => {
    setCustomCriteria(prev => ({
      ...prev,
      [criteria]: {
        ...prev[criteria],
        weight: weight,
      },
    }))
  }

  const getTotalWeight = () => {
    return Object.values(customCriteria).reduce((sum, criteria) => sum + criteria.weight, 0)
  }

  const getModelDescription = (criteria: any) => {
    if (!criteria) return "Modèle non configuré"

    const descriptions = []

    // Revenus
    if (criteria.income_ratio?.thresholds?.minimum) {
      descriptions.push(`Revenus minimum: ${criteria.income_ratio.thresholds.minimum}x le loyer`)
    }

    // Garants
    if (criteria.guarantor?.required_if_income_below) {
      descriptions.push(`Garant requis si < ${criteria.guarantor.required_if_income_below}x`)
    }

    // Stabilité
    descriptions.push("CDI privilégié")

    // Documents
    if (criteria.file_quality?.verified_documents_required) {
      descriptions.push("Documents vérifiés requis")
    }
    if (criteria.file_quality?.complete_documents_required) {
      descriptions.push("Dossier complet requis")
    }

    return descriptions.length > 0 ? descriptions.join(" • ") : "Critères standards"
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuration du scoring"
        description="Définissez vos critères d'évaluation des candidatures selon vos exigences"
        backButton={{
          href: "/owner/applications",
          label: "Retour aux candidatures",
        }}
      >
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/owner/scoring-preferences")}>
            Configuration avancée
          </Button>
        </div>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assistant">Assistant de configuration</TabsTrigger>
          <TabsTrigger value="presets">Modèles prédéfinis</TabsTrigger>
        </TabsList>

        <TabsContent value="assistant" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assistant de configuration personnalisée</CardTitle>
              <CardDescription>
                Configurez vos critères d'évaluation selon vos exigences spécifiques. Chaque critère peut peser de 0 à 20 points (total max: 100).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Indicateur de poids total */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-blue-900">Répartition des critères</h4>
                  <Badge variant={getTotalWeight() > 100 ? "destructive" : "outline"}>
                    {getTotalWeight()}/100 points
                  </Badge>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      getTotalWeight() > 100 ? "bg-red-500" : "bg-blue-600"
                    }`}
                    style={{ width: `${Math.min(getTotalWeight(), 100)}%` }}
                  ></div>
                </div>
                {getTotalWeight() > 100 && (
                  <p className="text-sm text-red-600 mt-1">
                    ⚠️ Le total ne peut pas dépasser 100 points
                  </p>
                )}
              </div>

              {/* 1. Revenus vs loyer */}
              <div className="border rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Euro className="h-6 w-6 text-green-600" />
                    <div>
                      <h3 className="font-semibold text-lg">Revenus vs loyer</h3>
                      <p className="text-sm text-muted-foreground">
                        Ratio entre les revenus du foyer et le montant du loyer
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {customCriteria.income_ratio.weight}
                    </div>
                    <div className="text-sm text-muted-foreground">points</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Poids du critère (0-20 points)</Label>
                    <Slider
                      value={[customCriteria.income_ratio.weight]}
                      onValueChange={([value]) => updateCriteriaWeight("income_ratio", value)}
                      max={20}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Seuil excellent</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={customCriteria.income_ratio.thresholds.excellent}
                        onChange={(e) =>
                          setCustomCriteria(prev => ({
                            ...prev,
                            income_ratio: {
                              ...prev.income_ratio,
                              thresholds: {
                                ...prev.income_ratio.thresholds,
                                excellent: parseFloat(e.target.value) || 3.5,
                              },
                            },
                          }))
                        }
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">fois le loyer</p>
                    </div>
                    <div>
                      <Label>Seuil minimum</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={customCriteria.income_ratio.thresholds.minimum}
                        onChange={(e) =>
                          setCustomCriteria(prev => ({
                            ...prev,
                            income_ratio: {
                              ...prev.income_ratio,
                              thresholds: {
                                ...prev.income_ratio.thresholds,
                                minimum: parseFloat(e.target.value) || 2.0,
                              },
                            },
                          }))
                        }
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">fois le loyer</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Vérifier le ratio par personne en colocation</Label>
                    <Switch
                      checked={customCriteria.income_ratio.per_person_check}
                      onCheckedChange={(checked) =>
                        setCustomCriteria(prev => ({
                          ...prev,
                          income_ratio: {
                            ...prev.income_ratio,
                            per_person_check: checked,
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* 2. Garants */}
              <div className="border rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="h-6 w-6 text-purple-600" />
                    <div>
                      <h3 className="font-semibold text-lg">Garants</h3>
                      <p className="text-sm text-muted-foreground">
                        Présence et qualité des garants
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">
                      {customCriteria.guarantor.weight}
                    </div>
                    <div className="text-sm text-muted-foreground">points</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Poids du critère (0-20 points)</Label>
                    <Slider
                      value={[customCriteria.guarantor.weight]}
                      onValueChange={([value]) => updateCriteriaWeight("guarantor", value)}
                      max={20}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Garant requis si revenus &lt;</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={customCriteria.guarantor.required_if_income_below}
                        onChange={(e) =>
                          setCustomCriteria(prev => ({
                            ...prev,
                            guarantor: {
                              ...prev.guarantor,
                              required_if_income_below: parseFloat(e.target.value) || 3.0,
                            },
                          }))
                        }
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">fois le loyer</p>
                    </div>
                    <div>
                      <Label>Revenus garant minimum</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={customCriteria.guarantor.minimum_income_ratio}
                        onChange={(e) =>
                          setCustomCriteria(prev => ({
                            ...prev,
                            guarantor: {
                              ...prev.guarantor,
                              minimum_income_ratio: parseFloat(e.target.value) || 3.0,
                            },
                          }))
                        }
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">fois la part couverte</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Vérification des garants requise</Label>
                    <Switch
                      checked={customCriteria.guarantor.verification_required}
                      onCheckedChange={(checked) =>
                        setCustomCriteria(prev => ({
                          ...prev,
                          guarantor: {
                            ...prev.guarantor,
                            verification_required: checked,
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* 3. Stabilité professionnelle */}
              <div className="border rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-6 w-6 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-lg">Stabilité professionnelle</h3>
                      <p className="text-sm text-muted-foreground">
                        Type de contrat, ancienneté, période d'essai
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {customCriteria.professional_stability.weight}
                    </div>
                    <div className="text-sm text-muted-foreground">points</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Poids du critère (0-20 points)</Label>
                    <Slider
                      value={[customCriteria.professional_stability.weight]}
                      onValueChange={([value]) => updateCriteriaWeight("professional_stability", value)}
                      max={20}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Acceptation des types de contrats</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: "freelance", label: "Freelances/Indépendants" },
                        { key: "student", label: "Étudiants" },
                        { key: "cdd_short", label: "CDD courts" },
                        { key: "unemployed", label: "Sans emploi" },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{label}</span>
                          <select
                            value={customCriteria.professional_stability.contract_preferences[key]}
                            onChange={(e) =>
                              setCustomCriteria(prev => ({
                                ...prev,
                                professional_stability: {
                                  ...prev.professional_stability,
                                  contract_preferences: {
                                    ...prev.professional_stability.contract_preferences,
                                    [key]: e.target.value,
                                  },
                                },
                              }))
                            }
                            className="text-sm border rounded px-2 py-1"
                          >
                            <option value="excellent">Excellent</option>
                            <option value="good">Bon</option>
                            <option value="acceptable">Acceptable</option>
                            <option value="with_guarantor">Avec garant</option>
                            <option value="excluded">Exclu</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Bonus ancienneté</Label>
                    <Switch
                      checked={customCriteria.professional_stability.seniority_bonus}
                      onCheckedChange={(checked) =>
                        setCustomCriteria(prev => ({
                          ...prev,
                          professional_stability: {
                            ...prev.professional_stability,
                            seniority_bonus: checked,
                          },
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Pénalité période d'essai</Label>
                    <Switch
                      checked={customCriteria.professional_stability.trial_period_penalty}
                      onCheckedChange={(checked) =>
                        setCustomCriteria(prev => ({
                          ...prev,
                          professional_stability: {
                            ...prev.professional_stability,
                            trial_period_penalty: checked,
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* 4. Qualité du dossier */}
              <div className="border rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileCheck className="h-6 w-6 text-amber-600" />
                    <div>
                      <h3 className="font-semibold text-lg">Qualité du dossier</h3>
                      <p className="text-sm text-muted-foreground">
                        Documents, vérification, présentation
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-amber-600">
                      {customCriteria.file_quality.weight}
                    </div>
                    <div className="text-sm text-muted-foreground">points</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Poids du critère (0-20 points)</Label>
                    <Slider
                      value={[customCriteria.file_quality.weight]}
                      onValueChange={([value]) => updateCriteriaWeight("file_quality", value)}
                      max={20}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Dossier complet requis</Label>
                      <Switch
                        checked={customCriteria.file_quality.complete_documents_required}
                        onCheckedChange={(checked) =>
                          setCustomCriteria(prev => ({
                            ...prev,
                            file_quality: {
                              ...prev.file_quality,
                              complete_documents_required: checked,
                            },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Documents vérifiés requis</Label>
                      <Switch
                        checked={customCriteria.file_quality.verified_documents_required}
                        onCheckedChange={(checked) =>
                          setCustomCriteria(prev => ({
                            ...prev,
                            file_quality: {
                              ...prev.file_quality,
                              verified_documents_required: checked,
                            },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Présentation personnalisée importante</Label>
                      <Switch
                        checked={customCriteria.file_quality.presentation_important}
                        onCheckedChange={(checked) =>
                          setCustomCriteria(prev => ({
                            ...prev,
                            file_quality: {
                              ...prev.file_quality,
                              presentation_important: checked,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Cohérence avec le bien */}
              <div className="border rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Home className="h-6 w-6 text-indigo-600" />
                    <div>
                      <h3 className="font-semibold text-lg">Cohérence avec le bien</h3>
                      <p className="text-sm text-muted-foreground">
                        Taille du foyer, structure colocation, localisation
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-indigo-600">
                      {customCriteria.property_coherence.weight}
                    </div>
                    <div className="text-sm text-muted-foreground">points</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Poids du critère (0-20 points)</Label>
                    <Slider
                      value={[customCriteria.property_coherence.weight]}
                      onValueChange={([value]) => updateCriteriaWeight("property_coherence", value)}
                      max={20}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Vérifier taille foyer vs logement</Label>
                      <Switch
                        checked={customCriteria.property_coherence.household_size_check}
                        onCheckedChange={(checked) =>
                          setCustomCriteria(prev => ({
                            ...prev,
                            property_coherence: {
                              ...prev.property_coherence,
                              household_size_check: checked,
                            },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Analyser structure colocation</Label>
                      <Switch
                        checked={customCriteria.property_coherence.colocation_structure_check}
                        onCheckedChange={(checked) =>
                          setCustomCriteria(prev => ({
                            ...prev,
                            property_coherence: {
                              ...prev.property_coherence,
                              colocation_structure_check: checked,
                            },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Pertinence localisation</Label>
                      <Switch
                        checked={customCriteria.property_coherence.location_relevance}
                        onCheckedChange={(checked) =>
                          setCustomCriteria(prev => ({
                            ...prev,
                            property_coherence: {
                              ...prev.property_coherence,
                              location_relevance: checked,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. Répartition des revenus (colocation) */}
              <div className="border rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="h-6 w-6 text-teal-600" />
                    <div>
                      <h3 className="font-semibold text-lg">Répartition des revenus</h3>
                      <p className="text-sm text-muted-foreground">
                        Équilibre des revenus en colocation
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-teal-600">
                      {customCriteria.income_distribution.weight}
                    </div>
                    <div className="text-sm text-muted-foreground">points</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Poids du critère (0-20 points)</Label>
                    <Slider
                      value={[customCriteria.income_distribution.weight]}
                      onValueChange={([value]) => updateCriteriaWeight("income_distribution", value)}
                      max={20}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Équilibre des revenus requis</Label>
                      <Switch
                        checked={customCriteria.income_distribution.balance_required}
                        onCheckedChange={(checked) =>
                          setCustomCriteria(prev => ({
                            ...prev,
                            income_distribution: {
                              ...prev.income_distribution,
                              balance_required: checked,
                            },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Compensation par garants/revenus élevés</Label>
                      <Switch
                        checked={customCriteria.income_distribution.compensation_allowed}
                        onCheckedChange={(checked) =>
                          setCustomCriteria(prev => ({
                            ...prev,
                            income_distribution: {
                              ...prev.income_distribution,
                              compensation_allowed: checked,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Règles d'exclusion */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  Règles d'exclusion automatique
                </h3>
                <p className="text-sm text-muted-foreground">
                  Ces règles peuvent rendre un dossier incompatible indépendamment du score obtenu.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <Label>Dossier incomplet</Label>
                    <Switch
                      checked={exclusionRules.incomplete_file}
                      onCheckedChange={(checked) =>
                        setExclusionRules(prev => ({ ...prev, incomplete_file: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded">
                    <Label>Aucun garant quand requis</Label>
                    <Switch
                      checked={exclusionRules.no_guarantor_when_required}
                      onCheckedChange={(checked) =>
                        setExclusionRules(prev => ({ ...prev, no_guarantor_when_required: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded">
                    <Label>Ratio revenus/loyer &lt; 2</Label>
                    <Switch
                      checked={exclusionRules.income_ratio_below_2}
                      onCheckedChange={(checked) =>
                        setExclusionRules(prev => ({ ...prev, income_ratio_below_2: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded">
                    <Label>Documents non vérifiés</Label>
                    <Switch
                      checked={exclusionRules.unverified_documents}
                      onCheckedChange={(checked) =>
                        setExclusionRules(prev => ({ ...prev, unverified_documents: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded md:col-span-2">
                    <Label>Incohérence manifeste</Label>
                    <Switch
                      checked={exclusionRules.manifest_incoherence}
                      onCheckedChange={(checked) =>
                        setExclusionRules(prev => ({ ...prev, manifest_incoherence: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleSaveFromAssistant} 
                  disabled={saving || getTotalWeight() > 100} 
                  size="lg"
                  className="min-w-[200px]"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Sauvegarder la configuration
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="presets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Modèles prédéfinis</CardTitle>
              <CardDescription>
                Choisissez un modèle prédéfini basé sur les pratiques du marché immobilier
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {systemPreferences.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Aucun modèle prédéfini disponible</p>
                  <Button onClick={loadSystemPreferences} variant="outline">
                    Recharger les modèles
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {systemPreferences.map((pref) => (
                    <Card
                      key={pref.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedSystemPreference === pref.id || selectedSystemPreference === pref.model_type
                          ? "border-2 border-blue-500 bg-blue-50"
                          : ""
                      }`}
                      onClick={() => handleUseSystemPreference(pref.id || pref.model_type)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-xl">{pref.name}</h3>
                              {(selectedSystemPreference === pref.id || selectedSystemPreference === pref.model_type) ? (
                                <CheckCircle className="h-5 w-5 text-blue-500" />
                              ) : pref.is_default ? (
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                              ) : null}
                              {pref.model_type && (
                                <Badge variant="outline" className="text-xs">
                                  {pref.model_type === "strict" && "🟥"}
                                  {pref.model_type === "standard" && "🟧"}
                                  {pref.model_type === "flexible" && "🟩"}
                                  {pref.model_type}
                                </Badge>
                              )}
                            </div>
                            <p className="text-muted-foreground mb-4 leading-relaxed">{pref.description}</p>

                            {/* Description détaillée des critères */}
                            <div className="text-sm text-gray-600 mb-4">{getModelDescription(pref.criteria)}</div>
                          </div>
                        </div>

                        {/* Répartition des critères */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-4 pt-4 border-t">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Euro className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium">Revenus</span>
                            </div>
                            <div className="text-lg font-bold text-green-600">
                              {pref.criteria?.income_ratio?.weight || 0}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Shield className="h-4 w-4 text-purple-600" />
                              <span className="text-sm font-medium">Garants</span>
                            </div>
                            <div className="text-lg font-bold text-purple-600">
                              {pref.criteria?.guarantor?.weight || 0}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Briefcase className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium">Stabilité</span>
                            </div>
                            <div className="text-lg font-bold text-blue-600">
                              {pref.criteria?.professional_stability?.weight || 0}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <FileCheck className="h-4 w-4 text-amber-600" />
                              <span className="text-sm font-medium">Dossier</span>
                            </div>
                            <div className="text-lg font-bold text-amber-600">
                              {pref.criteria?.file_quality?.weight || 0}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Home className="h-4 w-4 text-indigo-600" />
                              <span className="text-sm font-medium">Cohérence</span>
                            </div>
                            <div className="text-lg font-bold text-indigo-600">
                              {pref.criteria?.property_coherence?.weight || 0}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Users className="h-4 w-4 text-teal-600" />
                              <span className="text-sm font-medium">Répartition</span>
                            </div>
                            <div className="text-lg font-bold text-teal-600">
                              {pref.criteria?.income_distribution?.weight || 0}
                            </div>
                          </div>
                        </div>

                        {(selectedSystemPreference === pref.id || selectedSystemPreference === pref.model_type) && (
                          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                            <div className="flex items-center gap-2 text-blue-800 font-medium">
                              <CheckCircle className="h-4 w-4" />
                              Modèle actuellement utilisé
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {currentUserPreference && !currentUserPreference.system_preference_id && currentUserPreference.model_type === "custom" && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <p className="text-blue-800">
                      Vous utilisez actuellement une configuration personnalisée : <strong>{currentUserPreference.name}</strong>
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
