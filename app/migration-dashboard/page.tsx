"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, RefreshCw, Database, FileText } from "lucide-react"
import { MigrationService } from "@/lib/migration-service"
import { toast } from "sonner"

export default function MigrationDashboardPage() {
  const [analysis, setAnalysis] = useState<any>(null)
  const [migrationResult, setMigrationResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runAnalysis = async () => {
    try {
      setLoading(true)
      toast.info("Analyse en cours...")

      const result = await MigrationService.analyzeBlobUrls()
      setAnalysis(result)

      toast.success("Analyse terminée")
    } catch (error) {
      console.error("Erreur analyse:", error)
      toast.error("Erreur lors de l'analyse")
    } finally {
      setLoading(false)
    }
  }

  const runMigration = async () => {
    try {
      setLoading(true)
      toast.info("Migration en cours...")

      const result = await MigrationService.replaceBlobUrls()
      setMigrationResult(result)

      toast.success("Migration terminée")
    } catch (error) {
      console.error("Erreur migration:", error)
      toast.error("Erreur lors de la migration")
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async () => {
    try {
      setLoading(true)
      const report = await MigrationService.generateMigrationReport()
      console.log("📋 Rapport de migration:", report)
      toast.success("Rapport généré (voir console)")
    } catch (error) {
      console.error("Erreur rapport:", error)
      toast.error("Erreur lors de la génération du rapport")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Migration vers Supabase Storage</h1>
        <Badge variant="outline">Nettoyage des données</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Analyse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={runAnalysis} disabled={loading} className="w-full">
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
              Analyser les données
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Migration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={runMigration} disabled={loading || !analysis} className="w-full">
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
              Migrer les URLs
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Rapport
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={generateReport} disabled={loading} variant="outline" className="w-full">
              Générer rapport
            </Button>
          </CardContent>
        </Card>
      </div>

      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Résultats de l'analyse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{analysis.totalFiles}</div>
                <div className="text-sm text-gray-600">Total fichiers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{analysis.blobUrls.length}</div>
                <div className="text-sm text-gray-600">URLs blob</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{analysis.validUrls.length}</div>
                <div className="text-sm text-gray-600">URLs valides</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{analysis.filesToMigrate}</div>
                <div className="text-sm text-gray-600">À migrer</div>
              </div>
            </div>

            {analysis.filesToMigrate > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Action requise</h4>
                    <p className="text-sm text-yellow-700">
                      {analysis.filesToMigrate} URLs blob temporaires doivent être migrées.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {analysis.filesToMigrate === 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">Aucune migration nécessaire</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {migrationResult && (
        <Card>
          <CardHeader>
            <CardTitle>Résultats de la migration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{migrationResult.filesUpdated}</div>
                  <div className="text-sm text-gray-600">Fichiers mis à jour</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{migrationResult.urlsReplaced}</div>
                  <div className="text-sm text-gray-600">URLs remplacées</div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">Migration terminée avec succès</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Les URLs blob ont été remplacées par des placeholders. Les utilisateurs devront re-uploader leurs
                  documents.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Prochaines étapes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-xs font-medium text-blue-600">1</span>
              </div>
              <span>Analyser les données existantes</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-xs font-medium text-blue-600">2</span>
              </div>
              <span>Migrer les URLs blob vers des placeholders</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-xs font-medium text-blue-600">3</span>
              </div>
              <span>Tester le nouveau système d'upload Supabase</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-xs font-medium text-blue-600">4</span>
              </div>
              <span>Informer les utilisateurs de re-uploader leurs documents</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
