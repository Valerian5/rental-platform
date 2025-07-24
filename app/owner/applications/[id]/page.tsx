"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { CircularScore } from "@/components/circular-score"
import { VisitProposalDialog } from "@/components/visit-proposal-dialog"
import {
  FileText,
  Download,
  ArrowLeft,
  User,
  Briefcase,
  Euro,
  Shield,
  CheckCircle,
  Home,
  Phone,
  Mail,
  MapPin,
  Calendar,
  XCircle,
  MessageSquare,
  Eye,
} from "lucide-react"
import { scoringPreferencesService } from "@/lib/scoring-preferences-service"
import { convertBlobUrlToApiUrl, openDocument } from "@/lib/document-utils"
import { VisitProposalManager } from "@/components/visit-proposal-manager"

// Fonction formatCurrency définie localement pour éviter l'erreur d'importation
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

export default function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [application, setApplication] = useState<any>(null)
  const [property, setProperty] = useState<any>(null)
  const [scoringPreferences, setScoringPreferences] = useState<any>(null)
  const [matchScore, setMatchScore] = useState<any>({ score: 0, breakdown: {} })
  const [rentalFile, setRentalFile] = useState<any>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [showVisitDialog, setShowVisitDialog] = useState(false)
  const [currentApplicationForVisit, setCurrentApplicationForVisit] = useState(null)

  useEffect(() => {
    loadApplication()
  }, [])

  const loadApplication = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/applications/${params.id}`)

      if (!response.ok) {
        toast.error("Erreur lors du chargement de la candidature")
        return
      }

      const data = await response.json()
      console.log("Application chargée:", data)

      setApplication(data.application)
      setProperty(data.property)

      // Charger le dossier de location
      if (data.application.rental_file_id) {
        await loadRentalFile(data.application.rental_file_id)
      }

      // Charger les préférences de scoring
      await loadScoringPreferences(data.application.property_owner_id)

      // Calculer le score
      if (data.application && data.property) {
        calculateMatchScore(data.application, data.property)
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du chargement des données")
    } finally {
      setLoading(false)
    }
  }

  const loadRentalFile = async (rentalFileId: string) => {
    try {
      const response = await fetch(`/api/rental-files?id=${rentalFileId}`)

      if (!response.ok) {
        console.error("Erreur lors du chargement du dossier de location")
        return
      }

      const data = await response.json()
      console.log("Dossier de location chargé:", data)
      setRentalFile(data.rental_file)
    } catch (error) {
      console.error("Erreur chargement dossier:", error)
    }
  }

  const loadScoringPreferences = async (ownerId: string) => {
    try {
      const response = await fetch(`/api/scoring-preferences?owner_id=${ownerId}&default_only=true`)

      if (!response.ok) {
        console.error("Erreur lors du chargement des préférences de scoring")
        return
      }

      const data = await response.json()
      console.log("Préférences de scoring récupérées:", data.preferences?.[0]?.name || "Modèle standard")

      if (data.preferences && data.preferences.length > 0) {
        setScoringPreferences(data.preferences[0])
      } else {
        // Utiliser les préférences par défaut du service
        setScoringPreferences(scoringPreferencesService.getDefaultPreferences(ownerId))
      }
    } catch (error) {
      console.error("Erreur chargement préférences:", error)
    }
  }

  const calculateMatchScore = (application: any, property: any) => {
    try {
      if (!application || !property) return

      console.log("Calcul du score avec les préférences:", scoringPreferences?.name || "Modèle standard")

      // Utiliser les préférences chargées ou les préférences par défaut
      const preferences =
        scoringPreferences || scoringPreferencesService.getDefaultPreferences(application.property_owner_id)

      const score = scoringPreferencesService.calculateCustomScore(application, property, preferences)
      console.log("Score calculé:", score)

      setMatchScore(score)
    } catch (error) {
      console.error("Erreur calcul score:", error)
      toast.error("Erreur lors du calcul du score")
    }
  }

  const generatePDF = async () => {
    if (!rentalFile) {
      toast.error("Dossier de location non disponible")
      return
    }

    setIsGeneratingPDF(true)
    try {
      // Importer dynamiquement le générateur PDF
      const { generateRentalFilePDF } = await import("@/lib/pdf-generator-corrected")

      // Générer le PDF
      await generateRentalFilePDF(rentalFile)
      toast.success("Dossier PDF téléchargé avec succès")
    } catch (error) {
      console.error("Erreur génération PDF:", error)
      toast.error("Erreur lors de la génération du PDF")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/applications/${params.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        toast.error("Erreur lors de la mise à jour du statut")
        return
      }

      toast.success("Statut mis à jour avec succès")
      loadApplication() // Recharger l'application
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la mise à jour du statut")
    }
  }

  const handleProposeVisit = () => {
    if (application && application.property) {
      setCurrentApplicationForVisit({
        id: application.id,
        property_id: application.property.id,
        property: application.property,
        tenant: application.tenant,
      })
      setShowVisitDialog(true)
    }
  }

  const handleVisitProposed = async (slots) => {
    if (!currentApplicationForVisit) return

    try {
      // Mettre à jour le statut de la candidature
      const success = await updateApplicationStatus("visit_proposed")
      if (success) {
        // Fermer le dialogue
        setShowVisitDialog(false)
        setCurrentApplicationForVisit(null)
        toast.success("Créneaux de visite proposés avec succès")
      }
    } catch (error) {
      console.error("Erreur lors de la proposition de visite:", error)
      toast.error("Erreur lors de la proposition de visite")
    }
  }

  const updateApplicationStatus = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/applications/${params.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        toast.error(errorData.message || "Erreur lors de la mise à jour du statut")
        return false
      }

      // Recharger l'application pour mettre à jour le statut
      loadApplication()
      return true
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la mise à jour du statut")
      return false
    }
  }

  const handleVisitProposal = async (slots: any[]) => {
    try {
      const response = await fetch(`/api/applications/${params.id}/propose-visit-slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        toast.error(errorData.message || "Erreur lors de la proposition de visite")
        return
      }

      const data = await response.json()
      toast.success(data.message || "Créneaux de visite proposés avec succès")
      setShowVisitDialog(false)

      // Recharger l'application pour mettre à jour le statut
      loadApplication()
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la proposition de visite")
    }
  }

  // Helper pour vérifier si un tableau existe et a des éléments
  const hasDocuments = (docs: any) => {
    return docs && Array.isArray(docs) && docs.length > 0
  }

  // Composant pour afficher un document
  const DocumentCard = ({ doc, title, color = "blue" }: { doc: any; title: string; color?: string }) => {
    const docUrl = doc?.url || doc
    const colorClasses = {
      blue: "text-blue-500 border-blue-200 bg-blue-50",
      green: "text-green-500 border-green-200 bg-green-50",
      purple: "text-purple-500 border-purple-200 bg-purple-50",
      orange: "text-orange-500 border-orange-200 bg-orange-50",
      red: "text-red-500 border-red-200 bg-red-50",
      teal: "text-teal-500 border-teal-200 bg-teal-50",
      indigo: "text-indigo-500 border-indigo-200 bg-indigo-50",
    }

    return (
      <div className={`border rounded-lg p-4 ${colorClasses[color]} hover:shadow-md transition-shadow`}>
        <div className="flex items-center gap-2 mb-3">
          <FileText className={`h-5 w-5 ${colorClasses[color].split(" ")[0]}`} />
          <span className="font-medium text-gray-900">{title}</span>
        </div>

        {/* Aperçu du document */}
        <div className="mb-3">
          <img
            src={convertBlobUrlToApiUrl(docUrl) || "/placeholder.svg"}
            alt={title}
            className="w-full h-32 object-cover rounded border bg-white"
            onError={(e) => {
              e.currentTarget.style.display = "none"
              e.currentTarget.nextElementSibling.style.display = "flex"
            }}
          />
          <div className="hidden items-center justify-center h-32 bg-white rounded border">
            <div className="text-center">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Document PDF</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={() => openDocument(docUrl)}>
            <Eye className="h-4 w-4 mr-1" />
            Consulter
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const link = document.createElement("a")
              link.href = convertBlobUrlToApiUrl(docUrl)
              link.download = title
              link.click()
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Candidature introuvable</h3>
            <p className="text-sm text-muted-foreground mt-1">
              La candidature demandée n'existe pas ou vous n'avez pas les permissions nécessaires.
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
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    visit_scheduled: "bg-blue-100 text-blue-800",
  }

  const statusLabels: Record<string, string> = {
    pending: "En attente",
    analyzing: "En cours d'analyse",
    visit_proposed: "Visite proposée",
    visit_scheduled: "Visite programmée",
    visit_completed: "Visite effectuée",
    accepted: "Acceptée - En attente confirmation",
    approved: "Approuvée",
    rejected: "Refusée",
    lease_signed: "Bail signé",
  }

  const handleAccept = async () => {
    try {
      const response = await fetch(`/api/applications/${params.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" }),
      })

      if (!response.ok) {
        toast.error("Erreur lors de l'acceptation")
        return
      }

      toast.success("Candidature acceptée - En attente de confirmation du locataire")
      loadApplication()
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de l'acceptation")
    }
  }

  const handleRefuse = async () => {
    try {
      const response = await fetch(`/api/applications/${params.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      })

      if (!response.ok) {
        toast.error("Erreur lors du refus")
        return
      }

      toast.success("Candidature refusée")
      loadApplication()
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du refus")
    }
  }

  const handleContact = () => {
    router.push(`/owner/messaging?application=${application.id}`)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analyse de candidature"
        description={`Candidature de ${application.tenant_name || "Candidat"} pour ${property?.title || "Propriété"}`}
        backButton={{
          href: "/owner/applications",
          label: "Retour aux candidatures",
        }}
      >
        <div className="flex gap-2">
          {application.status === "analyzing" && (
            <>
              <Button onClick={handleProposeVisit}>
                <Calendar className="h-4 w-4 mr-2" />
                Proposer une visite
              </Button>
              <Button variant="destructive" onClick={handleRefuse}>
                <XCircle className="h-4 w-4 mr-2" />
                Refuser
              </Button>
              <Button variant="outline" onClick={handleContact}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Contacter
              </Button>
            </>
          )}
          {application.status === "visit_scheduled" && (
            <>
              <Button onClick={handleAccept}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Accepter le dossier
              </Button>
              <Button variant="destructive" onClick={handleRefuse}>
                <XCircle className="h-4 w-4 mr-2" />
                Refuser
              </Button>
              <Button variant="outline" onClick={handleContact}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Contacter
              </Button>
            </>
          )}
          {application.status === "accepted" && (
            <>
              <Button onClick={() => router.push(`/owner/leases/new?application=${application.id}`)}>
                <FileText className="h-4 w-4 mr-2" />
                Générer le bail
              </Button>
              <Button variant="outline" onClick={handleContact}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Contacter
              </Button>
            </>
          )}

          {/* Bouton de téléchargement PDF toujours visible si dossier disponible */}
          {rentalFile && (
            <Button variant="outline" onClick={generatePDF} disabled={isGeneratingPDF}>
              {isGeneratingPDF ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                  Génération...
                </div>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger le dossier PDF
                </>
              )}
            </Button>
          )}
        </div>
      </PageHeader>
      </div>

      <div className="space-y-6">
        {/* Score et actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <CircularScore score={matchScore.totalScore || 0} compatible={matchScore.totalScore >= 60} />
            <div>
              <h2 className="text-xl font-bold">Score de compatibilité</h2>
              <p className="text-sm text-muted-foreground">
                Basé sur {scoringPreferences?.name || "le modèle standard"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={statusColors[application.status] || "bg-gray-100 text-gray-800"}>
              {statusLabels[application.status] || "Statut inconnu"}
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="analysis" className="space-y-4">
          <TabsList>
            <TabsTrigger value="analysis">Analyse</TabsTrigger>
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Détail du score</CardTitle>
                <CardDescription>Analyse détaillée des critères d'évaluation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {matchScore && matchScore.breakdown ? (
                  <div className="space-y-4">
                    {/* Revenus */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Euro className="h-5 w-5 text-green-600 mr-2" />
                          <h3 className="font-medium">Revenus</h3>
                        </div>
                        <div className="text-right">
                          <span className="font-bold">
                            {Math.round(matchScore.breakdown.income_ratio?.score || 0)}/
                            {matchScore.breakdown.income_ratio?.max || 100}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {matchScore.breakdown.income_ratio?.details || "Aucun détail disponible"}
                      </p>
                      <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{
                            width: `${
                              ((matchScore.breakdown.income_ratio?.score || 0) /
                                (matchScore.breakdown.income_ratio?.max || 100)) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Stabilité professionnelle */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Briefcase className="h-5 w-5 text-blue-600 mr-2" />
                          <h3 className="font-medium">Stabilité professionnelle</h3>
                        </div>
                        <div className="text-right">
                          <span className="font-bold">
                            {Math.round(matchScore.breakdown.professional_stability?.score || 0)}/
                            {matchScore.breakdown.professional_stability?.max || 100}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {matchScore.breakdown.professional_stability?.details || "Aucun détail disponible"}
                      </p>
                      <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{
                            width: `${
                              ((matchScore.breakdown.professional_stability?.score || 0) /
                                (matchScore.breakdown.professional_stability?.max || 100)) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Garants */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Shield className="h-5 w-5 text-purple-600 mr-2" />
                          <h3 className="font-medium">Garants</h3>
                        </div>
                        <div className="text-right">
                          <span className="font-bold">
                            {Math.round(matchScore.breakdown.guarantor?.score || 0)}/
                            {matchScore.breakdown.guarantor?.max || 100}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {matchScore.breakdown.guarantor?.details || "Aucun détail disponible"}
                      </p>
                      <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{
                            width: `${
                              ((matchScore.breakdown.guarantor?.score || 0) /
                                (matchScore.breakdown.guarantor?.max || 100)) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Qualité du dossier */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-amber-600 mr-2" />
                          <h3 className="font-medium">Qualité du dossier</h3>
                        </div>
                        <div className="text-right">
                          <span className="font-bold">
                            {Math.round(matchScore.breakdown.application_quality?.score || 0)}/
                            {matchScore.breakdown.application_quality?.max || 100}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {matchScore.breakdown.application_quality?.details || "Aucun détail disponible"}
                      </p>
                      <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{
                            width: `${
                              ((matchScore.breakdown.application_quality?.score || 0) /
                                (matchScore.breakdown.application_quality?.max || 100)) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p>Aucune donnée d'analyse disponible</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informations sur le bien</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">{property?.title || "Propriété"}</h3>
                    <div className="flex items-center text-sm text-muted-foreground mb-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{property?.address || "Adresse non spécifiée"}</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Home className="h-4 w-4 mr-1" />
                      <span>
                        {property?.surface || "?"} m² - {property?.rooms || "?"} pièces
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600 mb-1">{formatCurrency(property?.price || 0)}</div>
                    <div className="text-sm text-muted-foreground">
                      Disponible à partir du {formatDate(property?.availability_date)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profil du candidat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-100 rounded-full p-4">
                      <User className="h-8 w-8 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-medium">{application.tenant_name || "Nom non spécifié"}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        {application.tenant_email && (
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-1" />
                            <span>{application.tenant_email}</span>
                          </div>
                        )}
                        {application.tenant_phone && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-1" />
                            <span>{application.tenant_phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Situation professionnelle</h4>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-muted-foreground">Profession</span>
                          <p>{application.profession || "Non spécifié"}</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Type de contrat</span>
                          <p>{application.contract_type || "Non spécifié"}</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Entreprise</span>
                          <p>{application.company || "Non spécifié"}</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Ancienneté</span>
                          <p>
                            {application.seniority_months ? `${application.seniority_months} mois` : "Non spécifié"}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Période d'essai</span>
                          <p>{application.trial_period ? "Oui" : "Non"}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Situation financière</h4>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-muted-foreground">Revenus mensuels</span>
                          <p className="text-green-600 font-medium">{formatCurrency(application.income || 0)}</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Ratio revenus/loyer</span>
                          <p>
                            {property && property.price && application.income
                              ? `${(application.income / property.price).toFixed(1)}x le loyer`
                              : "Non calculable"}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Garant</span>
                          <p>{application.has_guarantor ? "Oui" : "Non"}</p>
                        </div>
                        {application.has_guarantor && (
                          <div>
                            <span className="text-sm text-muted-foreground">Revenus du garant</span>
                            <p>{formatCurrency(application.guarantor_income || 0)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Présentation</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="whitespace-pre-wrap">{application.presentation || "Aucune présentation"}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Informations complémentaires</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Date de candidature</span>
                        <p>{formatDate(application.created_at)}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Dernière mise à jour</span>
                        <p>{formatDate(application.updated_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documents fournis
                  </div>
                  {rentalFile && (
                    <Button onClick={generatePDF} disabled={isGeneratingPDF} variant="outline">
                      {isGeneratingPDF ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                          Génération...
                        </div>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger le dossier PDF
                        </>
                      )}
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {rentalFile ? (
                  <div className="space-y-6">
                    {/* Documents du locataire principal */}
                    {hasDocuments(rentalFile.main_tenant?.identity_documents) && (
                      <div>
                        <h4 className="font-medium mb-3">Pièces d'identité du locataire</h4>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {rentalFile.main_tenant.identity_documents.map((doc, index) => (
                            <div key={index} className="border rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-blue-500" />
                                <span className="text-sm font-medium">Pièce d'identité {index + 1}</span>
                              </div>
                              <img
                                src={convertBlobUrlToApiUrl(doc.url || doc) || "/placeholder.svg"}
                                alt={`Pièce d'identité ${index + 1}`}
                                className="w-full h-32 object-cover rounded border"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none"
                                  e.currentTarget.nextElementSibling.style.display = "flex"
                                }}
                              />
                              <div className="hidden items-center justify-center h-32 bg-gray-100 rounded border">
                                <div className="text-center">
                                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                                  <p className="text-xs text-gray-500">Document</p>
                                </div>
                              </div>
                              <div className="flex gap-2 mt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 bg-transparent"
                                  onClick={() => window.open(convertBlobUrlToApiUrl(doc.url || doc), "_blank")}
                                >
                                  Consulter
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const link = document.createElement("a")
                                    link.href = convertBlobUrlToApiUrl(doc.url || doc)
                                    link.download = `piece-identite-${index + 1}`
                                    link.click()
                                  }}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Documents d'activité */}
                    {hasDocuments(rentalFile.main_tenant?.activity_documents) && (
                      <div>
                        <h4 className="font-medium mb-3">Justificatifs d'activité</h4>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {rentalFile.main_tenant.activity_documents.map((doc, index) => (
                            <div key={index} className="border rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-green-500" />
                                <span className="text-sm font-medium">Justificatif {index + 1}</span>
                              </div>
                              <img
                                src={convertBlobUrlToApiUrl(doc.url || doc) || "/placeholder.svg"}
                                alt={`Justificatif d'activité ${index + 1}`}
                                className="w-full h-32 object-cover rounded border"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none"
                                  e.currentTarget.nextElementSibling.style.display = "flex"
                                }}
                              />
                              <div className="hidden items-center justify-center h-32 bg-gray-100 rounded border">
                                <div className="text-center">
                                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                                  <p className="text-xs text-gray-500">Document</p>
                                </div>
                              </div>
                              <div className="flex gap-2 mt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 bg-transparent"
                                  onClick={() => window.open(convertBlobUrlToApiUrl(doc.url || doc), "_blank")}
                                >
                                  Consulter
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const link = document.createElement("a")
                                    link.href = convertBlobUrlToApiUrl(doc.url || doc)
                                    link.download = `justificatif-activite-${index + 1}`
                                    link.click()
                                  }}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Documents de revenus */}
                    {hasDocuments(rentalFile.main_tenant?.income_sources?.work_income?.documents) && (
                      <div>
                        <h4 className="font-medium mb-3">Justificatifs de revenus</h4>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {rentalFile.main_tenant.income_sources.work_income.documents.map((doc, index) => (
                            <div key={index} className="border rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-purple-500" />
                                <span className="text-sm font-medium">Justificatif revenus {index + 1}</span>
                              </div>
                              <img
                                src={convertBlobUrlToApiUrl(doc.url || doc) || "/placeholder.svg"}
                                alt={`Justificatif de revenus ${index + 1}`}
                                className="w-full h-32 object-cover rounded border"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none"
                                  e.currentTarget.nextElementSibling.style.display = "flex"
                                }}
                              />
                              <div className="hidden items-center justify-center h-32 bg-gray-100 rounded border">
                                <div className="text-center">
                                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                                  <p className="text-xs text-gray-500">Document</p>
                                </div>
                              </div>
                              <div className="flex gap-2 mt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 bg-transparent"
                                  onClick={() => window.open(convertBlobUrlToApiUrl(doc.url || doc), "_blank")}
                                >
                                  Consulter
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const link = document.createElement("a")
                                    link.href = convertBlobUrlToApiUrl(doc.url || doc)
                                    link.download = `justificatif-revenus-${index + 1}`
                                    link.click()
                                  }}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Documents fiscaux */}
                    {hasDocuments(rentalFile.main_tenant?.tax_situation?.documents) && (
                      <div>
                        <h4 className="font-medium mb-3">Documents fiscaux</h4>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {rentalFile.main_tenant.tax_situation.documents.map((doc, index) => (
                            <div key={index} className="border rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-orange-500" />
                                <span className="text-sm font-medium">Document fiscal {index + 1}</span>
                              </div>
                              <img
                                src={convertBlobUrlToApiUrl(doc.url || doc) || "/placeholder.svg"}
                                alt={`Document fiscal ${index + 1}`}
                                className="w-full h-32 object-cover rounded border"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none"
                                  e.currentTarget.nextElementSibling.style.display = "flex"
                                }}
                              />
                              <div className="hidden items-center justify-center h-32 bg-gray-100 rounded border">
                                <div className="text-center">
                                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                                  <p className="text-xs text-gray-500">Document</p>
                                </div>
                              </div>
                              <div className="flex gap-2 mt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 bg-transparent"
                                  onClick={() => window.open(convertBlobUrlToApiUrl(doc.url || doc), "_blank")}
                                >
                                  Consulter
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const link = document.createElement("a")
                                    link.href = convertBlobUrlToApiUrl(doc.url || doc)
                                    link.download = `document-fiscal-${index + 1}`
                                    link.click()
                                  }}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Documents de logement actuel */}
                    {hasDocuments(rentalFile.main_tenant?.current_housing_documents?.quittances_loyer) && (
                      <div>
                        <h4 className="font-medium mb-3">Quittances de loyer</h4>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {rentalFile.main_tenant.current_housing_documents.quittances_loyer.map((doc, index) => (
                            <div key={index} className="border rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-red-500" />
                                <span className="text-sm font-medium">Quittance {index + 1}</span>
                              </div>
                              <img
                                src={convertBlobUrlToApiUrl(doc.url || doc) || "/placeholder.svg"}
                                alt={`Quittance de loyer ${index + 1}`}
                                className="w-full h-32 object-cover rounded border"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none"
                                  e.currentTarget.nextElementSibling.style.display = "flex"
                                }}
                              />
                              <div className="hidden items-center justify-center h-32 bg-gray-100 rounded border">
                                <div className="text-center">
                                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                                  <p className="text-xs text-gray-500">Document</p>
                                </div>
                              </div>
                              <div className="flex gap-2 mt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 bg-transparent"
                                  onClick={() => window.open(convertBlobUrlToApiUrl(doc.url || doc), "_blank")}
                                >
                                  Consulter
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const link = document.createElement("a")
                                    link.href = convertBlobUrlToApiUrl(doc.url || doc)
                                    link.download = `quittance-loyer-${index + 1}`
                                    link.click()
                                  }}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Documents des colocataires */}
                    {rentalFile.cotenants &&
                      rentalFile.cotenants.length > 0 &&
                      rentalFile.cotenants.some((c) => hasDocuments(c.identity_documents)) && (
                        <div>
                          <h4 className="font-medium mb-3">Documents des colocataires</h4>
                          {rentalFile.cotenants.map(
                            (cotenant, cIndex) =>
                              hasDocuments(cotenant.identity_documents) && (
                                <div key={cIndex} className="mb-4">
                                  <h5 className="font-medium mb-3">
                                    Colocataire {cIndex + 1} - {cotenant.first_name} {cotenant.last_name}
                                  </h5>
                                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                    {cotenant.identity_documents.map((doc, index) => (
                                      <div key={index} className="border rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                          <FileText className="h-4 w-4 text-teal-500" />
                                          <span className="text-sm font-medium">Pièce d'identité {index + 1}</span>
                                        </div>
                                        <img
                                          src={convertBlobUrlToApiUrl(doc.url || doc) || "/placeholder.svg"}
                                          alt={`Pièce d'identité colocataire ${index + 1}`}
                                          className="w-full h-32 object-cover rounded border"
                                          onError={(e) => {
                                            e.currentTarget.style.display = "none"
                                            e.currentTarget.nextElementSibling.style.display = "flex"
                                          }}
                                        />
                                        <div className="hidden items-center justify-center h-32 bg-gray-100 rounded border">
                                          <div className="text-center">
                                            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                                            <p className="text-xs text-gray-500">Document</p>
                                          </div>
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 bg-transparent"
                                            onClick={() => window.open(convertBlobUrlToApiUrl(doc.url || doc), "_blank")}
                                          >
                                            Consulter
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              const link = document.createElement("a")
                                              link.href = convertBlobUrlToApiUrl(doc.url || doc)
                                              link.download = `colocataire-${cIndex + 1}-identite-${index + 1}`
                                              link.click()
                                            }}
                                          >
                                            <Download className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ),
                          )}
                        </div>
                      )}

                    {/* Documents des garants */}
                    {rentalFile.guarantors &&
                      rentalFile.guarantors.length > 0 &&
                      rentalFile.guarantors.some((g) => hasDocuments(g.personal_info?.identity_documents)) && (
                        <div>
                          <h4 className="font-medium mb-3">Documents des garants</h4>
                          {rentalFile.guarantors.map(
                            (guarantor, gIndex) =>
                              hasDocuments(guarantor.personal_info?.identity_documents) && (
                                <div key={gIndex} className="mb-4">
                                  <h5 className="font-medium mb-3">
                                    Garant {gIndex + 1} - {guarantor.personal_info.first_name}{" "}
                                    {guarantor.personal_info.last_name}
                                  </h5>
                                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                    {guarantor.personal_info.identity_documents.map((doc, index) => (
                                      <div key={index} className="border rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                          <FileText className="h-4 w-4 text-indigo-500" />
                                          <span className="text-sm font-medium">Pièce d'identité {index + 1}</span>
                                        </div>
                                        <img
                                          src={convertBlobUrlToApiUrl(doc.url || doc) || "/placeholder.svg"}
                                          alt={`Pièce d'identité garant ${index + 1}`}
                                          className="w-full h-32 object-cover rounded border"
                                          onError={(e) => {
                                            e.currentTarget.style.display = "none"
                                            e.currentTarget.nextElementSibling.style.display = "flex"
                                          }}
                                        />
                                        <div className="hidden items-center justify-center h-32 bg-gray-100 rounded border">
                                          <div className="text-center">
                                            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                                            <p className="text-xs text-gray-500">Document</p>
                                          </div>
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 bg-transparent"
                                            onClick={() => window.open(convertBlobUrlToApiUrl(doc.url || doc), "_blank")}
                                          >
                                            Consulter
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              const link = document.createElement("a")
                                              link.href = convertBlobUrlToApiUrl(doc.url || doc)
                                              link.download = `garant-${gIndex + 1}-identite-${index + 1}`
                                              link.click()
                                            }}
                                          >
                                            <Download className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ),
                          )}
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Aucun document disponible</h3>
                    <p className="text-muted-foreground">
                      Le candidat n'a pas encore fourni de documents ou le dossier n'est pas accessible.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        {/* Dialog de proposition de visite */}
        <VisitProposalDialog
          open={showVisitDialog}
          onClose={() => setShowVisitDialog(false)}
          onConfirm={handleVisitProposal}
          propertyId={property?.id || ""}
        />
        {/* Dialogue de proposition de visite */}
        {showVisitDialog && currentApplicationForVisit && (
          <VisitProposalManager
            isOpen={showVisitDialog}
            onClose={() => {
              setShowVisitDialog(false)
              setCurrentApplicationForVisit(null)
            }}
            propertyId={currentApplicationForVisit.property_id}
            propertyTitle={currentApplicationForVisit.property?.title || "Propriété"}
            applicationId={currentApplicationForVisit.id}
            tenantName={
              `${currentApplicationForVisit.tenant?.first_name || ""} ${currentApplicationForVisit.tenant?.last_name || ""}`.trim() ||
              "Candidat"
            }
            onSlotsProposed={handleVisitProposed}
          />
        )}
      </div>
    )\
  }
