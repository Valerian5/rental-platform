"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DebugApiPage() {
  const [tenantId, setTenantId] = useState("64504874-4a99-4da5-938b-0858caf27044")
  const [ownerId, setOwnerId] = useState("211895cc-4c89-479b-8cce-0cb34b5404a5")
  const [userId, setUserId] = useState("64504874-4a99-4da5-938b-0858caf27044")
  const [tableName, setTableName] = useState("conversations")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testTenantOwnerApi = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/applications/tenant-owner?tenant_id=${tenantId}&owner_id=${ownerId}`)
      const data = await response.json()
      setResult(data)
      console.log("Résultat API tenant-owner:", data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
      console.error("Erreur:", err)
    } finally {
      setLoading(false)
    }
  }

  const testConversationsApi = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/conversations?user_id=${userId}`)
      const data = await response.json()
      setResult(data)
      console.log("Résultat API conversations:", data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
      console.error("Erreur:", err)
    } finally {
      setLoading(false)
    }
  }

  const testTableStructure = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/debug/tables-structure?table=${tableName}`)
      const data = await response.json()
      setResult(data)
      console.log(`Structure table ${tableName}:`, data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
      console.error("Erreur:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Débogage API</h1>

      <Tabs defaultValue="tenant-owner">
        <TabsList className="mb-4">
          <TabsTrigger value="tenant-owner">API Tenant-Owner</TabsTrigger>
          <TabsTrigger value="conversations">API Conversations</TabsTrigger>
          <TabsTrigger value="table-structure">Structure Tables</TabsTrigger>
        </TabsList>

        <TabsContent value="tenant-owner">
          <Card>
            <CardHeader>
              <CardTitle>Test API Tenant-Owner</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tenant-id">ID Locataire</Label>
                    <Input
                      id="tenant-id"
                      value={tenantId}
                      onChange={(e) => setTenantId(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="owner-id">ID Propriétaire</Label>
                    <Input
                      id="owner-id"
                      value={ownerId}
                      onChange={(e) => setOwnerId(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <Button onClick={testTenantOwnerApi} disabled={loading}>
                  {loading ? "Chargement..." : "Tester l'API"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversations">
          <Card>
            <CardHeader>
              <CardTitle>Test API Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="user-id">ID Utilisateur</Label>
                  <Input id="user-id" value={userId} onChange={(e) => setUserId(e.target.value)} className="mt-1" />
                </div>
                <Button onClick={testConversationsApi} disabled={loading}>
                  {loading ? "Chargement..." : "Tester l'API"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table-structure">
          <Card>
            <CardHeader>
              <CardTitle>Test Structure Tables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="table-name">Nom de la table</Label>
                  <Input
                    id="table-name"
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button onClick={testTableStructure} disabled={loading}>
                  {loading ? "Chargement..." : "Vérifier la structure"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Résultat</h2>
          <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-[500px]">
            <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  )
}
