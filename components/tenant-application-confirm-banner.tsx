"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

export function TenantApplicationConfirmBanner({ applicationId, propertyTitle, ownerName }: {
  applicationId: string
  propertyTitle: string
  ownerName: string
}) {
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState<null | "accept" | "refuse">(null)

  const onDecision = async (decision: "accept" | "refuse") => {
    try {
      setLoading(decision)
      const res = await fetch(`/api/applications/${applicationId}/tenant-decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reason: decision === "refuse" ? reason : undefined }),
      })
      if (!res.ok) throw new Error()
      toast.success(decision === "accept" ? "Confirmation envoyée" : "Refus envoyé")
      window.location.reload()
    } catch {
      toast.error("Action impossible pour le moment")
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card className="border-l-4 border-l-green-500">
      <CardContent className="p-4 space-y-3">
        <p className="font-medium">
          Félicitations, votre dossier a été retenu pour “{propertyTitle}” par {ownerName}.
        </p>
        <p className="text-sm text-muted-foreground">
          Veuillez confirmer votre choix pour que le propriétaire puisse créer le bail dès maintenant.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onDecision("accept")} disabled={loading !== null} size="sm">Je confirme mon choix</Button>
          <Button variant="outline" onClick={() => onDecision("refuse")} disabled={loading !== null} size="sm">
            Refuser
          </Button>
        </div>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Motif (si vous refusez, optionnel):</p>
          <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="J'ai eu une réponse positive ailleurs..." maxLength={180} />
        </div>
      </CardContent>
    </Card>
  )
}
