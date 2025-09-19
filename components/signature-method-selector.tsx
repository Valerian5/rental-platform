"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, Download, Upload, CheckCircle, Clock, AlertCircle, Zap, Crown, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { DocuSignSignatureManager } from "./docusign-signature-manager"
import { premiumFeaturesService } from "@/lib/premium-features-service"

interface SignatureMethodSelectorProps {
  leaseId: string
  leaseStatus: string
  userType: "owner" | "tenant"
  onStatusChange?: (newStatus: string) => void
}

export function SignatureMethodSelector({
  leaseId,
  leaseStatus,
  userType,
  onStatusChange,
}: SignatureMethodSelectorProps) {
  const [isElectronicEnabled, setIsElectronicEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedSignatureMethod, setSelectedSignatureMethod] = useState<"electronic" | "manual_physical" | "manual_remote" | null>(null)

  useEffect(() => {
    checkPremiumFeatures()
  }, [])

  // Charger la méthode de signature depuis le statut du bail
  useEffect(() => {
    const loadSignatureMethod = async () => {
      if (leaseStatus === "sent_to_tenant" || leaseStatus === "signed_by_tenant") {
        try {
          const response = await fetch(`/api/leases/${leaseId}/signature-status`)
          if (response.ok) {
            const data = await response.json()
            console.log("🔍 [SIGNATURE-METHOD-SELECTOR] API signature-status:", data)
            if (data.lease.signature_method && !selectedSignatureMethod) {
              // Ne définir la méthode que si elle n'est pas déjà définie localement
              console.log("🔍 [SIGNATURE-METHOD-SELECTOR] Méthode depuis API:", data.lease.signature_method)
              setSelectedSignatureMethod(data.lease.signature_method)
            }
          }
        } catch (error) {
          console.error("Erreur chargement méthode signature:", error)
        }
      }
    }
    
    loadSignatureMethod()
  }, [leaseStatus, leaseId])

  const checkPremiumFeatures = async () => {
    try {
      const enabled = await premiumFeaturesService.isElectronicSignatureEnabled()
      setIsElectronicEnabled(enabled)
    } catch (error) {
      console.error("Erreur vérification premium features:", error)
    } finally {
      setLoading(false)
    }
  }

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

      // D'abord uploader le fichier
      const formData = new FormData()
      formData.append("document", selectedFile)
      formData.append("signerType", userType)

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
          userType: userType,
        }),
      })

      if (!workflowResponse.ok) {
        const errorData = await workflowResponse.json()
        throw new Error(errorData.error || "Erreur lors de la signature")
      }

      const data = await workflowResponse.json()
      toast.success("Document signé uploadé avec succès")
      onStatusChange?.(data.status)
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

  const initiateSignature = async (signatureMethod: "electronic" | "manual_physical" | "manual_remote") => {
    try {
      const response = await fetch(`/api/leases/${leaseId}/signature-workflow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "initiate_signature",
          userType: "owner",
          signatureMethod: signatureMethod,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de l'initiation")
      }

      const data = await response.json()
      console.log("🔍 [SIGNATURE-METHOD-SELECTOR] Réponse API:", data)
      toast.success("Processus de signature initié !")
      
      // Stocker la méthode choisie
      const methodToSet = data.signatureMethod || signatureMethod
      console.log("🔍 [SIGNATURE-METHOD-SELECTOR] Méthode à définir:", methodToSet)
      setSelectedSignatureMethod(methodToSet)
      
      // Ne pas changer le statut lors de l'initiation
      // Le statut ne changera que lors de la signature effective
    } catch (error) {
      console.error("Erreur initiation signature:", error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'initiation")
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2">Chargement...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Déterminer l'état actuel et les actions possibles
  const getCurrentState = () => {
    // Si une méthode de signature est sélectionnée, passer en mode signature
    if (selectedSignatureMethod) {
      return {
        showInitiation: false,
        showSignature: true,
        showStatus: false,
      }
    }

    switch (leaseStatus) {
      case "draft":
        return {
          showInitiation: true,
          showSignature: false,
          showStatus: false,
        }
      case "sent_to_tenant":
        return {
          showInitiation: false,
          showSignature: true,
          showStatus: false,
        }
      case "signed_by_tenant":
        return {
          showInitiation: false,
          showSignature: true,
          showStatus: false,
        }
      case "active":
        return {
          showInitiation: false,
          showSignature: false,
          showStatus: true,
        }
      default:
        return {
          showInitiation: true,
          showSignature: false,
          showStatus: false,
        }
    }
  }

  const currentState = getCurrentState()

  // Debug
  console.log("🔍 [SIGNATURE-METHOD-SELECTOR] Debug:", {
    leaseStatus,
    selectedSignatureMethod,
    currentState,
    showInitiation: currentState.showInitiation,
    showSignature: currentState.showSignature,
    showStatus: currentState.showStatus
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Signature du bail
        </CardTitle>
      </CardHeader>
      <CardContent>
        {currentState.showInitiation && (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Le bail est prêt à être signé. Choisissez la méthode de signature.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg text-center">
                <Zap className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-medium mb-2">Signature électronique</h3>
                <p className="text-sm text-gray-600 mb-3">Signez en ligne via DocuSign</p>
                <Button 
                  onClick={() => initiateSignature("electronic")} 
                  disabled={!isElectronicEnabled}
                  className="w-full"
                >
                  {isElectronicEnabled ? "Initier" : "Non disponible"}
                </Button>
              </div>
              
              <div className="p-4 border rounded-lg text-center">
                <FileText className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-medium mb-2">Signature physique</h3>
                <p className="text-sm text-gray-600 mb-3">Lors de la remise des clés</p>
                <Button 
                  onClick={() => initiateSignature("manual_physical")} 
                  variant="outline"
                  className="w-full"
                >
                  Initier
                </Button>
              </div>
              
              <div className="p-4 border rounded-lg text-center">
                <FileText className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <h3 className="font-medium mb-2">Signature à distance</h3>
                <p className="text-sm text-gray-600 mb-3">Téléchargement et upload</p>
                <Button 
                  onClick={() => initiateSignature("manual_remote")} 
                  variant="outline"
                  className="w-full"
                >
                  Initier
                </Button>
              </div>
            </div>
          </div>
        )}

        {currentState.showSignature && (
          <div className="space-y-4">
            {/* Affichage selon la méthode choisie */}
            {selectedSignatureMethod === "electronic" && (
              <div className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Signature électronique</strong> - Le processus de signature électronique a été initié
                  </AlertDescription>
                </Alert>
                <div className="p-4 border rounded-lg bg-gray-50">
                  <p className="text-sm text-gray-600 mb-4">
                    <strong>Debug:</strong> selectedSignatureMethod = {selectedSignatureMethod}, leaseStatus = {leaseStatus}
                  </p>
                  <DocuSignSignatureManager leaseId={leaseId} leaseStatus={leaseStatus} onStatusChange={onStatusChange} />
                </div>
              </div>
            )}

            {selectedSignatureMethod === "manual_physical" && (
              <div className="space-y-4">
                <Alert className="bg-green-50 border-green-200">
                  <FileText className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Signature physique</strong> - Téléchargez le document et signez-le lors de la remise des clés
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <h4 className="font-medium mb-2">1. Télécharger le document</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Téléchargez le bail au format PDF pour l'imprimer et le signer lors de la remise des clés.
                    </p>
                    <Button onClick={downloadDocument} variant="outline" className="w-full bg-transparent">
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger le bail (PDF)
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">2. Uploader le document signé</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Une fois signé lors de la remise des clés, scannez ou photographiez le document et uploadez-le ici.
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

            {selectedSignatureMethod === "manual_remote" && (
              <div className="space-y-4">
                <Alert className="bg-orange-50 border-orange-200">
                  <FileText className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <strong>Signature à distance</strong> - Téléchargez le document, signez-le et uploadez-le
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <h4 className="font-medium mb-2">1. Télécharger le document</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Téléchargez le bail au format PDF pour l'imprimer et le signer.
                    </p>
                    <Button onClick={downloadDocument} variant="outline" className="w-full bg-transparent">
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger le bail (PDF)
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">2. Uploader le document signé</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Une fois signé, scannez ou photographiez le document et uploadez-le ici.
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

            {/* Fallback si aucune méthode n'est sélectionnée */}
            {!selectedSignatureMethod && (
              <div className="text-center py-8">
                <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-orange-500" />
                <h3 className="text-lg font-semibold text-orange-800 mb-2">Méthode de signature non sélectionnée</h3>
                <p className="text-gray-600">Veuillez choisir une méthode de signature ci-dessus.</p>
              </div>
            )}
          </div>
        )}

        {currentState.showStatus && (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-600" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">Bail entièrement signé</h3>
            <p className="text-gray-600">Le bail a été signé par toutes les parties et est maintenant actif.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
