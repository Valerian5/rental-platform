"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function StorageSetupPage() {
  const [storageStatus, setStorageStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  const checkStorageStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/storage/setup")
      const data = await response.json()
      setStorageStatus(data)
      console.log("📊 Statut storage:", data)
    } catch (error) {
      console.error("❌ Erreur vérification storage:", error)
      setStorageStatus({
        configured: false,
        error: "Erreur de connexion à l'API",
      })
    } finally {
      setLoading(false)
    }
  }

  const testUpload = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/storage/setup", { method: "POST" })
      const data = await response.json()
      setTestResult(data)
      console.log("🧪 Résultat test:", data)
    } catch (error) {
      console.error("❌ Erreur test upload:", error)
      setTestResult({
        success: false,
        error: "Erreur lors du test",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkStorageStatus()
  }, [])

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Configuration du stockage</h1>
        <Button onClick={checkStorageStatus} disabled={loading}>
          {loading ? "Vérification..." : "Actualiser"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Statut Vercel Blob Storage
            {storageStatus && (
              <Badge variant={storageStatus.configured ? "default" : "destructive"}>
                {storageStatus.configured ? "✅ Configuré" : "❌ Non configuré"}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {storageStatus ? (
            <>
              {storageStatus.configured ? (
                <div className="space-y-2">
                  <Alert>
                    <AlertDescription>✅ Vercel Blob Storage est configuré et fonctionnel !</AlertDescription>
                  </Alert>

                  <div className="text-sm space-y-1">
                    <div>
                      <strong>Fichiers stockés:</strong> {storageStatus.blob_count}
                    </div>
                    {storageStatus.blobs && storageStatus.blobs.length > 0 && (
                      <div>
                        <strong>Exemples de fichiers:</strong>
                        <ul className="list-disc list-inside ml-4">
                          {storageStatus.blobs.map((blob: any, index: number) => (
                            <li key={index} className="font-mono text-xs">
                              {blob.pathname} ({blob.size} bytes)
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <Button onClick={testUpload} disabled={loading}>
                    {loading ? "Test en cours..." : "Tester l'upload"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription>❌ Vercel Blob Storage n'est pas configuré</AlertDescription>
                  </Alert>

                  <div>
                    <strong>Erreur:</strong> {storageStatus.error}
                  </div>

                  {storageStatus.instructions && (
                    <div>
                      <strong>Instructions de configuration:</strong>
                      <ol className="list-decimal list-inside ml-4 space-y-1">
                        {storageStatus.instructions.map((instruction: string, index: number) => (
                          <li key={index} className="text-sm">
                            {instruction}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {storageStatus.environment_variables_needed && (
                    <div>
                      <strong>Variables d'environnement nécessaires:</strong>
                      <ul className="list-disc list-inside ml-4">
                        {storageStatus.environment_variables_needed.map((env: string, index: number) => (
                          <li key={index} className="font-mono text-sm">
                            {env}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div>Chargement du statut...</div>
          )}
        </CardContent>
      </Card>

      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle>Résultat du test d'upload</CardTitle>
          </CardHeader>
          <CardContent>
            {testResult.success ? (
              <div className="space-y-2">
                <Alert>
                  <AlertDescription>✅ Test d'upload réussi !</AlertDescription>
                </Alert>
                <div className="text-sm">
                  <div>
                    <strong>Fichier créé:</strong> {testResult.test_file?.pathname}
                  </div>
                  <div>
                    <strong>URL:</strong> {testResult.test_file?.url}
                  </div>
                  <div>
                    <strong>Taille:</strong> {testResult.test_file?.size} bytes
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Alert>
                  <AlertDescription>❌ Échec du test d'upload</AlertDescription>
                </Alert>
                <div className="text-sm">
                  <strong>Erreur:</strong> {testResult.error}
                </div>
                {testResult.details && (
                  <div className="text-sm">
                    <strong>Détails:</strong> {testResult.details}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Prochaines étapes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>1. ✅ Configurer Vercel Blob Storage (si pas encore fait)</div>
            <div>2. 🔄 Migrer les documents existants vers Vercel Blob</div>
            <div>3. 🔧 Mettre à jour les formulaires d'upload</div>
            <div>4. 📄 Corriger la génération de PDF</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
