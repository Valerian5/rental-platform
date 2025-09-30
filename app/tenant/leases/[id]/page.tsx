"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { SignatureMethodSelector } from "@/components/signature-method-selector"
import { Lease as LeaseType, LeaseStatus, LEASE_STATUS_CONFIG, leaseStatusUtils } from "@/lib/lease-types"
import {
  FileText,
  Calendar,
  Euro,
  MapPin,
  User,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowLeft,
  Download,
  Eye,
  Paperclip,
  Home,
  RefreshCw,
} from "lucide-react"
import { authService } from "@/lib/auth-service"
import { TenantEtatDesLieuxSection } from "@/components/TenantEtatDesLieuxSection"
import { toast } from "sonner"

interface Lease {
  id: string
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
  signed_by_tenant: boolean
  signed_by_owner: boolean
  tenant_signature_date?: string
  owner_signature_date?: string
  created_at: string
  updated_at: string
  property_id: string
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

// MODIFIÉ : Interface pour correspondre aux données de la DB + ajout d'un nom lisible
interface Annexe {
  id: string
  name: string // Nom lisible (ex: "Diagnostic de Performance...")
  file_name: string // Nom du fichier (ex: "dpe.pdf")
  file_url: string
  file_size: number
  uploaded_at: string
  annex_type: string // L'identifiant (ex: "dpe")
}

// MODIFIÉ : Ajout du template pour mapper les noms des annexes
const ANNEXES_TEMPLATE = [
  { id: "dpe", name: "Diagnostic de Performance Énergétique (DPE)" },
  { id: "erp", name: "État des Risques et Pollutions (ERP)" },
  { id: "assurance_pno", name: "Assurance Propriétaire Non Occupant (PNO)" },
  { id: "diagnostic_plomb", name: "Diagnostic Plomb (CREP)" },
  { id: "diagnostic_amiante", name: "Diagnostic Amiante" },
  { id: "diagnostic_gaz", name: "Diagnostic Gaz" },
  { id: "diagnostic_electricite", name: "Diagnostic Électricité" },
  { id: "reglement_copropriete", name: "Règlement de Copropriété" },
  { id: "charges_copropriete", name: "Relevé des Charges de Copropriété" },
  { id: "audit_energetique", name: "Audit Énergétique" },
  { id: "carnet_entretien", name: "Carnet d'Entretien" },
]

export default function TenantLeaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const leaseId = params.id as string

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [lease, setLease] = useState<Lease | null>(null)
  const [annexes, setAnnexes] = useState<Annexe[]>([])
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [sendingNotice, setSendingNotice] = useState(false)
  const [lastNotice, setLastNotice] = useState<any>(null)

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

  const loadLastNotice = async () => {
    try {
      const res = await fetch(`/api/leases/${leaseId}/notice`)
      if (res.ok) {
        const data = await res.json()
        setLastNotice(data.notice || null)
      }
    } catch (e) {
      console.error("Erreur chargement préavis:", e)
    }
  }

  // MODIFIÉ : Logique de chargement et de mapping des annexes
  const loadAnnexes = async () => {
    try {
      const response = await fetch(`/api/leases/${leaseId}/annexes`)
      if (response.ok) {
        const data = await response.json()
        const rawAnnexes = data.annexes || []

        // On associe un nom lisible à chaque annexe
        const formattedAnnexes = rawAnnexes.map((annexe: any) => {
          const template = ANNEXES_TEMPLATE.find((t) => t.id === annexe.annex_type)
          return {
            ...annexe,
            name: template ? template.name : annexe.file_name, // Fallback sur le nom du fichier
          }
        })
        setAnnexes(formattedAnnexes)
      }
    } catch (error) {
      console.error("Erreur chargement annexes:", error)
    }
  }

