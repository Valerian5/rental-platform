"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { 
  Clock, 
  User, 
  Heart, 
  Star, 
  MessageSquare, 
  CheckCircle,
  AlertTriangle,
  XCircle
} from "lucide-react"

interface OwnerVisitFeedbackProps {
  visit: any
  onFeedbackSubmit: (visitId: string, feedback: any) => void
}

export function OwnerVisitFeedback({ visit, onFeedbackSubmit }: OwnerVisitFeedbackProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [feedback, setFeedback] = useState({
    punctuality: "",
    presentation: "",
    behavior: "",
    interest: "",
    generalImpression: "",
    comment: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!feedback.punctuality || !feedback.presentation || !feedback.behavior || 
        !feedback.interest || !feedback.generalImpression) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }

    setIsSubmitting(true)
    try {
      await onFeedbackSubmit(visit.id, {
        ...feedback,
        submitted_at: new Date().toISOString(),
        type: "owner_feedback"
      })
      
      toast.success("Feedback enregistré avec succès")
      setIsDialogOpen(false)
      setFeedback({
        punctuality: "",
        presentation: "",
        behavior: "",
        interest: "",
        generalImpression: "",
        comment: ""
      })
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getGeneralImpressionBadge = () => {
    if (!feedback.generalImpression) return null
    
    switch (feedback.generalImpression) {
      case "very_good":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Très bon profil</Badge>
      case "to_review":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">À revoir</Badge>
      case "not_retained":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Pas retenu</Badge>
      default:
        return null
    }
  }

  // Si la visite n'est pas terminée ou si le feedback est déjà donné, ne pas afficher
  if (visit.status !== "completed" || visit.owner_feedback) {
    return null
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-500" />
          Feedback propriétaire après visite
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Feedback après visite</DialogTitle>
              <DialogDescription>
                Évaluez le comportement et l'intérêt du candidat lors de la visite
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Ponctualité */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Ponctualité</Label>
                <Select value={feedback.punctuality} onValueChange={(value) => setFeedback({...feedback, punctuality: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="early">En avance</SelectItem>
                    <SelectItem value="on_time">À l'heure</SelectItem>
                    <SelectItem value="late">En retard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Présentation générale */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Présentation générale</Label>
                <Select value={feedback.presentation} onValueChange={(value) => setFeedback({...feedback, presentation: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="well_groomed">Soigné</SelectItem>
                    <SelectItem value="correct">Correct</SelectItem>
                    <SelectItem value="neglected">Négligé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Comportement pendant la visite */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Comportement pendant la visite</Label>
                <Select value={feedback.behavior} onValueChange={(value) => setFeedback({...feedback, behavior: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="polite_respectful">Poli et respectueux</SelectItem>
                    <SelectItem value="correct">Correct</SelectItem>
                    <SelectItem value="problematic">Problématique</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Intérêt pour le logement */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Intérêt pour le logement</Label>
                <Select value={feedback.interest} onValueChange={(value) => setFeedback({...feedback, interest: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="very_interested">Très intéressé</SelectItem>
                    <SelectItem value="interested">Intéressé</SelectItem>
                    <SelectItem value="little_interested">Peu intéressé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Impression générale */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Impression générale</Label>
                <Select value={feedback.generalImpression} onValueChange={(value) => setFeedback({...feedback, generalImpression: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="very_good">Très bon profil</SelectItem>
                    <SelectItem value="to_review">À revoir</SelectItem>
                    <SelectItem value="not_retained">Pas retenu</SelectItem>
                  </SelectContent>
                </Select>
                {getGeneralImpressionBadge()}
              </div>

              {/* Commentaire libre */}
              <div className="space-y-2">
                <Label htmlFor="comment" className="text-sm font-medium">
                  Commentaire libre (optionnel, max 250 caractères)
                </Label>
                <Textarea
                  id="comment"
                  placeholder="Ajouter une note personnelle si besoin..."
                  value={feedback.comment}
                  onChange={(e) => setFeedback({...feedback, comment: e.target.value})}
                  maxLength={250}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {feedback.comment.length}/250
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Enregistrement..." : "Enregistrer le feedback"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}