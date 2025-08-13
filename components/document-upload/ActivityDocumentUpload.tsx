"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, Check, X, Eye, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface ActivityDocumentUploadProps {
  onDocumentValidated: (documentData: any) => void
  completedDocument?: any
  title?: string
  description?: string
}

export function ActivityDocumentUpload({
  onDocumentValidated,
  completedDocument,
  title = "Justificatifs d'activité",
  description = "Tous les documents requis pour votre activité (contrat, bulletins de salaire, etc.)",
}: ActivityDocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Vérification du type de fichier
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      toast.error("Format de fichier non supporté. Utilisez JPG, PNG ou PDF.")
      return
    }

    // Vérification de la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Le fichier est trop volumineux. Taille maximum : 10MB.")
      return
    }

    setIsUploading(true)

    try {
      // Upload vers Supabase
      const formData = new FormData()
      formData.append("file", file)
      formData.append("bucket", "documents")
      formData.append("folder", "activity")

      const response = await fetch("/api/upload-supabase", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Erreur lors de l'upload")
      }

      const { url } = await response.json()

      const documentData = {
        id: Date.now().toString(),
        fileName: file.name,
        fileUrl: url,
        fileType: file.type,
        uploadedAt: new Date().toISOString(),
        validated: false,
      }

      setUploadedFile(documentData)
      setShowPreview(true)
      toast.success("Document uploadé avec succès ! Veuillez vérifier et valider.")
    } catch (error) {
      console.error("Erreur upload:", error)
      toast.error("Erreur lors de l'upload du document")
    } finally {
      setIsUploading(false)
    }
  }

  const handleValidateDocument = () => {
    if (!uploadedFile) return

    const validatedDocument = {
      ...uploadedFile,
      validated: true,
      validatedAt: new Date().toISOString(),
    }

    onDocumentValidated(validatedDocument)
    setUploadedFile(null)
    setShowPreview(false)
    toast.success("Document validé avec succès !")
  }

  const handleRejectDocument = () => {
    setUploadedFile(null)
    setShowPreview(false)
    toast.info("Document rejeté. Vous pouvez en uploader un nouveau.")
  }

  const handleRemoveValidatedDocument = () => {
    onDocumentValidated(null)
    toast.success("Document supprimé")
  }

  const renderFilePreview = (fileUrl: string, fileType: string, fileName: string) => {
    if (fileType === "application/pdf") {
      return (
        <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
          <div className="text-center">
            <FileText className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <p className="text-sm font-medium">{fileName}</p>
            <p className="text-xs text-gray-500">Document PDF</p>
          </div>
        </div>
      )
    } else {
      return (
        <img
          src={fileUrl || "/placeholder.svg"}
          alt={fileName}
          className="w-full h-48 object-contain bg-gray-100 rounded-lg"
        />
      )
    }
  }

  // Si un document est déjà validé
  if (completedDocument?.validated) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-600" />
              <Label className="text-sm font-medium text-green-800">{title}</Label>
              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                Validé
              </Badge>
            </div>
            <Button
              onClick={handleRemoveValidatedDocument}
              size="sm"
              variant="outline"
              className="text-red-600 hover:text-red-700 bg-transparent"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3">
            {renderFilePreview(completedDocument.fileUrl, completedDocument.fileType, completedDocument.fileName)}

            <div className="flex items-center justify-between">
              <p className="text-sm text-green-700">
                Document validé le {new Date(completedDocument.validatedAt).toLocaleDateString("fr-FR")}
              </p>
              <Button onClick={() => window.open(completedDocument.fileUrl, "_blank")} size="sm" variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Voir
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Si un document est en cours de validation
  if (showPreview && uploadedFile) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 mb-3">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <Label className="text-sm font-medium text-orange-800">{title}</Label>
            <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
              En attente de validation
            </Badge>
          </div>

          <p className="text-xs text-orange-700 mb-3">{description}</p>

          <div className="space-y-3">
            {renderFilePreview(uploadedFile.fileUrl, uploadedFile.fileType, uploadedFile.fileName)}

            <div className="bg-orange-100 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-800 mb-3">
                <strong>Vérifiez votre document :</strong>
              </p>
              <ul className="text-xs text-orange-700 space-y-1 mb-3">
                <li>• Le document est-il lisible et de bonne qualité ?</li>
                <li>• Toutes les informations importantes sont-elles visibles ?</li>
                <li>• Le document correspond-il à votre activité professionnelle ?</li>
              </ul>

              <div className="flex space-x-2">
                <Button
                  onClick={handleValidateDocument}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Valider ce document
                </Button>
                <Button
                  onClick={handleRejectDocument}
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700 bg-transparent"
                >
                  <X className="h-4 w-4 mr-2" />
                  Recommencer
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Interface d'upload initial
  return (
    <Card className="border-dashed border-2 border-gray-300 hover:border-gray-400 transition-colors">
      <CardContent className="p-6">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <FileText className="h-5 w-5 text-gray-600" />
            <Label className="text-sm font-medium">{title} *</Label>
          </div>

          <p className="text-xs text-gray-600 mb-4">{description}</p>

          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center py-8">
              <Upload className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-2">Cliquez pour sélectionner votre document</p>
              <p className="text-xs text-gray-500">Formats acceptés : JPG, PNG, PDF (max 10MB)</p>
            </div>

            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
              id="activity-document-upload"
            />

            <Button
              onClick={() => document.getElementById("activity-document-upload")?.click()}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Upload en cours...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Sélectionner un document
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
