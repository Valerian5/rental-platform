"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  Calendar,
  Euro,
  MapPin,
  User,
  Edit,
  Send,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowLeft,
  Download,
  RefreshCcw,
  XCircle,
  Mail,
} from "lucide-react"
import { LeaseDocumentDisplay } from "@/components/lease-document-display"
import { PropertyDocumentsUpload } from "@/components/property-documents-upload"
import { DocuSignSignatureManager } from "@/components/docusign-signature-manager"
import { toast } from "sonner"

/** --- Types DocuSign (statut par signataire) --- */
type RecipientStatus =
  | "created"
  | "sent"
  | "delivered"
  | "completed"
  | "declined"
  | "voided"
  | "autoresponded"
  | "authenticationFailed"
  | string

interface SignatureRecipient {
  role: string // 'owner' | 'tenant' | autre
  name: string
  email: string
  status: RecipientStatus
  completedAt?: string | null
  deliveredAt?: string | null
  declinedAt?: string | null
  declineReason?: string | null
}

interface SignatureStatusPayload {
  envelopeId?: string | null
  recipients: SignatureRecipient[]
  envelopeStatus?: string // e.g. 'completed', 'sent'
  updatedAt?: string
}

/** --- Type Lease existant (on garde et on étend optionnellement) --- */
interface Lease {
  id: string
  property_id: string
  lease_type: string
  status: string
  bailleur_nom_prenom: string
  locataire_nom_prenom: string
  adresse_logement: string
  montant_loyer_mensuel: number
  date_prise_effet: string
  duree_contrat: string
  generated_document?: string
  document_generated_at?: string
  sent_to_tenant_at?: string
  signed_by_owner?: boolean
  signed_by_tenant?: boolean
  owner_signature_date?: string
  tenant_signature_date?: string
  created_at: string
  updated_at: string

  /** Optionnels si votre API / DB les expose déjà */
  docusign_envelope_id?: string | null
}

