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
import { X, User, Briefcase, ChevronRight, Home, CheckCircle, AlertTriangle, Euro, CreditCard } from "lucide-react"
import { MAIN_ACTIVITIES, TAX_SITUATIONS, CURRENT_HOUSING_SITUATIONS } from "@/lib/rental-file-service"
import { toast } from "sonner"
import { ImprovedIncomeSection } from "./improved-income-section"
import { SupabaseFileUpload } from "@/components/supabase-file-upload"
import { IdentityDocumentUpload } from "@/components/document-upload/IdentityDocumentUpload"
import { MonthlyDocumentUpload } from "@/components/document-upload/MonthlyDocumentUpload"
import { TaxNoticeUpload } from "@/components/document-upload/TaxNoticeUpload"
import { ActivityDocumentUpload } from "@/components/document-upload/ActivityDocumentUpload"

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

  const handleFileUpload = async (category: string, urls: string[]) => {
    console.log("📁 Upload reçu:", { category, urls, count: urls.length })

    if (!urls || urls.length === 0) {
      toast.error("Aucun fichier reçu")
      return
    }

    const updatedProfile = { ...profile }

    // Gestion des différents types de documents
    if (category === "identity") {
      updatedProfile.identity_documents = [...(updatedProfile.identity_documents || []), ...urls]
    } else if (category === "activity") {
      updatedProfile.activity_documents = [...(updatedProfile.activity_documents || []), ...urls]
    } else if (category === "tax") {
      if (!updatedProfile.tax_situation) updatedProfile.tax_situation = { type: "own_notice", documents: [] }
      updatedProfile.tax_situation.documents = [...(updatedProfile.tax_situation.documents || []), ...urls]
    } else if (category.startsWith("housing_")) {
      const docType = category.replace("housing_", "")
      if (!updatedProfile.current_housing_documents) updatedProfile.current_housing_documents = {}
      updatedProfile.current_housing_documents[docType] = [
        ...(updatedProfile.current_housing_documents[docType] || []),
        ...urls,
      ]
    }

    console.log("📁 Profil mis à jour:", updatedProfile)
    onUpdate(updatedProfile)
    toast.success(`${urls.length} document(s) ajouté(s) avec succès`)
  }

  // Handlers pour les nouveaux composants d'upload
  const handleIdentityDocumentValidated = (side: "recto" | "verso", documentData: any) => {
    const updatedProfile = { ...profile }

    if (!updatedProfile.identity_documents_detailed) updatedProfile.identity_documents_detailed = {}
    updatedProfile.identity_documents_detailed[side] = documentData

    // Maintenir aussi l'ancien format pour compatibilité
    const identityUrls = []
    if (updatedProfile.identity_documents_detailed.recto?.fileUrl)
      identityUrls.push(updatedProfile.identity_documents_detailed.recto.fileUrl)
    if (updatedProfile.identity_documents_detailed.verso?.fileUrl)
      identityUrls.push(updatedProfile.identity_documents_detailed.verso.fileUrl)
    updatedProfile.identity_documents = identityUrls

    onUpdate(updatedProfile)
    toast.success("Document d'identité validé avec succès")
  }

  const handleRentReceiptValidated = (monthKey: string, documentData: any) => {
    const updatedProfile = { ...profile }

    if (!updatedProfile.current_housing_documents) updatedProfile.current_housing_documents = {}
    if (!updatedProfile.current_housing_documents.quittances_loyer_detailed)
      updatedProfile.current_housing_documents.quittances_loyer_detailed = {}

    if (documentData === null) {
      delete updatedProfile.current_housing_documents.quittances_loyer_detailed[monthKey]
    } else {
      updatedProfile.current_housing_documents.quittances_loyer_detailed[monthKey] = documentData
    }

    // Maintenir aussi l'ancien format pour compatibilité
    const receiptUrls = Object.values(updatedProfile.current_housing_documents.quittances_loyer_detailed || {})
      .filter((doc) => doc?.fileUrl)
      .map((doc) => doc.fileUrl)
    updatedProfile.current_housing_documents.quittances_loyer = receiptUrls

    onUpdate(updatedProfile)
    toast.success("Quittance de loyer validée avec succès")
  }

  const handleTaxNoticeValidated = (documentData: any) => {
    const updatedProfile = { ...profile }

    if (!updatedProfile.tax_situation) updatedProfile.tax_situation = { type: "own_notice" }
    updatedProfile.tax_situation.documents_detailed = documentData

    // Maintenir aussi l'ancien format pour compatibilité
    const taxUrls = documentData?.fileUrl ? [documentData.fileUrl] : []
    updatedProfile.tax_situation.documents = taxUrls

    onUpdate(updatedProfile)
    toast.success("Avis d'imposition validé avec succès")
  }

  // Handler pour les documents d'activité avec validation utilisateur
  const handleActivityDocumentValidated = (documentData: any) => {
    const updatedProfile = { ...profile }

    if (!updatedProfile.activity_documents_detailed) updatedProfile.activity_documents_detailed = {}
    updatedProfile.activity_documents_detailed = documentData

    // Maintenir aussi l'ancien format pour compatibilité
    const activityUrls = documentData?.fileUrl ? [documentData.fileUrl] : []
    updatedProfile.activity_documents = activityUrls

    onUpdate(updatedProfile)
    toast.success("Document d'activité validé avec succès")
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email || ""}
                  onChange={(e) => onUpdate({ ...profile, email: e.target.value })}
                  placeholder="Adresse email"
                />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone || ""}
                  onChange={(e) => onUpdate({ ...profile, phone: e.target.value })}
                  placeholder="Numéro de téléphone"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={profile.address || ""}
                  onChange={(e) => onUpdate({ ...profile, address: e.target.value })}
                  placeholder="Adresse du garant"
                />
              </div>
              <div>
                <Label htmlFor="postal_code">Code Postal</Label>
                <Input
                  id="postal_code"
                  value={profile.postal_code || ""}
                  onChange={(e) => onUpdate({ ...profile, postal_code: e.target.value })}
                  placeholder="Code postal"
                />
              </div>
              <div>
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  value={profile.city || ""}
                  onChange={(e) => onUpdate({ ...profile, city: e.target.value })}
                  placeholder="Ville"
                />
              </div>
            </div>

            <IdentityDocumentUpload
              onDocumentValidated={handleIdentityDocumentValidated}
              completedSides={{
                recto: profile.identity_documents_detailed?.recto,
                verso: profile.identity_documents_detailed?.verso,
              }}
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
                <MonthlyDocumentUpload
                  documentType="rent_receipt"
                  documentName="Quittance de loyer"
                  onDocumentValidated={handleRentReceiptValidated}
                  completedMonths={profile.current_housing_documents?.quittances_loyer_detailed || {}}
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
                <SupabaseFileUpload
                  onFilesUploaded={(urls) => handleFileUpload("housing_attestation_hebergement", urls)}
                  maxFiles={2}
                  bucket="documents"
                  folder="housing"
                  existingFiles={profile.current_housing_documents?.attestation_hebergement || []}
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
                <SupabaseFileUpload
                  onFilesUploaded={(urls) => handleFileUpload("housing_avis_taxe_fonciere", urls)}
                  maxFiles={1}
                  bucket="documents"
                  folder="housing"
                  existingFiles={profile.current_housing_documents?.avis_taxe_fonciere || []}
                />
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

                <ActivityDocumentUpload
                  onDocumentValidated={handleActivityDocumentValidated}
                  completedDocument={profile.activity_documents_detailed}
                  title="Justificatifs d'activité"
                  description="Tous les documents requis pour votre activité (contrat, bulletins de salaire, etc.)"
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

            <TaxNoticeUpload
              onDocumentValidated={handleTaxNoticeValidated}
              completedDocument={profile.tax_situation?.documents_detailed}
            />

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
