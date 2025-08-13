"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, Home, Briefcase, Euro, FileText, X, AlertCircle, Trash2 } from "lucide-react"
import {
  MAIN_ACTIVITIES,
  WORK_INCOME_TYPES,
  SOCIAL_AID_TYPES,
  DURATION_OPTIONS,
  TAX_SITUATIONS,
  CURRENT_HOUSING_SITUATIONS,
} from "@/lib/rental-file-service"
import { IdentityDocumentUpload } from "@/components/document-upload/IdentityDocumentUpload"
import { MonthlyDocumentUpload } from "@/components/document-upload/MonthlyDocumentUpload"
import { TaxNoticeUpload } from "@/components/document-upload/TaxNoticeUpload"
import { SupabaseFileUpload } from "@/components/supabase-file-upload"

interface ImprovedPersonProfileProps {
  profile: any
  onUpdate: (updatedProfile: any) => void
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
  const [activeTab, setActiveTab] = useState("identity")
  const [localProfile, setLocalProfile] = useState(profile)

  useEffect(() => {
    setLocalProfile(profile)
  }, [profile])

  const updateField = (field: string, value: any) => {
    const updated = { ...localProfile, [field]: value }
    setLocalProfile(updated)
    onUpdate(updated)
  }

  const updateNestedField = (parentField: string, field: string, value: any) => {
    const updated = {
      ...localProfile,
      [parentField]: {
        ...localProfile[parentField],
        [field]: value,
      },
    }
    setLocalProfile(updated)
    onUpdate(updated)
  }

  const addIncomeSource = (type: string) => {
    const incomeSources = { ...localProfile.income_sources }

    switch (type) {
      case "work_income":
        incomeSources.work_income = {
          type: "salarie",
          amount: 0,
          documents: [],
        }
        break
      case "social_aid":
        if (!incomeSources.social_aid) incomeSources.social_aid = []
        incomeSources.social_aid.push({
          type: "caf_msa",
          duration: "plus_3_mois",
          amount: 0,
          documents: [],
        })
        break
      case "retirement_pension":
        if (!incomeSources.retirement_pension) incomeSources.retirement_pension = []
        incomeSources.retirement_pension.push({
          type: "retraite",
          has_bulletin: true,
          amount: 0,
          documents: [],
        })
        break
      case "rent_income":
        if (!incomeSources.rent_income) incomeSources.rent_income = []
        incomeSources.rent_income.push({
          type: "revenus_locatifs",
          has_receipt: true,
          amount: 0,
          documents: [],
        })
        break
      case "scholarship":
        incomeSources.scholarship = {
          amount: 0,
          documents: [],
        }
        break
      case "no_income":
        incomeSources.no_income = {
          explanation: "",
          documents: [],
        }
        break
    }

    updateField("income_sources", incomeSources)
  }

  const removeIncomeSource = (type: string, index?: number) => {
    const incomeSources = { ...localProfile.income_sources }

    if (type === "work_income" || type === "scholarship" || type === "no_income") {
      delete incomeSources[type]
    } else if (index !== undefined && incomeSources[type]) {
      incomeSources[type].splice(index, 1)
      if (incomeSources[type].length === 0) {
        delete incomeSources[type]
      }
    }

    updateField("income_sources", incomeSources)
  }

  const updateIncomeSource = (type: string, field: string, value: any, index?: number) => {
    const incomeSources = { ...localProfile.income_sources }

    if (type === "work_income" || type === "scholarship" || type === "no_income") {
      if (!incomeSources[type]) incomeSources[type] = {}
      incomeSources[type][field] = value
    } else if (index !== undefined && incomeSources[type] && incomeSources[type][index]) {
      incomeSources[type][index][field] = value
    }

    updateField("income_sources", incomeSources)
  }

  // Remplacer la fonction handleDocumentUpload par ces handlers spécifiques :

  const handleIdentityDocumentValidated = (side: "recto" | "verso", documentData: any) => {
    const identityDocs = { ...profile.identity_documents_detailed }
    identityDocs[side] = documentData

    // Maintenir aussi l'ancien format pour compatibilité
    const identityUrls = []
    if (identityDocs.recto?.fileUrl) identityUrls.push(identityDocs.recto.fileUrl)
    if (identityDocs.verso?.fileUrl) identityUrls.push(identityDocs.verso.fileUrl)

    const updatedProfile = {
      ...profile,
      identity_documents_detailed: identityDocs,
      identity_documents: identityUrls,
    }
    onUpdate(updatedProfile)
  }

