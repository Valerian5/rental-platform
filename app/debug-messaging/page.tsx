"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function DebugMessagingPage() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const testDatabase = async () => {
    setLoading(true)
    try {
      // Test 1: Vérifier les tables
      console.log("🔍 Test 1: Vérification des tables")
      const tablesResponse = await fetch("/api/debug/tables")
      const tablesData = await tablesResponse.json()

      // Test 2: Tester l'API conversations
      console.log("🔍 Test 2: Test API conversations")
      const conversationsResponse = await fetch("/api/conversations?user_id=211895cc-4c89-479b-8cce-0cb34b5404a5")
      const conversationsData = await conversationsResponse.json()

      // Test 3: Tester création de conversation
      console.log("🔍 Test 3: Test création conversation")
      const createResponse = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenant_id: "64504874-4a99-4da5-938b-0858caf27044",
          owner_id: "211895cc-4c89-479b-8cce-0cb34b5404a5",
          subject: "Test conversation",
        }),
      })
      const createData = await createResponse.json()

      setResults({
        tables: tablesData,
        conversations: conversationsData,
        creation: createData,
        tablesStatus: tablesResponse.status,
        conversationsStatus: conversationsResponse.status,
        createStatus: createResponse.status,
      })
    } catch (error) {
      console.error("Erreur test:", error)
      setResults({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Debug Messagerie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testDatabase} disabled={loading}>
            {loading ? "Test en cours..." : "Tester la messagerie"}
          </Button>

          {results.error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-red-800 mb-2">Erreur</h3>
                <pre className="text-sm text-red-600">{results.error}</pre>
              </CardContent>
            </Card>
          )}

          {results.tables && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Tables{" "}
                  <Badge variant={results.tablesStatus === 200 ? "default" : "destructive"}>
                    {results.tablesStatus}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
                  {JSON.stringify(results.tables, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {results.conversations && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  API Conversations{" "}
                  <Badge variant={results.conversationsStatus === 200 ? "default" : "destructive"}>
                    {results.conversationsStatus}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
                  {JSON.stringify(results.conversations, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {results.creation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Création Conversation{" "}
                  <Badge variant={results.createStatus === 201 ? "default" : "destructive"}>
                    {results.createStatus}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
                  {JSON.stringify(results.creation, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
