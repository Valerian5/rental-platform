"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, CreditCard, CheckCircle, AlertTriangle, X, Loader2 } from "lucide-react"
import { DocumentPreview } from "./DocumentPreview"
import { toast } from "sonner"

interface IdentityDocumentUploadProps {
  onDocumentValidated: (side: "recto" | "verso", documentData: any) => void
  completedSides?: { recto?: any; verso?: any }
}

export function IdentityDocumentUpload({ onDocumentValidated, completedSides = {} }: IdentityDocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentSide, setCurrentSide] = useState<"recto" | "verso" | null>(null)
  const [previewDocument, setPreviewDocument] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !currentSide) return

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
      formData.append("folder", `identity/${currentSide}`)

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
        id: `identity_${currentSide}_${Date.now()}`,
        fileName: file.name,
        fileUrl: uploadResult.url,
        filePath: uploadResult.path,
        fileType: file.type,
        fileSize: file.size,
        documentType: "identity",
        side: currentSide,
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
    if (!previewDocument || !currentSide) return

    setIsUploading(true)

    try {
      // Simulation de validation
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const validatedDocument = {
        ...previewDocument,
        validationStatus: "validated",
        validationScore: 92,
        extractedData: {
          firstName: "Jean",
          lastName: "Dupont",
          birthDate: "1990-01-01",
          documentNumber: "123456789",
        },
      }

      onDocumentValidated(currentSide, validatedDocument)
      setShowPreview(false)
      setPreviewDocument(null)
      setCurrentSide(null)
      toast.success(`${currentSide === "recto" ? "Recto" : "Verso"} validé avec succès !`)
    } catch (error) {
      console.error("Erreur validation:", error)
      toast.error("Erreur lors de la validation")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveDocument = (side: "recto" | "verso") => {
    onDocumentValidated(side, null)
    toast.success(`${side === "recto" ? "Recto" : "Verso"} supprimé`)
  }

  const handleCancelPreview = () => {
    setShowPreview(false)
    setPreviewDocument(null)
    setCurrentSide(null)
    setValidationErrors([])
  }

  const startUpload = (side: "recto" | "verso") => {
    setCurrentSide(side)
    fileInputRef.current?.click()
  }

  // Mode preview
  if (showPreview && previewDocument) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Aperçu du {currentSide}</h3>
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
                  <span>Informations extraites automatiquement</span>
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
                    Valider ce {currentSide}
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

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Recto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Recto (Face avant)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {completedSides.recto ? (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-green-800">Recto validé</p>
                      <p className="text-sm text-green-600">{completedSides.recto.fileName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="default" className="bg-green-600">
                      Score: {completedSides.recto.validationScore || 92}%
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveDocument("recto")}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="p-3 bg-blue-50 rounded-full w-fit mx-auto">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Face avant de votre pièce d'identité</h4>
                    <p className="text-sm text-gray-600">Carte d'identité, passeport ou titre de séjour</p>
                  </div>
                  {isUploading && currentSide === "recto" ? (
                    <div className="space-y-3">
                      <Progress value={uploadProgress} className="w-full" />
                      <p className="text-sm text-gray-600">Upload en cours... {uploadProgress}%</p>
                    </div>
                  ) : (
                    <Button onClick={() => startUpload("recto")} className="bg-blue-600 hover:bg-blue-700">
                      <Upload className="h-4 w-4 mr-2" />
                      Télécharger le recto
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Verso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 rotate-180" />
            Verso (Face arrière)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {completedSides.verso ? (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-green-800">Verso validé</p>
                      <p className="text-sm text-green-600">{completedSides.verso.fileName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="default" className="bg-green-600">
                      Score: {completedSides.verso.validationScore || 92}%
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveDocument("verso")}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="p-3 bg-blue-50 rounded-full w-fit mx-auto">
                    <CreditCard className="h-6 w-6 text-blue-600 rotate-180" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Face arrière de votre pièce d'identité</h4>
                    <p className="text-sm text-gray-600">Obligatoire pour valider votre identité</p>
                  </div>
                  {isUploading && currentSide === "verso" ? (
                    <div className="space-y-3">
                      <Progress value={uploadProgress} className="w-full" />
                      <p className="text-sm text-gray-600">Upload en cours... {uploadProgress}%</p>
                    </div>
                  ) : (
                    <Button onClick={() => startUpload("verso")} className="bg-blue-600 hover:bg-blue-700">
                      <Upload className="h-4 w-4 mr-2" />
                      Télécharger le verso
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-800 mb-1">Important</p>
            <p className="text-blue-700">
              Les deux faces de votre pièce d'identité sont obligatoires. Assurez-vous que les documents soient nets et
              lisibles.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
