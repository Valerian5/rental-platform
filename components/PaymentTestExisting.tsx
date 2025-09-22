"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, RefreshCw, Database, Euro, FileText } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export function PaymentTestExisting() {
  const [isTesting, setIsTesting] = useState(false)
  const [results, setResults] = useState<any[]>([])

  const runPaymentTests = async () => {
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

      // Test 2: Vérifier la table payments
      tests.push({ test: "Table payments", status: "pending", message: "Test en cours..." })
      setResults([...tests])

      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('id, month, year, amount_due, status')
        .limit(5)

      if (paymentsError) {
        tests[1] = { test: "Table payments", status: "error", message: `Erreur: ${paymentsError.message}` }
      } else {
        tests[1] = { test: "Table payments", status: "success", message: `Table payments accessible (${payments?.length || 0} paiements)` }
      }
      setResults([...tests])

      // Test 3: Vérifier la table receipts
      tests.push({ test: "Table receipts", status: "pending", message: "Test en cours..." })
      setResults([...tests])

      const { data: receipts, error: receiptsError } = await supabase
        .from('receipts')
        .select('id, reference, total_amount')
        .limit(5)

      if (receiptsError) {
        tests[2] = { test: "Table receipts", status: "error", message: `Erreur: ${receiptsError.message}` }
      } else {
        tests[2] = { test: "Table receipts", status: "success", message: `Table receipts accessible (${receipts?.length || 0} quittances)` }
      }
      setResults([...tests])

      // Test 4: Vérifier la table reminders
      tests.push({ test: "Table reminders", status: "pending", message: "Test en cours..." })
      setResults([...tests])

      const { data: reminders, error: remindersError } = await supabase
        .from('reminders')
        .select('id, reminder_type, status')
        .limit(5)

      if (remindersError) {
        tests[3] = { test: "Table reminders", status: "error", message: `Erreur: ${remindersError.message}` }
      } else {
        tests[3] = { test: "Table reminders", status: "success", message: `Table reminders accessible (${reminders?.length || 0} rappels)` }
      }
      setResults([...tests])

      // Test 5: Vérifier les baux actifs
      tests.push({ test: "Baux actifs", status: "pending", message: "Test en cours..." })
      setResults([...tests])

      const { data: leases, error: leasesError } = await supabase
        .from('leases')
        .select('id, owner_id, tenant_id, status, monthly_rent')
        .eq('status', 'active')
        .limit(5)

      if (leasesError) {
        tests[4] = { test: "Baux actifs", status: "error", message: `Erreur: ${leasesError.message}` }
      } else {
        tests[4] = { test: "Baux actifs", status: "success", message: `Baux actifs trouvés: ${leases?.length || 0}` }
      }
      setResults([...tests])

      // Test 6: Tester la fonction de génération de paiements
      tests.push({ test: "Fonction generate_monthly_payments", status: "pending", message: "Test en cours..." })
      setResults([...tests])

      try {
        const { data: generatedPayments, error: generateError } = await supabase
          .rpc('generate_monthly_payments', { target_month: '2025-01' })

        if (generateError) {
          tests[5] = { test: "Fonction generate_monthly_payments", status: "error", message: `Erreur: ${generateError.message}` }
        } else {
          tests[5] = { test: "Fonction generate_monthly_payments", status: "success", message: `Fonction accessible (${generatedPayments?.length || 0} paiements générés)` }
        }
      } catch (error) {
        tests[5] = { test: "Fonction generate_monthly_payments", status: "error", message: `Erreur: ${error}` }
      }
      setResults([...tests])

      // Test 7: Tester les relations avec les utilisateurs
      tests.push({ test: "Relations avec utilisateurs", status: "pending", message: "Test en cours..." })
      setResults([...tests])

      try {
        const { data: paymentsWithUsers, error: relationsError } = await supabase
          .from('payments')
          .select(`
            id,
            amount_due,
            status,
            leases!inner(
              id,
              owner_id,
              tenant_id,
              property:properties(
                id,
                title
              )
            )
          `)
          .limit(3)

        if (relationsError) {
          tests[6] = { test: "Relations avec utilisateurs", status: "error", message: `Erreur: ${relationsError.message}` }
        } else {
          tests[6] = { test: "Relations avec utilisateurs", status: "success", message: `Relations OK (${paymentsWithUsers?.length || 0} paiements avec relations)` }
        }
      } catch (error) {
        tests[6] = { test: "Relations avec utilisateurs", status: "error", message: `Erreur: ${error}` }
      }
      setResults([...tests])

      // Test 8: Tester les statistiques
      tests.push({ test: "Fonction de statistiques", status: "pending", message: "Test en cours..." })
      setResults([...tests])

      try {
        // Récupérer un propriétaire pour tester
        const { data: owner } = await supabase
          .from('users')
          .select('id')
          .eq('user_type', 'owner')
          .limit(1)
          .single()

        if (owner) {
          const { data: stats, error: statsError } = await supabase
            .rpc('get_owner_payment_stats', { 
              owner_id: owner.id,
              start_date: '2025-01-01',
              end_date: '2025-12-31'
            })

          if (statsError) {
            tests[7] = { test: "Fonction de statistiques", status: "error", message: `Erreur: ${statsError.message}` }
          } else {
            tests[7] = { test: "Fonction de statistiques", status: "success", message: `Statistiques OK (${stats?.[0]?.total_received || 0}€ reçus)` }
          }
        } else {
          tests[7] = { test: "Fonction de statistiques", status: "error", message: "Aucun propriétaire trouvé" }
        }
      } catch (error) {
        tests[7] = { test: "Fonction de statistiques", status: "error", message: `Erreur: ${error}` }
      }
      setResults([...tests])

    } catch (error) {
      console.error('Erreur lors des tests:', error)
      tests.push({ test: "Erreur générale", status: "error", message: `Erreur: ${error}` })
    }

    setResults([...tests])
    setIsTesting(false)
    toast.success("Tests du module de paiements terminés")
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
          Tests du Module de Paiements (Structure Existante)
        </CardTitle>
        <CardDescription>
          Vérifiez que le module de paiements fonctionne avec votre structure de base de données existante
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Button 
            onClick={runPaymentTests} 
            disabled={isTesting}
            className="flex items-center gap-2"
          >
            {isTesting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Euro className="h-4 w-4" />
            )}
            {isTesting ? 'Tests en cours...' : 'Tester le Module Paiements'}
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
            <li>1. Exécutez d'abord le script <code>scripts/create-payment-functions.sql</code> dans Supabase</li>
            <li>2. Vérifiez que les tables payments, receipts, reminders existent</li>
            <li>3. Testez la génération de paiements mensuels</li>
            <li>4. Vérifiez que les relations avec les utilisateurs fonctionnent</li>
            <li>5. Si des erreurs persistent, consultez les logs de la console</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
