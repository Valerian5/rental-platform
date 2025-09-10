// components/CautionnementSection.tsx
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import n2words from "n2words"

interface Props {
  leaseId: string
  leaseData: any
  defaultGuarantor?: {
    firstName?: string
    lastName?: string
    birthDate?: string
    birthPlace?: string
    address?: string
    email?: string
  }
}

export function CautionnementSection({ leaseId, leaseData, defaultGuarantor }: Props) {
  const [guarantor, setGuarantor] = useState({
    firstName: defaultGuarantor?.firstName || "",
    lastName: defaultGuarantor?.lastName || "",
    birthDate: defaultGuarantor?.birthDate || "",
    birthPlace: defaultGuarantor?.birthPlace || "",
    address: defaultGuarantor?.address || "",
    email: defaultGuarantor?.email || "",
  })
  const [options, setOptions] = useState({
    caution_type: "solidaire", // "simple" | "solidaire"
    engagement_type: "indeterminee", // "indeterminee" | "determinee"
    engagement_precision: "",
    rent_revision_date: "",
    lieu_signature: "",
    max_amount: "",
  })
  const [loading, setLoading] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Préremplir date de révision avec la date d'entrée
  useEffect(() => {
    try {
      const defaultRevisionDate = leaseData?.date_prise_effet || ""
      setOptions(prev => ({
        ...prev,
        rent_revision_date: prev.rent_revision_date || (defaultRevisionDate ? String(defaultRevisionDate).slice(0, 10) : ""),
      }))
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refreshPreview = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/leases/${leaseId}/cautionnement/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guarantor, leaseData, options }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Erreur preview")
      }
      const html = await res.text()
      const blob = new Blob([html], { type: "text/html" })
      const url = URL.createObjectURL(blob)
      if (iframeRef.current) iframeRef.current.src = url
    } catch (e: any) {
      console.error(e)
      toast.error(e.message || "Erreur lors du rendu de l'aperçu")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      refreshPreview()
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guarantor, options, leaseData])

  const downloadPdf = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/leases/${leaseId}/generate-cautionnement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guarantor, leaseData, options }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Erreur PDF")
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `acte-de-cautionnement-${leaseId}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success("PDF téléchargé")
    } catch (e: any) {
      console.error(e)
      toast.error(e.message || "Erreur téléchargement PDF")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const preloadGuarantor = async () => {
      try {
        const res = await fetch(`/api/leases/${leaseId}`)
        if (!res.ok) return
        const data = await res.json()
        const rf = data?.rental_file
        const g = Array.isArray(rf?.guarantors) ? rf.guarantors.find((x: any) => x?.personal_info) : null
        const p = g?.personal_info || null
        if (!p) return

        // Ne pas écraser si l’utilisateur a déjà saisi
        setGuarantor(prev => ({
          firstName: prev.firstName || p.first_name || "",
          lastName: prev.lastName || p.last_name || "",
          birthDate: prev.birthDate || p.birth_date || "",
          birthPlace: prev.birthPlace || p.birth_place || "",
          address: prev.address || [p.address, p.postal_code, p.city].filter(Boolean).join(", "),
          email: prev.email || p.email || "",
        }))

        // Préremplir lieu de signature si vide
        setOptions(prev => ({ ...prev, lieu_signature: prev.lieu_signature || (data?.lease?.ville_signature || "") }))
      } catch {}
    }
    preloadGuarantor()
  }, [leaseId])

  // Calcul du montant max = loyer * 12 * durée
  const computedMaxAmount = useMemo(() => {
    const monthly = Number(leaseData?.montant_loyer_mensuel || leaseData?.monthly_rent || 0)
    const duree = Number(leaseData?.duree_contrat || 0)
    if (!monthly || !duree) return 0
    return monthly * 12 * duree
  }, [leaseData])

  const maxAmountNumber = useMemo(() => {
    const manual = Number(options.max_amount || 0)
    return manual > 0 ? manual : computedMaxAmount
  }, [options.max_amount, computedMaxAmount])

  const maxAmountLetters = useMemo(() => {
    return maxAmountNumber > 0 ? n2words(maxAmountNumber, { lang: "fr" }) : ""
  }, [maxAmountNumber])

  const sendToGuarantorForESign = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/leases/${leaseId}/cautionnement/send-for-signature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guarantor, leaseData, options }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Erreur envoi signature")
      toast.success("Envoyé au garant pour signature électronique")
    } catch (e: any) {
      console.error(e)
      toast.error(e.message || "Erreur envoi signature")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête contexte */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 rounded-md border bg-white">
          <div className="text-xs text-gray-500">Bailleur</div>
          <div className="text-sm font-medium">{leaseData?.bailleur_nom_prenom || "—"}</div>
          <div className="text-xs text-gray-600">{leaseData?.bailleur_adresse || ""}</div>
        </div>
        <div className="p-3 rounded-md border bg-white">
          <div className="text-xs text-gray-500">Logement</div>
          <div className="text-sm font-medium">{leaseData?.adresse_logement || "—"}</div>
          <div className="text-xs text-gray-600">{[leaseData?.code_postal, leaseData?.ville].filter(Boolean).join(" ")}</div>
        </div>
        <div className="p-3 rounded-md border bg-white">
          <div className="text-xs text-gray-500">Loyer mensuel</div>
          <div className="text-sm font-medium">{Number(leaseData?.montant_loyer_mensuel || leaseData?.monthly_rent || 0).toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input placeholder="Prénom garant" value={guarantor.firstName} onChange={e => setGuarantor(g => ({ ...g, firstName: e.target.value }))} />
        <Input placeholder="Nom garant" value={guarantor.lastName} onChange={e => setGuarantor(g => ({ ...g, lastName: e.target.value }))} />
        <Input type="date" placeholder="Date de naissance" value={guarantor.birthDate} onChange={e => setGuarantor(g => ({ ...g, birthDate: e.target.value }))} />
        <Input placeholder="Lieu de naissance" value={guarantor.birthPlace} onChange={e => setGuarantor(g => ({ ...g, birthPlace: e.target.value }))} />
        <Input placeholder="Adresse" value={guarantor.address} onChange={e => setGuarantor(g => ({ ...g, address: e.target.value }))} />
        <Input type="email" placeholder="Email (pour signature électronique)" value={guarantor.email} onChange={e => setGuarantor(g => ({ ...g, email: e.target.value }))} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-sm font-medium">Type de caution</label>
          <Select value={options.caution_type} onValueChange={(v) => setOptions(o => ({ ...o, caution_type: v }))}>
            <SelectTrigger><SelectValue placeholder="Type de caution" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="simple">Caution simple</SelectItem>
              <SelectItem value="solidaire">Caution solidaire</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Durée d'engagement</label>
          <Select value={options.engagement_type} onValueChange={(v) => setOptions(o => ({ ...o, engagement_type: v }))}>
            <SelectTrigger><SelectValue placeholder="Durée" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="indeterminee">Indéterminée</SelectItem>
              <SelectItem value="determinee">Déterminée</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {options.engagement_type === "determinee" ? (
          <Input
            placeholder="Préciser la durée (ex: Durée du bail et d'un renouvellement - 3 ans - Jusqu'au JJ/MM/AAAA)"
            value={options.engagement_precision}
            onChange={e => setOptions(o => ({ ...o, engagement_precision: e.target.value }))}
          />
        ) : (
          <div className="flex items-end text-sm text-gray-500">Durée indéterminée (usage: 3 ans)</div>
        )}
      </div>

      {/* Révision/Signature */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-sm font-medium">Date de révision du loyer</label>
          <Input type="date" value={options.rent_revision_date} onChange={e => setOptions(o => ({ ...o, rent_revision_date: e.target.value }))} />
        </div>
        <div>
          <label className="text-sm font-medium">Fait à</label>
          <Input placeholder="Ville de signature" value={options.lieu_signature} onChange={e => setOptions(o => ({ ...o, lieu_signature: e.target.value }))} />
        </div>
      </div>

      {/* Montant d'engagement */}
      <div className="rounded-md border p-4 bg-white">
        <div className="text-sm text-gray-600 mb-3">
          <strong>Montant de l'engagement de la caution.</strong> Ce montant est fixé librement par les parties sans minimum ou maximum. Il est d’usage d’indiquer le montant du loyer × 12 × la durée du bail.
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Montant maximum (en chiffres et en euros)</label>
            <Input type="number" min="0" value={options.max_amount || (maxAmountNumber ? String(maxAmountNumber) : "")} onChange={e => setOptions(o => ({ ...o, max_amount: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-medium">Montant maximum (en toutes lettres et en euros)</label>
            <Input value={maxAmountLetters ? `${maxAmountLetters}` : ""} onChange={() => {}} readOnly />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={refreshPreview} disabled={loading}>Aperçu</Button>
        <Button onClick={downloadPdf} disabled={loading}>Télécharger PDF</Button>
        <Button variant="secondary" onClick={sendToGuarantorForESign} disabled={loading}>Envoyer au garant (signature électronique)</Button>
      </div>

      <div className="border rounded-md overflow-hidden" style={{ height: 600 }}>
        <iframe ref={iframeRef} title="Preview acte de cautionnement" className="w-full h-full" />
      </div>
    </div>
  )
}