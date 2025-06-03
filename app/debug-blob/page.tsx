"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { fetchDocumentAsBase64, checkDocumentExists } from "@/lib/document-utils"

export default function DebugBlobPage() {
  const [testUrl, setTestUrl] = useState("blob:https://rental-platform-h5sj.vercel.app/example")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testDocument = async () => {
    setLoading(true)
    setResult(null)

    try {
      console.log("🧪 Test de récupération:", testUrl)

      // Test d'existence
      const exists = await checkDocumentExists(testUrl)
      console.log("📋 Document existe:", exists)

      // Test de récupération
      const base64 = await fetchDocumentAsBase64(testUrl)
      console.log("📄 Base64 récupéré:", !!base64)

      setResult({
        url: testUrl,
        exists,
        base64Available: !!base64,
        base64Preview: base64 ? base64.substring(0, 100) + "..." : null,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error("❌ Erreur test:", error)
      setResult({
        url: testUrl,
        error: error.message,
        timestamp: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  const testRealDocuments = async () => {
    setLoading(true)
    try {
      // Récupérer les documents depuis l'API
      const response = await fetch("/api/documents/list")
      const data = await response.json()

      if (data.all_documents && data.all_documents.length > 0) {
        const firstDoc = data.all_documents[0]
        setTestUrl(firstDoc.url)
        console.log("📋 Premier document trouvé:", firstDoc.url)
      } else {
        setResult({
          error: "Aucun document trouvé dans la base de données",
          timestamp: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error("❌ Erreur récupération documents:", error)
      setResult({
        error: error.message,
        timestamp: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Debug - Test récupération documents</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test manuel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder="URL du document à tester"
              className="flex-1"
            />
            <Button onClick={testDocument} disabled={loading}>
              {loading ? "Test..." : "Tester"}
            </Button>
          </div>

          <Button onClick={testRealDocuments} disabled={loading} variant="outline">
            Utiliser un vrai document
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Résultat du test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-sm">
              <div>
                <strong>URL:</strong> {result.url}
              </div>
              <div>
                <strong>Timestamp:</strong> {result.timestamp}
              </div>
              {result.error ? (
                <div className="text-red-500">
                  <strong>Erreur:</strong> {result.error}
                </div>
              ) : (
                <>
                  <div>
                    <strong>Document existe:</strong>{" "}
                    <span className={result.exists ? "text-green-500" : "text-red-500"}>
                      {result.exists ? "✅ Oui" : "❌ Non"}
                    </span>
                  </div>
                  <div>
                    <strong>Base64 disponible:</strong>{" "}
                    <span className={result.base64Available ? "text-green-500" : "text-red-500"}>
                      {result.base64Available ? "✅ Oui" : "❌ Non"}
                    </span>
                  </div>
                  {result.base64Preview && (
                    <div>
                      <strong>Aperçu base64:</strong>
                      <div className="bg-gray-100 p-2 rounded text-xs break-all">{result.base64Preview}</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
