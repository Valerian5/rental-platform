"use client"

import { Input } from "@/components/ui/input"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  ArrowRight,
  Users,
  Shield,
  CheckCircle,
  Plus,
  AlertCircle,
  X,
  Eye,
  User,
  Home,
  Heart,
  Upload,
} from "lucide-react"
import { rentalFileService, RENTAL_SITUATIONS, GUARANTOR_TYPES } from "@/lib/rental-file-service"
import { authService } from "@/lib/auth-service"
import { ImprovedPersonProfile } from "@/components/rental-file/improved-person-profile"
import { RentalFileViewer } from "@/components/rental-file/rental-file-viewer"
import { toast } from "sonner"
import Link from "next/link"
import { CompletionDiagnostic } from "@/components/rental-file/completion-diagnostic"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function RentalFilePage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [rentalFile, setRentalFile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  const [showViewer, setShowViewer] = useState(false)

  const totalSteps = 3

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
    } catch (error) {
      console.error("Erreur mise à jour:", error)
      toast.error("Erreur lors de la mise à jour")
    }
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
        return <Home className="h-6 w-6" />
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
              <Badge variant={completionPercentage >= 80 ? "default" : "secondary"} className="text-lg px-4 py-2">
                {completionPercentage}% complété
              </Badge>
              <Button onClick={() => setShowViewer(true)} variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Aperçu
              </Button>
            </div>
          </div>
        </div>

        {/* Nouveau bouton pour l'upload de documents */}
        <Card className="border-2 border-dashed border-blue-300 bg-blue-50">
          <CardContent className="p-6 text-center">
            <Upload className="h-12 w-12 mx-auto mb-4 text-blue-500" />
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Nouveau système d'upload</h3>
            <p className="text-blue-700 mb-4">
              Utilisez notre nouveau système d'upload avec validation automatique et preview des documents
            </p>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/tenant/documents/upload-new">
                <Upload className="h-4 w-4 mr-2" />
                Uploader mes documents
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Progression principale avec icônes */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-4">
              <Progress value={(currentStep / totalSteps) * 100} className="h-3" />
            </div>
            <div className="flex justify-between">
              <div className="flex flex-col items-center space-y-2">
                <div
                  className={`p-2 rounded-full ${currentStep >= 1 ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}
                >
                  {getStepIcon(1)}
                </div>
                <span className={`text-sm font-medium ${currentStep >= 1 ? "text-blue-600" : "text-gray-500"}`}>
                  Locataire principal
                </span>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div
                  className={`p-2 rounded-full ${currentStep >= 2 ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}
                >
                  {getStepIcon(2)}
                </div>
                <span className={`text-sm font-medium ${currentStep >= 2 ? "text-blue-600" : "text-gray-500"}`}>
                  Colocataires
                </span>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div
                  className={`p-2 rounded-full ${currentStep >= 3 ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}
                >
                  {getStepIcon(3)}
                </div>
                <span className={`text-sm font-medium ${currentStep >= 3 ? "text-blue-600" : "text-gray-500"}`}>
                  Garants
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <CompletionDiagnostic rentalFile={rentalFile} />

        {/* Étape 1: Locataire principal */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <ImprovedPersonProfile
              profile={rentalFile?.main_tenant || {}}
              onUpdate={(updatedProfile) => handleUpdateData({ main_tenant: updatedProfile })}
              title="Locataire principal"
            />

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
                  <Label htmlFor="presentation_message">Votre message de présentation *</Label>
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

            <CompletionDiagnostic rentalFile={rentalFile} />

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
                  <ImprovedPersonProfile
                    key={index}
                    profile={cotenant}
                    onUpdate={(updatedProfile) => updateCotenant(index, updatedProfile)}
                    onRemove={() => removeCotenant(index)}
                    title={`${rentalFile?.rental_situation === "couple" ? "Conjoint(e)" : `Colocataire ${index + 1}`}`}
                    canRemove
                  />
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

            <CompletionDiagnostic rentalFile={rentalFile} />

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

                  {guarantor.type === "physical" && guarantor.personal_info && (
                    <ImprovedPersonProfile
                      profile={guarantor.personal_info}
                      onUpdate={(updatedProfile) => {
                        const updatedGuarantor = { ...guarantor, personal_info: updatedProfile }
                        updateGuarantor(index, updatedGuarantor)
                      }}
                      title="Informations du garant"
                    />
                  )}

                  {guarantor.type === "organism" && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Type d'organisme</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div
                            onClick={() => {
                              const updatedGuarantor = { ...guarantor, organism_type: "visale" }
                              updateGuarantor(index, updatedGuarantor)
                            }}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              guarantor.organism_type === "visale"
                                ? "border-green-500 bg-green-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <Shield className="h-5 w-5 text-green-600" />
                              <div>
                                <h5 className="font-medium">Garantie Visale</h5>
                                <p className="text-sm text-gray-600">Gratuite et sécurisée</p>
                              </div>
                            </div>
                          </div>
                          <div
                            onClick={() => {
                              const updatedGuarantor = { ...guarantor, organism_type: "autre" }
                              updateGuarantor(index, updatedGuarantor)
                            }}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              guarantor.organism_type === "autre"
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <Users className="h-5 w-5 text-blue-600" />
                              <div>
                                <h5 className="font-medium">Autre organisme</h5>
                                <p className="text-sm text-gray-600">Organisme privé</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {guarantor.organism_type === "visale" && (
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h4 className="font-medium text-green-800 mb-2">Garantie Visale</h4>
                          <p className="text-sm text-green-700 mb-3">
                            La garantie Visale est gratuite et couvre les loyers impayés. Vous devez faire votre demande
                            sur le site d'Action Logement.
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

                  {guarantor.type === "moral_person" && (
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor={`company_name_${index}`}
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Nom de la personne morale
                        </label>
                        <Input
                          id={`company_name_${index}`}
                          placeholder="Nom de l'entreprise"
                          value={guarantor.company_name || ""}
                          onChange={(e) => {
                            const updatedGuarantor = { ...guarantor, company_name: e.target.value }
                            updateGuarantor(index, updatedGuarantor)
                          }}
                        />
                      </div>

                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          J'ajoute un extrait K bis de la société, ou toute autre pièce justifiant de l'existence légale
                          de la personne.
                        </p>
                      </div>
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
