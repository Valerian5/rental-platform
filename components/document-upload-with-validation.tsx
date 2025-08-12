"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import {
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye,
  Trash2,
  Calendar,
  User,
  Building,
  Euro,
  Clock,
} from "lucide-react"

interface DocumentUploadWithValidationProps {
  documentType: string
  documentName: string
  onDocumentValidated: (documentData: any) => void
  existingDocuments?: string[]
  maxFiles?: number
  monthlyUpload?: boolean // Si true, demande un fichier par mois
  requiresBothSides?: boolean // Pour CNI recto/verso
}

interface UploadedFile {
  file: File
  url?: string
  uploading: boolean
  progress: number
  analysis?: any
  validated: boolean
  error?: string
}

const DOCUMENT_CONFIGS = {
  payslip: {
    name: "Fiches de paie",
    description: "Téléchargez vos 3 dernières fiches de paie (une par mois)",
    monthlyUpload: true,
    maxFiles: 3,
    acceptedTypes: ["application/pdf", "image/jpeg", "image/png"],
    validationMessage: "Vérifiez que c'est bien votre fiche de paie du mois indiqué",
  },
  identity: {
    name: "Pièce d'identité",
    description: "Téléchargez le RECTO et le VERSO de votre pièce d'identité",
    requiresBothSides: true,
    maxFiles: 2,
    acceptedTypes: ["image/jpeg", "image/png", "application/pdf"],
    validationMessage: "Vérifiez que la photo et les informations sont lisibles",
  },
  tax_notice: {
    name: "Avis d'imposition",
    description: "Téléchargez votre dernier avis d'imposition complet",
    maxFiles: 1,
    acceptedTypes: ["application/pdf", "image/jpeg", "image/png"],
    validationMessage: "Vérifiez que le QR Code en bas à droite est visible",
  },
  bank_statement: {
    name: "Relevés bancaires",
    description: "Téléchargez vos 3 derniers relevés bancaires",
    monthlyUpload: true,
    maxFiles: 3,
    acceptedTypes: ["application/pdf", "image/jpeg", "image/png"],
    validationMessage: "Vérifiez que le relevé est complet (première et dernière page)",
  },
}

