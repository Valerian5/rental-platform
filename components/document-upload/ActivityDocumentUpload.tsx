"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, Check, X, Eye, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { DocumentPreview } from "./DocumentPreview"

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

  // Si un document est déjà validé
  if (completedDocument?.validated) {
    return (
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-emerald-600" />
              <Label className="text-sm font-medium text-emerald-800">{title}</Label>
              <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-300">
                Validé
              </Badge>
            </div>
            <Button
              onClick={handleRemoveValidatedDocument}
              size="sm"
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 bg-transparent"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3">
            <DocumentPreview
              fileUrl={completedDocument.fileUrl}
              fileName={completedDocument.fileName}
              fileType={completedDocument.fileType}
              className="max-h-64"
            />

            <div className="flex items-center justify-between">
              <p className="text-sm text-emerald-700">
                Document validé le {new Date(completedDocument.validatedAt).toLocaleDateString("fr-FR")}
              </p>
              <Button
                onClick={() => window.open(completedDocument.fileUrl, "_blank")}
                size="sm"
                variant="outline"
                className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100 border-emerald-300"
              >
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
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 mb-3">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <Label className="text-sm font-medium text-blue-800">{title}</Label>
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
              En attente de validation
            </Badge>
          </div>

          <p className="text-xs text-blue-700 mb-3">{description}</p>

          <div className="space-y-3">
            <DocumentPreview
              fileUrl={uploadedFile.fileUrl}
              fileName={uploadedFile.fileName}
              fileType={uploadedFile.fileType}
              className="max-h-80"
            />

            <div className="bg-blue-100 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800 mb-3">
                <strong>Vérifiez votre document :</strong>
              </p>
              <ul className="text-xs text-blue-700 space-y-1 mb-3">
                <li>• Le document est-il lisible et de bonne qualité ?</li>
                <li>• Toutes les informations importantes sont-elles visibles ?</li>
                <li>• Le document correspond-il à votre activité professionnelle ?</li>
              </ul>

              <div className="flex space-x-2">
                <Button
                  onClick={handleValidateDocument}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Valider ce document
                </Button>
                <Button
                  onClick={handleRejectDocument}
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 bg-transparent"
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
    <Card className="border-dashed border-2 border-gray-300 hover:border-blue-400 transition-colors">
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
              className="w-full bg-blue-600 hover:bg-blue-700"
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
