"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, User, Euro, Briefcase, Calendar, Building, MapPin, Phone, Mail, X } from "lucide-react"
import { toast } from "sonner"

interface DossierFacilePersonProfileProps {
  profile: any
  onUpdate: (profile: any) => void
  onRemove?: () => void
  title: string
  canRemove?: boolean
}

export function DossierFacilePersonProfile({ 
  profile, 
  onUpdate, 
  onRemove, 
  title, 
  canRemove = false 
}: DossierFacilePersonProfileProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [currentSubStep, setCurrentSubStep] = useState(1)

  const totalSteps = 4
  const totalSubSteps = 4

  const handleNext = () => {
    if (currentSubStep < totalSubSteps) {
      setCurrentSubStep(currentSubStep + 1)
    } else if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
      setCurrentSubStep(1)
    }
  }

  const handlePrev = () => {
    if (currentSubStep > 1) {
      setCurrentSubStep(currentSubStep - 1)
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setCurrentSubStep(totalSubSteps)
    }
  }

  const handleUpdate = (field: string, value: any) => {
    onUpdate({ ...profile, [field]: value })
  }

  const handleSubStepUpdate = (field: string, value: any) => {
    const updatedProfile = { ...profile }
    if (!updatedProfile[field]) {
      updatedProfile[field] = {}
    }
    updatedProfile[field] = { ...updatedProfile[field], [field]: value }
    onUpdate(updatedProfile)
  }

  const getStepIcon = (step: number) => {
    switch (step) {
      case 1:
        return <User className="h-4 w-4" />
      case 2:
        return <Euro className="h-4 w-4" />
      case 3:
        return <Briefcase className="h-4 w-4" />
      case 4:
        return <MapPin className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1:
        return "Informations personnelles"
      case 2:
        return "Revenus"
      case 3:
        return "Activité professionnelle"
      case 4:
        return "Adresse"
      default:
        return "Étape"
    }
  }

  const getSubStepTitle = (step: number, subStep: number) => {
    switch (step) {
      case 1:
        return "Identité"
      case 2:
        return "Revenus du travail"
      case 3:
        return "Informations professionnelles"
      case 4:
        return "Adresse actuelle"
      default:
        return "Sous-étape"
    }
  }

  const calculateProgress = () => {
    const totalFields = 20 // Nombre total de champs à remplir
    let filledFields = 0

    // Vérifier les champs remplis
    if (profile.first_name) filledFields++
    if (profile.last_name) filledFields++
    if (profile.email) filledFields++
    if (profile.phone) filledFields++
    if (profile.birth_date) filledFields++
    if (profile.birth_place) filledFields++
    if (profile.nationality) filledFields++
    if (profile.marital_status) filledFields++
    if (profile.work_income?.amount) filledFields++
    if (profile.scholarship?.amount) filledFields++
    if (profile.social_aid?.length > 0) filledFields++
    if (profile.retirement_pension?.length > 0) filledFields++
    if (profile.rent_income?.length > 0) filledFields++
    if (profile.main_activity) filledFields++
    if (profile.contract_type) filledFields++
    if (profile.seniority_months) filledFields++
    if (profile.company_name) filledFields++
    if (profile.job_title) filledFields++
    if (profile.current_address?.street) filledFields++
    if (profile.current_address?.city) filledFields++

    return Math.round((filledFields / totalFields) * 100)
  }

  const progress = calculateProgress()

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStepIcon(currentStep)}
            <span>{title}</span>
            {progress > 0 && (
              <Badge variant="outline" className="ml-2">
                {progress}% complété
              </Badge>
            )}
          </div>
          {canRemove && onRemove && (
            <Button onClick={onRemove} size="sm" variant="outline">
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Étape {currentStep} sur {totalSteps}</span>
            <span>Sous-étape {currentSubStep} sur {totalSubSteps}</span>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Étape 1: Informations personnelles */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">{getSubStepTitle(1, currentSubStep)}</h3>
              <p className="text-sm text-gray-600">Renseignez vos informations personnelles</p>
            </div>

            {currentSubStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">Prénom *</Label>
                  <Input
                    id="first_name"
                    placeholder="Jean"
                    value={profile.first_name || ""}
                    onChange={(e) => handleUpdate("first_name", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Nom *</Label>
                  <Input
                    id="last_name"
                    placeholder="Dupont"
                    value={profile.last_name || ""}
                    onChange={(e) => handleUpdate("last_name", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="jean.dupont@email.com"
                    value={profile.email || ""}
                    onChange={(e) => handleUpdate("email", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone *</Label>
                  <Input
                    id="phone"
                    placeholder="06 12 34 56 78"
                    value={profile.phone || ""}
                    onChange={(e) => handleUpdate("phone", e.target.value)}
                  />
                </div>
              </div>
            )}

            {currentSubStep === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="birth_date">Date de naissance *</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={profile.birth_date || ""}
                    onChange={(e) => handleUpdate("birth_date", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="birth_place">Lieu de naissance *</Label>
                  <Input
                    id="birth_place"
                    placeholder="Paris"
                    value={profile.birth_place || ""}
                    onChange={(e) => handleUpdate("birth_place", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="nationality">Nationalité *</Label>
                  <Input
                    id="nationality"
                    placeholder="Française"
                    value={profile.nationality || ""}
                    onChange={(e) => handleUpdate("nationality", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="marital_status">Situation familiale</Label>
                  <Select
                    value={profile.marital_status || ""}
                    onValueChange={(value) => handleUpdate("marital_status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez votre situation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Célibataire</SelectItem>
                      <SelectItem value="married">Marié(e)</SelectItem>
                      <SelectItem value="divorced">Divorcé(e)</SelectItem>
                      <SelectItem value="widowed">Veuf/Veuve</SelectItem>
                      <SelectItem value="pacs">PACS</SelectItem>
                      <SelectItem value="concubinage">Concubinage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Étape 2: Revenus */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">{getSubStepTitle(2, currentSubStep)}</h3>
              <p className="text-sm text-gray-600">Déclarez vos revenus mensuels</p>
            </div>

            {currentSubStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="work_income">Revenus du travail (€/mois) *</Label>
                  <Input
                    id="work_income"
                    type="number"
                    placeholder="3000"
                    value={profile.work_income?.amount || ""}
                    onChange={(e) => handleUpdate("work_income", { 
                      ...profile.work_income, 
                      amount: parseFloat(e.target.value) || 0 
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="scholarship">Bourse (€/mois)</Label>
                  <Input
                    id="scholarship"
                    type="number"
                    placeholder="500"
                    value={profile.scholarship?.amount || ""}
                    onChange={(e) => handleUpdate("scholarship", { 
                      ...profile.scholarship, 
                      amount: parseFloat(e.target.value) || 0 
                    })}
                  />
                </div>
              </div>
            )}

            {currentSubStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="social_aid">Aides sociales (€/mois)</Label>
                  <Input
                    id="social_aid"
                    type="number"
                    placeholder="400"
                    value={profile.social_aid?.[0]?.amount || ""}
                    onChange={(e) => handleUpdate("social_aid", [{ 
                      type: "RSA", 
                      amount: parseFloat(e.target.value) || 0 
                    }])}
                  />
                </div>
                <div>
                  <Label htmlFor="retirement_pension">Retraite/Pension (€/mois)</Label>
                  <Input
                    id="retirement_pension"
                    type="number"
                    placeholder="1200"
                    value={profile.retirement_pension?.[0]?.amount || ""}
                    onChange={(e) => handleUpdate("retirement_pension", [{ 
                      type: "Retraite", 
                      amount: parseFloat(e.target.value) || 0 
                    }])}
                  />
                </div>
              </div>
            )}

            {currentSubStep === 3 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="rent_income">Rentes (€/mois)</Label>
                  <Input
                    id="rent_income"
                    type="number"
                    placeholder="800"
                    value={profile.rent_income?.[0]?.amount || ""}
                    onChange={(e) => handleUpdate("rent_income", [{ 
                      type: "Rente", 
                      amount: parseFloat(e.target.value) || 0 
                    }])}
                  />
                </div>
              </div>
            )}

            {currentSubStep === 4 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Récapitulatif des revenus</h4>
                <div className="space-y-2 text-sm text-blue-700">
                  <div className="flex justify-between">
                    <span>Revenus du travail:</span>
                    <span>{profile.work_income?.amount || 0}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bourse:</span>
                    <span>{profile.scholarship?.amount || 0}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Aides sociales:</span>
                    <span>{profile.social_aid?.[0]?.amount || 0}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Retraite/Pension:</span>
                    <span>{profile.retirement_pension?.[0]?.amount || 0}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rentes:</span>
                    <span>{profile.rent_income?.[0]?.amount || 0}€</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-2">
                    <span>Total mensuel:</span>
                    <span>
                      {(profile.work_income?.amount || 0) + 
                       (profile.scholarship?.amount || 0) + 
                       (profile.social_aid?.[0]?.amount || 0) + 
                       (profile.retirement_pension?.[0]?.amount || 0) + 
                       (profile.rent_income?.[0]?.amount || 0)}€
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Étape 3: Activité professionnelle */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">{getSubStepTitle(3, currentSubStep)}</h3>
              <p className="text-sm text-gray-600">Renseignez votre activité professionnelle</p>
            </div>

            {currentSubStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="main_activity">Activité principale *</Label>
                  <Select
                    value={profile.main_activity || ""}
                    onValueChange={(value) => handleUpdate("main_activity", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez votre activité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Salarié</SelectItem>
                      <SelectItem value="freelance">Freelance/Indépendant</SelectItem>
                      <SelectItem value="student">Étudiant</SelectItem>
                      <SelectItem value="unemployed">Sans emploi</SelectItem>
                      <SelectItem value="retired">Retraité</SelectItem>
                      <SelectItem value="civil_servant">Fonctionnaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {currentSubStep === 2 && profile.main_activity && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contract_type">Type de contrat *</Label>
                    <Select
                      value={profile.contract_type || ""}
                      onValueChange={(value) => handleUpdate("contract_type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez votre type de contrat" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cdi_confirmed">CDI confirmé</SelectItem>
                        <SelectItem value="cdi_trial">CDI en période d'essai</SelectItem>
                        <SelectItem value="cdd_long">CDD long terme (12+ mois)</SelectItem>
                        <SelectItem value="cdd_short">CDD court terme (&lt;12 mois)</SelectItem>
                        <SelectItem value="freelance">Freelance/Indépendant</SelectItem>
                        <SelectItem value="student">Étudiant</SelectItem>
                        <SelectItem value="unemployed">Sans emploi</SelectItem>
                        <SelectItem value="retired">Retraité</SelectItem>
                        <SelectItem value="civil_servant">Fonctionnaire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="seniority_months">Ancienneté (mois)</Label>
                    <Input
                      id="seniority_months"
                      type="number"
                      placeholder="12"
                      value={profile.seniority_months || ""}
                      onChange={(e) => handleUpdate("seniority_months", parseInt(e.target.value) || 0)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Nombre de mois dans votre emploi actuel
                    </p>
                  </div>
                </div>
              </div>
            )}

            {currentSubStep === 3 && profile.main_activity && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company_name">Nom de l'entreprise</Label>
                    <Input
                      id="company_name"
                      placeholder="Nom de votre employeur"
                      value={profile.company_name || ""}
                      onChange={(e) => handleUpdate("company_name", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="job_title">Poste occupé</Label>
                    <Input
                      id="job_title"
                      placeholder="Votre poste/titre"
                      value={profile.job_title || ""}
                      onChange={(e) => handleUpdate("job_title", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentSubStep === 4 && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Activité professionnelle renseignée</h4>
                <div className="space-y-2 text-sm text-green-700">
                  <div className="flex justify-between">
                    <span>Activité:</span>
                    <span>{profile.main_activity || "Non renseigné"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type de contrat:</span>
                    <span>{profile.contract_type || "Non renseigné"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ancienneté:</span>
                    <span>{profile.seniority_months || 0} mois</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Entreprise:</span>
                    <span>{profile.company_name || "Non renseigné"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Poste:</span>
                    <span>{profile.job_title || "Non renseigné"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Étape 4: Adresse */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">{getSubStepTitle(4, currentSubStep)}</h3>
              <p className="text-sm text-gray-600">Renseignez votre adresse actuelle</p>
            </div>

            {currentSubStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="street">Adresse *</Label>
                  <Input
                    id="street"
                    placeholder="123 rue de la Paix"
                    value={profile.current_address?.street || ""}
                    onChange={(e) => handleUpdate("current_address", { 
                      ...profile.current_address, 
                      street: e.target.value 
                    })}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="postal_code">Code postal *</Label>
                    <Input
                      id="postal_code"
                      placeholder="75001"
                      value={profile.current_address?.postal_code || ""}
                      onChange={(e) => handleUpdate("current_address", { 
                        ...profile.current_address, 
                        postal_code: e.target.value 
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Ville *</Label>
                    <Input
                      id="city"
                      placeholder="Paris"
                      value={profile.current_address?.city || ""}
                      onChange={(e) => handleUpdate("current_address", { 
                        ...profile.current_address, 
                        city: e.target.value 
                      })}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentSubStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="country">Pays *</Label>
                  <Input
                    id="country"
                    placeholder="France"
                    value={profile.current_address?.country || ""}
                    onChange={(e) => handleUpdate("current_address", { 
                      ...profile.current_address, 
                      country: e.target.value 
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="move_in_date">Date d'emménagement</Label>
                  <Input
                    id="move_in_date"
                    type="date"
                    value={profile.current_address?.move_in_date || ""}
                    onChange={(e) => handleUpdate("current_address", { 
                      ...profile.current_address, 
                      move_in_date: e.target.value 
                    })}
                  />
                </div>
              </div>
            )}

            {currentSubStep === 3 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="rent_amount">Loyer actuel (€/mois)</Label>
                  <Input
                    id="rent_amount"
                    type="number"
                    placeholder="800"
                    value={profile.current_address?.rent_amount || ""}
                    onChange={(e) => handleUpdate("current_address", { 
                      ...profile.current_address, 
                      rent_amount: parseFloat(e.target.value) || 0 
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="landlord_name">Nom du propriétaire</Label>
                  <Input
                    id="landlord_name"
                    placeholder="Nom du propriétaire"
                    value={profile.current_address?.landlord_name || ""}
                    onChange={(e) => handleUpdate("current_address", { 
                      ...profile.current_address, 
                      landlord_name: e.target.value 
                    })}
                  />
                </div>
              </div>
            )}

            {currentSubStep === 4 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Adresse actuelle renseignée</h4>
                <div className="space-y-2 text-sm text-blue-700">
                  <div className="flex justify-between">
                    <span>Adresse:</span>
                    <span>{profile.current_address?.street || "Non renseigné"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Code postal:</span>
                    <span>{profile.current_address?.postal_code || "Non renseigné"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ville:</span>
                    <span>{profile.current_address?.city || "Non renseigné"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pays:</span>
                    <span>{profile.current_address?.country || "Non renseigné"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Loyer:</span>
                    <span>{profile.current_address?.rent_amount || 0}€/mois</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handlePrev}
            disabled={currentStep === 1 && currentSubStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Précédent
          </Button>
          <Button 
            onClick={handleNext}
            disabled={currentStep === totalSteps && currentSubStep === totalSubSteps}
          >
            Suivant
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
