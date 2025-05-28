"use client"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { CircularScore } from "./circular-score"
import { Eye, Search, CheckCircle, XCircle, MessageSquare, FileText } from "lucide-react"

interface ModernApplicationCardProps {
  application: {
    id: string
    tenant: {
      first_name: string
      last_name: string
      email: string
      phone?: string
    }
    property: {
      title: string
      address: string
    }
    profession: string
    income: number
    has_guarantor: boolean
    documents_complete: boolean
    status: string
    match_score: number
    created_at: string
  }
  isSelected: boolean
  onSelect: (selected: boolean) => void
  onAction: (action: string) => void
}

export function ModernApplicationCard({ application, isSelected, onSelect, onAction }: ModernApplicationCardProps) {
  const getInitials = () => {
    const first = application.tenant.first_name?.[0] || ""
    const last = application.tenant.last_name?.[0] || ""
    return (first + last).toUpperCase()
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return {
          label: "Nouveau",
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          message: "Analysez le dossier et proposez une visite ou refusez la candidature.",
          actions: ["analyze", "refuse", "contact"],
        }
      case "analyzing":
        return {
          label: "En cours d'analyse",
          color: "text-orange-600",
          bgColor: "bg-orange-50",
          message: "Complétez l'analyse du dossier pour prendre une décision.",
          actions: ["accept", "contact"],
        }
      case "visit_scheduled":
        return {
          label: "Visite programée",
          color: "text-purple-600",
          bgColor: "bg-purple-50",
          message: "Une visite est programmée. Vous pourrez accepter ou refuser après la visite.",
          actions: ["accept", "refuse", "contact"],
        }
      case "waiting_tenant_confirmation":
        return {
          label: "En attente d'acceptation",
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          message: "Le locataire doit confirmer son choix pour cet appartement.",
          actions: ["contact"],
        }
      case "accepted":
        return {
          label: "Candidature acceptée",
          color: "text-green-600",
          bgColor: "bg-green-50",
          message: "La candidature a été acceptée. Vous pouvez maintenant générer le bail.",
          actions: ["generate_lease", "contact"],
        }
      case "rejected":
        return {
          label: "Dossier refusé",
          color: "text-red-600",
          bgColor: "bg-red-50",
          message: "Cette candidature a été refusée.",
          actions: ["contact"],
        }
      default:
        return {
          label: status,
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          message: "",
          actions: ["contact"],
        }
    }
  }

  const statusConfig = getStatusConfig(application.status)

  const getActionButtons = () => {
    const actions = statusConfig.actions

    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction("view_details")}
          className="text-gray-600 border-gray-300"
        >
          <Eye className="h-4 w-4 mr-1" />
          Voir détails
        </Button>

        {actions.includes("analyze") && (
          <Button size="sm" onClick={() => onAction("analyze")} className="bg-blue-600 hover:bg-blue-700">
            <Search className="h-4 w-4 mr-1" />
            Analyser
          </Button>
        )}

        {actions.includes("accept") && (
          <Button size="sm" onClick={() => onAction("accept")} className="bg-blue-600 hover:bg-blue-700">
            <CheckCircle className="h-4 w-4 mr-1" />
            Accepter
          </Button>
        )}

        {actions.includes("generate_lease") && (
          <Button size="sm" onClick={() => onAction("generate_lease")} className="bg-blue-600 hover:bg-blue-700">
            <FileText className="h-4 w-4 mr-1" />
            Générer le bail
          </Button>
        )}

        {actions.includes("refuse") && (
          <Button variant="destructive" size="sm" onClick={() => onAction("refuse")}>
            <XCircle className="h-4 w-4 mr-1" />
            Refuser
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction("contact")}
          className="text-gray-600 border-gray-300"
        >
          <MessageSquare className="h-4 w-4 mr-1" />
          Contacter
        </Button>
      </div>
    )
  }

  return (
    <div
      className={`
      p-4 bg-white border border-gray-200 rounded-lg
      hover:shadow-md transition-all duration-200
      ${isSelected ? "ring-2 ring-blue-500 border-blue-500" : ""}
    `}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <Checkbox checked={isSelected} onCheckedChange={onSelect} className="flex-shrink-0 mt-1" />

        {/* Avatar */}
        <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold text-sm">{getInitials()}</span>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              {/* Name and property */}
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-semibold text-gray-900 text-base">
                  {application.tenant.first_name} {application.tenant.last_name}
                </h3>
              </div>

              <div className="text-sm text-gray-600 mb-1">{application.property.title}</div>

              <div className="text-sm text-gray-600 mb-2">{application.profession}</div>

              {/* Financial info */}
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                <span className="font-medium">{application.income.toLocaleString()}€/mois</span>
                <span className={application.has_guarantor ? "text-green-600" : "text-gray-500"}>
                  {application.has_guarantor ? "Avec garants" : "Sans garants"}
                </span>
                <span className={application.documents_complete ? "text-green-600" : "text-orange-600"}>
                  {application.documents_complete ? "Dossier complet" : "Dossier incomplet"}
                </span>
              </div>
            </div>

            {/* Score */}
            <div className="flex-shrink-0">
              <CircularScore score={application.match_score} size="md" />
            </div>
          </div>

          {/* Status and message */}
          <div className={`${statusConfig.bgColor} rounded-md px-3 py-2 mt-2 mb-3`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-sm font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
            </div>
            {statusConfig.message && <p className="text-xs text-gray-600">{statusConfig.message}</p>}
          </div>

          {/* Actions */}
          <div className="mt-2">{getActionButtons()}</div>
        </div>
      </div>
    </div>
  )
}
