"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, CheckCircle, XCircle, ThumbsUp, ThumbsDown } from "lucide-react"

interface VisitHistorySummaryProps {
  visits: any[]
  onViewVisits: () => void
}

export function VisitHistorySummary({ visits, onViewVisits }: VisitHistorySummaryProps) {
  if (!visits || visits.length === 0) {
    return null
  }

  const completedVisits = visits.filter((v: any) => v.status === "completed")
  const upcomingVisits = visits.filter((v: any) => ["scheduled", "confirmed"].includes(v.status))
  const interestedVisits = visits.filter((v: any) => v.tenant_interest === "interested")

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "scheduled":
      case "confirmed":
        return <Clock className="h-4 w-4 text-blue-600" />
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Calendar className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: "Terminée", variant: "default" as const },
      scheduled: { label: "Programmée", variant: "outline" as const },
      confirmed: { label: "Confirmée", variant: "default" as const },
      cancelled: { label: "Annulée", variant: "destructive" as const },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Historique des visites
          <Badge variant="outline" className="ml-auto">
            {visits.length} visite{visits.length > 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Résumé des visites */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{upcomingVisits.length}</div>
            <p className="text-xs text-muted-foreground">À venir</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{completedVisits.length}</div>
            <p className="text-xs text-muted-foreground">Terminées</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">{interestedVisits.length}</div>
            <p className="text-xs text-muted-foreground">Intéressés</p>
          </div>
        </div>

        {/* Dernières visites */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Dernières visites</h4>
          {visits
            .sort((a: any, b: any) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime())
            .slice(0, 3)
            .map((visit: any) => (
              <div key={visit.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {getStatusIcon(visit.status)}
                  <div className="text-sm">
                    <p className="font-medium">
                      {visit.visit_date && new Date(visit.visit_date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                    {visit.visit_time && (
                      <p className="text-xs text-muted-foreground">{visit.visit_time}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(visit.status)}
                  {visit.tenant_interest === "interested" && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <ThumbsUp className="h-3 w-3 mr-1" />
                      Intéressé
                    </Badge>
                  )}
                  {visit.tenant_interest === "not_interested" && (
                    <Badge className="bg-red-100 text-red-800 border-red-200">
                      <ThumbsDown className="h-3 w-3 mr-1" />
                      Pas intéressé
                    </Badge>
                  )}
                </div>
              </div>
            ))}
        </div>

        <Button variant="outline" size="sm" onClick={onViewVisits} className="w-full">
          Voir toutes les visites
        </Button>
      </CardContent>
    </Card>
  )
}