export function DocumentUploadWithValidation({
  documentType,
  documentName,
  onDocumentValidated,
  existingDocuments = [],
  maxFiles,
  monthlyUpload,
  requiresBothSides,
}: DocumentUploadWithValidationProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [showValidationPopup, setShowValidationPopup] = useState(false)
  const [currentValidatingFile, setCurrentValidatingFile] = useState<UploadedFile | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const config = DOCUMENT_CONFIGS[documentType as keyof typeof DOCUMENT_CONFIGS] || {
    name: documentName,
    description: "Téléchargez votre document",
    maxFiles: maxFiles || 1,
    acceptedTypes: ["application/pdf", "image/jpeg", "image/png"],
    validationMessage: "Vérifiez que le document est correct",
  }

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return

    const newFiles = Array.from(files).map((file) => ({
      file,
      uploading: false,
      progress: 0,
      validated: false,
    }))

    setUploadedFiles((prev) => [...prev, ...newFiles].slice(0, config.maxFiles))

    // Uploader automatiquement
    for (const fileData of newFiles) {
      await uploadAndAnalyze(fileData)
    }
  }

  const uploadAndAnalyze = async (fileData: UploadedFile) => {
    const fileIndex = uploadedFiles.findIndex((f) => f.file === fileData.file)

    try {
      // Étape 1: Upload
      setUploadedFiles((prev) =>
        prev.map((f, idx) => (idx === fileIndex ? { ...f, uploading: true, progress: 20 } : f)),
      )

      const formData = new FormData()
      formData.append("file", fileData.file)
      formData.append("bucket", "documents")
      formData.append("folder", `rental-files/${documentType}`)

      const uploadResponse = await fetch("/api/upload-supabase", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error("Erreur lors de l'upload")
      }

      const uploadResult = await uploadResponse.json()

      setUploadedFiles((prev) =>
        prev.map((f, idx) => (idx === fileIndex ? { ...f, url: uploadResult.url, progress: 60 } : f)),
      )

      // Étape 2: Analyse automatique
      const analysisResponse = await fetch("/api/documents/analyze-2ddoc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl: uploadResult.url,
          fileName: fileData.file.name,
          documentType,
        }),
      })

      if (!analysisResponse.ok) {
        throw new Error("Erreur lors de l'analyse")
      }

      const analysisResult = await analysisResponse.json()

      setUploadedFiles((prev) =>
        prev.map((f, idx) =>
          idx === fileIndex
            ? {
                ...f,
                analysis: analysisResult.analysis,
                progress: 100,
                uploading: false,
              }
            : f,
        ),
      )

      // Étape 3: Validation automatique ou manuelle
      if (analysisResult.analysis.autoValidated) {
        // Validation automatique réussie
        setUploadedFiles((prev) => prev.map((f, idx) => (idx === fileIndex ? { ...f, validated: true } : f)))

        onDocumentValidated({
          url: uploadResult.url,
          analysis: analysisResult.analysis,
          autoValidated: true,
        })
      } else {
        // Demander validation manuelle
        setCurrentValidatingFile({
          ...fileData,
          url: uploadResult.url,
          analysis: analysisResult.analysis,
        })
        setShowValidationPopup(true)
      }
    } catch (error) {
      console.error("❌ Erreur upload/analyse:", error)
      setUploadedFiles((prev) =>
        prev.map((f, idx) =>
          idx === fileIndex
            ? {
                ...f,
                uploading: false,
                error: error.message,
                progress: 0,
              }
            : f,
        ),
      )
    }
  }

  const handleManualValidation = (isValid: boolean) => {
    if (!currentValidatingFile) return

    const fileIndex = uploadedFiles.findIndex((f) => f.file === currentValidatingFile.file)

    setUploadedFiles((prev) => prev.map((f, idx) => (idx === fileIndex ? { ...f, validated: isValid } : f)))

    if (isValid) {
      onDocumentValidated({
        url: currentValidatingFile.url,
        analysis: currentValidatingFile.analysis,
        autoValidated: false,
        manuallyValidated: true,
      })
    }

    setShowValidationPopup(false)
    setCurrentValidatingFile(null)
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (file: File) => {
    if (file.type === "application/pdf") return <FileText className="h-8 w-8 text-red-500" />
    return <FileText className="h-8 w-8 text-blue-500" />
  }

  const getAnalysisIcon = (analysis: any) => {
    if (!analysis) return null
    if (analysis.autoValidated) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (analysis.errors?.length > 0) return <XCircle className="h-4 w-4 text-red-500" />
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />
  }

  const getMonthLabel = (index: number) => {
    const months = [
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobre",
      "Novembre",
      "Décembre",
    ]
    const currentMonth = new Date().getMonth()
    const targetMonth = (currentMonth - index + 12) % 12
    return months[targetMonth]
  }

  const getSideLabel = (index: number) => {
    return index === 0 ? "Recto" : "Verso"
  }

  return (
    <div className="space-y-6">
      {/* Configuration du document */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {config.name}
          </CardTitle>
          <p className="text-sm text-gray-600">{config.description}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Fichiers requis:</span>
              <p className="text-gray-600">{config.maxFiles}</p>
            </div>
            <div>
              <span className="font-medium">Formats acceptés:</span>
              <p className="text-gray-600">PDF, JPG, PNG</p>
            </div>
            <div>
              <span className="font-medium">Validation:</span>
              <p className="text-gray-600">Automatique + manuelle</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zone d'upload */}
      {uploadedFiles.length < config.maxFiles && (
        <Card
          className={`border-2 border-dashed transition-colors cursor-pointer ${
            dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"
          }`}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            handleFileSelect(e.dataTransfer.files)
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="p-8 text-center">
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium">
                {config.monthlyUpload && uploadedFiles.length < config.maxFiles
                  ? `Téléchargez votre document de ${getMonthLabel(uploadedFiles.length)}`
                  : config.requiresBothSides && uploadedFiles.length < 2
                    ? `Téléchargez le ${getSideLabel(uploadedFiles.length)}`
                    : "Glissez votre document ici ou cliquez pour sélectionner"}
              </p>
              <p className="text-sm text-gray-500">{config.maxFiles - uploadedFiles.length} fichier(s) restant(s)</p>
            </div>
          </CardContent>
        </Card>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={config.acceptedTypes.join(",")}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Liste des fichiers */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Documents téléchargés</h4>
          {uploadedFiles.map((fileData, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {getFileIcon(fileData.file)}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{fileData.file.name}</p>
                      {config.monthlyUpload && <Badge variant="outline">{getMonthLabel(index)}</Badge>}
                      {config.requiresBothSides && <Badge variant="outline">{getSideLabel(index)}</Badge>}
                      {getAnalysisIcon(fileData.analysis)}
                    </div>

                    <p className="text-sm text-gray-500">{Math.round(fileData.file.size / 1024)} KB</p>

                    {fileData.uploading && <Progress value={fileData.progress} className="mt-2 h-2" />}

                    {fileData.error && (
                      <Alert className="mt-2">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>{fileData.error}</AlertDescription>
                      </Alert>
                    )}

                    {fileData.analysis && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={fileData.analysis.autoValidated ? "default" : "secondary"}>
                            Score: {fileData.analysis.confidenceScore}%
                          </Badge>
                          {fileData.validated && (
                            <Badge variant="default">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Validé
                            </Badge>
                          )}
                        </div>

                        {fileData.analysis.warnings?.length > 0 && (
                          <div className="text-xs text-yellow-600">⚠️ {fileData.analysis.warnings[0]}</div>
                        )}

                        {fileData.analysis.errors?.length > 0 && (
                          <div className="text-xs text-red-600">❌ {fileData.analysis.errors[0]}</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {fileData.url && (
                      <Button variant="ghost" size="sm" onClick={() => window.open(fileData.url, "_blank")}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}

                    <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Popup de validation manuelle */}
      <Dialog open={showValidationPopup} onOpenChange={setShowValidationPopup}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Validation du document</DialogTitle>
          </DialogHeader>

          {currentValidatingFile && (
            <div className="space-y-6">
              {/* Aperçu du document */}
              <div className="border rounded-lg overflow-hidden">
                <iframe src={currentValidatingFile.url} className="w-full h-96" title="Aperçu du document" />
              </div>

              {/* Résultats de l'analyse */}
              {currentValidatingFile.analysis && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Analyse automatique
                      <Badge variant="secondary">Score: {currentValidatingFile.analysis.confidenceScore}%</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Données extraites */}
                    {currentValidatingFile.analysis.extractedData && (
                      <div>
                        <h4 className="font-medium mb-2">Données détectées:</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(currentValidatingFile.analysis.extractedData).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-2 text-sm">
                              {getDataIcon(key)}
                              <span className="font-medium capitalize">
                                {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}:
                              </span>
                              <span className="text-gray-600">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* QR Code 2DDoc */}
                    {currentValidatingFile.analysis.qrCodeData && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium text-green-800 mb-2">✅ QR Code 2DDoc détecté</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {Object.entries(currentValidatingFile.analysis.qrCodeData).map(([key, value]) => (
                            <div key={key}>
                              <span className="font-medium text-green-700 capitalize">
                                {key.replace(/([A-Z])/g, " $1")}:
                              </span>
                              <span className="text-green-600 ml-1">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Avertissements et erreurs */}
                    {currentValidatingFile.analysis.warnings?.length > 0 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <ul className="list-disc list-inside">
                            {currentValidatingFile.analysis.warnings.map((warning: string, idx: number) => (
                              <li key={idx}>{warning}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    {currentValidatingFile.analysis.errors?.length > 0 && (
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>
                          <ul className="list-disc list-inside">
                            {currentValidatingFile.analysis.errors.map((error: string, idx: number) => (
                              <li key={idx}>{error}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Question de validation */}
              <Card>
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-medium mb-4">{config.validationMessage}</h3>
                  <p className="text-gray-600 mb-6">
                    Confirmez-vous que ce document est correct et correspond à vos attentes ?
                  </p>

                  <div className="flex gap-4 justify-center">
                    <Button
                      onClick={() => handleManualValidation(false)}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Non, recommencer
                    </Button>
                    <Button onClick={() => handleManualValidation(true)} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Oui, valider ce document
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function getDataIcon(key: string) {
  switch (key.toLowerCase()) {
    case "month":
    case "year":
    case "fiscalyear":
      return <Calendar className="h-4 w-4 text-blue-600" />
    case "estimatedgrosssalary":
    case "estimatednetsalary":
    case "revenuefiscalreference":
      return <Euro className="h-4 w-4 text-green-600" />
    case "documentage":
      return <Clock className="h-4 w-4 text-orange-600" />
    case "employer":
    case "emetteur":
      return <Building className="h-4 w-4 text-purple-600" />
    default:
      return <User className="h-4 w-4 text-gray-600" />
  }
}
