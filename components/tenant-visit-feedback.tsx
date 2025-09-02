"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { 
  Heart, 
  MessageSquare, 
  CheckCircle,
  AlertTriangle,
  XCircle
} from "lucide-react"

interface TenantVisitFeedbackProps {
  visit: any
  onFeedbackSubmit: (visitId: string, feedback: any) => void
}

export function TenantVisitFeedback({ visit, onFeedbackSubmit }: TenantVisitFeedbackProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [feedback, setFeedback] = useState({
    interest: "",
    comment: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!feedback.interest) {
      toast.error("Veuillez indiquer votre intérêt")
      return
    }

    setIsSubmitting(true)
    try {
      await onFeedbackSubmit(visit.id, {
        ...feedback,
        submitted_at: new Date().toISOString(),
        type: "tenant_feedback"
      })
      
      toast.success("Feedback enregistré avec succès")
      setIsDialogOpen(false)
      setFeedback({
        interest: "",
        comment: ""
      })
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getInterestBadge = () => {
    if (!feedback.interest) return null
    
    switch (feedback.interest) {
      case "yes":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Oui, je souhaite déposer un dossier</Badge>
      case "unsure":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Pas sûr, j'hésite</Badge>
      case "no":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Non, pas intéressé</Badge>
      default:
        return null
    }
  }

  // Si la visite n'est pas terminée ou si le feedback est déjà donné, ne pas afficher
  if (visit.status !== "completed" || visit.tenant_feedback) {
    return null
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <MessageSquare className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
          Votre retour après visite
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <CheckCircle className="h-4 w-4 mr-2" />
              Visite effectuée - Donner mon avis
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Votre avis après visite</DialogTitle>
              <DialogDescription>
                Après cette visite, êtes-vous toujours intéressé(e) par ce logement ?
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Intérêt */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Votre intérêt</Label>
                <div className="space-y-2">
                  <Button
                    variant={feedback.interest === "yes" ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setFeedback({...feedback, interest: "yes"})}
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    Oui, je souhaite déposer un dossier
                  </Button>
                  <Button
                    variant={feedback.interest === "unsure" ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setFeedback({...feedback, interest: "unsure"})}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Pas sûr, j'hésite
                  </Button>
                  <Button
                    variant={feedback.interest === "no" ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setFeedback({...feedback, interest: "no"})}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Non, pas intéressé
                  </Button>
                </div>
                {getInterestBadge()}
              </div>

              {/* Commentaire libre */}
              <div className="space-y-2">
                <Label htmlFor="comment" className="text-sm font-medium">
                  Commentaire (optionnel, max 100 caractères)
                </Label>
                <Textarea
                  id="comment"
                  placeholder="Précisez la raison si besoin..."
                  value={feedback.comment}
                  onChange={(e) => setFeedback({...feedback, comment: e.target.value})}
                  maxLength={100}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {feedback.comment.length}/100
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Enregistrement..." : "Enregistrer mon avis"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}