"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DocumentPreUploadPopup } from "./DocumentPreUploadPopup"
import { getRequiredMonths, type MonthInfo } from "@/lib/monthCalculator"
import { documentAttemptTracker } from "@/lib/documentAttemptTracker"
import { Upload, CheckCircle, AlertTriangle, Calendar, FileText } from "lucide-react"

interface MonthlyDocumentUploadProps {
  documentType: "payslip" | "rent_receipt"
  documentName: string
  onDocumentValidated: (monthKey: string, documentData: any) => void
  completedMonths: Record<string, any>
}

export function MonthlyDocumentUpload({
  documentType,
  documentName,
  onDocumentValidated,
  completedMonths,
}: MonthlyDocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preUploadUrl, setPreUploadUrl] = useState<string | null>(null)
  const [showPopup, setShowPopup] = useState(false)
  const [currentMonth, setCurrentMonth] = useState<MonthInfo | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const requiredMonths = getRequiredMonths(documentType)

  const handleFileSelect = async (file: File, month: MonthInfo) => {
    if (!documentAttemptTracker.canAttempt(`${documentType}_${month.key}`)) {
      return
    }

    setSelectedFile(file)
    setCurrentMonth(month)

    try {
      // Pré-upload pour preview
      const formData = new FormData()
      formData.append("file", file)
      formData.append("documentType", documentType)
      formData.append("monthKey", month.key)

      const response = await fetch("/api/documents/pre-upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Erreur lors du pré-upload")
      }

      const result = await response.json()
      setPreUploadUrl(result.previewUrl)
      setShowPopup(true)
    } catch (error) {
      console.error("Erreur pré-upload:", error)
      alert("Erreur lors du chargement du fichier")
    }
  }

  const handleConfirmUpload = async () => {
    if (!selectedFile || !currentMonth || !preUploadUrl) return

    setIsUploading(true)

    try {
      // Upload définitif avec validation
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("documentType", documentType)
      formData.append("monthKey", currentMonth.key)
      formData.append("expectedMonth", currentMonth.label)
      formData.append("preUploadUrl", preUploadUrl)

      const response = await fetch("/api/documents/finalize-upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        // Enregistrer l'échec
        documentAttemptTracker.recordAttempt(`${documentType}_${currentMonth.key}`, result.error)
        throw new Error(result.error || "Erreur lors de l'upload")
      }

      // Succès
      documentAttemptTracker.reset(`${documentType}_${currentMonth.key}`)
      onDocumentValidated(currentMonth.key, {
        url: result.url,
        analysis: result.analysis,
        monthInfo: currentMonth,
        uploadedAt: new Date().toISOString(),
      })

      setShowPopup(false)
      setSelectedFile(null)
      setPreUploadUrl(null)
      setCurrentMonth(null)
    } catch (error) {
      console.error("Erreur upload:", error)
      alert(error instanceof Error ? error.message : "Erreur lors de l'upload")
    } finally {
      setIsUploading(false)
    }
  }

  const handleClosePopup = () => {
    setShowPopup(false)
    setSelectedFile(null)
    setPreUploadUrl(null)
    setCurrentMonth(null)
  }

  return (
    <div className="space-y-4">
      {requiredMonths.map((month) => {
        const monthKey = month.key
        const isCompleted = !!completedMonths[monthKey]
        const attempts = documentAttemptTracker.getAttempts(`${documentType}_${monthKey}`)
        const canAttempt = documentAttemptTracker.canAttempt(`${documentType}_${monthKey}`)

        return (
          <Card
            key={monthKey}
            className={`${
              isCompleted
                ? "border-green-500 bg-green-50"
                : !canAttempt
                  ? "border-red-500 bg-red-50"
                  : attempts > 0
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200"
            }`}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {documentName} - {month.label}
                  {isCompleted && (
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Complété
                    </Badge>
                  )}
                  {!canAttempt && (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Bloqué
                    </Badge>
                  )}
                  {attempts > 0 && canAttempt && <Badge variant="outline">Tentative {attempts}/5</Badge>}
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent>
              {isCompleted ? (
                <div className="bg-green-100 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Document validé</span>
                  </div>
                  <div className="text-sm text-green-700">
                    Téléchargé le {new Date(completedMonths[monthKey].uploadedAt).toLocaleDateString("fr-FR")}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 bg-transparent"
                    onClick={() => {
                      // Permettre de remplacer le document
                      const updatedCompleted = { ...completedMonths }
                      delete updatedCompleted[monthKey]
                      onDocumentValidated(monthKey, null) // Signal pour supprimer
                    }}
                  >
                    Remplacer ce document
                  </Button>
                </div>
              ) : !canAttempt ? (
                <div className="bg-red-100 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-800">Document bloqué</span>
                  </div>
                  <p className="text-sm text-red-700">
                    Nombre maximum de tentatives atteint. Contactez le support technique.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {attempts > 0 && (
                    <div className="bg-orange-100 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <span className="font-medium text-orange-800 text-sm">
                          Tentatives restantes:{" "}
                          {documentAttemptTracker.getRemainingAttempts(`${documentType}_${monthKey}`)}
                        </span>
                      </div>
                      <p className="text-sm text-orange-700">
                        {documentAttemptTracker.getProgressiveMessage(`${documentType}_${monthKey}`)}
                      </p>
                    </div>
                  )}

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 mb-3">
                      Sélectionnez votre {documentName.toLowerCase()} de {month.label}
                    </p>
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleFileSelect(file, month)
                        }
                      }}
                      className="hidden"
                      id={`file-${monthKey}`}
                    />
                    <Button variant="outline" size="sm" asChild>
                      <label htmlFor={`file-${monthKey}`} className="cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        Choisir le fichier
                      </label>
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">Formats acceptés : PDF, JPG, PNG (max 10 MB)</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      <DocumentPreUploadPopup
        isOpen={showPopup}
        onClose={handleClosePopup}
        onConfirm={handleConfirmUpload}
        file={selectedFile}
        preUploadUrl={preUploadUrl}
        documentType={documentType}
        documentName={documentName}
        expectedMonth={currentMonth?.label}
        isUploading={isUploading}
      />
    </div>
  )
}
