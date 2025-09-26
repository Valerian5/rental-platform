"use client"

import { useState, useEffect } from "react"
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
  userType: "owner" | "tenant"
}

export function SignatureMethodSelector({ leaseId, userType }: SignatureMethodSelectorProps) {
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
    if (!file) return
    if (file.type !== "application/pdf") {
      toast.error("Seuls les fichiers PDF sont acceptés")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Le fichier ne peut pas dépasser 10MB")
      return
    }
    setSelectedFile(file)
  }

  const handleUploadSignedDocument = async () => {
    if (!selectedFile) {
      toast.error("Veuillez sélectionner un fichier")
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append("document", selectedFile)
      formData.append("signerType", userType)

      const response = await fetch(`/api/leases/${leaseId}/upload-signed-document`, {
        method: "POST",
        body: formData,
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Erreur lors de l'upload")

      toast.success("Document signé uploadé avec succès")
      setSelectedFile(null)
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
      const response = await fetch(`/api/leases/${leaseId}/download-document`)
      if (!response.ok) throw new Error("Erreur téléchargement")
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `bail-${leaseId}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Erreur téléchargement:", error)
      toast.error("Erreur lors du téléchargement")
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2">Chargement...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" /> Signature du bail
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={isElectronicEnabled ? "electronic" : "manual"} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="electronic" disabled={!isElectronicEnabled}>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" /> Signature électronique
                {isElectronicEnabled && <Crown className="h-3 w-3 text-yellow-500" />}
              </div>
            </TabsTrigger>
            <TabsTrigger value="manual">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> Signature manuelle
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="electronic" className="space-y-4">
            {isElectronicEnabled ? (
              <DocuSignSignatureManager leaseId={leaseId} />
            ) : (
              <Alert className="bg-orange-50 border-orange-200">
                <Crown className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  La signature électronique n'est pas activée. Contactez votre administrateur pour l'activer.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Téléchargez le document, signez-le manuellement, puis uploadez-le.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-gray-50">
                <h4 className="font-medium mb-2">1. Télécharger le document</h4>
                <Button onClick={downloadDocument} variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" /> Télécharger le bail (PDF)
                </Button>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">2. Uploader le document signé</h4>
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
                        <Upload className="h-4 w-4 mr-2" /> Uploader le document signé
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  Assurez-vous que le document est lisible et toutes les signatures sont visibles.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
