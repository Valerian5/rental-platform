"use client"

import { useMemo, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Download, CheckCircle, FileText, Calendar, MapPin } from "lucide-react"

interface TenantNoticeDialogProps {
  isOpen: boolean
  onClose: () => void
  leaseId: string
  onSent: (notice: any) => void
  // Contexte d'affichage
  propertyTitle?: string
  propertyAddress?: string
  leaseStartDate?: string
  leaseType?: string // unfurnished | furnished | commercial
  isTenseZone?: boolean
  defaultMonths?: 1 | 2 | 3
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  const day = d.getDate()
  d.setMonth(d.getMonth() + months)
  if (d.getDate() < day) d.setDate(0)
  return d
}

export function TenantNoticeDialog({
  isOpen,
  onClose,
  leaseId,
  onSent,
  propertyTitle,
  propertyAddress,
  leaseStartDate,
  leaseType,
  isTenseZone = true,
  defaultMonths,
}: TenantNoticeDialogProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [months, setMonths] = useState<1 | 2 | 3>(defaultMonths || (isTenseZone ? 1 : 3))
  const [confirm, setConfirm] = useState(false)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [desiredMoveOut, setDesiredMoveOut] = useState<string>("")

  const infoText = useMemo(() => {
    const furnished = leaseType === "furnished"
    // Règle simple: meublé => 1 mois, vide => zone tendue 1, sinon 3
    const computed = furnished ? 1 : (isTenseZone ? 1 : 3)
    return `Préavis légal estimé: ${computed} mois${furnished ? " (logement meublé)" : isTenseZone ? " (zone tendue)" : ""}.`
  }, [isTenseZone, leaseType])

  const legalEndDate = useMemo(() => {
    const start = new Date()
    return addMonths(start, months)
  }, [months])

  const handleGeneratePreview = async () => {
    try {
      const { supabase } = await import("@/lib/supabase")
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (token) headers["Authorization"] = `Bearer ${token}`

      const res = await fetch(`/api/leases/${leaseId}/notice`, {
        method: "POST",
        headers,
        body: JSON.stringify({ confirm: true, isTenseZone, noticePeriodMonths: months })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erreur" }))
        throw new Error(err.error || "Erreur génération du courrier")
      }
      const resp = await res.json()
      setPreviewHtml(resp.letterHtml)
      onSent(resp.notice)
      setStep(2)
    } catch (e) {
      // Fallback: rien
    }
  }

  const handleConfirmSend = async () => {
    if (!confirm) return
    try {
      setSending(true)
      const { supabase } = await import("@/lib/supabase")
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (token) headers["Authorization"] = `Bearer ${token}`

      const res = await fetch(`/api/leases/${leaseId}/notice`, {
        method: "POST",
        headers,
        body: JSON.stringify({ confirm: true, isTenseZone, noticePeriodMonths: months })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erreur" }))
        throw new Error(err.error || "Erreur envoi préavis")
      }
      const resp = await res.json()
      onSent(resp.notice)
      setStep(4)
    } catch (e) {
      // TODO: gérer erreurs via toast externe
    } finally {
      setSending(false)
    }
  }

  const handleDownload = () => {
    if (!previewHtml) return
    const blob = new Blob([previewHtml], { type: "text/html;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `preavis-${leaseId}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && "Quitter le logement"}
            {step === 2 && "Prévisualisation du courrier"}
            {step === 3 && "Signature et confirmation"}
            {step === 4 && "Préavis envoyé"}
          </DialogTitle>
          {step !== 4 && (
            <DialogDescription>{infoText}</DialogDescription>
          )}
        </DialogHeader>

        {/* Steps content */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded border">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <MapPin className="h-4 w-4" />
                <span className="font-medium">{propertyTitle || "Votre logement"}</span>
              </div>
              <div className="text-sm text-gray-600 ml-6">{propertyAddress}</div>
              {leaseStartDate && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1 ml-6">
                  <Calendar className="h-4 w-4" />
                  Entrée dans le logement: {new Date(leaseStartDate).toLocaleDateString("fr-FR")}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Date de départ souhaitée</Label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2"
                value={desiredMoveOut}
                onChange={(e) => setDesiredMoveOut(e.target.value)}
              />
            </div>

            <div className="text-sm text-gray-700">
              Votre préavis est de <strong>{months} mois</strong>. La date de fin effective estimée est le
              {" "}
              <strong>{legalEndDate.toLocaleDateString("fr-FR")}</strong>.
            </div>

            <div className="space-y-2">
              <Label>Durée de préavis (ajustable si motif)</Label>
              <Select value={String(months)} onValueChange={(v) => setMonths(Number(v) as 1 | 2 | 3)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 mois</SelectItem>
                  <SelectItem value="2">2 mois</SelectItem>
                  <SelectItem value="3">3 mois</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={onClose}>Annuler</Button>
              <Button onClick={handleGeneratePreview}>Notifier mon départ</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4" /> Aperçu du courrier
            </div>
            <div className="bg-gray-50 border rounded p-3 max-h-72 overflow-auto">
              {previewHtml ? (
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: previewHtml }} />
              ) : (
                <div className="text-sm text-gray-600">Le document sera généré automatiquement.</div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownload} disabled={!previewHtml}>
                <Download className="h-4 w-4 mr-2" /> Télécharger
              </Button>
              <Button onClick={() => setStep(3)}>Continuer</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="text-sm text-gray-700">
              Signature électronique simplifiée. Cochez la case ci-dessous pour confirmer votre intention.
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="confirm" checked={confirm} onCheckedChange={(v) => setConfirm(!!v)} />
              <Label htmlFor="confirm">Je confirme vouloir notifier la résiliation de mon bail</Label>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>Retour</Button>
              <Button onClick={handleConfirmSend} disabled={!confirm || sending}>
                {sending ? "Envoi..." : "Valider et envoyer au propriétaire"}
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">Votre préavis a été envoyé au propriétaire.</span>
            </div>
            <div className="text-sm text-gray-700">
              Date d'envoi: {new Date().toLocaleDateString("fr-FR")}<br />
              Date de fin effective estimée: <strong>{legalEndDate.toLocaleDateString("fr-FR")}</strong>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownload} disabled={!previewHtml}>
                <Download className="h-4 w-4 mr-2" /> Télécharger le document
              </Button>
              <Button onClick={onClose}>Fermer</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}


