"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { File, Upload, AlertCircle, CheckCircle, X } from "lucide-react"
import { propertyDocumentsService, REQUIRED_DOCUMENTS, type PropertyDocument } from "@/lib/property-documents-service"
import { toast } from "sonner"

interface PropertyDocumentsUploadProps {
  propertyId: string
  onDocumentsChange?: (documents: PropertyDocument[]) => void
  showRequiredOnly?: boolean
}

export function PropertyDocumentsUpload({
  propertyId,
  onDocumentsChange,
  showRequiredOnly = false,
}: PropertyDocumentsUploadProps) {
  const [documents, setDocuments] = useState<PropertyDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string>("")
  const [uploadingFile, setUploadingFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    loadDocuments()
  }, [propertyId])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const docs = await propertyDocumentsService.getPropertyDocuments(propertyId)
      setDocuments(docs)
      if (onDocumentsChange) {
        onDocumentsChange(docs)
      }
    } catch (error: any) {
      console.error("Erreur chargement documents:", error)
      toast.error("Erreur lors du chargement des documents")
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!uploadingFile || !selectedType) return

    setIsUploading(true)
    try {
      const newDoc = await propertyDocumentsService.uploadDocument(propertyId, uploadingFile, selectedType)

      setDocuments((prev) => [...prev, newDoc])
      if (onDocumentsChange) {
        onDocumentsChange([...documents, newDoc])
      }

      setSelectedType("")
      setUploadingFile(null)

      // Reset l'input
      const input = document.getElementById("document-file") as HTMLInputElement
      if (input) input.value = ""

      toast.success("Document ajouté avec succès")
    } catch (error: any) {
      console.error("Erreur upload:", error)
      toast.error("Erreur lors de l'upload du document")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) return

    try {
      await propertyDocumentsService.deleteDocument(documentId)
      const updatedDocs = documents.filter((doc) => doc.id !== documentId)
      setDocuments(updatedDocs)
      if (onDocumentsChange) {
        onDocumentsChange(updatedDocs)
      }
      toast.success("Document supprimé avec succès")
    } catch (error: any) {
      console.error("Erreur suppression:", error)
      toast.error("Erreur lors de la suppression")
    }
  }

  // Filtrer les types de documents si nécessaire
  const documentTypes = Object.entries(REQUIRED_DOCUMENTS).filter(([_, info]) => !showRequiredOnly || info.required)

  // Grouper les documents par type
  const documentsByType = documents.reduce(
    (acc, doc) => {
      if (!acc[doc.document_type]) {
        acc[doc.document_type] = []
      }
      acc[doc.document_type].push(doc)
      return acc
    },
    {} as Record<string, PropertyDocument[]>,
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Chargement des documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Formulaire d'upload */}
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
            onChange={(e) => setUploadingFile(e.target.files?.[0] || null)}
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

      <Button onClick={handleUpload} disabled={!uploadingFile || !selectedType || isUploading}>
        <Upload className="h-4 w-4 mr-2" />
        {isUploading ? "Upload en cours..." : "Ajouter le document"}
      </Button>

      {/* Liste des documents requis */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Documents {showRequiredOnly ? "obligatoires" : ""}</h3>
        <div className="space-y-4">
          {documentTypes.map(([docType, info]) => {
            const docsOfType = documentsByType[docType] || []
            const hasDocuments = docsOfType.length > 0

            return (
              <Card key={docType} className={info.required && !hasDocuments ? "border-red-300" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          hasDocuments ? "bg-green-100" : info.required ? "bg-red-100" : "bg-gray-100"
                        }`}
                      >
                        {hasDocuments ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : info.required ? (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        ) : (
                          <File className="h-5 w-5 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{info.name}</p>
                        <p className="text-sm text-gray-600">{info.description}</p>
                      </div>
                    </div>
                    <div>
                      {info.required && (
                        <Badge variant={hasDocuments ? "default" : "destructive"}>
                          {hasDocuments ? "✓ Fourni" : "Obligatoire"}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Documents de ce type */}
                  {hasDocuments && (
                    <div className="mt-4 space-y-2">
                      {docsOfType.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <File className="h-4 w-4 text-blue-500" />
                            <span className="text-sm">{doc.document_name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