  const handleRentReceiptValidated = (monthKey: string, documentData: any) => {
    const housingDocs = { ...profile.current_housing_documents }
    if (!housingDocs.quittances_loyer_detailed) housingDocs.quittances_loyer_detailed = {}

    if (documentData === null) {
      delete housingDocs.quittances_loyer_detailed[monthKey]
    } else {
      housingDocs.quittances_loyer_detailed[monthKey] = documentData
    }

    // Maintenir aussi l'ancien format pour compatibilité
    const receiptUrls = Object.values(housingDocs.quittances_loyer_detailed || {})
      .filter((doc) => doc?.fileUrl)
      .map((doc) => doc.fileUrl)

    housingDocs.quittances_loyer = receiptUrls

    const updatedProfile = {
      ...profile,
      current_housing_documents: housingDocs,
    }
    onUpdate(updatedProfile)
  }

  const handleTaxNoticeValidated = (documentData: any) => {
    // Maintenir aussi l'ancien format pour compatibilité
    const taxUrls = documentData?.fileUrl ? [documentData.fileUrl] : []

    const updatedProfile = {
      ...profile,
      tax_situation: {
        ...profile.tax_situation,
        documents_detailed: documentData,
        documents: taxUrls,
      },
    }
    onUpdate(updatedProfile)
  }

  const handleDocumentUpload = (category: string, urls: string[], subcategory?: string, index?: number) => {
    console.log("📁 Upload reçu:", { category, urls, subcategory, index, count: urls.length })

    if (category === "activity") {
      updateField("activity_documents", urls)
    } else if (category === "housing") {
      const housingDocs = { ...localProfile.current_housing_documents }
      if (subcategory) {
        housingDocs[subcategory] = urls
      }
      updateField("current_housing_documents", housingDocs)
    } else if (category === "income" && subcategory) {
      if (subcategory === "scholarship") {
        updateIncomeSource("scholarship", "documents", urls)
      } else if (subcategory === "no_income") {
        updateIncomeSource("no_income", "documents", urls)
      } else if (subcategory.startsWith("social_aid_") && index !== undefined) {
        updateIncomeSource("social_aid", "documents", urls, index)
      } else if (subcategory.startsWith("retirement_") && index !== undefined) {
        updateIncomeSource("retirement_pension", "documents", urls, index)
      } else if (subcategory.startsWith("rent_income_") && index !== undefined) {
        updateIncomeSource("rent_income", "documents", urls, index)
      }
    }
  }

  const handlePayslipValidated = (monthKey: string, documentData: any) => {
    const incomeSources = { ...localProfile.income_sources }
    if (!incomeSources.work_income.documents_detailed) incomeSources.work_income.documents_detailed = {}

    incomeSources.work_income.documents_detailed[monthKey] = documentData

    const updatedProfile = {
      ...profile,
      income_sources: incomeSources,
    }
    onUpdate(updatedProfile)
  }

  const getCompletionPercentage = () => {
    let completed = 0
    let total = 0

    // Identité (30%)
    total += 3
    if (localProfile.first_name) completed++
    if (localProfile.last_name) completed++
    if (
      localProfile.identity_documents?.length > 0 ||
      (localProfile.identity_documents_detailed?.recto && localProfile.identity_documents_detailed?.verso)
    )
      completed++

    // Logement actuel (20%)
    total += 2
    if (localProfile.current_housing_situation) completed++
    if (localProfile.current_housing_documents && Object.keys(localProfile.current_housing_documents).length > 0)
      completed++

    // Activité professionnelle (25%)
    total += 2
    if (localProfile.main_activity) completed++
    if (localProfile.activity_documents?.length > 0) completed++

    // Revenus (15%)
    total += 1
    if (localProfile.income_sources && Object.keys(localProfile.income_sources).length > 0) completed++

    // Fiscalité (10%)
    total += 1
    if (localProfile.tax_situation?.documents?.length > 0 || localProfile.tax_situation?.documents_detailed) completed++

    return Math.round((completed / total) * 100)
  }

