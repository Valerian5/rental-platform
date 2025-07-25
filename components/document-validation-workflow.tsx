"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { DocumentOCRClient } from "./document-ocr-client"
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Eye } from "lucide-react"
import { toast } from "sonner"

interface DocumentValidationWorkflowProps {
  tenantId: string
  onValidationComplete?: (result: any) => void
}

interface ValidationResult {
  documentId: string
  documentType: string
  isValid: boolean
  confidence: number
  errors: Array<{
    code: string
    message: string
    severity: "critical" | "major" | "minor"
    field?: string
    suggestion?: string
  }>
  warnings: Array<{
    code: string
    message: string
    field?: string
  }>
  extractedData: Record<string, any>
  processingTime: number
  timestamp: string
}

const DOCUMENT_TYPES = [
  { id: "identity", label: "Pièce d'identité", description: "Carte d'identité, passeport" },
  { id: "tax_notice", label: "Avis d'imposition", description: "Avis d'imposition sur le revenu" },
  { id: "payslip", label: "Fiche de paie", description: "Bulletin de salaire" },
  { id: "bank_statement", label: "Relevé bancaire", description: "Relevé de compte bancaire" },
]

export function DocumentValidationWorkflow({ tenantId, onValidationComplete }: DocumentValidationWorkflowProps) {
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [extractedText, setExtractedText] = useState<string>("")
  const [ocrConfidence, setOcrConfidence] = useState<number>(0)
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [currentStep, setCurrentStep] = useState<"select" | "upload" | "extract" | "validate" | "result">("select")

  // Hook OCR côté client
  const ocrClient = DocumentOCRClient({
    onTextExtracted: (text: string, confidence: number) => {
      setExtractedText(text)
      setOcrConfidence(confidence)
      setCurrentStep("validate")
      toast.success(`Texte extrait avec ${Math.round(confidence)}% de confiance`)
    },
    onError: (error: string) => {
      toast.error(`Erreur OCR: ${error}`)
      setCurrentStep("upload")
    },
    documentType: selectedDocumentType,
  })

  // Configuration dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".bmp"],
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: useCallback(
      (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
          const file = acceptedFiles[0]
          setUploadedFile(file)
          setCurrentStep("extract")

          // Lancer l'OCR côté client
          ocrClient.processDocument(file)
          toast.info("Extraction du texte en cours...")
        }
      },
      [ocrClient],
    ),
    onDropRejected: (rejectedFiles) => {
      const rejection = rejectedFiles[0]
      if (rejection.errors[0]?.code === "file-too-large") {
        toast.error("Fichier trop volumineux (max 10MB)")
      } else if (rejection.errors[0]?.code === "file-invalid-type") {
        toast.error("Type de fichier non supporté")
      }
    },
  })

  // Validation du document
  const handleValidation = async () => {
    if (!extractedText || !selectedDocumentType) return

    setIsValidating(true)

    try {
      // Parser les données extraites
      const { documentValidationService } = await import("@/lib/document-validation-service")
      const extractedData = documentValidationService.parseDocumentText(
        extractedText,
        selectedDocumentType,
        ocrConfidence,
      )

      // Envoyer à l'API pour validation
      const response = await fetch("/api/documents/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          extractedData,
          documentType: selectedDocumentType,
          tenantId,
          documentUrl: uploadedFile ? URL.createObjectURL(uploadedFile) : undefined,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setValidationResult(result.data)
        setCurrentStep("result")
        onValidationComplete?.(result.data)

        if (result.data.isValid) {
          toast.success("Document validé avec succès!")
        } else {
          toast.warning("Document invalide - voir les détails")
        }
      } else {
        throw new Error(result.error || "Erreur de validation")
      }
    } catch (error) {
      console.error("Erreur validation:", error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de la validation")
    } finally {
      setIsValidating(false)
    }
  }

  // Reset du workflow
  const resetWorkflow = () => {
    setSelectedDocumentType("")
    setUploadedFile(null)
    setExtractedText("")
    setOcrConfidence(0)
    setValidationResult(null)
    setCurrentStep("select")
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* En-tête */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Validation automatisée de documents
          </CardTitle>
          <CardDescription>
            Uploadez vos documents pour une validation automatique avec OCR et vérifications croisées
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Étapes du workflow */}
      <div className="flex items-center justify-between mb-6">
        {[
          { id: "select", label: "Type", icon: FileText },
          { id: "upload", label: "Upload", icon: Upload },
          { id: "extract", label: "OCR", icon: Eye },
          { id: "validate", label: "Validation", icon: CheckCircle },
          { id: "result", label: "Résultat", icon: CheckCircle },
        ].map((step, index) => {
          const Icon = step.icon
          const isActive = currentStep === step.id
          const isCompleted = ["select", "upload", "extract", "validate"].indexOf(currentStep) > index

          return (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  isActive
                    ? "border-blue-500 bg-blue-50 text-blue-600"
                    : isCompleted
                      ? "border-green-500 bg-green-50 text-green-600"
                      : "border-gray-300 bg-gray-50 text-gray-400"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span
                className={`ml-2 text-sm font-medium ${
                  isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
              {index < 4 && <div className={`w-12 h-0.5 mx-4 ${isCompleted ? "bg-green-500" : "bg-gray-300"}`} />}
            </div>
          )
        })}
      </div>

      {/* Contenu principal */}
      <Tabs value={currentStep} className="w-full">
        {/* Étape 1: Sélection du type de document */}
        <TabsContent value="select">
          <Card>
            <CardHeader>
              <CardTitle>Sélectionnez le type de document</CardTitle>
              <CardDescription>Choisissez le type de document que vous souhaitez valider</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DOCUMENT_TYPES.map((docType) => (
                  <Card
                    key={docType.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedDocumentType === docType.id ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"
                    }`}
                    onClick={() => {
                      setSelectedDocumentType(docType.id)
                      setCurrentStep("upload")
                    }}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg">{docType.label}</h3>
                      <p className="text-sm text-gray-600 mt-1">{docType.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Étape 2: Upload du document */}
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Uploadez votre document</CardTitle>
              <CardDescription>
                Type sélectionné:{" "}
                <Badge variant="secondary">{DOCUMENT_TYPES.find((t) => t.id === selectedDocumentType)?.label}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                {isDragActive ? (
                  <p className="text-blue-600">Déposez le fichier ici...</p>
                ) : (
                  <div>
                    <p className="text-lg font-medium mb-2">
                      Glissez-déposez votre document ou cliquez pour sélectionner
                    </p>
                    <p className="text-sm text-gray-500">Formats supportés: PNG, JPG, PDF (max 10MB)</p>
                  </div>
                )}
              </div>

              {uploadedFile && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{uploadedFile.name}</p>
                      <p className="text-sm text-gray-500">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUploadedFile(null)
                        setCurrentStep("upload")
                      }}
                    >
                      Changer
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setCurrentStep("select")}>
                  Retour
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Étape 3: Extraction OCR */}
        <TabsContent value="extract">
          <Card>
            <CardHeader>
              <CardTitle>Extraction du texte en cours</CardTitle>
              <CardDescription>Analyse OCR du document avec Tesseract.js</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progression OCR</span>
                  <span className="text-sm text-gray-500">{ocrClient.progress}%</span>
                </div>
                <Progress value={ocrClient.progress} className="w-full" />

                {ocrClient.isProcessing && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    Extraction en cours...
                  </div>
                )}

                {extractedText && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Texte extrait:</h4>
                    <div className="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                      <pre className="text-sm whitespace-pre-wrap">{extractedText.substring(0, 500)}...</pre>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        variant={ocrConfidence > 80 ? "default" : ocrConfidence > 60 ? "secondary" : "destructive"}
                      >
                        Confiance: {Math.round(ocrConfidence)}%
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Étape 4: Validation */}
        <TabsContent value="validate">
          <Card>
            <CardHeader>
              <CardTitle>Validation du document</CardTitle>
              <CardDescription>Vérification des données extraites et validation croisée</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {extractedText && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Texte extrait avec succès ({extractedText.length} caractères, {Math.round(ocrConfidence)}% de
                      confiance)
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-4">
                  <Button onClick={handleValidation} disabled={isValidating || !extractedText} className="flex-1">
                    {isValidating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Validation en cours...
                      </>
                    ) : (
                      "Valider le document"
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setCurrentStep("upload")}>
                    Retour
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Étape 5: Résultats */}
        <TabsContent value="result">
          {validationResult && (
            <div className="space-y-6">
              {/* Résumé de validation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {validationResult.isValid ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    Résultat de la validation
                  </CardTitle>
                  <CardDescription>Document traité en {validationResult.processingTime}ms</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div
                        className={`text-2xl font-bold ${validationResult.isValid ? "text-green-600" : "text-red-600"}`}
                      >
                        {validationResult.isValid ? "VALIDE" : "INVALIDE"}
                      </div>
                      <div className="text-sm text-gray-500">Statut</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round(validationResult.confidence * 100)}%
                      </div>
                      <div className="text-sm text-gray-500">Confiance</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {validationResult.errors.length + validationResult.warnings.length}
                      </div>
                      <div className="text-sm text-gray-500">Problèmes détectés</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Erreurs et avertissements */}
              {(validationResult.errors.length > 0 || validationResult.warnings.length > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Problèmes détectés</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {validationResult.errors.map((error, index) => (
                        <Alert key={`error-${index}`} variant="destructive">
                          <XCircle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="font-medium">{error.message}</div>
                            {error.suggestion && <div className="text-sm mt-1 opacity-90">{error.suggestion}</div>}
                          </AlertDescription>
                        </Alert>
                      ))}

                      {validationResult.warnings.map((warning, index) => (
                        <Alert key={`warning-${index}`}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{warning.message}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Données extraites */}
              <Card>
                <CardHeader>
                  <CardTitle>Données extraites</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(validationResult.extractedData)
                      .filter(([key]) => !["raw_text", "extraction_timestamp"].includes(key))
                      .map(([key, value]) => (
                        <div key={key} className="border rounded-lg p-3">
                          <div className="text-sm font-medium text-gray-600 capitalize">{key.replace(/_/g, " ")}</div>
                          <div className="text-lg">
                            {typeof value === "object" ? JSON.stringify(value) : String(value)}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-4">
                <Button onClick={resetWorkflow} variant="outline">
                  Valider un autre document
                </Button>
                <Button
                  onClick={() => {
                    const dataStr = JSON.stringify(validationResult, null, 2)
                    const dataBlob = new Blob([dataStr], { type: "application/json" })
                    const url = URL.createObjectURL(dataBlob)
                    const link = document.createElement("a")
                    link.href = url
                    link.download = `validation-${validationResult.documentId}.json`
                    link.click()
                  }}
                  variant="outline"
                >
                  Télécharger le rapport
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
