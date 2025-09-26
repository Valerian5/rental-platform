"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Euro, TrendingUp, TrendingDown, Minus } from "lucide-react"

interface BalanceSummaryProps {
  totalProvisions: number
  totalQuotePart: number
  balance: number
  daysOccupied: number
}

export function BalanceSummary({ totalProvisions, totalQuotePart, balance, daysOccupied }: BalanceSummaryProps) {
  const getBalanceColor = (balance: number) => {
    if (balance > 0) return "text-green-600"
    if (balance < 0) return "text-red-600"
    return "text-gray-600"
  }

  const getBalanceIcon = (balance: number) => {
    if (balance > 0) return <TrendingUp className="h-5 w-5" />
    if (balance < 0) return <TrendingDown className="h-5 w-5" />
    return <Minus className="h-5 w-5" />
  }

  const getBalanceLabel = (balance: number) => {
    if (balance > 0) return "Trop-perçu (remboursement)"
    if (balance < 0) return "Complément à réclamer"
    return "Équilibre parfait"
  }

  const getBalanceVariant = (balance: number): "default" | "destructive" | "secondary" => {
    if (balance > 0) return "default"
    if (balance < 0) return "destructive"
    return "secondary"
  }

  const prorataPercentage = (daysOccupied / 365) * 100

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Euro className="h-5 w-5" />
          <span>Résumé de la régularisation</span>
        </CardTitle>
        <CardDescription>
          Calcul basé sur {daysOccupied} jour{daysOccupied > 1 ? 's' : ''} d'occupation ({prorataPercentage.toFixed(1)}% de l'année)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Provisions versées */}
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-2">Provisions versées</div>
            <div className="text-2xl font-bold text-gray-900">
              {totalProvisions.toFixed(2)} €
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Montant total encaissé
            </div>
          </div>

          {/* Quote-part locataire */}
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-2">Quote-part locataire</div>
            <div className="text-2xl font-bold text-blue-600">
              {totalQuotePart.toFixed(2)} €
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Montant dû par le locataire
            </div>
          </div>

          {/* Balance */}
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-2">Balance</div>
            <div className={`text-2xl font-bold ${getBalanceColor(balance)}`}>
              {Math.abs(balance).toFixed(2)} €
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {getBalanceLabel(balance)}
            </div>
          </div>
        </div>

        {/* Détail du calcul */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Détail du calcul</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Provisions versées :</span>
                <span className="font-medium">{totalProvisions.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Quote-part locataire :</span>
                <span className="font-medium text-blue-600">-{totalQuotePart.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-300">
                <span className="font-medium">Balance :</span>
                <span className={`font-bold ${getBalanceColor(balance)}`}>
                  {balance >= 0 ? '+' : ''}{balance.toFixed(2)} €
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Badge de statut */}
        <div className="mt-4 flex justify-center">
          <Badge variant={getBalanceVariant(balance)} className="text-sm">
            <div className="flex items-center space-x-2">
              {getBalanceIcon(balance)}
              <span>{getBalanceLabel(balance)}</span>
            </div>
          </Badge>
        </div>

        {/* Message d'information */}
        {balance !== 0 && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            balance > 0 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {balance > 0 ? (
              <p>
                <strong>Remboursement à effectuer :</strong> Le locataire a versé {Math.abs(balance).toFixed(2)} € de trop. 
                Vous devez lui rembourser ce montant.
              </p>
            ) : (
              <p>
                <strong>Complément à réclamer :</strong> Le locataire doit verser {Math.abs(balance).toFixed(2)} € 
                en complément des provisions déjà payées.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
