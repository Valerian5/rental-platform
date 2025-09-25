"use client"

import { Button } from "@/components/ui/button"
import {
  Calculator,
  Euro,
  TrendingUp,
  TrendingDown,
  FileText,
  Send,
  Download,
  CheckCircle,
  AlertCircle
} from "lucide-react"

interface ChargeRegularizationSummaryProps {
  totalProvisionsCollected: number
  totalRealCharges: number
  recoverableCharges: number
  nonRecoverableCharges: number
  tenantBalance: number
  balanceType: 'refund' | 'additional_payment'
  calculationNotes: string
  onNotesChange: (notes: string) => void
  onGenerateStatement: () => void
  onSendToTenant: () => void
  isGenerating: boolean
}

export function ChargeRegularizationSummary({
  totalProvisionsCollected,
  totalRealCharges,
  recoverableCharges,
  nonRecoverableCharges,
  tenantBalance,
  balanceType,
  calculationNotes,
  onNotesChange,
  onGenerateStatement,
  onSendToTenant,
  isGenerating
}: ChargeRegularizationSummaryProps) {
  const getBalanceIcon = () => {
    if (balanceType === 'refund') {
      return <TrendingDown className="h-5 w-5 text-green-600" />
    } else {
      return <TrendingUp className="h-5 w-5 text-red-600" />
    }
  }

  const getBalanceColor = () => {
    return balanceType === 'refund' ? 'text-green-600' : 'text-red-600'
  }

  const getBalanceLabel = () => {
    return balanceType === 'refund' ? 'Remboursement au locataire' : 'Complément locataire'
  }

  const getDiffCardClass = () => {
    return balanceType === 'refund' 
      ? 'p-4 bg-green-50 rounded border border-green-200' 
      : 'p-4 bg-red-50 rounded border border-red-200'
  }

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 mb-6 border border-gray-200">
      {/* En-tête avec titre et provisions */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Euro className="h-6 w-6 mr-2 text-blue-600" />
            Synthèse de la régularisation
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Comparaison provisions encaissées vs charges réelles
          </p>
        </div>
        <div className="text-right bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-sm text-blue-600 font-medium">Provisions encaissées</div>
          <div className="text-3xl font-bold text-blue-700">{totalProvisionsCollected.toFixed(2)} €</div>
        </div>
      </div>

      {/* Grille des totaux */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Charges réelles */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Charges réelles</div>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalRealCharges.toFixed(2)} €</div>
          <div className="text-xs text-gray-500 mt-1">
            Récupérables: {recoverableCharges.toFixed(2)} €
          </div>
          <div className="text-xs text-gray-500">
            Non récupérables: {nonRecoverableCharges.toFixed(2)} €
          </div>
        </div>
        
        {/* Différence/Solde */}
        <div className={`rounded-xl p-6 border-2 ${getDiffCardClass()}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Solde locataire</div>
            {getBalanceIcon()}
          </div>
          <div className={`text-3xl font-bold ${getBalanceColor()}`}>
            {tenantBalance >= 0 ? '+' : ''}{tenantBalance.toFixed(2)} €
          </div>
          <div className="text-sm font-medium mt-2 text-gray-700">{getBalanceLabel()}</div>
        </div>
        
        {/* Répartition */}
        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-green-700">Répartition</div>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-lg font-bold text-green-800">
            {recoverableCharges > 0 ? 
              `${((recoverableCharges / totalRealCharges) * 100).toFixed(1)}%` : 
              '0%'
            }
          </div>
          <div className="text-xs text-green-600 mt-1">Charges récupérables</div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={onSendToTenant}
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <Send className="h-4 w-4 mr-2" />
              Envoyer au locataire
            </button>
            
            <button 
              onClick={onGenerateStatement}
              disabled={isGenerating}
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Télécharger PDF
            </button>
          </div>
          
          <div className="text-sm text-gray-500 bg-white rounded-lg px-3 py-2 border border-gray-200">
            <span className="font-medium">Dernière sauvegarde :</span> {new Date().toLocaleString('fr-FR')}
          </div>
        </div>
      </div>

      {/* Informations légales */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1 text-blue-800">Informations légales</p>
            <ul className="text-blue-700 space-y-1">
              <li>• Seules les charges récupérables sont incluses dans la régularisation</li>
              <li>• Les justificatifs doivent être conservés pendant 3 ans</li>
              <li>• Le locataire a 1 mois pour contester le décompte</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}