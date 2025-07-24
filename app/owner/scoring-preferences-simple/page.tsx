"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { authService } from "@/lib/auth-service"
import { PageHeader } from "@/components/page-header"
import { Save, RefreshCw, Star, CheckCircle } from "lucide-react"

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

  // Assistant simple
  const [sampleProperty, setSampleProperty] = useState({
    price: 1000,
  })
  const [sampleProfiles, setSampleProfiles] = useState({
    excellent: {
      income: 3500,
      contract: "CDI",
      guarantor: true,
      guarantorIncome: 4000,
    },
    good: {
      income: 2800,
      contract: "CDD",
      guarantor: true,
      guarantorIncome: 3000,
    },
    acceptable: {
      income: 2200,
      contract: "freelance",
      guarantor: false,
      guarantorIncome: 0,
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
        setSystemPreferences(data.preferences || [])
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
          setCurrentUserPreference(data.preferences[0])

          // Si l'utilisateur a une préférence personnalisée basée sur un modèle système
          if (data.preferences[0].system_preference_id) {
            setSelectedSystemPreference(data.preferences[0].system_preference_id)
          } else {
            setSelectedSystemPreference(null)
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

      const response = await fetch("/api/scoring-preferences/use-system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_id: user.id,
          system_preference_id: systemPreferenceId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success("Modèle appliqué avec succès")
        setSelectedSystemPreference(systemPreferenceId)
        setCurrentUserPreference(data.preference)
        await loadUserPreference(user.id)
      } else {
        const errorData = await response.json()
        console.error("Erreur API:", errorData)
        toast.error("Erreur lors de l'application du modèle")
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

      // Créer une copie profonde pour éviter les problèmes de référence
      const newPreferences = {
        owner_id: user.id,
        name: "Préférences personnalisées",
        is_default: true,
        criteria: {
          income_ratio: {
            weight: 40,
            thresholds: {
              excellent: Number((sampleProfiles.excellent.income / sampleProperty.price).toFixed(1)),
              good: Number((sampleProfiles.good.income / sampleProperty.price).toFixed(1)),
              acceptable: Number((sampleProfiles.acceptable.income / sampleProperty.price).toFixed(1)),
              minimum: Number(((sampleProfiles.acceptable.income / sampleProperty.price) * 0.9).toFixed(1)),
            },
            points: {
              excellent: 100,
              good: 75,
              acceptable: 50,
              insufficient: 0,
            },
          },
          professional_stability: {
            weight: 30,
            contract_types: {
              cdi: sampleProfiles.excellent.contract === "CDI" ? 100 : 75,
              cdd: sampleProfiles.good.contract === "CDD" ? 75 : 50,
              freelance: sampleProfiles.acceptable.contract === "freelance" ? 50 : 25,
              student: 25,
              unemployed: 0,
              retired: 75,
            },
            seniority_bonus: {
              enabled: true,
              min_months: 12,
              bonus_points: 10,
            },
            trial_period_penalty: {
              enabled: true,
              penalty_points: 20,
            },
          },
          guarantor: {
            weight: 20,
            presence_points: sampleProfiles.excellent.guarantor ? 100 : 50,
            income_ratio_bonus: {
              enabled: true,
              threshold: sampleProfiles.excellent.guarantorIncome
                ? Number((sampleProfiles.excellent.guarantorIncome / sampleProperty.price).toFixed(1))
                : 3.0,
              bonus_points: 20,
            },
            multiple_guarantors_bonus: {
              enabled: true,
              bonus_per_additional: 10,
            },
          },
          application_quality: {
            weight: 10,
            presentation_length: {
              excellent: 200,
              good: 100,
              basic: 50,
            },
            completeness_bonus: {
              enabled: true,
              bonus_points: 20,
            },
          },
        },
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
        title="Préférences de scoring"
        description="Personnalisez vos critères d'évaluation des candidatures"
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
          <TabsTrigger value="assistant">Assistant simple</TabsTrigger>
          <TabsTrigger value="presets">Modèles prédéfinis</TabsTrigger>
        </TabsList>

        <TabsContent value="assistant" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assistant de configuration</CardTitle>
              <CardDescription>
                Configurez facilement vos critères d'évaluation en définissant des exemples concrets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Loyer de référence */}
              <div className="space-y-2">
                <Label>Pour un bien à ce loyer mensuel</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={sampleProperty.price}
                    onChange={(e) =>
                      setSampleProperty({ ...sampleProperty, price: Number.parseInt(e.target.value) || 0 })
                    }
                    className="w-32"
                  />
                  <span>€/mois</span>
                </div>
              </div>

              {/* Profil excellent */}
              <div className="space-y-4 border-l-4 border-green-500 pl-4">
                <h3 className="font-medium text-lg">Profil excellent</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Revenus mensuels</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={sampleProfiles.excellent.income}
                        onChange={(e) =>
                          setSampleProfiles({
                            ...sampleProfiles,
                            excellent: {
                              ...sampleProfiles.excellent,
                              income: Number.parseInt(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-32"
                      />
                      <span>€/mois</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({(sampleProfiles.excellent.income / sampleProperty.price).toFixed(1)}x le loyer)
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Type de contrat</Label>
                    <select
                      className="w-full border rounded-md p-2"
                      value={sampleProfiles.excellent.contract}
                      onChange={(e) =>
                        setSampleProfiles({
                          ...sampleProfiles,
                          excellent: {
                            ...sampleProfiles.excellent,
                            contract: e.target.value,
                          },
                        })
                      }
                    >
                      <option value="CDI">CDI</option>
                      <option value="CDD">CDD</option>
                      <option value="freelance">Freelance</option>
                      <option value="student">Étudiant</option>
                      <option value="retired">Retraité</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Garant</Label>
                      <input
                        type="checkbox"
                        checked={sampleProfiles.excellent.guarantor}
                        onChange={(e) =>
                          setSampleProfiles({
                            ...sampleProfiles,
                            excellent: {
                              ...sampleProfiles.excellent,
                              guarantor: e.target.checked,
                            },
                          })
                        }
                        className="ml-2"
                      />
                    </div>
                    {sampleProfiles.excellent.guarantor && (
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Revenus garant</Label>
                        <Input
                          type="number"
                          value={sampleProfiles.excellent.guarantorIncome}
                          onChange={(e) =>
                            setSampleProfiles({
                              ...sampleProfiles,
                              excellent: {
                                ...sampleProfiles.excellent,
                                guarantorIncome: Number.parseInt(e.target.value) || 0,
                              },
                            })
                          }
                          className="w-32"
                        />
                        <span>€/mois</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Profil bon */}
              <div className="space-y-4 border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-lg">Profil bon</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Revenus mensuels</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={sampleProfiles.good.income}
                        onChange={(e) =>
                          setSampleProfiles({
                            ...sampleProfiles,
                            good: {
                              ...sampleProfiles.good,
                              income: Number.parseInt(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-32"
                      />
                      <span>€/mois</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({(sampleProfiles.good.income / sampleProperty.price).toFixed(1)}x le loyer)
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Type de contrat</Label>
                    <select
                      className="w-full border rounded-md p-2"
                      value={sampleProfiles.good.contract}
                      onChange={(e) =>
                        setSampleProfiles({
                          ...sampleProfiles,
                          good: {
                            ...sampleProfiles.good,
                            contract: e.target.value,
                          },
                        })
                      }
                    >
                      <option value="CDI">CDI</option>
                      <option value="CDD">CDD</option>
                      <option value="freelance">Freelance</option>
                      <option value="student">Étudiant</option>
                      <option value="retired">Retraité</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Garant</Label>
                      <input
                        type="checkbox"
                        checked={sampleProfiles.good.guarantor}
                        onChange={(e) =>
                          setSampleProfiles({
                            ...sampleProfiles,
                            good: {
                              ...sampleProfiles.good,
                              guarantor: e.target.checked,
                            },
                          })
                        }
                        className="ml-2"
                      />
                    </div>
                    {sampleProfiles.good.guarantor && (
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Revenus garant</Label>
                        <Input
                          type="number"
                          value={sampleProfiles.good.guarantorIncome}
                          onChange={(e) =>
                            setSampleProfiles({
                              ...sampleProfiles,
                              good: {
                                ...sampleProfiles.good,
                                guarantorIncome: Number.parseInt(e.target.value) || 0,
                              },
                            })
                          }
                          className="w-32"
                        />
                        <span>€/mois</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Profil acceptable */}
              <div className="space-y-4 border-l-4 border-amber-500 pl-4">
                <h3 className="font-medium text-lg">Profil acceptable</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Revenus mensuels</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={sampleProfiles.acceptable.income}
                        onChange={(e) =>
                          setSampleProfiles({
                            ...sampleProfiles,
                            acceptable: {
                              ...sampleProfiles.acceptable,
                              income: Number.parseInt(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-32"
                      />
                      <span>€/mois</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({(sampleProfiles.acceptable.income / sampleProperty.price).toFixed(1)}x le loyer)
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Type de contrat</Label>
                    <select
                      className="w-full border rounded-md p-2"
                      value={sampleProfiles.acceptable.contract}
                      onChange={(e) =>
                        setSampleProfiles({
                          ...sampleProfiles,
                          acceptable: {
                            ...sampleProfiles.acceptable,
                            contract: e.target.value,
                          },
                        })
                      }
                    >
                      <option value="CDI">CDI</option>
                      <option value="CDD">CDD</option>
                      <option value="freelance">Freelance</option>
                      <option value="student">Étudiant</option>
                      <option value="retired">Retraité</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Garant</Label>
                      <input
                        type="checkbox"
                        checked={sampleProfiles.acceptable.guarantor}
                        onChange={(e) =>
                          setSampleProfiles({
                            ...sampleProfiles,
                            acceptable: {
                              ...sampleProfiles.acceptable,
                              guarantor: e.target.checked,
                            },
                          })
                        }
                        className="ml-2"
                      />
                    </div>
                    {sampleProfiles.acceptable.guarantor && (
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Revenus garant</Label>
                        <Input
                          type="number"
                          value={sampleProfiles.acceptable.guarantorIncome}
                          onChange={(e) =>
                            setSampleProfiles({
                              ...sampleProfiles,
                              acceptable: {
                                ...sampleProfiles.acceptable,
                                guarantorIncome: Number.parseInt(e.target.value) || 0,
                              },
                            })
                          }
                          className="w-32"
                        />
                        <span>€/mois</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveFromAssistant} disabled={saving}>
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Sauvegarder ces préférences
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
              <CardDescription>Choisissez un modèle prédéfini pour évaluer vos candidatures</CardDescription>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {systemPreferences.map((pref) => (
                    <Card
                      key={pref.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedSystemPreference === pref.id ? "border-2 border-blue-500 bg-blue-50" : ""
                      }`}
                      onClick={() => handleUseSystemPreference(pref.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{pref.name}</h3>
                          {selectedSystemPreference === pref.id ? (
                            <CheckCircle className="h-5 w-5 text-blue-500" />
                          ) : pref.is_default ? (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          ) : null}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{pref.description || "Modèle prédéfini"}</p>

                        {/* Aperçu des critères */}
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>Revenus:</span>
                            <span>{pref.criteria?.income_ratio?.weight || 0}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Stabilité:</span>
                            <span>{pref.criteria?.professional_stability?.weight || 0}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Garants:</span>
                            <span>{pref.criteria?.guarantor?.weight || 0}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Dossier:</span>
                            <span>{pref.criteria?.application_quality?.weight || 0}%</span>
                          </div>
                        </div>

                        {selectedSystemPreference === pref.id && (
                          <div className="mt-3 text-xs text-blue-600 font-medium">✓ Modèle actuellement utilisé</div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {currentUserPreference && !currentUserPreference.system_preference_id && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-blue-600 mr-2" />
                    <p className="text-blue-800">
                      Vous utilisez actuellement un modèle personnalisé : <strong>{currentUserPreference.name}</strong>
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
