"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, File, X, Check, AlertCircle } from "lucide-react"
import { propertyDocumentsService, REQUIRED_DOCUMENTS, type PropertyDocument } from "@/lib/property-documents-service"
import { toast } from "sonner"

interface PropertyDocumentsUploadProps {
  propertyId: string
  existingDocuments?: PropertyDocument[]
  onDocumentsChange?: (documents: PropertyDocument[]) => void
  showRequiredOnly?: boolean
}

interface UploadingDocument {
  file: File
  documentType: string
  progress: number
  uploading: boolean
  error?: string
  uploaded?: PropertyDocument
}

export function PropertyDocumentsUpload({
  propertyId,
  existingDocuments = [],
  onDocumentsChange,
  showRequiredOnly = false,
}: PropertyDocumentsUploadProps) {
  const [uploadingDocs, setUploadingDocs] = useState<UploadingDocument[]>([])
  const [selectedType, setSelectedType] = useState<string>("")

  const documentTypes = Object.entries(REQUIRED_DOCUMENTS).filter(([_, info]) => !showRequiredOnly || info.required)

  const handleFileSelect = (files: FileList | null, documentType: string) => {
    if (!files || !documentType) return

    const newDocs = Array.from(files).map((file) => ({
      file,
      documentType,
      progress: 0,
      uploading: false,
    }))

    setUploadingDocs((prev) => [...prev, ...newDocs])
  }

  const uploadDocument = async (docIndex: number) => {
    const doc = uploadingDocs[docIndex]
    if (!doc || doc.uploading) return

    try {
      // Marquer comme en cours d'upload
      setUploadingDocs((prev) => prev.map((d, i) => (i === docIndex ? { ...d, uploading: true, progress: 10 } : d)))

      // Simuler le progrès
      setUploadingDocs((prev) => prev.map((d, i) => (i === docIndex ? { ...d, progress: 30 } : d)))

      // Upload via le service
      const uploadedDoc = await propertyDocumentsService.uploadDocument(propertyId, doc.file, doc.documentType)

      // Marquer comme terminé
      setUploadingDocs((prev) =>
        prev.map((d, i) =>
          i === docIndex
            ? {
                ...d,
                uploading: false,
                progress: 100,
                uploaded: uploadedDoc,
                error: undefined,
              }
            : d,
        ),
      )

      // Notifier le changement
      if (onDocumentsChange) {
        const allDocs = [...existingDocuments, uploadedDoc]
        onDocumentsChange(allDocs)
      }

      toast.success("Document uploadé avec succès")
    } catch (error: any) {
      console.error("Erreur upload:", error)
      setUploadingDocs((prev) =>
        prev.map((d, i) =>
          i === docIndex
            ? {
                ...d,
                uploading: false,
                error: error.message,
                progress: 0,
              }
            : d,
        ),
      )
      toast.error("Erreur lors de l'upload du document")
    }
  }

  const removeDocument = (index: number) => {
    setUploadingDocs((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadAllDocuments = async () => {
    const docsToUpload = uploadingDocs
      .map((doc, index) => ({ doc, index }))
      .filter(({ doc }) => !doc.uploaded && !doc.uploading)

    for (const { index } of docsToUpload) {
      await uploadDocument(index)
    }
  }

  const getExistingDocumentForType = (documentType: string) => {
    return existingDocuments.find((doc) => doc.document_type === documentType)
  }

  return (
    <div className="space-y-6">
      {/* Zone d'upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Ajouter des documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="document-type">Type de document</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        {info.name}
                        {info.required && (
                          <Badge variant="destructive" className="text-xs">
                            Obligatoire
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="document-file">Fichier</Label>
              <Input
                id="document-file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileSelect(e.target.files, selectedType)}
                disabled={!selectedType}
              />
            </div>
          </div>

          {selectedType && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>{REQUIRED_DOCUMENTS[selectedType as keyof typeof REQUIRED_DOCUMENTS]?.name}</strong>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {REQUIRED_DOCUMENTS[selectedType as keyof typeof REQUIRED_DOCUMENTS]?.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents en cours d'upload */}
      {uploadingDocs.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Documents à uploader ({uploadingDocs.length})</CardTitle>
              <Button
                onClick={uploadAllDocuments}
                disabled={uploadingDocs.every((doc) => doc.uploaded || doc.uploading)}
                size="sm"
              >
                Uploader tout
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadingDocs.map((doc, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <File className="h-8 w-8 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.file.name}</p>
                      <p className="text-xs text-gray-500">
                        {REQUIRED_DOCUMENTS[doc.documentType as keyof typeof REQUIRED_DOCUMENTS]?.name}
                      </p>
                      {doc.uploading && <Progress value={doc.progress} className="mt-1 h-1" />}
                      {doc.error && (
                        <p className="text-xs text-red-500 mt-1 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {doc.error}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.uploaded && <Check className="h-4 w-4 text-green-500" />}
                      {doc.uploading && (
                        <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      )}
                      {!doc.uploaded && !doc.uploading && (
                        <Button variant="outline" size="sm" onClick={() => uploadDocument(index)}>
                          Upload
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => removeDocument(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents existants par catégorie */}
      {existingDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Documents existants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documentTypes.map(([key, info]) => {
                const existingDoc = getExistingDocumentForType(key)
                return (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <File className={`h-5 w-5 ${existingDoc ? "text-green-500" : "text-gray-400"}`} />
                      <div>
                        <p className="font-medium">{info.name}</p>
                        <p className="text-xs text-gray-500">{info.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {info.required && (
                        <Badge variant={existingDoc ? "default" : "destructive"} className="text-xs">
                          {existingDoc ? "✓" : "Obligatoire"}
                        </Badge>
                      )}
                      {existingDoc ? (
                        <Badge variant="outline" className="text-xs text-green-600">
                          Ajouté
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-gray-500">
                          Manquant
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