export default function LeaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const leaseId = params.id as string

  const [lease, setLease] = useState<Lease | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [signing, setSigning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /** --- Nouvel état : statut DocuSign par signataire --- */
  const [sigLoading, setSigLoading] = useState(false)
  const [signatureStatus, setSignatureStatus] = useState<SignatureStatusPayload | null>(null)

  const loadLease = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/leases/${leaseId}`)

      if (!response.ok) {
        throw new Error("Erreur lors du chargement du bail")
      }

      const data = await response.json()
      setLease(data.lease)
    } catch (error) {
      console.error("Erreur:", error)
      setError(error instanceof Error ? error.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  /** --- Récupération du statut de signature DocuSign --- */
  const loadSignatureStatus = async (opts?: { silent?: boolean }) => {
    try {
      if (!opts?.silent) setSigLoading(true)
      const res = await fetch(`/api/leases/${leaseId}/signature-status`)
      if (res.status === 404) {
        // Pas d’enveloppe DocuSign encore créée : on ne spam pas d’erreurs
        setSignatureStatus(null)
        return
      }
      if (!res.ok) {
        throw new Error("Impossible de récupérer le statut de signature")
      }
      const data: SignatureStatusPayload = await res.json()
      setSignatureStatus(data)
    } catch (e) {
      console.error("Erreur statut signature:", e)
      if (!opts?.silent) toast.error(e instanceof Error ? e.message : "Erreur de statut DocuSign")
    } finally {
      if (!opts?.silent) setSigLoading(false)
    }
  }

  const generateDocument = async () => {
    try {
      setGenerating(true)
      setError(null)

      const response = await fetch(`/api/leases/${leaseId}/generate-document`, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.redirectTo) {
          router.push(data.redirectTo)
          return
        }
        throw new Error(data.error || "Erreur lors de la génération")
      }

      toast.success("Document généré avec succès")
      await loadLease()
    } catch (error) {
      console.error("Erreur génération:", error)
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setGenerating(false)
    }
  }

  const sendToTenant = async () => {
    try {
      setSending(true)
      setError(null)

      const response = await fetch(`/api/leases/${leaseId}/send-to-tenant`, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi")
      }

      toast.success("Bail envoyé au locataire avec succès")
      await loadLease()
      await loadSignatureStatus({ silent: true })
    } catch (error) {
      console.error("Erreur envoi:", error)
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setSending(false)
    }
  }

  const signAsOwner = async () => {
    try {
      setSigning(true)
      setError(null)

      const response = await fetch(`/api/leases/${leaseId}/sign-owner`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ownerId: "current-owner-id",
          signature: "Signature électronique simple",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la signature")
      }

      toast.success("Email DocuSign envoyé au propriétaire")
      await loadSignatureStatus({ silent: true })
    } catch (error) {
      console.error("Erreur signature:", error)
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setSigning(false)
    }
  }

  useEffect(() => {
    if (leaseId) {
      // Charge le bail et le statut DocuSign (sans polling pour éviter trop d'appels)
      loadLease()
      loadSignatureStatus({ silent: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaseId])

  /** --- Helpers d'affichage / mapping DocuSign -> UI --- */
  const ownerRecipient = useMemo(
    () => signatureStatus?.recipients?.find((r) => r.role?.toLowerCase() === "owner"),
    [signatureStatus]
  )
  const tenantRecipient = useMemo(
    () => signatureStatus?.recipients?.find((r) => r.role?.toLowerCase() === "tenant"),
    [signatureStatus]
  )

  const ownerIsSigned = useMemo(() => {
    if (ownerRecipient) return ownerRecipient.status?.toLowerCase() === "completed"
    return !!lease?.signed_by_owner
  }, [ownerRecipient, lease])

  const tenantIsSigned = useMemo(() => {
    if (tenantRecipient) return tenantRecipient.status?.toLowerCase() === "completed"
    return !!lease?.signed_by_tenant
  }, [tenantRecipient, lease])

  const ownerSignedAt = useMemo(() => {
    if (ownerRecipient?.completedAt) return ownerRecipient.completedAt
    return lease?.owner_signature_date || null
  }, [ownerRecipient, lease])

  const tenantSignedAt = useMemo(() => {
    if (tenantRecipient?.completedAt) return tenantRecipient.completedAt
    return lease?.tenant_signature_date || null
  }, [tenantRecipient, lease])

  const labelFromStatus = (status?: RecipientStatus) => {
    switch ((status || "").toLowerCase()) {
      case "completed":
        return { label: "Signé", tone: "success" as const, Icon: CheckCircle }
      case "delivered":
        return { label: "Ouvert", tone: "info" as const, Icon: Mail }
      case "sent":
      case "created":
        return { label: "Envoyé", tone: "muted" as const, Icon: Clock }
      case "declined":
        return { label: "Refusé", tone: "danger" as const, Icon: XCircle }
      case "voided":
        return { label: "Annulé", tone: "danger" as const, Icon: XCircle }
      default:
        return { label: "En attente", tone: "muted" as const, Icon: Clock }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement du bail...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !lease) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Erreur</h2>
                <p className="text-gray-600 mb-4">{error || "Bail non trouvé"}</p>
                <Button onClick={() => router.push("/owner/leases")}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour aux baux
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "draft":
        return {
          badge: (
            <Badge variant="outline" className="bg-gray-50">
              <Clock className="h-3 w-3 mr-1" />
              Brouillon
            </Badge>
          ),
          description: "Le bail est en cours de préparation",
          color: "gray",
        }
      case "sent_to_tenant":
        return {
          badge: (
            <Badge className="bg-blue-600">
              <Send className="h-3 w-3 mr-1" />
              Envoyé au locataire
            </Badge>
          ),
          description: "En attente de signature du locataire",
          color: "blue",
        }
      case "signed_by_tenant":
        return {
          badge: (
            <Badge className="bg-orange-600">
              <AlertCircle className="h-3 w-3 mr-1" />
              En attente de votre signature
            </Badge>
          ),
          description: "Le locataire a signé, votre signature est requise",
          color: "orange",
        }
      case "active":
        return {
          badge: (
            <Badge className="bg-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Actif
            </Badge>
          ),
          description: "Bail signé par les deux parties",
          color: "green",
        }
      default:
        return {
          badge: <Badge variant="outline">{status}</Badge>,
          description: "",
          color: "gray",
        }
    }
  }

  const getLeaseTypeBadge = (type: string) => {
    switch (type) {
      case "unfurnished":
        return <Badge variant="secondary">Logement vide</Badge>
      case "furnished":
        return <Badge variant="secondary">Logement meublé</Badge>
      case "commercial":
        return <Badge variant="secondary">Local commercial</Badge>
      default:
        return <Badge variant="secondary">{type}</Badge>
    }
  }

  const statusInfo = getStatusInfo(lease.status)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* En-tête amélioré */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push("/owner/leases")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold">Bail #{lease.id.slice(0, 8)}</h1>
                  {statusInfo.badge}
                  {getLeaseTypeBadge(lease.lease_type)}
                </div>
                <p className="text-gray-600">{statusInfo.description}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push(`/owner/leases/${leaseId}/complete-data`)}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>

              {lease.generated_document && lease.status === "draft" && (
                <Button onClick={sendToTenant} disabled={sending} className="bg-blue-600 hover:bg-blue-700">
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Envoyer au locataire
                    </>
                  )}
                </Button>
              )}

              {(lease.status === "sent_to_tenant" || lease.status === "signed_by_tenant") && !ownerIsSigned && (
                <Button onClick={signAsOwner} disabled={signing} className="bg-green-600 hover:bg-green-700">
                  {signing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Signature...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Signer le bail
                    </>
                  )}
                </Button>
              )}

              {lease.generated_document && (
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="document">Document</TabsTrigger>
            <TabsTrigger value="annexes">Annexes</TabsTrigger>
            <TabsTrigger value="signatures">Signatures</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Informations principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-600">
                    <User className="h-4 w-4" />
                    Propriétaire (Bailleur)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold text-lg">{lease.bailleur_nom_prenom}</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-600">
                    <User className="h-4 w-4" />
                    Locataire
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold text-lg">{lease.locataire_nom_prenom}</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    Adresse du logement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold">{lease.adresse_logement}</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-600">
                    <Euro className="h-4 w-4" />
                    Loyer mensuel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold text-2xl text-green-600">{lease.montant_loyer_mensuel} €</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    Date de prise d'effet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold text-lg">
                    {new Date(lease.date_prise_effet).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    Durée du contrat
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold text-lg">{lease.duree_contrat}</p>
                </CardContent>
              </Card>
            </div>

            {/* Statut des signatures (désormais alimenté par DocuSign si dispo) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Statut des signatures
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Propriétaire */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${ownerIsSigned ? "bg-green-500" : "bg-gray-300"}`}></div>
                      <div>
                        <p className="font-medium">Propriétaire</p>
                        <p className="text-sm text-gray-600">{lease.bailleur_nom_prenom}</p>
                        {ownerRecipient && (
                          <p className="text-xs text-gray-500">
                            {labelFromStatus(ownerRecipient.status).label}
                            {ownerRecipient.email ? ` • ${ownerRecipient.email}` : ""}
                          </p>
                        )}
                      </div>
                    </div>
                    {ownerIsSigned ? (
                      <div className="text-right">
                        <Badge className="bg-green-600">Signé</Badge>
                        {ownerSignedAt && (
                          <p className="text-xs text-gray-600 mt-1">
                            {new Date(ownerSignedAt).toLocaleDateString("fr-FR")}
                          </p>
                        )}
                      </div>
                    ) : (
                      <Badge variant="outline">En attente</Badge>
                    )}
                  </div>

                  {/* Locataire */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${tenantIsSigned ? "bg-green-500" : "bg-gray-300"}`}></div>
                      <div>
                        <p className="font-medium">Locataire</p>
                        <p className="text-sm text-gray-600">{lease.locataire_nom_prenom}</p>
                        {tenantRecipient && (
                          <p className="text-xs text-gray-500">
                            {labelFromStatus(tenantRecipient.status).label}
                            {tenantRecipient.email ? ` • ${tenantRecipient.email}` : ""}
                          </p>
                        )}
                      </div>
                    </div>
                    {tenantIsSigned ? (
                      <div className="text-right">
                        <Badge className="bg-green-600">Signé</Badge>
                        {tenantSignedAt && (
                          <p className="text-xs text-gray-600 mt-1">
                            {new Date(tenantSignedAt).toLocaleDateString("fr-FR")}
                          </p>
                        )}
                      </div>
                    ) : (
                      <Badge variant="outline">En attente</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="document" className="space-y-6">
            {lease.generated_document ? (
              <LeaseDocumentDisplay
                document={lease.generated_document}
                leaseId={lease.id}
                generatedAt={lease.document_generated_at}
              />
            ) : (
              <Card>
                <CardContent className="p-8">
                  <div className="text-center">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Document non généré</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Le document de bail n'a pas encore été généré. Vous devez d'abord compléter toutes les
                      informations nécessaires.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button onClick={generateDocument} disabled={generating} size="lg">
                        {generating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Génération en cours...
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4 mr-2" />
                            Générer le document
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={() => router.push(`/owner/leases/${leaseId}/complete-data`)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Compléter les données
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="annexes" className="space-y-6">
            {/* On passe leaseId + propertyId. Le composant gère le bucket (ex: lease-annexes) côté props/implémentation. */}
            <PropertyDocumentsUpload leaseId={lease.id} propertyId={lease.property_id} />
          </TabsContent>

          <TabsContent value="signatures" className="space-y-6">
            <DocuSignSignatureManager
              leaseId={lease.id}
              leaseStatus={lease.status}
              onStatusChange={(newStatus) => {
                setLease((prev) => (prev ? { ...prev, status: newStatus } : null))
                // on rafraîchit silencieusement l'état DocuSign
                loadSignatureStatus({ silent: true })
              }}
            />

            {/* --- Suivi DocuSign par signataire --- */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Suivi DocuSign</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadSignatureStatus()}
                    disabled={sigLoading}
                    title="Rafraîchir le statut"
                  >
                    {sigLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Actualisation...
                      </>
                    ) : (
                      <>
                        <RefreshCcw className="h-4 w-4 mr-2" />
                        Actualiser
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!signatureStatus ? (
                  <div className="p-4 rounded-lg border bg-gray-50 text-gray-600">
                    Aucune enveloppe DocuSign détectée pour ce bail (encore non envoyée ou en cours de préparation).
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      {signatureStatus.envelopeId && (
                        <span>
                          <span className="font-medium">Enveloppe :</span> {signatureStatus.envelopeId}
                        </span>
                      )}
                      {signatureStatus.envelopeStatus && (
                        <span>
                          <span className="font-medium">Statut :</span> {signatureStatus.envelopeStatus}
                        </span>
                      )}
                      {signatureStatus.updatedAt && (
                        <span>
                          <span className="font-medium">Mis à jour :</span>{" "}
                          {new Date(signatureStatus.updatedAt).toLocaleString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>

                    <div className="space-y-3">
                      {signatureStatus.recipients?.map((r) => {
                        const meta = labelFromStatus(r.status)
                        const Tone =
                          meta.tone === "success"
                            ? "text-green-700 bg-green-50 border-green-200"
                            : meta.tone === "danger"
                            ? "text-red-700 bg-red-50 border-red-200"
                            : meta.tone === "info"
                            ? "text-blue-700 bg-blue-50 border-blue-200"
                            : "text-gray-700 bg-gray-50 border-gray-200"
                        const Icon = meta.Icon
                        return (
                          <div
                            key={`${r.role}-${r.email}`}
                            className={`p-4 rounded-lg border ${Tone} flex items-center justify-between`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="h-5 w-5" />
                              <div>
                                <p className="font-medium capitalize">
                                  {r.role || "signataire"}{" "}
                                  <span className="text-gray-500 normal-case font-normal">{r.email}</span>
                                </p>
                                <p className="text-sm">
                                  Statut : <span className="font-medium">{meta.label}</span>
                                  {r.deliveredAt && (
                                    <>
                                      {" "}
                                      • Ouvert le{" "}
                                      {new Date(r.deliveredAt).toLocaleString("fr-FR", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                      })}
                                    </>
                                  )}
                                  {r.completedAt && (
                                    <>
                                      {" "}
                                      • Signé le{" "}
                                      {new Date(r.completedAt).toLocaleString("fr-FR", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                      })}
                                    </>
                                  )}
                                  {r.status?.toLowerCase() === "declined" && r.declineReason && (
                                    <>
                                      {" "}
                                      • Motif du refus : <span className="italic">{r.declineReason}</span>
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Processus traditionnel (inchangé, mais reflète maintenant l'état calculé) */}
            <Card>
              <CardHeader>
                <CardTitle>Processus de signature traditionnel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Signature du propriétaire
                    </h3>
                    {ownerIsSigned ? (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-green-700 mb-2">
                          <CheckCircle className="h-4 w-4" />
                          <span className="font-medium">Signé</span>
                        </div>
                        {ownerSignedAt && (
                          <p className="text-sm text-gray-600">
                            Signé le{" "}
                            {new Date(ownerSignedAt).toLocaleDateString("fr-FR")} à{" "}
                            {new Date(ownerSignedAt).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 border rounded-lg">
                        <p className="text-gray-600 mb-3">En attente de votre signature</p>
                        {(lease.status === "sent_to_tenant" || lease.status === "signed_by_tenant") && (
                          <Button onClick={signAsOwner} disabled={signing} className="bg-green-600 hover:bg-green-700">
                            {signing ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Signature...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Signer maintenant
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Signature du locataire
                    </h3>
                    {tenantIsSigned ? (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-green-700 mb-2">
                          <CheckCircle className="h-4 w-4" />
                          <span className="font-medium">Signé</span>
                        </div>
                        {tenantSignedAt && (
                          <p className="text-sm text-gray-600">
                            Signé le{" "}
                            {new Date(tenantSignedAt).toLocaleDateString("fr-FR")} à{" "}
                            {new Date(tenantSignedAt).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 border rounded-lg">
                        <p className="text-gray-600">
                          {lease.status === "draft"
                            ? "Le bail doit d'abord être envoyé au locataire"
                            : "En attente de la signature du locataire"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Historique des modifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                    <div className="flex-1">
                      <p className="font-medium">Bail créé</p>
                      <p className="text-sm text-gray-600">
                        {new Date(lease.created_at).toLocaleDateString("fr-FR", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}{" "}
                        à{" "}
                        {new Date(lease.created_at).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {lease.document_generated_at && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                      <div className="flex-1">
                        <p className="font-medium">Document généré</p>
                        <p className="text-sm text-gray-600">
                          {new Date(lease.document_generated_at).toLocaleDateString("fr-FR", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}{" "}
                          à{" "}
                          {new Date(lease.document_generated_at).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  {lease.sent_to_tenant_at && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                      <div className="flex-1">
                        <p className="font-medium">Envoyé au locataire</p>
                        <p className="text-sm text-gray-600">
                          {new Date(lease.sent_to_tenant_at).toLocaleDateString("fr-FR", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}{" "}
                          à{" "}
                          {new Date(lease.sent_to_tenant_at).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  {tenantSignedAt && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                      <div className="flex-1">
                        <p className="font-medium">Signé par le locataire</p>
                        <p className="text-sm text-gray-600">
                          {new Date(tenantSignedAt).toLocaleDateString("fr-FR", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}{" "}
                          à{" "}
                          {new Date(tenantSignedAt).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  {ownerSignedAt && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                      <div className="flex-1">
                        <p className="font-medium">Signé par le propriétaire</p>
                        <p className="text-sm text-gray-600">
                          {new Date(ownerSignedAt).toLocaleDateString("fr-FR", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}{" "}
                          à{" "}
                          {new Date(ownerSignedAt).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                    <div className="flex-1">
                      <p className="font-medium">Dernière modification</p>
                      <p className="text-sm text-gray-600">
                        {new Date(lease.updated_at).toLocaleDateString("fr-FR", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}{" "}
                        à{" "}
                        {new Date(lease.updated_at).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
