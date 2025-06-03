"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  X,
  Euro,
  CheckCircle,
  Briefcase,
  Heart,
  PiggyBank,
  GraduationCap,
  AlertCircle,
  Building2,
} from "lucide-react"
import {
  WORK_INCOME_TYPES,
  SOCIAL_AID_TYPES,
  DURATION_OPTIONS,
  RETIREMENT_PENSION_TYPES,
  RENT_INCOME_TYPES,
} from "@/lib/rental-file-service"
import { toast } from "sonner"
import { SupabaseFileUpload } from "@/components/supabase-file-upload"

interface ImprovedIncomeSourceProps {
  profile: any
  onUpdate: (profile: any) => void
}

interface IncomeTypeCardProps {
  icon: any
  title: string
  description: string
  isActive: boolean
  onToggle: () => void
  documentCount: number
}

function IncomeTypeCard({ icon: Icon, title, description, isActive, onToggle, documentCount }: IncomeTypeCardProps) {
  return (
    <Card
      className={`cursor-pointer hover:opacity-80 transition-opacity ${isActive ? "border-2 border-blue-500" : ""}`}
      onClick={onToggle}
    >
      <CardContent className="flex items-center space-x-4">
        <Icon className="h-6 w-6 text-gray-500" />
        <div>
          <h4 className="font-medium">{title}</h4>
          <p className="text-sm text-gray-500">{description}</p>
          {documentCount > 0 && (
            <Badge variant="outline" className="mt-2 bg-green-50">
              <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
              {documentCount}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function ImprovedIncomeSection({ profile, onUpdate }: ImprovedIncomeSourceProps) {
  const handleFileUpload = async (category: string, urls: string[]) => {
    const updatedProfile = { ...profile }
    if (!updatedProfile.income_sources) updatedProfile.income_sources = {}

    // Gestion spécifique pour les revenus du travail
    if (category === "income_work_income") {
      if (!updatedProfile.income_sources.work_income) {
        updatedProfile.income_sources.work_income = { documents: [] }
      }
      updatedProfile.income_sources.work_income.documents = [
        ...(updatedProfile.income_sources.work_income.documents || []),
        ...urls,
      ]
    }
    // Gestion pour les aides sociales
    else if (category.startsWith("income_social_aid_")) {
      const index = Number.parseInt(category.split("_")[3])
      if (!updatedProfile.income_sources.social_aid) updatedProfile.income_sources.social_aid = []
      if (!updatedProfile.income_sources.social_aid[index]) {
        updatedProfile.income_sources.social_aid[index] = { documents: [] }
      }
      updatedProfile.income_sources.social_aid[index].documents = [
        ...(updatedProfile.income_sources.social_aid[index].documents || []),
        ...urls,
      ]
    }
    // Gestion pour les retraites/pensions
    else if (category.startsWith("income_retirement_pension_")) {
      const index = Number.parseInt(category.split("_")[3])
      if (!updatedProfile.income_sources.retirement_pension) updatedProfile.income_sources.retirement_pension = []
      if (!updatedProfile.income_sources.retirement_pension[index]) {
        updatedProfile.income_sources.retirement_pension[index] = { documents: [] }
      }
      updatedProfile.income_sources.retirement_pension[index].documents = [
        ...(updatedProfile.income_sources.retirement_pension[index].documents || []),
        ...urls,
      ]
    }
    // Gestion pour les rentes
    else if (category.startsWith("income_rent_income_")) {
      const index = Number.parseInt(category.split("_")[3])
      if (!updatedProfile.income_sources.rent_income) updatedProfile.income_sources.rent_income = []
      if (!updatedProfile.income_sources.rent_income[index]) {
        updatedProfile.income_sources.rent_income[index] = { documents: [] }
      }
      updatedProfile.income_sources.rent_income[index].documents = [
        ...(updatedProfile.income_sources.rent_income[index].documents || []),
        ...urls,
      ]
    }
    // Gestion pour les bourses
    else if (category === "income_scholarship") {
      if (!updatedProfile.income_sources.scholarship) {
        updatedProfile.income_sources.scholarship = { documents: [] }
      }
      updatedProfile.income_sources.scholarship.documents = [
        ...(updatedProfile.income_sources.scholarship.documents || []),
        ...urls,
      ]
    }
    // Gestion pour pas de revenus
    else if (category === "income_no_income") {
      if (!updatedProfile.income_sources.no_income) {
        updatedProfile.income_sources.no_income = { documents: [] }
      }
      updatedProfile.income_sources.no_income.documents = [
        ...(updatedProfile.income_sources.no_income.documents || []),
        ...urls,
      ]
    }

    onUpdate(updatedProfile)
    toast.success(`${urls.length} document(s) ajouté(s) avec succès`)
  }

  const addIncomeSource = (sourceType: string) => {
    const updatedProfile = { ...profile }
    if (!updatedProfile.income_sources) updatedProfile.income_sources = {}

    switch (sourceType) {
      case "social_aid":
        if (!updatedProfile.income_sources.social_aid) updatedProfile.income_sources.social_aid = []
        updatedProfile.income_sources.social_aid.push({
          type: "caf_msa",
          duration: "plus_3_mois",
          amount: 0,
          documents: [],
        })
        break
      case "retirement_pension":
        if (!updatedProfile.income_sources.retirement_pension) updatedProfile.income_sources.retirement_pension = []
        updatedProfile.income_sources.retirement_pension.push({
          type: "retraite",
          amount: 0,
          documents: [],
        })
        break
      case "rent_income":
        if (!updatedProfile.income_sources.rent_income) updatedProfile.income_sources.rent_income = []
        updatedProfile.income_sources.rent_income.push({
          type: "revenus_locatifs",
          amount: 0,
          documents: [],
        })
        break
    }

    onUpdate(updatedProfile)
  }

  const removeIncomeSource = (sourceType: string, index: number) => {
    const updatedProfile = { ...profile }
    if (updatedProfile.income_sources?.[sourceType]) {
      updatedProfile.income_sources[sourceType].splice(index, 1)
      onUpdate(updatedProfile)
    }
  }

  const updateIncomeSource = (sourceType: string, index: number | null, field: string, value: any) => {
    const updatedProfile = { ...profile }
    if (!updatedProfile.income_sources) updatedProfile.income_sources = {}

    if (index !== null) {
      if (!updatedProfile.income_sources[sourceType]) updatedProfile.income_sources[sourceType] = []
      if (!updatedProfile.income_sources[sourceType][index]) {
        updatedProfile.income_sources[sourceType][index] = { documents: [] }
      }
      updatedProfile.income_sources[sourceType][index][field] = value
    } else {
      if (!updatedProfile.income_sources[sourceType]) {
        updatedProfile.income_sources[sourceType] = { documents: [] }
      }
      updatedProfile.income_sources[sourceType][field] = value
    }

    onUpdate(updatedProfile)
  }

  const toggleIncomeType = (incomeType: string) => {
    const updatedProfile = { ...profile }
    if (!updatedProfile.income_sources) updatedProfile.income_sources = {}

    if (updatedProfile.income_sources[incomeType]) {
      delete updatedProfile.income_sources[incomeType]
    } else {
      switch (incomeType) {
        case "work_income":
          updatedProfile.income_sources.work_income = {
            type: "salarie",
            amount: 0,
            documents: [],
          }
          break
        case "scholarship":
          updatedProfile.income_sources.scholarship = {
            amount: 0,
            documents: [],
          }
          break
        case "no_income":
          updatedProfile.income_sources.no_income = {
            explanation: "",
            documents: [],
          }
          break
      }
    }

    onUpdate(updatedProfile)
  }

  const hasAnyIncome = profile.income_sources && Object.keys(profile.income_sources).length > 0

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Euro className="h-5 w-5 text-blue-600" />
            <span>Justificatifs de ressources</span>
            {hasAnyIncome && <Badge variant="outline">Configuré</Badge>}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Types de revenus principaux */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Sélectionnez vos sources de revenus</h3>

          <div className="grid gap-4">
            {/* Revenus du travail */}
            <IncomeTypeCard
              icon={Briefcase}
              title="Revenus du travail"
              description="Salaire, freelance, auto-entrepreneur..."
              isActive={!!profile.income_sources?.work_income}
              onToggle={() => toggleIncomeType("work_income")}
              documentCount={profile.income_sources?.work_income?.documents?.length || 0}
            />

            {/* Bourse */}
            <IncomeTypeCard
              icon={GraduationCap}
              title="Bourse d'études"
              description="Bourse CROUS, aide aux étudiants..."
              isActive={!!profile.income_sources?.scholarship}
              onToggle={() => toggleIncomeType("scholarship")}
              documentCount={profile.income_sources?.scholarship?.documents?.length || 0}
            />

            {/* Pas de revenus */}
            <IncomeTypeCard
              icon={AlertCircle}
              title="Aucun revenu"
              description="Situation temporaire, recherche d'emploi..."
              isActive={!!profile.income_sources?.no_income}
              onToggle={() => toggleIncomeType("no_income")}
              documentCount={profile.income_sources?.no_income?.documents?.length || 0}
            />
          </div>
        </div>

        {/* Détails des revenus du travail */}
        {profile.income_sources?.work_income && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Briefcase className="h-5 w-5 text-blue-600" />
                <span>Revenus du travail</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Type de travail</Label>
                <Select
                  value={profile.income_sources.work_income.type || "salarie"}
                  onValueChange={(value) => updateIncomeSource("work_income", null, "type", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_INCOME_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="work_amount">Montant mensuel net (€) *</Label>
                <Input
                  id="work_amount"
                  type="number"
                  placeholder="2500"
                  value={profile.income_sources.work_income.amount || ""}
                  onChange={(e) => updateIncomeSource("work_income", null, "amount", Number.parseFloat(e.target.value))}
                />
              </div>

              <SupabaseFileUpload
                category="income_work_income"
                label="Justificatifs de revenus *"
                multiple
                existingFiles={profile.income_sources.work_income.documents || []}
                onChange={handleFileUpload}
              />
            </CardContent>
          </Card>
        )}

        {/* Détails de la bourse */}
        {profile.income_sources?.scholarship && (
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center space-x-2">
                <GraduationCap className="h-5 w-5 text-green-600" />
                <span>Bourse d'études</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="scholarship_amount">Montant mensuel (€)</Label>
                <Input
                  id="scholarship_amount"
                  type="number"
                  placeholder="300"
                  value={profile.income_sources.scholarship.amount || ""}
                  onChange={(e) => updateIncomeSource("scholarship", null, "amount", Number.parseFloat(e.target.value))}
                />
              </div>

              <SupabaseFileUpload
                category="income_scholarship"
                label="Justificatifs de bourse"
                multiple
                existingFiles={profile.income_sources.scholarship.documents || []}
                onChange={handleFileUpload}
              />
            </CardContent>
          </Card>
        )}

        {/* Détails pas de revenus */}
        {profile.income_sources?.no_income && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <span>Aucun revenu</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="no_income_explanation">Explication de votre situation</Label>
                <Textarea
                  id="no_income_explanation"
                  placeholder="Expliquez votre situation..."
                  value={profile.income_sources.no_income.explanation || ""}
                  onChange={(e) => updateIncomeSource("no_income", null, "explanation", e.target.value)}
                  rows={3}
                />
              </div>

              <SupabaseFileUpload
                category="income_no_income"
                label="Justificatifs (optionnel)"
                multiple
                existingFiles={profile.income_sources.no_income.documents || []}
                onChange={handleFileUpload}
              />
            </CardContent>
          </Card>
        )}

        {/* Sources de revenus supplémentaires */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Sources de revenus supplémentaires</h3>
            <p className="text-sm text-gray-600">Optionnel</p>
          </div>

          {/* Aide sociale */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Heart className="h-4 w-4 text-pink-600" />
                <Label className="font-medium">Aide sociale</Label>
              </div>
              <Button onClick={() => addIncomeSource("social_aid")} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>

            {profile.income_sources?.social_aid?.map((aid: any, index: number) => (
              <Card key={index} className="border-pink-200 bg-pink-50/50">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center space-x-2">
                      <Heart className="h-4 w-4 text-pink-600" />
                      <span>Aide sociale {index + 1}</span>
                    </h4>
                    <div className="flex items-center space-x-2">
                      {aid.documents?.length > 0 && (
                        <Badge variant="outline" className="bg-green-50">
                          <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                          {aid.documents.length}
                        </Badge>
                      )}
                      <Button onClick={() => removeIncomeSource("social_aid", index)} size="sm" variant="outline">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Type d'aide</Label>
                      <Select
                        value={aid.type || "caf_msa"}
                        onValueChange={(value) => updateIncomeSource("social_aid", index, "type", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SOCIAL_AID_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Depuis quand ?</Label>
                      <Select
                        value={aid.duration || "plus_3_mois"}
                        onValueChange={(value) => updateIncomeSource("social_aid", index, "duration", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DURATION_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`aid_amount_${index}`}>Montant mensuel (€)</Label>
                    <Input
                      id={`aid_amount_${index}`}
                      type="number"
                      placeholder="500"
                      value={aid.amount || ""}
                      onChange={(e) =>
                        updateIncomeSource("social_aid", index, "amount", Number.parseFloat(e.target.value))
                      }
                    />
                  </div>

                  <SupabaseFileUpload
                    category={`income_social_aid_${index}`}
                    label="Justificatifs"
                    multiple
                    existingFiles={aid.documents || []}
                    onChange={handleFileUpload}
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Retraite et pensions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <PiggyBank className="h-4 w-4 text-purple-600" />
                <Label className="font-medium">Retraite ou pension</Label>
              </div>
              <Button onClick={() => addIncomeSource("retirement_pension")} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>

            {profile.income_sources?.retirement_pension?.map((pension: any, index: number) => (
              <Card key={index} className="border-purple-200 bg-purple-50/50">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center space-x-2">
                      <PiggyBank className="h-4 w-4 text-purple-600" />
                      <span>Retraite/Pension {index + 1}</span>
                    </h4>
                    <div className="flex items-center space-x-2">
                      {pension.documents?.length > 0 && (
                        <Badge variant="outline" className="bg-green-50">
                          <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                          {pension.documents.length}
                        </Badge>
                      )}
                      <Button
                        onClick={() => removeIncomeSource("retirement_pension", index)}
                        size="sm"
                        variant="outline"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Type de pension</Label>
                      <Select
                        value={pension.type || "retraite"}
                        onValueChange={(value) => updateIncomeSource("retirement_pension", index, "type", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RETIREMENT_PENSION_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor={`pension_amount_${index}`}>Montant mensuel (€)</Label>
                      <Input
                        id={`pension_amount_${index}`}
                        type="number"
                        placeholder="1200"
                        value={pension.amount || ""}
                        onChange={(e) =>
                          updateIncomeSource("retirement_pension", index, "amount", Number.parseFloat(e.target.value))
                        }
                      />
                    </div>
                  </div>

                  <SupabaseFileUpload
                    category={`income_retirement_pension_${index}`}
                    label="Justificatifs"
                    multiple
                    existingFiles={pension.documents || []}
                    onChange={handleFileUpload}
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Rentes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-indigo-600" />
                <Label className="font-medium">Rentes et revenus locatifs</Label>
              </div>
              <Button onClick={() => addIncomeSource("rent_income")} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>

            {profile.income_sources?.rent_income?.map((rent: any, index: number) => (
              <Card key={index} className="border-indigo-200 bg-indigo-50/50">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-indigo-600" />
                      <span>Rente {index + 1}</span>
                    </h4>
                    <div className="flex items-center space-x-2">
                      {rent.documents?.length > 0 && (
                        <Badge variant="outline" className="bg-green-50">
                          <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                          {rent.documents.length}
                        </Badge>
                      )}
                      <Button onClick={() => removeIncomeSource("rent_income", index)} size="sm" variant="outline">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Type de rente</Label>
                      <Select
                        value={rent.type || "revenus_locatifs"}
                        onValueChange={(value) => updateIncomeSource("rent_income", index, "type", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RENT_INCOME_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor={`rent_amount_${index}`}>Montant mensuel (€)</Label>
                      <Input
                        id={`rent_amount_${index}`}
                        type="number"
                        placeholder="800"
                        value={rent.amount || ""}
                        onChange={(e) =>
                          updateIncomeSource("rent_income", index, "amount", Number.parseFloat(e.target.value))
                        }
                      />
                    </div>
                  </div>

                  <SupabaseFileUpload
                    category={`income_rent_income_${index}`}
                    label="Justificatifs"
                    multiple
                    existingFiles={rent.documents || []}
                    onChange={handleFileUpload}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
