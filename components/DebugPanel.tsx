"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"

interface DebugPanelProps {
  leaseId?: string
  chargeCategories: any[]
  chargeRegularizationData: any
}

export function DebugPanel({ leaseId, chargeCategories, chargeRegularizationData }: DebugPanelProps) {
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const runDebug = async () => {
    if (!leaseId) return

    console.log('🔍 Début du debug...')
    
    // 1. Vérifier les quittances
    const { data: receipts, error: receiptsError } = await supabase
      .from('receipts')
      .select('*')
      .eq('lease_id', leaseId)

    // 2. Vérifier les paramètres de charges
    const { data: settings, error: settingsError } = await supabase
      .from('lease_charge_settings')
      .select('*')
      .eq('lease_id', leaseId)
      .single()

    // 3. Vérifier les régularisations existantes
    const { data: regularizations, error: regularizationsError } = await supabase
      .from('charge_regularizations')
      .select('*')
      .eq('lease_id', leaseId)

    const debugData = {
      leaseId,
      receipts: { data: receipts, error: receiptsError },
      settings: { data: settings, error: settingsError },
      regularizations: { data: regularizations, error: regularizationsError },
      chargeCategories,
      chargeRegularizationData
    }

    setDebugInfo(debugData)
    console.log('🔍 Debug complet:', debugData)
  }

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="text-lg text-red-800">🔍 Panel de Debug</CardTitle>
        <CardDescription className="text-red-700">
          Outil de diagnostic pour identifier les problèmes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runDebug} variant="outline" className="w-full">
          🔍 Lancer le diagnostic
        </Button>
        
        {debugInfo && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded border">
              <h4 className="font-bold mb-2">📊 Quittances trouvées:</h4>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(debugInfo.receipts, null, 2)}
              </pre>
            </div>
            
            <div className="bg-white p-4 rounded border">
              <h4 className="font-bold mb-2">⚙️ Paramètres de charges:</h4>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(debugInfo.settings, null, 2)}
              </pre>
            </div>
            
            <div className="bg-white p-4 rounded border">
              <h4 className="font-bold mb-2">📋 Régularisations existantes:</h4>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(debugInfo.regularizations, null, 2)}
              </pre>
            </div>
            
            <div className="bg-white p-4 rounded border">
              <h4 className="font-bold mb-2">🎯 État actuel:</h4>
              <pre className="text-xs overflow-auto">
                {JSON.stringify({
                  chargeCategories: debugInfo.chargeCategories,
                  chargeRegularizationData: debugInfo.chargeRegularizationData
                }, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
