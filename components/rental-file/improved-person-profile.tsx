"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Upload,
  Plus,
  X,
  User,
  Briefcase,
  Euro,
  FileText,
  ChevronRight,
  Home,
  CheckCircle,
  AlertTriangle,
} from "lucide-react"
import {
  MAIN_ACTIVITIES,
  WORK_INCOME_TYPES,
  SOCIAL_AID_TYPES,
  DURATION_OPTIONS,
  TAX_SITUATIONS,
  CURRENT_HOUSING_SITUATIONS,
  RETIREMENT_PENSION_TYPES,
  RENT_INCOME_TYPES,
} from "@/lib/rental-file-service"
import { toast } from "sonner"

interface ImprovedPersonProfileProps {
  profile: any
  onUpdate: (profile: any) => void
  onRemove?: () => void
  title: string
  canRemove?: boolean
}

export function ImprovedPersonProfile({
  profile,
  onUpdate,
  onRemove,
  title,
  canRemove = false,
}: ImprovedPersonProfileProps) {
  const [currentSubStep, setCurrentSubStep] = useState(1)
  const [uploadingItem, setUploadingItem] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const totalSubSteps = 5

  const validateCurrentStep = (): boolean => {
    const errors: string[] = []

    switch (currentSubStep) {
      case 1: // Identité
        if (!profile.first_name?.trim()) errors.push("Le prénom est requis")
        if (!profile.last_name?.trim()) errors.push("Le nom est requis")
        if (!profile.identity_documents?.length) errors.push("La pièce d'identité est requise")
        break
      case 2: // Logement actuel
        if (!profile.current_housing_situation) errors.push("La situation d'hébergement est requise")
        break
      case 3: // Activité
        if (!profile.main_activity) errors.push("L'activité principale est requise")
        if (!profile.activity_documents?.length) errors.push("Les documents d'activité sont requis")
        break
      case 4: // Revenus
        if (!profile.income_sources || Object.keys(profile.income_sources).length === 0) {
          errors.push("Au moins une source de revenus est requise")
        }
        break
      case 5: // Fiscalité
        if (!profile.tax_situation?.type) errors.push("La situation fiscale est requise")
        if (!profile.tax_situation?.documents?.length) errors.push("L'avis d'imposition est requis")
        break
    }

    setValidationErrors(errors)
    return errors.length === 0
  }

  const nextSubStep = () => {
    if (validateCurrentStep() && currentSubStep < totalSubSteps) {
      setCurrentSubStep(currentSubStep + 1)
      setValidationErrors([])
    }
  }

  const prevSubStep = () => {
    if (currentSubStep > 1) {
      setCurrentSubStep(currentSubStep - 1)
      setValidationErrors([])
    }
  }

  const calculateStepCompletion = (): number => {
    let completed = 0
    const total = 5

    // Identité
    if (profile.first_name && profile.last_name && profile.identity_documents?.length) completed++
    // Logement
    if (profile.current_housing_situation) completed++
    // Activité
    if (profile.main_activity && profile.activity_documents?.length) completed++
    // Revenus
    if (profile.income_sources && Object.keys(profile.income_sources).length > 0) completed++
    // Fiscalité
    if (profile.tax_situation?.type && profile.tax_situation?.documents?.length) completed++

    return Math.round((completed / total) * 100)
  }

  const handleFileUpload = async (category: string, files: FileList | null) => {
    if (!files) return

    setUploadingItem(category)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const fileUrls = Array.from(files).map((file) => URL.createObjectURL(file))

      const updatedProfile = { ...profile }

      // Gestion des différents types de documents
      if (category === "identity") {
        updatedProfile.identity_documents = [...(updatedProfile.identity_documents || []), ...fileUrls]
      } else if (category === "activity") {
        updatedProfile.activity_documents = [...(updatedProfile.activity_documents || []), ...fileUrls]
      } else if (category === "tax") {
        if (!updatedProfile.tax_situation) updatedProfile.tax_situation = { type: "own_notice", documents: [] }
        updatedProfile.tax_situation.documents = [...(updatedProfile.tax_situation.documents || []), ...fileUrls]
      } else if (category.startsWith("housing_")) {
        const docType = category.replace("housing_", "")
        if (!updatedProfile.current_housing_documents) updatedProfile.current_housing_documents = {}
        updatedProfile.current_housing_documents[docType] = [
          ...(updatedProfile.current_housing_documents[docType] || []),
          ...fileUrls,
        ]
      } else {
        // Documents de revenus
        const [source, type] = category.split("_")
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

      if (category === "identity") {
        updatedProfile.identity_documents =
          updatedProfile.identity_documents?.filter((_: any, i: number) => i !== fileIndex) || []
      } else if (category === "activity") {
        updatedProfile.activity_documents =
          updatedProfile.activity_documents?.filter((_: any, i: number) => i !== fileIndex) || []
      } else if (category === "tax") {
        if (updatedProfile.tax_situation?.documents) {
          updatedProfile.tax_situation.documents = updatedProfile.tax_situation.documents.filter(
            (_: any, i: number) => i !== fileIndex,
          )
        }
      } else if (category.startsWith("housing_")) {
        const docType = category.replace("housing_", "")
        if (updatedProfile.current_housing_documents?.[docType]) {
          updatedProfile.current_housing_documents[docType] = updatedProfile.current_housing_documents[docType].filter(
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

  const completion = calculateStepCompletion()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <User className="h-5 w-5" />
            <span>{title}</span>
            <Badge variant={completion >= 80 ? "default" : "secondary"}>{completion}% complété</Badge>
          </div>
          {canRemove && (
            <Button onClick={onRemove} size="sm" variant="outline">
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progression des sous-étapes */}
        <div className="space-y-4">
          <Progress value={(currentSubStep / totalSubSteps) * 100} className="h-2" />
          <div className="flex justify-between text-xs text-gray-600">
            <span className={currentSubStep >= 1 ? "text-blue-600 font-medium" : ""}>Identité</span>
            <span className={currentSubStep >= 2 ? "text-blue-600 font-medium" : ""}>Logement</span>
            <span className={currentSubStep >= 3 ? "text-blue-600 font-medium" : ""}>Activité</span>
            <span className={currentSubStep >= 4 ? "text-blue-600 font-medium" : ""}>Revenus</span>
            <span className={currentSubStep >= 5 ? "text-blue-600 font-medium" : ""}>Fiscalité</span>
          </div>
        </div>

        {/* Erreurs de validation */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800 mb-2">Informations manquantes :</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Étape 1: Identité */}
        {currentSubStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <User className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-medium">Identité</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">Prénom *</Label>
                <Input
                  id="first_name"
                  value={profile.first_name || ""}
                  onChange={(e) => onUpdate({ ...profile, first_name: e.target.value })}
                  placeholder="Votre prénom"
                />
              </div>
              <div>
                <Label htmlFor="last_name">Nom *</Label>
                <Input
                  id="last_name"
                  value={profile.last_name || ""}
                  onChange={(e) => onUpdate({ ...profile, last_name: e.target.value })}
                  placeholder="Votre nom"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="birth_date">Date de naissance</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={profile.birth_date || ""}
                  onChange={(e) => onUpdate({ ...profile, birth_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="birth_place">Lieu de naissance</Label>
                <Input
                  id="birth_place"
                  value={profile.birth_place || ""}
                  onChange={(e) => onUpdate({ ...profile, birth_place: e.target.value })}
                  placeholder="Ville de naissance"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="nationality">Nationalité</Label>
              <Input
                id="nationality"
                value={profile.nationality || "française"}
                onChange={(e) => onUpdate({ ...profile, nationality: e.target.value })}
                placeholder="Nationalité"
              />
            </div>

            <FileUploadZone
              category="identity"
              label="Carte Nationale d'Identité *"
              multiple
              existingFiles={profile.identity_documents || []}
            />
          </div>
        )}

        {/* Étape 2: Logement actuel */}
        {currentSubStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <Home className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-medium">Situation d'hébergement actuelle</h3>
            </div>

            <div>
              <Label>Votre situation actuelle *</Label>
              <Select
                value={profile.current_housing_situation || ""}
                onValueChange={(value) => onUpdate({ ...profile, current_housing_situation: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez votre situation" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENT_HOUSING_SITUATIONS.map((situation) => (
                    <SelectItem key={situation.value} value={situation.value}>
                      <div>
                        <div className="font-medium">{situation.label}</div>
                        <div className="text-sm text-gray-600">{situation.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {profile.current_housing_situation === "locataire" && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Documents requis pour locataire :</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• 3 dernières quittances de loyer</li>
                    <li>• Attestation de bon paiement des loyers</li>
                  </ul>
                </div>
                <FileUploadZone category="housing_quittances_loyer" label="3 dernières quittances de loyer" multiple />
                <FileUploadZone
                  category="housing_attestation_bon_paiement"
                  label="Attestation de bon paiement des loyers"
                />
              </div>
            )}

            {profile.current_housing_situation === "heberge" && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Documents requis pour hébergé :</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Attestation d'hébergement de moins de 3 mois</li>
                  </ul>
                </div>
                <FileUploadZone
                  category="housing_attestation_hebergement"
                  label="Attestation d'hébergement de moins de 3 mois"
                />
              </div>
            )}

            {profile.current_housing_situation === "proprietaire" && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Documents requis pour propriétaire :</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Avis de taxe foncière 2024</li>
                  </ul>
                </div>
                <FileUploadZone category="housing_avis_taxe_fonciere" label="Avis de taxe foncière 2024" />
              </div>
            )}
          </div>
        )}

        {/* Étape 3: Activité professionnelle */}
        {currentSubStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <Briefcase className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-medium">Situation professionnelle</h3>
            </div>

            <div>
              <Label>Activité principale *</Label>
              <p className="text-sm text-gray-600 mb-2">
                Vous avez plusieurs activités ? Choisissez votre activité principale. Vous pourrez ajouter d'autres
                revenus à l'étape suivante.
              </p>
              <Select
                value={profile.main_activity || ""}
                onValueChange={(value) => onUpdate({ ...profile, main_activity: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez votre activité principale" />
                </SelectTrigger>
                <SelectContent>
                  {MAIN_ACTIVITIES.map((activity) => (
                    <SelectItem key={activity.value} value={activity.value}>
                      <div>
                        <div className="font-medium">{activity.label}</div>
                        <div className="text-sm text-gray-600">{activity.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {profile.main_activity && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">
                    Documents requis pour {MAIN_ACTIVITIES.find((a) => a.value === profile.main_activity)?.label} :
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {MAIN_ACTIVITIES.find((a) => a.value === profile.main_activity)?.required_documents.map(
                      (doc, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{doc}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>

                <FileUploadZone
                  category="activity"
                  label={`Documents justificatifs - ${MAIN_ACTIVITIES.find((a) => a.value === profile.main_activity)?.label} *`}
                  multiple
                  existingFiles={profile.activity_documents || []}
                />
              </div>
            )}
          </div>
        )}

        {/* Étape 4: Revenus */}
        {currentSubStep === 4 && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <Euro className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-medium">Justificatifs de ressources</h3>
            </div>

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
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-sm text-gray-600">{type.description}</div>
                            </div>
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
                      onChange={(e) =>
                        updateIncomeSource("work_income", null, "amount", Number.parseFloat(e.target.value))
                      }
                    />
                  </div>

                  <FileUploadZone category="work_income" label="Justificatifs de revenus *" multiple />
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
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-sm text-gray-600">{type.description}</div>
                            </div>
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
                      onChange={(e) =>
                        updateIncomeSource("social_aid", index, "amount", Number.parseFloat(e.target.value))
                      }
                    />
                  </div>

                  <FileUploadZone category={`social_aid_${index}`} label="Justificatifs" multiple />
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
                    <Button onClick={() => removeIncomeSource("retirement_pension", index)} size="sm" variant="outline">
                      <X className="h-4 w-4" />
                    </Button>
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
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-sm text-gray-600">{type.description}</div>
                            </div>
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
                    category={`retirement_pension_${index}`}
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
                    <Button onClick={() => removeIncomeSource("rent_income", index)} size="sm" variant="outline">
                      <X className="h-4 w-4" />
                    </Button>
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
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-sm text-gray-600">{type.description}</div>
                            </div>
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
                    category={`rent_income_${index}`}
                    label="Justificatifs"
                    multiple
                    existingFiles={rent.documents || []}
                  />
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
                <div className="ml-6 space-y-4 border-l-2 border-blue-200 pl-4">
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

                  <FileUploadZone category="no_income" label="Justificatifs (optionnel)" multiple />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Étape 5: Fiscalité */}
        {currentSubStep === 5 && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-medium">Avis d'imposition</h3>
            </div>

            <div>
              <Label>Votre situation fiscale *</Label>
              <Select
                value={profile.tax_situation?.type || ""}
                onValueChange={(value) =>
                  onUpdate({
                    ...profile,
                    tax_situation: { ...profile.tax_situation, type: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez votre situation fiscale" />
                </SelectTrigger>
                <SelectContent>
                  {TAX_SITUATIONS.map((situation) => (
                    <SelectItem key={situation.value} value={situation.value}>
                      {situation.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {profile.tax_situation?.type === "other" && (
              <div>
                <Label htmlFor="tax_explanation">
                  Merci d'expliquer pourquoi vous ne pouvez pas fournir d'avis d'imposition
                </Label>
                <Textarea
                  id="tax_explanation"
                  placeholder="Expliquez votre situation..."
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

            <FileUploadZone category="tax" label="Avis d'imposition *" multiple />

            {completion >= 80 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span className="font-medium text-green-800">Profil complété à {completion}% !</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={prevSubStep} disabled={currentSubStep === 1}>
            Précédent
          </Button>
          <Button onClick={nextSubStep} disabled={currentSubStep === totalSubSteps}>
            {currentSubStep === totalSubSteps ? "Terminé" : "Suivant"}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
