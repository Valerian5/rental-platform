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
  Clock,
  FileText,
  Eye,
  Download,
  RefreshCw,
  TrendingUp,
  Shield,
} from "lucide-react"
import { toast } from "sonner"

interface ValidationResult {
  documentId: string
  documentType: string
  isValid: boolean
  confidence: number
  errors: ValidationError[]
  warnings: ValidationWarning[]
  extractedData: Record<string, any>
  processingTime: number
  timestamp: string
}

interface ValidationError {
  code: string
  message: string
  severity: "critical" | "major" | "minor"
  field?: string
  suggestion?: string
}

interface ValidationWarning {
  code: string
  message: string
  field?: string
}

interface DocumentValidationDashboardProps {
  tenantId: string
  onValidationComplete?: (result: ValidationResult) => void
}

const DOCUMENT_TYPE_LABELS = {
  identity: "Pièce d'identité",
  tax_notice: "Avis d'imposition",
  payslip: "Fiche de paie",
  bank_statement: "Relevé bancaire",
  employment_certificate: "Attestation employeur",
  rent_receipt: "Quittance de loyer",
}

const SEVERITY_COLORS = {
  critical: "destructive",
  major: "secondary",
  minor: "outline",
} as const

export function DocumentValidationDashboard({ tenantId, onValidationComplete }: DocumentValidationDashboardProps) {
  const [validations, setValidations] = useState<ValidationResult[]>([])
  const [loading, setLoading] = useState(true)
  const [validatingDocuments, setValidatingDocuments] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadValidationHistory()
  }, [tenantId])

  const loadValidationHistory = async () => {
    try {
      setLoading(true)

      const response = await fetch(`/api/documents/validate?tenantId=${tenantId}`)
      const result = await response.json()

      if (result.success) {
        setValidations(result.validations || [])
      } else {
        toast.error("Erreur lors du chargement de l'historique")
      }
    } catch (error) {
      console.error("Erreur chargement historique:", error)
      toast.error("Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }

  const validateDocument = async (documentUrl: string, documentType: string) => {
    try {
      setValidatingDocuments((prev) => new Set([...prev, documentUrl]))

      const response = await fetch("/api/documents/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentUrl,
          documentType,
          tenantId,
        }),
      })

      const result = await response.json()

      if (result.success) {
        const validation = result.validation
        setValidations((prev) => [validation, ...prev])

        if (validation.isValid) {
          toast.success(`Document ${DOCUMENT_TYPE_LABELS[documentType]} validé avec succès`)
        } else {
          toast.warning(`Document ${DOCUMENT_TYPE_LABELS[documentType]} contient des erreurs`)
        }

        onValidationComplete?.(validation)
      } else {
        toast.error(result.error || "Erreur lors de la validation")
      }
    } catch (error) {
      console.error("Erreur validation:", error)
      toast.error("Erreur lors de la validation du document")
    } finally {
      setValidatingDocuments((prev) => {
        const newSet = new Set(prev)
        newSet.delete(documentUrl)
        return newSet
      })
    }
  }

  const getValidationStats = () => {
    const total = validations.length
    const valid = validations.filter((v) => v.isValid).length
    const invalid = total - valid
    const avgConfidence = total > 0 ? validations.reduce((sum, v) => sum + v.confidence, 0) / total : 0
    const avgProcessingTime = total > 0 ? validations.reduce((sum, v) => sum + v.processingTime, 0) / total : 0

    return { total, valid, invalid, avgConfidence, avgProcessingTime }
  }

  const getDocumentTypeStats = () => {
    const stats: Record<string, { total: number; valid: number; invalid: number }> = {}

    validations.forEach((v) => {
      if (!stats[v.documentType]) {
        stats[v.documentType] = { total: 0, valid: 0, invalid: 0 }
      }
      stats[v.documentType].total++
      if (v.isValid) {
        stats[v.documentType].valid++
      } else {
        stats[v.documentType].invalid++
      }
    })

    return stats
  }

  const stats = getValidationStats()
  const documentTypeStats = getDocumentTypeStats()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistiques générales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Documents</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Documents Valides</p>
                <p className="text-2xl font-bold text-green-600">{stats.valid}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Confiance Moyenne</p>
                <p className="text-2xl font-bold">{(stats.avgConfidence * 100).toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Temps Moyen</p>
                <p className="text-2xl font-bold">{(stats.avgProcessingTime / 1000).toFixed(1)}s</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau de bord principal */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="errors">Erreurs & Avertissements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Statistiques par type de document */}
          <Card>
            <CardHeader>
              <CardTitle>Validation par Type de Document</CardTitle>
              <CardDescription>Répartition des validations par type de document</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(documentTypeStats).map(([type, typeStats]) => (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4" />
                        <span className="font-medium">{DOCUMENT_TYPE_LABELS[type] || type}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-green-600">
                          {typeStats.valid} valides
                        </Badge>
                        {typeStats.invalid > 0 && <Badge variant="destructive">{typeStats.invalid} invalides</Badge>}
                      </div>
                    </div>
                    <Progress value={(typeStats.valid / typeStats.total) * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Score de conformité global */}
          <Card>
            <CardHeader>
              <CardTitle>Score de Conformité Global</CardTitle>
              <CardDescription>Évaluation globale de la qualité du dossier</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center space-x-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {stats.total > 0 ? Math.round((stats.valid / stats.total) * 100) : 0}%
                  </div>
                  <p className="text-sm text-muted-foreground">Documents Valides</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">{Math.round(stats.avgConfidence * 100)}%</div>
                  <p className="text-sm text-muted-foreground">Confiance Moyenne</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Historique des Validations</h3>
            <Button onClick={loadValidationHistory} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>

          <div className="space-y-4">
            {validations.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucun document validé pour le moment</p>
                </CardContent>
              </Card>
            ) : (
              validations.map((validation) => (
                <Card key={validation.documentId}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            {DOCUMENT_TYPE_LABELS[validation.documentType] || validation.documentType}
                          </Badge>
                          {validation.isValid ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Valide
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Invalide
                            </Badge>
                          )}
                          <Badge variant="secondary">{Math.round(validation.confidence * 100)}% confiance</Badge>
                        </div>

                        <p className="text-sm text-muted-foreground">
                          Validé le {new Date(validation.timestamp).toLocaleString("fr-FR")}• Traité en{" "}
                          {validation.processingTime}ms
                        </p>

                        {validation.errors.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-red-600">Erreurs détectées:</p>
                            {validation.errors.slice(0, 3).map((error, index) => (
                              <Alert key={index} variant="destructive" className="py-2">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription className="text-sm">
                                  {error.message}
                                  {error.suggestion && (
                                    <span className="block mt-1 text-xs">💡 {error.suggestion}</span>
                                  )}
                                </AlertDescription>
                              </Alert>
                            ))}
                            {validation.errors.length > 3 && (
                              <p className="text-xs text-muted-foreground">
                                +{validation.errors.length - 3} autres erreurs
                              </p>
                            )}
                          </div>
                        )}

                        {validation.warnings.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-orange-600">Avertissements:</p>
                            {validation.warnings.slice(0, 2).map((warning, index) => (
                              <Alert key={index} className="py-2">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription className="text-sm">{warning.message}</AlertDescription>
                              </Alert>
                            ))}
                            {validation.warnings.length > 2 && (
                              <p className="text-xs text-muted-foreground">
                                +{validation.warnings.length - 2} autres avertissements
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Détails
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Rapport
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analyse des Erreurs</CardTitle>
              <CardDescription>Erreurs et avertissements détectés lors des validations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {validations
                  .filter((v) => v.errors.length > 0 || v.warnings.length > 0)
                  .map((validation) => (
                    <div key={validation.documentId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{DOCUMENT_TYPE_LABELS[validation.documentType]}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(validation.timestamp).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                        <Badge variant={validation.isValid ? "secondary" : "destructive"}>
                          {validation.errors.length} erreurs, {validation.warnings.length} avertissements
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        {validation.errors.map((error, index) => (
                          <Alert key={`error-${index}`} variant="destructive">
                            <XCircle className="h-4 w-4" />
                            <AlertDescription>
                              <div className="flex items-center justify-between">
                                <span>{error.message}</span>
                                <Badge variant={SEVERITY_COLORS[error.severity]}>{error.severity}</Badge>
                              </div>
                              {error.field && <p className="text-xs mt-1">Champ: {error.field}</p>}
                              {error.suggestion && <p className="text-xs mt-1 text-blue-600">💡 {error.suggestion}</p>}
                            </AlertDescription>
                          </Alert>
                        ))}

                        {validation.warnings.map((warning, index) => (
                          <Alert key={`warning-${index}`}>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              <div className="flex items-center justify-between">
                                <span>{warning.message}</span>
                                {warning.field && <Badge variant="outline">{warning.field}</Badge>}
                              </div>
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  ))}

                {validations.filter((v) => v.errors.length > 0 || v.warnings.length > 0).length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucune erreur détectée dans les documents validés</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
