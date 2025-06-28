"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { File, Eye, Download, Upload, AlertCircle, CheckCircle, Calendar, FileText, X } from "lucide-react"
import { toast } from "sonner"

interface LeaseDocument {
  id: string
  document_name: string
  document_type: string
  file_url: string
  file_size: number
  uploaded_at: string
  is_required: boolean
}

interface LeaseDocumentsManagerProps {
  formData: any
  onDocumentsChange: (documents: File[]) => void
  onAnnexesChange: (annexes: Record<string, boolean>) => void
}

const REQUIRED_LEASE_DOCUMENTS = {
  dpe: {
    name: "Diagnostic de performance énergétique (DPE)",
    description: "Obligatoire pour tous les logements",
    required: true,
    annexeKey: "annexe_dpe",
  },
  risques: {
    name: "État des risques et pollutions",
    description: "Obligatoire selon la zone géographique",
    required: true,
    annexeKey: "annexe_risques",
  },
  notice: {
    name: "Notice d'information",
    description: "Information sur les droits et obligations",
    required: true,
    annexeKey: "annexe_notice",
  },
  etat_lieux: {
    name: "État des lieux d'entrée",
    description: "Constat de l'état du logement",
    required: false,
    annexeKey: "annexe_etat_lieux",
  },
  reglement: {
    name: "Règlement de copropriété",
    description: "Si logement en copropriété",
    required: false,
    annexeKey: "annexe_reglement",
  },
  plomb: {
    name: "Constat de risque d'exposition au plomb",
    description: "Pour logements construits avant 1949",
    required: false,
    annexeKey: "annexe_plomb",
  },
  amiante: {
    name: "État amiante",
    description: "Pour logements construits avant 1997",
    required: false,
    annexeKey: "annexe_amiante",
  },
  electricite_gaz: {
    name: "État installation électricité/gaz",
    description: "Pour installations de plus de 15 ans",
    required: false,
    annexeKey: "annexe_electricite_gaz",
  },
}

export function LeaseDocumentsManager({ formData, onDocumentsChange, onAnnexesChange }: LeaseDocumentsManagerProps) {
  const [documents, setDocuments] = useState<LeaseDocument[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)

  // Calculer les statistiques
  const requiredDocs = Object.entries(REQUIRED_LEASE_DOCUMENTS).filter(([_, info]) => info.required)
  const uploadedRequiredDocs = requiredDocs.filter(([key]) =>
    documents.some((doc) => doc.document_type === key || uploadedFiles.some((file) => file.name.includes(key))),
  )
  const completionRate = Math.round((uploadedRequiredDocs.length / requiredDocs.length) * 100)

  const handleFileUpload = (documentType: string, file: File) => {
    const newFiles = [...uploadedFiles, file]
    setUploadedFiles(newFiles)
    onDocumentsChange(newFiles)

    // Activer automatiquement l'annexe correspondante
    const docInfo = REQUIRED_LEASE_DOCUMENTS[documentType as keyof typeof REQUIRED_LEASE_DOCUMENTS]
    if (docInfo?.annexeKey) {
      onAnnexesChange({
        ...getAnnexesState(),
        [docInfo.annexeKey]: true,
      })
    }

    toast.success(`Document ${docInfo?.name || documentType} ajouté`)
  }

  const handleRemoveFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index)
    setUploadedFiles(newFiles)
    onDocumentsChange(newFiles)
  }

  const getAnnexesState = () => {
    const annexes: Record<string, boolean> = {}
    Object.values(REQUIRED_LEASE_DOCUMENTS).forEach((doc) => {
      if (doc.annexeKey) {
        annexes[doc.annexeKey] = formData[doc.annexeKey] || false
      }
    })
    return annexes
  }

  const handleAnnexeToggle = (annexeKey: string, checked: boolean) => {
    onAnnexesChange({
      ...getAnnexesState(),
      [annexeKey]: checked,
    })
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
                <p className="text-2xl font-bold">{uploadedFiles.length + documents.length}</p>
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
                  {uploadedRequiredDocs.length}/{requiredDocs.length}
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
                  {uploadedFiles.length > 0
                    ? new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })
                    : "-"}
                </p>
                <p className="text-sm text-gray-600">Dernier ajout</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents par catégorie */}
      <div className="space-y-4">
        {Object.entries(REQUIRED_LEASE_DOCUMENTS).map(([docType, info]) => {
          const hasDocument =
            documents.some((doc) => doc.document_type === docType) ||
            uploadedFiles.some((file) => file.name.toLowerCase().includes(docType))
          const isAnnexeActive = formData[info.annexeKey] || false

          return (
            <Card key={docType}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        hasDocument ? "bg-green-100" : info.required ? "bg-red-100" : "bg-gray-100"
                      }`}
                    >
                      {hasDocument ? (
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
                  <div className="flex items-center gap-3">
                    {info.required && (
                      <Badge variant={hasDocument ? "default" : "destructive"}>
                        {hasDocument ? "✓ Obligatoire" : "Obligatoire"}
                      </Badge>
                    )}
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`annexe-${docType}`} className="text-sm">
                        Annexer
                      </Label>
                      <Switch
                        id={`annexe-${docType}`}
                        checked={isAnnexeActive}
                        onCheckedChange={(checked) => handleAnnexeToggle(info.annexeKey, checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {/* Documents existants */}
                {documents
                  .filter((doc) => doc.document_type === docType)
                  .map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg mb-2">
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
                        <Button variant="outline" size="sm" onClick={() => window.open(doc.file_url, "_blank")}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement("a")
                            link.href = doc.file_url
                            link.download = doc.document_name
                            link.click()
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                {/* Fichiers uploadés */}
                {uploadedFiles
                  .filter((file) => file.name.toLowerCase().includes(docType))
                  .map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg mb-2 bg-blue-50"
                    >
                      <div className="flex items-center gap-3">
                        <File className="h-8 w-8 text-blue-500" />
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                            <span>Nouveau fichier</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleRemoveFile(uploadedFiles.indexOf(file))}>
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}

                {/* Zone d'upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <Label htmlFor={`upload-${docType}`} className="cursor-pointer">
                    <span className="text-sm font-medium text-gray-900">
                      Cliquez pour ajouter {info.name.toLowerCase()}
                    </span>
                    <span className="block text-xs text-gray-500 mt-1">PDF, JPG, PNG jusqu'à 10MB</span>
                  </Label>
                  <Input
                    id={`upload-${docType}`}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleFileUpload(docType, file)
                        e.target.value = ""
                      }
                    }}
                    className="hidden"
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Résumé des annexes */}
      <Card>
        <CardHeader>
          <CardTitle>Résumé des annexes au contrat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(REQUIRED_LEASE_DOCUMENTS).map(([docType, info]) => (
              <div key={docType} className="flex items-center justify-between p-2 rounded border">
                <span className="text-sm">{info.name}</span>
                <Badge variant={formData[info.annexeKey] ? "default" : "secondary"}>
                  {formData[info.annexeKey] ? "Inclus" : "Non inclus"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alerte de complétude */}
      {completionRate < 100 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Il manque {requiredDocs.length - uploadedRequiredDocs.length} document(s) obligatoire(s) pour finaliser le
            bail.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
