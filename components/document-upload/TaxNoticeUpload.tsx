"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, CheckCircle, AlertTriangle, X, Eye, Loader2 } from "lucide-react"
import { DocumentPreview } from "./DocumentPreview"
import { toast } from "sonner"

interface TaxNoticeUploadProps {
  onDocumentValidated: (documentData: any) => void
  completedDocument?: any
}

export function TaxNoticeUpload({ onDocumentValidated, completedDocument }: TaxNoticeUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewDocument, setPreviewDocument] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Vérifications de base
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]

    if (file.size > maxSize) {
      toast.error("Le fichier est trop volumineux (max 10MB)")
      return
    }

    if (!allowedTypes.includes(file.type)) {
      toast.error("Format non supporté. Utilisez PDF, JPG ou PNG")
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setValidationErrors([])

    try {
      // Simulation du progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Upload vers Supabase
      const formData = new FormData()
      formData.append("file", file)
      formData.append("bucket", "documents")
      formData.append("folder", "tax-notices")

      const uploadResponse = await fetch("/api/upload-supabase", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error("Erreur lors de l'upload")
      }

      const uploadResult = await uploadResponse.json()
      setUploadProgress(100)

      // Créer l'objet document pour preview
      const documentData = {
        id: `tax_notice_${Date.now()}`,
        fileName: file.name,
        fileUrl: uploadResult.url,
        filePath: uploadResult.path,
        fileType: file.type,
        fileSize: file.size,
        documentType: "tax_notice",
        uploadedAt: new Date().toISOString(),
        validationStatus: "pending",
        extractedData: {},
      }

      setPreviewDocument(documentData)
      setShowPreview(true)
    } catch (error) {
      console.error("Erreur upload:", error)
      toast.error("Erreur lors de l'upload du document")
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleValidateDocument = async () => {
    if (!previewDocument) return

    setIsUploading(true)

    try {
      // Simulation de validation
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const validatedDocument = {
        ...previewDocument,
        validationStatus: "validated",
        validationScore: 85,
        extractedData: {
          year: "2023",
          income: "45000",
          taxAmount: "3200",
        },
      }

      onDocumentValidated(validatedDocument)
      setShowPreview(false)
      setPreviewDocument(null)
      toast.success("Avis d'imposition validé avec succès !")
    } catch (error) {
      console.error("Erreur validation:", error)
      toast.error("Erreur lors de la validation")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveDocument = () => {
    onDocumentValidated(null)
    toast.success("Avis d'imposition supprimé")
  }

  const handleCancelPreview = () => {
    setShowPreview(false)
    setPreviewDocument(null)
    setValidationErrors([])
  }

  // Si un document est déjà validé
  if (completedDocument && !showPreview) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-800">Avis d'imposition validé</p>
                <p className="text-sm text-green-600">{completedDocument.fileName}</p>
                {completedDocument.extractedData?.year && (
                  <p className="text-xs text-green-600">Année fiscale : {completedDocument.extractedData.year}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="default" className="bg-green-600">
                Score: {completedDocument.validationScore || 85}%
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPreviewDocument(completedDocument)
                  setShowPreview(true)
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleRemoveDocument}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Mode preview
  if (showPreview && previewDocument) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Aperçu du document</h3>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">{previewDocument.fileName}</Badge>
                <Button variant="ghost" size="sm" onClick={handleCancelPreview}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <DocumentPreview
              fileUrl={previewDocument.fileUrl}
              fileName={previewDocument.fileName}
              fileType={previewDocument.fileType}
              className="mb-4"
            />

            {validationErrors.length > 0 && (
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Problèmes détectés :</p>
                    <ul className="list-disc list-inside text-sm">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-blue-800 mb-2">Vérifications automatiques :</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Document lisible et de bonne qualité</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Format accepté (PDF/Image)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Taille du fichier correcte</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleValidateDocument} disabled={isUploading} className="flex-1">
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Validation...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Valider ce document
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleCancelPreview}>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Mode upload initial
  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="p-4 bg-blue-50 rounded-full w-fit mx-auto">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Avis d'imposition sur le revenu</h3>
              <p className="text-sm text-gray-600 mb-4">
                Téléchargez votre dernier avis d'imposition complet (année fiscale 2023)
              </p>
            </div>

            {isUploading ? (
              <div className="space-y-3">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-sm text-gray-600">Upload en cours... {uploadProgress}%</p>
              </div>
            ) : (
              <Button onClick={() => fileInputRef.current?.click()} className="bg-blue-600 hover:bg-blue-700">
                <Upload className="h-4 w-4 mr-2" />
                Choisir le fichier
              </Button>
            )}

            <div className="text-xs text-gray-500 space-y-1">
              <p>Formats acceptés : PDF, JPG, PNG</p>
              <p>Taille maximum : 10 MB</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-yellow-50 p-4 rounded-lg">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-yellow-800 mb-1">Document requis</p>
            <p className="text-yellow-700">
              L'avis d'imposition est obligatoire pour constituer votre dossier. Assurez-vous qu'il soit complet et
              lisible.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
