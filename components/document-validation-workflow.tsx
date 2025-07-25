"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, CheckCircle, XCircle, AlertTriangle, FileText, Loader2, Eye, Download } from "lucide-react"
import type { DocumentValidationResult } from "@/lib/document-validation-service"

interface DocumentValidationWorkflowProps {
  tenantId: string
  onComplete?: (results: DocumentValidationResult[]) => void
  requiredDocuments?: string[]
  optionalDocuments?: string[]
}

interface DocumentUpload {
  file: File
  type: string
  status: "pending" | "uploading" | "processing" | "completed" | "error"
  result?: DocumentValidationResult
  error?: string
  progress: number
}

const DOCUMENT_TYPES = {
  identity: {
    label: "Pièce d'identité",
    description: "Carte d'identité, passeport ou permis de conduire",
    required: true,
    acceptedFormats: ["image/jpeg", "image/png", "application/pdf"],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  tax_notice: {
    label: "Avis d'imposition",
    description: "Dernier avis d'imposition sur le revenu",
    required: true,
    acceptedFormats: ["application/pdf", "image/jpeg", "image/png"],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  payslip: {
    label: "Fiche de paie",
    description: "3 dernières fiches de paie",
    required: true,
    acceptedFormats: ["application/pdf", "image/jpeg", "image/png"],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  bank_statement: {
    label: "Relevé bancaire",
    description: "3 derniers relevés bancaires",
    required: false,
    acceptedFormats: ["application/pdf", "image/jpeg", "image/png"],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
}

export function DocumentValidationWorkflow({
  tenantId,
  onComplete,
  requiredDocuments = ["identity", "tax_notice", "payslip"],
  optionalDocuments = ["bank_statement"],
}: DocumentValidationWorkflowProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [uploads, setUploads] = useState<Record<string, DocumentUpload[]>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [completedValidations, setCompletedValidations] = useState<DocumentValidationResult[]>([])

  const steps = [
    { id: "upload", title: "Upload des documents", description: "Téléchargez vos documents" },
    { id: "validation", title: "Validation", description: "Vérification automatique" },
    { id: "results", title: "Résultats", description: "Analyse des résultats" },
  ]

  const requiredDropzones = requiredDocuments.map((docType) => createDropzone(docType))
  const optionalDropzones = optionalDocuments.map((docType) => createDropzone(docType))

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[], documentType: string) => {
    const docConfig = DOCUMENT_TYPES[documentType as keyof typeof DOCUMENT_TYPES]

    // Traiter les fichiers acceptés
    const newUploads = acceptedFiles.map((file) => ({
      file,
      type: documentType,
      status: "pending" as const,
      progress: 0,
    }))

    setUploads((prev) => ({
      ...prev,
      [documentType]: [...(prev[documentType] || []), ...newUploads],
    }))

    // Traiter les fichiers rejetés
    rejectedFiles.forEach((rejection: any) => {
      console.warn("Fichier rejeté:", rejection.file.name, rejection.errors)
    })
  }, [])

  const createDropzone = (documentType: string) => {
    const docConfig = DOCUMENT_TYPES[documentType as keyof typeof DOCUMENT_TYPES]

    return useDropzone({
      onDrop: (accepted, rejected) => onDrop(accepted, rejected, documentType),
      accept: docConfig.acceptedFormats.reduce(
        (acc, format) => {
          acc[format] = []
          return acc
        },
        {} as Record<string, string[]>,
      ),
      maxSize: docConfig.maxSize,
      multiple: documentType === "payslip" || documentType === "bank_statement",
    })
  }

  const uploadFile = async (upload: DocumentUpload): Promise<string> => {
    const formData = new FormData()
    formData.append("file", upload.file)
    formData.append("type", upload.type)
    formData.append("tenantId", tenantId)

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Erreur lors de l'upload du fichier")
    }

    const data = await response.json()
    return data.url
  }

  const validateDocument = async (documentUrl: string, documentType: string): Promise<DocumentValidationResult> => {
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

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Erreur lors de la validation")
    }

    const data = await response.json()
    return data.data
  }

  const processUpload = async (documentType: string, uploadIndex: number) => {
    const upload = uploads[documentType][uploadIndex]

    try {
      // Étape 1: Upload du fichier
      setUploads((prev) => ({
        ...prev,
        [documentType]: prev[documentType].map((u, i) =>
          i === uploadIndex ? { ...u, status: "uploading", progress: 25 } : u,
        ),
      }))

      const documentUrl = await uploadFile(upload)

      // Étape 2: Validation
      setUploads((prev) => ({
        ...prev,
        [documentType]: prev[documentType].map((u, i) =>
          i === uploadIndex ? { ...u, status: "processing", progress: 75 } : u,
        ),
      }))

      const result = await validateDocument(documentUrl, documentType)

      // Étape 3: Résultat
      setUploads((prev) => ({
        ...prev,
        [documentType]: prev[documentType].map((u, i) =>
          i === uploadIndex
            ? {
                ...u,
                status: "completed",
                progress: 100,
                result,
              }
            : u,
        ),
      }))

      setCompletedValidations((prev) => [...prev, result])
    } catch (error) {
      console.error("Erreur traitement upload:", error)

      setUploads((prev) => ({
        ...prev,
        [documentType]: prev[documentType].map((u, i) =>
          i === uploadIndex
            ? {
                ...u,
                status: "error",
                error: error instanceof Error ? error.message : "Erreur inconnue",
              }
            : u,
        ),
      }))
    }
  }

  const startValidation = async () => {
    setIsProcessing(true)
    setCurrentStep(1)

    try {
      const allUploads = Object.entries(uploads).flatMap(([type, typeUploads]) =>
        typeUploads.map((upload, index) => ({ type, index, upload })),
      )

      // Traiter tous les uploads en parallèle
      await Promise.all(allUploads.map(({ type, index }) => processUpload(type, index)))

      setCurrentStep(2)
      onComplete?.(completedValidations)
    } catch (error) {
      console.error("Erreur validation globale:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const removeUpload = (documentType: string, index: number) => {
    setUploads((prev) => ({
      ...prev,
      [documentType]: prev[documentType].filter((_, i) => i !== index),
    }))
  }

  const canProceed = () => {
    return requiredDocuments.every((docType) => uploads[docType] && uploads[docType].length > 0)
  }

  const calculateProgress = () => {
    const totalUploads = Object.values(uploads).flat().length
    if (totalUploads === 0) return 0

    const completedUploads = Object.values(uploads)
      .flat()
      .filter((u) => u.status === "completed").length
    return (completedUploads / totalUploads) * 100
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Indicateur de progression */}
      <Card>
        <CardHeader>
          <CardTitle>Validation de dossier locatif</CardTitle>
          <CardDescription>
            Étape {currentStep + 1} sur {steps.length}: {steps[currentStep].description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className={`flex items-center ${index < steps.length - 1 ? "flex-1" : ""}`}>
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                      index <= currentStep
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground text-muted-foreground"
                    }`}
                  >
                    {index < currentStep ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  <span className="ml-2 text-sm font-medium">{step.title}</span>
                  {index < steps.length - 1 && <div className="flex-1 h-px bg-muted mx-4" />}
                </div>
              ))}
            </div>
            {currentStep === 1 && <Progress value={calculateProgress()} className="w-full" />}
          </div>
        </CardContent>
      </Card>

      {/* Étape 1: Upload des documents */}
      {currentStep === 0 && (
        <div className="space-y-4">
          <Tabs defaultValue="required">
            <TabsList>
              <TabsTrigger value="required">Documents obligatoires</TabsTrigger>
              <TabsTrigger value="optional">Documents optionnels</TabsTrigger>
            </TabsList>

            <TabsContent value="required" className="space-y-4">
              {requiredDocuments.map((docType, index) => {
                const docConfig = DOCUMENT_TYPES[docType as keyof typeof DOCUMENT_TYPES]
                const dropzone = requiredDropzones[index]
                const typeUploads = uploads[docType] || []

                return (
                  <Card key={docType}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {docConfig.label}
                        <Badge variant="destructive">Obligatoire</Badge>
                      </CardTitle>
                      <CardDescription>{docConfig.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div
                        {...dropzone.getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                          dropzone.isDragActive
                            ? "border-primary bg-primary/5"
                            : "border-muted-foreground/25 hover:border-muted-foreground/50"
                        }`}
                      >
                        <input {...dropzone.getInputProps()} />
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {dropzone.isDragActive
                            ? "Déposez les fichiers ici..."
                            : "Cliquez ou glissez-déposez vos fichiers"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Formats acceptés: {docConfig.acceptedFormats.join(", ")}
                          (max {Math.round(docConfig.maxSize / 1024 / 1024)}MB)
                        </p>
                      </div>

                      {/* Liste des fichiers uploadés */}
                      {typeUploads.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {typeUploads.map((upload, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <FileText className="h-4 w-4" />
                                <div>
                                  <p className="text-sm font-medium">{upload.file.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {Math.round(upload.file.size / 1024)} KB
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {upload.status === "pending" && <Badge variant="outline">En attente</Badge>}
                                <Button variant="ghost" size="sm" onClick={() => removeUpload(docType, index)}>
                                  ✕
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </TabsContent>

            <TabsContent value="optional" className="space-y-4">
              {optionalDocuments.map((docType, index) => {
                const docConfig = DOCUMENT_TYPES[docType as keyof typeof DOCUMENT_TYPES]
                const dropzone = optionalDropzones[index]
                const typeUploads = uploads[docType] || []

                return (
                  <Card key={docType}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {docConfig.label}
                        <Badge variant="secondary">Optionnel</Badge>
                      </CardTitle>
                      <CardDescription>{docConfig.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div
                        {...dropzone.getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                          dropzone.isDragActive
                            ? "border-primary bg-primary/5"
                            : "border-muted-foreground/25 hover:border-muted-foreground/50"
                        }`}
                      >
                        <input {...dropzone.getInputProps()} />
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {dropzone.isDragActive
                            ? "Déposez les fichiers ici..."
                            : "Cliquez ou glissez-déposez vos fichiers"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Formats acceptés: {docConfig.acceptedFormats.join(", ")}
                          (max {Math.round(docConfig.maxSize / 1024 / 1024)}MB)
                        </p>
                      </div>

                      {/* Liste des fichiers uploadés */}
                      {typeUploads.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {typeUploads.map((upload, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <FileText className="h-4 w-4" />
                                <div>
                                  <p className="text-sm font-medium">{upload.file.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {Math.round(upload.file.size / 1024)} KB
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {upload.status === "pending" && <Badge variant="outline">En attente</Badge>}
                                <Button variant="ghost" size="sm" onClick={() => removeUpload(docType, index)}>
                                  ✕
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
            <Button onClick={startValidation} disabled={!canProceed() || isProcessing} size="lg">
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Validation en cours...
                </>
              ) : (
                "Lancer la validation"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Étape 2: Validation en cours */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Validation en cours</CardTitle>
            <CardDescription>Traitement et analyse de vos documents...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(uploads).map(([docType, typeUploads]) => (
                <div key={docType} className="space-y-2">
                  <h4 className="font-medium">{DOCUMENT_TYPES[docType as keyof typeof DOCUMENT_TYPES].label}</h4>
                  {typeUploads.map((upload, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{upload.file.name}</span>
                          <div className="flex items-center gap-2">
                            {upload.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin" />}
                            {upload.status === "processing" && <Loader2 className="h-4 w-4 animate-spin" />}
                            {upload.status === "completed" && <CheckCircle className="h-4 w-4 text-green-600" />}
                            {upload.status === "error" && <XCircle className="h-4 w-4 text-red-600" />}
                            <span className="text-sm text-muted-foreground">
                              {upload.status === "uploading" && "Upload..."}
                              {upload.status === "processing" && "Analyse OCR..."}
                              {upload.status === "completed" && "Terminé"}
                              {upload.status === "error" && "Erreur"}
                            </span>
                          </div>
                        </div>
                        <Progress value={upload.progress} className="h-2" />
                        {upload.error && <p className="text-sm text-red-600 mt-1">{upload.error}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Étape 3: Résultats */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Résultats de la validation</CardTitle>
              <CardDescription>Analyse terminée pour {completedValidations.length} document(s)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {completedValidations.filter((v) => v.isValid).length}
                  </div>
                  <p className="text-sm text-muted-foreground">Documents valides</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {completedValidations.filter((v) => !v.isValid).length}
                  </div>
                  <p className="text-sm text-muted-foreground">Documents invalides</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">
                    {Math.round(
                      (completedValidations.reduce((sum, v) => sum + v.confidence, 0) / completedValidations.length) *
                        100,
                    )}
                    %
                  </div>
                  <p className="text-sm text-muted-foreground">Confiance moyenne</p>
                </div>
              </div>

              <div className="space-y-4">
                {completedValidations.map((result) => (
                  <div key={result.documentId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {result.isValid ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <h4 className="font-medium">
                          {DOCUMENT_TYPES[result.documentType as keyof typeof DOCUMENT_TYPES]?.label ||
                            result.documentType}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={result.isValid ? "default" : "destructive"}>
                          {result.isValid ? "Valide" : "Invalide"}
                        </Badge>
                        <Badge variant="outline">{Math.round(result.confidence * 100)}% confiance</Badge>
                      </div>
                    </div>

                    {result.errors.length > 0 && (
                      <Alert variant="destructive" className="mb-3">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-1">
                            {result.errors.map((error, index) => (
                              <div key={index}>
                                <strong>{error.message}</strong>
                                {error.suggestion && <p className="text-sm mt-1">💡 {error.suggestion}</p>}
                              </div>
                            ))}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    {result.warnings.length > 0 && (
                      <Alert className="mb-3">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-1">
                            {result.warnings.map((warning, index) => (
                              <div key={index}>{warning.message}</div>
                            ))}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Traité en {result.processingTime}ms</span>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Voir les détails
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(0)}>
              Ajouter des documents
            </Button>
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Télécharger le rapport
              </Button>
              <Button onClick={() => onComplete?.(completedValidations)}>Terminer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
