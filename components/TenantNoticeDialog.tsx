"use client"

import { useMemo, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Download } from "lucide-react"

interface TenantNoticeDialogProps {
  isOpen: boolean
  onClose: () => void
  leaseId: string
  isTenseZone?: boolean
  defaultMonths?: 1 | 2 | 3
  onSent: (notice: any) => void
}

export function TenantNoticeDialog({ isOpen, onClose, leaseId, isTenseZone = true, defaultMonths, onSent }: TenantNoticeDialogProps) {
  const [months, setMonths] = useState<1 | 2 | 3>(defaultMonths || (isTenseZone ? 1 : 3))
  const [confirm, setConfirm] = useState(false)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const infoText = useMemo(() => {
    return isTenseZone
      ? "Le logement est en zone tendue. Le préavis applicable est d'un mois."
      : "Le logement n'est pas en zone tendue. Le préavis applicable est de trois mois (sauf cas de réduction légale)."
  }, [isTenseZone])

  const handleGeneratePreview = async () => {
    try {
      const { supabase } = await import("@/lib/supabase")
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
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
      const data = await res.json()
      setPreviewHtml(data.letterHtml)
      onSent(data.notice)
    } catch (e) {
      // Fallback: rien
    }
  }

  const handleConfirmSend = async () => {
    if (!confirm) return
    try {
      setSending(true)
      const { supabase } = await import("@/lib/supabase")
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
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
      const data = await res.json()
      onSent(data.notice)
      onClose()
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
          <DialogTitle>Confirmer l'envoi du préavis</DialogTitle>
          <DialogDescription>
            {infoText}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Durée de préavis</Label>
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

          <div className="space-y-2">
            <Label>Prévisualisation du courrier</Label>
            <div className="bg-gray-50 border rounded p-3 max-h-72 overflow-auto">
              {previewHtml ? (
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: previewHtml }} />
              ) : (
                <div className="text-sm text-gray-600">Cliquez sur "Générer l'aperçu" pour voir le courrier.</div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleGeneratePreview}>Générer l'aperçu</Button>
              <Button variant="outline" onClick={handleDownload} disabled={!previewHtml}>
                <Download className="h-4 w-4 mr-2" /> Télécharger
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="confirm" checked={confirm} onCheckedChange={(v) => setConfirm(!!v)} />
            <Label htmlFor="confirm">Je confirme vouloir envoyer ce préavis à mon propriétaire</Label>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleConfirmSend} disabled={!confirm || sending}>
            {sending ? "Envoi..." : "Envoyer au propriétaire"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


