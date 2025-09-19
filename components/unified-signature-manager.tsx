"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  FileText, 
  Download, 
  Upload, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Zap, 
  Crown,
  Send,
  User,
  Calendar
} from "lucide-react"
import { toast } from "sonner"
import { premiumFeaturesService } from "@/lib/premium-features-service"
import { SignatureMethodSelector } from "./signature-method-selector"
import { TenantSignatureMethodSelector } from "./tenant-signature-method-selector"

interface UnifiedSignatureManagerProps {
  leaseId: string
  leaseStatus: string
  userType: "owner" | "tenant"
  onStatusChange?: (newStatus: string) => void
  showSignatureSelector?: boolean
  showElectronicSignature?: boolean
  showManualSignature?: boolean
  showDownloadSigned?: boolean
  showStatusDisplay?: boolean
  canSign?: boolean
  canDownload?: boolean
}

export function UnifiedSignatureManager({
  leaseId,
  leaseStatus,
  userType,
  onStatusChange,
  showSignatureSelector = true,
  showElectronicSignature = true,
  showManualSignature = true,
  showDownloadSigned = false,
  showStatusDisplay = false,
  canSign = true,
  canDownload = true,
}: UnifiedSignatureManagerProps) {
  const [loading, setLoading] = useState(true)
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

  // Si c'est un tenant, utiliser le composant spécialisé
  if (userType === "tenant") {
    return (
      <TenantSignatureMethodSelector
        leaseId={leaseId}
        leaseStatus={leaseStatus}
        onStatusChange={onStatusChange}
      />
    )
  }

  // Pour l'owner, utiliser le composant existant mais adapté
  return (
    <SignatureMethodSelector
      leaseId={leaseId}
      leaseStatus={leaseStatus}
      userType={userType}
      onStatusChange={onStatusChange}
    />
  )
}

// Composant pour afficher le statut des signatures (quand le bail est entièrement signé)
export function SignatureStatusDisplay({ 
  leaseId, 
  ownerSigned, 
  tenantSigned, 
  ownerSignatureDate, 
  tenantSignatureDate,
  signedDocument 
}: {
  leaseId: string
  ownerSigned: boolean
  tenantSigned: boolean
  ownerSignatureDate?: string
  tenantSignatureDate?: string
  signedDocument?: string
}) {
  const downloadSignedDocument = async () => {
    try {
      const response = await fetch(`/api/leases/${leaseId}/download-signed-document`)
      if (!response.ok) throw new Error("Erreur téléchargement")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `bail-signe-${leaseId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Erreur téléchargement document signé:", error)
      toast.error("Erreur lors du téléchargement du document signé")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Document signé
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Statut des signatures */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${ownerSigned ? "bg-green-500" : "bg-gray-300"}`}></div>
                <div>
                  <p className="font-medium">Propriétaire</p>
                  <p className="text-sm text-gray-600">Signature requise</p>
                </div>
              </div>
              {ownerSigned ? (
                <div className="text-right">
                  <Badge className="bg-green-600">Signé</Badge>
                  {ownerSignatureDate && (
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(ownerSignatureDate).toLocaleDateString("fr-FR")}
                    </p>
                  )}
                </div>
              ) : (
                <Badge variant="outline">En attente</Badge>
              )}
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${tenantSigned ? "bg-green-500" : "bg-gray-300"}`}></div>
                <div>
                  <p className="font-medium">Locataire</p>
                  <p className="text-sm text-gray-600">Signature requise</p>
                </div>
              </div>
              {tenantSigned ? (
                <div className="text-right">
                  <Badge className="bg-green-600">Signé</Badge>
                  {tenantSignatureDate && (
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(tenantSignatureDate).toLocaleDateString("fr-FR")}
                    </p>
                  )}
                </div>
              ) : (
                <Badge variant="outline">En attente</Badge>
              )}
            </div>
          </div>

          {/* Téléchargement du document signé */}
          {signedDocument && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Bail signé</p>
                    <p className="text-sm text-green-600">
                      Document signé par les deux parties
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={downloadSignedDocument}
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
