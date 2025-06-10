"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { authService } from "@/lib/auth-service"
import { scoringPreferencesService, type ScoringPreferences } from "@/lib/scoring-preferences-service"
import { PageHeader } from "@/components/page-header"
import { Save, FileText, Shield, Briefcase, Euro, Star, Eye, RefreshCw } from "lucide-react"

export default function ScoringPreferencesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [preferences, setPreferences] = useState<ScoringPreferences[]>([])
  const [currentPreferences, setCurrentPreferences] = useState<ScoringPreferences | null>(null)
  const [previewApplication, setPreviewApplication] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)

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
      await loadPreferences(currentUser.id)
    } catch (error) {
      console.error("Erreur auth:", error)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  const loadPreferences = async (ownerId: string) => {
    try {
      const response = await fetch(`/api/scoring-preferences?owner_id=${ownerId}`)
      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences || [])

        // Sélectionner le profil par défaut ou créer un nouveau
        const defaultPref = data.preferences?.find((p: ScoringPreferences) => p.is_default)
        if (defaultPref) {
          setCurrentPreferences(defaultPref)
        } else {
          // Créer des préférences par défaut
          const defaultPrefs = scoringPreferencesService.getDefaultPreferences(ownerId)
          setCurrentPreferences(defaultPrefs)
        }
      }
    } catch (error) {
      console.error("Erreur chargement préférences:", error)
      toast.error("Erreur lors du chargement")
    }
  }

  const savePreferences = async () => {
    if (!currentPreferences || !user) return

    try {
      setSaving(true)

      if (currentPreferences.id) {
        // Mise à jour
        const response = await fetch(`/api/scoring-preferences/${currentPreferences.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(currentPreferences),
        })

        if (response.ok) {
          toast.success("Préférences mises à jour")
          await loadPreferences(user.id)
        } else {
          toast.error("Erreur lors de la mise à jour")
        }
      } else {
        // Création
        const response = await fetch("/api/scoring-preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(currentPreferences),
        })

        if (response.ok) {
          toast.success("Préférences sauvegardées")
          await loadPreferences(user.id)
        } else {
          toast.error("Erreur lors de la sauvegarde")
        }
      }
    } catch (error) {
      console.error("Erreur sauvegarde:", error)
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  const updateCriteria = (path: string, value: any) => {
    if (!currentPreferences) return

    const newPreferences = { ...currentPreferences }
    const pathArray = path.split(".")
    let current = newPreferences.criteria as any

    for (let i = 0; i < pathArray.length - 1; i++) {
      current = current[pathArray[i]]
    }
    current[pathArray[pathArray.length - 1]] = value

    setCurrentPreferences(newPreferences)
  }

  const getTotalWeight = () => {
    if (!currentPreferences) return 0
    const criteria = currentPreferences.criteria
    return (
      criteria.income_ratio.weight +
      criteria.professional_stability.weight +
      criteria.guarantor.weight +
      criteria.application_quality.weight
    )
  }

  const generatePreviewScore = () => {
    if (!currentPreferences) return

    // Application exemple
    const mockApplication = {
      income: 4500,
      contract_type: "CDI",
      has_guarantor: true,
      guarantor_income: 6000,
      profession: "Ingénieur",
      company: "TechCorp",
      presentation:
        "Bonjour, je suis un professionnel sérieux à la recherche d'un logement. J'ai un CDI stable et d'excellents revenus. Je peux fournir toutes les garanties nécessaires.",
      seniority_months: 24,
      trial_period: false,
    }

    const mockProperty = {
      price: 1200,
    }

    const result = scoringPreferencesService.calculateCustomScore(mockApplication, mockProperty, currentPreferences)

    setPreviewApplication({ application: mockApplication, property: mockProperty, result })
    setShowPreview(true)
  }

  const loadPreset = (presetName: string) => {
    if (!user) return

    let preset: ScoringPreferences

    switch (presetName) {
      case "strict":
        preset = {
          ...scoringPreferencesService.getDefaultPreferences(user.id),
          name: "Profil strict",
          criteria: {
            ...scoringPreferencesService.getDefaultPreferences(user.id).criteria,
            income_ratio: {
              ...scoringPreferencesService.getDefaultPreferences(user.id).criteria.income_ratio,
              weight: 45,
              thresholds: { excellent: 4.0, good: 3.5, acceptable: 3.0, minimum: 2.5 },
            },
            professional_stability: {
              ...scoringPreferencesService.getDefaultPreferences(user.id).criteria.professional_stability,
              weight: 30,
              contract_types: { cdi: 100, cdd: 50, freelance: 30, student: 10, unemployed: 0, retired: 80 },
            },
          },
        }
        break
      case "flexible":
        preset = {
          ...scoringPreferencesService.getDefaultPreferences(user.id),
          name: "Profil flexible",
          criteria: {
            ...scoringPreferencesService.getDefaultPreferences(user.id).criteria,
            income_ratio: {
              ...scoringPreferencesService.getDefaultPreferences(user.id).criteria.income_ratio,
              weight: 25,
              thresholds: { excellent: 3.0, good: 2.5, acceptable: 2.0, minimum: 1.8 },
            },
            application_quality: {
              ...scoringPreferencesService.getDefaultPreferences(user.id).criteria.application_quality,
              weight: 25,
            },
          },
        }
        break
      default:
        preset = scoringPreferencesService.getDefaultPreferences(user.id)
    }

    setCurrentPreferences(preset)
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

  if (!currentPreferences) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="text-center py-8">
            <p>Erreur lors du chargement des préférences</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalWeight = getTotalWeight()
  const criteria = currentPreferences.criteria

  return (
    <div className="space-y-6">
      <PageHeader title="Critères de sélection" description="Personnalisez vos critères d'évaluation des candidatures">
        <div className="flex gap-2">
          <Button variant="outline" onClick={generatePreviewScore}>
            <Eye className="h-4 w-4 mr-2" />
            Aperçu
          </Button>
          <Button onClick={savePreferences} disabled={saving}>
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
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Profils et presets */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Profils sauvegardés</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {preferences.map((pref) => (
                <Button
                  key={pref.id}
                  variant={currentPreferences?.id === pref.id ? "default" : "outline"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setCurrentPreferences(pref)}
                >
                  {pref.name}
                  {pref.is_default && <Star className="h-3 w-3 ml-auto" />}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Profils prédéfinis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full" onClick={() => loadPreset("balanced")}>
                Équilibré
              </Button>
              <Button variant="outline" size="sm" className="w-full" onClick={() => loadPreset("strict")}>
                Strict
              </Button>
              <Button variant="outline" size="sm" className="w-full" onClick={() => loadPreset("flexible")}>
                Flexible
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Répartition</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Revenus</span>
                  <span>{criteria.income_ratio.weight}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Stabilité</span>
                  <span>{criteria.professional_stability.weight}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Garants</span>
                  <span>{criteria.guarantor.weight}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Dossier</span>
                  <span>{criteria.application_quality.weight}%</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span className={totalWeight !== 100 ? "text-red-600" : "text-green-600"}>{totalWeight}%</span>
                </div>
              </div>
              {totalWeight !== 100 && <p className="text-xs text-red-600 mt-2">Le total doit être égal à 100%</p>}
            </CardContent>
          </Card>
        </div>

        {/* Configuration principale */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="income" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="income" className="flex items-center gap-2">
                <Euro className="h-4 w-4" />
                Revenus
              </TabsTrigger>
              <TabsTrigger value="stability" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Stabilité
              </TabsTrigger>
              <TabsTrigger value="guarantor" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Garants
              </TabsTrigger>
              <TabsTrigger value="quality" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Dossier
              </TabsTrigger>
            </TabsList>

            {/* Onglet Revenus */}
            <TabsContent value="income">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Euro className="h-5 w-5" />
                    Critères de revenus
                  </CardTitle>
                  <CardDescription>
                    Configurez l'importance du ratio revenus/loyer dans votre évaluation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Importance des revenus ({criteria.income_ratio.weight}%)</Label>
                    <Slider
                      value={[criteria.income_ratio.weight]}
                      onValueChange={([value]) => updateCriteria("income_ratio.weight", value)}
                      max={100}
                      step={5}
                      className="mt-2"
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Seuils de ratio revenus/loyer</Label>
                      <div className="space-y-3 mt-2">
                        <div>
                          <Label className="text-sm text-green-600">
                            Excellent (≥ {criteria.income_ratio.thresholds.excellent}x)
                          </Label>
                          <Slider
                            value={[criteria.income_ratio.thresholds.excellent]}
                            onValueChange={([value]) => updateCriteria("income_ratio.thresholds.excellent", value)}
                            min={2}
                            max={5}
                            step={0.1}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-blue-600">
                            Bon (≥ {criteria.income_ratio.thresholds.good}x)
                          </Label>
                          <Slider
                            value={[criteria.income_ratio.thresholds.good]}
                            onValueChange={([value]) => updateCriteria("income_ratio.thresholds.good", value)}
                            min={2}
                            max={4}
                            step={0.1}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-amber-600">
                            Acceptable (≥ {criteria.income_ratio.thresholds.acceptable}x)
                          </Label>
                          <Slider
                            value={[criteria.income_ratio.thresholds.acceptable]}
                            onValueChange={([value]) => updateCriteria("income_ratio.thresholds.acceptable", value)}
                            min={1.5}
                            max={3}
                            step={0.1}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>Points attribués</Label>
                      <div className="space-y-3 mt-2">
                        <div>
                          <Label className="text-sm">Excellent ({criteria.income_ratio.points.excellent}%)</Label>
                          <Slider
                            value={[criteria.income_ratio.points.excellent]}
                            onValueChange={([value]) => updateCriteria("income_ratio.points.excellent", value)}
                            max={100}
                            step={5}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Bon ({criteria.income_ratio.points.good}%)</Label>
                          <Slider
                            value={[criteria.income_ratio.points.good]}
                            onValueChange={([value]) => updateCriteria("income_ratio.points.good", value)}
                            max={100}
                            step={5}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Acceptable ({criteria.income_ratio.points.acceptable}%)</Label>
                          <Slider
                            value={[criteria.income_ratio.points.acceptable]}
                            onValueChange={([value]) => updateCriteria("income_ratio.points.acceptable", value)}
                            max={100}
                            step={5}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Insuffisant ({criteria.income_ratio.points.insufficient}%)</Label>
                          <Slider
                            value={[criteria.income_ratio.points.insufficient]}
                            onValueChange={([value]) => updateCriteria("income_ratio.points.insufficient", value)}
                            max={50}
                            step={5}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Stabilité */}
            <TabsContent value="stability">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Stabilité professionnelle
                  </CardTitle>
                  <CardDescription>Configurez l'évaluation de la situation professionnelle</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Importance de la stabilité ({criteria.professional_stability.weight}%)</Label>
                    <Slider
                      value={[criteria.professional_stability.weight]}
                      onValueChange={([value]) => updateCriteria("professional_stability.weight", value)}
                      max={100}
                      step={5}
                      className="mt-2"
                    />
                  </div>

                  <Separator />

                  <div>
                    <Label>Points par type de contrat</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      {Object.entries(criteria.professional_stability.contract_types).map(([type, points]) => (
                        <div key={type}>
                          <Label className="text-sm capitalize">
                            {type.toUpperCase()} ({points}%)
                          </Label>
                          <Slider
                            value={[points]}
                            onValueChange={([value]) =>
                              updateCriteria(`professional_stability.contract_types.${type}`, value)
                            }
                            max={100}
                            step={5}
                            className="mt-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Bonus ancienneté</Label>
                        <Switch
                          checked={criteria.professional_stability.seniority_bonus.enabled}
                          onCheckedChange={(checked) =>
                            updateCriteria("professional_stability.seniority_bonus.enabled", checked)
                          }
                        />
                      </div>
                      {criteria.professional_stability.seniority_bonus.enabled && (
                        <div className="space-y-2">
                          <div>
                            <Label className="text-sm">Ancienneté minimum (mois)</Label>
                            <Input
                              type="number"
                              value={criteria.professional_stability.seniority_bonus.min_months}
                              onChange={(e) =>
                                updateCriteria(
                                  "professional_stability.seniority_bonus.min_months",
                                  Number.parseInt(e.target.value),
                                )
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-sm">
                              Points bonus ({criteria.professional_stability.seniority_bonus.bonus_points}%)
                            </Label>
                            <Slider
                              value={[criteria.professional_stability.seniority_bonus.bonus_points]}
                              onValueChange={([value]) =>
                                updateCriteria("professional_stability.seniority_bonus.bonus_points", value)
                              }
                              max={30}
                              step={5}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Pénalité période d'essai</Label>
                        <Switch
                          checked={criteria.professional_stability.trial_period_penalty.enabled}
                          onCheckedChange={(checked) =>
                            updateCriteria("professional_stability.trial_period_penalty.enabled", checked)
                          }
                        />
                      </div>
                      {criteria.professional_stability.trial_period_penalty.enabled && (
                        <div>
                          <Label className="text-sm">
                            Points de pénalité ({criteria.professional_stability.trial_period_penalty.penalty_points}%)
                          </Label>
                          <Slider
                            value={[criteria.professional_stability.trial_period_penalty.penalty_points]}
                            onValueChange={([value]) =>
                              updateCriteria("professional_stability.trial_period_penalty.penalty_points", value)
                            }
                            max={30}
                            step={5}
                            className="mt-1"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Garants */}
            <TabsContent value="guarantor">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Garants et garanties
                  </CardTitle>
                  <CardDescription>Configurez l'importance des garants dans votre évaluation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Importance des garants ({criteria.guarantor.weight}%)</Label>
                    <Slider
                      value={[criteria.guarantor.weight]}
                      onValueChange={([value]) => updateCriteria("guarantor.weight", value)}
                      max={100}
                      step={5}
                      className="mt-2"
                    />
                  </div>

                  <Separator />

                  <div>
                    <Label>Points pour la présence d'un garant ({criteria.guarantor.presence_points}%)</Label>
                    <Slider
                      value={[criteria.guarantor.presence_points]}
                      onValueChange={([value]) => updateCriteria("guarantor.presence_points", value)}
                      max={100}
                      step={5}
                      className="mt-2"
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Bonus revenus garant</Label>
                        <Switch
                          checked={criteria.guarantor.income_ratio_bonus.enabled}
                          onCheckedChange={(checked) => updateCriteria("guarantor.income_ratio_bonus.enabled", checked)}
                        />
                      </div>
                      {criteria.guarantor.income_ratio_bonus.enabled && (
                        <div className="space-y-2">
                          <div>
                            <Label className="text-sm">
                              Seuil ratio garant (x{criteria.guarantor.income_ratio_bonus.threshold})
                            </Label>
                            <Slider
                              value={[criteria.guarantor.income_ratio_bonus.threshold]}
                              onValueChange={([value]) =>
                                updateCriteria("guarantor.income_ratio_bonus.threshold", value)
                              }
                              min={2}
                              max={5}
                              step={0.1}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">
                              Points bonus ({criteria.guarantor.income_ratio_bonus.bonus_points}%)
                            </Label>
                            <Slider
                              value={[criteria.guarantor.income_ratio_bonus.bonus_points]}
                              onValueChange={([value]) =>
                                updateCriteria("guarantor.income_ratio_bonus.bonus_points", value)
                              }
                              max={30}
                              step={5}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Bonus garants multiples</Label>
                        <Switch
                          checked={criteria.guarantor.multiple_guarantors_bonus.enabled}
                          onCheckedChange={(checked) =>
                            updateCriteria("guarantor.multiple_guarantors_bonus.enabled", checked)
                          }
                        />
                      </div>
                      {criteria.guarantor.multiple_guarantors_bonus.enabled && (
                        <div>
                          <Label className="text-sm">
                            Points par garant supplémentaire (
                            {criteria.guarantor.multiple_guarantors_bonus.bonus_per_additional}%)
                          </Label>
                          <Slider
                            value={[criteria.guarantor.multiple_guarantors_bonus.bonus_per_additional]}
                            onValueChange={([value]) =>
                              updateCriteria("guarantor.multiple_guarantors_bonus.bonus_per_additional", value)
                            }
                            max={20}
                            step={5}
                            className="mt-1"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Qualité */}
            <TabsContent value="quality">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Qualité du dossier
                  </CardTitle>
                  <CardDescription>Configurez l'évaluation de la qualité de la candidature</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Importance de la qualité ({criteria.application_quality.weight}%)</Label>
                    <Slider
                      value={[criteria.application_quality.weight]}
                      onValueChange={([value]) => updateCriteria("application_quality.weight", value)}
                      max={100}
                      step={5}
                      className="mt-2"
                    />
                  </div>

                  <Separator />

                  <div>
                    <Label>Seuils de longueur de présentation (caractères)</Label>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div>
                        <Label className="text-sm text-green-600">
                          Excellente (≥ {criteria.application_quality.presentation_length.excellent})
                        </Label>
                        <Input
                          type="number"
                          value={criteria.application_quality.presentation_length.excellent}
                          onChange={(e) =>
                            updateCriteria(
                              "application_quality.presentation_length.excellent",
                              Number.parseInt(e.target.value),
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-blue-600">
                          Bonne (≥ {criteria.application_quality.presentation_length.good})
                        </Label>
                        <Input
                          type="number"
                          value={criteria.application_quality.presentation_length.good}
                          onChange={(e) =>
                            updateCriteria(
                              "application_quality.presentation_length.good",
                              Number.parseInt(e.target.value),
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-amber-600">
                          Basique (≥ {criteria.application_quality.presentation_length.basic})
                        </Label>
                        <Input
                          type="number"
                          value={criteria.application_quality.presentation_length.basic}
                          onChange={(e) =>
                            updateCriteria(
                              "application_quality.presentation_length.basic",
                              Number.parseInt(e.target.value),
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Bonus complétude du dossier</Label>
                      <Switch
                        checked={criteria.application_quality.completeness_bonus.enabled}
                        onCheckedChange={(checked) =>
                          updateCriteria("application_quality.completeness_bonus.enabled", checked)
                        }
                      />
                    </div>
                    {criteria.application_quality.completeness_bonus.enabled && (
                      <div>
                        <Label className="text-sm">
                          Points bonus ({criteria.application_quality.completeness_bonus.bonus_points}%)
                        </Label>
                        <Slider
                          value={[criteria.application_quality.completeness_bonus.bonus_points]}
                          onValueChange={([value]) =>
                            updateCriteria("application_quality.completeness_bonus.bonus_points", value)
                          }
                          max={30}
                          step={5}
                          className="mt-1"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialog d'aperçu */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Aperçu du scoring</DialogTitle>
          </DialogHeader>
          {previewApplication && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {Math.round(previewApplication.result.totalScore)}%
                </div>
                <p className="text-muted-foreground">Score avec vos critères</p>
              </div>

              <div className="space-y-3">
                {Object.entries(previewApplication.result.breakdown).map(([key, data]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium capitalize">{key.replace("_", " ")}</div>
                      <div className="text-sm text-muted-foreground">{data.details}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">
                        {Math.round(data.score)}/{data.max}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
