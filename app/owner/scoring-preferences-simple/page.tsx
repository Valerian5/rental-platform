"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, AlertCircle, Info, Calculator, User, Building, Briefcase, GraduationCap } from "lucide-react"
import { toast } from "sonner"
import {
  scoringPreferencesService,
  type ScoringPreferences,
  type ScoringResult,
} from "@/lib/scoring-preferences-service"

// Personas pour le simulateur
const PERSONAS = [
  {
    id: "young_executive",
    name: "Jeune Cadre",
    icon: Briefcase,
    description: "Cadre en CDI confirmé avec garant",
    profile: {
      income: 3200,
      contract_type: "cdi_confirmed",
      profession: "Ingénieur commercial",
      company: "Tech Corp",
      trial_period: false,
      seniority_months: 18,
      has_guarantor: true,
      guarantor_income: 4500,
      guarantor_type: "parent",
      file_complete: true,
      has_verified_documents: true,
      presentation: "Profil sérieux avec références solides",
    },
  },
  {
    id: "student",
    name: "Étudiant",
    icon: GraduationCap,
    description: "Étudiant avec garants parents",
    profile: {
      income: 800,
      contract_type: "student",
      profession: "Étudiant Master",
      company: "Université Paris",
      trial_period: false,
      seniority_months: 0,
      has_guarantor: true,
      guarantor_income: 5200,
      guarantor_type: "parent",
      file_complete: true,
      has_verified_documents: false,
      presentation: "Étudiant sérieux, parents garants solides",
    },
  },
  {
    id: "freelancer",
    name: "Freelance",
    icon: User,
    description: "Indépendant sans garant",
    profile: {
      income: 2800,
      contract_type: "freelance",
      profession: "Consultant IT",
      company: "Indépendant",
      trial_period: false,
      seniority_months: 36,
      has_guarantor: false,
      guarantor_income: 0,
      guarantor_type: "",
      file_complete: true,
      has_verified_documents: true,
      presentation: "Freelance expérimenté avec revenus réguliers",
    },
  },
  {
    id: "cdd_employee",
    name: "Employé CDD",
    icon: Building,
    description: "CDD 12 mois avec garant",
    profile: {
      income: 2400,
      contract_type: "cdd_long",
      profession: "Comptable",
      company: "Cabinet Expertise",
      trial_period: false,
      seniority_months: 8,
      has_guarantor: true,
      guarantor_income: 3800,
      guarantor_type: "parent",
      file_complete: true,
      has_verified_documents: true,
      presentation: "CDD longue durée, profil stable",
    },
  },
]

