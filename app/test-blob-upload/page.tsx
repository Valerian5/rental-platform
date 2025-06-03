"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUpload } from "@/components/file-upload"
import { Button } from "@/components/ui/button"

export default function TestBlobUploadPage() {
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  const [testResult, setTestResult] = useState<any>(null)

  const handleFilesUploaded = (urls: string[]) => {
    console.log("📁 Fichiers uploadés:", urls)
    setUploadedUrls(urls)
  }

  const testDocumentAccess = async () => {
    if (uploadedUrls.length === 0) {
      setTestResult({ error: "Aucun fichier uploadé à tester" })
      return
    }

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

    setTestResult({
      success: true,
      tested_files: results.length,
      accessible_files: results.filter((r) => r.accessible).length,
      results,
    })
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Test - Nouveau système d'upload</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload de fichiers</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUpload
            onFilesUploaded={handleFilesUploaded}
            maxFiles={3}
            folder="test-uploads"
            acceptedTypes={["image/*", "application/pdf"]}
          />
        </CardContent>
      </Card>

      {uploadedUrls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fichiers uploadés ({uploadedUrls.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {uploadedUrls.map((url, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded">
                  <span className="text-sm font-mono flex-1 truncate">{url}</span>
                  <Button size="sm" variant="outline" onClick={() => window.open(url, "_blank")}>
                    Ouvrir
                  </Button>
                </div>
              ))}
            </div>

            <Button onClick={testDocumentAccess}>Tester l'accessibilité</Button>
          </CardContent>
        </Card>
      )}

      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle>Résultat du test d'accessibilité</CardTitle>
          </CardHeader>
          <CardContent>
            {testResult.error ? (
              <div className="text-red-500">{testResult.error}</div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm">
                  <div>
                    <strong>Fichiers testés:</strong> {testResult.tested_files}
                  </div>
                  <div>
                    <strong>Fichiers accessibles:</strong> {testResult.accessible_files}
                  </div>
                </div>

                <div className="space-y-2">
                  {testResult.results.map((result: any, index: number) => (
                    <div key={index} className="border rounded p-3">
                      <div className="font-mono text-xs truncate mb-1">{result.url}</div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className={result.accessible ? "text-green-500" : "text-red-500"}>
                          {result.accessible ? "✅ Accessible" : "❌ Inaccessible"}
                        </span>
                        {result.status && <span>Status: {result.status}</span>}
                        {result.size && <span>Taille: {Math.round(result.size / 1024)} KB</span>}
                        {result.type && <span>Type: {result.type}</span>}
                        {result.error && <span className="text-red-500">Erreur: {result.error}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
