"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { FileText, Download, Printer, Send, CheckCircle, RefreshCw, Edit } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { authService } from "@/lib/auth-service"

interface Lease {
  id: string
  property_id: string
  tenant_id: string
  owner_id: string
  start_date: string
  end_date: string
  monthly_rent: number
  charges: number
  deposit: number
  lease_type: string
  status: string
  signed_by_owner: boolean
  signed_by_tenant: boolean
  generated_document?: string
  document_generated_at?: string
  property: any
  tenant: any
  owner: any
  metadata?: any
  deposit_amount: number
}

export default function LeaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [lease, setLease] = useState<Lease | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkAuthAndLoadLease()
  }, [params.id])

  const checkAuthAndLoadLease = async () => {
    try {
      const currentUser = await authService.getCurrentUser()
      if (!currentUser) {
        router.push("/login")
        return
      }
      setUser(currentUser)
      await loadLease()
    } catch (error) {
      console.error("Erreur auth:", error)
      router.push("/login")
    }
  }

  const loadLease = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/leases/${params.id}`)
      const data = await response.json()

      if (data.success) {
        setLease(data.lease)
      } else {
        toast.error("Bail non trouvé")
        router.push("/owner/leases")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }

  const generateDocument = async () => {
    try {
      setGenerating(true)
      const response = await fetch(`/api/leases/${params.id}/generate-document`, {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Document généré avec succès")
        await loadLease() // Recharger pour avoir le document
      } else if (data.needsCompletion) {
        toast.info("Certaines données sont manquantes. Redirection vers le formulaire de completion...")
        setTimeout(() => {
          router.push(`/owner/leases/${params.id}/complete-data`)
        }, 1500)
      } else {
        toast.error(data.error || "Erreur lors de la génération")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la génération")
    } finally {
      setGenerating(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    // TODO: Implémenter la génération PDF
    toast.info("Génération PDF en cours de développement")
  }

  const getStatusBadge = (lease: Lease) => {
    if (lease.signed_by_owner && lease.signed_by_tenant) {
      return <Badge className="bg-green-100 text-green-800">Signé par les deux parties</Badge>
    } else if (lease.signed_by_owner) {
      return <Badge className="bg-yellow-100 text-yellow-800">Signé par le propriétaire</Badge>
    } else if (lease.signed_by_tenant) {
      return <Badge className="bg-yellow-100 text-yellow-800">Signé par le locataire</Badge>
    } else {
      return <Badge variant="outline">En attente de signature</Badge>
    }
  }

  const getLeaseTypeLabel = (type: string) => {
    switch (type) {
      case "unfurnished":
        return "Non meublé"
      case "furnished":
        return "Meublé"
      case "commercial":
        return "Commercial"
      default:
        return type
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Chargement du bail...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!lease) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Bail non trouvé</h1>
          <p className="text-gray-600 mt-2">Le bail demandé n'existe pas ou vous n'y avez pas accès.</p>
          <Button className="mt-4" onClick={() => router.push("/owner/leases")}>
            Retour aux baux
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <BreadcrumbNav
        items={[
          { label: "Tableau de bord", href: "/owner/dashboard" },
          { label: "Baux", href: "/owner/leases" },
          { label: `Bail ${lease.property?.title || ""}`, href: `/owner/leases/${lease.id}` },
        ]}
      />

      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title={`Bail - ${lease.property?.title}`}
          description={`Contrat de location ${getLeaseTypeLabel(lease.lease_type)}`}
        />
        <div className="flex gap-2">
          {!lease.generated_document && (
            <Button onClick={generateDocument} disabled={generating}>
              {generating ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
              {generating ? "Génération..." : "Générer le document"}
            </Button>
          )}
          {lease.generated_document && (
            <>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimer
              </Button>
              <Button variant="outline" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline">
                <Send className="h-4 w-4 mr-2" />
                Envoyer
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Statut du bail
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {getStatusBadge(lease)}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Propriétaire</span>
                  {lease.signed_by_owner ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Signé
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-500 border-gray-500">
                      En attente
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Locataire</span>
                  {lease.signed_by_tenant ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Signé
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-500 border-gray-500">
                      En attente
                    </Badge>
                  )}
                </div>
              </div>

              {lease.document_generated_at && (
                <div className="text-xs text-muted-foreground">
                  Document généré le {new Date(lease.document_generated_at).toLocaleDateString("fr-FR")}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Détails du bail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Type</span>
                <span className="text-sm font-medium">{getLeaseTypeLabel(lease.lease_type)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Début</span>
                <span className="text-sm font-medium">{new Date(lease.start_date).toLocaleDateString("fr-FR")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Fin</span>
                <span className="text-sm font-medium">{new Date(lease.end_date).toLocaleDateString("fr-FR")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Loyer</span>
                <span className="text-sm font-medium">{lease.monthly_rent}€/mois</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Charges</span>
                <span className="text-sm font-medium">{lease.charges}€/mois</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Dépôt</span>
                <span className="text-sm font-medium">{lease.deposit_amount}€</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Parties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm">Propriétaire</h4>
                <p className="text-sm text-muted-foreground">
                  {lease.owner?.first_name} {lease.owner?.last_name}
                </p>
                <p className="text-sm text-muted-foreground">{lease.owner?.email}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm">Locataire</h4>
                <p className="text-sm text-muted-foreground">
                  {lease.tenant?.first_name} {lease.tenant?.last_name}
                </p>
                <p className="text-sm text-muted-foreground">{lease.tenant?.email}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Document généré */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document de bail
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lease.generated_document ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Document généré</h3>
                    <Button variant="outline" onClick={() => router.push(`/owner/leases/${lease.id}/complete-data`)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Compléter les données
                    </Button>
                  </div>
                  <div className="bg-white border rounded-lg p-8 print:shadow-none print:border-none">
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: lease.generated_document
                          .replace(/\n/g, "<br>")
                          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                          .replace(/^# (.*$)/gim, "<h1>$1</h1>")
                          .replace(/^## (.*$)/gim, "<h2>$1</h2>")
                          .replace(/^### (.*$)/gim, "<h3>$1</h3>"),
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Document non généré</h3>
                  <p className="text-gray-600 mb-4">
                    Le document de bail n'a pas encore été généré. Cliquez sur "Générer le document" pour créer le
                    contrat.
                  </p>
                  <div className="space-x-2">
                    <Button onClick={generateDocument} disabled={generating}>
                      {generating ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4 mr-2" />
                      )}
                      {generating ? "Génération..." : "Générer le document"}
                    </Button>
                    <Button variant="outline" onClick={() => router.push(`/owner/leases/${lease.id}/complete-data`)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Compléter les données d'abord
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
