"use client"

import { useState, useEffect } from "react"
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
} from "lucide-react"
import { LeaseDocumentDisplay } from "@/components/lease-document-display"

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
  created_at: string
  updated_at: string
}

export default function LeaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const leaseId = params.id as string

  const [lease, setLease] = useState<Lease | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

      // Recharger les données du bail pour afficher le document généré
      await loadLease()
    } catch (error) {
      console.error("Erreur génération:", error)
      setError(error instanceof Error ? error.message : "Erreur inconnue")
    } finally {
      setGenerating(false)
    }
  }

  useEffect(() => {
    if (leaseId) {
      loadLease()
    }
  }, [leaseId])

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
              <Button onClick={() => router.push("/owner/leases")}>
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
      case "draft":
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Brouillon
          </Badge>
        )
      case "active":
        return (
          <Badge variant="default">
            <CheckCircle className="h-3 w-3 mr-1" />
            Actif
          </Badge>
        )
      case "signed":
        return (
          <Badge variant="secondary">
            <FileText className="h-3 w-3 mr-1" />
            Signé
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getLeaseTypeBadge = (type: string) => {
    switch (type) {
      case "unfurnished":
        return <Badge variant="outline">Vide</Badge>
      case "furnished":
        return <Badge variant="outline">Meublé</Badge>
      case "commercial":
        return <Badge variant="outline">Commercial</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/owner/leases")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Bail #{lease.id.slice(0, 8)}</h1>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(lease.status)}
              {getLeaseTypeBadge(lease.lease_type)}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/owner/leases/${leaseId}/complete-data`)}>
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          {lease.generated_document && (
            <Button variant="outline">
              <Send className="h-4 w-4 mr-2" />
              Envoyer
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="document">Document</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Informations principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Bailleur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{lease.bailleur_nom_prenom}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Locataire
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{lease.locataire_nom_prenom}</p>
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
              <CardContent className="p-6">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Document non généré</h3>
                  <p className="text-gray-600 mb-4">
                    Le document de bail n'a pas encore été généré. Cliquez sur "Générer le document" pour créer le
                    contrat.
                  </p>
                  <Button onClick={generateDocument} disabled={generating}>
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
                  {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
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
                      {new Date(lease.created_at).toLocaleDateString("fr-FR")} à{" "}
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
                        {new Date(lease.document_generated_at).toLocaleDateString("fr-FR")} à{" "}
                        {new Date(lease.document_generated_at).toLocaleTimeString("fr-FR", {
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
                      {new Date(lease.updated_at).toLocaleDateString("fr-FR")} à{" "}
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
  )
}
