"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Send, CheckCircle, Clock, ExternalLink, RefreshCw, User, Building } from "lucide-react"
import { toast } from "sonner"

interface DocuSignSignatureManagerProps {
  leaseId: string
  leaseStatus: string
  onStatusChange?: (newStatus: string) => void
}

interface SignatureStatus {
  status: string
  ownerSigned: boolean
  tenantSigned: boolean
  completedDocument?: Blob
}

export function DocuSignSignatureManager({ leaseId, leaseStatus, onStatusChange }: DocuSignSignatureManagerProps) {
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [signatureStatus, setSignatureStatus] = useState<SignatureStatus | null>(null)
  const [signingUrls, setSigningUrls] = useState<{ owner: string; tenant: string } | null>(null)
  const [hasDocuSignEnvelope, setHasDocuSignEnvelope] = useState(false)

  const sendForDocuSignSignature = async () => {
    try {
      setSending(true)

      // D'abord vérifier si le bail a déjà été envoyé
      const statusResponse = await fetch(`/api/leases/${leaseId}/signature-status`)
      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        if (statusData.lease.docusign_envelope_id) {
          toast.info("Le bail a déjà été envoyé pour signature DocuSign")
          // Récupérer les URLs de signature existantes
          checkSignatureStatus()
          return
        }
      }

      const response = await fetch(`/api/leases/${leaseId}/send-for-docusign`, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi")
      }

      setSigningUrls(data.signingUrls)
      setHasDocuSignEnvelope(true)
      toast.success("Bail envoyé pour signature via DocuSign")
      onStatusChange?.("sent_to_tenant")

      // Commencer à vérifier le statut
      checkSignatureStatus()
    } catch (error) {
      console.error("Erreur envoi DocuSign:", error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'envoi")
    } finally {
      setSending(false)
    }
  }

  const checkSignatureStatus = async () => {
    try {
      setLoading(true)

      const response = await fetch(`/api/leases/${leaseId}/signature-status`)
      const data = await response.json()

      console.log("🔍 [DOCUSIGN-MANAGER] checkSignatureStatus response:", data)

      if (response.ok) {
        // Vérifier si l'enveloppe DocuSign existe
        const hasEnvelope = !!data.lease.docusign_envelope_id
        console.log("🔍 [DOCUSIGN-MANAGER] hasEnvelope:", hasEnvelope, "docusign_envelope_id:", data.lease.docusign_envelope_id)
        setHasDocuSignEnvelope(hasEnvelope)

        // Adapter les données au format attendu
        const signatureStatus = {
          status: data.lease.status,
          ownerSigned: data.lease.signed_by_owner,
          tenantSigned: data.lease.signed_by_tenant,
        }

        console.log("🔍 [DOCUSIGN-MANAGER] signatureStatus:", signatureStatus)
        setSignatureStatus(signatureStatus)

        if (signatureStatus.status === "active") {
          toast.success("Toutes les signatures ont été collectées !")
          onStatusChange?.("active")
        }
      }
    } catch (error) {
      console.error("Erreur vérification statut:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            En attente
          </Badge>
        )
      case "delivered":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
            Livré
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            Terminé
          </Badge>
        )
      case "declined":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700">
            Refusé
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  useEffect(() => {
    // Vérifier le statut au chargement
    checkSignatureStatus()
  }, []) // Seulement au montage du composant

  useEffect(() => {
    if (leaseStatus === "sent_to_tenant") {
      // Vérifier le statut toutes les 30 secondes
      const interval = setInterval(checkSignatureStatus, 30000)
      return () => clearInterval(interval)
    }
  }, [leaseStatus])

  // Ne pas afficher le bouton d'envoi si le statut n'est pas "draft"
  // (le statut "sent_to_tenant" indique qu'une enveloppe DocuSign existe)
  console.log("🔍 [DOCUSIGN-MANAGER] leaseStatus:", leaseStatus, "hasDocuSignEnvelope:", hasDocuSignEnvelope)
  
  if (leaseStatus !== "draft") {
    // Afficher le statut de signature
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Signature DocuSign
            </CardTitle>
            <Button variant="outline" size="sm" onClick={checkSignatureStatus} disabled={loading}>
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              <span>Vérification du statut...</span>
            </div>
          ) : signatureStatus ? (
            <>
              <div className="flex items-center justify-between">
                <span className="font-medium">Statut de l'enveloppe:</span>
                {getStatusBadge(signatureStatus.status)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Building className="h-5 w-5 text-gray-600" />
                  <div className="flex-1">
                    <p className="font-medium">Bailleur</p>
                    <div className="flex items-center gap-2 mt-1">
                      {signatureStatus.ownerSigned ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600">Signé</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm text-yellow-600">En attente</span>
                        </>
                      )}
                    </div>
                  </div>
                  {signingUrls?.owner && !signatureStatus.ownerSigned && (
                    <Button size="sm" variant="outline" onClick={() => window.open(signingUrls.owner, "_blank")}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="h-5 w-5 text-gray-600" />
                  <div className="flex-1">
                    <p className="font-medium">Locataire</p>
                    <div className="flex items-center gap-2 mt-1">
                      {signatureStatus.tenantSigned ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600">Signé</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm text-yellow-600">En attente</span>
                        </>
                      )}
                    </div>
                  </div>
                  {signingUrls?.tenant && !signatureStatus.tenantSigned && (
                    <Button size="sm" variant="outline" onClick={() => window.open(signingUrls.tenant, "_blank")}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {signatureStatus.status === "completed" && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Le contrat a été signé par toutes les parties. Le bail est maintenant actif.
                  </AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <span className="text-sm text-gray-500">Chargement du statut de signature...</span>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Afficher le bouton d'envoi seulement si le statut est "draft" et qu'aucune enveloppe n'existe
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Signature électronique DocuSign
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            Envoyez ce bail pour signature électronique via DocuSign pour une expérience professionnelle et sécurisée.
          </AlertDescription>
        </Alert>

        <Button onClick={sendForDocuSignSignature} disabled={sending} className="w-full">
          {sending ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Envoyer pour signature DocuSign
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}