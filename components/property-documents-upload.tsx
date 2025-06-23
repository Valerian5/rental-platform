"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FileText, Check, AlertTriangle, X } from "lucide-react"
import { FileUpload } from "@/components/file-upload"
import { toast } from "sonner"

interface PropertyDocument {
  id: string
  name: string
  type: string
  required: boolean
  description: string
  uploaded: boolean
  url?: string
}

interface PropertyDocumentsUploadProps {
  propertyId: string
  onDocumentsChange?: (documents: any[]) => void
  showRequiredOnly?: boolean
}

const REQUIRED_DOCUMENTS: PropertyDocument[] = [
  {
    id: "dpe",
    name: "Diagnostic de Performance Énergétique (DPE)",
    type: "dpe",
    required: true,
    description: "Obligatoire pour toute mise en location",
    uploaded: false,
  },
  {
    id: "erp",
    name: "État des Risques et Pollutions (ERP)",
    type: "erp",
    required: true,
    description: "Obligatoire si la commune est concernée par un plan de prévention des risques",
    uploaded: false,
  },
  {
    id: "assurance_pno",
    name: "Assurance Propriétaire Non Occupant (PNO)",
    type: "assurance",
    required: true,
    description: "Attestation d'assurance obligatoire",
    uploaded: false,
  },
  {
    id: "diagnostic_plomb",
    name: "Diagnostic Plomb (CREP)",
    type: "diagnostic",
    required: true,
    description: "Obligatoire pour les logements construits avant 1949",
    uploaded: false,
  },
  {
    id: "diagnostic_amiante",
    name: "Diagnostic Amiante",
    type: "diagnostic",
    required: true,
    description: "Obligatoire pour les logements construits avant 1997",
    uploaded: false,
  },
  {
    id: "diagnostic_gaz",
    name: "Diagnostic Gaz",
    type: "diagnostic",
    required: true,
    description: "Obligatoire si installation gaz de plus de 15 ans",
    uploaded: false,
  },
  {
    id: "diagnostic_electricite",
    name: "Diagnostic Électricité",
    type: "diagnostic",
    required: true,
    description: "Obligatoire si installation électrique de plus de 15 ans",
    uploaded: false,
  },
]

const OPTIONAL_DOCUMENTS: PropertyDocument[] = [
  {
    id: "reglement_copropriete",
    name: "Règlement de Copropriété",
    type: "copropriete",
    required: false,
    description: "Pour les biens en copropriété",
    uploaded: false,
  },
  {
    id: "charges_copropriete",
    name: "Relevé des Charges de Copropriété",
    type: "copropriete",
    required: false,
    description: "Détail des charges de copropriété",
    uploaded: false,
  },
  {
    id: "audit_energetique",
    name: "Audit Énergétique",
    type: "energie",
    required: false,
    description: "Obligatoire pour les passoires thermiques (F et G) depuis 2023",
    uploaded: false,
  },
  {
    id: "carnet_entretien",
    name: "Carnet d'Entretien",
    type: "entretien",
    required: false,
    description: "Historique des travaux et entretiens",
    uploaded: false,
  },
]

