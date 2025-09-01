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
  Heart,
  Users,
  Star,
  AlertTriangle,
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
    completion_percentage?: number
    message?: string
    company?: string
    scoring_breakdown?: any
    scoring_recommendations?: string[]
    scoring_warnings?: string[]
    scoring_compatible?: boolean
    scoring_model_used?: string
    rental_situation?: "alone" | "couple" | "colocation"
    visits?: any[] // Added for visits
    owner_feedback?: any // Added for owner feedback
    tenant_feedback?: any // Added for tenant feedback
  }
  isSelected?: boolean
  onSelect?: (selected: boolean) => void
  onAction: (action: string) => void
  scoringPreferences?: any
}

export function ModernApplicationCard({
  application,
  isSelected,
  onSelect,
  onAction,
  scoringPreferences,
}: ApplicationCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [calculatedScore, setCalculatedScore] = useState<number>(application.match_score)
  const router = useRouter()

  // Utiliser les scores déjà calculés depuis la page parent
  useEffect(() => {
    if (application.match_score !== undefined) {
      setCalculatedScore(application.match_score)
    }
  }, [application])

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

  const getRentalSituationInfo = () => {
    if (!application.rental_situation) return null

    switch (application.rental_situation) {
      case "alone":
        return (
          <div className="flex items-center gap-1">
            <User className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-sm text-slate-600">Seul(e)</span>
          </div>
        )
      case "couple":
        return (
          <div className="flex items-center gap-1">
            <Heart className="h-3.5 w-3.5 text-pink-500" />
            <span className="text-sm text-pink-700 font-medium">En couple</span>
          </div>
        )
      case "colocation":
        return (
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-sm text-blue-700 font-medium">Colocation</span>
          </div>
        )
      default:
        return null
    }
  }

  const getActionButtons = () => {
    switch (application.status) {
      case "pending":
        return (
          <>
            <Button size="sm" variant="default" onClick={() => router.push(`/owner/applications/${application.id}`)}>
              <Eye className="h-4 w-4 mr-1" />
              Voir analyse
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
            <CircularScore score={calculatedScore} loading={false} showDetails={false} size="sm" />
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
          {getRentalSituationInfo() || (
            <div className="flex items-center gap-1">
              {application.has_guarantor ? (
                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
              )}
              <span>{application.has_guarantor ? "Avec garant" : "Sans garant"}</span>
            </div>
          )}
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
              {application.has_guarantor && (
                <div>
                  <p className="text-muted-foreground">Garants</p>
                  <p className="flex items-center">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1" />
                    <span>Avec garant</span>
                  </p>
                </div>
              )}
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

        {/* Badges de feedback des visites */}
        {application.visits && application.visits.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {/* Badge propriétaire */}
            {application.visits.some((v: any) => v.owner_feedback?.generalImpression === "very_good") && (
              <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                <Star className="h-3 w-3 mr-1" />
                Très bon profil
              </Badge>
            )}
            {application.visits.some((v: any) => v.owner_feedback?.generalImpression === "to_review") && (
              <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                À revoir
              </Badge>
            )}
            {application.visits.some((v: any) => v.owner_feedback?.generalImpression === "not_retained") && (
              <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                <XCircle className="h-3 w-3 mr-1" />
                Pas retenu
              </Badge>
            )}
            
            {/* Badge locataire */}
            {application.visits.some((v: any) => v.tenant_feedback?.interest === "yes") && (
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                <Heart className="h-3 w-3 mr-1" />
                Intéressé
              </Badge>
            )}
            {application.visits.some((v: any) => v.tenant_feedback?.interest === "no") && (
              <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                <XCircle className="h-3 w-3 mr-1" />
                Pas intéressé
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