// Modèles prédéfinis
const PREDEFINED_MODELS = [
  {
    id: "strict",
    name: "Strict (GLI)",
    description: "Critères stricts inspirés des assurances GLI",
    icon: "🛡️",
    features: [
      "Revenus ≥ 3,5x le loyer",
      "CDI privilégié",
      "Garant obligatoire",
      "Documents vérifiés requis",
      "Période d'essai pénalisée",
    ],
    bestFor: "Propriétaires recherchant une sécurité maximale",
    criteria: {
      income_ratio: {
        weight: 20,
        thresholds: { excellent: 4.0, good: 3.5, acceptable: 3.0, minimum: 2.5 },
        per_person_check: true,
      },
      guarantor: {
        weight: 20,
        required_if_income_below: 3.5,
        types_accepted: { parent: true, visale: true, garantme: true, other_physical: true, company: true },
        minimum_income_ratio: 3.0,
        verification_required: true,
      },
      professional_stability: {
        weight: 20,
        contract_scoring: {
          cdi_confirmed: 20,
          cdi_trial: 10,
          cdd_long: 15,
          cdd_short: 8,
          freelance: 5,
          student: 3,
          unemployed: 0,
          retired: 18,
          civil_servant: 20,
        },
        seniority_bonus: { enabled: true, min_months: 12, bonus_points: 3 },
        trial_period_penalty: 5,
      },
      file_quality: {
        weight: 20,
        complete_documents_required: true,
        verified_documents_required: true,
        presentation_quality_weight: 5,
        coherence_check_weight: 10,
      },
      property_coherence: {
        weight: 10,
        household_size_vs_property: true,
        colocation_structure_check: true,
        location_relevance_check: true,
        family_situation_coherence: true,
      },
      income_distribution: { weight: 10, balance_check: true, compensation_allowed: false },
    },
    exclusion_rules: {
      incomplete_file: true,
      no_guarantor_when_required: true,
      income_ratio_below_2: true,
      unverified_documents: true,
      manifest_incoherence: true,
    },
  },
  {
    id: "standard",
    name: "Standard (Agence)",
    description: "Pratiques standards d'agence immobilière",
    icon: "🏢",
    features: [
      "Revenus ≥ 3x le loyer",
      "CDI/CDD acceptés",
      "Garant requis si < 3x",
      "Approche équilibrée",
      "Flexibilité modérée",
    ],
    bestFor: "Équilibre entre sécurité et accessibilité",
    criteria: {
      income_ratio: {
        weight: 18,
        thresholds: { excellent: 3.5, good: 3.0, acceptable: 2.5, minimum: 2.0 },
        per_person_check: true,
      },
      guarantor: {
        weight: 17,
        required_if_income_below: 3.0,
        types_accepted: { parent: true, visale: true, garantme: true, other_physical: true, company: true },
        minimum_income_ratio: 3.0,
        verification_required: true,
      },
      professional_stability: {
        weight: 17,
        contract_scoring: {
          cdi_confirmed: 17,
          cdi_trial: 12,
          cdd_long: 14,
          cdd_short: 10,
          freelance: 8,
          student: 6,
          unemployed: 0,
          retired: 15,
          civil_servant: 17,
        },
        seniority_bonus: { enabled: true, min_months: 6, bonus_points: 2 },
        trial_period_penalty: 3,
      },
      file_quality: {
        weight: 16,
        complete_documents_required: true,
        verified_documents_required: false,
        presentation_quality_weight: 6,
        coherence_check_weight: 8,
      },
      property_coherence: {
        weight: 16,
        household_size_vs_property: true,
        colocation_structure_check: true,
        location_relevance_check: false,
        family_situation_coherence: true,
      },
      income_distribution: { weight: 16, balance_check: true, compensation_allowed: true },
    },
    exclusion_rules: {
      incomplete_file: false,
      no_guarantor_when_required: true,
      income_ratio_below_2: false,
      unverified_documents: false,
      manifest_incoherence: true,
    },
  },
  {
    id: "flexible",
    name: "Souple (Particulier)",
    description: "Approche humaine et flexible pour particuliers",
    icon: "🤝",
    features: [
      "Revenus ≥ 2,5x le loyer",
      "Tous contrats acceptés",
      "Garant recommandé",
      "Priorité à l'équilibre global",
      "Approche humaine",
    ],
    bestFor: "Particuliers privilégiant l'aspect humain",
    criteria: {
      income_ratio: {
        weight: 15,
        thresholds: { excellent: 3.0, good: 2.5, acceptable: 2.0, minimum: 1.8 },
        per_person_check: false,
      },
      guarantor: {
        weight: 15,
        required_if_income_below: 2.5,
        types_accepted: { parent: true, visale: true, garantme: true, other_physical: true, company: false },
        minimum_income_ratio: 2.5,
        verification_required: false,
      },
      professional_stability: {
        weight: 15,
        contract_scoring: {
          cdi_confirmed: 15,
          cdi_trial: 13,
          cdd_long: 12,
          cdd_short: 10,
          freelance: 12,
          student: 10,
          unemployed: 3,
          retired: 13,
          civil_servant: 15,
        },
        seniority_bonus: { enabled: false, min_months: 0, bonus_points: 0 },
        trial_period_penalty: 1,
      },
      file_quality: {
        weight: 15,
        complete_documents_required: false,
        verified_documents_required: false,
        presentation_quality_weight: 8,
        coherence_check_weight: 5,
      },
      property_coherence: {
        weight: 20,
        household_size_vs_property: false,
        colocation_structure_check: false,
        location_relevance_check: false,
        family_situation_coherence: true,
      },
      income_distribution: { weight: 20, balance_check: false, compensation_allowed: true },
    },
    exclusion_rules: {
      incomplete_file: false,
      no_guarantor_when_required: false,
      income_ratio_below_2: false,
      unverified_documents: false,
      manifest_incoherence: false,
    },
  },
]

