"use client"

import { useMemo, useState, useRef, useEffect } from "react"
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
  const [signatureMode, setSignatureMode] = useState<"online" | "upload">("online")
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isDrawingRef = useRef(false)

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

  // Canvas signature pad when online mode
  useEffect(() => {
    if (step !== 3 || signatureMode !== "online") return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.lineWidth = 2
    ctx.strokeStyle = "#111827"

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect()
      if (e instanceof TouchEvent) {
        const t = e.touches[0]
        return { x: t.clientX - rect.left, y: t.clientY - rect.top }
      }
      const m = e as MouseEvent
      return { x: m.clientX - rect.left, y: m.clientY - rect.top }
    }

    const onDown = (e: any) => {
      isDrawingRef.current = true
      const { x, y } = getPos(e)
      ctx.beginPath()
      ctx.moveTo(x, y)
    }
    const onMove = (e: any) => {
      if (!isDrawingRef.current) return
      const { x, y } = getPos(e)
      ctx.lineTo(x, y)
      ctx.stroke()
    }
    const onUp = () => {
      if (!isDrawingRef.current) return
      isDrawingRef.current = false
      try {
        setSignatureDataUrl(canvas.toDataURL("image/png"))
      } catch {}
    }

    canvas.addEventListener("mousedown", onDown)
    canvas.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    canvas.addEventListener("touchstart", onDown, { passive: true } as any)
    canvas.addEventListener("touchmove", onMove, { passive: true } as any)
    window.addEventListener("touchend", onUp)
    return () => {
      canvas.removeEventListener("mousedown", onDown)
      canvas.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      canvas.removeEventListener("touchstart", onDown as any)
      canvas.removeEventListener("touchmove", onMove as any)
      window.removeEventListener("touchend", onUp)
    }
  }, [step, signatureMode])

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
        body: JSON.stringify({ previewOnly: true, isTenseZone, noticePeriodMonths: months, signatureDataUrl })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erreur" }))
        throw new Error(err.error || "Erreur génération du courrier")
      }
      const resp = await res.json()
      setPreviewHtml(resp.letterHtml)
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
        body: JSON.stringify({ confirm: true, isTenseZone, noticePeriodMonths: months, signatureDataUrl })
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

        {/* Stepper */}
        {step !== 4 && (
          <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
            <div className={`flex-1 text-center ${step >= 1 ? "font-semibold text-gray-800" : ""}`}>1. Infos</div>
            <div className="w-6 h-px bg-gray-300 mx-2" />
            <div className={`flex-1 text-center ${step >= 2 ? "font-semibold text-gray-800" : ""}`}>2. Document</div>
            <div className="w-6 h-px bg-gray-300 mx-2" />
            <div className={`flex-1 text-center ${step >= 3 ? "font-semibold text-gray-800" : ""}`}>3. Signature</div>
            <div className="w-6 h-px bg-gray-300 mx-2" />
            <div className={`flex-1 text-center ${step >= 4 ? "font-semibold text-gray-800" : ""}`}>4. Confirmation</div>
          </div>
        )}

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

            <div className="text-xs text-gray-600">
              Conformément à la loi, vous êtes redevable du loyer et des charges jusqu'au {legalEndDate.toLocaleDateString("fr-FR")}.
              {" "}
              <a className="underline" href="https://www.service-public.fr/particuliers/vosdroits/F1168" target="_blank" rel="noreferrer">En savoir plus</a>
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
              <Button onClick={() => setStep(2)}>Continuer</Button>
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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  // Appel en mode previewOnly: ne crée rien, ne notifie pas
                  try {
                    const { supabase } = await import("@/lib/supabase")
                    const { data: sessionData } = await supabase.auth.getSession()
                    const token = sessionData.session?.access_token
                    const headers: Record<string, string> = { "Content-Type": "application/json" }
                    if (token) headers["Authorization"] = `Bearer ${token}`
                    const res = await fetch(`/api/leases/${leaseId}/notice`, {
                      method: "POST",
                      headers,
                      body: JSON.stringify({ previewOnly: true, isTenseZone, noticePeriodMonths: months, signatureDataUrl })
                    })
                    if (!res.ok) {
                      const err = await res.json().catch(() => ({ error: "Erreur" }))
                      throw new Error(err.error || "Erreur génération de l'aperçu")
                    }
                    const resp = await res.json()
                    setPreviewHtml(resp.letterHtml)
                  } catch {
                    // noop
                  }
                }}
              >
                Générer l'aperçu
              </Button>
              <Button variant="outline" onClick={handleDownload} disabled={!previewHtml}>
                <Download className="h-4 w-4 mr-2" /> Télécharger
              </Button>
              <Button onClick={() => setStep(3)} disabled={!previewHtml}>Continuer</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Méthode de signature</Label>
              <div className="flex gap-3 text-sm">
                <label className="flex items-center gap-2">
                  <input type="radio" name="sigmode" checked={signatureMode === "online"} onChange={() => setSignatureMode("online")} />
                  Signer en ligne
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="sigmode" checked={signatureMode === "upload"} onChange={() => setSignatureMode("upload")} />
                  Téléverser un PDF signé
                </label>
              </div>
            </div>

            {signatureMode === "online" ? (
              <div className="space-y-2">
                <Label>Tracez votre signature</Label>
                <div className="border rounded bg-white">
                  <canvas ref={canvasRef} width={600} height={180} className="w-full h-40 touch-none" />
                </div>
                <div className="flex gap-2 text-xs">
                  <Button variant="outline" onClick={() => { const c = canvasRef.current; if (c) { const ctx = c.getContext("2d"); if (ctx) { ctx.clearRect(0,0,c.width,c.height); setSignatureDataUrl(null) } } }}>Effacer</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>PDF signé</Label>
                <input type="file" accept="application/pdf" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
                <div className="text-xs text-gray-600">Optionnel: si vous préférez signer hors ligne, téléversez votre PDF signé.</div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Checkbox id="confirm" checked={confirm} onCheckedChange={(v) => setConfirm(!!v)} />
              <Label htmlFor="confirm">Je confirme vouloir notifier la résiliation de mon bail</Label>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={async () => {
                // Au retour vers l'étape 2, régénérer l'aperçu avec signature si disponible
                try {
                  const { supabase } = await import("@/lib/supabase")
                  const { data: sessionData } = await supabase.auth.getSession()
                  const token = sessionData.session?.access_token
                  const headers: Record<string, string> = { "Content-Type": "application/json" }
                  if (token) headers["Authorization"] = `Bearer ${token}`
                  const res = await fetch(`/api/leases/${leaseId}/notice`, {
                    method: "POST",
                    headers,
                    body: JSON.stringify({ previewOnly: true, isTenseZone, noticePeriodMonths: months, signatureDataUrl })
                  })
                  if (res.ok) {
                    const j = await res.json()
                    setPreviewHtml(j.letterHtml)
                  }
                } catch {}
                setStep(2)
              }}>Retour</Button>
              <Button onClick={handleConfirmSend} disabled={!confirm || sending}>
                {sending ? "Envoi..." : "Notifier mon départ"}
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
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✅ Préavis généré</li>
              <li>✅ Signature confirmée</li>
              <li>✅ Envoi au propriétaire</li>
              <li>⏳ En attente de validation</li>
            </ul>
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


