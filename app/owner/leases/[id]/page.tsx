"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  FileText,
  Download,
  Printer,
  ArrowLeft,
  User,
  Home,
  Calendar,
  Euro,
  CheckCircle,
  Clock,
  Edit,
  Send,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { authService } from "@/lib/auth-service"
import { supabase } from "@/lib/supabase"

// Fonction formatCurrency définie localement
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Fonction formatDate définie localement
const formatDate = (dateString?: string): string => {
  if (!dateString) return "Non spécifié"
  try {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  } catch (e) {
    return "Date invalide"
  }
}

export default function LeaseDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [lease, setLease] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  useEffect(() => {
    loadLeaseDetails()
  }, [])

  const loadLeaseDetails = async () => {
    try {
      setLoading(true)

      // Vérifier l'authentification
      const currentUser = await authService.getCurrentUser()
      if (!currentUser) {
        toast.error("Vous devez être connecté")
        router.push("/login")
        return
      }
      setUser(currentUser)

      // Récupérer le token de session
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session?.access_token) {
        toast.error("Session expirée")
        router.push("/login")
        return
      }

      // Charger les détails du bail
      const response = await fetch(`/api/leases?id=${params.id}`, {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      })

      if (!response.ok) {
        toast.error("Erreur lors du chargement du bail")
        return
      }

      const data = await response.json()
      console.log("📋 Bail chargé:", data)

      if (data.leases && data.leases.length > 0) {
        setLease(data.leases[0])
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

  const generatePDF = async () => {
    setIsGeneratingPDF(true)
    try {
      // Simuler la génération PDF pour l'instant
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // TODO: Implémenter la vraie génération PDF
      toast.success("PDF généré avec succès")
    } catch (error) {
      console.error("Erreur génération PDF:", error)
      toast.error("Erreur lors de la génération du PDF")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleSign = async () => {
    try {
      // TODO: Implémenter la signature
      toast.info("Fonctionnalité de signature à implémenter")
    } catch (error) {
      console.error("Erreur signature:", error)
      toast.error("Erreur lors de la signature")
    }
  }

  const sendToTenant = async () => {
    try {
      // TODO: Envoyer le bail au locataire pour signature
      toast.info("Envoi au locataire à implémenter")
    } catch (error) {
      console.error("Erreur envoi:", error)
      toast.error("Erreur lors de l'envoi")
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
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Bail introuvable</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Le bail demandé n'existe pas ou vous n'avez pas les permissions nécessaires.
            </p>
            <Button variant="outline" onClick={() => router.back()} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    pending_signatures: "bg-amber-100 text-amber-800",
    signed: "bg-green-100 text-green-800",
    active: "bg-blue-100 text-blue-800",
    terminated: "bg-red-100 text-red-800",
  }

  const statusLabels: Record<string, string> = {
    draft: "Brouillon",
    pending_signatures: "En attente de signatures",
    signed: "Signé",
    active: "Actif",
    terminated: "Terminé",
  }

  return (
    <div className="container mx-auto py-6">
      <BreadcrumbNav
        items={[
          { label: "Tableau de bord", href: "/owner/dashboard" },
          { label: "Baux", href: "/owner/leases" },
          { label: `Bail #${lease.id.slice(0, 8)}`, href: `/owner/leases/${lease.id}` },
        ]}
      />

      <PageHeader
        title={`Bail de location`}
        description={`Contrat entre ${lease.owner?.first_name} ${lease.owner?.last_name} et ${lease.tenant?.first_name} ${lease.tenant?.last_name}`}
        backButton={{
          href: "/owner/leases",
          label: "Retour aux baux",
        }}
      >
        <div className="flex gap-2">
          <Badge className={statusColors[lease.status] || "bg-gray-100 text-gray-800"}>
            {statusLabels[lease.status] || "Statut inconnu"}
          </Badge>
        </div>
      </PageHeader>

      <div className="mt-6 space-y-6">
        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button onClick={generatePDF} disabled={isGeneratingPDF}>
                {isGeneratingPDF ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                    Génération...
                  </div>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger PDF
                  </>
                )}
              </Button>

              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimer
              </Button>

              {lease.status === "draft" && (
                <>
                  <Button variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                  <Button onClick={sendToTenant}>
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer au locataire
                  </Button>
                </>
              )}

              {lease.status === "pending_signatures" && !lease.signed_by_owner && (
                <Button onClick={handleSign}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Signer le bail
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Statut des signatures */}
        <Card>
          <CardHeader>
            <CardTitle>Statut des signatures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${lease.signed_by_owner ? "bg-green-500" : "bg-gray-300"}`}></div>
                <div>
                  <p className="font-medium">Propriétaire</p>
                  <p className="text-sm text-muted-foreground">{lease.signed_by_owner ? "Signé" : "En attente"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${lease.signed_by_tenant ? "bg-green-500" : "bg-gray-300"}`}
                ></div>
                <div>
                  <p className="font-medium">Locataire</p>
                  <p className="text-sm text-muted-foreground">{lease.signed_by_tenant ? "Signé" : "En attente"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prévisualisation du bail */}
        <Card>
          <CardHeader>
            <CardTitle>Prévisualisation du contrat</CardTitle>
            <CardDescription>Aperçu du contrat de bail</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-white border rounded-lg p-8 space-y-6 print:shadow-none print:border-none">
              {/* En-tête */}
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold">CONTRAT DE BAIL D'HABITATION</h1>
                <p className="text-sm text-muted-foreground">
                  {lease.lease_type === "furnished" ? "Logement meublé" : "Logement non meublé"}
                </p>
              </div>

              <Separator />

              {/* Parties */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Le Bailleur
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>
                        {lease.owner?.first_name} {lease.owner?.last_name}
                      </strong>
                    </p>
                    <p>{lease.owner?.email}</p>
                    {lease.owner?.phone && <p>{lease.owner.phone}</p>}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Le Preneur
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>
                        {lease.tenant?.first_name} {lease.tenant?.last_name}
                      </strong>
                    </p>
                    <p>{lease.tenant?.email}</p>
                    {lease.tenant?.phone && <p>{lease.tenant.phone}</p>}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Bien loué */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Désignation du bien loué
                </h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Adresse :</strong> {lease.property?.address}, {lease.property?.city}
                  </p>
                  <p>
                    <strong>Type :</strong> {lease.property?.type}
                  </p>
                  <p>
                    <strong>Surface :</strong> {lease.property?.surface} m²
                  </p>
                  <p>
                    <strong>Nombre de pièces :</strong> {lease.property?.rooms}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Conditions financières */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Euro className="h-4 w-4" />
                  Conditions financières
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Loyer mensuel</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(lease.monthly_rent)}</p>
                  </div>
                  {lease.charges > 0 && (
                    <div>
                      <p className="font-medium">Charges</p>
                      <p className="text-lg font-bold">{formatCurrency(lease.charges)}</p>
                    </div>
                  )}
                  {lease.deposit_amount > 0 && (
                    <div>
                      <p className="font-medium">Dépôt de garantie</p>
                      <p className="text-lg font-bold">{formatCurrency(lease.deposit_amount)}</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Durée du bail */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Durée du bail
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Date de début</p>
                    <p>{formatDate(lease.start_date)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Date de fin</p>
                    <p>{formatDate(lease.end_date)}</p>
                  </div>
                </div>
              </div>

              {/* Équipements fournis (si meublé) */}
              {lease.lease_type === "furnished" && lease.metadata?.furnished_items?.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3">Équipements fournis</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                      {lease.metadata.furnished_items.map((item: string, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Conditions particulières */}
              {lease.metadata?.special_conditions && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3">Conditions particulières</h3>
                    <p className="text-sm whitespace-pre-wrap">{lease.metadata.special_conditions}</p>
                  </div>
                </>
              )}

              <Separator />

              {/* Signatures */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
                <div className="text-center">
                  <p className="font-medium mb-4">Le Bailleur</p>
                  {lease.signed_by_owner ? (
                    <div className="border-2 border-green-500 rounded p-4 bg-green-50">
                      <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-green-700">Signé électroniquement</p>
                      <p className="text-xs text-green-600">
                        {lease.owner_signature_date && formatDate(lease.owner_signature_date)}
                      </p>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded p-4 h-20 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <p className="font-medium mb-4">Le Preneur</p>
                  {lease.signed_by_tenant ? (
                    <div className="border-2 border-green-500 rounded p-4 bg-green-50">
                      <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-green-700">Signé électroniquement</p>
                      <p className="text-xs text-green-600">
                        {lease.tenant_signature_date && formatDate(lease.tenant_signature_date)}
                      </p>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded p-4 h-20 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Pied de page */}
              <div className="text-center text-xs text-muted-foreground pt-8 border-t">
                <p>Document généré le {formatDate(new Date().toISOString())}</p>
                <p>Bail ID: {lease.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
