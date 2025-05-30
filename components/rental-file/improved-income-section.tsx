"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, Plus, X, Euro, FileText, CheckCircle } from "lucide-react"
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

      // Gestion des différents types de documents
      if (category.startsWith("income_")) {
        // Documents de revenus
        const [_, source, type] = category.split("_")
        if (!updatedProfile.income_sources) updatedProfile.income_sources = {}

        if (Array.isArray(updatedProfile.income_sources[source])) {
          const index = Number.parseInt(type)
          if (updatedProfile.income_sources[source][index]) {
            updatedProfile.income_sources[source][index].documents = [
              ...(updatedProfile.income_sources[source][index].documents || []),
              ...fileUrls,
            ]
          }
        } else {
          if (!updatedProfile.income_sources[source]) {
            updatedProfile.income_sources[source] = { documents: [] }
          }
          updatedProfile.income_sources[source].documents = [
            ...(updatedProfile.income_sources[source].documents || []),
            ...fileUrls,
          ]
        }
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
      const [_, source, typeStr] = category.split("_")

      if (Array.isArray(updatedProfile.income_sources[source])) {
        const index = Number.parseInt(typeStr)
        if (updatedProfile.income_sources[source][index]?.documents) {
          updatedProfile.income_sources[source][index].documents = updatedProfile.income_sources[source][
            index
          ].documents.filter((_: any, i: number) => i !== fileIndex)
        }
      } else if (updatedProfile.income_sources[source]?.documents) {
        updatedProfile.income_sources[source].documents = updatedProfile.income_sources[source].documents.filter(
          (_: any, i: number) => i !== fileIndex,
        )
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

  const hasAnyIncome = profile.income_sources && Object.keys(profile.income_sources).length > 0

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Euro className="h-5 w-5 text-blue-600" />
            <span>Justificatifs de ressources</span>
            {hasAnyIncome && <Badge variant="outline">Ajouté</Badge>}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Revenus du travail */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="work_income"
                checked={!!profile.income_sources?.work_income}
                onCheckedChange={(checked) => {
                  const updatedProfile = { ...profile }
                  if (!updatedProfile.income_sources) updatedProfile.income_sources = {}
                  if (checked) {
                    updatedProfile.income_sources.work_income = {
                      type: "salarie",
                      amount: 0,
                      documents: [],
                    }
                  } else {
                    delete updatedProfile.income_sources.work_income
                  }
                  onUpdate(updatedProfile)
                }}
              />
              <Label htmlFor="work_income" className="font-medium">
                Revenus du travail
              </Label>
            </div>
            {profile.income_sources?.work_income?.documents?.length > 0 && (
              <Badge variant="outline" className="bg-green-50">
                <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                {profile.income_sources.work_income.documents.length} document(s)
              </Badge>
            )}
          </div>

          {profile.income_sources?.work_income && (
            <div className="ml-6 space-y-4 border-l-2 border-blue-200 pl-4">
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
            </div>
          )}
        </div>

        {/* Aide sociale */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="font-medium">Aide sociale</Label>
            <Button onClick={() => addIncomeSource("social_aid")} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>

          {profile.income_sources?.social_aid?.map((aid: any, index: number) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Aide sociale {index + 1}</h4>
                <div className="flex items-center space-x-2">
                  {aid.documents?.length > 0 && (
                    <Badge variant="outline" className="bg-green-50">
                      <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                      {aid.documents.length} document(s)
                    </Badge>
                  )}
                  <Button onClick={() => removeIncomeSource("social_aid", index)} size="sm" variant="outline">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

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

              <div>
                <Label htmlFor={`aid_amount_${index}`}>Montant mensuel (€)</Label>
                <Input
                  id={`aid_amount_${index}`}
                  type="number"
                  placeholder="500"
                  value={aid.amount || ""}
                  onChange={(e) => updateIncomeSource("social_aid", index, "amount", Number.parseFloat(e.target.value))}
                />
              </div>

              <FileUploadZone
                category={`income_social_aid_${index}`}
                label="Justificatifs"
                multiple
                existingFiles={aid.documents || []}
              />
            </div>
          ))}
        </div>

        {/* Retraite et pensions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="font-medium">Retraite ou pension</Label>
            <Button onClick={() => addIncomeSource("retirement_pension")} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>

          {profile.income_sources?.retirement_pension?.map((pension: any, index: number) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Retraite/Pension {index + 1}</h4>
                <div className="flex items-center space-x-2">
                  {pension.documents?.length > 0 && (
                    <Badge variant="outline" className="bg-green-50">
                      <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                      {pension.documents.length} document(s)
                    </Badge>
                  )}
                  <Button onClick={() => removeIncomeSource("retirement_pension", index)} size="sm" variant="outline">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

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

              <FileUploadZone
                category={`income_retirement_pension_${index}`}
                label="Justificatifs"
                multiple
                existingFiles={pension.documents || []}
              />
            </div>
          ))}
        </div>

        {/* Rentes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="font-medium">Rentes</Label>
            <Button onClick={() => addIncomeSource("rent_income")} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>

          {profile.income_sources?.rent_income?.map((rent: any, index: number) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Rente {index + 1}</h4>
                <div className="flex items-center space-x-2">
                  {rent.documents?.length > 0 && (
                    <Badge variant="outline" className="bg-green-50">
                      <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                      {rent.documents.length} document(s)
                    </Badge>
                  )}
                  <Button onClick={() => removeIncomeSource("rent_income", index)} size="sm" variant="outline">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

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

              <FileUploadZone
                category={`income_rent_income_${index}`}
                label="Justificatifs"
                multiple
                existingFiles={rent.documents || []}
              />
            </div>
          ))}
        </div>

        {/* Bourse */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="scholarship"
                checked={!!profile.income_sources?.scholarship}
                onCheckedChange={(checked) => {
                  const updatedProfile = { ...profile }
                  if (!updatedProfile.income_sources) updatedProfile.income_sources = {}
                  if (checked) {
                    updatedProfile.income_sources.scholarship = {
                      amount: 0,
                      documents: [],
                    }
                  } else {
                    delete updatedProfile.income_sources.scholarship
                  }
                  onUpdate(updatedProfile)
                }}
              />
              <Label htmlFor="scholarship" className="font-medium">
                Bourse
              </Label>
            </div>
            {profile.income_sources?.scholarship?.documents?.length > 0 && (
              <Badge variant="outline" className="bg-green-50">
                <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                {profile.income_sources.scholarship.documents.length} document(s)
              </Badge>
            )}
          </div>

          {profile.income_sources?.scholarship && (
            <div className="ml-6 space-y-4 border-l-2 border-blue-200 pl-4">
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
            </div>
          )}
        </div>

        {/* Pas de revenus */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="no_income"
                checked={!!profile.income_sources?.no_income}
                onCheckedChange={(checked) => {
                  const updatedProfile = { ...profile }
                  if (!updatedProfile.income_sources) updatedProfile.income_sources = {}
                  if (checked) {
                    updatedProfile.income_sources.no_income = {
                      explanation: "",
                      documents: [],
                    }
                  } else {
                    delete updatedProfile.income_sources.no_income
                  }
                  onUpdate(updatedProfile)
                }}
              />
              <Label htmlFor="no_income" className="font-medium">
                Pas de revenus
              </Label>
            </div>
            {profile.income_sources?.no_income?.documents?.length > 0 && (
              <Badge variant="outline" className="bg-green-50">
                <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                {profile.income_sources.no_income.documents.length} document(s)
              </Badge>
            )}
          </div>

          {profile.income_sources?.no_income && (
            <div className="ml-6 space-y-4 border-l-2 border-blue-200 pl-4">
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
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
