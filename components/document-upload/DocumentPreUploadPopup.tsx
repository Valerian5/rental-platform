"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { DocumentPreview } from "./DocumentPreview"
import { CheckCircle, AlertTriangle, Loader2, FileText } from "lucide-react"

interface DocumentPreUploadPopupProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  file: File | null
  preUploadUrl: string | null
  documentType: string
  documentName: string
  expectedMonth?: string
  isUploading?: boolean
}

export function DocumentPreUploadPopup({
  isOpen,
  onClose,
  onConfirm,
  file,
  preUploadUrl,
  documentType,
  documentName,
  expectedMonth,
  isUploading = false,
}: DocumentPreUploadPopupProps) {
  const [checklist, setChecklist] = useState({
    readable: false,
    complete: false,
    correct: false,
    recent: false,
  })

  const getChecklistItems = () => {
    const baseItems = [
      { key: "readable", label: "Le document est lisible et de bonne qualité" },
      { key: "complete", label: "Le document est complet (toutes les pages)" },
    ]

    if (documentType === "payslip") {
      return [
        ...baseItems,
        { key: "correct", label: `C'est bien la fiche de paie de ${expectedMonth}` },
        { key: "recent", label: "Les informations sont à jour" },
      ]
    }

    if (documentType === "rent_receipt") {
      return [
        ...baseItems,
        { key: "correct", label: `C'est bien la quittance de ${expectedMonth}` },
        { key: "recent", label: "Le document est signé par le propriétaire" },
      ]
    }

    if (documentType.startsWith("identity")) {
      return [
        ...baseItems,
        { key: "correct", label: "C'est bien votre pièce d'identité" },
        { key: "recent", label: "La pièce d'identité est en cours de validité" },
      ]
    }

    if (documentType === "tax_notice") {
      return [
        ...baseItems,
        { key: "correct", label: "C'est bien votre avis d'imposition personnel" },
        { key: "recent", label: "L'avis concerne l'année fiscale 2023" },
      ]
    }

    return baseItems
  }

  const checklistItems = getChecklistItems()
  const allChecked = checklistItems.every((item) => checklist[item.key as keyof typeof checklist])

  const handleChecklistChange = (key: string, checked: boolean) => {
    setChecklist((prev) => ({ ...prev, [key]: checked }))
  }

  if (!file || !preUploadUrl) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Vérification avant validation - {documentName}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Preview */}
          <div>
            <h3 className="font-medium mb-3">Aperçu du document</h3>
            <DocumentPreview fileUrl={preUploadUrl} fileName={file.name} fileType={file.type} className="h-96" />
          </div>

          {/* Checklist */}
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-3">Vérifications obligatoires</h3>
              <div className="space-y-3">
                {checklistItems.map((item) => (
                  <div key={item.key} className="flex items-start space-x-3">
                    <Checkbox
                      id={item.key}
                      checked={checklist[item.key as keyof typeof checklist]}
                      onCheckedChange={(checked) => handleChecklistChange(item.key, !!checked)}
                      className="mt-1"
                    />
                    <label htmlFor={item.key} className="text-sm leading-5 cursor-pointer">
                      {item.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {!allChecked && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Veuillez cocher toutes les cases pour confirmer que le document est conforme.
                </AlertDescription>
              </Alert>
            )}

            {allChecked && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Document prêt à être validé ! Cliquez sur "Valider" pour finaliser l'upload.
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Informations du fichier :</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• Nom : {file.name}</p>
                <p>• Taille : {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <p>• Type : {file.type}</p>
                {expectedMonth && <p>• Période : {expectedMonth}</p>}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Annuler
          </Button>
          <Button onClick={onConfirm} disabled={!allChecked || isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Validation en cours...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Valider ce document
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
