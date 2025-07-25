"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DocumentOCRClient } from "./document-ocr-client"
import { documentValidationService } from "@/lib/document-validation-service"
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  FileImage,
  FileIcon as FilePdf,
} from "lucide-react"
import { toast } from "sonner"

interface DocumentValidationWorkflowProps {
  tenantId: string
  onValidationComplete?: (result: any) => void
}

interface DocumentStep {
  id: string
  type: string
  label: string
  description: string
  required: boolean
  status: "pending" | "processing" | "completed" | "error"
  file?: File
  extractedText?: string
  ocrConfidence?: number
  validationResult?: any
  error?: string
}

const DOCUMENT_TYPES = [
  {
    id: "identity",
    label: "Pièce d'identité",
    description: "Carte d'identité, passeport ou permis de conduire",
    required: true,
  },
  {
    id: "tax_notice",
    label: "Avis d'imposition",
    description: "Dernier avis d'imposition sur le revenu",
    required: true,
  },
  {
    id: "payslip",
    label: "Fiche de paie",
    description: "3 dernières fiches de paie",
    required: true,
  },
  {
    id: "bank_statement",
    label: "Relevé bancaire",
    description: "3 derniers relevés bancaires",
    required: false,
  },
]

export function DocumentValidationWorkflow({ tenantId, onValidationComplete }: DocumentValidationWorkflowProps) {
  const [documents, setDocuments] = useState<DocumentStep[]>(
    DOCUMENT_TYPES.map((type) => ({
      id: type.id,
      type: type.id,
      label: type.label,
      description: type.description,
      required: type.required,
      status: "pending",
    })),
  )

  const [currentStep, setCurrentStep] = useState(0)
  const [isValidating, setIsValidating] = useState(false)

  // Hook OCR pour le document actuel
  const { processDocument, isProcessing, progress } = DocumentOCRClient({
    onTextExtracted: handleTextExtracted,
    onError: handleOCRError,
    documentType: documents[currentStep]?.type || "",
  })

  function handleTextExtracted(text: string, confidence: number) {
    console.log("📝 Texte extrait reçu:", text.substring(0, 100) + "...")

    setDocuments((prev) =>
      prev.map((doc, index) =>
        index === currentStep
          ? {
              ...doc,
              extractedText: text,
              ocrConfidence: confidence,
              status: "completed",
            }
          : doc,
      ),
    )

    // Lancer la validation automatiquement
    validateDocument(text, confidence)
  }

  function handleOCRError(error: string) {
    console.error("❌ Erreur OCR:", error)
    toast.error(`Erreur OCR: ${error}`)

    setDocuments((prev) =>
      prev.map((doc, index) =>
        index === currentStep
          ? {
              ...doc,
              status: "error",
              error: error,
            }
          : doc,
      ),
    )
  }

  const validateDocument = async (extractedText: string, ocrConfidence: number) => {
    const currentDoc = documents[currentStep]
    if (!currentDoc) return

    setIsValidating(true)

    try {
      // Parser le texte selon le type de document
      const extractedData = documentValidationService.parseDocumentText(extractedText, currentDoc.type, ocrConfidence)

      console.log("🔍 Données extraites:", extractedData)

      // Appeler l'API de validation
      const response = await fetch("/api/documents/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          extractedData,
          documentType: currentDoc.type,
          tenantId,
          documentUrl: currentDoc.file ? URL.createObjectURL(currentDoc.file) : undefined,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setDocuments((prev) =>
          prev.map((doc, index) =>
            index === currentStep
              ? {
                  ...doc,
                  validationResult: result.data,
                  status: result.data.isValid ? "completed" : "error",
                  error: result.data.isValid ? undefined : "Document invalide",
                }
              : doc,
          ),
        )

        if (result.data.isValid) {
          toast.success(`${currentDoc.label} validé avec succès!`)
        } else {
          toast.error(`${currentDoc.label} invalide - voir les détails`)
        }

        // Passer au document suivant automatiquement si valide
        if (result.data.isValid && currentStep < documents.length - 1) {
          setTimeout(() => setCurrentStep(currentStep + 1), 1500)
        }
      } else {
        throw new Error(result.error || "Erreur de validation")
      }
    } catch (error) {
      console.error("❌ Erreur validation:", error)
      toast.error("Erreur lors de la validation")

      setDocuments((prev) =>
        prev.map((doc, index) =>
          index === currentStep
            ? {
                ...doc,
                status: "error",
                error: error instanceof Error ? error.message : "Erreur de validation",
              }
            : doc,
        ),
      )
    } finally {
      setIsValidating(false)
    }
  }

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      console.log("📁 Fichier sélectionné:", file.name, file.type)

      // Vérifier le type de fichier
      const isValidType = file.type.startsWith("image/") || file.type === "application/pdf"

      if (!isValidType) {
        toast.error("Type de fichier non supporté. Utilisez des images (PNG, JPG) ou des PDF.")
        return
      }

      // Vérifier la taille (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Fichier trop volumineux. Taille maximum: 10MB")
        return
      }

      // Mettre à jour le document actuel
      setDocuments((prev) =>
        prev.map((doc, index) =>
          index === currentStep
            ? {
                ...doc,
                file,
                status: "processing",
                error: undefined,
              }
            : doc,
        ),
      )

      // Lancer l'OCR
      processDocument(file)
    },
    [currentStep, processDocument],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg"],
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    disabled: isProcessing || isValidating,
  })

  const currentDoc = documents[currentStep]
  const completedDocs = documents.filter((doc) => doc.status === "completed")
  const requiredDocs = documents.filter((doc) => doc.required)
  const completedRequiredDocs = requiredDocs.filter((doc) => doc.status === "completed")

  const canProceedToNext = currentDoc?.status === "completed" && currentStep < documents.length - 1
  const canFinish = completedRequiredDocs.length === requiredDocs.length

  const getFileIcon = (file?: File) => {
    if (!file) return <Upload className="h-8 w-8" />
    if (file.type === "application/pdf") return <FilePdf className="h-8 w-8 text-red-500" />
    return <FileImage className="h-8 w-8 text-blue-500" />
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "processing":
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
    }
  }

  const resetDocument = (index: number) => {
    setDocuments((prev) =>
      prev.map((doc, i) =>
        i === index
          ? {
              ...doc,
              file: undefined,
              extractedText: undefined,
              ocrConfidence: undefined,
              validationResult: undefined,
              status: "pending",
              error: undefined,
            }
          : doc,
      ),
    )
  }

  const viewDocumentDetails = (doc: DocumentStep) => {
    if (!doc.validationResult) return

    // Afficher les détails dans un modal ou une nouvelle page
    console.log("Détails du document:", doc.validationResult)
    toast.info("Fonctionnalité à implémenter: voir les détails")
  }

  return (
    <div className="space-y-8">
      {/* Progression globale */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Progression de la validation
          </CardTitle>
          <CardDescription>
            {completedDocs.length} / {documents.length} documents traités
            {canFinish && " - Validation complète!"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={(completedDocs.length / documents.length) * 100} className="mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {documents.map((doc, index) => (
              <div
                key={doc.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  index === currentStep
                    ? "border-blue-500 bg-blue-50"
                    : doc.status === "completed"
                      ? "border-green-500 bg-green-50"
                      : doc.status === "error"
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200"
                }`}
                onClick={() => setCurrentStep(index)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(doc.status)}
                    <span className="text-sm font-medium">{doc.label}</span>
                  </div>
                  {doc.required && <Badge variant="secondary">Requis</Badge>}
                </div>
                {doc.file && <div className="text-xs text-gray-500 truncate">{doc.file.name}</div>}
                {doc.ocrConfidence && (
                  <div className="text-xs text-blue-600">Confiance: {Math.round(doc.ocrConfidence)}%</div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Zone de téléchargement */}
      {currentDoc && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getFileIcon(currentDoc.file)}
              {currentDoc.label}
              {currentDoc.required && <Badge variant="secondary">Requis</Badge>}
            </CardTitle>
            <CardDescription>{currentDoc.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {currentDoc.status === "pending" && (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium mb-2">
                  {isDragActive
                    ? "Déposez le fichier ici"
                    : "Glissez-déposez votre document ou cliquez pour sélectionner"}
                </p>
                <p className="text-sm text-gray-500">Formats acceptés: PNG, JPG, PDF • Taille max: 10MB</p>
              </div>
            )}

            {currentDoc.status === "processing" && (
              <div className="text-center py-8">
                <RefreshCw className="h-12 w-12 mx-auto text-blue-500 animate-spin mb-4" />
                <p className="text-lg font-medium mb-2">Traitement en cours...</p>
                <p className="text-sm text-gray-500 mb-4">
                  {isProcessing ? "Extraction OCR" : "Validation des données"}
                </p>
                <Progress value={progress} className="max-w-xs mx-auto" />
                <p className="text-xs text-gray-400 mt-2">{progress}%</p>
              </div>
            )}

            {currentDoc.status === "completed" && currentDoc.validationResult && (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Document validé avec succès!</strong>
                    <br />
                    Confiance OCR: {Math.round(currentDoc.ocrConfidence || 0)}% • Confiance validation:{" "}
                    {Math.round(currentDoc.validationResult.confidence * 100)}%
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => viewDocumentDetails(currentDoc)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Voir les détails
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => resetDocument(currentStep)}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Recommencer
                  </Button>
                </div>
              </div>
            )}

            {currentDoc.status === "error" && (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Erreur de traitement</strong>
                    <br />
                    {currentDoc.error}
                  </AlertDescription>
                </Alert>

                <Button variant="outline" onClick={() => resetDocument(currentStep)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réessayer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          Précédent
        </Button>

        <div className="flex gap-2">
          {canProceedToNext && <Button onClick={() => setCurrentStep(currentStep + 1)}>Suivant</Button>}

          {canFinish && (
            <Button
              onClick={() => {
                toast.success("Validation complète!")
                onValidationComplete?.(documents)
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Terminer
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
