"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DocumentPreview } from "./DocumentPreview"
import { CheckCircle, AlertTriangle, FileText, Calendar, User, Euro, Building } from "lucide-react"
import { documentAttemptTracker } from "@/lib/documentAttemptTracker"

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

const DOCUMENT_ICONS = {
  identity: <User className="h-5 w-5" />,
  payslip: <Euro className="h-5 w-5" />,
  rent_receipt: <Building className="h-5 w-5" />,
  tax_notice: <FileText className="h-5 w-5" />,
  bank_statement: <Building className="h-5 w-5" />,
}

const DOCUMENT_DESCRIPTIONS = {
  identity_recto: {
    title: "Recto de votre pièce d'identité",
    checks: [
      "C'est bien VOTRE pièce d'identité",
      "La photo est visible et nette",
      "Toutes les informations sont lisibles",
      "Le document n'est pas expiré",
    ],
  },
  identity_verso: {
    title: "Verso de votre pièce d'identité",
    checks: [
      "C'est bien le VERSO de la même pièce d'identité",
      "Les informations sont lisibles",
      "La signature est visible (si applicable)",
    ],
  },
  payslip: {
    title: "Fiche de paie",
    checks: [
      "C'est bien VOTRE fiche de paie",
      "Le mois correspond à celui demandé",
      "L'employeur est visible",
      "Le salaire net et brut sont lisibles",
    ],
  },
  rent_receipt: {
    title: "Quittance de loyer",
    checks: [
      "C'est bien VOTRE quittance de loyer",
      "Le mois correspond à celui demandé",
      "Le montant du loyer est visible",
      "Le propriétaire/agence est mentionné",
    ],
  },
  tax_notice: {
    title: "Avis d'imposition",
    checks: [
      "C'est bien VOTRE avis d'imposition",
      "L'année correspond (N-1)",
      "Le Revenu Fiscal de Référence est visible",
      "Le QR Code 2DDoc est présent et lisible",
    ],
  },
  bank_statement: {
    title: "Relevé bancaire",
    checks: [
      "C'est bien VOTRE relevé bancaire",
      "Le mois correspond à celui demandé",
      "Votre nom apparaît sur le relevé",
      "Les transactions sont visibles",
    ],
  },
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
  const attempts = documentAttemptTracker.getAttempts(documentType)
  const remainingAttempts = documentAttemptTracker.getRemainingAttempts(documentType)
  const progressiveMessage = documentAttemptTracker.getProgressiveMessage(documentType)
  const lastErrors = documentAttemptTracker.getLastErrors(documentType)

  const documentInfo = DOCUMENT_DESCRIPTIONS[documentType as keyof typeof DOCUMENT_DESCRIPTIONS] || {
    title: documentName,
    checks: ["Vérifiez que le document est correct et lisible"],
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            {DOCUMENT_ICONS[documentType as keyof typeof DOCUMENT_ICONS] || <FileText className="h-5 w-5" />}
            Vérifiez votre document
            {attempts > 0 && (
              <Badge variant="outline" className="ml-2">
                Tentative {attempts + 1}/5
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-full p-6 pt-0 gap-6">
          {/* Preview à gauche */}
          <div className="flex-1">
            <h3 className="font-medium mb-3">Aperçu du document</h3>
            {preUploadUrl && file ? (
              <DocumentPreview fileUrl={preUploadUrl} fileName={file.name} fileType={file.type} className="h-full" />
            ) : (
              <Card className="h-full">
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">Chargement de l'aperçu...</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Instructions à droite */}
          <div className="w-80 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Document demandé
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">{documentInfo.title}</h4>
                  {expectedMonth && (
                    <div className="flex items-center gap-2 mt-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-600">{expectedMonth}</span>
                    </div>
                  )}
                </div>

                <div>
                  <h5 className="font-medium text-sm mb-2">✅ Vérifiez que :</h5>
                  <ul className="space-y-1">
                    {documentInfo.checks.map((check, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">•</span>
                        {check}
                      </li>
                    ))}
                  </ul>
                </div>

                {expectedMonth && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800 text-sm">Important</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Assurez-vous que le document correspond bien au mois de <strong>{expectedMonth}</strong>
                    </p>
                  </div>
                )}

                {attempts > 0 && (
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span className="font-medium text-orange-800 text-sm">
                        Tentatives restantes: {remainingAttempts}
                      </span>
                    </div>
                    {progressiveMessage && <p className="text-sm text-orange-700 mb-2">{progressiveMessage}</p>}
                    {lastErrors.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-orange-800 mb-1">Erreurs précédentes:</p>
                        <ul className="text-sm text-orange-700">
                          {lastErrors.slice(-2).map((error, index) => (
                            <li key={index} className="flex items-start gap-1">
                              <span>•</span>
                              <span>{error}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} disabled={isUploading} className="flex-1 bg-transparent">
                Annuler
              </Button>
              <Button onClick={onConfirm} disabled={isUploading || remainingAttempts === 0} className="flex-1">
                {isUploading ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 animate-spin" />
                    Upload en cours...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Uploader définitivement
                  </>
                )}
              </Button>
            </div>

            {remainingAttempts === 0 && (
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-red-800 text-sm">Document bloqué</span>
                </div>
                <p className="text-sm text-red-700 mt-1">Nombre maximum de tentatives atteint. Contactez le support.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
