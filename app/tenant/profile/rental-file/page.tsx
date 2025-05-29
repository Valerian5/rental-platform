"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Upload,
  File,
  Check,
  Download,
  Eye,
  ArrowLeft,
  ArrowRight,
  User,
  Briefcase,
  FileText,
  Shield,
} from "lucide-react"
import {
  rentalFileService,
  EMPLOYMENT_STATUS_OPTIONS,
  GUARANTOR_TYPES,
  RENTAL_FILE_ITEMS,
} from "@/lib/rental-file-service"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"
import Link from "next/link"

export default function RentalFilePage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [rentalFile, setRentalFile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  const [uploadingItem, setUploadingItem] = useState<string | null>(null)
  const [formData, setFormData] = useState<any>({})

  const totalSteps = 4

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (user && user.user_type === "tenant") {
          setCurrentUser(user)

          let fileData = await rentalFileService.getRentalFile(user.id)

          // Si pas de dossier, l'initialiser avec les données du compte
          if (!fileData) {
            fileData = await rentalFileService.initializeFromUserData(user.id, user)
          }

          setRentalFile(fileData)
          setFormData(fileData)
        }
      } catch (error) {
        console.error("Erreur chargement dossier:", error)
        toast.error("Erreur lors du chargement du dossier")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleUpdateData = async (newData: any) => {
    if (!currentUser) return

    try {
      const updatedData = { ...formData, ...newData }
      const updatedFile = await rentalFileService.updateRentalFile(currentUser.id, updatedData)
      setRentalFile(updatedFile)
      setFormData(updatedData)
      toast.success("Informations mises à jour")
    } catch (error) {
      console.error("Erreur mise à jour:", error)
      toast.error("Erreur lors de la mise à jour")
    }
  }

  const handleFileUpload = async (itemKey: string, files: FileList | null) => {
    if (!files || !currentUser) return

    setUploadingItem(itemKey)

    try {
      // Simuler l'upload - à remplacer par un vrai service d'upload
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const fileUrls = Array.from(files).map((file) => URL.createObjectURL(file))

      const item = RENTAL_FILE_ITEMS.find((i) => i.key === itemKey)
      const updateData = {
        [itemKey]: item?.type === "multiple" ? fileUrls : fileUrls[0],
      }

      await handleUpdateData(updateData)
      toast.success(`${item?.name} mis à jour avec succès`)
    } catch (error) {
      console.error("Erreur upload:", error)
      toast.error("Erreur lors de l'upload du fichier")
    } finally {
      setUploadingItem(null)
    }
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const completionPercentage = rentalFile?.completion_percentage || 0

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Chargement de votre dossier...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!currentUser || currentUser.user_type !== "tenant") {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-red-600">Accès non autorisé</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/tenant/dashboard" className="text-blue-600 hover:underline flex items-center mb-4">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour au tableau de bord
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Mon dossier de location</h1>
            <p className="text-gray-600">Complétez votre dossier pour optimiser vos chances d'obtenir un logement</p>
          </div>
          <Badge variant={completionPercentage >= 80 ? "default" : "secondary"} className="text-lg px-4 py-2">
            {completionPercentage}% complété
          </Badge>
        </div>

        {/* Progression */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-4">
              <Progress value={completionPercentage} className="h-3" />
            </div>
            <div className="flex justify-between text-sm">
              <span className={currentStep >= 1 ? "text-blue-600 font-medium" : "text-gray-500"}>
                Informations personnelles
              </span>
              <span className={currentStep >= 2 ? "text-blue-600 font-medium" : "text-gray-500"}>
                Situation professionnelle
              </span>
              <span className={currentStep >= 3 ? "text-blue-600 font-medium" : "text-gray-500"}>
                Documents justificatifs
              </span>
              <span className={currentStep >= 4 ? "text-blue-600 font-medium" : "text-gray-500"}>
                Garant (optionnel)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Étape 1: Informations personnelles */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Informations personnelles et projet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Type de location</Label>
                <RadioGroup
                  value={formData.rental_type || "alone"}
                  onValueChange={(value) => setFormData({ ...formData, rental_type: value })}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="alone" id="alone" />
                    <Label htmlFor="alone">Je loue seul(e)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="couple" id="couple" />
                    <Label htmlFor="couple">En couple</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="colocation" id="colocation" />
                    <Label htmlFor="colocation">En colocation</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="family" id="family" />
                    <Label htmlFor="family">En famille</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="number_of_tenants">Nombre total de locataires</Label>
                <Select
                  value={formData.number_of_tenants?.toString() || "1"}
                  onValueChange={(value) => setFormData({ ...formData, number_of_tenants: Number.parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? "personne" : "personnes"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="presentation_message">Message de présentation</Label>
                <Textarea
                  id="presentation_message"
                  placeholder="Présentez-vous en quelques lignes : qui êtes-vous, pourquoi cherchez-vous un logement, etc."
                  value={formData.presentation_message || ""}
                  onChange={(e) => setFormData({ ...formData, presentation_message: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="desired_move_date">Date d'emménagement souhaitée</Label>
                  <Input
                    id="desired_move_date"
                    type="date"
                    value={formData.desired_move_date || ""}
                    onChange={(e) => setFormData({ ...formData, desired_move_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="rental_duration">Durée de location souhaitée</Label>
                  <Select
                    value={formData.rental_duration || ""}
                    onValueChange={(value) => setFormData({ ...formData, rental_duration: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6months">6 mois</SelectItem>
                      <SelectItem value="1year">1 an</SelectItem>
                      <SelectItem value="2years">2 ans</SelectItem>
                      <SelectItem value="3years">3 ans</SelectItem>
                      <SelectItem value="longterm">Long terme (3+ ans)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between">
                <div></div>
                <Button
                  onClick={() => {
                    handleUpdateData(formData)
                    nextStep()
                  }}
                >
                  Suivant
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Étape 2: Situation professionnelle */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="h-5 w-5 mr-2" />
                Situation professionnelle et financière
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="employment_status">Statut professionnel</Label>
                <Select
                  value={formData.employment_status || ""}
                  onValueChange={(value) => setFormData({ ...formData, employment_status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez votre statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
                    placeholder="Ex: Ingénieur, Professeur..."
                    value={formData.profession || ""}
                    onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="company">Entreprise</Label>
                  <Input
                    id="company"
                    placeholder="Nom de l'entreprise"
                    value={formData.company || ""}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="monthly_income">Revenus nets mensuels (€)</Label>
                  <Input
                    id="monthly_income"
                    type="number"
                    placeholder="2500"
                    value={formData.monthly_income || ""}
                    onChange={(e) => setFormData({ ...formData, monthly_income: Number.parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="additional_income">Revenus complémentaires (€)</Label>
                  <Input
                    id="additional_income"
                    type="number"
                    placeholder="0"
                    value={formData.additional_income || ""}
                    onChange={(e) => setFormData({ ...formData, additional_income: Number.parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Précédent
                </Button>
                <Button
                  onClick={() => {
                    handleUpdateData(formData)
                    nextStep()
                  }}
                >
                  Suivant
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Étape 3: Documents justificatifs */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Documents justificatifs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {RENTAL_FILE_ITEMS.filter((item) => item.category !== "guarantor").map((item) => {
                  const files = rentalFile?.[item.key]
                  const isUploading = uploadingItem === item.key
                  const hasFiles = files && (Array.isArray(files) ? files.length > 0 : files.trim() !== "")

                  return (
                    <div key={item.key} className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium flex items-center">
                            {item.name}
                            {item.required && <span className="text-red-500 ml-1">*</span>}
                            {hasFiles && <Check className="h-4 w-4 text-green-600 ml-2" />}
                          </h4>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                        <Badge variant={item.required ? "default" : "secondary"}>
                          {item.required ? "Requis" : "Optionnel"}
                        </Badge>
                      </div>

                      {/* Zone d'upload */}
                      <div className="relative">
                        <input
                          type="file"
                          multiple={item.type === "multiple"}
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(item.key, e.target.files)}
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
                              <p className="text-sm text-gray-600">
                                {hasFiles ? "Remplacer" : "Ajouter"}{" "}
                                {item.type === "multiple" ? "les fichiers" : "le fichier"}
                              </p>
                              <p className="text-xs text-gray-500">PDF, JPG, PNG (max 10MB)</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Affichage des fichiers */}
                      {hasFiles && (
                        <div className="space-y-2">
                          {Array.isArray(files) ? (
                            files.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded"
                              >
                                <div className="flex items-center">
                                  <File className="h-4 w-4 text-green-600 mr-2" />
                                  <span className="text-sm text-green-800">Document {index + 1}</span>
                                </div>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                              <div className="flex items-center">
                                <File className="h-4 w-4 text-green-600 mr-2" />
                                <span className="text-sm text-green-800">Document uploadé</span>
                              </div>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Précédent
                </Button>
                <Button onClick={nextStep}>
                  Suivant
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Étape 4: Garant */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Garant (optionnel mais recommandé)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_guarantor"
                  checked={formData.has_guarantor || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, has_guarantor: checked })}
                />
                <Label htmlFor="has_guarantor">J'ai un garant</Label>
              </div>

              {formData.has_guarantor && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-medium">Type de garant</Label>
                    <RadioGroup
                      value={formData.guarantor_type || "physical"}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          guarantor_type: value,
                          guarantor_info: { ...formData.guarantor_info, type: value },
                        })
                      }
                      className="mt-2"
                    >
                      {GUARANTOR_TYPES.map((type) => (
                        <div key={type.value} className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value={type.value} id={type.value} />
                            <Label htmlFor={type.value} className="font-medium">
                              {type.label}
                            </Label>
                          </div>
                          <p className="text-sm text-gray-600 ml-6">{type.description}</p>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {formData.guarantor_type === "physical" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="guarantor_first_name">Prénom du garant</Label>
                          <Input
                            id="guarantor_first_name"
                            value={formData.guarantor_info?.first_name || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                guarantor_info: { ...formData.guarantor_info, first_name: e.target.value },
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="guarantor_last_name">Nom du garant</Label>
                          <Input
                            id="guarantor_last_name"
                            value={formData.guarantor_info?.last_name || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                guarantor_info: { ...formData.guarantor_info, last_name: e.target.value },
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="guarantor_profession">Profession du garant</Label>
                          <Input
                            id="guarantor_profession"
                            value={formData.guarantor_info?.profession || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                guarantor_info: { ...formData.guarantor_info, profession: e.target.value },
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="guarantor_income">Revenus du garant (€/mois)</Label>
                          <Input
                            id="guarantor_income"
                            type="number"
                            value={formData.guarantor_info?.monthly_income || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                guarantor_info: {
                                  ...formData.guarantor_info,
                                  monthly_income: Number.parseFloat(e.target.value),
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.guarantor_type === "moral" && (
                    <div>
                      <Label htmlFor="guarantor_company">Nom de l'organisme</Label>
                      <Input
                        id="guarantor_company"
                        placeholder="Ex: Entreprise, Association..."
                        value={formData.guarantor_info?.company_name || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            guarantor_info: { ...formData.guarantor_info, company_name: e.target.value },
                          })
                        }
                      />
                    </div>
                  )}

                  {formData.guarantor_type === "visale" && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">Garantie Visale</h4>
                      <p className="text-sm text-blue-700 mb-3">
                        La garantie Visale est gratuite et couvre les loyers impayés. Vous devez faire votre demande sur
                        le site d'Action Logement.
                      </p>
                      <Button variant="outline" size="sm" asChild>
                        <a href="https://www.visale.fr" target="_blank" rel="noopener noreferrer">
                          Faire ma demande Visale
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Précédent
                </Button>
                <Button
                  onClick={() => {
                    handleUpdateData(formData)
                    toast.success("Dossier mis à jour !")
                  }}
                >
                  Finaliser mon dossier
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
