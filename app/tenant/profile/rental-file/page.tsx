"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, ArrowRight, Users, Shield, CheckCircle, Plus, AlertCircle, X, Eye, User, Heart, Euro } from "lucide-react"
import { rentalFileService, RENTAL_SITUATIONS, GUARANTOR_TYPES } from "@/lib/rental-file-service"
import { authService } from "@/lib/auth-service"
import { ImprovedPersonProfile } from "@/components/rental-file/improved-person-profile"
import { RentalFileViewer } from "@/components/rental-file/rental-file-viewer"
import { toast } from "sonner"
import Link from "next/link"
import { DossierFacileIntegration } from "@/components/rental-file/dossierfacile-integration"
import { DossierFacilePersonProfile } from "@/components/rental-file/dossierfacile-person-profile"
import { CompletionDiagnosticTooltip } from "@/components/rental-file/completion-diagnostic-tooltip"
import { GuarantorUploadSection } from "@/components/rental-file/guarantor-upload-section"

export default function RentalFilePage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [rentalFile, setRentalFile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  const [showViewer, setShowViewer] = useState(false)

  const totalSteps = 3 // 3 étapes : Locataire principal, Colocataires, Garants

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

  // Gérer le retour du callback DossierFacile Connect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const dossierfacileStatus = urlParams.get('dossierfacile')
    const error = urlParams.get('error')

    if (dossierfacileStatus === 'success') {
      toast.success("Dossier DossierFacile importé avec succès !")
      // Recharger les données
      window.location.reload()
    } else if (error) {
      toast.error(`Erreur DossierFacile: ${error}`)
    }
  }, [])

  const handleUpdateData = async (newData: any) => {
    if (!currentUser) return

    try {
      const updatedData = { ...rentalFile, ...newData }
      const updatedFile = await rentalFileService.updateRentalFile(currentUser.id, updatedData)
      setRentalFile(updatedFile)
    } catch (error) {
      console.error("Erreur mise à jour:", error)
      toast.error("Erreur lors de la mise à jour")
    }
  }

  const updateMainTenant = (updatedProfile: any) => {
    handleUpdateData({ main_tenant: updatedProfile })
  }

  const addCotenant = () => {
    const newCotenant = rentalFileService.createEmptyTenantProfile("cotenant")
    const updatedCotenants = [...(rentalFile.cotenants || []), newCotenant]
    handleUpdateData({ cotenants: updatedCotenants })
  }

  const removeCotenant = (index: number) => {
    const updatedCotenants = rentalFile.cotenants.filter((_: any, i: number) => i !== index)
    handleUpdateData({ cotenants: updatedCotenants })
  }

  const updateCotenant = (index: number, updatedCotenant: any) => {
    const updatedCotenants = [...(rentalFile.cotenants || [])]
    updatedCotenants[index] = updatedCotenant
    handleUpdateData({ cotenants: updatedCotenants })
  }

  const addGuarantor = () => {
    const newGuarantor = {
      type: "physical",
      personal_info: rentalFileService.createEmptyTenantProfile("main"),
    }

    const updatedGuarantors = [...(rentalFile.guarantors || []), newGuarantor]
    handleUpdateData({ guarantors: updatedGuarantors })
  }

  const removeGuarantor = (index: number) => {
    const updatedGuarantors = rentalFile.guarantors.filter((_: any, i: number) => i !== index)
    handleUpdateData({ guarantors: updatedGuarantors })
  }

  const updateGuarantor = (index: number, updatedGuarantor: any) => {
    const updatedGuarantors = [...(rentalFile.guarantors || [])]
    updatedGuarantors[index] = updatedGuarantor
    handleUpdateData({ guarantors: updatedGuarantors })
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

  const validateDossier = async () => {
    try {
      const updatedFile = await rentalFileService.updateRentalFile(currentUser.id, {
        ...rentalFile,
        status: "validated",
      })
      setRentalFile(updatedFile)
      toast.success("Dossier validé avec succès !")
    } catch (error) {
      console.error("Erreur validation:", error)
      toast.error("Erreur lors de la validation")
    }
  }

  // Fonction pour obtenir l'icône de chaque étape principale
  const getStepIcon = (step: number) => {
    switch (step) {
      case 1:
        return <User className="h-4 w-4" />
      case 2:
        return <Users className="h-4 w-4" />
      case 3:
        return <Shield className="h-4 w-4" />
      default:
        return <CheckCircle className="h-4 w-4" />
    }
  }

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1:
        return "Locataire principal"
      case 2:
        return "Colocataires"
      case 3:
        return "Garants"
      default:
        return "Étape"
    }
  }

  // Fonction pour obtenir l'icône de situation de location
  const getSituationIcon = (situation: string) => {
    switch (situation) {
      case "alone":
        return <User className="h-6 w-6" />
      case "couple":
        return <Heart className="h-6 w-6" />
      case "colocation":
        return <Users className="h-6 w-6" />
      default:
        return <User className="h-6 w-6" />
    }
  }

  // Fonction pour obtenir l'icône de type de garant
  const getGuarantorIcon = (type: string) => {
    switch (type) {
      case "physical":
        return <User className="h-6 w-6" />
      case "organism":
        return <Shield className="h-6 w-6" />
      case "moral_person":
        return <Users className="h-6 w-6" />
      case "none":
        return <X className="h-6 w-6" />
      default:
        return <Shield className="h-6 w-6" />
    }
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

  if (showViewer) {
    return (
      <div className="container mx-auto py-8 max-w-6xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Button onClick={() => setShowViewer(false)} variant="outline" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à l'édition
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Aperçu de votre dossier</h1>
              <p className="text-gray-600">Vérifiez et validez votre dossier de location</p>
            </div>
          </div>

          <RentalFileViewer rentalFile={rentalFile} onValidate={validateDossier} />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/tenant/dashboard" className="text-blue-600 hover:underline flex items-center mb-4">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour au tableau de bord
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Mon dossier de location</h1>
            <p className="text-gray-600">Créez votre dossier numérique certifié conforme à DossierFacile</p>
          </div>
          <div className="text-right space-y-2">
            <div className="flex items-center space-x-2">
              <CompletionDiagnosticTooltip rentalFile={rentalFile} />
              <Button onClick={() => setShowViewer(true)} variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Aperçu
              </Button>
            </div>
          </div>
        </div>

        {/* Choix de la méthode de création */}
        <DossierFacileIntegration 
          profile={{ ...rentalFile, tenant_id: currentUser?.id }} 
          onUpdate={handleUpdateData} 
        />

        {/* Progression principale avec icônes */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-4">
              <Progress value={(currentStep / totalSteps) * 100} className="h-3" />
            </div>
            <div className="flex justify-between">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex flex-col items-center space-y-2">
                  <div
                    className={`p-2 rounded-full ${
                      currentStep >= step ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {getStepIcon(step)}
                  </div>
                  <span className={`text-sm font-medium ${currentStep >= step ? "text-blue-600" : "text-gray-500"}`}>
                    {getStepTitle(step)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* <CompletionDiagnostic rentalFile={rentalFile} /> */}

        {/* Étape 1: Locataire principal avec structure complète */}
        {currentStep === 1 && (
          <div className="space-y-6">
            {rentalFile?.creation_method === "dossierfacile" ? (
              <DossierFacilePersonProfile
                profile={rentalFile?.main_tenant || {}}
                onUpdate={updateMainTenant}
                title="Locataire principal"
              />
            ) : (
              <ImprovedPersonProfile
                profile={rentalFile?.main_tenant || {}}
                onUpdate={updateMainTenant}
                title="Locataire principal"
              />
            )}

            <div className="flex justify-end">
              <Button onClick={nextStep}>
                Suivant
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Étape 2: Colocataires */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Constituez-vous un dossier de location afin d'habiter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {RENTAL_SITUATIONS.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => handleUpdateData({ rental_situation: option.value })}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                        rentalFile?.rental_situation === option.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div
                          className={`p-3 rounded-full ${
                            rentalFile?.rental_situation === option.value
                              ? "bg-blue-100 text-blue-600"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {getSituationIcon(option.value)}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 mb-1">{option.label}</h3>
                          <p className="text-sm text-gray-600">{option.description}</p>
                        </div>
                        {rentalFile?.rental_situation === option.value && (
                          <Badge variant="default" className="text-xs">
                            Sélectionné
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Message de présentation */}
            <Card>
              <CardHeader>
                <CardTitle>Message de présentation</CardTitle>
                <CardDescription>
                  Présentez-vous aux propriétaires pour vous démarquer des autres candidats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    id="presentation_message"
                    placeholder="Présentez-vous en quelques lignes : qui vous êtes, votre situation, pourquoi vous cherchez un logement, vos qualités en tant que locataire..."
                    rows={4}
                    value={rentalFile?.presentation_message || ""}
                    onChange={(e) => handleUpdateData({ presentation_message: e.target.value })}
                    className="resize-none"
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">
                      Ce message sera visible par les propriétaires. Soyez authentique et rassurant.
                    </p>
                    <p className="text-xs text-gray-400">
                      {(rentalFile?.presentation_message || "").length}/500 caractères
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Conseils pour un bon message :</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Présentez votre situation professionnelle et personnelle</li>
                    <li>• Expliquez pourquoi vous cherchez ce logement</li>
                    <li>• Mettez en avant vos qualités de locataire</li>
                    <li>• Restez authentique et professionnel</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {(rentalFile?.rental_situation === "colocation" || rentalFile?.rental_situation === "couple") && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>
                        {rentalFile?.rental_situation === "couple" ? "Votre conjoint(e)" : "Vos colocataires"}
                      </span>
                      <Button onClick={addCotenant} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(!rentalFile?.cotenants || rentalFile.cotenants.length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Aucun {rentalFile?.rental_situation === "couple" ? "conjoint(e)" : "colocataire"} ajouté</p>
                        <p className="text-sm">Cliquez sur "Ajouter" pour commencer</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {rentalFile?.cotenants?.map((cotenant: any, index: number) => (
                  rentalFile?.creation_method === "dossierfacile" ? (
                    <DossierFacilePersonProfile
                      key={index}
                      profile={cotenant}
                      onUpdate={(updatedProfile) => updateCotenant(index, updatedProfile)}
                      onRemove={() => removeCotenant(index)}
                      title={`${rentalFile?.rental_situation === "couple" ? "Conjoint(e)" : `Colocataire ${index + 1}`}`}
                      canRemove
                    />
                  ) : (
                    <ImprovedPersonProfile
                      key={index}
                      profile={cotenant}
                      onUpdate={(updatedProfile) => updateCotenant(index, updatedProfile)}
                      onRemove={() => removeCotenant(index)}
                      title={`${rentalFile?.rental_situation === "couple" ? "Conjoint(e)" : `Colocataire ${index + 1}`}`}
                      canRemove
                    />
                  )
                ))}
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
          </div>
        )}

        {/* Étape 3: Garants */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Garant
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

                {(!rentalFile?.guarantors || rentalFile.guarantors.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucun garant ajouté</p>
                    <p className="text-sm">Cliquez sur "Ajouter un garant" pour commencer</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {rentalFile?.guarantors?.map((guarantor: any, index: number) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Garant {index + 1}</span>
                    <Button onClick={() => removeGuarantor(index)} size="sm" variant="outline">
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">Type de garant</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {GUARANTOR_TYPES.map((type) => (
                        <div
                          key={type.value}
                          onClick={() => {
                            const updatedGuarantor = { ...guarantor, type: type.value }
                            if (type.value === "physical" && !updatedGuarantor.personal_info) {
                              updatedGuarantor.personal_info = rentalFileService.createEmptyTenantProfile("main")
                            }
                            updateGuarantor(index, updatedGuarantor)
                          }}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                            guarantor.type === type.value
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex flex-col items-center text-center space-y-3">
                            <div
                              className={`p-3 rounded-full ${
                                guarantor.type === type.value
                                  ? "bg-blue-100 text-blue-600"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {getGuarantorIcon(type.value)}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">{type.label}</h4>
                              <p className="text-xs text-gray-600">{type.description}</p>
                            </div>
                            {guarantor.type === type.value && (
                              <Badge variant="default" className="text-xs">
                                Sélectionné
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <GuarantorUploadSection
                    guarantor={guarantor}
                    onUpdate={(updatedGuarantor) => updateGuarantor(index, updatedGuarantor)}
                  />

                  {guarantor.type === "physical" && guarantor.personal_info && (
                    <div className="space-y-6">
                      {rentalFile?.creation_method === "dossierfacile" ? (
                        <DossierFacilePersonProfile
                          profile={guarantor.personal_info}
                          onUpdate={(updatedProfile) => {
                            const updatedGuarantor = { ...guarantor, personal_info: updatedProfile }
                            updateGuarantor(index, updatedGuarantor)
                          }}
                          title="Informations du garant"
                        />
                      ) : (
                        <ImprovedPersonProfile
                          profile={guarantor.personal_info}
                          onUpdate={(updatedProfile) => {
                            const updatedGuarantor = { ...guarantor, personal_info: updatedProfile }
                            updateGuarantor(index, updatedGuarantor)
                          }}
                          title="Informations du garant"
                        />
                      )}
                      
                      {/* Section revenus du garant */}
                      <Card className="border-orange-200 bg-orange-50/50">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-lg flex items-center space-x-2">
                            <Euro className="h-5 w-5 text-orange-600" />
                            <span>Revenus du garant</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`guarantor_income_${index}`}>Revenus mensuels nets (€) *</Label>
                              <Input
                                id={`guarantor_income_${index}`}
                                type="number"
                                placeholder="3000"
                                value={guarantor.monthly_income || ""}
                                onChange={(e) => {
                                  const updatedGuarantor = { ...guarantor, monthly_income: parseFloat(e.target.value) || 0 }
                                  updateGuarantor(index, updatedGuarantor)
                                }}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`guarantor_contract_${index}`}>Type de contrat</Label>
                              <Select
                                value={guarantor.contract_type || ""}
                                onValueChange={(value) => {
                                  const updatedGuarantor = { ...guarantor, contract_type: value }
                                  updateGuarantor(index, updatedGuarantor)
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionnez le type de contrat" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="cdi_confirmed">CDI confirmé</SelectItem>
                                  <SelectItem value="cdi_trial">CDI en période d'essai</SelectItem>
                                  <SelectItem value="cdd_long">CDD long terme (12+ mois)</SelectItem>
                                  <SelectItem value="cdd_short">CDD court terme (&lt;12 mois)</SelectItem>
                                  <SelectItem value="freelance">Freelance/Indépendant</SelectItem>
                                  <SelectItem value="retired">Retraité</SelectItem>
                                  <SelectItem value="civil_servant">Fonctionnaire</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div className="bg-orange-100 p-3 rounded-lg">
                            <p className="text-sm text-orange-800">
                              <strong>Important :</strong> Les revenus du garant sont utilisés pour calculer votre score de compatibilité. 
                              Un garant avec des revenus élevés améliore vos chances d'obtenir le logement.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {guarantor.type === "none" && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-700">
                        Vous avez choisi de ne pas ajouter de garant. Cela peut réduire vos chances d'obtenir un
                        logement.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  Votre dossier est prêt !
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{completionPercentage}%</div>
                    <div className="text-sm text-gray-600">Complété</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {1 + (rentalFile?.cotenants?.length || 0) + (rentalFile?.guarantors?.length || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Personnes dans le dossier</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button onClick={() => setShowViewer(true)} className="flex-1">
                    <Eye className="h-4 w-4 mr-2" />
                    Aperçu et validation
                  </Button>
                  <Button variant="outline" asChild className="flex-1 bg-transparent">
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
