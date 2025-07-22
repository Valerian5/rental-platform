import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, Mail, Phone, Euro, Calendar, FileText } from "lucide-react"
import Link from "next/link"

interface Application {
  id: string
  tenant_id: string
  property_id: string
  status: string
  message: string
  income: number
  profession: string
  has_guarantor: boolean
  created_at: string
  tenant?: {
    name: string
    email: string
    phone: string
  }
  property?: {
    title: string
    address: string
  }
}

interface ApplicationCardProps {
  application: Application
}

export default function ApplicationCard({ application }: ApplicationCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "withdrawn":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "En attente"
      case "approved":
        return "Approuvée"
      case "rejected":
        return "Refusée"
      case "withdrawn":
        return "Retirée"
      default:
        return status
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
          <CardTitle className="text-base sm:text-lg font-semibold truncate">
            Candidature #{application.id.slice(0, 8)}
          </CardTitle>
          <Badge className={`${getStatusColor(application.status)} text-xs whitespace-nowrap`}>
            {getStatusText(application.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {application.property && (
          <div className="p-3 bg-gray-50 rounded-md">
            <h4 className="font-medium text-sm truncate">{application.property.title}</h4>
            <p className="text-xs text-gray-600 truncate">{application.property.address}</p>
          </div>
        )}

        <div className="space-y-2">
          {application.tenant && (
            <>
              <div className="flex items-center text-sm min-w-0">
                <User className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                <span className="font-medium truncate">{application.tenant.name}</span>
              </div>

              <div className="flex items-center text-sm text-gray-600 min-w-0">
                <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{application.tenant.email}</span>
              </div>

              {application.tenant.phone && (
                <div className="flex items-center text-sm text-gray-600 min-w-0">
                  <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{application.tenant.phone}</span>
                </div>
              )}
            </>
          )}

          <div className="flex items-center text-sm text-gray-600">
            <Euro className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">Revenus: {application.income?.toLocaleString()} €/mois</span>
          </div>

          {application.profession && (
            <div className="flex items-center text-sm text-gray-600 min-w-0">
              <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">{application.profession}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {application.has_guarantor && (
              <Badge variant="outline" className="text-xs">
                Avec garant
              </Badge>
            )}
            <div className="flex items-center text-xs text-gray-500">
              <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="whitespace-nowrap">
                Reçue le {new Date(application.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {application.message && (
          <div className="p-2 bg-gray-50 rounded text-sm">
            <p className="line-clamp-2 break-words">{application.message}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button asChild size="sm" className="w-full sm:w-auto">
            <Link href={`/owner/applications/${application.id}`}>Examiner</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
