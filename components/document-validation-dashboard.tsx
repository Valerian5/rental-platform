"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Clock,
  TrendingUp,
  Download,
  RefreshCw,
  Eye,
} from "lucide-react"
import type { DocumentValidationResult } from "@/lib/document-validation-service"

interface DocumentValidationDashboardProps {
  tenantId: string
  onViewDocument?: (documentId: string) => void
  onRetryValidation?: (documentId: string) => void
}

interface ValidationStats {
  totalDocuments: number
  validDocuments: number
  averageConfidence: number
  errorsByType: Record<string, number>
  processingTimeAvg: number
}

const DOCUMENT_TYPE_LABELS = {
  identity: "Pièce d'identité",
  tax_notice: "Avis d'imposition",
  payslip: "Fiche de paie",
  bank_statement: "Relevé bancaire",
}

export function DocumentValidationDashboard({
  tenantId,
  onViewDocument,
  onRetryValidation,
}: DocumentValidationDashboardProps) {
  const [history, setHistory] = useState<DocumentValidationResult[]>([])
  const [stats, setStats] = useState<ValidationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/documents/validate?tenantId=${tenantId}`)

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des données")
      }

      const { data } = await response.json()
      setHistory(data.history || [])
      setStats(data.stats || null)
    } catch (err) {
      console.error("Erreur chargement dashboard:", err)
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tenantId) {
      fetchData()
    }
  }, [tenantId])

  const getStatusColor = (result: DocumentValidationResult) => {
    if (result.isValid) return "text-green-600"
    if (result.errors.some((e) => e.severity === "critical")) return "text-red-600"
    return "text-yellow-600"
  }

  const getStatusIcon = (result: DocumentValidationResult) => {
    if (result.isValid) return <CheckCircle className="h-4 w-4 text-green-600" />
    if (result.errors.some((e) => e.severity === "critical")) return <XCircle className="h-4 w-4 text-red-600" />
    return <AlertTriangle className="h-4 w-4 text-yellow-600" />
  }

  const exportResults = () => {
    const csvContent = [
      ["Type", "Statut", "Confiance", "Date", "Temps de traitement"].join(","),
      ...history.map((result) =>
        [
          DOCUMENT_TYPE_LABELS[result.documentType as keyof typeof DOCUMENT_TYPE_LABELS] || result.documentType,
          result.isValid ? "Valide" : "Invalide",
          `${Math.round(result.confidence * 100)}%`,
          new Date(result.timestamp).toLocaleDateString(),
          `${result.processingTime}ms`,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `validation-results-${tenantId}-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button variant="outline" size="sm" onClick={fetchData} className="ml-2 bg-transparent">
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistiques globales */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total documents</p>
                  <p className="text-2xl font-bold">{stats.totalDocuments}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Documents valides</p>
                  <p className="text-2xl font-bold text-green-600">{stats.validDocuments}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="mt-2">
                <Progress
                  value={stats.totalDocuments > 0 ? (stats.validDocuments / stats.totalDocuments) * 100 : 0}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Confiance moyenne</p>
                  <p className="text-2xl font-bold">{Math.round(stats.averageConfidence * 100)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Temps moyen</p>
                  <p className="text-2xl font-bold">{Math.round(stats.processingTimeAvg / 1000)}s</p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Contenu principal */}
      <Tabs defaultValue="history" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="history">Historique</TabsTrigger>
            <TabsTrigger value="errors">Erreurs</TabsTrigger>
            <TabsTrigger value="analytics">Analytiques</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button variant="outline" onClick={exportResults}>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        <TabsContent value="history" className="space-y-4">
          {history.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucun document validé</h3>
                <p className="text-muted-foreground">Commencez par télécharger et valider vos premiers documents.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {history.map((result) => (
                <Card key={result.documentId}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result)}
                        <div>
                          <h4 className="font-medium">
                            {DOCUMENT_TYPE_LABELS[result.documentType as keyof typeof DOCUMENT_TYPE_LABELS] ||
                              result.documentType}
                          </h4>
                          <p className="text-sm text-muted-foreground">{new Date(result.timestamp).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge variant={result.isValid ? "default" : "destructive"}>
                          {result.isValid ? "Valide" : "Invalide"}
                        </Badge>
                        <Badge variant="outline">{Math.round(result.confidence * 100)}% confiance</Badge>
                        <span className="text-sm text-muted-foreground">{result.processingTime}ms</span>

                        <div className="flex gap-1">
                          {onViewDocument && (
                            <Button variant="ghost" size="sm" onClick={() => onViewDocument(result.documentId)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {!result.isValid && onRetryValidation && (
                            <Button variant="ghost" size="sm" onClick={() => onRetryValidation(result.documentId)}>
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Erreurs et avertissements */}
                    {(result.errors.length > 0 || result.warnings.length > 0) && (
                      <div className="mt-3 space-y-2">
                        {result.errors.map((error, index) => (
                          <Alert key={index} variant="destructive">
                            <XCircle className="h-4 w-4" />
                            <AlertDescription>
                              <strong>{error.message}</strong>
                              {error.suggestion && <p className="text-sm mt-1">💡 {error.suggestion}</p>}
                            </AlertDescription>
                          </Alert>
                        ))}

                        {result.warnings.map((warning, index) => (
                          <Alert key={index}>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{warning.message}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          {stats && Object.keys(stats.errorsByType).length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Erreurs les plus fréquentes</CardTitle>
                <CardDescription>Analyse des erreurs rencontrées lors des validations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.errorsByType)
                    .sort(([, a], [, b]) => b - a)
                    .map(([errorCode, count]) => (
                      <div key={errorCode} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{errorCode.replace(/_/g, " ")}</p>
                          <p className="text-sm text-muted-foreground">
                            {count} occurrence{count > 1 ? "s" : ""}
                          </p>
                        </div>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucune erreur détectée</h3>
                <p className="text-muted-foreground">Tous vos documents ont été validés sans erreur.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Répartition par type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(
                    history.reduce(
                      (acc, result) => {
                        acc[result.documentType] = (acc[result.documentType] || 0) + 1
                        return acc
                      },
                      {} as Record<string, number>,
                    ),
                  ).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm">
                        {DOCUMENT_TYPE_LABELS[type as keyof typeof DOCUMENT_TYPE_LABELS] || type}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${(count / history.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Évolution de la confiance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {history.slice(0, 5).map((result, index) => (
                    <div key={result.documentId} className="flex items-center justify-between">
                      <span className="text-sm">
                        {DOCUMENT_TYPE_LABELS[result.documentType as keyof typeof DOCUMENT_TYPE_LABELS]}
                      </span>
                      <div className="flex items-center gap-2">
                        <Progress value={result.confidence * 100} className="w-20 h-2" />
                        <span className="text-sm font-medium">{Math.round(result.confidence * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
