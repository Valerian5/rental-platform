import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, XCircle, AlertCircle, Calendar, Eye, FileText, Handshake, ThumbsUp, ThumbsDown } from "lucide-react"
import { applicationStatusService } from "@/lib/application-status-service"

interface ApplicationBadgeProps {
  status: string
  className?: string
}

export function ApplicationBadge({ status, className = "" }: ApplicationBadgeProps) {
  const statusText = applicationStatusService.getStatusText(status)
  const statusColor = applicationStatusService.getStatusColor(status)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-3 w-3" />
      case "accepted":
        return <CheckCircle className="h-3 w-3" />
      case "rejected":
        return <XCircle className="h-3 w-3" />
      case "withdrawn":
        return <AlertCircle className="h-3 w-3" />
      case "under_review":
        return <FileText className="h-3 w-3" />
      case "analyzing":
        return <FileText className="h-3 w-3" />
      case "confirmed_by_tenant":
        return <CheckCircle className="h-3 w-3" />
      case "visit_scheduled":
        return <Calendar className="h-3 w-3" />
      case "visit_proposed":
        return <Calendar className="h-3 w-3" />
      case "visit_completed":
      case "visit_done":
        return <Eye className="h-3 w-3" />
      case "waiting_tenant_confirmation":
        return <Clock className="h-3 w-3" />
      case "offer_made":
        return <Handshake className="h-3 w-3" />
      case "offer_accepted":
        return <ThumbsUp className="h-3 w-3" />
      case "offer_rejected":
        return <ThumbsDown className="h-3 w-3" />
      case "lease_created":
      case "lease_signed":
        return <CheckCircle className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  return (
    <Badge 
      className={`${statusColor} ${className} flex items-center gap-1`}
      variant="secondary"
    >
      {getStatusIcon(status)}
      {statusText}
    </Badge>
  )
}

interface ApplicationStatusBadgeProps {
  hasApplied: boolean
  status?: string
  className?: string
}

export function ApplicationStatusBadge({ hasApplied, status, className = "" }: ApplicationStatusBadgeProps) {
  if (!hasApplied) {
    return null
  }

  if (!status) {
    return (
      <Badge className={`bg-blue-100 text-blue-800 ${className} flex items-center gap-1`}>
        <FileText className="h-3 w-3" />
        Dossier envoyé
      </Badge>
    )
  }

  return <ApplicationBadge status={status} className={className} />
}
