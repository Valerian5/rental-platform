"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Euro, TrendingUp, TrendingDown, Calculator, FileText, Download } from "lucide-react"

interface FiscalSummaryCardProps {
  year: number
  totalRentCollected: number
  totalRecoverableCharges: number
  totalDeductibleExpenses: number
  onGenerateDocuments?: () => void
  onViewDetails?: () => void
}

export function FiscalSummaryCard({
  year,
  totalRentCollected,
  totalRecoverableCharges,
  totalDeductibleExpenses,
  onGenerateDocuments,
  onViewDetails
}: FiscalSummaryCardProps) {
  const netRentalIncome = totalRentCollected - totalDeductibleExpenses

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Résumé fiscal {year}</CardTitle>
            <CardDescription>Revenus locatifs et charges déductibles</CardDescription>
          </div>
          <Badge variant="outline" className="text-sm">
            Année {year}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Revenus bruts */}
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-green-900 flex items-center gap-2">
                <Euro className="h-4 w-4" />
                Loyers encaissés
              </h4>
              <p className="text-2xl font-bold text-green-700 mt-1">
                {totalRentCollected.toLocaleString('fr-FR')} €
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>

        {/* Charges récupérables */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-blue-900">Charges récupérables</h4>
              <p className="text-lg font-semibold text-blue-700 mt-1">
                {totalRecoverableCharges.toLocaleString('fr-FR')} €
              </p>
              <p className="text-sm text-blue-600">Non imposables</p>
            </div>
          </div>
        </div>

        {/* Dépenses déductibles */}
        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-orange-900">Dépenses déductibles</h4>
              <p className="text-lg font-semibold text-orange-700 mt-1">
                {totalDeductibleExpenses.toLocaleString('fr-FR')} €
              </p>
              <p className="text-sm text-orange-600">Réduisent l'impôt</p>
            </div>
            <TrendingDown className="h-6 w-6 text-orange-600" />
          </div>
        </div>

        {/* Revenu net */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900">Revenu net locatif</h4>
              <p className="text-xl font-bold text-gray-700 mt-1">
                {netRentalIncome.toLocaleString('fr-FR')} €
              </p>
              <p className="text-sm text-gray-600">Base d'imposition</p>
            </div>
            <Calculator className="h-6 w-6 text-gray-600" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={onViewDetails}
          >
            <Calculator className="h-4 w-4 mr-2" />
            Voir simulations
          </Button>
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={onGenerateDocuments}
          >
            <FileText className="h-4 w-4 mr-2" />
            Documents
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
