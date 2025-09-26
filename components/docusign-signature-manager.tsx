"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, CheckCircle, Clock, RefreshCw, ExternalLink, Building, User } from "lucide-react"
import { toast } from "sonner"

interface DocuSignSignatureManagerProps {
  leaseId: string
  leaseStatus: string
  currentRole: "owner" | "tenant"
  onStatusChange?: (newStatus: string) => void
}

interface SignatureStatus {
  status: string
  ownerSigned: boolean
  tenantSigned: boolean
}

export function DocuSignSignatureManager({
  leaseId,
  leaseStatus,
  currentRole,
  onStatusChange,
}: DocuSignSignatureManagerProps) {
  const [loading, setLoading] = useState(false)
  const [signatureStatus, setSignatureStatus] = useState<SignatureStatus | null>(null)

  const checkSignatureStatus = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/leases/${leaseId}/signature-status`)
      const data = await res.json()

      if (res.ok) {
        const status = {
          status: data.lease.status,
          ownerSigned: data.lease.signed_by_owner,
          tenantSigned: data.lease.signed_by_tenant,
        }
        setSignatureStatus(status)

        if (status.status === "active") {
          toast.success("Toutes les signatures ont été collectées !")
          onStatusChange?.("active")
        }
      }
    } catch (err) {
      console.error("Erreur statut DocuSign:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSign = async (role: "owner" | "tenant") => {
    try {
      const res = await fetch(`/api/leases/${leaseId}/signing-url?role=${role}`)
      const data = await res.json()
      if (res.ok && data.url) {
        window.open(data.url, "_blank")
      } else {
        toast.error(data.error || "Impossible de générer le lien de signature")
      }
    } catch (err) {
      console.error("Erreur génération lien signature:", err)
      toast.error("Erreur lors de la récupération du lien")
    }
  }

  useEffect(() => {
    checkSignatureStatus()
    if (leaseStatus === "sent_to_tenant") {
      const interval = setInterval(checkSignatureStatus, 30000)
      return () => clearInterval(interval)
    }
  }, [leaseStatus])

  if (!signatureStatus) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-gray-500">
          Chargement du statut de signature...
        </CardContent>
      </Card>
    )
  }

  const renderSignerBlock = (
    role: "owner" | "tenant",
    label: string,
    icon: React.ReactNode,
    signed: boolean
  ) => {
    const isCurrentUser = currentRole === role

    return (
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
        {icon}
        <div className="flex-1">
          <p className="font-medium">{label}</p>
          <div className="flex items-center gap-2 mt-1">
            {signed ? (
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
        {isCurrentUser && !signed && (
          <Button size="sm" variant="outline" onClick={() => handleSign(role)}>
            <ExternalLink className="h-4 w-4" />
            <span className="ml-1">Signer</span>
          </Button>
        )}
      </div>
    )
  }

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
        <div className="flex items-center justify-between">
          <span className="font-medium">Statut de l'enveloppe:</span>
          <Badge variant="outline">{signatureStatus.status}</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderSignerBlock("owner", "Bailleur", <Building className="h-5 w-5 text-gray-600" />, signatureStatus.ownerSigned)}
          {renderSignerBlock("tenant", "Locataire", <User className="h-5 w-5 text-gray-600" />, signatureStatus.tenantSigned)}
        </div>

        {signatureStatus.status === "completed" && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Le contrat a été signé par toutes les parties. Le bail est maintenant actif.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