  const completionPercentage = getCompletionPercentage()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <User className="h-5 w-5" />
            <div>
              <CardTitle>{title}</CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={completionPercentage >= 80 ? "default" : "secondary"}>
                  {completionPercentage}% complété
                </Badge>
                {localProfile.first_name && localProfile.last_name && (
                  <span className="text-sm text-gray-600">
                    {localProfile.first_name} {localProfile.last_name}
                  </span>
                )}
              </div>
            </div>
          </div>
          {canRemove && onRemove && (
            <Button variant="outline" size="sm" onClick={onRemove}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="identity" className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Identité</span>
            </TabsTrigger>
            <TabsTrigger value="housing" className="flex items-center space-x-1">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Logement</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center space-x-1">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Activité</span>
            </TabsTrigger>
            <TabsTrigger value="income" className="flex items-center space-x-1">
              <Euro className="h-4 w-4" />
              <span className="hidden sm:inline">Revenus</span>
            </TabsTrigger>
            <TabsTrigger value="tax" className="flex items-center space-x-1">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Fiscalité</span>
            </TabsTrigger>
          </TabsList>

          {/* Onglet Identité */}
          <TabsContent value="identity" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">Prénom *</Label>
                <Input
                  id="first_name"
                  value={localProfile.first_name || ""}
                  onChange={(e) => updateField("first_name", e.target.value)}
                  placeholder="Votre prénom"
                />
              </div>
              <div>
                <Label htmlFor="last_name">Nom *</Label>
                <Input
                  id="last_name"
                  value={localProfile.last_name || ""}
                  onChange={(e) => updateField("last_name", e.target.value)}
                  placeholder="Votre nom"
                />
              </div>
              <div>
                <Label htmlFor="birth_date">Date de naissance</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={localProfile.birth_date || ""}
                  onChange={(e) => updateField("birth_date", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="birth_place">Lieu de naissance</Label>
                <Input
                  id="birth_place"
                  value={localProfile.birth_place || ""}
                  onChange={(e) => updateField("birth_place", e.target.value)}
                  placeholder="Ville de naissance"
                />
              </div>
              <div>
                <Label htmlFor="nationality">Nationalité</Label>
                <Select
                  value={localProfile.nationality || "française"}
                  onValueChange={(value) => updateField("nationality", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="française">Française</SelectItem>
                    <SelectItem value="européenne">Européenne</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Pièce d'identité *</Label>
              <p className="text-sm text-gray-600 mb-3">Téléchargez le recto ET le verso de votre pièce d'identité</p>
              <IdentityDocumentUpload
                onDocumentValidated={handleIdentityDocumentValidated}
                completedSides={{
                  recto: profile.identity_documents_detailed?.recto,
                  verso: profile.identity_documents_detailed?.verso,
                }}
              />
            </div>
          </TabsContent>

          {/* Onglet Logement actuel */}
          <TabsContent value="housing" className="space-y-6">
            <div>
              <Label className="text-base font-medium">Situation d'hébergement actuelle *</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                {CURRENT_HOUSING_SITUATIONS.map((situation) => (
                  <div
                    key={situation.value}
                    onClick={() => updateField("current_housing_situation", situation.value)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      localProfile.current_housing_situation === situation.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <h4 className="font-medium">{situation.label}</h4>
                    <p className="text-sm text-gray-600 mt-1">{situation.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {localProfile.current_housing_situation && (
              <div>
                <Label className="text-base font-medium">Documents justificatifs *</Label>
                {localProfile.current_housing_situation === "locataire" && (
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

                {localProfile.current_housing_situation === "heberge" && (
                  <div className="mt-3">
                    <Label>Attestation d'hébergement (moins de 3 mois)</Label>
                    <SupabaseFileUpload
                      onFilesUploaded={(urls) => handleDocumentUpload("housing", urls, "attestation_hebergement")}
                      maxFiles={1}
                      bucket="documents"
                      folder="rental-files"
                      category="housing"
                      documentType="tax_notice"
                      existingFiles={localProfile.current_housing_documents?.attestation_hebergement || []}
                    />
                  </div>
                )}

                {localProfile.current_housing_situation === "proprietaire" && (
                  <div className="mt-3">
                    <Label>Avis de taxe foncière 2024</Label>
                    <SupabaseFileUpload
                      onFilesUploaded={(urls) => handleDocumentUpload("housing", urls, "avis_taxe_fonciere")}
                      maxFiles={1}
                      bucket="documents"
                      folder="rental-files"
                      category="housing"
                      documentType="tax_notice"
                      existingFiles={localProfile.current_housing_documents?.avis_taxe_fonciere || []}
                    />
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Onglet Activité professionnelle */}
          <TabsContent value="activity" className="space-y-6">
            <div>
              <Label className="text-base font-medium">Activité principale *</Label>
              <Select
                value={localProfile.main_activity || ""}
                onValueChange={(value) => updateField("main_activity", value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Sélectionnez votre activité principale" />
                </SelectTrigger>
                <SelectContent>
                  {MAIN_ACTIVITIES.map((activity) => (
                    <SelectItem key={activity.value} value={activity.value}>
                      <div>
                        <div className="font-medium">{activity.label}</div>
                        <div className="text-sm text-gray-500">{activity.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="profession">Profession</Label>
                <Input
                  id="profession"
                  value={localProfile.profession || ""}
                  onChange={(e) => updateField("profession", e.target.value)}
                  placeholder="Ex: Développeur, Comptable..."
                />
              </div>
              <div>
                <Label htmlFor="company">Entreprise</Label>
                <Input
                  id="company"
                  value={localProfile.company || ""}
                  onChange={(e) => updateField("company", e.target.value)}
                  placeholder="Nom de votre entreprise"
                />
              </div>
            </div>

            {localProfile.main_activity && (
              <div>
                <Label className="text-base font-medium">Documents justificatifs *</Label>
                <div className="mt-2">
                  {MAIN_ACTIVITIES.find((a) => a.value === localProfile.main_activity)?.required_documents.map(
                    (doc, index) => (
                      <p key={index} className="text-sm text-gray-600">
                        • {doc}
                      </p>
                    ),
                  )}
                </div>
                <div className="mt-3">
                  <SupabaseFileUpload
                    onFilesUploaded={(urls) => handleDocumentUpload("activity", urls)}
                    maxFiles={3}
                    bucket="documents"
                    folder="rental-files"
                    category="activity"
                    documentType="employment_contract"
                    existingFiles={localProfile.activity_documents || []}
                  />
                </div>
              </div>
            )}
          </TabsContent>

          {/* Onglet Revenus */}
          <TabsContent value="income" className="space-y-6">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Sources de revenus *</Label>
              <div className="flex space-x-2">
                <Select onValueChange={(value) => addIncomeSource(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Ajouter une source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="work_income">Revenus du travail</SelectItem>
                    <SelectItem value="social_aid">Aide sociale</SelectItem>
                    <SelectItem value="retirement_pension">Retraite/Pension</SelectItem>
                    <SelectItem value="rent_income">Rentes</SelectItem>
                    <SelectItem value="scholarship">Bourse</SelectItem>
                    <SelectItem value="no_income">Aucun revenu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Revenus du travail */}
            {localProfile.income_sources?.work_income && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Revenus du travail</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => removeIncomeSource("work_income")}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Type de revenus</Label>
                      <Select
                        value={localProfile.income_sources.work_income.type || "salarie"}
                        onValueChange={(value) => updateIncomeSource("work_income", "type", value)}
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
                      <Label>Montant mensuel net (€)</Label>
                      <Input
                        type="number"
                        value={localProfile.income_sources.work_income.amount || ""}
                        onChange={(e) => updateIncomeSource("work_income", "amount", Number(e.target.value))}
                        placeholder="2500"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Justificatifs (3 dernières fiches de paie)</Label>
                    <MonthlyDocumentUpload
                      documentType="payslip"
                      documentName="Fiche de paie"
                      onDocumentValidated={handlePayslipValidated}
                      completedMonths={localProfile.income_sources.work_income.documents_detailed || {}}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Aides sociales */}
            {localProfile.income_sources?.social_aid?.map((aid: any, index: number) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Aide sociale {index + 1}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => removeIncomeSource("social_aid", index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Type d'aide</Label>
                      <Select
                        value={aid.type || "caf_msa"}
                        onValueChange={(value) => updateIncomeSource("social_aid", "type", value, index)}
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
                      <Label>Durée</Label>
                      <Select
                        value={aid.duration || "plus_3_mois"}
                        onValueChange={(value) => updateIncomeSource("social_aid", "duration", value, index)}
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
                      <Label>Montant mensuel (€)</Label>
                      <Input
                        type="number"
                        value={aid.amount || ""}
                        onChange={(e) => updateIncomeSource("social_aid", "amount", Number(e.target.value), index)}
                        placeholder="500"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Justificatifs</Label>
                    <SupabaseFileUpload
                      onFilesUploaded={(urls) => handleDocumentUpload("income", urls, `social_aid_${index}`, index)}
                      maxFiles={2}
                      bucket="documents"
                      folder="rental-files"
                      category="income"
                      existingFiles={aid.documents || []}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Retraite/Pension */}
            {localProfile.income_sources?.retirement_pension?.map((pension: any, index: number) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Retraite/Pension {index + 1}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => removeIncomeSource("retirement_pension", index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Type</Label>
                      <Select
                        value={pension.type || "retraite"}
                        onValueChange={(value) => updateIncomeSource("retirement_pension", "type", value, index)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="retraite">Retraite</SelectItem>
                          <SelectItem value="pension_invalidite">Pension d'invalidité</SelectItem>
                          <SelectItem value="pension_veuvage">Pension de veuvage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Montant mensuel (€)</Label>
                      <Input
                        type="number"
                        value={pension.amount || ""}
                        onChange={(e) =>
                          updateIncomeSource("retirement_pension", "amount", Number(e.target.value), index)
                        }
                        placeholder="1200"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Justificatifs</Label>
                    <SupabaseFileUpload
                      onFilesUploaded={(urls) => handleDocumentUpload("income", urls, `retirement_${index}`, index)}
                      maxFiles={2}
                      bucket="documents"
                      folder="rental-files"
                      category="income"
                      existingFiles={pension.documents || []}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Rentes */}
            {localProfile.income_sources?.rent_income?.map((rent: any, index: number) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Rente {index + 1}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => removeIncomeSource("rent_income", index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Type</Label>
                      <Select
                        value={rent.type || "revenus_locatifs"}
                        onValueChange={(value) => updateIncomeSource("rent_income", "type", value, index)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="revenus_locatifs">Revenus locatifs</SelectItem>
                          <SelectItem value="rente_viagere">Rente viagère</SelectItem>
                          <SelectItem value="dividendes">Dividendes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Montant mensuel (€)</Label>
                      <Input
                        type="number"
                        value={rent.amount || ""}
                        onChange={(e) => updateIncomeSource("rent_income", "amount", Number(e.target.value), index)}
                        placeholder="800"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Justificatifs</Label>
                    <SupabaseFileUpload
                      onFilesUploaded={(urls) => handleDocumentUpload("income", urls, `rent_income_${index}`, index)}
                      maxFiles={2}
                      bucket="documents"
                      folder="rental-files"
                      category="income"
                      existingFiles={rent.documents || []}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Bourse */}
            {localProfile.income_sources?.scholarship && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Bourse</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => removeIncomeSource("scholarship")}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Montant mensuel (€)</Label>
                    <Input
                      type="number"
                      value={localProfile.income_sources.scholarship.amount || ""}
                      onChange={(e) => updateIncomeSource("scholarship", "amount", Number(e.target.value))}
                      placeholder="400"
                    />
                  </div>
                  <div>
                    <Label>Justificatifs</Label>
                    <SupabaseFileUpload
                      onFilesUploaded={(urls) => handleDocumentUpload("income", urls, "scholarship")}
                      maxFiles={2}
                      bucket="documents"
                      folder="rental-files"
                      category="income"
                      existingFiles={localProfile.income_sources.scholarship.documents || []}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Aucun revenu */}
            {localProfile.income_sources?.no_income && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Aucun revenu</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => removeIncomeSource("no_income")}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Explication de votre situation</Label>
                    <Textarea
                      value={localProfile.income_sources.no_income.explanation || ""}
                      onChange={(e) => updateIncomeSource("no_income", "explanation", e.target.value)}
                      placeholder="Expliquez votre situation (étudiant, recherche d'emploi, etc.)"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Justificatifs (optionnel)</Label>
                    <SupabaseFileUpload
                      onFilesUploaded={(urls) => handleDocumentUpload("income", urls, "no_income")}
                      maxFiles={2}
                      bucket="documents"
                      folder="rental-files"
                      category="income"
                      existingFiles={localProfile.income_sources.no_income.documents || []}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {!localProfile.income_sources ||
              (Object.keys(localProfile.income_sources).length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Vous devez ajouter au moins une source de revenus pour compléter votre dossier.
                  </AlertDescription>
                </Alert>
              ))}
          </TabsContent>

          {/* Onglet Fiscalité */}
          <TabsContent value="tax" className="space-y-6">
            <div>
              <Label className="text-base font-medium">Situation fiscale *</Label>
              <Select
                value={localProfile.tax_situation?.type || ""}
                onValueChange={(value) => updateNestedField("tax_situation", "type", value)}
              >
                <SelectTrigger className="mt-2">
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

            {localProfile.tax_situation?.type === "other" && (
              <div>
                <Label htmlFor="tax_explanation">Précisez votre situation</Label>
                <Textarea
                  id="tax_explanation"
                  value={localProfile.tax_situation?.explanation || ""}
                  onChange={(e) => updateNestedField("tax_situation", "explanation", e.target.value)}
                  placeholder="Décrivez votre situation fiscale particulière"
                />
              </div>
            )}

            <div>
              <Label className="text-base font-medium">Avis d'imposition *</Label>
              <p className="text-sm text-gray-600 mb-3">Téléchargez votre dernier avis d'imposition complet</p>
              <TaxNoticeUpload
                onDocumentValidated={handleTaxNoticeValidated}
                completedDocument={profile.tax_situation?.documents_detailed}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
