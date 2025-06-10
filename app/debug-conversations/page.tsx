"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function DebugConversationsPage() {
  const [userId, setUserId] = useState("64504874-4a99-4da5-938b-0858caf27044")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testConversations = async () => {
    setLoading(true)
    try {
      console.log("🔍 Test conversations pour:", userId)

      const response = await fetch(`/api/conversations?user_id=${userId}`)
      const data = await response.json()

      console.log("📡 Réponse API:", data)
      setResult(data)
    } catch (error) {
      console.error("❌ Erreur:", error)
      setResult({ error: error instanceof Error ? error.message : "Erreur inconnue" })
    } finally {
      setLoading(false)
    }
  }

  const testPropertyImages = async () => {
    setLoading(true)
    try {
      console.log("🔍 Test images propriétés")

      // Tester avec un ID de propriété connu
      const response = await fetch(`/api/debug/property-images?property_id=test`)
      const data = await response.json()

      console.log("📡 Réponse images:", data)
      setResult(data)
    } catch (error) {
      console.error("❌ Erreur:", error)
      setResult({ error: error instanceof Error ? error.message : "Erreur inconnue" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Debug Conversations & Images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="flex-1"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={testConversations} disabled={loading}>
              Tester Conversations
            </Button>
            <Button onClick={testPropertyImages} disabled={loading} variant="outline">
              Tester Images Propriétés
            </Button>
          </div>

          {result && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Résultat :</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
