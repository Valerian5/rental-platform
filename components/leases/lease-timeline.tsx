import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, PenTool, Euro, Calendar, AlertCircle, CheckCircle } from "lucide-react"

interface TimelineEvent {
  id: string
  date: string
  type: "created" | "signed" | "payment" | "renewal" | "termination"
  description: string
  user: string
}

interface LeaseTimelineProps {
  timeline: TimelineEvent[]
}

const eventConfig = {
  created: { icon: FileText, color: "bg-blue-100 text-blue-800", iconColor: "text-blue-600" },
  signed: { icon: PenTool, color: "bg-green-100 text-green-800", iconColor: "text-green-600" },
  payment: { icon: Euro, color: "bg-purple-100 text-purple-800", iconColor: "text-purple-600" },
  renewal: { icon: Calendar, color: "bg-orange-100 text-orange-800", iconColor: "text-orange-600" },
  termination: { icon: AlertCircle, color: "bg-red-100 text-red-800", iconColor: "text-red-600" },
}

export function LeaseTimeline({ timeline }: LeaseTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Historique du Bail
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timeline.map((event, index) => {
            const config = eventConfig[event.type]
            const Icon = config.icon

            return (
              <div key={event.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`p-2 rounded-full bg-white border-2 border-gray-200`}>
                    <Icon className={`h-4 w-4 ${config.iconColor}`} />
                  </div>
                  {index < timeline.length - 1 && <div className="w-px h-8 bg-gray-200 mt-2" />}
                </div>

                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={config.color}>
                      {event.type === "created" && "Création"}
                      {event.type === "signed" && "Signature"}
                      {event.type === "payment" && "Paiement"}
                      {event.type === "renewal" && "Renouvellement"}
                      {event.type === "termination" && "Résiliation"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(event.date).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{event.description}</p>
                  <p className="text-xs text-muted-foreground">Par {event.user}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
