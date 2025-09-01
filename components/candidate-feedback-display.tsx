"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react"

interface CandidateFeedbackDisplayProps {
  visits: any[]
}

export function CandidateFeedbackDisplay({ visits }: CandidateFeedbackDisplayProps) {
  const completedVisits = visits?.filter((v: any) => v.status === "completed") || []
  const feedbacks = completedVisits.filter((v: any) => v.feedback)
  const interestedVisits = completedVisits.filter((v: any) => v.tenant_interest === "interested")

  if (completedVisits.length === 0) {
    return null
  }

  const getFeedbackBadge = (rating: number) => {
    if (rating >= 4) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Super candidat</Badge>
    } else if (rating >= 3) {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Bon candidat</Badge>
    } else {
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Candidat moyen</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Retour post-visite
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Résumé des retours */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">{interestedVisits.length}</div>
            <p className="text-xs text-muted-foreground">Intéressés</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">{feedbacks.length}</div>
            <p className="text-xs text-muted-foreground">Avis donnés</p>
          </div>
        </div>

        {/* Détail des retours */}
        {feedbacks.map((visit: any) => (
          <div key={visit.id} className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ThumbsUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Intéressé par le bien</span>
              </div>
              {visit.feedback?.rating && getFeedbackBadge(visit.feedback.rating)}
            </div>
            
            {visit.feedback?.rating && (
              <div className="flex items-center mb-2">
                <span className="text-sm text-muted-foreground mr-2">Note :</span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < visit.feedback.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-2 text-sm font-medium">({visit.feedback.rating}/5)</span>
              </div>
            )}
            
            {visit.feedback?.comment && (
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Commentaire :</p>
                <p>{visit.feedback.comment}</p>
              </div>
            )}
            
            <div className="text-xs text-muted-foreground mt-2">
              Visite du {visit.visit_date && new Date(visit.visit_date).toLocaleDateString("fr-FR")}
            </div>
          </div>
        ))}

        {completedVisits.length > 0 && feedbacks.length === 0 && (
          <div className="text-center py-4">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Aucun feedback reçu pour les visites terminées
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}