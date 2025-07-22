import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, User, Phone } from "lucide-react"

interface Visit {
  id: string
  property_id: string
  tenant_id: string
  visit_date: string
  visit_time: string
  status: string
  notes?: string
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

interface VisitCardProps {
  visit: Visit
}

export default function VisitCard({ visit }: VisitCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "no_show":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "scheduled":
        return "Programmée"
      case "confirmed":
        return "Confirmée"
      case "completed":
        return "Terminée"
      case "cancelled":
        return "Annulée"
      case "no_show":
        return "Absent"
      default:
        return status
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const isUpcoming = () => {
    const visitDateTime = new Date(`${visit.visit_date}T${visit.visit_time}`)
    return visitDateTime > new Date() && visit.status === "scheduled"
  }

  return (
    <Card className={`hover:shadow-lg transition-shadow ${isUpcoming() ? "border-blue-200 bg-blue-50/30" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">Visite #{visit.id.slice(0, 8)}</CardTitle>
          <Badge className={getStatusColor(visit.status)}>{getStatusText(visit.status)}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {visit.property && (
          <div className="p-3 bg-white rounded-md border">
            <h4 className="font-medium text-sm">{visit.property.title}</h4>
            <div className="flex items-center text-xs text-gray-600 mt-1">
              <MapPin className="h-3 w-3 mr-1" />
              <span>{visit.property.address}</span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center text-sm font-medium">
            <Calendar className="h-4 w-4 mr-2 text-blue-500" />
            <span>{formatDate(visit.visit_date)}</span>
          </div>

          <div className="flex items-center text-sm">
            <Clock className="h-4 w-4 mr-2 text-blue-500" />
            <span>{visit.visit_time}</span>
          </div>

          {visit.tenant && (
            <>
              <div className="flex items-center text-sm">
                <User className="h-4 w-4 mr-2 text-gray-500" />
                <span className="font-medium">{visit.tenant.name}</span>
              </div>

              {visit.tenant.phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>{visit.tenant.phone}</span>
                </div>
              )}
            </>
          )}
        </div>

        {visit.notes && (
          <div className="p-2 bg-gray-50 rounded text-sm">
            <p className="line-clamp-2">{visit.notes}</p>
          </div>
        )}

        {isUpcoming() && (
          <div className="flex gap-2 pt-2">
            <Button size="sm" className="flex-1">
              Confirmer
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              Reporter
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}