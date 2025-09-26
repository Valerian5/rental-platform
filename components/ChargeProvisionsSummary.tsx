"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calculator, Calendar, Euro, TrendingUp } from "lucide-react"

interface ChargeProvisionsSummaryProps {
  leaseId: string
  year: number
  provisionsPeriodStart: string
  provisionsPeriodEnd: string
  totalProvisionsCollected: number
  theoreticalProvisions: number
  daysOccupied: number
  totalDays: number
  prorataPercentage: number
  receiptCount: number
  averageMonthlyProvision: number
}

export function ChargeProvisionsSummary({
  leaseId,
  year,
  provisionsPeriodStart,
  provisionsPeriodEnd,
  totalProvisionsCollected,
  theoreticalProvisions,
  daysOccupied,
  totalDays,
  prorataPercentage,
  receiptCount,
  averageMonthlyProvision
}: ChargeProvisionsSummaryProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Calculator className="h-5 w-5" />
          Provisions de charges - Année {year}
        </CardTitle>
        <CardDescription className="text-blue-700">
          Calcul automatique basé sur les quittances et la période d'occupation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Période d'occupation */}
        <div className="bg-white rounded-lg p-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-blue-600" />
            <h4 className="font-semibold text-blue-900">Période d'occupation</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Début</p>
              <p className="font-medium">{formatDate(provisionsPeriodStart)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Fin</p>
              <p className="font-medium">{formatDate(provisionsPeriodEnd)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Durée</p>
              <p className="font-medium">{daysOccupied} jours</p>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-blue-700 border-blue-300">
                {prorataPercentage.toFixed(1)}% de l'année
              </Badge>
              <span className="text-sm text-gray-600">
                ({daysOccupied} / {totalDays} jours)
              </span>
            </div>
          </div>
        </div>

        {/* Provisions théoriques vs réelles */}
        <div className="bg-white rounded-lg p-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-3">
            <Euro className="h-4 w-4 text-green-600" />
            <h4 className="font-semibold text-green-900">Provisions calculées</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Provisions théoriques (année complète)</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(theoreticalProvisions)}
              </p>
              <p className="text-xs text-gray-500">
                {formatCurrency(averageMonthlyProvision)} × 12 mois
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Provisions encaissées (période effective)</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalProvisionsCollected)}
              </p>
              <p className="text-xs text-gray-500">
                {receiptCount} quittance{receiptCount > 1 ? 's' : ''} reçue{receiptCount > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Résumé du calcul */}
        <div className="bg-white rounded-lg p-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            <h4 className="font-semibold text-purple-900">Méthode de calcul</h4>
          </div>
          <div className="text-sm text-gray-700 space-y-1">
            <p>• <strong>Période effective :</strong> {formatDate(provisionsPeriodStart)} → {formatDate(provisionsPeriodEnd)}</p>
            <p>• <strong>Prorata :</strong> {prorataPercentage.toFixed(1)}% de l'année ({daysOccupied} jours)</p>
            <p>• <strong>Quittances :</strong> {receiptCount} reçue{receiptCount > 1 ? 's' : ''} pour la période</p>
            <p>• <strong>Moyenne mensuelle :</strong> {formatCurrency(averageMonthlyProvision)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
