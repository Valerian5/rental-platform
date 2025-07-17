"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
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
} from "lucide-react"
import { authService } from "@/lib/auth-service"
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
}

export default function TenantLeaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const leaseId = params.id as string

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [lease, setLease] = useState<Lease | null>(null)
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [acceptTerms, setAcceptTerms] = useState(false)

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

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la signature")
      }

      // Recharger les données du bail
      await loadLease()

      toast.success("Bail signé avec succès !")
    } catch (error) {
      console.error("Erreur signature:", error)
      setError(error instanceof Error ? error.message : "Erreur inconnue")
      toast.error("Erreur lors de la signature")
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
          await loadLease()
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
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement du bail...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !lease) {
    return (
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
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent_to_tenant":
        return (
          <Badge className="bg-blue-600">
            <AlertCircle className="h-3 w-3 mr-1" />À signer
          </Badge>
        )
      case "signed_by_tenant":
        return (
          <Badge className="bg-orange-600">
            <Clock className="h-3 w-3 mr-1" />
            En attente propriétaire
          </Badge>
        )
      case "active":
        return (
          <Badge className="bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Actif
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const canSign = lease.status === "sent_to_tenant" && !lease.signed_by_tenant

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/tenant/leases")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Bail de location</h1>
            <div className="flex items-center gap-2 mt-1">{getStatusBadge(lease.status)}</div>
          </div>
        </div>

        <div className="flex gap-2">
          {lease.generated_document && (
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
          )}
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
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="document">Document</TabsTrigger>
          <TabsTrigger value="signature">Signature</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Informations principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Propriétaire
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{lease.bailleur_nom_prenom}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Logement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{lease.adresse_logement}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Euro className="h-4 w-4" />
                  Loyer mensuel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold text-lg">{lease.montant_loyer_mensuel} €</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date de prise d'effet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{new Date(lease.date_prise_effet).toLocaleDateString("fr-FR")}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Durée
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{lease.duree_contrat}</p>
              </CardContent>
            </Card>
          </div>

          {/* Statut des signatures */}
          <Card>
            <CardHeader>
              <CardTitle>Statut des signatures</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4" />
                    <span className="font-medium">Locataire (vous)</span>
                  </div>
                  {lease.signed_by_tenant ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">
                        Signé le {new Date(lease.tenant_signature_date!).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  ) : (
                    <Badge variant="outline">En attente</Badge>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4" />
                    <span className="font-medium">Propriétaire</span>
                  </div>
                  {lease.signed_by_owner ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">
                        Signé le {new Date(lease.owner_signature_date!).toLocaleDateString("fr-FR")}
                      </span>
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
                <CardTitle>Document du bail</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold">Contrat de bail</h3>
                      <p className="text-sm text-gray-600">
                        Généré le {new Date(lease.document_generated_at!).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded border max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm">{lease.generated_document}</pre>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      Voir en plein écran
                    </Button>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Document non disponible</h3>
                  <p className="text-gray-600">Le document de bail n'est pas encore disponible.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="signature" className="space-y-6">
          {canSign ? (
            <Card>
              <CardHeader>
                <CardTitle>Signature du bail</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Avant de signer</h3>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• Lisez attentivement l'ensemble du contrat</li>
                    <li>• Vérifiez toutes les informations (loyer, charges, durée, etc.)</li>
                    <li>• Assurez-vous de comprendre tous vos droits et obligations</li>
                    <li>• Contactez le propriétaire si vous avez des questions</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="accept-terms"
                      checked={acceptTerms}
                      onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                    />
                    <label
                      htmlFor="accept-terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      J'ai lu et j'accepte les termes de ce contrat de bail
                    </label>
                  </div>

                  <Button
                    onClick={signLease}
                    disabled={!acceptTerms || signing}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    {signing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Signature en cours...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Signer le bail électroniquement
                      </>
                    )}
                  </Button>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : lease.signed_by_tenant ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Bail signé</h3>
                  <p className="text-gray-600 mb-4">
                    Vous avez signé ce bail le {new Date(lease.tenant_signature_date!).toLocaleDateString("fr-FR")}
                  </p>
                  {!lease.signed_by_owner && (
                    <p className="text-sm text-orange-600">En attente de la signature du propriétaire</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Signature non disponible</h3>
                  <p className="text-gray-600">Ce bail n'est pas encore prêt à être signé.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
