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
import { toast } from "sonner"
import { authService } from "@/lib/auth-service"
import { PageHeader } from "@/components/page-header"
import { Save, RefreshCw, Star, CheckCircle, FileCheck, Shield, Euro, Briefcase, AlertCircle } from "lucide-react"

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
      completeFile: true,
      verifiedDocs: true,
    },
    good: {
      income: 2800,
      contract: "CDD",
      guarantor: true,
      guarantorIncome: 3000,
      completeFile: true,
      verifiedDocs: false,
    },
    acceptable: {
      income: 2200,
      contract: "freelance",
      guarantor: false,
      guarantorIncome: 0,
      completeFile: false,
      verifiedDocs: false,
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
            file_completeness: {
              required: sampleProfiles.acceptable.completeFile,
              bonus_points: 50,
            },
            verified_documents: {
              required: sampleProfiles.excellent.verifiedDocs,
              bonus_points: 50,
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

  const getModelDescription = (criteria: any) => {
    if (!criteria) return "Modèle non configuré"

    const descriptions = []

    // Revenus
    if (criteria.income_ratio?.thresholds?.minimum) {
      descriptions.push(`Revenus minimum: ${criteria.income_ratio.thresholds.minimum}x le loyer`)
    }

    // Contrats acceptés
    const contracts = criteria.professional_stability?.contract_types
    if (contracts) {
      const acceptedContracts = Object.entries(contracts)
        .filter(([_, score]: [string, any]) => score >= 50)
        .map(([type, _]) => type.toUpperCase())
      if (acceptedContracts.length > 0) {
        descriptions.push(`Contrats: ${acceptedContracts.join(", ")}`)
      }
    }

    // Garants
    if (criteria.guarantor?.presence_points >= 80) {
      descriptions.push("Garant fortement valorisé")
    } else if (criteria.guarantor?.presence_points >= 50) {
      descriptions.push("Garant valorisé")
    }

    // Documents
    if (criteria.application_quality?.verified_documents?.required) {
      descriptions.push("Documents vérifiés requis")
    }
    if (criteria.application_quality?.file_completeness?.required) {
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
            <CardContent className="space-y-8">
              {/* Loyer de référence */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <Label className="text-base font-medium">Loyer de référence</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Définissez le loyer mensuel pour calculer les ratios de revenus
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={sampleProperty.price}
                    onChange={(e) =>
                      setSampleProperty({ ...sampleProperty, price: Number.parseInt(e.target.value) || 0 })
                    }
                    className="w-32"
                  />
                  <span className="font-medium">€/mois</span>
                </div>
              </div>

              {/* Profil excellent */}
              <div className="border-l-4 border-green-500 pl-6 bg-green-50 p-4 rounded-r-lg">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <h3 className="font-semibold text-lg text-green-800">Profil excellent</h3>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Candidat idéal
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <Label className="flex items-center gap-2">
                        <Euro className="h-4 w-4" />
                        Revenus mensuels nets
                      </Label>
                      <div className="flex items-center gap-2 mt-1">
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
                        <Badge variant="outline" className="text-xs">
                          {(sampleProfiles.excellent.income / sampleProperty.price).toFixed(1)}x le loyer
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <Label className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Type de contrat
                      </Label>
                      <select
                        className="w-full border rounded-md p-2 mt-1"
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
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Garant
                        </Label>
                        <Switch
                          checked={sampleProfiles.excellent.guarantor}
                          onCheckedChange={(checked) =>
                            setSampleProfiles({
                              ...sampleProfiles,
                              excellent: {
                                ...sampleProfiles.excellent,
                                guarantor: checked,
                              },
                            })
                          }
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

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <FileCheck className="h-4 w-4" />
                          Dossier complet
                        </Label>
                        <Switch
                          checked={sampleProfiles.excellent.completeFile}
                          onCheckedChange={(checked) =>
                            setSampleProfiles({
                              ...sampleProfiles,
                              excellent: {
                                ...sampleProfiles.excellent,
                                completeFile: checked,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-muted-foreground">Documents vérifiés (DossierFacile)</Label>
                        <Switch
                          checked={sampleProfiles.excellent.verifiedDocs}
                          onCheckedChange={(checked) =>
                            setSampleProfiles({
                              ...sampleProfiles,
                              excellent: {
                                ...sampleProfiles.excellent,
                                verifiedDocs: checked,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profil bon */}
              <div className="border-l-4 border-blue-500 pl-6 bg-blue-50 p-4 rounded-r-lg">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <h3 className="font-semibold text-lg text-blue-800">Profil bon</h3>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Candidat solide
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <Label className="flex items-center gap-2">
                        <Euro className="h-4 w-4" />
                        Revenus mensuels nets
                      </Label>
                      <div className="flex items-center gap-2 mt-1">
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
                        <Badge variant="outline" className="text-xs">
                          {(sampleProfiles.good.income / sampleProperty.price).toFixed(1)}x le loyer
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <Label className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Type de contrat
                      </Label>
                      <select
                        className="w-full border rounded-md p-2 mt-1"
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
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Garant
                        </Label>
                        <Switch
                          checked={sampleProfiles.good.guarantor}
                          onCheckedChange={(checked) =>
                            setSampleProfiles({
                              ...sampleProfiles,
                              good: {
                                ...sampleProfiles.good,
                                guarantor: checked,
                              },
                            })
                          }
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

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <FileCheck className="h-4 w-4" />
                          Dossier complet
                        </Label>
                        <Switch
                          checked={sampleProfiles.good.completeFile}
                          onCheckedChange={(checked) =>
                            setSampleProfiles({
                              ...sampleProfiles,
                              good: {
                                ...sampleProfiles.good,
                                completeFile: checked,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-muted-foreground">Documents vérifiés (DossierFacile)</Label>
                        <Switch
                          checked={sampleProfiles.good.verifiedDocs}
                          onCheckedChange={(checked) =>
                            setSampleProfiles({
                              ...sampleProfiles,
                              good: {
                                ...sampleProfiles.good,
                                verifiedDocs: checked,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profil acceptable */}
              <div className="border-l-4 border-amber-500 pl-6 bg-amber-50 p-4 rounded-r-lg">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <h3 className="font-semibold text-lg text-amber-800">Profil acceptable</h3>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                    Candidat minimum
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <Label className="flex items-center gap-2">
                        <Euro className="h-4 w-4" />
                        Revenus mensuels nets
                      </Label>
                      <div className="flex items-center gap-2 mt-1">
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
                        <Badge variant="outline" className="text-xs">
                          {(sampleProfiles.acceptable.income / sampleProperty.price).toFixed(1)}x le loyer
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <Label className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Type de contrat
                      </Label>
                      <select
                        className="w-full border rounded-md p-2 mt-1"
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
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Garant
                        </Label>
                        <Switch
                          checked={sampleProfiles.acceptable.guarantor}
                          onCheckedChange={(checked) =>
                            setSampleProfiles({
                              ...sampleProfiles,
                              acceptable: {
                                ...sampleProfiles.acceptable,
                                guarantor: checked,
                              },
                            })
                          }
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

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <FileCheck className="h-4 w-4" />
                          Dossier complet
                        </Label>
                        <Switch
                          checked={sampleProfiles.acceptable.completeFile}
                          onCheckedChange={(checked) =>
                            setSampleProfiles({
                              ...sampleProfiles,
                              acceptable: {
                                ...sampleProfiles.acceptable,
                                completeFile: checked,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-muted-foreground">Documents vérifiés (DossierFacile)</Label>
                        <Switch
                          checked={sampleProfiles.acceptable.verifiedDocs}
                          onCheckedChange={(checked) =>
                            setSampleProfiles({
                              ...sampleProfiles,
                              acceptable: {
                                ...sampleProfiles.acceptable,
                                verifiedDocs: checked,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Comment ça fonctionne ?</h4>
                    <p className="text-sm text-blue-800">
                      Ces profils définissent vos critères d'acceptation. Le système calculera automatiquement un score
                      pour chaque candidature en fonction de ces exemples. Plus un candidat se rapproche du profil
                      "excellent", plus son score sera élevé.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveFromAssistant} disabled={saving} size="lg">
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
                <div className="grid grid-cols-1 gap-4">
                  {systemPreferences.map((pref) => (
                    <Card
                      key={pref.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedSystemPreference === pref.id ? "border-2 border-blue-500 bg-blue-50" : ""
                      }`}
                      onClick={() => handleUseSystemPreference(pref.id)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">{pref.name}</h3>
                              {selectedSystemPreference === pref.id ? (
                                <CheckCircle className="h-5 w-5 text-blue-500" />
                              ) : pref.is_default ? (
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                              ) : null}
                            </div>
                            <p className="text-muted-foreground mb-3">{pref.description || "Modèle prédéfini"}</p>

                            {/* Description détaillée des critères */}
                            <div className="text-sm text-gray-600">{getModelDescription(pref.criteria)}</div>
                          </div>
                        </div>

                        {/* Répartition des critères */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Euro className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium">Revenus</span>
                            </div>
                            <div className="text-lg font-bold text-green-600">
                              {pref.criteria?.income_ratio?.weight || 0}%
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Briefcase className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium">Stabilité</span>
                            </div>
                            <div className="text-lg font-bold text-blue-600">
                              {pref.criteria?.professional_stability?.weight || 0}%
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Shield className="h-4 w-4 text-purple-600" />
                              <span className="text-sm font-medium">Garants</span>
                            </div>
                            <div className="text-lg font-bold text-purple-600">
                              {pref.criteria?.guarantor?.weight || 0}%
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <FileCheck className="h-4 w-4 text-orange-600" />
                              <span className="text-sm font-medium">Dossier</span>
                            </div>
                            <div className="text-lg font-bold text-orange-600">
                              {pref.criteria?.application_quality?.weight || 0}%
                            </div>
                          </div>
                        </div>

                        {selectedSystemPreference === pref.id && (
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

              {currentUserPreference && !currentUserPreference.system_preference_id && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-blue-600" />
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
