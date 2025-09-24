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
    <div className="bg-white shadow-sm rounded-lg p-5 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-medium">Synthèse</h2>
          <p className="text-sm text-gray-500">Total provisions vs total réel — résultat affiché en bas.</p>
        </div>
        <div className="text-right">
          <div className="text-sm">Provisions encaissées (annuel)</div>
          <div className="text-2xl font-semibold">{totalProvisionsCollected.toFixed(2)} €</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded">
          <div className="text-xs text-gray-400">Total charges réelles</div>
          <div className="text-xl font-semibold mt-1">{totalRealCharges.toFixed(2)} €</div>
        </div>
        
        <div className={getDiffCardClass()}>
          <div className="text-xs text-gray-400">Différence (provisions - réelles)</div>
          <div className={`text-xl font-semibold mt-1 ${getBalanceColor()}`}>
            {tenantBalance >= 0 ? '+' : ''}{tenantBalance.toFixed(2)} €
          </div>
          <div className="text-sm mt-2 text-gray-600">{getBalanceLabel()}</div>
        </div>
        
        <div className="p-4 bg-gray-50 rounded">
          <div className="text-xs text-gray-400">Charges récupérables</div>
          <div className="text-xl font-semibold mt-1 text-green-600">{recoverableCharges.toFixed(2)} €</div>
          <div className="text-xs text-gray-400 mt-1">
            Non récupérables: {nonRecoverableCharges.toFixed(2)} €
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onSendToTenant}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
        >
          <Send className="h-4 w-4 mr-2 inline" />
          Envoyer au locataire
        </button>
        
        <button 
          onClick={onGenerateStatement}
          disabled={isGenerating}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
        >
          {isGenerating ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2 inline"></div>
          ) : (
            <Download className="h-4 w-4 mr-2 inline" />
          )}
          Télécharger PDF
        </button>
        
        <div className="text-xs text-gray-400 ml-auto">
          Dernière sauvegarde : <span className="font-medium">{new Date().toLocaleString('fr-FR')}</span>
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