"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, Plus, X, User, Briefcase, Euro, FileText, ChevronDown, ChevronRight } from "lucide-react"
import {
  MAIN_ACTIVITIES,
  WORK_INCOME_TYPES,
  SOCIAL_AID_TYPES,
  DURATION_OPTIONS,
  RETIREMENT_PENSION_TYPES,
  RENT_INCOME_TYPES,
  TAX_SITUATIONS,
} from "@/lib/rental-file-service"
import { toast } from "sonner"

interface PersonProfileFormProps {
  profile: any
  onUpdate: (profile: any) => void
  onRemove?: () => void
  title: string
  canRemove?: boolean
}

export function PersonProfileForm({ profile, onUpdate, onRemove, title, canRemove = false }: PersonProfileFormProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(["personal"])
  const [uploadingItem, setUploadingItem] = useState<string | null>(null)

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]))
  }

  const handleFileUpload = async (category: string, files: FileList | null) => {
    if (!files) return

    setUploadingItem(category)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const fileUrls = Array.from(files).map((file) => URL.createObjectURL(file))

      const updatedProfile = { ...profile }

      if (category === "identity") {
        updatedProfile.identity_documents = [...(updatedProfile.identity_documents || []), ...fileUrls]
      } else if (category === "domicile") {
        updatedProfile.domicile_documents = [...(updatedProfile.domicile_documents || []), ...fileUrls]
      } else if (category === "tax") {
        updatedProfile.tax_situation = {
          ...updatedProfile.tax_situation,
          documents: [...(updatedProfile.tax_situation?.documents || []), ...fileUrls],
        }
      } else {
        // Documents de revenus
        const [source, type] = category.split("_")
        if (!updatedProfile.income_sources) updatedProfile.income_sources = {}
        if (!updatedProfile.income_sources[source]) updatedProfile.income_sources[source] = {}

        if (Array.isArray(updatedProfile.income_sources[source])) {
          // Pour les tableaux (social_aid, retirement_pension, rent_income)
          const index = Number.parseInt(type)
          if (updatedProfile.income_sources[source][index]) {
            updatedProfile.income_sources[source][index].documents = [
              ...(updatedProfile.income_sources[source][index].documents || []),
              ...fileUrls,
            ]
          }
        } else {
          // Pour les objets simples (work_income, scholarship)
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
      // Pour les tableaux
      if (!updatedProfile.income_sources[sourceType]) updatedProfile.income_sources[sourceType] = []
      if (!updatedProfile.income_sources[sourceType][index]) {
        updatedProfile.income_sources[sourceType][index] = { documents: [] }
      }
      updatedProfile.income_sources[sourceType][index][field] = value
    } else {
      // Pour les objets simples
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
  }: { category: string; label: string; multiple?: boolean }) => {
    const isUploading = uploadingItem === category

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{label}</Label>
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
                <p className="text-sm text-gray-600">Ajouter {multiple ? "les documents" : "le document"}</p>
                <p className="text-xs text-gray-500">PDF, JPG, PNG (max 10MB)</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            {title}
          </span>
          {canRemove && (
            <Button onClick={onRemove} size="sm" variant="outline">
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Section Informations personnelles */}
        <div>
          <Button
            variant="ghost"
            onClick={() => toggleSection("personal")}
            className="w-full justify-between p-0 h-auto"
          >
            <span className="flex items-center font-medium">
              <User className="h-4 w-4 mr-2" />
              Informations personnelles
            </span>
            {expandedSections.includes("personal") ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>

          {expandedSections.includes("personal") && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">Prénom *</Label>
                  <Input
                    id="first_name"
                    value={profile.first_name || ""}
                    onChange={(e) => onUpdate({ ...profile, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Nom *</Label>
                  <Input
                    id="last_name"
                    value={profile.last_name || ""}
                    onChange={(e) => onUpdate({ ...profile, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="birth_date">Date de naissance *</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={profile.birth_date || ""}
                    onChange={(e) => onUpdate({ ...profile, birth_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="birth_place">Lieu de naissance *</Label>
                  <Input
                    id="birth_place"
                    placeholder="Ville, Pays"
                    value={profile.birth_place || ""}
                    onChange={(e) => onUpdate({ ...profile, birth_place: e.target.value })}
                  />
                </div>
              </div>

              <FileUploadZone category="identity" label="Pièce d'identité *" multiple />

              {profile.type === "main_tenant" && (
                <FileUploadZone category="domicile" label="Justificatif de domicile" multiple />
              )}
            </div>
          )}
        </div>

        {/* Section Activité principale */}
        <div>
          <Button
            variant="ghost"
            onClick={() => toggleSection("activity")}
            className="w-full justify-between p-0 h-auto"
          >
            <span className="flex items-center font-medium">
              <Briefcase className="h-4 w-4 mr-2" />
              Activité principale
            </span>
            {expandedSections.includes("activity") ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>

          {expandedSections.includes("activity") && (
            <div className="mt-4">
              <RadioGroup
                value={profile.main_activity || "cdi"}
                onValueChange={(value) => onUpdate({ ...profile, main_activity: value })}
              >
                {MAIN_ACTIVITIES.map((activity) => (
                  <div key={activity.value} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={activity.value} id={activity.value} />
                      <Label htmlFor={activity.value} className="font-medium">
                        {activity.label}
                      </Label>
                    </div>
                    <p className="text-sm text-gray-600 ml-6">{activity.description}</p>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}
        </div>

        {/* Section Revenus */}
        <div>
          <Button variant="ghost" onClick={() => toggleSection("income")} className="w-full justify-between p-0 h-auto">
            <span className="flex items-center font-medium">
              <Euro className="h-4 w-4 mr-2" />
              Vos revenus
            </span>
            {expandedSections.includes("income") ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>

          {expandedSections.includes("income") && (
            <div className="mt-4 space-y-6">
              {/* Revenus du travail */}
              <div className="space-y-4">
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

                {profile.income_sources?.work_income && (
                  <div className="ml-6 space-y-4 border-l-2 border-gray-200 pl-4">
                    <div>
                      <Label>Type de travail</Label>
                      <RadioGroup
                        value={profile.income_sources.work_income.type || "salarie"}
                        onValueChange={(value) => updateIncomeSource("work_income", null, "type", value)}
                        className="mt-2"
                      >
                        {WORK_INCOME_TYPES.map((type) => (
                          <div key={type.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={type.value} id={type.value} />
                            <Label htmlFor={type.value}>{type.label}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <div>
                      <Label htmlFor="work_amount">Montant mensuel net (€)</Label>
                      <Input
                        id="work_amount"
                        type="number"
                        placeholder="2500"
                        value={profile.income_sources.work_income.amount || ""}
                        onChange={(e) =>
                          updateIncomeSource("work_income", null, "amount", Number.parseFloat(e.target.value))
                        }
                      />
                    </div>

                    <FileUploadZone category="work_income" label="Justificatifs de revenus" multiple />
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
                      <Button onClick={() => removeIncomeSource("social_aid", index)} size="sm" variant="outline">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div>
                      <Label>Type d'aide</Label>
                      <RadioGroup
                        value={aid.type || "caf_msa"}
                        onValueChange={(value) => updateIncomeSource("social_aid", index, "type", value)}
                        className="mt-2"
                      >
                        {SOCIAL_AID_TYPES.map((type) => (
                          <div key={type.value} className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value={type.value} id={`${type.value}_${index}`} />
                              <Label htmlFor={`${type.value}_${index}`} className="font-medium">
                                {type.label}
                              </Label>
                            </div>
                            <p className="text-sm text-gray-600 ml-6">{type.description}</p>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <div>
                      <Label>Depuis quand ?</Label>
                      <RadioGroup
                        value={aid.duration || "plus_3_mois"}
                        onValueChange={(value) => updateIncomeSource("social_aid", index, "duration", value)}
                        className="mt-2"
                      >
                        {DURATION_OPTIONS.map((option) => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={option.value} id={`${option.value}_${index}`} />
                            <Label htmlFor={`${option.value}_${index}`}>{option.label}</Label>
                          </div>
                        ))}
                      </RadioGroup>
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

                    <FileUploadZone category={`social_aid_${index}`} label="Justificatifs" multiple />
                  </div>
                ))}
              </div>

              {/* Retraite ou pension */}
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
                      <h4 className="font-medium">Pension {index + 1}</h4>
                      <Button
                        onClick={() => removeIncomeSource("retirement_pension", index)}
                        size="sm"
                        variant="outline"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div>
                      <Label>Type de pension</Label>
                      <RadioGroup
                        value={pension.type || "retraite"}
                        onValueChange={(value) => updateIncomeSource("retirement_pension", index, "type", value)}
                        className="mt-2"
                      >
                        {RETIREMENT_PENSION_TYPES.map((type) => (
                          <div key={type.value} className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value={type.value} id={`${type.value}_${index}`} />
                              <Label htmlFor={`${type.value}_${index}`} className="font-medium">
                                {type.label}
                              </Label>
                            </div>
                            <p className="text-sm text-gray-600 ml-6">{type.description}</p>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    {pension.type === "retraite" && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`has_bulletin_${index}`}
                            checked={pension.has_bulletin || false}
                            onCheckedChange={(checked) =>
                              updateIncomeSource("retirement_pension", index, "has_bulletin", checked)
                            }
                          />
                          <Label htmlFor={`has_bulletin_${index}`}>Vous avez un bulletin de pension</Label>
                        </div>
                      </div>
                    )}

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

                    <FileUploadZone category={`retirement_pension_${index}`} label="Justificatifs" multiple />
                  </div>
                ))}
              </div>

              {/* Rente */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">Rente</Label>
                  <Button onClick={() => addIncomeSource("rent_income")} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>

                {profile.income_sources?.rent_income?.map((rent: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Rente {index + 1}</h4>
                      <Button onClick={() => removeIncomeSource("rent_income", index)} size="sm" variant="outline">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div>
                      <Label>Type de rente</Label>
                      <RadioGroup
                        value={rent.type || "revenus_locatifs"}
                        onValueChange={(value) => updateIncomeSource("rent_income", index, "type", value)}
                        className="mt-2"
                      >
                        {RENT_INCOME_TYPES.map((type) => (
                          <div key={type.value} className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value={type.value} id={`${type.value}_${index}`} />
                              <Label htmlFor={`${type.value}_${index}`} className="font-medium">
                                {type.label}
                              </Label>
                            </div>
                            <p className="text-sm text-gray-600 ml-6">{type.description}</p>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    {rent.type === "revenus_locatifs" && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`has_receipt_${index}`}
                            checked={rent.has_receipt || false}
                            onCheckedChange={(checked) =>
                              updateIncomeSource("rent_income", index, "has_receipt", checked)
                            }
                          />
                          <Label htmlFor={`has_receipt_${index}`}>Vous avez une quittance</Label>
                        </div>
                      </div>
                    )}

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

                    <FileUploadZone category={`rent_income_${index}`} label="Justificatifs" multiple />
                  </div>
                ))}
              </div>

              {/* Bourse */}
              <div className="space-y-4">
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

                {profile.income_sources?.scholarship && (
                  <div className="ml-6 space-y-4 border-l-2 border-gray-200 pl-4">
                    <div>
                      <Label htmlFor="scholarship_amount">Montant mensuel (€)</Label>
                      <Input
                        id="scholarship_amount"
                        type="number"
                        placeholder="300"
                        value={profile.income_sources.scholarship.amount || ""}
                        onChange={(e) =>
                          updateIncomeSource("scholarship", null, "amount", Number.parseFloat(e.target.value))
                        }
                      />
                    </div>

                    <FileUploadZone category="scholarship" label="Justificatifs de bourse" multiple />
                  </div>
                )}
              </div>

              {/* Pas de revenus */}
              <div className="space-y-4">
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

                {profile.income_sources?.no_income && (
                  <div className="ml-6 space-y-4 border-l-2 border-gray-200 pl-4">
                    <div>
                      <Label htmlFor="no_income_explanation">Explication</Label>
                      <Textarea
                        id="no_income_explanation"
                        placeholder="Expliquez votre situation..."
                        value={profile.income_sources.no_income.explanation || ""}
                        onChange={(e) => updateIncomeSource("no_income", null, "explanation", e.target.value)}
                        rows={3}
                      />
                    </div>

                    <FileUploadZone category="no_income" label="Justificatifs (optionnel)" multiple />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Section Avis d'imposition */}
        <div>
          <Button variant="ghost" onClick={() => toggleSection("tax")} className="w-full justify-between p-0 h-auto">
            <span className="flex items-center font-medium">
              <FileText className="h-4 w-4 mr-2" />
              Avis d'imposition
            </span>
            {expandedSections.includes("tax") ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>

          {expandedSections.includes("tax") && (
            <div className="mt-4 space-y-4">
              <RadioGroup
                value={profile.tax_situation?.type || "own_notice"}
                onValueChange={(value) =>
                  onUpdate({
                    ...profile,
                    tax_situation: { ...profile.tax_situation, type: value },
                  })
                }
              >
                {TAX_SITUATIONS.map((situation) => (
                  <div key={situation.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={situation.value} id={situation.value} />
                    <Label htmlFor={situation.value}>{situation.label}</Label>
                  </div>
                ))}
              </RadioGroup>

              {profile.tax_situation?.type === "other" && (
                <div>
                  <Label htmlFor="tax_explanation">Explication</Label>
                  <Textarea
                    id="tax_explanation"
                    placeholder="Merci d'expliquer ici la raison pour laquelle vous ne pouvez pas fournir d'avis d'imposition..."
                    value={profile.tax_situation?.explanation || ""}
                    onChange={(e) =>
                      onUpdate({
                        ...profile,
                        tax_situation: { ...profile.tax_situation, explanation: e.target.value },
                      })
                    }
                    rows={3}
                  />
                </div>
              )}

              <FileUploadZone category="tax" label="Avis d'imposition" multiple />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
