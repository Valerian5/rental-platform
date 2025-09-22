"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, RefreshCw, Database, Zap } from "lucide-react"
import { toast } from "sonner"

interface TestResult {
  test: string
  status: 'success' | 'error' | 'pending'
  message: string
  details?: any
}

export function PaymentTestComponent() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])

  const runTests = async () => {
    setIsRunning(true)
    setResults([])

    const tests: TestResult[] = []

    try {
      // Test 1: Vérifier la connexion à l'API
      tests.push({ test: "Connexion API", status: "pending", message: "Test en cours..." })
      setResults([...tests])

      const response = await fetch('/api/payments?ownerId=test')
      if (response.status === 401) {
        tests[0] = { test: "Connexion API", status: "success", message: "API accessible (authentification requise)" }
      } else if (response.ok) {
        tests[0] = { test: "Connexion API", status: "success", message: "API accessible" }
      } else {
        tests[0] = { test: "Connexion API", status: "error", message: `Erreur ${response.status}` }
      }
      setResults([...tests])

      // Test 2: Vérifier les statistiques
      tests.push({ test: "Statistiques", status: "pending", message: "Test en cours..." })
      setResults([...tests])

      const statsResponse = await fetch('/api/payments/stats/test?period=month')
      if (statsResponse.status === 401) {
        tests[1] = { test: "Statistiques", status: "success", message: "Endpoint statistiques accessible" }
      } else if (statsResponse.ok) {
        const stats = await statsResponse.json()
        tests[1] = { test: "Statistiques", status: "success", message: "Statistiques calculées", details: stats }
      } else {
        tests[1] = { test: "Statistiques", status: "error", message: `Erreur ${statsResponse.status}` }
      }
      setResults([...tests])

      // Test 3: Vérifier la génération des paiements
      tests.push({ test: "Génération paiements", status: "pending", message: "Test en cours..." })
      setResults([...tests])

      const generateResponse = await fetch('/api/payments/generate-monthly', { method: 'POST' })
      if (generateResponse.status === 401) {
        tests[2] = { test: "Génération paiements", status: "success", message: "Endpoint génération accessible" }
      } else if (generateResponse.ok) {
        const payments = await generateResponse.json()
        tests[2] = { test: "Génération paiements", status: "success", message: `${payments.length} paiements générés`, details: payments }
      } else {
        const error = await generateResponse.json()
        tests[2] = { test: "Génération paiements", status: "error", message: `Erreur ${generateResponse.status}`, details: error }
      }
      setResults([...tests])

      // Test 4: Vérifier la migration
      tests.push({ test: "Migration", status: "pending", message: "Test en cours..." })
      setResults([...tests])

      const migrationResponse = await fetch('/api/migrate/payments', { method: 'POST' })
      if (migrationResponse.status === 401) {
        tests[3] = { test: "Migration", status: "success", message: "Endpoint migration accessible (authentification requise)" }
      } else if (migrationResponse.ok) {
        const migration = await migrationResponse.json()
        tests[3] = { test: "Migration", status: "success", message: "Migration réussie", details: migration }
      } else {
        const error = await migrationResponse.json()
        tests[3] = { test: "Migration", status: "error", message: `Erreur ${migrationResponse.status}`, details: error }
      }
      setResults([...tests])

    } catch (error) {
      console.error('Erreur lors des tests:', error)
      tests.push({ test: "Erreur générale", status: "error", message: `Erreur: ${error}` })
    }

    setResults([...tests])
    setIsRunning(false)
    toast.success("Tests terminés")
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
          Tests du Module de Paiements
        </CardTitle>
        <CardDescription>
          Vérifiez que le module de gestion des paiements est correctement installé et configuré
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Button 
            onClick={runTests} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            {isRunning ? 'Tests en cours...' : 'Lancer les tests'}
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
                    {result.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-blue-600 cursor-pointer">
                          Voir les détails
                        </summary>
                        <pre className="text-xs bg-gray-100 p-2 mt-1 rounded overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
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
            <li>1. Assurez-vous d'être connecté en tant qu'admin</li>
            <li>2. Exécutez d'abord la migration si ce n'est pas fait</li>
            <li>3. Configurez au moins un bail avec des paramètres de paiement</li>
            <li>4. Testez la génération des paiements mensuels</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
