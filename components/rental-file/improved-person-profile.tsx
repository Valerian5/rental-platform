"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Upload,
  X,
  User,
  Briefcase,
  FileText,
  ChevronRight,
  Home,
  CheckCircle,
  AlertTriangle,
  Euro,
  CreditCard,
} from "lucide-react"
import { MAIN_ACTIVITIES, TAX_SITUATIONS, CURRENT_HOUSING_SITUATIONS } from "@/lib/rental-file-service"
import { toast } from "sonner"
import { ImprovedIncomeSection } from "./improved-income-section"

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

  // Fonction pour obtenir l'icône de chaque sous-étape
  const getSubStepIcon = (step: number) => {
    switch (step) {
      case 1:
        return <User className="h-4 w-4" />
      case 2:
        return <Home className="h-4 w-4" />
      case 3:
        return <Briefcase className="h-4 w-4" />
      case 4:
        return <Euro className="h-4 w-4" />
      case 5:
        return <CreditCard className="h-4 w-4" />
      default:
        return <CheckCircle className="h-4 w-4" />
    }
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
        {/* Progression des sous-étapes avec icônes */}
        <div className="space-y-4">
          <Progress value={(currentSubStep / totalSubSteps) * 100} className="h-2" />
          <div className="flex justify-between">
            <div className="flex flex-col items-center space-y-1">
              <div
                className={`p-1 rounded-full ${currentSubStep >= 1 ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}
              >
                {getSubStepIcon(1)}
              </div>
              <span className={`text-xs ${currentSubStep >= 1 ? "text-blue-600 font-medium" : "text-gray-500"}`}>
                Identité
              </span>
            </div>
            <div className="flex flex-col items-center space-y-1">
              <div
                className={`p-1 rounded-full ${currentSubStep >= 2 ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}
              >
                {getSubStepIcon(2)}
              </div>
              <span className={`text-xs ${currentSubStep >= 2 ? "text-blue-600 font-medium" : "text-gray-500"}`}>
                Logement
              </span>
            </div>
            <div className="flex flex-col items-center space-y-1">
              <div
                className={`p-1 rounded-full ${currentSubStep >= 3 ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}
              >
                {getSubStepIcon(3)}
              </div>
              <span className={`text-xs ${currentSubStep >= 3 ? "text-blue-600 font-medium" : "text-gray-500"}`}>
                Activité
              </span>
            </div>
            <div className="flex flex-col items-center space-y-1">
              <div
                className={`p-1 rounded-full ${currentSubStep >= 4 ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}
              >
                {getSubStepIcon(4)}
              </div>
              <span className={`text-xs ${currentSubStep >= 4 ? "text-blue-600 font-medium" : "text-gray-500"}`}>
                Revenus
              </span>
            </div>
            <div className="flex flex-col items-center space-y-1">
              <div
                className={`p-1 rounded-full ${currentSubStep >= 5 ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}
              >
                {getSubStepIcon(5)}
              </div>
              <span className={`text-xs ${currentSubStep >= 5 ? "text-blue-600 font-medium" : "text-gray-500"}`}>
                Fiscalité
              </span>
            </div>
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
        {currentSubStep === 4 && <ImprovedIncomeSection profile={profile} onUpdate={onUpdate} />}

        {/* Étape 5: Fiscalité */}
        {currentSubStep === 5 && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <CreditCard className="h-5 w-5 text-blue-600" />
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
