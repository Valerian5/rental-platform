"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Upload, FileText, X, Info, Eye } from "lucide-react"

interface LeaseAnnexesManagerProps {
  leaseId: string
}

interface LeaseAnnex {
  id: string
  lease_id: string
  annex_type: string
  file_name: string
  file_url: string
  file_size: number
  uploaded_at: string
}

const REQUIRED_ANNEXES = [
  { key: "dpe", label: "Diagnostic de Performance Énergétique (DPE)", required: true },
  { key: "risques", label: "État des Risques et Pollutions", required: true },
  { key: "notice", label: "Notice d'information", required: true },
]

const OPTIONAL_ANNEXES = [
  { key: "etat_lieux", label: "État des lieux d'entrée" },
  { key: "reglement", label: "Règlement de copropriété" },
  { key: "plomb", label: "Constat de Risque d'Exposition au Plomb (CREP)" },
  { key: "amiante", label: "Diagnostic Amiante" },
  { key: "electricite_gaz", label: "Diagnostics Électricité et Gaz" },
  { key: "autorisation", label: "Autorisation d'occupation" },
  { key: "references_loyers", label: "Références de loyers" },
]

export function LeaseAnnexesManager({ leaseId }: LeaseAnnexesManagerProps) {
  const [annexes, setAnnexes] = useState<LeaseAnnex[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    loadAnnexes()
  }, [leaseId])

  const loadAnnexes = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/leases/${leaseId}/annexes`)
      const data = await response.json()

      if (data.success) {
        setAnnexes(data.annexes || [])
      } else {
        toast.error("Erreur lors du chargement des annexes")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (files: FileList | null, annexType?: string) => {
    if (!files || files.length === 0) return

    try {
      setUploading(true)
      const file = files[0]

      const formData = new FormData()
      formData.append("file", file)
      formData.append("annexType", annexType || "other")

      const response = await fetch(`/api/leases/${leaseId}/annexes`, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Annexe uploadée avec succès")
        await loadAnnexes()
      } else {
        toast.error(data.error || "Erreur lors de l'upload")
      }
    } catch (error) {
      console.error("Erreur upload:", error)
      toast.error("Erreur lors de l'upload")
    } finally {
      setUploading(false)
    }
  }

  const deleteAnnex = async (annexId: string) => {
    try {
      const response = await fetch(`/api/leases/${leaseId}/annexes/${annexId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Annexe supprimée")
        await loadAnnexes()
      } else {
        toast.error("Erreur lors de la suppression")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la suppression")
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileUpload(e.dataTransfer.files)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getAnnexesByType = (type: string) => {
    return annexes.filter((annex) => annex.annex_type === type)
  }

  const requiredCount = REQUIRED_ANNEXES.filter((annexe) => getAnnexesByType(annexe.key).length > 0).length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Chargement des annexes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Résumé */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Résumé:</strong> {requiredCount}/{REQUIRED_ANNEXES.length} annexes obligatoires, {annexes.length}{" "}
          document(s) au total.
        </AlertDescription>
      </Alert>

      {/* Upload général */}
      <Card>
        <CardHeader>
          <CardTitle>Ajouter des documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600 mb-2">Glissez-déposez vos fichiers ici ou cliquez pour sélectionner</p>
            <Input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
              id="file-upload"
              disabled={uploading}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("file-upload")?.click()}
              disabled={uploading}
            >
              {uploading ? "Upload en cours..." : "Sélectionner des fichiers"}
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Formats acceptés: PDF, DOC, DOCX, JPG, PNG (max 10MB par fichier)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Annexes obligatoires */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Annexes obligatoires</span>
            <Badge variant={requiredCount === REQUIRED_ANNEXES.length ? "default" : "destructive"}>
              {requiredCount}/{REQUIRED_ANNEXES.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {REQUIRED_ANNEXES.map((annexe) => {
              const annexeFiles = getAnnexesByType(annexe.key)
              return (
                <div key={annexe.key} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="font-medium">{annexe.label}</Label>
                    <Badge variant={annexeFiles.length > 0 ? "default" : "destructive"}>
                      {annexeFiles.length > 0 ? "✓ Fourni" : "Manquant"}
                    </Badge>
                  </div>

                  {annexeFiles.length > 0 ? (
                    <div className="space-y-2">
                      {annexeFiles.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium">{file.file_name}</p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(file.file_size)} • {new Date(file.uploaded_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm" onClick={() => window.open(file.file_url, "_blank")}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteAnnex(file.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 border-2 border-dashed border-gray-200 rounded">
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(e.target.files, annexe.key)}
                        className="hidden"
                        id={`upload-${annexe.key}`}
                        disabled={uploading}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById(`upload-${annexe.key}`)?.click()}
                        disabled={uploading}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Ajouter ce document
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Annexes optionnelles */}
      <Card>
        <CardHeader>
          <CardTitle>Annexes optionnelles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {OPTIONAL_ANNEXES.map((annexe) => {
              const annexeFiles = getAnnexesByType(annexe.key)
              return (
                <div key={annexe.key} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="font-medium">{annexe.label}</Label>
                    {annexeFiles.length > 0 && <Badge variant="outline">{annexeFiles.length} document(s)</Badge>}
                  </div>

                  {annexeFiles.length > 0 && (
                    <div className="space-y-2 mb-2">
                      {annexeFiles.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium">{file.file_name}</p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(file.file_size)} • {new Date(file.uploaded_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm" onClick={() => window.open(file.file_url, "_blank")}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteAnnex(file.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-center py-2 border-2 border-dashed border-gray-200 rounded">
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e.target.files, annexe.key)}
                      className="hidden"
                      id={`upload-optional-${annexe.key}`}
                      disabled={uploading}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById(`upload-optional-${annexe.key}`)?.click()}
                      disabled={uploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Ajouter
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Autres documents */}
      {annexes.filter(
        (a) =>
          !REQUIRED_ANNEXES.some((r) => r.key === a.annex_type) &&
          !OPTIONAL_ANNEXES.some((o) => o.key === a.annex_type),
      ).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Autres documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {annexes
                .filter(
                  (a) =>
                    !REQUIRED_ANNEXES.some((r) => r.key === a.annex_type) &&
                    !OPTIONAL_ANNEXES.some((o) => o.key === a.annex_type),
                )
                .map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">{file.file_name}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.file_size)} • {new Date(file.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => window.open(file.file_url, "_blank")}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAnnex(file.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
