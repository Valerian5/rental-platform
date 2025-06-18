"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { File, Eye, Edit, Trash2, Download, Upload, AlertCircle, CheckCircle, Calendar, FileText } from "lucide-react"
import { propertyDocumentsService, REQUIRED_DOCUMENTS, type PropertyDocument } from "@/lib/property-documents-service"
import { toast } from "sonner"

interface PropertyDocumentsManagerProps {
  propertyId: string
}

export function PropertyDocumentsManager({ propertyId }: PropertyDocumentsManagerProps) {
  const [documents, setDocuments] = useState<PropertyDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [editingDoc, setEditingDoc] = useState<PropertyDocument | null>(null)
  const [uploadingFile, setUploadingFile] = useState<File | null>(null)
  const [selectedType, setSelectedType] = useState<string>("")

  useEffect(() => {
    loadDocuments()
  }, [propertyId])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const docs = await propertyDocumentsService.getPropertyDocuments(propertyId)
      setDocuments(docs)
    } catch (error: any) {
      console.error("Erreur chargement documents:", error)
      toast.error("Erreur lors du chargement des documents")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) return

    try {
      await propertyDocumentsService.deleteDocument(documentId)
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId))
      toast.success("Document supprimé avec succès")
    } catch (error: any) {
      console.error("Erreur suppression:", error)
      toast.error("Erreur lors de la suppression")
    }
  }

  const handleUpdateDocument = async () => {
    if (!editingDoc || !uploadingFile || !selectedType) return

    try {
      const updatedDoc = await propertyDocumentsService.updateDocument(editingDoc.id, uploadingFile, selectedType)

      setDocuments((prev) => prev.map((doc) => (doc.id === editingDoc.id ? updatedDoc : doc)))

      setEditingDoc(null)
      setUploadingFile(null)
      setSelectedType("")
      toast.success("Document mis à jour avec succès")
    } catch (error: any) {
      console.error("Erreur mise à jour:", error)
      toast.error("Erreur lors de la mise à jour")
    }
  }

  const openDocument = (url: string) => {
    window.open(url, "_blank")
  }

  const downloadDocument = (url: string, filename: string) => {
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.click()
  }

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

  // Calculer les statistiques
  const requiredDocTypes = Object.entries(REQUIRED_DOCUMENTS).filter(([_, info]) => info.required)
  const requiredDocsCount = requiredDocTypes.length
  const uploadedRequiredDocs = requiredDocTypes.filter(([key]) => documentsByType[key]?.length > 0).length
  const completionRate = Math.round((uploadedRequiredDocs / requiredDocsCount) * 100)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Chargement des documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{documents.length}</p>
                <p className="text-sm text-gray-600">Documents total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {uploadedRequiredDocs}/{requiredDocsCount}
                </p>
                <p className="text-sm text-gray-600">Obligatoires</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className={`h-5 w-5 ${completionRate === 100 ? "text-green-500" : "text-orange-500"}`} />
              <div>
                <p className="text-2xl font-bold">{completionRate}%</p>
                <p className="text-sm text-gray-600">Complétude</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {documents.length > 0
                    ? new Date(Math.max(...documents.map((d) => new Date(d.uploaded_at).getTime()))).toLocaleDateString(
                        "fr-FR",
                        { day: "2-digit", month: "2-digit" },
                      )
                    : "-"}
                </p>
                <p className="text-sm text-gray-600">Dernier ajout</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents par catégorie */}
      <div className="space-y-6">
        {Object.entries(REQUIRED_DOCUMENTS).map(([docType, info]) => {
          const docsOfType = documentsByType[docType] || []
          const hasDocuments = docsOfType.length > 0

          return (
            <Card key={docType}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${hasDocuments ? "bg-green-100" : info.required ? "bg-red-100" : "bg-gray-100"}`}
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
                      <CardTitle className="text-lg">{info.name}</CardTitle>
                      <p className="text-sm text-gray-600">{info.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {info.required && (
                      <Badge variant={hasDocuments ? "default" : "destructive"}>
                        {hasDocuments ? "✓ Obligatoire" : "Obligatoire"}
                      </Badge>
                    )}
                    <Badge variant="outline">
                      {docsOfType.length} document{docsOfType.length > 1 ? "s" : ""}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {docsOfType.length > 0 ? (
                  <div className="space-y-3">
                    {docsOfType.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <File className="h-8 w-8 text-blue-500" />
                          <div>
                            <p className="font-medium">{doc.document_name}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>{(doc.file_size / 1024 / 1024).toFixed(1)} MB</span>
                              <span>Ajouté le {new Date(doc.uploaded_at).toLocaleDateString("fr-FR")}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => openDocument(doc.file_url)}>
                            <Eye className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadDocument(doc.file_url, doc.document_name)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingDoc(doc)
                                  setSelectedType(doc.document_type)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Modifier le document</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Type de document</Label>
                                  <Select value={selectedType} onValueChange={setSelectedType}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Object.entries(REQUIRED_DOCUMENTS).map(([key, info]) => (
                                        <SelectItem key={key} value={key}>
                                          {info.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Nouveau fichier</Label>
                                  <Input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => setUploadingFile(e.target.files?.[0] || null)}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button onClick={handleUpdateDocument} disabled={!uploadingFile}>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Mettre à jour
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button variant="outline" size="sm" onClick={() => handleDeleteDocument(doc.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <File className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="font-medium">Aucun document de ce type</p>
                    <p className="text-sm">{info.required ? "Ce document est obligatoire" : "Document optionnel"}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
