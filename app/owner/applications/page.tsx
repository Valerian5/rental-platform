"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CircularScore } from "@/components/circular-score"
import { scoringPreferencesService } from "@/lib/scoring-preferences-service"
import Link from "next/link"
import {
  User,
  Building,
  Calendar,
  CheckCircle,
  XCircle,
  FileText,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertCircle,
  Eye,
  BarChart3,
} from "lucide-react"
import { useRouter } from "next/navigation"

interface ApplicationCardProps {
  application: {
    id: string
    tenant: {
      first_name: string
      last_name: string
      email: string
      phone: string
    }
    property: {
      title: string
      address: string
      owner_id?: string
      price?: number
    }
    profession: string
    income: number
    has_guarantor: boolean
    documents_complete: boolean
    status: string
    match_score: number
    created_at: string
    tenant_id?: string
    contract_type?: string
    guarantor_income?: number
    rental_file_main_tenant?: any
    rental_file_guarantors?: any[]
  }
  isSelected?: boolean
  onSelect?: (selected: boolean) => void
  onAction: (action: string) => void
  rentalFile?: any
  scoringPreferences?: any
}

export function ModernApplicationCard({
  application,
  isSelected,
  onSelect,
  onAction,
  rentalFile,
  scoringPreferences,
}: ApplicationCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [calculatedScore, setCalculatedScore] = useState<number>(application.match_score)
  const [scoreLoading, setScoreLoading] = useState(false)
  const [scoreBreakdown, setScoreBreakdown] = useState<any>(null)
  const [scoreRecommendations, setScoreRecommendations] = useState<string[]>([])
  const [scoreWarnings, setScoreWarnings] = useState<string[]>([])
  const [scoreCompatible, setScoreCompatible] = useState<boolean | undefined>(undefined)
  const [modelUsed, setModelUsed] = useState<string>("")
  const router = useRouter()

  useEffect(() => {
    if (application.property?.owner_id && application.property?.price) {
      calculateUnifiedScore()
    }
  }, [application, application.property?.owner_id, scoringPreferences])

  const calculateUnifiedScore = async () => {
    if (!application.property?.owner_id || !application.property?.price) {
      return
    }

    try {
      setScoreLoading(true)

      console.log("🎯 ModernApplicationCard - Calcul score unifié pour:", {
        applicationId: application.id,
        propertyPrice: application.property.price,
        ownerId: application.property.owner_id,
      })

      // Préparer les données d'application enrichies
      const enrichedApplication = {
        id: application.id,
        income: application.income,
        has_guarantor: application.has_guarantor,
        guarantor_income: application.guarantor_income || rentalFile?.guarantor_income || 0,
        contract_type: application.contract_type || rentalFile?.contract_type || "cdi",
        profession: application.profession,
        company: application.company || "Non spécifié",
        documents_complete: application.documents_complete,
        has_verified_documents: rentalFile?.has_verified_documents || false,
        presentation: rentalFile?.presentation || application.message || "",
        trial_period: rentalFile?.trial_period || false,
        seniority_months: rentalFile?.seniority_months || 0,
        // Enrichir avec les données du rental_file si disponibles
        rental_file_main_tenant: application.rental_file_main_tenant,
        rental_file_guarantors: application.rental_file_guarantors,
      }

      // Utiliser le service unifié
      const result = await scoringPreferencesService.calculateScore(
        enrichedApplication,
        application.property,
        application.property.owner_id,
        true, // Utiliser le cache
      )

      console.log("📊 ModernApplicationCard - Score calculé:", {
        totalScore: result.totalScore,
        compatible: result.compatible,
        model: result.model_used,
      })

      setCalculatedScore(result.totalScore)
      setScoreBreakdown(result.breakdown)
      setScoreRecommendations(result.recommendations || [])
      setScoreWarnings(result.warnings || [])
      setScoreCompatible(result.compatible)
      setModelUsed(result.model_used)
    } catch (error) {
      console.error("❌ Erreur calcul score ModernApplicationCard:", error)
      setCalculatedScore(application.match_score || 50)
    } finally {
      setScoreLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    } catch (e) {
      return "Date inconnue"
    }
  }

  const formatAmount = (amount: number) => {
    try {
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(amount)
    } catch (e) {
      return "Montant inconnu"
    }
  }

  const getStatusBadge = () => {
    switch (application.status) {
      case "pending":
        return <Badge variant="outline">En attente</Badge>
      case "analyzing":
        return <Badge variant="secondary">En analyse</Badge>
      case "visit_proposed":
        return (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-200">
            Visite proposée
          </Badge>
        )
      case "visit_scheduled":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
            Visite planifiée
          </Badge>
        )
      case "accepted":
      case "approved":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
            Acceptée
          </Badge>
        )
      case "rejected":
        return <Badge variant="destructive">Refusée</Badge>
      case "waiting_tenant_confirmation":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
            En attente de confirmation
          </Badge>
        )
      default:
        return <Badge variant="outline">Statut inconnu</Badge>
    }
  }

  const getActionButtons = () => {
    const viewAnalysisButton = (
      <Button size="sm" variant="outline" onClick={() => router.push(`/owner/applications/${application.id}`)}>
        <BarChart3 className="h-4 w-4 mr-1" />
        Voir analyse
      </Button>
    )

    switch (application.status) {
      case "pending":
        return (
          <>
            <Button size="sm" variant="default" onClick={() => onAction("analyze")}>
              <Eye className="h-4 w-4 mr-1" />
              Analyser
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAction("contact")}>
              <MessageSquare className="h-4 w-4 mr-1" />
              Contacter
            </Button>
          </>
        )
      case "analyzing":
        return (
          <>
            <Button size="sm" variant="default" onClick={() => onAction("propose_visit")}>
              <Calendar className="h-4 w-4 mr-1" />
              Proposer visite
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onAction("refuse")}>
              <XCircle className="h-4 w-4 mr-1" />
              Refuser
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAction("contact")}>
              <MessageSquare className="h-4 w-4 mr-1" />
              Contacter
            </Button>
          </>
        )
      case "visit_proposed":
        return (
          <>
            <Button size="sm" variant="outline" disabled>
              <Clock className="h-4 w-4 mr-1" />
              En attente
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAction("contact")}>
              <MessageSquare className="h-4 w-4 mr-1" />
              Contacter
            </Button>
            {viewAnalysisButton}
          </>
        )
      case "visit_scheduled":
        return (
          <>
            <Button size="sm" variant="default" onClick={() => onAction("accept")}>
              <CheckCircle className="h-4 w-4 mr-1" />
              Accepter
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onAction("refuse")}>
              <XCircle className="h-4 w-4 mr-1" />
              Refuser
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAction("contact")}>
              <MessageSquare className="h-4 w-4 mr-1" />
              Contacter
            </Button>
            {viewAnalysisButton}
          </>
        )
      case "waiting_tenant_confirmation":
        return (
          <>
            <Button size="sm" variant="outline" disabled>
              <Clock className="h-4 w-4 mr-1" />
              En attente
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAction("contact")}>
              <MessageSquare className="h-4 w-4 mr-1" />
              Contacter
            </Button>
            {viewAnalysisButton}
          </>
        )
      case "accepted":
      case "approved":
        return (
          <>
            <Button size="sm" variant="default" onClick={() => onAction("generate_lease")}>
              <FileText className="h-4 w-4 mr-1" />
              Générer bail
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAction("contact")}>
              <MessageSquare className="h-4 w-4 mr-1" />
              Contacter
            </Button>
            {viewAnalysisButton}
          </>
        )
      case "rejected":
        return (
          <>
            <Button size="sm" variant="outline" onClick={() => router.push(`/owner/applications/${application.id}`)}>
              <Eye className="h-4 w-4 mr-1" />
              Voir détails
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAction("contact")}>
              <MessageSquare className="h-4 w-4 mr-1" />
              Contacter
            </Button>
            {viewAnalysisButton}
          </>
        )
      default:
        return (
          <>
            <Button size="sm" variant="outline" onClick={() => router.push(`/owner/applications/${application.id}`)}>
              <Eye className="h-4 w-4 mr-1" />
              Voir détails
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAction("contact")}>
              <MessageSquare className="h-4 w-4 mr-1" />
              Contacter
            </Button>
            {viewAnalysisButton}
          </>
        )
    }
  }

  return (
    <Card className={`overflow-hidden transition-all ${isSelected ? "border-blue-500 shadow-md" : ""}`}>
      <CardContent className="p-0">
        <div className="p-4 flex justify-between items-start">
          <div className="flex items-center gap-3">
            {onSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => onSelect(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
            )}
            <div>
              <h3 className="font-medium">
                <Link
                  href={`/owner/applications/${application.id}`}
                  className="hover:text-blue-600 transition-colors underline"
                >
                  {application.tenant.first_name} {application.tenant.last_name}
                </Link>
              </h3>
              <p className="text-sm text-muted-foreground">{application.tenant.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <CircularScore
              score={calculatedScore}
              loading={scoreLoading}
              showDetails={false}
              breakdown={scoreBreakdown}
              recommendations={scoreRecommendations}
              warnings={scoreWarnings}
              compatible={scoreCompatible}
              modelUsed={modelUsed}
              size="sm"
            />
          </div>
        </div>

        <div className="px-4 pb-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div className="flex items-center gap-1">
            <Building className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="truncate">{application.property.title}</span>
          </div>
          <div className="flex items-center gap-1">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{application.profession}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{formatDate(application.created_at)}</span>
          </div>
          <div className="flex items-center gap-1">
            {application.has_guarantor ? (
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
            )}
            <span>{application.has_guarantor ? "Avec garant" : "Sans garant"}</span>
          </div>
        </div>

        {expanded && (
          <div className="px-4 py-2 bg-gray-50 border-t text-sm">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <p className="text-muted-foreground">Revenus</p>
                <p className="font-medium">{formatAmount(application.income)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Téléphone</p>
                <p>{application.tenant.phone || "Non renseigné"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Adresse du bien</p>
                <p className="truncate">{application.property.address}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Documents</p>
                <p>
                  {application.documents_complete ? (
                    <span className="flex items-center">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1" /> Complets
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-500 mr-1" /> Incomplets
                    </span>
                  )}
                </p>
              </div>
              {application.property.price && (
                <div>
                  <p className="text-muted-foreground">Ratio revenus/loyer</p>
                  <p className="font-medium">
                    {application.income && application.property.price
                      ? `${(application.income / application.property.price).toFixed(1)}x`
                      : "N/A"}
                  </p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Type de contrat</p>
                <p className="font-medium">{application.contract_type || "Non spécifié"}</p>
              </div>
            </div>

            {/* Affichage du breakdown détaillé si disponible */}
            {scoreBreakdown && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium mb-2 text-sm">Détail du score</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(scoreBreakdown).map(([key, item]: [string, any]) => (
                    <div key={key} className="flex justify-between">
                      <span className="capitalize">{key.replace("_", " ")}:</span>
                      <span className="font-medium">
                        {item.score}/{item.max}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="px-4 py-3 border-t flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="text-muted-foreground">
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" /> Moins de détails
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" /> Plus de détails
              </>
            )}
          </Button>

          <div className="flex gap-2">{getActionButtons()}</div>
        </div>
      </CardContent>
    </Card>
  )
}