export function PropertyDocumentsUpload({
  propertyId,
  onDocumentsChange,
  showRequiredOnly = false,
}: PropertyDocumentsUploadProps) {
  const [documents, setDocuments] = useState<PropertyDocument[]>([])
  const [uploadingDocuments, setUploadingDocuments] = useState<Set<string>>(new Set())

  useEffect(() => {
    const allDocuments = showRequiredOnly ? REQUIRED_DOCUMENTS : [...REQUIRED_DOCUMENTS, ...OPTIONAL_DOCUMENTS]

    setDocuments(allDocuments.map((doc) => ({ ...doc })))
  }, [showRequiredOnly])

  const handleDocumentUpload = async (documentId: string, files: string[]) => {
    if (files.length === 0) return

    setUploadingDocuments((prev) => new Set([...prev, documentId]))

    try {
      // Simuler la sauvegarde du document
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setDocuments((prev) =>
        prev.map((doc) => (doc.id === documentId ? { ...doc, uploaded: true, url: files[0] } : doc)),
      )

      toast.success("Document uploadé avec succès")

      // Notifier le parent
      if (onDocumentsChange) {
        const updatedDocs = documents.map((doc) =>
          doc.id === documentId ? { ...doc, uploaded: true, url: files[0] } : doc,
        )
        onDocumentsChange(updatedDocs.filter((doc) => doc.uploaded))
      }
    } catch (error) {
      console.error("Erreur upload document:", error)
      toast.error("Erreur lors de l'upload du document")
    } finally {
      setUploadingDocuments((prev) => {
        const newSet = new Set(prev)
        newSet.delete(documentId)
        return newSet
      })
    }
  }

  const handleDocumentRemove = (documentId: string) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === documentId ? { ...doc, uploaded: false, url: undefined } : doc)),
    )

    if (onDocumentsChange) {
      const updatedDocs = documents
        .map((doc) => (doc.id === documentId ? { ...doc, uploaded: false, url: undefined } : doc))
        .filter((doc) => doc.uploaded)
      onDocumentsChange(updatedDocs)
    }

    toast.success("Document supprimé")
  }

  const requiredDocuments = documents.filter((doc) => doc.required)
  const optionalDocuments = documents.filter((doc) => !doc.required)
  const uploadedRequired = requiredDocuments.filter((doc) => doc.uploaded).length
  const totalRequired = requiredDocuments.length
  const completionPercentage = (uploadedRequired / totalRequired) * 100

  return (
    <div className="space-y-6">
      {/* Indicateur de progression */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Progression des documents
            </span>
            <Badge variant={completionPercentage === 100 ? "default" : "secondary"}>
              {uploadedRequired}/{totalRequired} obligatoires
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Documents obligatoires</span>
              <span>{Math.round(completionPercentage)}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Documents obligatoires */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Documents obligatoires
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {requiredDocuments.map((document) => (
            <div key={document.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium flex items-center">
                    {document.name}
                    {document.uploaded && <Check className="h-4 w-4 ml-2 text-green-600" />}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">{document.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {document.uploaded && (
                    <Button variant="outline" size="sm" onClick={() => handleDocumentRemove(document.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <Badge variant={document.uploaded ? "default" : "secondary"}>
                    {document.uploaded ? "Uploadé" : "Requis"}
                  </Badge>
                </div>
              </div>

              {!document.uploaded && (
                <div className="mt-3">
                  <FileUpload
                    onFilesUploaded={(files) => handleDocumentUpload(document.id, files)}
                    maxFiles={1}
                    acceptedTypes={["application/pdf", "image/*"]}
                    folder={`properties/${propertyId}/documents`}
                    disabled={uploadingDocuments.has(document.id)}
                  />
                  {uploadingDocuments.has(document.id) && (
                    <div className="flex items-center mt-2 text-sm text-gray-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Upload en cours...
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Documents optionnels */}
      {!showRequiredOnly && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-blue-600">
              <FileText className="h-5 w-5 mr-2" />
              Documents optionnels
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {optionalDocuments.map((document) => (
              <div key={document.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium flex items-center">
                      {document.name}
                      {document.uploaded && <Check className="h-4 w-4 ml-2 text-green-600" />}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">{document.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {document.uploaded && (
                      <Button variant="outline" size="sm" onClick={() => handleDocumentRemove(document.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    <Badge variant={document.uploaded ? "default" : "outline"}>
                      {document.uploaded ? "Uploadé" : "Optionnel"}
                    </Badge>
                  </div>
                </div>

                {!document.uploaded && (
                  <div className="mt-3">
                    <FileUpload
                      onFilesUploaded={(files) => handleDocumentUpload(document.id, files)}
                      maxFiles={1}
                      acceptedTypes={["application/pdf", "image/*"]}
                      folder={`properties/${propertyId}/documents`}
                      disabled={uploadingDocuments.has(document.id)}
                    />
                    {uploadingDocuments.has(document.id) && (
                      <div className="flex items-center mt-2 text-sm text-gray-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        Upload en cours...
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Résumé */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="font-semibold mb-2">Statut des documents</h3>
            <div className="flex justify-center space-x-6 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span>{uploadedRequired} documents obligatoires uploadés</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span>{optionalDocuments.filter((doc) => doc.uploaded).length} documents optionnels</span>
              </div>
            </div>
            {completionPercentage === 100 && (
              <div className="mt-3 p-3 bg-green-100 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm font-medium">
                  ✅ Tous les documents obligatoires ont été uploadés !
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
