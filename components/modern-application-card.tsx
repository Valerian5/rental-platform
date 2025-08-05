"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CircularScore } from "@/components/circular-score"
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
import { useScoringEventBus } from "@/lib/scoring-event-bus"

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
  const router = useRouter()
  const eventBus = useScoringEventBus()

  const [scoreBreakdown, setScoreBreakdown] = useState<any>(null)
  const [scoreRecommendations, setScoreRecommendations] = useState<string[]>([])
  const [scoreWarnings, setScoreWarnings] = useState<string[]>([])
  const [scoreCompatible, setScoreCompatible] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    if (application.property?.owner_id) {
      calculateCustomScore()
    }
  }, [application, application.property?.owner_id])

  // Écouter les événements de l'Event Bus
  useEffect(() => {
    if (!application.property?.owner_id) return

    const unsubscribePreferences = eventBus.subscribe("preferences-updated", (event) => {
      if (event.ownerId === application.property.owner_id) {
        console.log("🔄 Préférences mises à jour, recalcul du score pour:", application.id)
        calculateCustomScore()
      }
    })

    const unsubscribeScore = eventBus.subscribe("score-calculated", (event) => {
      if (event.data.applicationId === application.id) {
        setCalculatedScore(event.data.score)
      }
    })

    return () => {
      unsubscribePreferences()
      unsubscribeScore()
    }
  }, [application.id, application.property?.owner_id])

  const calculateCustomScore = async () => {
    if (!application.property?.owner_id || !application.property?.price) {
      return
    }

    try {
      setScoreLoading(true)

      const applicationData = {
        income: application.income,
        guarantor_income: rentalFile?.guarantor_income,
        has_guarantor: application.has_guarantor || rentalFile?.has_guarantor,
        guarantor_type: rentalFile?.guarantor_type || "individual",
        profession: application.profession,
        contract_type: rentalFile?.contract_type || "cdi",
        professional_experience_months: rentalFile?.professional_experience_months || 0,
        trial_period: rentalFile?.trial_period || false,
        file_completion: rentalFile?.completion_percentage || 70,
        has_verified_documents: rentalFile?.has_verified_documents || false,
        documents_complete: application.documents_complete,
        presentation: rentalFile?.presentation || "",
        message: application.message || "",
      }

      // Utiliser l'Event Bus pour le calcul
      const score = await eventBus.calculateScore(
        application.id,
        applicationData,
        application.property,
        application.property.owner_id,
      )

      setCalculatedScore(score)

      // Optionnel : récupérer les détails via API pour l'affichage
      try {
        const response = await fetch("/api/calculate-score", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
          body: JSON.stringify({
            application: applicationData,
            property: {
              price: application.property.price,
            },
            owner_id: application.property.owner_id,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setScoreBreakdown(data.breakdown)
          setScoreRecommendations(data.recommendations || [])
          setScoreWarnings(data.warnings || [])
          setScoreCompatible(data.compatible)
        }
      } catch (error) {
        console.error("Erreur récupération détails score:", error)
      }
    } catch (error) {
      console.error("Erreur calcul score:", error)
      setCalculatedScore(application.match_score)
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
              showDetails={true}
              breakdown={scoreBreakdown}
              recommendations={scoreRecommendations}
              warnings={scoreWarnings}
              compatible={scoreCompatible}
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
            </div>
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
