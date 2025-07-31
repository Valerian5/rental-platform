"use client"

import { Label } from "@/components/ui/label"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Download, FileText, User, Shield, CheckCircle, AlertTriangle } from "lucide-react"
import { rentalFileService, MAIN_ACTIVITIES, CURRENT_HOUSING_SITUATIONS } from "@/lib/rental-file-service"
import { toast } from "sonner"
import { generateRentalFilePDF } from "@/lib/pdf-generator-corrected"

interface RentalFileViewerProps {
  rentalFile: any
  onValidate: () => void
}

export function RentalFileViewer({ rentalFile, onValidate }: RentalFileViewerProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  const generatePDF = async () => {
    setIsGeneratingPDF(true)
    try {
      await generateRentalFilePDF(rentalFile)
      toast.success("Dossier téléchargé avec succès")
    } catch (error) {
      console.error("Erreur génération PDF:", error)
      toast.error("Erreur lors de la génération du PDF")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const calculateTotalIncome = () => {
    let total = 0
    const mainTenant = rentalFile.main_tenant

    if (mainTenant?.income_sources?.work_income?.amount) {
      total += mainTenant.income_sources.work_income.amount
    }

    if (mainTenant?.income_sources?.social_aid) {
      mainTenant.income_sources.social_aid.forEach((aid: any) => {
        total += aid.amount || 0
      })
    }

    if (mainTenant?.income_sources?.scholarship?.amount) {
      total += mainTenant.income_sources.scholarship.amount
    }

    return total
  }

  const isEligible = rentalFileService.isEligibleForApplication(rentalFile)
  const completionPercentage = rentalFile.completion_percentage || 0

  return (
    <div className="space-y-6">
      {/* En-tête du dossier */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <span>Aperçu de votre dossier de location</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge
                variant={rentalFile.completion_percentage >= 80 ? "default" : "secondary"}
                className="text-lg px-3 py-1"
              >
                {rentalFile.completion_percentage}% complété
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Résumé du locataire principal */}
          <div>
            <h3 className="flex items-center text-lg font-medium mb-4">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              Locataire principal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm text-gray-600">Nom complet</Label>
                <p className="font-medium">
                  {rentalFile.main_tenant?.first_name} {rentalFile.main_tenant?.last_name}
                </p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Activité principale</Label>
                <p className="font-medium">
                  {MAIN_ACTIVITIES.find((a) => a.value === rentalFile.main_tenant?.main_activity)?.label ||
                    "Non renseigné"}
                </p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Revenus mensuels</Label>
                <p className="font-medium text-green-600">{calculateTotalIncome().toLocaleString("fr-FR")} €</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Logement actuel</Label>
                <p className="font-medium">
                  {CURRENT_HOUSING_SITUATIONS.find((h) => h.value === rentalFile.main_tenant?.current_housing_situation)
                    ?.label || "Non renseigné"}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Colocataires */}
          {rentalFile.cotenants && rentalFile.cotenants.length > 0 && (
            <div>
              <h3 className="flex items-center text-lg font-medium mb-4">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                {rentalFile.rental_situation === "couple" ? "Conjoint(e)" : "Colocataires"} (
                {rentalFile.cotenants.length})
              </h3>
              <div className="space-y-2">
                {rentalFile.cotenants.map((cotenant: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">
                      {cotenant.first_name} {cotenant.last_name}
                    </span>
                    <span className="text-sm text-gray-600">
                      {MAIN_ACTIVITIES.find((a) => a.value === cotenant.main_activity)?.label ||
                        "Activité non renseignée"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Garants */}
          {rentalFile.guarantors && rentalFile.guarantors.length > 0 && (
            <div>
              <h3 className="flex items-center text-lg font-medium mb-4">
                <Shield className="h-5 w-5 mr-2 text-blue-600" />
                Garants ({rentalFile.guarantors.length})
              </h3>
              <div className="space-y-2">
                {rentalFile.guarantors.map((guarantor: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">
                      {guarantor.type === "physical" && guarantor.personal_info
                        ? `${guarantor.personal_info.first_name} ${guarantor.personal_info.last_name}`
                        : guarantor.type === "organism"
                          ? guarantor.organism_type === "visale"
                            ? "Garantie Visale"
                            : guarantor.organism_name || "Organisme"
                          : guarantor.type === "moral_person"
                            ? guarantor.company_name || "Personne morale"
                            : "Garant"}
                    </span>
                    <Badge variant="outline">
                      {guarantor.type === "physical"
                        ? "Personne physique"
                        : guarantor.type === "organism"
                          ? "Organisme"
                          : "Personne morale"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Statut d'éligibilité */}
          <div>
            <h3 className="flex items-center text-lg font-medium mb-4">
              <CheckCircle className="h-5 w-5 mr-2 text-blue-600" />
              Éligibilité pour candidature
            </h3>
            {isEligible.eligible ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span className="font-medium text-green-800">Votre dossier est éligible pour candidater !</span>
                </div>
                {isEligible.recommendations.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-green-700 mb-1">Recommandations pour améliorer votre dossier :</p>
                    <ul className="text-sm text-green-700 space-y-1">
                      {isEligible.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="font-medium text-red-800">Dossier incomplet</span>
                </div>
                <div className="text-sm text-red-700">
                  <p className="mb-2">Éléments manquants :</p>
                  <ul className="space-y-1">
                    {isEligible.reasons.map((reason, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <Separator />

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

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button onClick={generatePDF} disabled={isGeneratingPDF} className="flex-1">
              {isGeneratingPDF ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Génération en cours...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger le dossier de location PDF
                </>
              )}
            </Button>
            <Button
              onClick={onValidate}
              disabled={!isEligible.eligible}
              variant={isEligible.eligible ? "default" : "secondary"}
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Valider mon dossier
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
