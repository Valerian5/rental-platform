"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Upload,
  Plus,
  X,
  Euro,
  FileText,
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

interface ImprovedIncomeSourceProps {
  profile: any
  onUpdate: (profile: any) => void
}

export function ImprovedIncomeSection({ profile, onUpdate }: ImprovedIncomeSourceProps) {
  const [uploadingItem, setUploadingItem] = useState<string | null>(null)

  const handleFileUpload = async (category: string, files: FileList | null) => {
    if (!files) return

    setUploadingItem(category)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const fileUrls = Array.from(files).map((file) => URL.createObjectURL(file))

      const updatedProfile = { ...profile }
      if (!updatedProfile.income_sources) updatedProfile.income_sources = {}

      // Gestion spécifique pour les revenus du travail
      if (category === "income_work_income") {
        if (!updatedProfile.income_sources.work_income) {
          updatedProfile.income_sources.work_income = { documents: [] }
        }
        updatedProfile.income_sources.work_income.documents = [
          ...(updatedProfile.income_sources.work_income.documents || []),
          ...fileUrls,
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
          ...fileUrls,
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
          ...fileUrls,
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
          ...fileUrls,
        ]
      }
      // Gestion pour les bourses
      else if (category === "income_scholarship") {
        if (!updatedProfile.income_sources.scholarship) {
          updatedProfile.income_sources.scholarship = { documents: [] }
        }
        updatedProfile.income_sources.scholarship.documents = [
          ...(updatedProfile.income_sources.scholarship.documents || []),
          ...fileUrls,
        ]
      }
      // Gestion pour pas de revenus
      else if (category === "income_no_income") {
        if (!updatedProfile.income_sources.no_income) {
          updatedProfile.income_sources.no_income = { documents: [] }
        }
        updatedProfile.income_sources.no_income.documents = [
          ...(updatedProfile.income_sources.no_income.documents || []),
          ...fileUrls,
        ]
      }

      onUpdate(updatedProfile)
      toast.success("Document ajouté avec succès")
    } catch (error) {
      console.error("Erreur upload:", error)
      toast.error("Erreur lors de l'upload du fichier")
    } finally {
      setUploadingItem(null)
    }
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

  const FileUploadZone = ({
    category,
    label,
    multiple = false,
    existingFiles = [],
  }: {
    category: string
    label: string
    multiple?: boolean
    existingFiles?: string[]
  }) => {
    const isUploading = uploadingItem === category

    const removeFile = (fileIndex: number) => {
      const updatedProfile = { ...profile }

      if (category === "income_work_income") {
        if (updatedProfile.income_sources?.work_income?.documents) {
          updatedProfile.income_sources.work_income.documents =
            updatedProfile.income_sources.work_income.documents.filter((_: any, i: number) => i !== fileIndex)
        }
      } else if (category.startsWith("income_social_aid_")) {
        const index = Number.parseInt(category.split("_")[3])
        if (updatedProfile.income_sources?.social_aid?.[index]?.documents) {
          updatedProfile.income_sources.social_aid[index].documents = updatedProfile.income_sources.social_aid[
            index
          ].documents.filter((_: any, i: number) => i !== fileIndex)
        }
      } else if (category.startsWith("income_retirement_pension_")) {
        const index = Number.parseInt(category.split("_")[3])
        if (updatedProfile.income_sources?.retirement_pension?.[index]?.documents) {
          updatedProfile.income_sources.retirement_pension[index].documents =
            updatedProfile.income_sources.retirement_pension[index].documents.filter(
              (_: any, i: number) => i !== fileIndex,
            )
        }
      } else if (category.startsWith("income_rent_income_")) {
        const index = Number.parseInt(category.split("_")[3])
        if (updatedProfile.income_sources?.rent_income?.[index]?.documents) {
          updatedProfile.income_sources.rent_income[index].documents = updatedProfile.income_sources.rent_income[
            index
          ].documents.filter((_: any, i: number) => i !== fileIndex)
        }
      } else if (category === "income_scholarship") {
        if (updatedProfile.income_sources?.scholarship?.documents) {
          updatedProfile.income_sources.scholarship.documents =
            updatedProfile.income_sources.scholarship.documents.filter((_: any, i: number) => i !== fileIndex)
        }
      } else if (category === "income_no_income") {
        if (updatedProfile.income_sources?.no_income?.documents) {
          updatedProfile.income_sources.no_income.documents = updatedProfile.income_sources.no_income.documents.filter(
            (_: any, i: number) => i !== fileIndex,
          )
        }
      }

      onUpdate(updatedProfile)
    }

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{label}</Label>

        {/* Fichiers existants */}
        {existingFiles.length > 0 && (
          <div className="space-y-2">
            {existingFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    {file.includes("blob:")
                      ? `Document ${index + 1}`
                      : file.split("/").pop() || `Document ${index + 1}`}
                  </span>
                </div>
                <Button
                  onClick={() => removeFile(index)}
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Zone d'upload */}
        <div className="relative">
          <input
            type="file"
            multiple={multiple}
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => handleFileUpload(category, e.target.files)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          <div
            className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
              isUploading ? "border-blue-300 bg-blue-50" : "border-gray-300 hover:border-gray-400"
            }`}
          >
            {isUploading ? (
              <div className="space-y-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-blue-600">Upload en cours...</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-6 w-6 text-gray-400 mx-auto" />
                <p className="text-sm text-gray-600">Ajouter {multiple ? "des documents" : "un document"}</p>
                <p className="text-xs text-gray-500">PDF, JPG, PNG (max 10MB)</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const IncomeTypeCard = ({
    icon: Icon,
    title,
    description,
    isActive,
    onToggle,
    documentCount = 0,
  }: {
    icon: any
    title: string
    description: string
    isActive: boolean
    onToggle: () => void
    documentCount?: number
  }) => (
    <Card
      className={`cursor-pointer transition-all duration-200 ${
        isActive ? "border-blue-500 bg-blue-50 shadow-md" : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
      }`}
      onClick={onToggle}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isActive ? "bg-blue-100" : "bg-gray-100"}`}>
              <Icon className={`h-5 w-5 ${isActive ? "text-blue-600" : "text-gray-600"}`} />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{title}</h4>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {documentCount > 0 && (
              <Badge variant="outline" className="bg-green-50">
                <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                {documentCount}
              </Badge>
            )}
            <div
              className={`w-4 h-4 rounded-full border-2 ${
                isActive ? "bg-blue-500 border-blue-500" : "border-gray-300"
              }`}
            >
              {isActive && <CheckCircle className="h-3 w-3 text-white" />}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

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

              <FileUploadZone
                category="income_work_income"
                label="Justificatifs de revenus *"
                multiple
                existingFiles={profile.income_sources.work_income.documents || []}
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

              <FileUploadZone
                category="income_scholarship"
                label="Justificatifs de bourse"
                multiple
                existingFiles={profile.income_sources.scholarship.documents || []}
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

              <FileUploadZone
                category="income_no_income"
                label="Justificatifs (optionnel)"
                multiple
                existingFiles={profile.income_sources.no_income.documents || []}
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

                  <FileUploadZone
                    category={`income_social_aid_${index}`}
                    label="Justificatifs"
                    multiple
                    existingFiles={aid.documents || []}
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

                  <FileUploadZone
                    category={`income_retirement_pension_${index}`}
                    label="Justificatifs"
                    multiple
                    existingFiles={pension.documents || []}
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

                  <FileUploadZone
                    category={`income_rent_income_${index}`}
                    label="Justificatifs"
                    multiple
                    existingFiles={rent.documents || []}
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
