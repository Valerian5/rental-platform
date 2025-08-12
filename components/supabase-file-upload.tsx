"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { X, Upload, File, Check, Trash2, AlertTriangle, Eye, Zap } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DocumentPreviewAnalyzer } from "./document-preview-analyzer"

interface SupabaseFileUploadProps {
  onFilesUploaded: (urls: string[]) => void
  maxFiles?: number
  acceptedTypes?: string[]
  bucket?: string
  folder?: string
  existingFiles?: string[]
  documentType?: string
  category?: string
}

interface UploadedFile {
  file: File
  url?: string
  path?: string
  uploading: boolean
  error?: string
  progress: number
  validationResult?: DocumentValidationResult
  analysisResult?: any
  showAnalysis?: boolean
}

interface DocumentValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

// Règles de validation par type de document
const DOCUMENT_VALIDATION_RULES = {
  identity: {
    name: "Pièce d'identité",
    requiredFiles: 2,
    description: "Recto ET verso de votre pièce d'identité",
    acceptedTypes: ["image/jpeg", "image/jpg", "image/png", "application/pdf"],
    maxSizePerFile: 10 * 1024 * 1024, // 10MB
    validationRules: [
      "Le document doit être en cours de validité",
      "Les deux faces (recto/verso) sont obligatoires",
      "Le document doit être lisible et de bonne qualité",
    ],
  },
  payslip: {
    name: "Fiches de paie",
    requiredFiles: 3,
    description: "Les 3 dernières fiches de paie (mois précédents)",
    acceptedTypes: ["application/pdf", "image/jpeg", "image/jpg", "image/png"],
    maxSizePerFile: 5 * 1024 * 1024, // 5MB
    validationRules: [
      "Les fiches doivent être des 3 derniers mois",
      "Elles doivent être consécutives",
      "Le nom doit correspondre à votre identité",
    ],
  },
  tax_notice: {
    name: "Avis d'imposition",
    requiredFiles: 1,
    description: "Dernier avis d'imposition (année précédente)",
    acceptedTypes: ["application/pdf", "image/jpeg", "image/jpg", "image/png"],
    maxSizePerFile: 10 * 1024 * 1024, // 10MB
    validationRules: [
      "L'avis doit être de l'année fiscale précédente",
      "Il doit être complet (toutes les pages)",
      "Le QR Code 2DDoc doit être lisible",
    ],
  },
  bank_statement: {
    name: "Relevés bancaires",
    requiredFiles: 3,
    description: "Les 3 derniers relevés bancaires",
    acceptedTypes: ["application/pdf", "image/jpeg", "image/jpg", "image/png"],
    maxSizePerFile: 5 * 1024 * 1024, // 5MB
    validationRules: [
      "Les relevés doivent être des 3 derniers mois",
      "Ils doivent être consécutifs",
      "Le titulaire doit correspondre à votre identité",
    ],
  },
  employment_contract: {
    name: "Contrat de travail",
    requiredFiles: 1,
    description: "Contrat de travail complet et signé",
    acceptedTypes: ["application/pdf", "image/jpeg", "image/jpg", "image/png"],
    maxSizePerFile: 10 * 1024 * 1024, // 10MB
    validationRules: [
      "Le contrat doit être signé par les deux parties",
      "Il doit être complet (toutes les pages)",
      "La date de début doit être récente ou future",
    ],
  },
}

