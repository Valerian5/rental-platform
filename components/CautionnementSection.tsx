// components/CautionnementSection.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

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
  })
  const [loading, setLoading] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

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
    <div className="space-y-4">
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
        {options.engagement_type === "determinee" && (
          <Input
            placeholder="Préciser la durée (ex: Durée du bail et d'un renouvellement - 3 ans - Jusqu'au JJ/MM/AAAA)"
            value={options.engagement_precision}
            onChange={e => setOptions(o => ({ ...o, engagement_precision: e.target.value }))}
          />
        )}
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