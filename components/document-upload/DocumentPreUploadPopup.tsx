"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DocumentPreview } from "./DocumentPreview"
import { CheckCircle, AlertTriangle, FileText, Calendar, User, Euro, Home } from "lucide-react"

interface DocumentPreUploadPopupProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  file: File | null
  preUploadUrl: string | null
  documentType: string
  documentName?: string
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
  if (!file || !preUploadUrl) return null

  const getDocumentIcon = () => {
    if (documentType.includes("identity")) return <User className="h-5 w-5" />
    if (documentType === "payslip") return <Euro className="h-5 w-5" />
    if (documentType === "rent_receipt") return <Home className="h-5 w-5" />
    if (documentType === "tax_notice") return <FileText className="h-5 w-5" />
    return <FileText className="h-5 w-5" />
  }

  const getValidationChecklist = () => {
    const checks = []

    if (documentType.includes("identity")) {
      if (documentType.includes("recto")) {
        checks.push(
          { text: "La photo est visible et nette", icon: <CheckCircle className="h-4 w-4" /> },
          { text: "Le nom et prénom sont lisibles", icon: <CheckCircle className="h-4 w-4" /> },
          { text: "La date de naissance est visible", icon: <CheckCircle className="h-4 w-4" /> },
          { text: "Le document n'est pas expiré", icon: <AlertTriangle className="h-4 w-4 text-orange-500" /> },
        )
      } else {
        checks.push(
          { text: "L'adresse est lisible", icon: <CheckCircle className="h-4 w-4" /> },
          { text: "La signature est présente", icon: <CheckCircle className="h-4 w-4" /> },
          { text: "Le numéro de document est visible", icon: <CheckCircle className="h-4 w-4" /> },
        )
      }
    } else if (documentType === "payslip") {
      checks.push(
        { text: `Le mois correspond bien à ${expectedMonth}`, icon: <Calendar className="h-4 w-4 text-blue-500" /> },
        { text: "Le nom de l'employé est visible", icon: <CheckCircle className="h-4 w-4" /> },
        { text: "Le salaire net est clairement indiqué", icon: <Euro className="h-4 w-4 text-green-500" /> },
        { text: "Le nom de l'employeur est présent", icon: <CheckCircle className="h-4 w-4" /> },
        { text: "Toutes les informations sont lisibles", icon: <CheckCircle className="h-4 w-4" /> },
      )
    } else if (documentType === "rent_receipt") {
      checks.push(
        { text: `Le mois correspond bien à ${expectedMonth}`, icon: <Calendar className="h-4 w-4 text-blue-500" /> },
        { text: "Le nom du locataire est visible", icon: <CheckCircle className="h-4 w-4" /> },
        { text: "Le montant du loyer est indiqué", icon: <Euro className="h-4 w-4 text-green-500" /> },
        { text: "Le nom du propriétaire/agence est présent", icon: <CheckCircle className="h-4 w-4" /> },
        { text: "La quittance est signée ou tamponnée", icon: <CheckCircle className="h-4 w-4" /> },
      )
    } else if (documentType === "tax_notice") {
      checks.push(
        { text: "L'avis est de l'année fiscale 2023", icon: <Calendar className="h-4 w-4 text-blue-500" /> },
        { text: "Le QR Code 2DDoc est visible", icon: <AlertTriangle className="h-4 w-4 text-orange-500" /> },
        { text: "Le Revenu Fiscal de Référence est lisible", icon: <Euro className="h-4 w-4 text-green-500" /> },
        { text: "Le nom du contribuable correspond", icon: <CheckCircle className="h-4 w-4" /> },
        { text: "Toutes les pages sont présentes", icon: <CheckCircle className="h-4 w-4" /> },
      )
    }

    return checks
  }

  const validationChecks = getValidationChecklist()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getDocumentIcon()}
            Vérification avant upload - {documentName || documentType}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
          {/* Colonne gauche : Aperçu du document */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Aperçu du document</h3>
            <DocumentPreview fileUrl={preUploadUrl} fileName={file.name} className="h-96" />

            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800">Vérifiez la qualité</p>
                  <p className="text-blue-700">
                    Assurez-vous que le document est net, lisible et complet avant de continuer.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Colonne droite : Liste de vérification */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Points à vérifier</h3>

            <div className="space-y-3">
              {validationChecks.map((check, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  {check.icon}
                  <span className="text-sm text-gray-700">{check.text}</span>
                </div>
              ))}
            </div>

            {expectedMonth && (
              <Alert>
                <Calendar className="h-4 w-4" />
                <AlertDescription>
                  <strong>Mois attendu :</strong> {expectedMonth}
                  <br />
                  Vérifiez bien que le document correspond à cette période.
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 mb-1">Important</p>
                  <p className="text-yellow-700">
                    Une fois uploadé, le document sera analysé automatiquement. Si les informations ne correspondent
                    pas, vous devrez recommencer.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Annuler
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isUploading}>
              Choisir un autre fichier
            </Button>
            <Button onClick={onConfirm} disabled={isUploading}>
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Upload en cours...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmer l'upload
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