export function SupabaseFileUpload({
  onFilesUploaded,
  maxFiles = 5,
  acceptedTypes = ["image/*", "application/pdf"],
  bucket = "documents",
  folder = "general",
  existingFiles = [],
  documentType = "general",
  category = "general",
}: SupabaseFileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [existingFilesState, setExistingFilesState] = useState<Array<{ url: string; path?: string }>>(
    existingFiles.map((url) => ({ url, path: extractPathFromUrl(url) })),
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Obtenir les règles de validation pour ce type de document
  const validationRules = DOCUMENT_VALIDATION_RULES[documentType as keyof typeof DOCUMENT_VALIDATION_RULES]

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const newFiles = Array.from(files).map((file) => {
      const validation = validateFile(file, documentType)
      return {
        file,
        uploading: false,
        progress: 0,
        validationResult: validation,
        showAnalysis: false,
      }
    })

    setUploadedFiles((prev) => [...prev, ...newFiles].slice(0, maxFiles))
  }

  const validateFile = (file: File, docType: string): DocumentValidationResult => {
    const rules = DOCUMENT_VALIDATION_RULES[docType as keyof typeof DOCUMENT_VALIDATION_RULES]
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []

    if (!rules) {
      return { isValid: true, errors, warnings, suggestions }
    }

    // Vérifier le type de fichier
    if (
      !rules.acceptedTypes.some((type) => {
        if (type.includes("*")) {
          return file.type.startsWith(type.replace("*", ""))
        }
        return file.type === type
      })
    ) {
      errors.push(`Type de fichier non accepté. Types autorisés: ${rules.acceptedTypes.join(", ")}`)
    }

    // Vérifier la taille
    if (file.size > rules.maxSizePerFile) {
      errors.push(`Fichier trop volumineux. Taille maximum: ${(rules.maxSizePerFile / 1024 / 1024).toFixed(1)}MB`)
    }

    // Vérifications spécifiques par type
    switch (docType) {
      case "payslip":
        if (!file.name.toLowerCase().includes("paie") && !file.name.toLowerCase().includes("salaire")) {
          warnings.push("Le nom du fichier ne semble pas correspondre à une fiche de paie")
          suggestions.push('Renommez votre fichier pour inclure "paie" ou "salaire"')
        }
        break

      case "tax_notice":
        const currentYear = new Date().getFullYear()
        const expectedYear = currentYear - 1
        if (!file.name.includes(expectedYear.toString())) {
          warnings.push(`L'avis d'imposition devrait être de ${expectedYear}`)
          suggestions.push(`Vérifiez que c'est bien l'avis d'imposition ${expectedYear}`)
        }
        break

      case "identity":
        if (
          !file.name.toLowerCase().includes("recto") &&
          !file.name.toLowerCase().includes("verso") &&
          !file.name.toLowerCase().includes("cni") &&
          !file.name.toLowerCase().includes("carte")
        ) {
          suggestions.push('Nommez vos fichiers "recto" et "verso" pour plus de clarté')
        }
        break
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    }
  }

  const uploadFile = async (fileData: UploadedFile, fileIndex: number) => {
    try {
      // Marquer comme en cours d'upload
      setUploadedFiles((prev) =>
        prev.map((f, idx) => (idx === fileIndex ? { ...f, uploading: true, progress: 10 } : f)),
      )

      // Préparer les données
      const formData = new FormData()
      formData.append("file", fileData.file)
      formData.append("bucket", bucket)
      formData.append("folder", `${folder}/${category}`)

      // Simuler le progrès
      setUploadedFiles((prev) => prev.map((f, idx) => (idx === fileIndex ? { ...f, progress: 30 } : f)))

      // Upload via API Supabase
      const response = await fetch("/api/upload-supabase", {
        method: "POST",
        body: formData,
      })

      setUploadedFiles((prev) => prev.map((f, idx) => (idx === fileIndex ? { ...f, progress: 80 } : f)))

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()

      // Marquer comme terminé
      setUploadedFiles((prev) =>
        prev.map((f, idx) =>
          idx === fileIndex
            ? {
                ...f,
                url: result.url,
                path: result.path,
                uploading: false,
                progress: 100,
                error: undefined,
              }
            : f,
        ),
      )

      console.log("✅ Fichier uploadé:", result.url)
      return result.url
    } catch (error) {
      console.error("❌ Erreur upload:", error)
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
      return null
    }
  }

  const uploadFiles = async () => {
    const filesToUpload = uploadedFiles
      .map((f, index) => ({ file: f, index }))
      .filter(({ file }) => !file.url && !file.uploading && file.validationResult?.isValid)

    if (filesToUpload.length === 0) {
      console.log("📤 Aucun fichier valide à uploader")
      return
    }

    const uploadedUrls = []

    for (const { file, index } of filesToUpload) {
      const url = await uploadFile(file, index)
      if (url) {
        uploadedUrls.push(url)
      }
    }

    // Notifier les URLs uploadées
    console.log("📤 SupabaseFileUpload - URLs nouvellement uploadées:", uploadedUrls)

    if (uploadedUrls.length > 0) {
      onFilesUploaded(uploadedUrls)
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const removeExistingFile = async (fileIndex: number) => {
    const fileToRemove = existingFilesState[fileIndex]
    if (!fileToRemove.path) {
      console.error("❌ Impossible de supprimer: chemin manquant")
      return
    }

    try {
      const response = await fetch(
        `/api/upload-supabase?path=${encodeURIComponent(fileToRemove.path)}&bucket=${bucket}`,
        {
          method: "DELETE",
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de la suppression")
      }

      // Retirer de la liste locale
      setExistingFilesState((prev) => prev.filter((_, i) => i !== fileIndex))

      // Notifier le parent avec la nouvelle liste
      const remainingUrls = existingFilesState.filter((_, i) => i !== fileIndex).map((f) => f.url)
      onFilesUploaded(remainingUrls)

      console.log("✅ Fichier supprimé avec succès")
    } catch (error) {
      console.error("❌ Erreur suppression:", error)
    }
  }

  const toggleAnalysis = (index: number) => {
    setUploadedFiles((prev) => prev.map((f, idx) => (idx === index ? { ...f, showAnalysis: !f.showAnalysis } : f)))
  }

  const handleAnalysisComplete = (index: number, analysis: any) => {
    setUploadedFiles((prev) => prev.map((f, idx) => (idx === index ? { ...f, analysisResult: analysis } : f)))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  // Calculer le nombre total de fichiers
  const totalFiles = existingFilesState.length + uploadedFiles.filter((f) => f.url).length
  const remainingSlots = maxFiles - totalFiles

  return (
    <div className="space-y-4">
      {/* Informations sur le type de document */}
      {validationRules && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>
                <strong>{validationRules.name}</strong> - {validationRules.description}
              </p>
              <p className="text-sm">
                Fichiers requis: {validationRules.requiredFiles} | Actuels: {totalFiles}
              </p>
              <ul className="text-xs space-y-1">
                {validationRules.validationRules.map((rule, index) => (
                  <li key={index}>• {rule}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Zone de drop */}
      {remainingSlots > 0 && (
        <Card
          className={`border-2 border-dashed transition-colors ${
            dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <CardContent className="p-6 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium">Glissez vos fichiers ici</p>
              <p className="text-sm text-gray-500">ou</p>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={remainingSlots <= 0}>
                Choisir des fichiers
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {remainingSlots} emplacements restants • {acceptedTypes.join(", ")} • Max{" "}
              {validationRules?.maxSizePerFile
                ? `${(validationRules.maxSizePerFile / 1024 / 1024).toFixed(1)}MB`
                : "10MB"}{" "}
              par fichier
            </p>
          </CardContent>
        </Card>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={validationRules?.acceptedTypes.join(",") || acceptedTypes.join(",")}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Liste des nouveaux fichiers */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Nouveaux fichiers ({uploadedFiles.length})</h4>
            <Button
              onClick={uploadFiles}
              disabled={uploadedFiles.every((f) => f.url || f.uploading || !f.validationResult?.isValid)}
              size="sm"
            >
              Uploader tout
            </Button>
          </div>

          {uploadedFiles.map((fileData, index) => (
            <div key={index} className="space-y-2">
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <File className="h-8 w-8 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{fileData.file.name}</p>
                      <p className="text-xs text-gray-500">{Math.round(fileData.file.size / 1024)} KB</p>

                      {/* Validation */}
                      {fileData.validationResult && (
                        <div className="mt-1 space-y-1">
                          {fileData.validationResult.errors.map((error, i) => (
                            <p key={i} className="text-xs text-red-500">
                              ❌ {error}
                            </p>
                          ))}
                          {fileData.validationResult.warnings.map((warning, i) => (
                            <p key={i} className="text-xs text-yellow-600">
                              ⚠️ {warning}
                            </p>
                          ))}
                          {fileData.validationResult.suggestions.map((suggestion, i) => (
                            <p key={i} className="text-xs text-blue-600">
                              💡 {suggestion}
                            </p>
                          ))}
                        </div>
                      )}

                      {fileData.uploading && <Progress value={fileData.progress} className="mt-1 h-1" />}
                      {fileData.error && <p className="text-xs text-red-500 mt-1">{fileData.error}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {fileData.url && <Check className="h-4 w-4 text-green-500" />}
                      {fileData.uploading && (
                        <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      )}
                      {!fileData.validationResult?.isValid && <AlertTriangle className="h-4 w-4 text-red-500" />}

                      {/* Bouton d'analyse intelligente */}
                      {fileData.url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAnalysis(index)}
                          title="Analyse intelligente"
                        >
                          <Zap className="h-4 w-4" />
                        </Button>
                      )}

                      <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Analyse intelligente */}
              {fileData.showAnalysis && fileData.url && (
                <DocumentPreviewAnalyzer
                  fileUrl={fileData.url}
                  fileName={fileData.file.name}
                  documentType={documentType}
                  onAnalysisComplete={(analysis) => handleAnalysisComplete(index, analysis)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Fichiers existants */}
      {existingFilesState.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Fichiers existants ({existingFilesState.length})</h4>
          {existingFilesState.map((fileData, index) => (
            <Card key={index}>
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <File className="h-8 w-8 text-green-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Document {index + 1}</p>
                    <p className="text-xs text-gray-500 truncate">{fileData.url}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => window.open(fileData.url, "_blank")}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => removeExistingFile(index)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Résumé de validation */}
      {validationRules && (
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span>Progression:</span>
            <span
              className={`font-medium ${totalFiles >= validationRules.requiredFiles ? "text-green-600" : "text-orange-600"}`}
            >
              {totalFiles} / {validationRules.requiredFiles} fichiers
            </span>
          </div>
          <Progress value={(totalFiles / validationRules.requiredFiles) * 100} className="mt-2 h-2" />
          {totalFiles < validationRules.requiredFiles && (
            <p className="text-xs text-gray-600 mt-1">
              Il vous manque {validationRules.requiredFiles - totalFiles} fichier(s) pour compléter cette section
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// Fonction utilitaire pour extraire le chemin depuis l'URL
function extractPathFromUrl(url: string): string | undefined {
  try {
    // Pour les URLs Supabase Storage: https://xxx.supabase.co/storage/v1/object/public/bucket/path
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split("/")
    const publicIndex = pathParts.indexOf("public")
    if (publicIndex !== -1 && publicIndex < pathParts.length - 2) {
      // Retourner le chemin après /public/bucket/
      return pathParts.slice(publicIndex + 2).join("/")
    }
    return undefined
  } catch {
    return undefined
  }
}
