"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { authService } from "@/lib/auth-service"
import {
  scoringPreferencesService,
  type ScoringPreference,
  type RenterProfile,
} from "@/lib/scoring-preferences-service"
import {
  Settings,
  Wand2,
  Target,
  FileCheck,
  Euro,
  Briefcase,
  Shield,
  CheckCircle,
  AlertTriangle,
  Save,
  RotateCcw,
} from "lucide-react"

const CONTRACT_TYPES = [
  { value: "cdi", label: "CDI" },
  { value: "cdd", label: "CDD" },
  { value: "fonctionnaire", label: "Fonctionnaire" },
  { value: "retraite", label: "Retraité" },
  { value: "independant", label: "Indépendant" },
  { value: "intermittent", label: "Intermittent du spectacle" },
  { value: "etudiant", label: "Étudiant" },
  { value: "autre", label: "Autre" },
]

const GUARANTOR_TYPES = [
  { value: "individual", label: "Personne physique" },
  { value: "visale", label: "Visale" },
  { value: "other_organism", label: "Autre organisme" },
  { value: "company", label: "Entreprise" },
]

export default function ScoringPreferencesSimplePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("wizard")

  // Pour le mode wizard
  const [propertyRent, setPropertyRent] = useState(1000)
  const [profiles, setProfiles] = useState<{
    excellent: RenterProfile
    good: RenterProfile
    acceptable: RenterProfile
    unacceptable: RenterProfile
  }>({} as any)

  // Pour le mode système
  const [systemPreferences, setSystemPreferences] = useState<ScoringPreference[]>([])
  const [selectedSystemPreference, setSelectedSystemPreference] = useState<string>("")

  // Pour le mode avancé
  const [customPreference, setCustomPreference] = useState<ScoringPreference | null>(null)
  const [userPreferences, setUserPreferences] = useState<ScoringPreference[]>([])
  const [selectedUserPreference, setSelectedUserPreference] = useState<string>("")

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

      // Charger les préférences système
      const systemPrefs = await scoringPreferencesService.getSystemPreferences()
      setSystemPreferences(systemPrefs)

      if (systemPrefs.length > 0) {
        const defaultSystemPref = systemPrefs.find((p) => p.is_default) || systemPrefs[0]
        setSelectedSystemPreference(defaultSystemPref.id || "")
      }

      // Charger les préférences de l'utilisateur
      const userPrefs = await scoringPreferencesService.getOwnerPreferences(currentUser.id)
      setUserPreferences(userPrefs)

      if (userPrefs.length > 0) {
        const defaultUserPref = userPrefs.find((p) => p.is_default) || userPrefs[0]
        setSelectedUserPreference(defaultUserPref.id || "")
        setCustomPreference(defaultUserPref)
      } else {
        // Si pas de préférence utilisateur, charger le modèle par défaut
        const defaultPref = await scoringPreferencesService.getOwnerDefaultPreference(currentUser.id)
        if (defaultPref) {
          setCustomPreference(defaultPref)
        }
      }

      // Initialiser les profils prédéfinis
      const defaultProfiles = scoringPreferencesService.getDefaultProfiles(propertyRent)
      setProfiles(defaultProfiles)
    } catch (error) {
      console.error("Erreur auth:", error)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveFromWizard = async () => {
    if (!user) return

    try {
      setSaving(true)

      // Créer une préférence à partir des profils
      const preference = scoringPreferencesService.createPreferenceFromProfiles(user.id, propertyRent, profiles)

      // Sauvegarder la préférence
      const response = await fetch("/api/scoring-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preference),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de la sauvegarde")
      }

      toast.success("Préférences sauvegardées avec succès")
      await checkAuthAndLoadData() // Recharger les données
      setActiveTab("system") // Passer à l'onglet système
    } catch (error) {
      console.error("Erreur sauvegarde:", error)
      toast.error("Erreur lors de la sauvegarde des préférences")
    } finally {
      setSaving(false)
    }
  }

  const handleUseSystemPreference = async () => {
    if (!user || !selectedSystemPreference) return

    try {
      setSaving(true)

      // Récupérer la préférence système sélectionnée
      const systemPref = systemPreferences.find((p) => p.id === selectedSystemPreference)
      if (!systemPref) {
        toast.error("Préférence système introuvable")
        return
      }

      // Créer une copie personnalisée de la préférence système
      const userPreference = {
        ...systemPref,
        owner_id: user.id,
        name: `${systemPref.name} (personnalisé)`,
        is_default: true,
        is_system: false,
        // Supprimer l'ID pour créer une nouvelle entrée
        id: undefined,
        created_at: undefined,
        updated_at: undefined,
      }

      // Sauvegarder la préférence
      const response = await fetch("/api/scoring-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userPreference),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de l'application du modèle")
      }

      toast.success("Modèle appliqué avec succès")
      await checkAuthAndLoadData() // Recharger les données
    } catch (error) {
      console.error("Erreur application modèle:", error)
      toast.error("Erreur lors de l'application du modèle")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveCustomPreference = async () => {
    if (!user || !customPreference) return

    try {
      setSaving(true)

      if (customPreference.id) {
        // Mise à jour
        await scoringPreferencesService.updatePreference(customPreference.id, customPreference)
      } else {
        // Création
        const response = await fetch("/api/scoring-preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(customPreference),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Erreur lors de la sauvegarde")
        }
      }

      toast.success("Préférences sauvegardées avec succès")
      await checkAuthAndLoadData() // Recharger les données
    } catch (error) {
      console.error("Erreur sauvegarde:", error)
      toast.error("Erreur lors de la sauvegarde des préférences")
    } finally {
      setSaving(false)
    }
  }

  const updateProfile = (profileType: keyof typeof profiles, updates: Partial<RenterProfile>) => {
    setProfiles((prev) => ({
      ...prev,
      [profileType]: {
        ...prev[profileType],
        ...updates,
      },
    }))
  }

  const updateCustomPreference = (updates: Partial<ScoringPreference>) => {
    setCustomPreference((prev) => (prev ? { ...prev, ...updates } : null))
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des préférences...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Préférences de scoring</h1>
          <p className="text-gray-600 mt-1">Configurez vos critères d'évaluation des candidatures</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/owner/applications")}>
          Retour aux candidatures
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="wizard" className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Assistant simple
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Modèles prédéfinis
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuration avancée
          </TabsTrigger>
        </TabsList>

        {/* Onglet Assistant simple */}
        <TabsContent value="wizard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                Assistant de configuration simple
              </CardTitle>
              <p className="text-sm text-gray-600">
                Définissez vos critères en quelques étapes simples. L'assistant créera automatiquement vos préférences
                de scoring.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Loyer de référence */}
              <div className="space-y-2">
                <Label htmlFor="rent">Loyer de référence (€/mois)</Label>
                <Input
                  id="rent"
                  type="number"
                  value={propertyRent}
                  onChange={(e) => setPropertyRent(Number(e.target.value))}
                  placeholder="1000"
                />
                <p className="text-xs text-gray-500">
                  Utilisé pour calculer les ratios revenus/loyer. Vous pouvez utiliser le loyer moyen de vos biens.
                </p>
              </div>

              {/* Configuration des profils */}
              <div className="grid gap-6">
                {Object.entries(profiles).map(([key, profile]) => {
                  const profileKey = key as keyof typeof profiles
                  const isUnacceptable = profileKey === "unacceptable"

                  return (
                    <Card key={key} className={`${isUnacceptable ? "border-red-200 bg-red-50" : ""}`}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {profileKey === "excellent" && <CheckCircle className="h-5 w-5 text-green-500" />}
                          {profileKey === "good" && <CheckCircle className="h-5 w-5 text-blue-500" />}
                          {profileKey === "acceptable" && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                          {profileKey === "unacceptable" && <AlertTriangle className="h-5 w-5 text-red-500" />}
                          Profil {profile.name}
                        </CardTitle>
                        <p className="text-sm text-gray-600">{profile.description}</p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Ratio revenus */}
                        <div className="space-y-2">
                          <Label>Ratio revenus/loyer minimum</Label>
                          <div className="flex items-center gap-4">
                            <Slider
                              value={[profile.income_ratio]}
                              onValueChange={([value]) => updateProfile(profileKey, { income_ratio: value })}
                              min={1.5}
                              max={5}
                              step={0.1}
                              className="flex-1"
                            />
                            <Badge variant="outline" className="min-w-[60px]">
                              {profile.income_ratio}x
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500">
                            Revenus minimum requis : {Math.round(propertyRent * profile.income_ratio)}€/mois
                          </p>
                        </div>

                        {/* Types de contrats */}
                        <div className="space-y-2">
                          <Label>Types de contrats acceptés</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {CONTRACT_TYPES.map((contractType) => (
                              <div key={contractType.value} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${key}-${contractType.value}`}
                                  checked={profile.contract_types.includes(contractType.value)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      updateProfile(profileKey, {
                                        contract_types: [...profile.contract_types, contractType.value],
                                      })
                                    } else {
                                      updateProfile(profileKey, {
                                        contract_types: profile.contract_types.filter((t) => t !== contractType.value),
                                      })
                                    }
                                  }}
                                />
                                <Label htmlFor={`${key}-${contractType.value}`} className="text-sm">
                                  {contractType.label}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Garant */}
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={profile.guarantor.required}
                              onCheckedChange={(checked) =>
                                updateProfile(profileKey, {
                                  guarantor: { ...profile.guarantor, required: checked },
                                })
                              }
                            />
                            <Label>Garant requis</Label>
                          </div>

                          {profile.guarantor.required && (
                            <div className="space-y-2 pl-6">
                              <Label>Ratio revenus garant/loyer minimum</Label>
                              <div className="flex items-center gap-4">
                                <Slider
                                  value={[profile.guarantor.income_ratio || 3]}
                                  onValueChange={([value]) =>
                                    updateProfile(profileKey, {
                                      guarantor: { ...profile.guarantor, income_ratio: value },
                                    })
                                  }
                                  min={2}
                                  max={6}
                                  step={0.1}
                                  className="flex-1"
                                />
                                <Badge variant="outline" className="min-w-[60px]">
                                  {profile.guarantor.income_ratio || 3}x
                                </Badge>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Complétion du dossier */}
                        <div className="space-y-2">
                          <Label>Complétion minimum du dossier</Label>
                          <div className="flex items-center gap-4">
                            <Slider
                              value={[profile.file_completion]}
                              onValueChange={([value]) => updateProfile(profileKey, { file_completion: value })}
                              min={50}
                              max={100}
                              step={5}
                              className="flex-1"
                            />
                            <Badge variant="outline" className="min-w-[60px]">
                              {profile.file_completion}%
                            </Badge>
                          </div>
                        </div>

                        {/* Documents vérifiés */}
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={profile.verified_documents}
                            onCheckedChange={(checked) => updateProfile(profileKey, { verified_documents: checked })}
                          />
                          <Label>Documents vérifiés requis (DossierFacile)</Label>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    const defaultProfiles = scoringPreferencesService.getDefaultProfiles(propertyRent)
                    setProfiles(defaultProfiles)
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Réinitialiser
                </Button>
                <Button onClick={handleSaveFromWizard} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Sauvegarde..." : "Sauvegarder"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Modèles prédéfinis */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Modèles prédéfinis
              </CardTitle>
              <p className="text-sm text-gray-600">
                Choisissez parmi nos modèles prêts à l'emploi, conçus par des experts immobiliers.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {systemPreferences.map((pref) => (
                <Card
                  key={pref.id}
                  className={`cursor-pointer transition-colors ${
                    selectedSystemPreference === pref.id ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="systemPreference"
                          value={pref.id}
                          checked={selectedSystemPreference === pref.id}
                          onChange={(e) => setSelectedSystemPreference(e.target.value)}
                          className="h-4 w-4"
                        />
                        <div>
                          <h3 className="font-medium">{pref.name}</h3>
                          <div className="text-sm text-gray-600 mt-1 space-y-1">
                            <div>• Ratio revenus minimum : {pref.min_income_ratio}x le loyer</div>
                            <div>• Garant {pref.guarantor_required ? "requis" : "optionnel"}</div>
                            <div>• Dossier minimum : {pref.min_file_completion}%</div>
                            <div>
                              • Documents vérifiés : {pref.verified_documents_required ? "requis" : "optionnel"}
                            </div>
                          </div>
                        </div>
                      </div>
                      {pref.is_default && <Badge variant="default">Par défaut</Badge>}
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="flex justify-end">
                <Button onClick={handleUseSystemPreference} disabled={saving || !selectedSystemPreference}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Application..." : "Appliquer ce modèle"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Configuration avancée */}
        <TabsContent value="advanced" className="space-y-6">
          {customPreference && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuration avancée
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Personnalisez finement tous les critères d'évaluation des candidatures.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Nom de la préférence */}
                <div className="space-y-2">
                  <Label htmlFor="pref-name">Nom de la configuration</Label>
                  <Input
                    id="pref-name"
                    value={customPreference.name}
                    onChange={(e) => updateCustomPreference({ name: e.target.value })}
                    placeholder="Ma configuration personnalisée"
                  />
                </div>

                {/* Critères financiers */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Euro className="h-5 w-5" />
                    Critères financiers
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Ratio minimum</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={customPreference.min_income_ratio}
                        onChange={(e) => updateCustomPreference({ min_income_ratio: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ratio bon</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={customPreference.good_income_ratio}
                        onChange={(e) => updateCustomPreference({ good_income_ratio: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ratio excellent</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={customPreference.excellent_income_ratio}
                        onChange={(e) => updateCustomPreference({ excellent_income_ratio: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Stabilité professionnelle */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Stabilité professionnelle
                  </h3>

                  <div className="space-y-3">
                    <Label>Types de contrats acceptés</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {CONTRACT_TYPES.map((contractType) => (
                        <div key={contractType.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`advanced-${contractType.value}`}
                            checked={customPreference.accepted_contracts.includes(contractType.value)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                updateCustomPreference({
                                  accepted_contracts: [...customPreference.accepted_contracts, contractType.value],
                                })
                              } else {
                                updateCustomPreference({
                                  accepted_contracts: customPreference.accepted_contracts.filter(
                                    (t) => t !== contractType.value,
                                  ),
                                })
                              }
                            }}
                          />
                          <Label htmlFor={`advanced-${contractType.value}`} className="text-sm">
                            {contractType.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Types de contrats préférés</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {CONTRACT_TYPES.filter((ct) => customPreference.accepted_contracts.includes(ct.value)).map(
                        (contractType) => (
                          <div key={contractType.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`preferred-${contractType.value}`}
                              checked={customPreference.preferred_contracts.includes(contractType.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  updateCustomPreference({
                                    preferred_contracts: [...customPreference.preferred_contracts, contractType.value],
                                  })
                                } else {
                                  updateCustomPreference({
                                    preferred_contracts: customPreference.preferred_contracts.filter(
                                      (t) => t !== contractType.value,
                                    ),
                                  })
                                }
                              }}
                            />
                            <Label htmlFor={`preferred-${contractType.value}`} className="text-sm">
                              {contractType.label}
                            </Label>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Garants */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Garants
                  </h3>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={customPreference.guarantor_required}
                      onCheckedChange={(checked) => updateCustomPreference({ guarantor_required: checked })}
                    />
                    <Label>Garant requis</Label>
                  </div>

                  <div className="space-y-2">
                    <Label>Ratio revenus garant minimum</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={customPreference.min_guarantor_income_ratio}
                      onChange={(e) => updateCustomPreference({ min_guarantor_income_ratio: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Types de garants acceptés</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {GUARANTOR_TYPES.map((guarantorType) => (
                        <div key={guarantorType.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`guarantor-${guarantorType.value}`}
                            checked={customPreference.accepted_guarantor_types.includes(guarantorType.value)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                updateCustomPreference({
                                  accepted_guarantor_types: [
                                    ...customPreference.accepted_guarantor_types,
                                    guarantorType.value,
                                  ],
                                })
                              } else {
                                updateCustomPreference({
                                  accepted_guarantor_types: customPreference.accepted_guarantor_types.filter(
                                    (t) => t !== guarantorType.value,
                                  ),
                                })
                              }
                            }}
                          />
                          <Label htmlFor={`guarantor-${guarantorType.value}`} className="text-sm">
                            {guarantorType.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Qualité du dossier */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <FileCheck className="h-5 w-5" />
                    Qualité du dossier
                  </h3>

                  <div className="space-y-2">
                    <Label>Complétion minimum du dossier (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={customPreference.min_file_completion}
                      onChange={(e) => updateCustomPreference({ min_file_completion: Number(e.target.value) })}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={customPreference.verified_documents_required}
                      onCheckedChange={(checked) => updateCustomPreference({ verified_documents_required: checked })}
                    />
                    <Label>Documents vérifiés requis (DossierFacile)</Label>
                  </div>
                </div>

                <Separator />

                {/* Pondération */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Pondération des critères
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Revenus ({customPreference.weights.income}%)</Label>
                      <Slider
                        value={[customPreference.weights.income]}
                        onValueChange={([value]) =>
                          updateCustomPreference({
                            weights: { ...customPreference.weights, income: value },
                          })
                        }
                        min={0}
                        max={100}
                        step={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Stabilité ({customPreference.weights.stability}%)</Label>
                      <Slider
                        value={[customPreference.weights.stability]}
                        onValueChange={([value]) =>
                          updateCustomPreference({
                            weights: { ...customPreference.weights, stability: value },
                          })
                        }
                        min={0}
                        max={100}
                        step={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Garant ({customPreference.weights.guarantor}%)</Label>
                      <Slider
                        value={[customPreference.weights.guarantor]}
                        onValueChange={([value]) =>
                          updateCustomPreference({
                            weights: { ...customPreference.weights, guarantor: value },
                          })
                        }
                        min={0}
                        max={100}
                        step={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Dossier ({customPreference.weights.file_quality}%)</Label>
                      <Slider
                        value={[customPreference.weights.file_quality]}
                        onValueChange={([value]) =>
                          updateCustomPreference({
                            weights: { ...customPreference.weights, file_quality: value },
                          })
                        }
                        min={0}
                        max={100}
                        step={5}
                      />
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">
                    Total : {Object.values(customPreference.weights).reduce((sum, val) => sum + val, 0)}%
                    {Object.values(customPreference.weights).reduce((sum, val) => sum + val, 0) !== 100 && (
                      <span className="text-red-600 ml-2">(doit être égal à 100%)</span>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const defaultPref = scoringPreferencesService.getDefaultSystemPreference()
                      setCustomPreference({ ...defaultPref, owner_id: user?.id || "" })
                    }}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Réinitialiser
                  </Button>
                  <Button
                    onClick={handleSaveCustomPreference}
                    disabled={
                      saving || Object.values(customPreference.weights).reduce((sum, val) => sum + val, 0) !== 100
                    }
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Sauvegarde..." : "Sauvegarder"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
