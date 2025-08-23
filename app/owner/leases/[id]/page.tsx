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
  Download,
} from "lucide-react"
import { LeaseDocumentDisplay } from "@/components/lease-document-display"
import { PropertyDocumentsUpload } from "@/components/property-documents-upload"
import { DocuSignSignatureManager } from "@/components/docusign-signature-manager"
import { toast } from "sonner"
import LeaseTimeline from "@/components/leases/lease-timeline"
import DocusignStatus from "@/components/DocusignStatus" // Le nouveau composant

// Le type Lease inclut maintenant les champs Docusign que le webhook va remplir
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
  created_at: string
  updated_at: string
  docusign_envelope_id?: string | null
  docusign_status?: string | null
  signatures_detail?: any | null // Ce champ sera rempli par le webhook
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
      // On s'attend à ce que l'API retourne l'objet lease complet,
      // y compris les champs docusign_status et signatures_detail
      setLease(data)
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

  useEffect(() => {
    if (leaseId) {
      loadLease()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaseId])


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
          badge: <Badge variant="outline">Brouillon</Badge>,
          description: "Le bail est en cours de préparation.",
        }
      case "active":
        return {
          badge: <Badge className="bg-green-600">Actif</Badge>,
          description: "Le bail est signé et en cours.",
        }
      // Ajoutez d'autres statuts si nécessaire
      default:
        return {
          badge: <Badge variant="secondary">{status}</Badge>,
          description: "Statut du bail.",
        }
    }
  }
  
  const statusInfo = getStatusInfo(lease.status);

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-4">
        <div>
            <h1 className="text-3xl font-bold">Détails du Bail</h1>
            <p className="text-gray-500">{statusInfo.description}</p>
        </div>
        {statusInfo.badge}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          
          {/* NOUVEAU BLOC : Affichage du statut Docusign */}
          {lease.docusign_envelope_id && (
            <DocusignStatus
              status={lease.docusign_status}
              signatures={lease.signatures_detail}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle>Informations sur le Bail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <p><strong>Propriété:</strong> {lease.adresse_logement}</p>
                <p><strong>Locataire:</strong> {lease.locataire_nom_prenom}</p>
                <p><strong>Loyer mensuel:</strong> {lease.montant_loyer_mensuel} €</p>
                <p><strong>Date de début:</strong> {new Date(lease.date_prise_effet).toLocaleDateString('fr-FR')}</p>
                <p><strong>Durée:</strong> {lease.duree_contrat}</p>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="document">
            <TabsList>
              <TabsTrigger value="document">Document</TabsTrigger>
              <TabsTrigger value="timeline">Historique</TabsTrigger>
              <TabsTrigger value="annexes">Annexes</TabsTrigger>
            </TabsList>
            <TabsContent value="document">
                {lease.generated_document ? (
                    <LeaseDocumentDisplay document={lease.generated_document} leaseId={lease.id} generatedAt={lease.document_generated_at}/>
                ) : (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="font-semibold text-lg">Aucun document généré</h3>
                            <p className="text-gray-500 mb-4">Générez le document pour pouvoir l'envoyer.</p>
                            <Button onClick={generateDocument} disabled={generating}>
                                {generating ? 'Génération...' : 'Générer le document'}
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </TabsContent>
            <TabsContent value="timeline">
              <LeaseTimeline lease={lease} />
            </TabsContent>
            <TabsContent value="annexes">
                <PropertyDocumentsUpload leaseId={lease.id} propertyId={lease.property_id} />
            </TabsContent>
          </Tabs>

        </div>
        <div className="space-y-6">
            <DocuSignSignatureManager
                leaseId={lease.id}
                leaseStatus={lease.status}
                envelopeId={lease.docusign_envelope_id}
                onSignatureRequest={loadLease} // On recharge les données après un envoi
            />
            <Card>
                <CardHeader>
                    <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col space-y-2">
                    <Button variant="outline" disabled={!lease.generated_document}>
                        <Download className="mr-2 h-4 w-4" />
                        Télécharger le bail (PDF)
                    </Button>
                    <Button variant="outline">Voir les quittances</Button>
                    <Button variant="destructive">Résilier le bail</Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}
