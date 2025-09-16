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
import { X, User, Briefcase, ChevronRight, Home, CheckCircle, AlertTriangle, Euro, CreditCard, Trash2 } from "lucide-react"
import { MAIN_ACTIVITIES, CURRENT_HOUSING_SITUATIONS } from "@/lib/rental-file-service"
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
  canRemove = false,
}: DossierFacilePersonProfileProps) {
  const [currentSubStep, setCurrentSubStep] = useState(1)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const totalSubSteps = 4 // Identité, Logement, Activité, Revenus (sans fiscalité)

  const validateCurrentStep = (): boolean => {
    const errors: string[] = []

    switch (currentSubStep) {
      case 1: // Identité
        if (!profile.first_name?.trim()) errors.push("Le prénom est requis")
        if (!profile.last_name?.trim()) errors.push("Le nom est requis")
        break
      case 2: // Logement actuel
        if (!profile.current_housing_situation) errors.push("La situation d'hébergement est requise")
        break
      case 3: // Activité
        if (!profile.main_activity) errors.push("L'activité principale est requise")
        break
      case 4: // Revenus
        if (!profile.income_sources || Object.keys(profile.income_sources).length === 0) {
          errors.push("Au moins une source de revenus est requise")
        }
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
    const total = 4

    // Identité
    if (profile.first_name && profile.last_name) completed++
    // Logement
    if (profile.current_housing_situation) completed++
    // Activité
    if (profile.main_activity) completed++
    // Revenus
    if (profile.income_sources && Object.keys(profile.income_sources).length > 0) completed++

    return (completed / total) * 100
  }

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
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getSubStepTitle = (step: number) => {
    switch (step) {
      case 1:
        return "Identité"
      case 2:
        return "Logement actuel"
      case 3:
        return "Activité professionnelle"
      case 4:
        return "Revenus"
      default:
        return "Informations"
    }
  }

  const handleUpdate = (field: string, value: any) => {
    onUpdate({ ...profile, [field]: value })
  }

  const handleIncomeUpdate = (incomeType: string, value: any) => {
    const updatedIncomeSources = { ...profile.income_sources }
    updatedIncomeSources[incomeType] = value
    handleUpdate("income_sources", updatedIncomeSources)
  }

  const calculateTotalMonthlyIncome = () => {
    const sources = profile.income_sources || {}
    return (
      (sources.work_income?.amount || 0) +
      (sources.scholarship?.amount || 0) +
      (sources.social_aid?.reduce((sum: number, aid: any) => sum + (aid.amount || 0), 0) || 0) +
      (sources.retirement_pension?.reduce((sum: number, pension: any) => sum + (pension.amount || 0), 0) || 0) +
      (sources.rent_income?.reduce((sum: number, rent: any) => sum + (rent.amount || 0), 0) || 0)
    )
  }

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg flex items-center space-x-2">
          <User className="h-5 w-5 text-blue-600" />
          <span>{title}</span>
          {profile.first_name && profile.last_name && (
            <Badge variant="secondary">{profile.first_name} {profile.last_name}</Badge>
          )}
        </CardTitle>
        {canRemove && (
          <Button variant="destructive" size="sm" onClick={onRemove}>
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progression */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progression</span>
            <span>{Math.round(calculateStepCompletion())}%</span>
          </div>
          <Progress value={calculateStepCompletion()} className="h-2" />
        </div>

        {/* Navigation des étapes */}
        <div className="flex justify-between">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex flex-col items-center space-y-1">
              <div
                className={`p-2 rounded-full ${
                  currentSubStep >= step ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"
                }`}
              >
                {getSubStepIcon(step)}
              </div>
              <span className={`text-xs font-medium ${currentSubStep >= step ? "text-blue-600" : "text-gray-500"}`}>
                {getSubStepTitle(step)}
              </span>
            </div>
          ))}
        </div>

        {/* Messages d'erreur */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Erreurs de validation :</span>
            </div>
            <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Étape 1: Identité */}
        {currentSubStep === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">{getSubStepTitle(1)}</h3>
              <p className="text-sm text-gray-600">Vos informations personnelles</p>
            </div>

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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jean.dupont@email.com"
                  value={profile.email || ""}
                  onChange={(e) => handleUpdate("email", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  placeholder="06 12 34 56 78"
                  value={profile.phone || ""}
                  onChange={(e) => handleUpdate("phone", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="birth_date">Date de naissance</Label>
              <Input
                id="birth_date"
                type="date"
                value={profile.birth_date || ""}
                onChange={(e) => handleUpdate("birth_date", e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Étape 2: Logement actuel */}
        {currentSubStep === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">{getSubStepTitle(2)}</h3>
              <p className="text-sm text-gray-600">Votre situation d'hébergement actuelle</p>
            </div>

            <div>
              <Label htmlFor="current_housing_situation">Situation d'hébergement *</Label>
              <Select
                value={profile.current_housing_situation || ""}
                onValueChange={(value) => handleUpdate("current_housing_situation", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez votre situation" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENT_HOUSING_SITUATIONS.map((situation) => (
                    <SelectItem key={situation.value} value={situation.value}>
                      {situation.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="address_street">Adresse actuelle</Label>
                <Input
                  id="address_street"
                  placeholder="10 Rue de la Paix"
                  value={profile.address_street || ""}
                  onChange={(e) => handleUpdate("address_street", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="address_zip_code">Code postal</Label>
                <Input
                  id="address_zip_code"
                  placeholder="75000"
                  value={profile.address_zip_code || ""}
                  onChange={(e) => handleUpdate("address_zip_code", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="address_city">Ville</Label>
                <Input
                  id="address_city"
                  placeholder="Paris"
                  value={profile.address_city || ""}
                  onChange={(e) => handleUpdate("address_city", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="address_country">Pays</Label>
                <Input
                  id="address_country"
                  placeholder="France"
                  value={profile.address_country || ""}
                  onChange={(e) => handleUpdate("address_country", e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Étape 3: Activité professionnelle */}
        {currentSubStep === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">{getSubStepTitle(3)}</h3>
              <p className="text-sm text-gray-600">Votre activité professionnelle</p>
            </div>

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
                  {MAIN_ACTIVITIES.map((activity) => (
                    <SelectItem key={activity.value} value={activity.value}>
                      {activity.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contract_type">Type de contrat</Label>
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

        {/* Étape 4: Revenus */}
        {currentSubStep === 4 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">{getSubStepTitle(4)}</h3>
              <p className="text-sm text-gray-600">Déclarez vos revenus mensuels</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="work_income">Revenus du travail (€/mois) *</Label>
                <Input
                  id="work_income"
                  type="number"
                  placeholder="3000"
                  value={profile.income_sources?.work_income?.amount || ""}
                  onChange={(e) => handleIncomeUpdate("work_income", { 
                    ...profile.income_sources?.work_income, 
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
                  value={profile.income_sources?.scholarship?.amount || ""}
                  onChange={(e) => handleIncomeUpdate("scholarship", { 
                    ...profile.income_sources?.scholarship, 
                    amount: parseFloat(e.target.value) || 0 
                  })}
                />
              </div>

              <div>
                <Label htmlFor="social_aid">Aides sociales (€/mois)</Label>
                <Input
                  id="social_aid"
                  type="number"
                  placeholder="400"
                  value={profile.income_sources?.social_aid?.[0]?.amount || ""}
                  onChange={(e) => handleIncomeUpdate("social_aid", [{ 
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
                  value={profile.income_sources?.retirement_pension?.[0]?.amount || ""}
                  onChange={(e) => handleIncomeUpdate("retirement_pension", [{ 
                    type: "Retraite", 
                    amount: parseFloat(e.target.value) || 0 
                  }])}
                />
              </div>

              <div>
                <Label htmlFor="rent_income">Rentes (€/mois)</Label>
                <Input
                  id="rent_income"
                  type="number"
                  placeholder="800"
                  value={profile.income_sources?.rent_income?.[0]?.amount || ""}
                  onChange={(e) => handleIncomeUpdate("rent_income", [{ 
                    type: "Rente", 
                    amount: parseFloat(e.target.value) || 0 
                  }])}
                />
              </div>
            </div>

            {/* Récapitulatif des revenus */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Récapitulatif des revenus</h4>
              <div className="space-y-2 text-sm text-blue-700">
                <div className="flex justify-between">
                  <span>Revenus du travail:</span>
                  <span>{profile.income_sources?.work_income?.amount || 0}€</span>
                </div>
                <div className="flex justify-between">
                  <span>Bourse:</span>
                  <span>{profile.income_sources?.scholarship?.amount || 0}€</span>
                </div>
                <div className="flex justify-between">
                  <span>Aides sociales:</span>
                  <span>{profile.income_sources?.social_aid?.[0]?.amount || 0}€</span>
                </div>
                <div className="flex justify-between">
                  <span>Retraite/Pension:</span>
                  <span>{profile.income_sources?.retirement_pension?.[0]?.amount || 0}€</span>
                </div>
                <div className="flex justify-between">
                  <span>Rentes:</span>
                  <span>{profile.income_sources?.rent_income?.[0]?.amount || 0}€</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Total mensuel:</span>
                  <span>{calculateTotalMonthlyIncome()}€</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          {currentSubStep > 1 && (
            <Button variant="outline" onClick={prevSubStep}>
              <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
              Précédent
            </Button>
          )}
          {currentSubStep < totalSubSteps && (
            <Button onClick={nextSubStep} className="ml-auto">
              Suivant
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>

        {/* Récapitulatif final */}
        {currentSubStep === totalSubSteps && (
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold mb-4">Récapitulatif des informations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-xs text-gray-600">Nom complet</Label>
                <p className="text-sm font-medium">{profile.first_name} {profile.last_name}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-600">Activité</Label>
                <p className="text-sm font-medium">{profile.main_activity || "Non renseigné"}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-600">Revenus mensuels</Label>
                <p className="text-sm font-medium">{calculateTotalMonthlyIncome()}€</p>
              </div>
              <div>
                <Label className="text-xs text-gray-600">Situation d'hébergement</Label>
                <p className="text-sm font-medium">{profile.current_housing_situation || "Non renseigné"}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}