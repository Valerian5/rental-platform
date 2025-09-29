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
  XCircle,
  Mail,
  Home,
  Upload,
  RefreshCw,
} from "lucide-react"
import { LeaseDocumentDisplay } from "@/components/lease-document-display"
import { PropertyDocumentsManager } from "@/components/property-documents-manager"
import { SignatureMethodSelector } from "@/components/signature-method-selector"
import { CautionnementSection } from "@/components/CautionnementSection"
import { EtatDesLieuxSection } from "@/components/EtatDesLieuxSection"
import { toast } from "sonner"
import { Lease as LeaseType, LeaseStatus, LEASE_STATUS_CONFIG, leaseStatusUtils } from "@/lib/lease-types"

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
  bailleur_adresse?: string
  
  /** Informations de la propriété */
  property?: {
    id: string
    rooms: number
    bedrooms: number
    surface: number
    address: string
    city: string
    postal_code: string
  }
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
      
      // Si les informations de la propriété ne sont pas incluses, les récupérer
      if (data.lease && !data.lease.property) {
        const propertyResponse = await fetch(`/api/properties/${data.lease.property_id}`)
        if (propertyResponse.ok) {
          const propertyData = await propertyResponse.json()
          data.lease.property = propertyData.property
        }
      }
      
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

  const downloadLeaseDocument = async () => {
    try {
      const response = await fetch(`/api/leases/${leaseId}/download-document`)
      if (!response.ok) throw new Error("Erreur téléchargement")

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

    } catch (error) {
      console.error("Erreur téléchargement:", error)
      toast.error("Erreur lors du téléchargement")
    }
  }

  const downloadSignedDocument = async () => {
    try {
      if (!lease?.signed_document) {
        toast.error("Aucun document signé disponible")
        return
      }

      // Télécharger le document signé depuis Supabase Storage
      const response = await fetch(`/api/leases/${leaseId}/download-signed-document`)
      if (!response.ok) throw new Error("Erreur téléchargement")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `bail-signe-${leaseId}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Erreur téléchargement document signé:", error)
      toast.error("Erreur lors du téléchargement du document signé")
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
    [signatureStatus],
  )
  const tenantRecipient = useMemo(
    () => signatureStatus?.recipients?.find((r) => r.role?.toLowerCase() === "tenant"),
    [signatureStatus],
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
    const config = LEASE_STATUS_CONFIG[status as keyof typeof LEASE_STATUS_CONFIG]
    
    if (!config) {
        return {
        badge: <Badge variant="outline">{status}</Badge>,
        description: "Statut inconnu",
          color: "gray",
        }
    }

    // Mapping des icônes selon le statut
    const getIcon = (status: string) => {
      switch (status) {
        case "draft": return <Clock className="h-3 w-3 mr-1" />
        case "sent_to_tenant": return <Send className="h-3 w-3 mr-1" />
        case "signed_by_tenant": return <AlertCircle className="h-3 w-3 mr-1" />
        case "signed_by_owner": return <AlertCircle className="h-3 w-3 mr-1" />
        case "active": return <CheckCircle className="h-3 w-3 mr-1" />
        case "expired": return <XCircle className="h-3 w-3 mr-1" />
        case "terminated": return <XCircle className="h-3 w-3 mr-1" />
        case "renewed": return <RefreshCw className="h-3 w-3 mr-1" />
        default: return null
      }
    }

        return {
          badge: (
        <Badge className={config.color}>
          {getIcon(status)}
          {config.label}
            </Badge>
          ),
      description: config.description,
      color: config.color.includes("green") ? "green" : 
             config.color.includes("blue") ? "blue" : 
             config.color.includes("orange") ? "orange" : 
             config.color.includes("red") ? "red" : "gray",
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
                <Button variant="outline" onClick={downloadLeaseDocument}>
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
            <TabsTrigger value="bail">Bail</TabsTrigger>
            <TabsTrigger value="cautionnement">Acte de cautionnement</TabsTrigger>
            <TabsTrigger value="etat-des-lieux">État des lieux</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
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

          <TabsContent value="bail" className="space-y-6">
            {/* Section Document du bail */}
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

            {/* Bouton de téléchargement du bail signé quand les deux signatures sont présentes */}
            {ownerIsSigned && tenantIsSigned && (
              <div>
                <Button variant="outline" asChild>
                  <a href={`/api/leases/${leaseId}/download-signed-document`} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" /> Télécharger le bail signé
                  </a>
                </Button>
              </div>
            )}

          {/* Section Signatures */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Signatures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SignatureMethodSelector
              leaseId={lease.id}
              leaseStatus={lease.status}
              userType="owner"
              onStatusChange={(newStatus) => {
                setLease((prev) => (prev ? { ...prev, status: newStatus } : null))
              }}
            />
          </CardContent>
        </Card>
          </TabsContent>


          <TabsContent value="cautionnement" className="space-y-6">
            <CautionnementSection
              leaseId={lease.id}
              leaseData={{
                locataire_nom_prenom: lease.locataire_nom_prenom,
                bailleur_nom_prenom: lease.bailleur_nom_prenom,
                bailleur_adresse: lease.bailleur_adresse || "",
                adresse_logement: lease.adresse_logement,
                montant_loyer_mensuel: lease.montant_loyer_mensuel,
                date_prise_effet: lease.date_prise_effet,
                duree_contrat: lease.duree_contrat,
              }}
            />
          </TabsContent>

          <TabsContent value="etat-des-lieux" className="space-y-6">
            <EtatDesLieuxSection
              leaseId={lease.id}
              propertyId={lease.property_id}
              propertyData={lease.property}
              leaseData={{
                locataire_nom_prenom: lease.locataire_nom_prenom,
                bailleur_nom_prenom: lease.bailleur_nom_prenom,
                adresse_logement: lease.adresse_logement,
                date_prise_effet: lease.date_prise_effet,
              }}
            />
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            {/* Utilise le même composant que la page properties pour la cohérence */}
            {lease && <PropertyDocumentsManager propertyId={lease.property_id} />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
