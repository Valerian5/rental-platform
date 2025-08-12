"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Eye,
  CheckCircle,
  AlertTriangle,
  XCircle,
  QrCode,
  FileText,
  Calendar,
  User,
  Euro,
  Building,
  Clock,
} from "lucide-react"

interface DocumentPreviewAnalyzerProps {
  fileUrl: string
  fileName: string
  documentType: string
  onAnalysisComplete: (analysis: any) => void
}

interface AnalysisResult {
  documentType: string
  confidenceScore: number
  qrCodeData?: any
  extractedData: any
  validations: any
  recommendations: string[]
  warnings: string[]
  errors: string[]
  needsUpdate: boolean
  nextUpdateDate?: Date | null
  documentAge?: number
}

export function DocumentPreviewAnalyzer({
  fileUrl,
  fileName,
  documentType,
  onAnalysisComplete,
}: DocumentPreviewAnalyzerProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [userValidation, setUserValidation] = useState<Record<string, boolean>>({})
  const [showPreview, setShowPreview] = useState(true)

  useEffect(() => {
    analyzeDocument()
  }, [fileUrl, documentType])

  const analyzeDocument = async () => {
    try {
      setLoading(true)
      console.log("🔍 Analyse du document:", { fileUrl, fileName, documentType })

      const response = await fetch("/api/documents/analyze-2ddoc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl, fileName, documentType }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setAnalysis(result.analysis)
        onAnalysisComplete(result.analysis)
        console.log("✅ Analyse terminée:", result.analysis)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("❌ Erreur analyse:", error)
      setAnalysis({
        documentType,
        confidenceScore: 0,
        extractedData: { fileName },
        validations: {},
        recommendations: [],
        warnings: ["Erreur lors de l'analyse automatique"],
        errors: ["Impossible d'analyser le document"],
        needsUpdate: false,
      })
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default"
    if (score >= 60) return "secondary"
    return "destructive"
  }

  const handleUserValidation = (key: string, value: boolean) => {
    setUserValidation((prev) => ({ ...prev, [key]: value }))
  }

  const getValidationQuestions = () => {
    const questions: Array<{ key: string; question: string; critical: boolean }> = []

    switch (documentType) {
      case "tax_notice":
        questions.push(
          {
            key: "correct_year",
            question: `S'agit-il bien de votre avis d'imposition ${new Date().getFullYear() - 1} ?`,
            critical: true,
          },
          {
            key: "complete_document",
            question: "Le document est-il complet (toutes les pages incluses) ?",
            critical: true,
          },
          { key: "readable_qr", question: "Le QR Code en bas à droite est-il visible et lisible ?", critical: false },
          { key: "correct_name", question: "Le nom sur l'avis correspond-il à votre identité ?", critical: true },
        )
        break

      case "payslip":
        questions.push(
          {
            key: "recent_payslip",
            question: "Cette fiche de paie est-elle de l'un des 3 derniers mois ?",
            critical: true,
          },
          { key: "complete_payslip", question: "La fiche de paie est-elle complète et lisible ?", critical: true },
          { key: "correct_employer", question: "L'employeur mentionné est-il correct ?", critical: true },
          {
            key: "net_gross_visible",
            question: "Les montants brut et net sont-ils clairement visibles ?",
            critical: true,
          },
        )
        break

      case "identity":
        questions.push(
          { key: "valid_document", question: "Le document d'identité est-il en cours de validité ?", critical: true },
          { key: "both_sides", question: "Avez-vous fourni le recto ET le verso ?", critical: true },
          { key: "readable_photo", question: "La photo et les informations sont-elles lisibles ?", critical: true },
          { key: "no_damage", question: "Le document n'est-il pas endommagé ou altéré ?", critical: true },
        )
        break

      case "bank_statement":
        questions.push(
          { key: "recent_statement", question: "Ce relevé est-il de l'un des 3 derniers mois ?", critical: true },
          {
            key: "complete_statement",
            question: "Le relevé est-il complet (première et dernière page) ?",
            critical: true,
          },
          {
            key: "correct_holder",
            question: "Le titulaire du compte correspond-il à votre identité ?",
            critical: true,
          },
          {
            key: "transactions_visible",
            question: "Les transactions sont-elles clairement visibles ?",
            critical: false,
          },
        )
        break

      case "employment_contract":
        questions.push(
          { key: "signed_contract", question: "Le contrat est-il signé par toutes les parties ?", critical: true },
          { key: "complete_contract", question: "Le contrat est-il complet (toutes les pages) ?", critical: true },
          { key: "recent_contract", question: "Le contrat est-il récent ou à venir ?", critical: false },
          { key: "correct_terms", question: "Les conditions (salaire, durée) sont-elles correctes ?", critical: true },
        )
        break
    }

    return questions
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Analyse du document en cours...</p>
        </CardContent>
      </Card>
    )
  }

  if (!analysis) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-red-600">
          <XCircle className="h-8 w-8 mx-auto mb-2" />
          <p>Erreur lors de l'analyse du document</p>
        </CardContent>
      </Card>
    )
  }

  const validationQuestions = getValidationQuestions()

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Analyse du document
          </CardTitle>
          <Badge variant={getScoreBadgeVariant(analysis.confidenceScore)}>Score: {analysis.confidenceScore}%</Badge>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="preview">Aperçu</TabsTrigger>
            <TabsTrigger value="analysis">Analyse</TabsTrigger>
            <TabsTrigger value="data">Données</TabsTrigger>
            <TabsTrigger value="validation">Vérification</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Prévisualisation du document</h3>
              <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? "Masquer" : "Afficher"}
              </Button>
            </div>

            {showPreview && (
              <div className="border rounded-lg overflow-hidden">
                <iframe src={fileUrl} className="w-full h-96" title="Aperçu du document" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Nom du fichier:</span>
                <p className="text-gray-600 truncate">{fileName}</p>
              </div>
              <div>
                <span className="font-medium">Type de document:</span>
                <p className="text-gray-600">{analysis.documentType}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <div className="space-y-4">
              {/* Score de confiance */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium">Score de confiance</h4>
                  <p className="text-sm text-gray-600">Fiabilité de l'analyse automatique</p>
                </div>
                <div className={`text-2xl font-bold ${getScoreColor(analysis.confidenceScore)}`}>
                  {analysis.confidenceScore}%
                </div>
              </div>

              {/* Recommandations */}
              {analysis.recommendations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Recommandations
                  </h4>
                  {analysis.recommendations.map((rec, index) => (
                    <Alert key={index}>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>{rec}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              {/* Avertissements */}
              {analysis.warnings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    Avertissements
                  </h4>
                  {analysis.warnings.map((warning, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{warning}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              {/* Erreurs */}
              {analysis.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    Erreurs détectées
                  </h4>
                  {analysis.errors.map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              {/* Mise à jour nécessaire */}
              {analysis.needsUpdate && (
                <Alert variant="destructive">
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Ce document nécessite une mise à jour.
                    {analysis.nextUpdateDate && (
                      <span className="block mt-1">
                        Prochaine mise à jour recommandée:{" "}
                        {new Date(analysis.nextUpdateDate).toLocaleDateString("fr-FR")}
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <div className="space-y-4">
              {/* Données extraites */}
              <div>
                <h4 className="font-medium mb-3">Données extraites automatiquement</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(analysis.extractedData).map(([key, value]) => (
                    <div key={key} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        {getDataIcon(key)}
                        <span className="font-medium text-sm capitalize">
                          {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {typeof value === "object" ? JSON.stringify(value) : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* QR Code Data (si disponible) */}
              {analysis.qrCodeData && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    Données du QR Code 2DDoc
                  </h4>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(analysis.qrCodeData).map(([key, value]) => (
                        <div key={key}>
                          <span className="font-medium text-sm text-green-800 capitalize">
                            {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}:
                          </span>
                          <p className="text-sm text-green-700">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Âge du document */}
              {analysis.documentAge !== undefined && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Âge du document</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    {analysis.documentAge === 0
                      ? "Document récent (moins d'un mois)"
                      : analysis.documentAge === 1
                        ? "1 mois"
                        : `${analysis.documentAge} mois`}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="validation" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">Vérification manuelle</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Veuillez confirmer les points suivants en regardant votre document:
                </p>
              </div>

              <div className="space-y-3">
                {validationQuestions.map((question) => (
                  <div key={question.key} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={question.key}
                      checked={userValidation[question.key] || false}
                      onCheckedChange={(checked) => handleUserValidation(question.key, checked as boolean)}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={question.key}
                        className={`text-sm cursor-pointer ${question.critical ? "font-medium" : ""}`}
                      >
                        {question.question}
                        {question.critical && (
                          <Badge variant="destructive" className="ml-2 text-xs">
                            Obligatoire
                          </Badge>
                        )}
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              {/* Résumé de validation */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium mb-2">Résumé de la validation</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Questions validées:</span>
                    <p className="font-medium">
                      {Object.values(userValidation).filter(Boolean).length} / {validationQuestions.length}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Points critiques:</span>
                    <p className="font-medium">
                      {validationQuestions.filter((q) => q.critical && userValidation[q.key]).length} /{" "}
                      {validationQuestions.filter((q) => q.critical).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function getDataIcon(key: string) {
  switch (key.toLowerCase()) {
    case "employeename":
    case "taxpayername":
    case "holdername":
    case "accountholder":
      return <User className="h-4 w-4 text-blue-600" />
    case "grosssalary":
    case "netsalary":
    case "referencerevenue":
      return <Euro className="h-4 w-4 text-green-600" />
    case "employer":
    case "company":
      return <Building className="h-4 w-4 text-purple-600" />
    case "month":
    case "year":
    case "fiscalyear":
    case "startdate":
    case "expirationdate":
      return <Calendar className="h-4 w-4 text-orange-600" />
    default:
      return <FileText className="h-4 w-4 text-gray-600" />
  }
}
