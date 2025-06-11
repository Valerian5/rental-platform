"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CircularScore } from "@/components/circular-score"
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
import { scoringPreferencesService } from "@/services/scoring-preferences-service"

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
  rentalFile?: any // Dossier de location associé
}

export function ModernApplicationCard({
  application,
  isSelected,
  onSelect,
  onAction,
  rentalFile,
}: ApplicationCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [calculatedScore, setCalculatedScore] = useState<number>(application.match_score)
  const [scoreLoading, setScoreLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Calculer le score personnalisé si on a un owner_id
    if (application.property?.owner_id) {
      calculateCustomScore()
    }
  }, [application, application.property?.owner_id])

  // Ajouter un interval pour vérifier les changements de préférences
  useEffect(() => {
    const interval = setInterval(() => {
      if (application.property?.owner_id) {
        calculateCustomScore()
      }
    }, 30000) // Vérifier toutes les 30 secondes

    return () => clearInterval(interval)
  }, [application.property?.owner_id])

  const calculateCustomScore = async () => {
    try {
      setScoreLoading(true)

      // Récupérer les préférences de scoring du propriétaire (uniquement le profil par défaut)
      const response = await fetch(
        `/api/scoring-preferences?owner_id=${application.property.owner_id}&default_only=true`,
        {
          // Ajouter un cache: 'no-store' pour forcer le rechargement des données
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        },
      )

      if (response.ok) {
        const data = await response.json()
        if (data.preferences && data.preferences.length > 0) {
          const preferences = data.preferences[0]
          console.log("Préférences de scoring récupérées:", preferences.name)

          // Utiliser le service pour calculer le score
          const result = scoringPreferencesService.calculateCustomScore(application, application.property, preferences)

          setCalculatedScore(Math.min(100, Math.max(0, result.totalScore)))
        } else {
          console.log("Aucune préférence par défaut trouvée, utilisation du score par défaut")
          setCalculatedScore(application.match_score)
        }
      } else {
        console.error("Erreur lors de la récupération des préférences")
        setCalculatedScore(application.match_score)
      }
    } catch (error) {
      console.error("Erreur calcul score personnalisé:", error)
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
    // Bouton "Voir dossier complet" - toujours disponible si un dossier de location existe
    const viewRentalFileButton = rentalFile ? (
      <Button size="sm" variant="outline" onClick={() => onAction("view_rental_file")}>
        <FileText className="h-4 w-4 mr-1" />
        Voir dossier complet
      </Button>
    ) : null

    // Bouton "Voir analyse" - disponible pour certains statuts
    const viewAnalysisButton = ["visit_scheduled", "accepted", "approved", "rejected"].includes(application.status) ? (
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          router.push(`/owner/applications/${application.id}`)
        }}
      >
        <BarChart3 className="h-4 w-4 mr-1" />
        Voir analyse
      </Button>
    ) : null

    // Définir les actions disponibles en fonction du statut
    switch (application.status) {
      case "pending":
        return (
          <>
            <Button size="sm" variant="default" onClick={() => onAction("analyze")}>
              <Eye className="h-4 w-4 mr-1" />
              Analyser le dossier
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAction("contact")}>
              <MessageSquare className="h-4 w-4 mr-1" />
              Contacter
            </Button>
            {viewRentalFileButton}
          </>
        )
      case "analyzing":
        return (
          <>
            <Button size="sm" variant="default" onClick={() => onAction("propose_visit")}>
              <Calendar className="h-4 w-4 mr-1" />
              Proposer une visite
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onAction("refuse")}>
              <XCircle className="h-4 w-4 mr-1" />
              Refuser
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAction("contact")}>
              <MessageSquare className="h-4 w-4 mr-1" />
              Contacter
            </Button>
            {viewRentalFileButton}
          </>
        )
      case "visit_scheduled":
        return (
          <>
            <Button size="sm" variant="default" onClick={() => onAction("accept")}>
              <CheckCircle className="h-4 w-4 mr-1" />
              Accepter le dossier
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onAction("refuse")}>
              <XCircle className="h-4 w-4 mr-1" />
              Refuser
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAction("contact")}>
              <MessageSquare className="h-4 w-4 mr-1" />
              Contacter
            </Button>
            {viewRentalFileButton}
            {viewAnalysisButton}
          </>
        )
      case "waiting_tenant_confirmation":
        return (
          <>
            <Button size="sm" variant="outline" disabled>
              <Clock className="h-4 w-4 mr-1" />
              En attente du locataire
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAction("contact")}>
              <MessageSquare className="h-4 w-4 mr-1" />
              Contacter
            </Button>
            {viewRentalFileButton}
            {viewAnalysisButton}
          </>
        )
      case "accepted":
      case "approved":
        return (
          <>
            <Button size="sm" variant="default" onClick={() => onAction("generate_lease")}>
              <FileText className="h-4 w-4 mr-1" />
              Générer le bail
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAction("contact")}>
              <MessageSquare className="h-4 w-4 mr-1" />
              Contacter
            </Button>
            {viewRentalFileButton}
            {viewAnalysisButton}
          </>
        )
      case "rejected":
        return (
          <>
            <Button size="sm" variant="outline" onClick={() => onAction("view_details")}>
              <Eye className="h-4 w-4 mr-1" />
              Voir détails
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAction("contact")}>
              <MessageSquare className="h-4 w-4 mr-1" />
              Contacter
            </Button>
            {viewRentalFileButton}
            {viewAnalysisButton}
          </>
        )
      default:
        return (
          <>
            <Button size="sm" variant="outline" onClick={() => onAction("view_details")}>
              <Eye className="h-4 w-4 mr-1" />
              Voir détails
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAction("contact")}>
              <MessageSquare className="h-4 w-4 mr-1" />
              Contacter
            </Button>
            {viewRentalFileButton}
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
                {application.tenant.first_name} {application.tenant.last_name}
              </h3>
              <p className="text-sm text-muted-foreground">{application.tenant.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <CircularScore score={calculatedScore} loading={scoreLoading} />
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