  const signLease = async () => {
    if (!currentUser || !acceptTerms) return

    try {
      setSigning(true)
      setError(null)

      const response = await fetch(`/api/leases/${leaseId}/sign-tenant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantId: currentUser.id,
          signature: "Signature électronique simple",
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          throw new Error("Erreur lors de la signature")
        }
        throw new Error(errorData.error || "Erreur lors de la signature")
      }

      const data = await response.json()
      toast.success("Bail signé avec succès !")
      await loadLease()
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
    const initPage = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "tenant") {
          toast.error("Accès non autorisé")
          router.push("/login")
          return
        }
        setCurrentUser(user)

        if (leaseId) {
          await Promise.all([loadLease(), loadAnnexes(), loadLastNotice()])
        }
      } catch (error) {
        console.error("Erreur initialisation:", error)
        toast.error("Erreur lors du chargement")
      }
    }

    initPage()
  }, [leaseId, router])

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
                <Button onClick={() => router.push("/tenant/leases")}>
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

    // Mapping des icônes selon le statut (vue locataire)
    const getIcon = (status: string) => {
      switch (status) {
        case "draft": return <Clock className="h-3 w-3 mr-1" />
        case "sent_to_tenant": return <AlertCircle className="h-3 w-3 mr-1" />
        case "signed_by_tenant": return <Clock className="h-3 w-3 mr-1" />
        case "signed_by_owner": return <AlertCircle className="h-3 w-3 mr-1" />
        case "active": return <CheckCircle className="h-3 w-3 mr-1" />
        case "expired": return <XCircle className="h-3 w-3 mr-1" />
        case "terminated": return <XCircle className="h-3 w-3 mr-1" />
        case "renewed": return <RefreshCw className="h-3 w-3 mr-1" />
        default: return null
      }
    }

    // Messages personnalisés pour le locataire
    const getDescription = (status: string) => {
      switch (status) {
        case "sent_to_tenant": return "Ce bail est prêt à être signé"
        case "signed_by_tenant": return "Vous avez signé, en attente de la signature du propriétaire"
        case "signed_by_owner": return "Le propriétaire a signé, votre signature est requise"
        case "active": return "Bail signé par les deux parties et actif"
        default: return config.description
      }
    }

    return {
      badge: (
        <Badge className={config.color}>
          {getIcon(status)}
          {config.label}
        </Badge>
      ),
      description: getDescription(status),
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

  const canSign = lease.status === "sent_to_tenant" && !lease.signed_by_tenant
  const statusInfo = getStatusInfo(lease.status)

  const handleSendNotice = async () => {
    if (!currentUser) return
    const confirmed = window.confirm(
      "Confirmez-vous votre demande de congé ? Cette action notifiera le propriétaire et enclenchera le préavis."
    )
    if (!confirmed) return

    try {
      setSendingNotice(true)
      const res = await fetch(`/api/leases/${leaseId}/notice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erreur" }))
        throw new Error(err.error || "Erreur envoi préavis")
      }
      const data = await res.json()
      setLastNotice(data.notice)
      toast.success("Préavis envoyé avec succès")
    } catch (e: any) {
      toast.error(e.message || "Erreur envoi préavis")
    } finally {
      setSendingNotice(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* En-tête amélioré */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push("/tenant/leases")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold">Contrat de bail</h1>
                  {statusInfo.badge}
                  {getLeaseTypeBadge(lease.lease_type)}
                </div>
                <p className="text-gray-600">{statusInfo.description}</p>
              </div>
            </div>

            <div className="flex gap-2">
              {lease.generated_document && (
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger PDF
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Alerte signature */}
        {canSign && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-800">Action requise</h3>
                  <p className="text-blue-700 text-sm">
                    Ce bail est prêt à être signé. Veuillez consulter le document et procéder à la signature.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="document">Bail</TabsTrigger>
            <TabsTrigger value="annexes">Annexes</TabsTrigger>
            <TabsTrigger value="etat-des-lieux">État des lieux</TabsTrigger>
            <TabsTrigger value="notice">Préavis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Informations principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-600">
                    <User className="h-4 w-4" />
                    Propriétaire
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold text-lg">{lease.bailleur_nom_prenom}</p>
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
                  <p className="font-semibold">
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

            {/* Statut des signatures */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Statut des signatures
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-3 w-3 rounded-full ${lease.signed_by_tenant ? "bg-green-500" : "bg-gray-300"}`}
                      ></div>
                      <div>
                        <p className="font-medium">Locataire (vous)</p>
                        <p className="text-sm text-gray-600">{lease.locataire_nom_prenom}</p>
                      </div>
                    </div>
                    {lease.signed_by_tenant ? (
                      <div className="text-right">
                        <Badge className="bg-green-600">Signé</Badge>
                        <p className="text-xs text-gray-600 mt-1">
                          {new Date(lease.tenant_signature_date!).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    ) : (
                      <Badge variant="outline">En attente</Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-3 w-3 rounded-full ${lease.signed_by_owner ? "bg-green-500" : "bg-gray-300"}`}
                      ></div>
                      <div>
                        <p className="font-medium">Propriétaire</p>
                        <p className="text-sm text-gray-600">{lease.bailleur_nom_prenom}</p>
                      </div>
                    </div>
                    {lease.signed_by_owner ? (
                      <div className="text-right">
                        <Badge className="bg-green-600">Signé</Badge>
                        <p className="text-xs text-gray-600 mt-1">
                          {new Date(lease.owner_signature_date!).toLocaleDateString("fr-FR")}
                        </p>
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Document du bail
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Généré le {new Date(lease.document_generated_at!).toLocaleDateString("fr-FR")} à{" "}
                    {new Date(lease.document_generated_at!).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="bg-white border rounded-lg p-6 max-h-96 overflow-y-auto">
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: lease.generated_document.replace(/\n/g, "<br>"),
                      }}
                    />
                  </div>

                  <Separator className="my-4" />

                  <div className="flex gap-2">
                    <Button variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      Voir en plein écran
                    </Button>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8">
                  <div className="text-center">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Document non disponible</h3>
                    <p className="text-gray-600">Le document de bail n'est pas encore disponible.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Section Signature */}
            {lease.generated_document && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Signature du bail
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {lease.status === "active" && lease.signed_by_owner && lease.signed_by_tenant ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="h-5 w-5" />
                        <span>Contrat signé par les deux parties</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div>
                          Propriétaire: <span className="font-medium">{new Date(lease.owner_signature_date!).toLocaleDateString("fr-FR")}</span>
                        </div>
                        <div>
                          Locataire: <span className="font-medium">{new Date(lease.tenant_signature_date!).toLocaleDateString("fr-FR")}</span>
                        </div>
                      </div>
                      <div>
                        <Button variant="outline" asChild>
                          <a href={`/api/leases/${leaseId}/download-signed-document`} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" /> Télécharger le bail signé
                          </a>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <SignatureMethodSelector leaseId={leaseId} userType="tenant" />
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="annexes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Paperclip className="h-5 w-5" />
                  Annexes du bail
                </CardTitle>
              </CardHeader>
              <CardContent>
                {annexes.length > 0 ? (
                  <div className="space-y-3">
                    {annexes.map((annexe) => (
                      <div key={annexe.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-gray-600" />
                          <div>
                            <p className="font-medium">{annexe.name}</p>
                            <p className="text-sm text-gray-600">
                              {(annexe.file_size / 1024).toFixed(1)} KB • Ajouté le{" "}
                              {new Date(annexe.uploaded_at).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                        </div>
                        {/* MODIFIÉ : Le bouton est maintenant un lien fonctionnel */}
                        <Button asChild variant="outline" size="sm">
                          <a
                            href={annexe.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={annexe.file_name}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Paperclip className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Aucune annexe disponible pour ce bail</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="etat-des-lieux" className="space-y-6">
            <TenantEtatDesLieuxSection
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

          <TabsContent value="notice" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Demande de congé (préavis)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {lastNotice ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Préavis envoyé le {new Date(lastNotice.notice_date).toLocaleDateString("fr-FR")} • Départ prévu le {new Date(lastNotice.move_out_date).toLocaleDateString("fr-FR")}
                    </p>
                    <div className="bg-white border rounded p-4 max-h-80 overflow-auto">
                      <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: lastNotice.letter_html }} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Vous pouvez demander votre congé. Un courrier sera généré et envoyé à votre propriétaire.
                    </p>
                    <Button onClick={handleSendNotice} disabled={sendingNotice}>
                      {sendingNotice ? "Envoi..." : "Envoyer mon préavis"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  )
}
