"use client"

import { Input } from "@/components/ui/input"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ArrowLeft, ArrowRight, Users, Home, Shield, CheckCircle, Plus, AlertCircle, X } from "lucide-react"
import { rentalFileService, GUARANTOR_TYPES } from "@/lib/rental-file-service"
import { authService } from "@/lib/auth-service"
import { PersonProfileForm } from "@/components/rental-file/person-profile-form"
import { toast } from "sonner"
import Link from "next/link"

export default function RentalFilePage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [rentalFile, setRentalFile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)

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
    } catch (error) {
      console.error("Erreur mise à jour:", error)
      toast.error("Erreur lors de la mise à jour")
    }
  }

  const addCotenant = () => {
    const newCotenant = rentalFileService.createEmptyProfile("cotenant")
    const updatedCotenants = [...(rentalFile.cotenants || []), newCotenant]
    handleUpdateData({ cotenants: updatedCotenants })
  }

  const removeCotenant = (index: number) => {
    const updatedCotenants = rentalFile.cotenants.filter((_: any, i: number) => i !== index)
    handleUpdateData({ cotenants: updatedCotenants })
  }

  const updateCotenant = (index: number, updatedCotenant: any) => {
    const updatedCotenants = [...rentalFile.cotenants]
    updatedCotenants[index] = updatedCotenant
    handleUpdateData({ cotenants: updatedCotenants })
  }

  const addGuarantor = () => {
    const newGuarantor = rentalFileService.createEmptyProfile("guarantor")
    const updatedGuarantors = [...(rentalFile.guarantors || []), newGuarantor]
    handleUpdateData({ guarantors: updatedGuarantors })
  }

  const removeGuarantor = (index: number) => {
    const updatedGuarantors = rentalFile.guarantors.filter((_: any, i: number) => i !== index)
    handleUpdateData({ guarantors: updatedGuarantors })
  }

  const updateGuarantor = (index: number, updatedGuarantor: any) => {
    const updatedGuarantors = [...rentalFile.guarantors]
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
            <p className="text-gray-600">Créez votre dossier numérique certifié pour vos candidatures</p>
          </div>
          <div className="text-right space-y-2">
            <Badge variant={completionPercentage >= 80 ? "default" : "secondary"} className="text-lg px-4 py-2">
              {completionPercentage}% complété
            </Badge>
            <div className="text-sm text-gray-600">
              Score: <span className="font-medium">{validationScore}/100</span>
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
                1. Locataire principal
              </span>
              <span className={currentStep >= 2 ? "text-blue-600 font-medium" : "text-gray-500"}>2. Colocataires</span>
              <span className={currentStep >= 3 ? "text-blue-600 font-medium" : "text-gray-500"}>
                3. Logement actuel
              </span>
              <span className={currentStep >= 4 ? "text-blue-600 font-medium" : "text-gray-500"}>4. Garants</span>
            </div>
          </CardContent>
        </Card>

        {/* Étape 1: Locataire principal */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <PersonProfileForm
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
                  Situation de location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label>Comment allez-vous louer ? *</Label>
                  <RadioGroup
                    value={rentalFile?.rental_situation || "alone"}
                    onValueChange={(value) => handleUpdateData({ rental_situation: value })}
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
                    {rentalFile?.cotenants?.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Aucun {rentalFile?.rental_situation === "couple" ? "conjoint(e)" : "colocataire"} ajouté</p>
                        <p className="text-sm">Cliquez sur "Ajouter" pour commencer</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {rentalFile?.cotenants?.map((cotenant: any, index: number) => (
                  <PersonProfileForm
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

        {/* Étape 3: Logement actuel */}
        {currentStep === 3 && (
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
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="tenant" id="tenant" />
                    <Label htmlFor="tenant">Locataire</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="owner" id="owner" />
                    <Label htmlFor="owner">Propriétaire</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hosted" id="hosted" />
                    <Label htmlFor="hosted">Hébergé</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="student_housing" id="student_housing" />
                    <Label htmlFor="student_housing">Logement étudiant</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="other" />
                    <Label htmlFor="other">Autre</Label>
                  </div>
                </RadioGroup>
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
                    <Label>Type de garant</Label>
                    <RadioGroup
                      value={guarantor.guarantor_type || "person"}
                      onValueChange={(value) => {
                        const updatedGuarantor = { ...guarantor, guarantor_type: value }
                        updateGuarantor(index, updatedGuarantor)
                      }}
                      className="mt-2"
                    >
                      {GUARANTOR_TYPES.map((type) => (
                        <div key={type.value} className="space-y-2">
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

                  {guarantor.guarantor_type === "person" && (
                    <PersonProfileForm
                      profile={guarantor}
                      onUpdate={(updatedProfile) => updateGuarantor(index, updatedProfile)}
                      title=""
                    />
                  )}

                  {guarantor.guarantor_type === "organism" && (
                    <div className="space-y-4">
                      <div>
                        <Label>Type d'organisme</Label>
                        <RadioGroup
                          value={guarantor.organism_name || "visale"}
                          onValueChange={(value) => {
                            const updatedGuarantor = { ...guarantor, organism_name: value }
                            updateGuarantor(index, updatedGuarantor)
                          }}
                          className="mt-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="visale" id={`visale_${index}`} />
                            <Label htmlFor={`visale_${index}`}>Garantie Visale</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="other" id={`other_organism_${index}`} />
                            <Label htmlFor={`other_organism_${index}`}>Autre organisme</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {guarantor.organism_name === "visale" && (
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

                  {guarantor.guarantor_type === "moral_person" && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor={`moral_person_name_${index}`}>Nom de la personne morale</Label>
                        <Input
                          id={`moral_person_name_${index}`}
                          placeholder="Nom de l'entreprise"
                          value={guarantor.moral_person_name || ""}
                          onChange={(e) => {
                            const updatedGuarantor = { ...guarantor, moral_person_name: e.target.value }
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
                      {1 + (rentalFile?.cotenants?.length || 0) + (rentalFile?.guarantors?.length || 0)}
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
