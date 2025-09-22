"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, RefreshCw, Database } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export function SupabaseTestComponent() {
  const [isTesting, setIsTesting] = useState(false)
  const [results, setResults] = useState<any[]>([])

  const runSupabaseTests = async () => {
    setIsTesting(true)
    setResults([])

    const tests = []

    try {
      // Test 1: Vérifier la connexion Supabase
      tests.push({ test: "Connexion Supabase", status: "pending", message: "Test en cours..." })
      setResults([...tests])

      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        tests[0] = { test: "Connexion Supabase", status: "error", message: `Erreur auth: ${authError.message}` }
      } else {
        tests[0] = { test: "Connexion Supabase", status: "success", message: `Connecté${user ? ` (${user.email})` : ' (anonyme)'}` }
      }
      setResults([...tests])

      // Test 2: Vérifier les tables de paiements
      tests.push({ test: "Tables de paiements", status: "pending", message: "Test en cours..." })
      setResults([...tests])

      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('id')
        .limit(1)

      if (paymentsError) {
        tests[1] = { test: "Tables de paiements", status: "error", message: `Erreur: ${paymentsError.message}` }
      } else {
        tests[1] = { test: "Tables de paiements", status: "success", message: "Table payments accessible" }
      }
      setResults([...tests])

      // Test 3: Vérifier les baux
      tests.push({ test: "Table des baux", status: "pending", message: "Test en cours..." })
      setResults([...tests])

      const { data: leases, error: leasesError } = await supabase
        .from('leases')
        .select('id, owner_id, tenant_id')
        .limit(1)

      if (leasesError) {
        tests[2] = { test: "Table des baux", status: "error", message: `Erreur: ${leasesError.message}` }
      } else {
        tests[2] = { test: "Table des baux", status: "success", message: `Table leases accessible (${leases?.length || 0} baux)` }
      }
      setResults([...tests])

      // Test 4: Vérifier la fonction de génération
      tests.push({ test: "Fonction generate_monthly_payments", status: "pending", message: "Test en cours..." })
      setResults([...tests])

      const { data: generatedPayments, error: generateError } = await supabase
        .rpc('generate_monthly_payments', { target_month: '2025-01' })

      if (generateError) {
        tests[3] = { test: "Fonction generate_monthly_payments", status: "error", message: `Erreur: ${generateError.message}` }
      } else {
        tests[3] = { test: "Fonction generate_monthly_payments", status: "success", message: `Fonction accessible (${generatedPayments?.length || 0} paiements générés)` }
      }
      setResults([...tests])

      // Test 5: Vérifier les statistiques
      tests.push({ test: "Calcul des statistiques", status: "pending", message: "Test en cours..." })
      setResults([...tests])

      const { data: statsData, error: statsError } = await supabase
        .from('payments')
        .select('amount_due, status')
        .limit(10)

      if (statsError) {
        tests[4] = { test: "Calcul des statistiques", status: "error", message: `Erreur: ${statsError.message}` }
      } else {
        const totalAmount = statsData?.reduce((sum, p) => sum + Number(p.amount_due), 0) || 0
        tests[4] = { test: "Calcul des statistiques", status: "success", message: `Calcul OK (total: ${totalAmount}€)` }
      }
      setResults([...tests])

    } catch (error) {
      console.error('Erreur lors des tests:', error)
      tests.push({ test: "Erreur générale", status: "error", message: `Erreur: ${error}` })
    }

    setResults([...tests])
    setIsTesting(false)
    toast.success("Tests Supabase terminés")
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Succès</Badge>
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>
      default:
        return <Badge variant="secondary">En cours</Badge>
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Tests de Connexion Supabase
        </CardTitle>
        <CardDescription>
          Vérifiez que la connexion à Supabase fonctionne et que les tables sont accessibles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Button 
            onClick={runSupabaseTests} 
            disabled={isTesting}
            className="flex items-center gap-2"
          >
            {isTesting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            {isTesting ? 'Tests en cours...' : 'Tester Supabase'}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium">Résultats des tests :</h3>
            {results.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(result.status)}
                  <div>
                    <p className="font-medium">{result.test}</p>
                    <p className="text-sm text-gray-600">{result.message}</p>
                  </div>
                </div>
                {getStatusBadge(result.status)}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Instructions :</h4>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Vérifiez que les variables d'environnement Supabase sont configurées</li>
            <li>2. Vérifiez que les tables de paiements existent dans Supabase</li>
            <li>3. Vérifiez que la fonction generate_monthly_payments existe</li>
            <li>4. Si des erreurs persistent, vérifiez les logs de la console</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
