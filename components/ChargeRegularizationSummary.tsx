"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
    return balanceType === 'refund' ? 'Remboursement locataire' : 'Complément locataire'
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Résumé des charges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Résumé des charges
          </CardTitle>
          <CardDescription>
            Calcul automatique de la régularisation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Provisions encaissées:</span>
              <span className="font-semibold font-mono">{totalProvisionsCollected.toFixed(2)} €</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Charges réelles totales:</span>
              <span className="font-semibold font-mono">{totalRealCharges.toFixed(2)} €</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Charges récupérables:</span>
              <span className="font-semibold font-mono text-green-600">{recoverableCharges.toFixed(2)} €</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Charges non récupérables:</span>
              <span className="font-semibold font-mono text-orange-600">{nonRecoverableCharges.toFixed(2)} €</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Solde locataire:</span>
              <div className="flex items-center gap-2">
                {getBalanceIcon()}
                <span className={`font-bold font-mono text-lg ${getBalanceColor()}`}>
                  {tenantBalance >= 0 ? '+' : ''}{tenantBalance.toFixed(2)} €
                </span>
              </div>
            </div>
            
            <div className="text-center">
              <Badge variant={balanceType === 'refund' ? 'default' : 'destructive'} className="text-sm">
                {getBalanceLabel()}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions et notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Actions et justificatifs
          </CardTitle>
          <CardDescription>
            Générez le décompte et envoyez au locataire
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Notes de calcul */}
          <div>
            <label htmlFor="calculation-notes" className="text-sm font-medium">
              Méthode de calcul
            </label>
            <textarea
              id="calculation-notes"
              className="w-full mt-2 p-3 border rounded-md resize-none"
              rows={4}
              placeholder="Décrivez votre méthode de calcul des charges..."
              value={calculationNotes}
              onChange={(e) => onNotesChange(e.target.value)}
            />
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-3">
            <Button 
              onClick={onGenerateStatement} 
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Générer décompte PDF
            </Button>
            
            <Button 
              onClick={onSendToTenant} 
              disabled={isGenerating}
              variant="outline"
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              Envoyer au locataire
            </Button>
          </div>

          {/* Informations légales */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">Informations légales</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Seules les charges récupérables sont incluses dans la régularisation</li>
                  <li>• Les justificatifs doivent être conservés pendant 3 ans</li>
                  <li>• Le locataire a 1 mois pour contester le décompte</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
