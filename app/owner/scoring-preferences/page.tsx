"use client"

import { Badge } from "@/components/ui/badge"

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
import {
  Save,
  FileCheck,
  Shield,
  Briefcase,
  Euro,
  Star,
  Eye,
  RefreshCw,
  Plus,
  Trash2,
  ArrowLeft,
  Info,
} from "lucide-react"

export default function ScoringPreferencesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [preferences, setPreferences] = useState<ScoringPreferences[]>([])
  const [currentPreferences, setCurrentPreferences] = useState<ScoringPreferences | null>(null)
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
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

  const loadPreferences = async (ownerId: string, keepSelectedProfile = false) => {
    try {
      const response = await fetch(`/api/scoring-preferences?owner_id=${ownerId}`)
      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences || [])

        // Si on veut garder le profil sélectionné et qu'il existe
        if (keepSelectedProfile && selectedProfileId) {
          const selectedProfile = data.preferences?.find((p: ScoringPreferences) => p.id === selectedProfileId)
          if (selectedProfile) {
            setCurrentPreferences(selectedProfile)
            return
          }
        }

        // Sinon, sélectionner le profil par défaut ou créer un nouveau
        const defaultPref = data.preferences?.find((p: ScoringPreferences) => p.is_default)
        if (defaultPref) {
          setCurrentPreferences(defaultPref)
          setSelectedProfileId(defaultPref.id)
        } else {
          // Créer des préférences par défaut
          const defaultPrefs = scoringPreferencesService.getDefaultPreferences(ownerId)
          setCurrentPreferences(defaultPrefs)
          setSelectedProfileId(null)
        }
      }
    } catch (error) {
      console.error("Erreur chargement préférences:", error)
      toast.error("Erreur lors du chargement")

      // En cas d'erreur, utiliser les préférences par défaut
      if (user) {
        const defaultPrefs = scoringPreferencesService.getDefaultPreferences(user.id)
        setCurrentPreferences(defaultPrefs)
        setSelectedProfileId(null)
      }
    }
  }

  const selectProfile = (profile: ScoringPreferences) => {
    console.log("Sélection du profil:", profile.name, profile.id)
    // Créer une copie profonde pour éviter les problèmes de référence
    setCurrentPreferences(JSON.parse(JSON.stringify(profile)))
    setSelectedProfileId(profile.id || null)
  }

  const deleteProfile = async (profileId: string) => {
    if (!user) return

    try {
      setSaving(true)

      const response = await fetch(`/api/scoring-preferences/${profileId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Profil supprimé")

        // Si on supprime le profil actuellement sélectionné, sélectionner le profil par défaut
        if (selectedProfileId === profileId) {
          setSelectedProfileId(null)
          const defaultPrefs = scoringPreferencesService.getDefaultPreferences(user.id)
          setCurrentPreferences(defaultPrefs)
        }

        await loadPreferences(user.id)
      } else {
        toast.error("Erreur lors de la suppression")
      }
    } catch (error) {
      console.error("Erreur suppression:", error)
      toast.error("Erreur lors de la suppression")
    } finally {
      setSaving(false)
    }
  }

  const detectProfileChanges = () => {
    if (!currentPreferences || !selectedProfileId) return

    // Si c'est un profil existant et qu'il a été modifié
    const originalProfile = preferences.find((p) => p.id === selectedProfileId)
    if (originalProfile) {
      const hasChanged = JSON.stringify(originalProfile.criteria) !== JSON.stringify(currentPreferences.criteria)
      if (hasChanged && !currentPreferences.name.includes("(modifié)")) {
        setCurrentPreferences({
          ...currentPreferences,
          name: currentPreferences.name.includes("Profil")
            ? "Profil personnalisé"
            : currentPreferences.name + " (modifié)",
        })
      }
    }
  }

  const savePreferences = async () => {
    if (!currentPreferences || !user) return

    // Valider les préférences
    const validation = scoringPreferencesService.validatePreferences(currentPreferences)
    if (!validation.valid) {
      toast.error(`Erreur de validation: ${validation.errors.join(", ")}`)
      return
    }

    try {
      setSaving(true)

      // Si le profil a un ID, c'est une mise à jour
      if (currentPreferences.id) {
        const response = await fetch(`/api/scoring-preferences/${currentPreferences.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: currentPreferences.name,
            is_default: currentPreferences.is_default,
            criteria: currentPreferences.criteria,
          }),
        })

        if (response.ok) {
          toast.success("Préférences mises à jour")
          await loadPreferences(user.id, true) // Garder le profil sélectionné
        } else {
          const errorData = await response.json()
          console.error("Erreur API:", errorData)
          toast.error("Erreur lors de la mise à jour")
        }
      } else {
        // Sinon c'est une création
        const response = await fetch("/api/scoring-preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            owner_id: user.id,
            name: currentPreferences.name,
            is_default: false, // Les nouveaux profils ne sont jamais par défaut automatiquement
            criteria: currentPreferences.criteria,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          toast.success("Préférences sauvegardées")
          setSelectedProfileId(data.preferences?.id || data.preference?.id)
          setCurrentPreferences(data.preferences || data.preference)
          await loadPreferences(user.id, true) // Garder le profil sélectionné
        } else {
          const errorData = await response.json()
          console.error("Erreur API:", errorData)
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
      if (!current[pathArray[i]]) {
        current[pathArray[i]] = {}
      }
      current = current[pathArray[i]]
    }
    current[pathArray[pathArray.length - 1]] = value

    setCurrentPreferences(newPreferences)

    // Détecter les changements après un court délai
    setTimeout(detectProfileChanges, 100)
  }

  const getTotalWeight = () => {
    if (!currentPreferences?.criteria) return 0
    const criteria = currentPreferences.criteria
    return (
      (criteria.income_ratio?.weight || 0) +
      (criteria.professional_stability?.weight || 0) +
      (criteria.guarantor?.weight || 0) +
      (criteria.application_quality?.weight || 0)
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
      file_complete: true,
      has_verified_documents: true,
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
          owner_id: user.id,
          name: "Profil strict",
          is_default: false,
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
            guarantor: {
              ...scoringPreferencesService.getDefaultPreferences(user.id).criteria.guarantor,
              weight: 15,
            },
            application_quality: {
              ...scoringPreferencesService.getDefaultPreferences(user.id).criteria.application_quality,
              weight: 10,
            },
          },
        }
        break
      case "flexible":
        preset = {
          owner_id: user.id,
          name: "Profil flexible",
          is_default: false,
          criteria: {
            ...scoringPreferencesService.getDefaultPreferences(user.id).criteria,
            income_ratio: {
              ...scoringPreferencesService.getDefaultPreferences(user.id).criteria.income_ratio,
              weight: 25,
              thresholds: { excellent: 3.0, good: 2.5, acceptable: 2.0, minimum: 1.8 },
            },
            professional_stability: {
              ...scoringPreferencesService.getDefaultPreferences(user.id).criteria.professional_stability,
              weight: 25,
            },
            guarantor: {
              ...scoringPreferencesService.getDefaultPreferences(user.id).criteria.guarantor,
              weight: 25,
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

    // Retirer l'ID pour créer un nouveau profil
    const { id, created_at, updated_at, ...newPreset } = preset as any
    setCurrentPreferences(newPreset)
    setSelectedProfileId(null) // Nouveau profil, pas d'ID
  }

  const setAsDefault = async (profileId: string) => {
    if (!user) return

    try {
      setSaving(true)

      const response = await fetch("/api/scoring-preferences/set-default", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_id: user.id,
          profile_id: profileId,
        }),
      })

      if (!response.ok) {
        toast.error("Erreur lors de la mise à jour")
        return
      }

      toast.success("Profil défini comme défaut")
      await loadPreferences(user.id, true) // Garder le profil sélectionné
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la mise à jour")
    } finally {
      setSaving(false)
    }
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
            <Button
              onClick={() => {
                if (user) {
                  const defaultPrefs = scoringPreferencesService.getDefaultPreferences(user.id)
                  setCurrentPreferences(defaultPrefs)
                }
              }}
              className="mt-4"
            >
              Utiliser les préférences par défaut
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalWeight = getTotalWeight()
  const criteria = currentPreferences.criteria

  // Vérifier que les critères existent
  if (
    !criteria ||
    !criteria.income_ratio ||
    !criteria.professional_stability ||
    !criteria.guarantor ||
    !criteria.application_quality
  ) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="text-center py-8">
            <p>Critères de scoring incomplets</p>
            <Button
              onClick={() => {
                if (user) {
                  const defaultPrefs = scoringPreferencesService.getDefaultPreferences(user.id)
                  setCurrentPreferences(defaultPrefs)
                }
              }}
              className="mt-4"
            >
              Réinitialiser avec les critères par défaut
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuration avancée des critères"
        description="Configurez précisément vos critères d'évaluation des candidatures"
      >
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/owner/scoring-preferences-simple")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Mode simple
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const newProfile = scoringPreferencesService.getDefaultPreferences(user.id)
              const { id, created_at, updated_at, ...cleanProfile } = newProfile as any
              setCurrentPreferences({
                ...cleanProfile,
                name: "Nouveau profil",
                is_default: false,
              })
              setSelectedProfileId(null)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau profil
          </Button>
          <Button variant="outline" onClick={generatePreviewScore}>
            <Eye className="h-4 w-4 mr-2" />
            Aperçu
          </Button>
          <Button onClick={savePreferences} disabled={saving || totalWeight !== 100}>
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

      {/* Affichage du profil actuel */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-blue-900">Profil actuel</h3>
            <p className="text-sm text-blue-700">{currentPreferences.name}</p>
            <p className="text-xs text-blue-600 mt-1">
              {currentPreferences.is_default
                ? "Ce profil est utilisé par défaut pour évaluer les candidatures"
                : "Ce profil n'est pas défini comme profil par défaut"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {currentPreferences.is_default ? (
              <Badge variant="default" className="bg-blue-600">
                <Star className="h-3 w-3 mr-1 fill-current" />
                Profil par défaut
              </Badge>
            ) : selectedProfileId ? (
              <Button variant="outline" size="sm" onClick={() => setAsDefault(selectedProfileId)} disabled={saving}>
                <Star className="h-3 w-3 mr-1" />
                Définir comme profil par défaut
              </Button>
            ) : (
              <Badge variant="outline">Nouveau profil non sauvegardé</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Profils et presets */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Profils sauvegardés</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {preferences.map((pref) => (
                <div key={pref.id} className="flex items-center gap-2">
                  <Button
                    variant={selectedProfileId === pref.id ? "default" : "outline"}
                    size="sm"
                    className="flex-1 justify-start"
                    onClick={() => selectProfile(pref)}
                  >
                    {pref.name}
                    {pref.is_default && <Star className="h-3 w-3 ml-auto" />}
                  </Button>
                  <div className="flex gap-1">
                    {!pref.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAsDefault(pref.id!)}
                        disabled={saving}
                        title="Définir comme défaut"
                      >
                        <Star className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteProfile(pref.id!)}
                      disabled={saving || pref.is_default}
                      title="Supprimer le profil"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Profils prédéfinis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-transparent"
                onClick={() => loadPreset("balanced")}
              >
                Équilibré
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-transparent"
                onClick={() => loadPreset("strict")}
              >
                Strict
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-transparent"
                onClick={() => loadPreset("flexible")}
              >
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
                <FileCheck className="h-4 w-4" />
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

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-start gap-2 mb-3">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">Comment ça fonctionne</h4>
                        <p className="text-sm text-blue-800">
                          Définissez les seuils de ratio revenus/loyer. Un candidat avec 3000€ de revenus pour un loyer
                          de 1000€ a un ratio de 3x. Plus le ratio est élevé, meilleur est le score.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-base font-medium mb-3 block">Seuils de ratio revenus/loyer</Label>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm text-green-600 font-medium">
                            Excellent (≥ {criteria.income_ratio.thresholds.excellent}x le loyer)
                          </Label>
                          <Slider
                            value={[criteria.income_ratio.thresholds.excellent]}
                            onValueChange={([value]) => updateCriteria("income_ratio.thresholds.excellent", value)}
                            min={2}
                            max={5}
                            step={0.1}
                            className="mt-2"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Score: {criteria.income_ratio.points.excellent}% du poids total
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm text-blue-600 font-medium">
                            Bon (≥ {criteria.income_ratio.thresholds.good}x le loyer)
                          </Label>
                          <Slider
                            value={[criteria.income_ratio.thresholds.good]}
                            onValueChange={([value]) => updateCriteria("income_ratio.thresholds.good", value)}
                            min={2}
                            max={4}
                            step={0.1}
                            className="mt-2"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Score: {criteria.income_ratio.points.good}% du poids total
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm text-amber-600 font-medium">
                            Acceptable (≥ {criteria.income_ratio.thresholds.acceptable}x le loyer)
                          </Label>
                          <Slider
                            value={[criteria.income_ratio.thresholds.acceptable]}
                            onValueChange={([value]) => updateCriteria("income_ratio.thresholds.acceptable", value)}
                            min={1.5}
                            max={3}
                            step={0.1}
                            className="mt-2"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Score: {criteria.income_ratio.points.acceptable}% du poids total
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm text-red-600 font-medium">
                            Insuffisant (&lt; {criteria.income_ratio.thresholds.acceptable}x le loyer)
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Score: {criteria.income_ratio.points.insufficient}% du poids total
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-base font-medium mb-3 block">Exemple concret</Label>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <p className="text-sm">
                          <strong>Loyer:</strong> 1000€/mois
                        </p>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Revenus 3500€ (3.5x)</span>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Excellent
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Revenus 3000€ (3.0x)</span>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              Bon
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Revenus 2500€ (2.5x)</span>
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                              Acceptable
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Revenus 2000€ (2.0x)</span>
                            <Badge variant="secondary" className="bg-red-100 text-red-800">
                              Insuffisant
                            </Badge>
                          </div>
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

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-start gap-2 mb-3">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">Comment ça fonctionne</h4>
                        <p className="text-sm text-blue-800">
                          Attribuez un score à chaque type de contrat. 100% = score maximum, 0% = score minimum. Les
                          bonus et pénalités s'ajoutent au score de base.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-medium mb-3 block">Score par type de contrat</Label>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(criteria.professional_stability.contract_types).map(([type, points]) => (
                        <div key={type} className="space-y-2">
                          <Label className="text-sm font-medium capitalize">
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
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Rejeté</span>
                            <span>Idéal</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-base font-medium">Bonus ancienneté</Label>
                        <Switch
                          checked={criteria.professional_stability.seniority_bonus.enabled}
                          onCheckedChange={(checked) =>
                            updateCriteria("professional_stability.seniority_bonus.enabled", checked)
                          }
                        />
                      </div>
                      {criteria.professional_stability.seniority_bonus.enabled && (
                        <div className="space-y-3 bg-green-50 p-3 rounded-lg">
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
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">
                              Points bonus (+{criteria.professional_stability.seniority_bonus.bonus_points}%)
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
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-base font-medium">Pénalité période d'essai</Label>
                        <Switch
                          checked={criteria.professional_stability.trial_period_penalty.enabled}
                          onCheckedChange={(checked) =>
                            updateCriteria("professional_stability.trial_period_penalty.enabled", checked)
                          }
                        />
                      </div>
                      {criteria.professional_stability.trial_period_penalty.enabled && (
                        <div className="bg-red-50 p-3 rounded-lg">
                          <Label className="text-sm">
                            Points de pénalité (-{criteria.professional_stability.trial_period_penalty.penalty_points}%)
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

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-start gap-2 mb-3">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">Comment ça fonctionne</h4>
                        <p className="text-sm text-blue-800">
                          Score de base pour avoir un garant, avec des bonus possibles selon les revenus du garant et le
                          nombre de garants.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-medium">
                      Score de base pour la présence d'un garant ({criteria.guarantor.presence_points}%)
                    </Label>
                    <Slider
                      value={[criteria.guarantor.presence_points]}
                      onValueChange={([value]) => updateCriteria("guarantor.presence_points", value)}
                      max={100}
                      step={5}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Score attribué simplement pour avoir un garant</p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-base font-medium">Bonus revenus garant</Label>
                        <Switch
                          checked={criteria.guarantor.income_ratio_bonus.enabled}
                          onCheckedChange={(checked) => updateCriteria("guarantor.income_ratio_bonus.enabled", checked)}
                        />
                      </div>
                      {criteria.guarantor.income_ratio_bonus.enabled && (
                        <div className="space-y-3 bg-green-50 p-3 rounded-lg">
                          <div>
                            <Label className="text-sm">
                              Seuil ratio garant (≥{criteria.guarantor.income_ratio_bonus.threshold}x le loyer)
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
                              Points bonus (+{criteria.guarantor.income_ratio_bonus.bonus_points}%)
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
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-base font-medium">Bonus garants multiples</Label>
                        <Switch
                          checked={criteria.guarantor.multiple_guarantors_bonus.enabled}
                          onCheckedChange={(checked) =>
                            updateCriteria("guarantor.multiple_guarantors_bonus.enabled", checked)
                          }
                        />
                      </div>
                      {criteria.guarantor.multiple_guarantors_bonus.enabled && (
                        <div className="bg-green-50 p-3 rounded-lg">
                          <Label className="text-sm">
                            Points par garant supplémentaire (+
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
                    <FileCheck className="h-5 w-5" />
                    Qualité du dossier
                  </CardTitle>
                  <CardDescription>Configurez l'évaluation de la complétude et vérification du dossier</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Importance de la qualité du dossier ({criteria.application_quality.weight}%)</Label>
                    <Slider
                      value={[criteria.application_quality.weight]}
                      onValueChange={([value]) => updateCriteria("application_quality.weight", value)}
                      max={100}
                      step={5}
                      className="mt-2"
                    />
                  </div>

                  <Separator />

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-start gap-2 mb-3">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">Comment ça fonctionne</h4>
                        <p className="text-sm text-blue-800">
                          Évaluez la qualité du dossier selon deux critères : la complétude (tous les documents requis)
                          et la vérification par DossierFacile (service officiel de vérification).
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-base font-medium">Dossier complet</Label>
                        <Switch
                          checked={criteria.application_quality.file_completeness.required}
                          onCheckedChange={(checked) =>
                            updateCriteria("application_quality.file_completeness.required", checked)
                          }
                        />
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-2">
                          {criteria.application_quality.file_completeness.required
                            ? "Dossier complet REQUIS"
                            : "Dossier complet VALORISÉ"}
                        </p>
                        <div>
                          <Label className="text-sm">
                            Points ({criteria.application_quality.file_completeness.bonus_points}%)
                          </Label>
                          <Slider
                            value={[criteria.application_quality.file_completeness.bonus_points]}
                            onValueChange={([value]) =>
                              updateCriteria("application_quality.file_completeness.bonus_points", value)
                            }
                            max={100}
                            step={5}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-base font-medium">Documents vérifiés (DossierFacile)</Label>
                        <Switch
                          checked={criteria.application_quality.verified_documents.required}
                          onCheckedChange={(checked) =>
                            updateCriteria("application_quality.verified_documents.required", checked)
                          }
                        />
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-2">
                          {criteria.application_quality.verified_documents.required
                            ? "Documents vérifiés REQUIS"
                            : "Documents vérifiés VALORISÉS"}
                        </p>
                        <div>
                          <Label className="text-sm">
                            Points ({criteria.application_quality.verified_documents.bonus_points}%)
                          </Label>
                          <Slider
                            value={[criteria.application_quality.verified_documents.bonus_points]}
                            onValueChange={([value]) =>
                              updateCriteria("application_quality.verified_documents.bonus_points", value)
                            }
                            max={100}
                            step={5}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <h4 className="font-medium text-amber-900 mb-2">Exemple de scoring</h4>
                    <div className="space-y-1 text-sm text-amber-800">
                      <div>• Dossier complet + documents vérifiés = 100% du poids</div>
                      <div>
                        • Dossier complet seulement = {criteria.application_quality.file_completeness.bonus_points}% du
                        poids
                      </div>
                      <div>
                        • Documents vérifiés seulement = {criteria.application_quality.verified_documents.bonus_points}%
                        du poids
                      </div>
                      <div>• Aucun des deux = 0% du poids</div>
                    </div>
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

              {previewApplication.result.recommendations.length > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Recommandations</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    {previewApplication.result.recommendations.map((rec: string, index: number) => (
                      <li key={index}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
