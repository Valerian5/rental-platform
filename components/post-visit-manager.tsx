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
  ThumbsUp, 
  ThumbsDown, 
  Star, 
  MessageSquare, 
  CheckCircle, 
  XCircle,
  Clock,
  User,
  Building
} from "lucide-react"

interface PostVisitManagerProps {
  visit: any
  onVisitUpdate: (visitId: string, updates: any) => void
  userType: "owner" | "tenant"
}

export function PostVisitManager({ visit, onVisitUpdate, userType }: PostVisitManagerProps) {
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false)
  const [feedbackRating, setFeedbackRating] = useState(0)
  const [feedbackComment, setFeedbackComment] = useState("")
  const [tenantInterest, setTenantInterest] = useState<"interested" | "not_interested" | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleTenantInterest = async (interest: "interested" | "not_interested") => {
    setIsProcessing(true)
    try {
      // Mettre à jour l'intérêt du locataire
      await onVisitUpdate(visit.id, { 
        tenant_interest: interest,
        status: interest === "interested" ? "interested" : "not_interested"
      })
      
      setTenantInterest(interest)
      toast.success(
        interest === "interested" 
          ? "Intérêt confirmé ! Le propriétaire sera notifié." 
          : "Désintérêt enregistré. La candidature sera retirée."
      )
    } catch (error) {
      toast.error("Erreur lors de la mise à jour")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFeedbackSubmit = async () => {
    if (feedbackRating === 0) {
      toast.error("Veuillez donner une note")
      return
    }

    setIsProcessing(true)
    try {
      await onVisitUpdate(visit.id, {
        feedback: {
          rating: feedbackRating,
          comment: feedbackComment,
          submitted_at: new Date().toISOString()
        }
      })
      
      toast.success("Feedback enregistré avec succès")
      setIsFeedbackDialogOpen(false)
      setFeedbackRating(0)
      setFeedbackComment("")
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement du feedback")
    } finally {
      setIsProcessing(false)
    }
  }

  const getInterestBadge = () => {
    if (!visit.tenant_interest) return null
    
    if (visit.tenant_interest === "interested") {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <ThumbsUp className="h-3 w-3 mr-1" />
          Intéressé
        </Badge>
      )
    }
    
    return (
      <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
        <ThumbsDown className="h-3 w-3 mr-1" />
        Pas intéressé
      </Badge>
    )
  }

  const getFeedbackBadge = () => {
    if (!visit.feedback?.rating) return null
    
    const rating = visit.feedback.rating
    let variant: "default" | "secondary" | "outline" = "outline"
    let text = `${rating}/5`
    
    if (rating >= 4) {
      variant = "default"
      text = "Super candidat"
    } else if (rating >= 3) {
      variant = "secondary"
      text = "Bon candidat"
    }
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Star className="h-3 w-3" />
        {text}
      </Badge>
    )
  }

  const canProceedToNextStep = () => {
    return visit.tenant_interest === "interested" && visit.feedback?.rating
  }

  const handleProceedToNextStep = async () => {
    setIsProcessing(true)
    try {
      await onVisitUpdate(visit.id, {
        status: "ready_for_application",
        application_status: "pending_review"
      })
      
      toast.success("Candidature transmise pour examen")
    } catch (error) {
      toast.error("Erreur lors de la transmission")
    } finally {
      setIsProcessing(false)
    }
  }

  if (visit.status === "completed") {
    return (
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            Gestion post-visite
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Statut de l'intérêt du locataire */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Intérêt du locataire :</span>
            </div>
            {getInterestBadge() || (
              <span className="text-sm text-muted-foreground">En attente</span>
            )}
          </div>

          {/* Feedback du locataire */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Feedback :</span>
            </div>
            {getFeedbackBadge() || (
              <span className="text-sm text-muted-foreground">En attente</span>
            )}
          </div>

          {/* Actions selon le type d'utilisateur */}
          {userType === "tenant" && !visit.tenant_interest && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Êtes-vous intéressé par ce bien ?</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTenantInterest("interested")}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Oui, je suis intéressé
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTenantInterest("not_interested")}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  Non, pas intéressé
                </Button>
              </div>
            </div>
          )}

          {userType === "tenant" && visit.tenant_interest === "interested" && !visit.feedback && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Donnez votre avis sur ce bien</Label>
              <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    <Star className="h-4 w-4 mr-2" />
                    Donner mon avis
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Votre avis sur la visite</DialogTitle>
                    <DialogDescription>
                      Partagez votre expérience concernant la visite de {visit.property?.title}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Comment évaluez-vous ce bien ?</Label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <Button
                            key={rating}
                            type="button"
                            variant="outline"
                            size="icon"
                            className={`h-10 w-10 ${
                              feedbackRating >= rating ? "bg-yellow-50 border-yellow-300" : ""
                            }`}
                            onClick={() => setFeedbackRating(rating)}
                          >
                            <Star
                              className={`h-5 w-5 ${
                                feedbackRating >= rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="comment">Commentaire</Label>
                      <Textarea
                        id="comment"
                        placeholder="Partagez votre impression sur ce bien..."
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        rows={4}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsFeedbackDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleFeedbackSubmit} disabled={feedbackRating === 0 || isProcessing}>
                      Envoyer mon avis
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Actions pour le propriétaire */}
          {userType === "owner" && canProceedToNextStep() && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Actions disponibles</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleProceedToNextStep}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Passer à l'étape suivante
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Building className="h-4 w-4 mr-2" />
                  Voir la candidature
                </Button>
              </div>
            </div>
          )}

          {/* Affichage du feedback si disponible */}
          {visit.feedback && (
            <div className="bg-blue-50 p-3 rounded-md">
              <div className="flex items-center mb-2">
                <p className="font-medium text-blue-800">Feedback du locataire</p>
                <div className="ml-2 flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < visit.feedback.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
              {visit.feedback.comment && (
                <p className="text-sm text-blue-700">{visit.feedback.comment}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return null
}