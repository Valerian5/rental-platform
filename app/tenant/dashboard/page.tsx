"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Upload,
  File,
  Check,
  ArrowLeft,
  ArrowRight,
  User,
  Home,
  Shield,
  FileText,
  AlertCircle,
  CheckCircle,
  Plus,
  X,
} from "lucide-react"
import {
  rentalFileService,
  SITUATION_OPTIONS,
  RENTAL_SITUATIONS,
  CURRENT_HOUSING_TYPES,
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

  const totalSteps = 4

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (user && user.user_type === "tenant") {
          setCurrentUser(user)

          let fileData = await rentalFileService.getRentalFile(user.id)

          if (!fileData) {
            fileData = await rentalFileService.initializeFromUserData(user.id, user)
          }

          setRentalFile(fileData)
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
      const updatedData = { ...rentalFile, ...newData }
      const updatedFile = await rentalFileService.updateRentalFile(currentUser.id, updatedData)
      setRentalFile(updatedFile)
      toast.success("Informations mises à jour")
    } catch (error) {
      console.error("Erreur mise à jour:", error)
      toast.error("Erreur lors de la mise à jour")
    }
  }

  const handleFileUpload = async (category: string, files: FileList | null) => {
    if (!files || !currentUser) return

    setUploadingItem(category)

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const fileUrls = Array.from(files).map((file) => URL.createObjectURL(file))

      const updatedMainTenant = {
        ...rentalFile.main_tenant,
        documents: {
          ...rentalFile.main_tenant.documents,
          [category]: category === "identity" || category === "income_proof" ? fileUrls : fileUrls[0],
        },
      }

      await handleUpdateData({ main_tenant: updatedMainTenant })
      toast.success("Document ajouté avec succès")
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

  const addCotenant = () => {
    const newCotenant = {
      type: "cotenant",
      first_name: "",
      last_name: "",
      birth_date: "",
      birth_place: "",
      nationality: "française",
      situation: "employee",
      monthly_income: 0,
      documents: {
        identity: [],
        income_proof: [],
        tax_notice: "",
      },
    }

    const updatedCotenants = [...(rentalFile.cotenants || []), newCotenant]
    handleUpdateData({ cotenants: updatedCotenants })
  }

  const removeCotenant = (index: number) => {
    const updatedCotenants = rentalFile.cotenants.filter((_: any, i: number) => i !== index)
    handleUpdateData({ cotenants: updatedCotenants })
  }

  const addGuarantor = () => {
    const newGuarantor = {
      type: "physical",
      first_name: "",
      last_name: "",
      birth_date: "",
      monthly_income: 0,
      documents: {
        identity: [],
        income_proof: [],
        tax_notice: "",
      },
    }

    const updatedGuarantors = [...(rentalFile.guarantors || []), newGuarantor]
    handleUpdateData({ guarantors: updatedGuarantors })
  }

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

  const completionPercentage = rentalFile?.completion_percentage || 0
  const validationScore = rentalFile?.validation_score || 0

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
            <p className="text-gray-600">Créez votre dossier numérique certifié pour vos candidatures</p>
          </div>
          <div className="text-right space-y-2">
            <Badge variant={completionPercentage >= 80 ? "default" : "secondary"} className="text-lg px-4 py-2">
              {completionPercentage}% complété
            </Badge>
            <div className="text-sm text-gray-600">
              Score de validation: <span className="font-medium">{validationScore}/100</span>
            </div>
          </div>
        </div>

        {/* Progression */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-4">
              <Progress value={(currentStep / totalSteps) * 100} className="h-3" />
            </div>
            <div className="flex justify-between text-sm">
              <span className={currentStep >= 1 ? "text-blue-600 font-medium" : "text-gray-500"}>
                1. Qui êtes-vous ?
              </span>
              <span className={currentStep >= 2 ? "text-blue-600 font-medium" : "text-gray-500"}>
                2. Votre logement actuel
              </span>
              <span className={currentStep >= 3 ? "text-blue-600 font-medium" : "text-gray-500"}>3. Vos documents</span>
              <span className={currentStep >= 4 ? "text-blue-600 font-medium" : "text-gray-500"}>4. Vos garants</span>
            </div>
          </CardContent>
        </Card>

        {/* Étape 1: Qui êtes-vous ? */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Locataire principal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">Prénom *</Label>
                    <Input
                      id="first_name"
                      value={rentalFile?.main_tenant?.first_name || ""}
                      onChange={(e) =>
                        handleUpdateData({
                          main_tenant: { ...rentalFile.main_tenant, first_name: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Nom *</Label>
                    <Input
                      id="last_name"
                      value={rentalFile?.main_tenant?.last_name || ""}
                      onChange={(e) =>
                        handleUpdateData({
                          main_tenant: { ...rentalFile.main_tenant, last_name: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="birth_date">Date de naissance *</Label>
                    <Input
                      id="birth_date"
                      type="date"
                      value={rentalFile?.main_tenant?.birth_date || ""}
                      onChange={(e) =>
                        handleUpdateData({
                          main_tenant: { ...rentalFile.main_tenant, birth_date: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="birth_place">Lieu de naissance *</Label>
                    <Input
                      id="birth_place"
                      placeholder="Ville, Pays"
                      value={rentalFile?.main_tenant?.birth_place || ""}
                      onChange={(e) =>
                        handleUpdateData({
                          main_tenant: { ...rentalFile.main_tenant, birth_place: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label>Quelle est votre situation ? *</Label>
                  <RadioGroup
                    value={rentalFile?.main_tenant?.situation || "employee"}
                    onValueChange={(value) =>
                      handleUpdateData({
                        main_tenant: { ...rentalFile.main_tenant, situation: value },
                      })
                    }
                    className="mt-2"
                  >
                    {SITUATION_OPTIONS.map((option) => (
                      <div key={option.value} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value={option.value} id={option.value} />
                          <Label htmlFor={option.value} className="font-medium">
                            {option.label}
                          </Label>
                        </div>
                        <p className="text-sm text-gray-600 ml-6">{option.description}</p>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="monthly_income">Revenus nets mensuels (€) *</Label>
                  <Input
                    id="monthly_income"
                    type="number"
                    placeholder="2500"
                    value={rentalFile?.main_tenant?.monthly_income || ""}
                    onChange={(e) =>
                      handleUpdateData({
                        main_tenant: { ...rentalFile.main_tenant, monthly_income: Number.parseFloat(e.target.value) },
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Situation de location</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label>Comment allez-vous louer ? *</Label>
                  <RadioGroup
                    value={rentalFile?.rental_situation || "alone"}
                    onValueChange={(value) => handleUpdateData({ rental_situation: value })}
                    className="mt-2"
                  >
                    {RENTAL_SITUATIONS.map((option) => (
                      <div key={option.value} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value={option.value} id={option.value} />
                          <Label htmlFor={option.value} className="font-medium">
                            {option.label}
                          </Label>
                        </div>
                        <p className="text-sm text-gray-600 ml-6">{option.description}</p>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            {/* Colocataires */}
            {(rentalFile?.rental_situation === "colocation" || rentalFile?.rental_situation === "couple") && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{rentalFile?.rental_situation === "couple" ? "Votre conjoint(e)" : "Vos colocataires"}</span>
                    <Button onClick={addCotenant} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {rentalFile?.cotenants?.map((cotenant: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">
                          {rentalFile?.rental_situation === "couple" ? "Conjoint(e)" : `Colocataire ${index + 1}`}
                        </h4>
                        <Button onClick={() => removeCotenant(index)} size="sm" variant="outline">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input placeholder="Prénom" value={cotenant.first_name} />
                        <Input placeholder="Nom" value={cotenant.last_name} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end">
              <Button onClick={nextStep}>
                Suivant
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Étape 2: Logement actuel */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Home className="h-5 w-5 mr-2" />
                Votre logement actuel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Quelle est votre situation de logement actuelle ? *</Label>
                <RadioGroup
                  value={rentalFile?.current_housing?.type || "tenant"}
                  onValueChange={(value) =>
                    handleUpdateData({
                      current_housing: { ...rentalFile.current_housing, type: value },
                    })
                  }
                  className="mt-2"
                >
                  {CURRENT_HOUSING_TYPES.map((option) => (
                    <div key={option.value} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={option.value} />
                        <Label htmlFor={option.value} className="font-medium">
                          {option.label}
                        </Label>
                      </div>
                      <p className="text-sm text-gray-600 ml-6">{option.description}</p>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {rentalFile?.current_housing?.type === "tenant" && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="current_address">Adresse actuelle</Label>
                    <Input
                      id="current_address"
                      placeholder="Adresse complète"
                      value={rentalFile?.current_housing?.address || ""}
                      onChange={(e) =>
                        handleUpdateData({
                          current_housing: { ...rentalFile.current_housing, address: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="current_rent">Loyer actuel (€)</Label>
                    <Input
                      id="current_rent"
                      type="number"
                      placeholder="800"
                      value={rentalFile?.current_housing?.monthly_rent || ""}
                      onChange={(e) =>
                        handleUpdateData({
                          current_housing: {
                            ...rentalFile.current_housing,
                            monthly_rent: Number.parseFloat(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="departure_date">Date de départ prévue</Label>
                    <Input
                      id="departure_date"
                      type="date"
                      value={rentalFile?.current_housing?.departure_date || ""}
                      onChange={(e) =>
                        handleUpdateData({
                          current_housing: { ...rentalFile.current_housing, departure_date: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
              )}

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

        {/* Étape 3: Documents */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Vos documents justificatifs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {rentalFile?.main_tenant?.situation && (
                <div className="space-y-6">
                  {Object.entries(rentalFileService.getRequiredDocuments(rentalFile.main_tenant.situation)).map(
                    ([key, requirement]: [string, any]) => {
                      const files = rentalFile?.main_tenant?.documents?.[key]
                      const isUploading = uploadingItem === key
                      const hasFiles = files && (Array.isArray(files) ? files.length > 0 : files.trim() !== "")

                      return (
                        <div key={key} className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium flex items-center">
                                {requirement.description}
                                {requirement.required && <span className="text-red-500 ml-1">*</span>}
                                {hasFiles && <Check className="h-4 w-4 text-green-600 ml-2" />}
                              </h4>
                            </div>
                            <Badge variant={requirement.required ? "default" : "secondary"}>
                              {requirement.required ? "Requis" : "Optionnel"}
                            </Badge>
                          </div>

                          {/* Zone d'upload */}
                          <div className="relative">
                            <input
                              type="file"
                              multiple={key === "identity" || key === "income_proof"}
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileUpload(key, e.target.files)}
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
                                    {hasFiles ? "Remplacer" : "Ajouter"} le document
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
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  </div>
                                ))
                              ) : (
                                <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                                  <div className="flex items-center">
                                    <File className="h-4 w-4 text-green-600 mr-2" />
                                    <span className="text-sm text-green-800">Document uploadé</span>
                                  </div>
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    },
                  )}
                </div>
              )}

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

        {/* Étape 4: Garants */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Vos garants
                  </span>
                  <Button onClick={addGuarantor} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un garant
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-800 mb-1">Pourquoi ajouter un garant ?</p>
                      <p className="text-blue-700">
                        Un garant renforce votre dossier et rassure les propriétaires. Il s'engage à payer le loyer si
                        vous ne pouvez pas le faire.
                      </p>
                    </div>
                  </div>
                </div>

                {rentalFile?.guarantors?.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucun garant ajouté</p>
                    <p className="text-sm">Cliquez sur "Ajouter un garant" pour commencer</p>
                  </div>
                )}

                {rentalFile?.guarantors?.map((guarantor: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Garant {index + 1}</h4>
                      <Button
                        onClick={() => {
                          const updatedGuarantors = rentalFile.guarantors.filter((_: any, i: number) => i !== index)
                          handleUpdateData({ guarantors: updatedGuarantors })
                        }}
                        size="sm"
                        variant="outline"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input placeholder="Prénom" value={guarantor.first_name} />
                      <Input placeholder="Nom" value={guarantor.last_name} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  Votre dossier est prêt !
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{completionPercentage}%</div>
                    <div className="text-sm text-gray-600">Complété</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{validationScore}/100</div>
                    <div className="text-sm text-gray-600">Score de validation</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {(rentalFile?.guarantors?.length || 0) + 1}
                    </div>
                    <div className="text-sm text-gray-600">Personnes dans le dossier</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild className="flex-1">
                    <Link href="/properties">Rechercher des logements</Link>
                  </Button>
                  <Button variant="outline" asChild className="flex-1">
                    <Link href="/tenant/dashboard">Retour au tableau de bord</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-start">
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Précédent
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
