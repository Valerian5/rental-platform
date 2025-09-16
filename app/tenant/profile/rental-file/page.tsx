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
import { ArrowLeft, ArrowRight, Users, Shield, CheckCircle, Plus, AlertCircle, AlertTriangle, X, Eye, User, Heart, Euro } from "lucide-react"
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

        {/* Explicatif sur l'importance des informations pour le scoring */}
        <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-start">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-3 text-lg">Pourquoi ces informations sont-elles importantes ?</h3>
                <p className="text-green-800 mb-4">
                  Chaque information que vous renseignez contribue à calculer votre <strong>score de compatibilité</strong> avec les logements. 
                  Plus votre dossier est complet et précis, plus votre score sera élevé et vos chances d'obtenir le logement augmenteront.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/60 p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-900 mb-2 flex items-center">
                      <Euro className="h-4 w-4 mr-2" />
                      Revenus et stabilité
                    </h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• Revenus élevés = score plus élevé</li>
                      <li>• CDI confirmé = bonus maximum</li>
                      <li>• Ancienneté = stabilité professionnelle</li>
                    </ul>
                  </div>
                  <div className="bg-white/60 p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-900 mb-2 flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      Garants et sécurité
                    </h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• Garant avec revenus élevés = sécurité</li>
                      <li>• Informations complètes = confiance</li>
                      <li>• Dossier détaillé = meilleure évaluation</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
            <Card className="border-l-4 border-l-purple-500 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-200">
                <CardTitle className="flex items-center">
                  <div className="bg-purple-100 p-2 rounded-full mr-3">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <span className="text-lg font-semibold text-purple-900">Constituez-vous un dossier de location</span>
                    <p className="text-sm text-purple-700">Sélectionnez votre situation d'habitation</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {RENTAL_SITUATIONS.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => handleUpdateData({ rental_situation: option.value })}
                      className={`p-6 rounded-lg border-2 cursor-pointer transition-all hover:scale-105 ${
                        rentalFile?.rental_situation === option.value
                          ? "border-purple-500 bg-purple-50 shadow-md"
                          : "border-gray-200 hover:border-purple-300 hover:bg-purple-25"
                      }`}
                    >
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div
                          className={`p-4 rounded-full ${
                            rentalFile?.rental_situation === option.value
                              ? "bg-purple-100 text-purple-600"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {getSituationIcon(option.value)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">{option.label}</h3>
                          <p className="text-sm text-gray-600">{option.description}</p>
                        </div>
                        {rentalFile?.rental_situation === option.value && (
                          <Badge className="bg-purple-100 text-purple-800 text-xs">
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
            <Card className="border-l-4 border-l-pink-500 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 border-b border-pink-200">
                <CardTitle className="flex items-center">
                  <div className="bg-pink-100 p-2 rounded-full mr-3">
                    <Heart className="h-5 w-5 text-pink-600" />
                  </div>
                  <div>
                    <span className="text-lg font-semibold text-pink-900">Message de présentation</span>
                    <p className="text-sm text-pink-700">Présentez-vous aux propriétaires pour vous démarquer</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
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
                <Card className="border-l-4 border-l-orange-500 shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="bg-orange-100 p-2 rounded-full mr-3">
                          <Users className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <span className="text-lg font-semibold text-orange-900">
                            {rentalFile?.rental_situation === "couple" ? "Votre conjoint(e)" : "Vos colocataires"}
                          </span>
                          <p className="text-sm text-orange-700">
                            {rentalFile?.rental_situation === "couple" 
                              ? "Ajoutez les informations de votre conjoint(e)" 
                              : "Ajoutez les informations de vos colocataires"}
                          </p>
                        </div>
                      </div>
                      <Button onClick={addCotenant} size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {(!rentalFile?.cotenants || rentalFile.cotenants.length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        <div className="bg-orange-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                          <Users className="h-8 w-8 text-orange-400" />
                        </div>
                        <p className="text-lg font-medium text-gray-700 mb-2">
                          Aucun {rentalFile?.rental_situation === "couple" ? "conjoint(e)" : "colocataire"} ajouté
                        </p>
                        <p className="text-sm text-gray-500">
                          Cliquez sur "Ajouter" pour commencer à renseigner les informations
                        </p>
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
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                  <div className="flex items-start">
                    <div className="bg-blue-100 p-2 rounded-full mr-4">
                      <AlertCircle className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-blue-900 mb-2 text-lg">Pourquoi ajouter un garant ?</h3>
                      <p className="text-blue-800 mb-3">
                        Un garant renforce considérablement votre dossier et rassure les propriétaires. Il s'engage à payer le loyer si vous ne pouvez pas le faire.
                      </p>
                      <div className="bg-white/60 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                          <Euro className="h-4 w-4 mr-2" />
                          Impact sur votre score de compatibilité
                        </h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• <strong>Revenus du garant :</strong> Plus ils sont élevés, plus votre score augmente</li>
                          <li>• <strong>Type de contrat :</strong> CDI confirmé = bonus maximum</li>
                          <li>• <strong>Ancienneté :</strong> Stabilité professionnelle = confiance accrue</li>
                          <li>• <strong>Informations complètes :</strong> Dossier détaillé = meilleure évaluation</li>
                        </ul>
                      </div>
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
              <Card key={index} className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Shield className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <span className="text-lg font-semibold text-blue-900">Garant {index + 1}</span>
                        <p className="text-sm text-blue-700">Informations du garant</p>
                      </div>
                    </div>
                    <Button onClick={() => removeGuarantor(index)} size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                      <X className="h-4 w-4 mr-1" />
                      Supprimer
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <Shield className="h-5 w-5 mr-2 text-blue-600" />
                      Type de garant
                    </h3>
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
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-105 ${
                            guarantor.type === type.value
                              ? "border-blue-500 bg-blue-50 shadow-md"
                              : "border-gray-200 hover:border-blue-300 hover:bg-blue-25"
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
                              <Badge className="bg-blue-100 text-blue-800 text-xs">
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
                    </div>
                  )}

                  {guarantor.type === "none" && (
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-lg border border-orange-200">
                      <div className="flex items-start">
                        <div className="bg-orange-100 p-2 rounded-full mr-4">
                          <AlertTriangle className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-orange-900 mb-2">Aucun garant sélectionné</h4>
                          <p className="text-orange-800 mb-3">
                            Vous avez choisi de ne pas ajouter de garant. Cela peut réduire vos chances d'obtenir un logement.
                          </p>
                          <div className="bg-white/60 p-3 rounded-lg border border-orange-200">
                            <p className="text-sm text-orange-700">
                              <strong>Conseil :</strong> Un garant renforce considérablement votre dossier et améliore votre score de compatibilité.
                            </p>
                          </div>
                        </div>
                      </div>
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
