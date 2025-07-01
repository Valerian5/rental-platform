"use client"

import type React from "react"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, X, Info } from "lucide-react"

interface LeaseDocumentsManagerProps {
  formData: any
  onDocumentsChange: (documents: File[]) => void
  onAnnexesChange: (annexes: Record<string, boolean>) => void
}

const REQUIRED_ANNEXES = [
  { key: "annexe_dpe", label: "Diagnostic de Performance Énergétique (DPE)", required: true },
  { key: "annexe_risques", label: "État des Risques et Pollutions", required: true },
  { key: "annexe_notice", label: "Notice d'information", required: true },
]

const OPTIONAL_ANNEXES = [
  { key: "annexe_etat_lieux", label: "État des lieux d'entrée" },
  { key: "annexe_reglement", label: "Règlement de copropriété" },
  { key: "annexe_plomb", label: "Constat de Risque d'Exposition au Plomb (CREP)" },
  { key: "annexe_amiante", label: "Diagnostic Amiante" },
  { key: "annexe_electricite_gaz", label: "Diagnostics Électricité et Gaz" },
  { key: "annexe_autorisation", label: "Autorisation d'occupation" },
  { key: "annexe_references_loyers", label: "Références de loyers" },
]

export function LeaseDocumentsManager({ formData, onDocumentsChange, onAnnexesChange }: LeaseDocumentsManagerProps) {
  const [dragOver, setDragOver] = useState(false)

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return

    const newFiles = Array.from(files)
    const currentFiles = formData.documents || []
    const updatedFiles = [...currentFiles, ...newFiles]

    onDocumentsChange(updatedFiles)
  }

  const removeFile = (index: number) => {
    const currentFiles = formData.documents || []
    const updatedFiles = currentFiles.filter((_: File, i: number) => i !== index)
    onDocumentsChange(updatedFiles)
  }

  const handleAnnexeChange = (key: string, checked: boolean) => {
    onAnnexesChange({ [key]: checked })
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

  const requiredCount = REQUIRED_ANNEXES.filter((annexe) => formData[annexe.key]).length
  const totalRequired = REQUIRED_ANNEXES.length

  return (
    <div className="space-y-6">
      {/* Annexes obligatoires */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Annexes obligatoires</span>
            <Badge variant={requiredCount === totalRequired ? "default" : "destructive"}>
              {requiredCount}/{totalRequired}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {REQUIRED_ANNEXES.map((annexe) => (
              <div key={annexe.key} className="flex items-center space-x-2">
                <Checkbox
                  id={annexe.key}
                  checked={formData[annexe.key] || false}
                  onCheckedChange={(checked) => handleAnnexeChange(annexe.key, checked as boolean)}
                />
                <Label htmlFor={annexe.key} className="flex-1">
                  {annexe.label}
                  <Badge variant="destructive" className="ml-2 text-xs">
                    Obligatoire
                  </Badge>
                </Label>
              </div>
            ))}
          </div>

          {requiredCount < totalRequired && (
            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Certaines annexes obligatoires ne sont pas cochées. Elles sont requises pour la validité du contrat.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Annexes optionnelles */}
      <Card>
        <CardHeader>
          <CardTitle>Annexes optionnelles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {OPTIONAL_ANNEXES.map((annexe) => (
              <div key={annexe.key} className="flex items-center space-x-2">
                <Checkbox
                  id={annexe.key}
                  checked={formData[annexe.key] || false}
                  onCheckedChange={(checked) => handleAnnexeChange(annexe.key, checked as boolean)}
                />
                <Label htmlFor={annexe.key} className="flex-1">
                  {annexe.label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upload de documents */}
      <Card>
        <CardHeader>
          <CardTitle>Documents complémentaires</CardTitle>
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
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
              id="file-upload"
            />
            <Button type="button" variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>
              Sélectionner des fichiers
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Formats acceptés: PDF, DOC, DOCX, JPG, PNG (max 10MB par fichier)
            </p>
          </div>

          {/* Liste des fichiers uploadés */}
          {formData.documents && formData.documents.length > 0 && (
            <div className="mt-4 space-y-2">
              <Label>Fichiers sélectionnés ({formData.documents.length})</Label>
              <div className="space-y-2">
                {formData.documents.map((file: File, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Résumé */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Résumé:</strong> {requiredCount}/{totalRequired} annexes obligatoires cochées,{" "}
          {OPTIONAL_ANNEXES.filter((annexe) => formData[annexe.key]).length} annexes optionnelles sélectionnées,{" "}
          {formData.documents?.length || 0} document(s) complémentaire(s) ajouté(s).
        </AlertDescription>
      </Alert>
    </div>
  )
}
