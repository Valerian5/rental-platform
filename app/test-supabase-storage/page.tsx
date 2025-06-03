"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SupabaseFileUpload } from "@/components/supabase-file-upload"
import { Badge } from "@/components/ui/badge"

export default function TestSupabaseStoragePage() {
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  const [testResults, setTestResults] = useState<any[]>([])

  const handleFilesUploaded = (urls: string[]) => {
    console.log("📁 Fichiers uploadés:", urls)
    setUploadedUrls(urls)
  }

  const testFileAccess = async () => {
    console.log("🧪 Test d'accès aux fichiers...")
    const results = []

    for (const url of uploadedUrls) {
      try {
        const response = await fetch(url, { method: "HEAD" })
        results.push({
          url,
          accessible: response.ok,
          status: response.status,
          size: response.headers.get("content-length"),
          type: response.headers.get("content-type"),
        })
      } catch (error) {
        results.push({
          url,
          accessible: false,
          error: error.message,
        })
      }
    }

    setTestResults(results)
    console.log("📊 Résultats des tests:", results)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Test Supabase Storage</h1>
        <Badge variant="outline">Stockage unifié</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload de test</CardTitle>
        </CardHeader>
        <CardContent>
          <SupabaseFileUpload
            onFilesUploaded={handleFilesUploaded}
            maxFiles={3}
            bucket="documents"
            folder="test"
            acceptedTypes={["image/*", "application/pdf", "text/*"]}
          />
        </CardContent>
      </Card>

      {uploadedUrls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Fichiers uploadés ({uploadedUrls.length})
              <Button onClick={testFileAccess} size="sm">
                Tester l'accès
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {uploadedUrls.map((url, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Fichier {index + 1}</p>
                    <p className="text-xs text-gray-500 truncate">{url}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => window.open(url, "_blank")}>
                    Ouvrir
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Résultats des tests d'accès</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div key={index} className="p-3 border rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={result.accessible ? "default" : "destructive"}>
                      {result.accessible ? "✅ Accessible" : "❌ Inaccessible"}
                    </Badge>
                    <span className="text-sm">HTTP {result.status}</span>
                  </div>
                  <div className="text-xs space-y-1">
                    <div>
                      <strong>URL:</strong> {result.url}
                    </div>
                    {result.size && (
                      <div>
                        <strong>Taille:</strong> {result.size} bytes
                      </div>
                    )}
                    {result.type && (
                      <div>
                        <strong>Type:</strong> {result.type}
                      </div>
                    )}
                    {result.error && (
                      <div className="text-red-500">
                        <strong>Erreur:</strong> {result.error}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Avantages Supabase Storage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>
              ✅ <strong>Déjà configuré</strong> - Pas de token supplémentaire
            </div>
            <div>
              ✅ <strong>Intégration native</strong> - Même base de données
            </div>
            <div>
              ✅ <strong>Gestion des permissions</strong> - RLS intégré
            </div>
            <div>
              ✅ <strong>API complète</strong> - Upload, download, delete, list
            </div>
            <div>
              ✅ <strong>Transformations d'images</strong> - Redimensionnement automatique
            </div>
            <div>
              ✅ <strong>Moins cher</strong> - Pas de coût supplémentaire
            </div>
            <div>
              ✅ <strong>Une seule stack</strong> - Simplicité de maintenance
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
