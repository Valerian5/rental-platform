"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft, ArrowRight, Users, Home, Shield, CheckCircle, Plus, AlertCircle, X } from "lucide-react"
import { rentalFileService, RENTAL_SITUATIONS, CURRENT_HOUSING_TYPES } from "@/lib/rental-file-service"
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
        other: [],
      },
    }

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
      first_name: "",
      last_name: "",
      birth_date: "",
      monthly_income: 0,
      documents: {
        identity: [],
        income_proof: [],
        tax_notice: "",
        other: [],
      },
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
                            monthly_rent: Number.parseFloat(e.target.value) || 0,
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
                    <Label>Type de garant</Label>
                    <RadioGroup
                      value={guarantor.type || "physical"}
                      onValueChange={(value) => {
                        const updatedGuarantor = { ...guarantor, type: value }
                        updateGuarantor(index, updatedGuarantor)
                      }}
                      className="mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="physical" id={`physical_${index}`} />
                        <Label htmlFor={`physical_${index}`}>Personne physique</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="moral" id={`moral_${index}`} />
                        <Label htmlFor={`moral_${index}`}>Personne morale</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="visale" id={`visale_${index}`} />
                        <Label htmlFor={`visale_${index}`}>Garantie Visale</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {guarantor.type === "physical" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`guarantor_first_name_${index}`}>Prénom</Label>
                          <Input
                            id={`guarantor_first_name_${index}`}
                            value={guarantor.first_name || ""}
                            onChange={(e) => {
                              const updatedGuarantor = { ...guarantor, first_name: e.target.value }
                              updateGuarantor(index, updatedGuarantor)
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`guarantor_last_name_${index}`}>Nom</Label>
                          <Input
                            id={`guarantor_last_name_${index}`}
                            value={guarantor.last_name || ""}
                            onChange={(e) => {
                              const updatedGuarantor = { ...guarantor, last_name: e.target.value }
                              updateGuarantor(index, updatedGuarantor)
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor={`guarantor_income_${index}`}>Revenus mensuels (€)</Label>
                        <Input
                          id={`guarantor_income_${index}`}
                          type="number"
                          value={guarantor.monthly_income || ""}
                          onChange={(e) => {
                            const updatedGuarantor = {
                              ...guarantor,
                              monthly_income: Number.parseFloat(e.target.value) || 0,
                            }
                            updateGuarantor(index, updatedGuarantor)
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {guarantor.type === "moral" && (
                    <div>
                      <Label htmlFor={`company_name_${index}`}>Nom de l'entreprise</Label>
                      <Input
                        id={`company_name_${index}`}
                        value={guarantor.company_name || ""}
                        onChange={(e) => {
                          const updatedGuarantor = { ...guarantor, company_name: e.target.value }
                          updateGuarantor(index, updatedGuarantor)
                        }}
                      />
                    </div>
                  )}

                  {guarantor.type === "visale" && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">Garantie Visale</h4>
                      <p className="text-sm text-green-700 mb-3">
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
