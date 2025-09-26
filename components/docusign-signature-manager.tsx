"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react"

interface DocuSignSignatureManagerProps {
  leaseId: string
  leaseStatus: string
  currentRole: "owner" | "tenant"
  onStatusChange?: (newStatus: string) => void
}

interface SignatureStatus {
  owner: "pending" | "signed" | "declined"
  tenant: "pending" | "signed" | "declined"
}

export function DocuSignSignatureManager({
  leaseId,
  leaseStatus,
  currentRole,
  onStatusChange,
}: DocuSignSignatureManagerProps) {
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [signing, setSigning] = useState(false)
  const [envelopeId, setEnvelopeId] = useState<string | null>(null)
  const [status, setStatus] = useState<SignatureStatus>({
    owner: "pending",
    tenant: "pending",
  })

  useEffect(() => {
    checkSignatureStatus()
  }, [])

  const checkSignatureStatus = async () => {
    try {
      const res = await fetch(`/api/leases/${leaseId}/signature-status`)
      if (!res.ok) throw new Error("Erreur récupération statut")
      const data = await res.json()
      setEnvelopeId(data.envelopeId || null)
      setStatus(data.status || { owner: "pending", tenant: "pending" })
      onStatusChange?.(data.leaseStatus)
    } catch (err) {
      console.error("Erreur statut signature:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSendToDocuSign = async () => {
    try {
      setSending(true)
      const res = await fetch(`/api/leases/${leaseId}/send-to-docusign`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur création enveloppe")

      toast.success("Enveloppe DocuSign créée et envoyée")
      setEnvelopeId(data.envelopeId)
      onStatusChange?.("sent_to_tenant")
      await checkSignatureStatus()
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "Erreur lors de l’envoi")
    } finally {
      setSending(false)
    }
  }

  const handleSign = async () => {
    try {
      setSigning(true)
      const res = await fetch(
        `/api/leases/${leaseId}/signing-url?role=${currentRole}`,
        { method: "GET" }
      )
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || "Erreur génération URL")
      window.open(data.url, "_blank")
    } catch (err) {
      console.error(err)
      toast.error("Impossible d’ouvrir la signature DocuSign")
    } finally {
      setSigning(false)
    }
  }

  const renderStatus = (role: "owner" | "tenant") => {
    const value = status[role]
    if (value === "signed") {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-4 w-4" /> Signé
        </div>
      )
    }
    if (value === "declined") {
      return (
        <div className="flex items-center gap-2 text-red-600">
          <XCircle className="h-4 w-4" /> Refusé
        </div>
      )
    }
    return (
      <div className="flex items-center gap-2 text-yellow-600">
        <Clock className="h-4 w-4" /> En attente
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  // Étape 1 : aucune enveloppe encore créée
  if (!envelopeId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Signature DocuSign</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Aucune enveloppe DocuSign n’a encore été créée pour ce bail.
            </AlertDescription>
          </Alert>
          <Button onClick={handleSendToDocuSign} disabled={sending}>
            {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Envoyer pour signature via DocuSign
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Étape 2 : enveloppe existante → affichage des statuts + bouton signer
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center p-4 border rounded-lg">
        <div>
          <p className="font-medium">Bailleur</p>
          {renderStatus("owner")}
        </div>
        {currentRole === "owner" && status.owner === "pending" && (
          <Button onClick={handleSign} disabled={signing}>
            {signing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Signer
          </Button>
        )}
      </div>

      <div className="flex justify-between items-center p-4 border rounded-lg">
        <div>
          <p className="font-medium">Locataire</p>
          {renderStatus("tenant")}
        </div>
        {currentRole === "tenant" && status.tenant === "pending" && (
          <Button onClick={handleSign} disabled={signing}>
            {signing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Signer
          </Button>
        )}
      </div>
    </div>
  )
}
