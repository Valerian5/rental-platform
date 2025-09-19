"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Calculator, FileText, AlertCircle } from "lucide-react"
import { FiscalCalculation } from "@/lib/fiscal-calculator"

interface FiscalSimulationCardProps {
  calculation: FiscalCalculation
  onGenerateForm?: (formType: "2044" | "2042-C-PRO") => void
  onExportData?: (format: "csv" | "pdf") => void
}

export function FiscalSimulationCard({ 
  calculation, 
  onGenerateForm, 
  onExportData 
}: FiscalSimulationCardProps) {
  const { microFoncier, microBIC, realRegime, recommendation } = calculation

  const getRegimeIcon = (regime: string, isRecommended: boolean) => {
    if (isRecommended) {
      return <CheckCircle className="h-5 w-5 text-green-600" />
    }
    return <XCircle className="h-5 w-5 text-gray-400" />
  }

  const getRegimeBadge = (regime: string, isRecommended: boolean) => {
    if (isRecommended) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Recommandé</Badge>
    }
    return <Badge variant="outline">Option</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Recommandation */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <AlertCircle className="h-5 w-5" />
            Recommandation fiscale
          </CardTitle>
          <CardDescription className="text-green-700">
            Régime le plus avantageux pour votre situation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-900">
                {recommendation.regime === "micro-foncier" && "Micro-foncier"}
                {recommendation.regime === "micro-bic" && "Micro-BIC"}
                {recommendation.regime === "real" && "Régime réel"}
              </h3>
              <p className="text-green-700">{recommendation.reason}</p>
              {recommendation.savings > 0 && (
                <p className="text-sm text-green-600 mt-1">
                  Économie estimée : {recommendation.savings.toLocaleString('fr-FR')} €
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-700">
                {recommendation.regime === "micro-foncier" && microFoncier.taxableIncome.toLocaleString('fr-FR')}
                {recommendation.regime === "micro-bic" && microBIC.taxableIncome.toLocaleString('fr-FR')}
                {recommendation.regime === "real" && realRegime.taxableIncome.toLocaleString('fr-FR')}
                €
              </p>
              <p className="text-sm text-green-600">Revenu imposable</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simulations détaillées */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Micro-foncier */}
        <Card className={recommendation.regime === "micro-foncier" ? "border-green-200 bg-green-50" : ""}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                {getRegimeIcon("micro-foncier", recommendation.regime === "micro-foncier")}
                Micro-foncier
              </CardTitle>
              {getRegimeBadge("micro-foncier", recommendation.regime === "micro-foncier")}
            </div>
            <CardDescription>
              Abattement forfaitaire 30%
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Revenus bruts :</span>
                <span className="font-medium">{microFoncier.grossIncome.toLocaleString('fr-FR')} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Abattement (30%) :</span>
                <span className="font-medium text-green-600">-{microFoncier.deduction.toLocaleString('fr-FR')} €</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold">
                  <span>Revenu imposable :</span>
                  <span className="text-lg">{microFoncier.taxableIncome.toLocaleString('fr-FR')} €</span>
                </div>
              </div>
            </div>
            
            {microFoncier.applicable ? (
              <div className="text-xs text-green-600 bg-green-100 p-2 rounded">
                ✓ Applicable (revenus ≤ 15 000 €)
              </div>
            ) : (
              <div className="text-xs text-red-600 bg-red-100 p-2 rounded">
                ✗ Non applicable (revenus > 15 000 €)
              </div>
            )}

            {recommendation.regime === "micro-foncier" && (
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => onGenerateForm?.("2044")}
              >
                <FileText className="h-4 w-4 mr-2" />
                Formulaire 2044
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Micro-BIC */}
        <Card className={recommendation.regime === "micro-bic" ? "border-green-200 bg-green-50" : ""}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                {getRegimeIcon("micro-bic", recommendation.regime === "micro-bic")}
                Micro-BIC
              </CardTitle>
              {getRegimeBadge("micro-bic", recommendation.regime === "micro-bic")}
            </div>
            <CardDescription>
              Abattement forfaitaire 50%
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Revenus bruts :</span>
                <span className="font-medium">{microBIC.grossIncome.toLocaleString('fr-FR')} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Abattement (50%) :</span>
                <span className="font-medium text-green-600">-{microBIC.deduction.toLocaleString('fr-FR')} €</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold">
                  <span>Revenu imposable :</span>
                  <span className="text-lg">{microBIC.taxableIncome.toLocaleString('fr-FR')} €</span>
                </div>
              </div>
            </div>
            
            {microBIC.applicable ? (
              <div className="text-xs text-green-600 bg-green-100 p-2 rounded">
                ✓ Applicable (revenus ≤ 77 700 €)
              </div>
            ) : (
              <div className="text-xs text-red-600 bg-red-100 p-2 rounded">
                ✗ Non applicable (revenus > 77 700 €)
              </div>
            )}

            {recommendation.regime === "micro-bic" && (
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => onGenerateForm?.("2042-C-PRO")}
              >
                <FileText className="h-4 w-4 mr-2" />
                Formulaire 2042-C-PRO
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Régime réel */}
        <Card className={recommendation.regime === "real" ? "border-green-200 bg-green-50" : ""}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                {getRegimeIcon("real", recommendation.regime === "real")}
                Régime réel
              </CardTitle>
              {getRegimeBadge("real", recommendation.regime === "real")}
            </div>
            <CardDescription>
              Déduction des charges réelles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Revenus bruts :</span>
                <span className="font-medium">{realRegime.grossIncome.toLocaleString('fr-FR')} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Charges déductibles :</span>
                <span className="font-medium text-green-600">-{realRegime.deductibleExpenses.toLocaleString('fr-FR')} €</span>
              </div>
              {realRegime.depreciation && realRegime.depreciation > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Amortissement :</span>
                  <span className="font-medium text-green-600">-{realRegime.depreciation.toLocaleString('fr-FR')} €</span>
                </div>
              )}
              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold">
                  <span>Revenu imposable :</span>
                  <span className="text-lg">{realRegime.taxableIncome.toLocaleString('fr-FR')} €</span>
                </div>
              </div>
            </div>
            
            <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
              ✓ Toujours applicable
            </div>

            {recommendation.regime === "real" && (
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => onGenerateForm?.("2044")}
              >
                <FileText className="h-4 w-4 mr-2" />
                Formulaire 2044
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions globales */}
      <Card>
        <CardHeader>
          <CardTitle>Documents fiscaux</CardTitle>
          <CardDescription>
            Générez vos documents de déclaration fiscale
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Export des données</h4>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onExportData?.("csv")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onExportData?.("pdf")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Formulaires préremplis</h4>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onGenerateForm?.("2044")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Formulaire 2044
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onGenerateForm?.("2042-C-PRO")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  2042-C-PRO
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
