"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, Download, Upload, CheckCircle, Clock, AlertCircle, Zap, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface TenantSignatureMethodSelectorProps {
  leaseId: string
  leaseStatus: string
  onStatusChange?: (newStatus: string) => void
}

export function TenantSignatureMethodSelector({
  leaseId,
  leaseStatus,
  onStatusChange,
}: TenantSignatureMethodSelectorProps) {
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Seuls les fichiers PDF sont acceptés")
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        // 10MB
        toast.error("Le fichier ne peut pas dépasser 10MB")
        return
      }
      setSelectedFile(file)
    }
  }

  const handleUploadSignedDocument = async () => {
    if (!selectedFile) {
      toast.error("Veuillez sélectionner un fichier")
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append("file", selectedFile)

      // D'abord uploader le fichier
      const uploadResponse = await fetch(`/api/leases/${leaseId}/upload-signed-document`, {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || "Erreur lors de l'upload")
      }

      // Ensuite notifier le workflow de signature
      const workflowResponse = await fetch(`/api/leases/${leaseId}/signature-workflow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "upload_manual_signature",
          userType: "tenant",
        }),
      })

      if (!workflowResponse.ok) {
        const errorData = await workflowResponse.json()
        throw new Error(errorData.error || "Erreur lors de la signature")
      }

      const data = await workflowResponse.json()
      toast.success("Document signé uploadé avec succès !")
      
      // Mettre à jour le statut
      if (onStatusChange) {
        onStatusChange(data.status || "signed_by_tenant")
      }
      
      setSelectedFile(null)
      // Reset file input
      const fileInput = document.getElementById("signed-document-upload") as HTMLInputElement
      if (fileInput) fileInput.value = ""
    } catch (error) {
      console.error("Erreur upload:", error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'upload")
    } finally {
      setUploading(false)
    }
  }

  const downloadDocument = async () => {
    try {
      const response = await fetch(`/api/leases/${leaseId}/generate-pdf`, {
        method: "POST",
      })

      if (response.ok) {
        const htmlContent = await response.text()
        
        // Ouvrir dans une nouvelle fenêtre pour impression PDF
        const printWindow = window.open('', '_blank')
        if (!printWindow) {
          throw new Error('Impossible d\'ouvrir une nouvelle fenêtre')
        }

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Bail ${leaseId.slice(0, 8)}</title>
            <style>
              @media print {
                @page { size: A4; margin: 1cm; }
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              }
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
            </style>
          </head>
          <body>${htmlContent}</body>
          </html>
        `)

        printWindow.document.close()
        
        // Attendre le chargement et déclencher l'impression
        setTimeout(() => {
          printWindow.print()
          printWindow.addEventListener('afterprint', () => printWindow.close())
        }, 1000)

      } else {
        throw new Error("Erreur lors de la génération du PDF")
      }
    } catch (error) {
      console.error("Erreur téléchargement:", error)
      toast.error("Erreur lors du téléchargement")
    }
  }

  const signElectronically = async () => {
    try {
      const response = await fetch(`/api/leases/${leaseId}/signature-workflow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "sign_electronically",
          userType: "tenant",
          signatureData: "Signature électronique",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de la signature")
      }

      const data = await response.json()
      toast.success("Bail signé électroniquement !")
      
      if (onStatusChange) {
        onStatusChange(data.status || "signed_by_tenant")
      }
    } catch (error) {
      console.error("Erreur signature électronique:", error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de la signature")
    }
  }

  // Déterminer l'état actuel et les actions possibles
  const getCurrentState = () => {
    switch (leaseStatus) {
      case "sent_to_tenant":
        return {
          title: "Signature requise",
          description: "Le propriétaire vous a envoyé le bail à signer",
          canSignElectronically: true,
          canSignManually: true,
          showDownload: true,
        }
      case "signed_by_tenant":
        return {
          title: "En attente du propriétaire",
          description: "Vous avez signé le bail, en attente de la signature du propriétaire",
          canSignElectronically: false,
          canSignManually: false,
          showDownload: true,
        }
      case "active":
        return {
          title: "Bail signé",
          description: "Le bail a été signé par toutes les parties",
          canSignElectronically: false,
          canSignManually: false,
          showDownload: true,
        }
      default:
        return {
          title: "Signature non disponible",
          description: "Le bail n'est pas encore prêt à être signé",
          canSignElectronically: false,
          canSignManually: false,
          showDownload: false,
        }
    }
  }

  const currentState = getCurrentState()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Signature du bail
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Alert className={leaseStatus === "sent_to_tenant" ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>{currentState.title}</strong> - {currentState.description}
            </AlertDescription>
          </Alert>

          {currentState.showDownload && (
            <div className="p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium mb-2">Télécharger le document</h4>
              <p className="text-sm text-gray-600 mb-3">
                Téléchargez le bail au format PDF pour le consulter.
              </p>
              <Button onClick={downloadDocument} variant="outline" className="w-full bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Télécharger le bail (PDF)
              </Button>
            </div>
          )}

          {leaseStatus === "sent_to_tenant" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Signature électronique */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="h-5 w-5 text-blue-600" />
                    <h4 className="font-medium">Signature électronique</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Signez le bail directement en ligne de manière sécurisée.
                  </p>
                  <Button onClick={signElectronically} className="w-full">
                    <Zap className="h-4 w-4 mr-2" />
                    Signer électroniquement
                  </Button>
                </div>

                {/* Signature manuelle */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-5 w-5 text-green-600" />
                    <h4 className="font-medium">Signature manuelle</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Téléchargez, imprimez, signez et uploadez le document.
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="signed-document-upload">Document signé (PDF uniquement)</Label>
                      <Input
                        id="signed-document-upload"
                        type="file"
                        accept=".pdf"
                        onChange={handleFileSelect}
                        className="mt-1"
                      />
                    </div>

                    {selectedFile && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Fichier sélectionné :</strong> {selectedFile.name}
                        </p>
                      </div>
                    )}

                    <Button 
                      onClick={handleUploadSignedDocument} 
                      disabled={!selectedFile || uploading}
                      className="w-full"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Upload en cours...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Uploader le document signé
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {leaseStatus === "signed_by_tenant" && (
            <div className="text-center py-6">
              <Clock className="h-12 w-12 mx-auto mb-3 text-orange-500" />
              <h3 className="text-lg font-semibold text-orange-800 mb-2">En attente du propriétaire</h3>
              <p className="text-gray-600">
                Vous avez signé le bail. Le propriétaire doit maintenant le signer pour finaliser le processus.
              </p>
            </div>
          )}

          {leaseStatus === "active" && (
            <div className="text-center py-6">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">Bail entièrement signé</h3>
              <p className="text-gray-600">
                Le bail a été signé par toutes les parties et est maintenant actif.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}