export default function ScoringPreferencesSimplePage() {
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [selectedPersona, setSelectedPersona] = useState<string>("young_executive")
  const [simulationRent, setSimulationRent] = useState<number>(1000)
  const [simulationResult, setSimulationResult] = useState<ScoringResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>("")

  // Récupérer l'ID utilisateur au chargement
  useEffect(() => {
    // Simuler la récupération de l'ID utilisateur
    // Dans un vrai projet, cela viendrait de votre système d'auth
    setCurrentUserId("current_user_id")
  }, [])

  // Calculer le score en temps réel
  useEffect(() => {
    if (selectedModel && selectedPersona) {
      const model = PREDEFINED_MODELS.find((m) => m.id === selectedModel)
      const persona = PERSONAS.find((p) => p.id === selectedPersona)

      if (model && persona) {
        const preferences: ScoringPreferences = {
          owner_id: "simulation",
          name: model.name,
          is_default: false,
          model_type: model.id as any,
          criteria: model.criteria,
          exclusion_rules: model.exclusion_rules,
        }

        const mockApplication = {
          ...persona.profile,
          property: { price: simulationRent },
        }

        const result = scoringPreferencesService.calculateScore(mockApplication, { price: simulationRent }, preferences)
        setSimulationResult(result)
      }
    }
  }, [selectedModel, selectedPersona, simulationRent])

  const handleApplyModel = async () => {
    if (!selectedModel) {
      toast.error("Veuillez sélectionner un modèle")
      return
    }

    if (!currentUserId) {
      toast.error("Utilisateur non identifié")
      return
    }

    setIsLoading(true)
    try {
      const model = PREDEFINED_MODELS.find((m) => m.id === selectedModel)
      if (!model) throw new Error("Modèle introuvable")

      const response = await fetch("/api/scoring-preferences/use-system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_id: currentUserId,
          system_preference_id: model.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de l'application du modèle")
      }

      const data = await response.json()

      toast.success(`Modèle "${model.name}" appliqué avec succès`)
      console.log("✅ Préférence sauvegardée:", data.preference)
    } catch (error) {
      console.error("Erreur:", error)
      toast.error(error instanceof Error ? error.message : "Impossible d'appliquer le modèle")
    } finally {
      setIsLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-blue-600"
    if (score >= 40) return "text-orange-600"
    return "text-red-600"
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>
    if (score >= 60) return <Badge className="bg-blue-100 text-blue-800">Bon</Badge>
    if (score >= 40) return <Badge className="bg-orange-100 text-orange-800">Acceptable</Badge>
    return <Badge className="bg-red-100 text-red-800">Faible</Badge>
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Configuration du Scoring</h1>
        <p className="text-muted-foreground">Choisissez votre modèle de scoring et testez-le avec notre simulateur</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section principale - Modèles */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Modèles Prédéfinis
              </CardTitle>
              <CardDescription>Sélectionnez le modèle qui correspond le mieux à votre approche</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {PREDEFINED_MODELS.map((model) => (
                  <Card
                    key={model.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedModel === model.id ? "ring-2 ring-blue-500 bg-blue-50" : ""
                    }`}
                    onClick={() => setSelectedModel(model.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{model.icon}</span>
                        <CardTitle className="text-lg">{model.name}</CardTitle>
                      </div>
                      <CardDescription className="text-sm">{model.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {model.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-muted-foreground">
                          <strong>Idéal pour :</strong> {model.bestFor}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedModel && (
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Détails du modèle sélectionné</h3>
                    <Button onClick={handleApplyModel} disabled={isLoading}>
                      {isLoading ? "Application..." : "Appliquer ce modèle"}
                    </Button>
                  </div>

                  {(() => {
                    const model = PREDEFINED_MODELS.find((m) => m.id === selectedModel)
                    if (!model) return null

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Critères de revenus</h4>
                          <div className="text-sm space-y-1">
                            <div>Minimum : {model.criteria.income_ratio.thresholds.minimum}x</div>
                            <div>Acceptable : {model.criteria.income_ratio.thresholds.acceptable}x</div>
                            <div>Bon : {model.criteria.income_ratio.thresholds.good}x</div>
                            <div>Excellent : {model.criteria.income_ratio.thresholds.excellent}x</div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Scoring des contrats</h4>
                          <div className="text-sm space-y-1">
                            <div>
                              CDI confirmé : {model.criteria.professional_stability.contract_scoring.cdi_confirmed}/20
                            </div>
                            <div>
                              CDI période d'essai : {model.criteria.professional_stability.contract_scoring.cdi_trial}
                              /20
                            </div>
                            <div>
                              CDD long terme : {model.criteria.professional_stability.contract_scoring.cdd_long}/20
                            </div>
                            <div>Freelance : {model.criteria.professional_stability.contract_scoring.freelance}/20</div>
                            <div>Étudiant : {model.criteria.professional_stability.contract_scoring.student}/20</div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Simulateur */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Simulateur
              </CardTitle>
              <CardDescription>Testez votre modèle avec des profils types</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="persona">Profil candidat</Label>
                <Select value={selectedPersona} onValueChange={setSelectedPersona}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERSONAS.map((persona) => {
                      const Icon = persona.icon
                      return (
                        <SelectItem key={persona.id} value={persona.id}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>{persona.name}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="rent">Loyer mensuel (€)</Label>
                <Input
                  id="rent"
                  type="number"
                  value={simulationRent}
                  onChange={(e) => setSimulationRent(Number(e.target.value))}
                  min="300"
                  max="5000"
                  step="50"
                />
              </div>

              {selectedPersona && (
                <div className="border rounded-lg p-3 bg-gray-50">
                  <h4 className="font-medium mb-2">Détails du profil</h4>
                  {(() => {
                    const persona = PERSONAS.find((p) => p.id === selectedPersona)
                    if (!persona) return null

                    const ratio = persona.profile.income / simulationRent

                    return (
                      <div className="text-sm space-y-1">
                        <div>Revenus : {persona.profile.income}€/mois</div>
                        <div>Ratio : {ratio.toFixed(1)}x</div>
                        <div>Contrat : {persona.profile.contract_type.replace("_", " ")}</div>
                        <div>Garant : {persona.profile.has_guarantor ? "Oui" : "Non"}</div>
                        {persona.profile.has_guarantor && (
                          <div>Revenus garant : {persona.profile.guarantor_income}€</div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}

              {simulationResult && selectedModel && (
                <div className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Score calculé</h4>
                    {getScoreBadge(simulationResult.totalScore)}
                  </div>

                  <div className="text-center mb-4">
                    <div className={`text-3xl font-bold ${getScoreColor(simulationResult.totalScore)}`}>
                      {simulationResult.totalScore}/100
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {simulationResult.compatible ? "Candidature compatible" : "Candidature non compatible"}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Revenus</span>
                      <span>
                        {simulationResult.breakdown.income_ratio.score}/{simulationResult.breakdown.income_ratio.max}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Garant</span>
                      <span>
                        {simulationResult.breakdown.guarantor.score}/{simulationResult.breakdown.guarantor.max}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stabilité pro</span>
                      <span>
                        {simulationResult.breakdown.professional_stability.score}/
                        {simulationResult.breakdown.professional_stability.max}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Qualité dossier</span>
                      <span>
                        {simulationResult.breakdown.file_quality.score}/{simulationResult.breakdown.file_quality.max}
                      </span>
                    </div>
                  </div>

                  {simulationResult.warnings.length > 0 && (
                    <div className="mt-3 p-2 bg-orange-50 rounded border-l-4 border-orange-400">
                      <div className="flex items-center gap-1 text-orange-800 text-sm font-medium mb-1">
                        <AlertCircle className="h-3 w-3" />
                        Points d'attention
                      </div>
                      {simulationResult.warnings.map((warning, index) => (
                        <div key={index} className="text-xs text-orange-700">
                          • {warning}
                        </div>
                      ))}
                    </div>
                  )}

                  {simulationResult.recommendations.length > 0 && (
                    <div className="mt-3 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                      <div className="flex items-center gap-1 text-blue-800 text-sm font-medium mb-1">
                        <Info className="h-3 w-3" />
                        Recommandation
                      </div>
                      <div className="text-xs text-blue-700">{simulationResult.recommendations[0]}</div>
                    </div>
                  )}
                </div>
              )}

              {!selectedModel && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  Sélectionnez un modèle pour voir la simulation
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
