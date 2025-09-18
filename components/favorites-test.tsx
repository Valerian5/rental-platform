"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function FavoritesTest() {
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<string[]>([])

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testFavoritesAPI = async () => {
    setIsLoading(true)
    setTestResults([])
    
    try {
      addResult("🧪 Début des tests API Favoris")
      
      // Test 1: Récupérer les favoris
      addResult("1. Test GET /api/favorites")
      try {
        const { apiRequest } = await import("@/lib/api-client")
        const data = await apiRequest("/api/favorites")
        addResult(`✅ GET /api/favorites - Succès (${data.data?.length || 0} favoris)`)
      } catch (error: any) {
        addResult(`❌ GET /api/favorites - Échec: ${error.message}`)
      }

      // Test 2: Vérifier un favori
      addResult("2. Test GET /api/favorites/check")
      try {
        const { apiRequest } = await import("@/lib/api-client")
        const data = await apiRequest("/api/favorites/check?property_id=test-property")
        addResult(`✅ GET /api/favorites/check - Succès (favori: ${data.isFavorite})`)
      } catch (error: any) {
        addResult(`❌ GET /api/favorites/check - Échec: ${error.message}`)
      }

      // Test 3: Toggle favori
      addResult("3. Test POST /api/favorites/toggle")
      try {
        const { apiRequest } = await import("@/lib/api-client")
        const data = await apiRequest("/api/favorites/toggle", {
          method: "POST",
          body: JSON.stringify({ property_id: "test-property" })
        })
        addResult(`✅ POST /api/favorites/toggle - Succès (nouvel état: ${data.isFavorite})`)
      } catch (error: any) {
        addResult(`❌ POST /api/favorites/toggle - Échec: ${error.message}`)
      }

      addResult("🏁 Tests terminés")
      
    } catch (error: any) {
      addResult(`❌ Erreur générale: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          Test API Favoris
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testFavoritesAPI} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Test en cours...
            </>
          ) : (
            "Lancer les tests"
          )}
        </Button>

        {testResults.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Résultats des tests :</h4>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
