"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Download, Upload, CheckCircle, Crown, AlertTriangle, Zap } from "lucide-react"
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

  useEffect(() => {
    checkPremiumFeatures()
  }, [])

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
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `contrat-bail-${leaseId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
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
      toast.success("Processus de signature initié !")
      
      if (onStatusChange) {
        onStatusChange(data.status || "ready_for_signature")
      }
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
          <Tabs defaultValue={isElectronicEnabled ? "electronic" : "manual"} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="electronic" disabled={!isElectronicEnabled}>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Signature électronique
                {isElectronicEnabled && <Crown className="h-3 w-3 text-yellow-500" />}
              </div>
            </TabsTrigger>
            <TabsTrigger value="manual">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Signature manuelle
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="electronic" className="space-y-4">
            {isElectronicEnabled ? (
              <div className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <Crown className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Fonctionnalité Premium</strong> - Signature électronique sécurisée via DocuSign
                  </AlertDescription>
                </Alert>

                <DocuSignSignatureManager leaseId={leaseId} leaseStatus={leaseStatus} onStatusChange={onStatusChange} />
              </div>
            ) : (
              <Alert className="bg-orange-50 border-orange-200">
                <Crown className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>Fonctionnalité Premium</strong> - La signature électronique n'est pas activée. Contactez votre
                  administrateur pour activer cette fonctionnalité.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Téléchargez le document, imprimez-le, signez-le et uploadez la version signée.
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
                    <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-800">
                        {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                  )}

                  <Button onClick={handleUploadSignedDocument} disabled={!selectedFile || uploading} className="w-full">
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

              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>Important :</strong> Assurez-vous que le document est clairement lisible et que toutes les
                  signatures sont visibles.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>
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