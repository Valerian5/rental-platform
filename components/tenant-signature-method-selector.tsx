"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Download, Upload, CheckCircle, Clock, AlertCircle, Zap, Crown } from "lucide-react"
import { toast } from "sonner"
import { premiumFeaturesService } from "@/lib/premium-features-service"

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
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isElectronicEnabled, setIsElectronicEnabled] = useState(false)

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
      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch(`/api/leases/${leaseId}/upload-signed-document`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de l'upload")
      }

      const data = await response.json()
      toast.success("Document signé uploadé avec succès !")
      
      // Mettre à jour le statut
      if (onStatusChange) {
        onStatusChange("signed_by_tenant")
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

  const signElectronically = async () => {
    try {
      const response = await fetch(`/api/leases/${leaseId}/sign-tenant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantId: "current-user", // Sera récupéré côté serveur
          signature: "Signature électronique",
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
          description: "Vous avez signé, en attente de la signature du propriétaire",
          canSignElectronically: false,
          canSignManually: false,
          showDownload: false,
        }
      case "active":
        return {
          title: "Bail signé",
          description: "Le bail a été signé par les deux parties",
          canSignElectronically: false,
          canSignManually: false,
          showDownload: false,
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
          {/* État actuel */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>{currentState.title}</strong><br />
              {currentState.description}
            </AlertDescription>
          </Alert>

          {/* Actions disponibles */}
          {currentState.canSignElectronically || currentState.canSignManually ? (
            <Tabs defaultValue={isElectronicEnabled ? "electronic" : "manual"} className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="electronic" disabled={!isElectronicEnabled || !currentState.canSignElectronically}>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Signature électronique
                    {isElectronicEnabled && <Crown className="h-3 w-3 text-yellow-500" />}
                  </div>
                </TabsTrigger>
                <TabsTrigger value="manual" disabled={!currentState.canSignManually}>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Signature manuelle
                  </div>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="electronic" className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Signature électronique</h3>
                  <p className="text-blue-700 text-sm mb-4">
                    Signez le bail directement en ligne. Cette méthode est plus rapide et sécurisée.
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={signElectronically} className="bg-blue-600 hover:bg-blue-700">
                      <Zap className="h-4 w-4 mr-2" />
                      Signer électroniquement
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="manual" className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Signature manuelle</h3>
                  <p className="text-gray-700 text-sm mb-4">
                    Téléchargez le document, signez-le physiquement, puis uploadez-le.
                  </p>
                  
                  <div className="space-y-4">
                    {/* Téléchargement */}
                    <div>
                      <Button onClick={downloadDocument} variant="outline" className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger le document à signer
                      </Button>
                    </div>

                    {/* Upload */}
                    <div>
                      <label htmlFor="signed-document-upload" className="block text-sm font-medium text-gray-700 mb-2">
                        Document signé
                      </label>
                      <input
                        id="signed-document-upload"
                        type="file"
                        accept=".pdf"
                        onChange={handleFileSelect}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {selectedFile && (
                        <p className="text-sm text-gray-600 mt-1">
                          Fichier sélectionné : {selectedFile.name}
                        </p>
                      )}
                    </div>

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
              </TabsContent>
            </Tabs>
          ) : currentState.showDownload ? (
            <div className="text-center">
              <Button onClick={downloadDocument} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Télécharger le document
              </Button>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p>Le bail est déjà signé par les deux parties</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
