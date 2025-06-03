"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { listAvailableDocuments } from "@/lib/document-utils"

export default function DebugDocumentsPage() {
  const [documents, setDocuments] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const data = await listAvailableDocuments()
      setDocuments(data)
    } catch (error) {
      console.error("Erreur:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [])

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Debug - Documents disponibles</h1>
        <Button onClick={loadDocuments} disabled={loading}>
          {loading ? "Chargement..." : "Actualiser"}
        </Button>
      </div>

      {documents && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Bucket 'documents'</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{documents.documents_bucket.count} fichiers trouvés</p>
              {documents.documents_bucket.error && (
                <p className="text-red-500 text-sm mb-4">Erreur: {documents.documents_bucket.error}</p>
              )}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {documents.documents_bucket.files.map((file, index) => (
                  <div key={index} className="text-sm border rounded p-2">
                    <div className="font-medium">{file.name}</div>
                    <div className="text-muted-foreground">
                      {file.metadata?.size ? `${Math.round(file.metadata.size / 1024)} KB` : "Taille inconnue"}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bucket 'rental-files'</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {documents.rental_files_bucket.count} fichiers trouvés
              </p>
              {documents.rental_files_bucket.error && (
                <p className="text-red-500 text-sm mb-4">Erreur: {documents.rental_files_bucket.error}</p>
              )}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {documents.rental_files_bucket.files.map((file, index) => (
                  <div key={index} className="text-sm border rounded p-2">
                    <div className="font-medium">{file.name}</div>
                    <div className="text-muted-foreground">
                      {file.metadata?.size ? `${Math.round(file.metadata.size / 1024)} KB` : "Taille inconnue"}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Résumé</CardTitle>
        </CardHeader>
        <CardContent>
          {documents ? (
            <div className="space-y-2">
              <p>Total des fichiers: {documents.total_files}</p>
              <p>Bucket documents: {documents.documents_bucket.count} fichiers</p>
              <p>Bucket rental-files: {documents.rental_files_bucket.count} fichiers</p>
            </div>
          ) : (
            <p>Chargement...</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
