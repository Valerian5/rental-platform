"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FileText, Check, AlertTriangle, X } from "lucide-react"
import { FileUpload, UploadedFile } from "@/components/file-upload" // Supposant que FileUpload exporte ce type
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

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
  leaseId: string // MODIFIÉ : Ajout du leaseId pour la DB
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
  leaseId, // MODIFIÉ
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

  // MODIFIÉ : La fonction accepte un objet plus riche pour inclure nom et taille du fichier
  const handleDocumentUpload = async (documentId: string, uploadedFiles: UploadedFile[]) => {
    if (uploadedFiles.length === 0) return

    const uploadedFile = uploadedFiles[0]
    setUploadingDocuments((prev) => new Set([...prev, documentId]))

    try {
      // MODIFIÉ : Structure des données pour correspondre à la table `lease_annexes`
      const annexData = {
        lease_id: leaseId,
        annex_type: documentId,
        file_name: uploadedFile.name,
        file_url: uploadedFile.url,
        file_size: uploadedFile.size,
      }

      console.log("💾 Sauvegarde de l'annexe:", annexData)

      // MODIFIÉ : Insertion dans la table `lease_annexes`
      const { data, error } = await supabase.from("lease_annexes").insert(annexData).select().single()

      if (error) {
        console.error("❌ Erreur sauvegarde annexe:", error)
        throw new Error(`Erreur sauvegarde: ${error.message}`)
      }

      console.log("✅ Annexe sauvegardée avec ID:", data.id)

      setDocuments((prev) =>
        prev.map((doc) => (doc.id === documentId ? { ...doc, uploaded: true, url: uploadedFile.url } : doc)),
      )

      toast.success("Document uploadé avec succès")

      if (onDocumentsChange) {
        const updatedDocs = documents.map((doc) =>
          doc.id === documentId ? { ...doc, uploaded: true, url: uploadedFile.url } : doc,
        )
        onDocumentsChange(updatedDocs.filter((doc) => doc.uploaded))
      }
    } catch (error: any) {
      console.error("❌ Erreur upload document:", error)
      toast.error(`Erreur lors de l'upload: ${error.message || "Erreur inconnue"}`)
    } finally {
      setUploadingDocuments((prev) => {
        const newSet = new Set(prev)
        newSet.delete(documentId)
        return newSet
      })
    }
  }

  const handleDocumentRemove = async (documentId: string) => {
    try {
      // MODIFIÉ : Suppression dans la table `lease_annexes` en utilisant leaseId
      const { error: deleteError } = await supabase
        .from("lease_annexes")
        .delete()
        .eq("lease_id", leaseId)
        .eq("annex_type", documentId)

      if (deleteError) {
        console.warn("⚠️ Erreur suppression DB:", deleteError)
        throw new Error(deleteError.message)
      }

      console.log("✅ Annexe supprimée de la DB")

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
    } catch (error: any) {
      console.error("❌ Erreur suppression:", error)
      toast.error(`Erreur lors de la suppression: ${error.message}`)
    }
  }

  const requiredDocuments = documents.filter((doc) => doc.required)
  const optionalDocuments = documents.filter((doc) => !doc.required)
  const uploadedRequired = requiredDocuments.filter((doc) => doc.uploaded).length
  const totalRequired = requiredDocuments.length
  const completionPercentage = (uploadedRequired / totalRequired) * 100

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Documents du bien (Annexes au bail)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <p className="text-amber-800 text-sm">
              <strong>💡 Information :</strong> Ces documents sont requis pour la validité du bail. Assurez-vous
              de les joindre avant la signature.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Documents obligatoires uploadés</span>
              <span>
                {uploadedRequired}/{totalRequired}
              </span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-orange-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Documents requis pour le bail
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
                    bucket="lease-annexes" // MODIFIÉ : Bucket pour les annexes
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
                      bucket="lease-annexes" // MODIFIÉ : Bucket pour les annexes
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
    </div>
  )
}