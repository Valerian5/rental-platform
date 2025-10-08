"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Euro, FileText, Info, PlusCircle, Trash, Download, Mail, Save } from "lucide-react"
import { toast } from "sonner"

type RetentionCategory = "degradations" | "unpaid_rent" | "charges" | "provisional_charges" | "other"

interface RetentionLine {
  id: string
  category: RetentionCategory
  description: string
  amount: number
  attachmentUrl?: string
  attachmentName?: string
}

interface ProvisionalCharges {
  amount: number
  justificationNotes: string
  expectedFinalizationDate: string
  supportingDocuments: string[]
}

interface Props {
  leaseId: string
  depositAmount: number
  moveOutDate?: string
  moveOutHasDifferences?: boolean
}

export function DepositRetentionManager({ leaseId, depositAmount, moveOutDate, moveOutHasDifferences }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [lines, setLines] = useState<RetentionLine[]>([])
  const [iban, setIban] = useState("")
  const [bic, setBic] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [saving, setSaving] = useState(false)
  const [provisionalCharges, setProvisionalCharges] = useState<ProvisionalCharges>({
    amount: 0,
    justificationNotes: "",
    expectedFinalizationDate: "",
    supportingDocuments: []
  })
  const [hasProvisionalCharges, setHasProvisionalCharges] = useState(false)

  const deadlineDays = useMemo(() => (moveOutHasDifferences ? 60 : 30), [moveOutHasDifferences])

  const totalRetained = useMemo(() => {
    const linesTotal = lines.reduce((s, l) => s + (Number.isFinite(l.amount) ? l.amount : 0), 0)
    const provisionalTotal = hasProvisionalCharges ? provisionalCharges.amount : 0
    return linesTotal + provisionalTotal
  }, [lines, hasProvisionalCharges, provisionalCharges.amount])
  
  const toRefund = useMemo(() => Math.max(0, (depositAmount || 0) - (totalRetained || 0)), [depositAmount, totalRetained])
  
  const maxProvisionalAmount = useMemo(() => (depositAmount || 0) * 0.2, [depositAmount])

  const statusLabel = useMemo(() => {
    if (lines.length === 0 && !hasProvisionalCharges) return { text: "En cours de calcul", tone: "secondary" as const }
    if (totalRetained > 0) return { text: "Retenue en attente", tone: "warning" as const }
    return { text: "Restitué", tone: "success" as const }
  }, [lines.length, hasProvisionalCharges, totalRetained])

  // Charger les données existantes
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        const { supabase } = await import("@/lib/supabase")
        const { data } = await supabase.auth.getSession()
        const token = data.session?.access_token
        
        const res = await fetch(`/api/leases/${leaseId}/deposit-retentions`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        })
        
        if (res.ok) {
          const { retention } = await res.json()
          if (retention) {
            setIban(retention.bank_iban || "")
            setBic(retention.bank_bic || "")
            
            if (retention.lines) {
              setLines(retention.lines.map((line: any) => ({
                id: line.id,
                category: line.category,
                description: line.description,
                amount: line.amount,
                attachmentUrl: line.attachment_url,
                attachmentName: line.attachment_name
              })))
            }
            
            if (retention.provisions && retention.provisions.length > 0) {
              const provision = retention.provisions[0]
              setHasProvisionalCharges(true)
              setProvisionalCharges({
                amount: provision.provision_amount,
                justificationNotes: provision.justification_notes || "",
                expectedFinalizationDate: provision.expected_finalization_date || "",
                supportingDocuments: provision.supporting_documents || []
              })
            }
          }
        }
      } catch (error) {
        console.warn("Erreur chargement données existantes:", error)
      }
    }
    
    loadExistingData()
  }, [leaseId])

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { id: crypto.randomUUID(), category: "degradations", description: "", amount: 0 },
    ])
  }

  const removeLine = (id: string) => setLines((prev) => prev.filter((l) => l.id !== id))

  const updateLine = (id: string, patch: Partial<RetentionLine>) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }

  const handleUpload = async (id: string, file: File | null) => {
    if (!file) return
    try {
      const form = new FormData()
      form.append("file", file)
      form.append("lineId", id)
      const { supabase } = await import("@/lib/supabase")
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      const res = await fetch(`/api/leases/${leaseId}/deposit-retentions/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      })
      if (!res.ok) throw new Error("Upload échoué")
      const j = await res.json()
      updateLine(id, { attachmentUrl: j.publicUrl, attachmentName: file.name })
      toast.success("Pièce jointe ajoutée")
    } catch (e: any) {
      toast.error(e.message || "Erreur upload")
    }
  }

  const saveData = async () => {
    setSaving(true)
    try {
      const { supabase } = await import("@/lib/supabase")
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      
      const body = {
        depositAmount,
        moveOutDate,
        restitutionDeadlineDays: deadlineDays,
        bankIban: iban,
        bankBic: bic,
        lines,
        provisionalCharges: hasProvisionalCharges ? provisionalCharges : null
      }
      
      const res = await fetch(`/api/leases/${leaseId}/deposit-retentions`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(body)
      })
      
      if (res.ok) {
        toast.success("Données sauvegardées")
      } else {
        const error = await res.json()
        toast.error(error.error || "Erreur sauvegarde")
      }
    } catch (error) {
      toast.error("Erreur sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  const calculationDetails = useMemo(() => {
    if (lines.length === 0 && !hasProvisionalCharges) return "Aucune retenue. Restitution intégrale."
    
    let items = lines.map((l) => `- ${labelFor(l.category)}: ${l.description || "(sans détail)"} – ${(l.amount || 0).toFixed(2)} €`).join("\n")
    
    if (hasProvisionalCharges) {
      if (items) items += "\n"
      items += `- Provision charges: ${provisionalCharges.justificationNotes || "En attente de régularisation"} – ${provisionalCharges.amount.toFixed(2)} €`
    }
    
    return `${items}\nTotal retenu: ${totalRetained.toFixed(2)} €\nSolde à restituer: ${toRefund.toFixed(2)} €`
  }, [lines, hasProvisionalCharges, provisionalCharges, totalRetained, toRefund])

  const generatePdf = async () => {
    try {
      setLoading(true)
      const { supabase } = await import("@/lib/supabase")
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token || ""
      const retainedReasons = lines.map((l) => `${labelFor(l.category)} – ${l.description} (${l.amount.toFixed(2)} €)`) 
      const res = await fetch(`/api/leases/${leaseId}/deposit-letter`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          depositAmount,
          retainedAmount: totalRetained,
          retainedReasons,
          calculationDetails,
          bankIban: iban,
          bankBic: bic,
          restitutionDeadlineDays: deadlineDays,
        }),
      })
      if (!res.ok) throw new Error("Génération PDF échouée")
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `restitution-depot-${leaseId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      setStep(3)
      toast.success("PDF généré")
    } catch (e: any) {
      toast.error(e.message || "Erreur PDF")
    } finally {
      setLoading(false)
    }
  }

  const sendEmail = async () => {
    try {
      setSending(true)
      const { supabase } = await import("@/lib/supabase")
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token || ""
      const retainedReasons = lines.map((l) => `${labelFor(l.category)} – ${l.description} (${l.amount.toFixed(2)} €)`) 
      const res = await fetch(`/api/leases/${leaseId}/deposit-letter/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          depositAmount,
          retainedAmount: totalRetained,
          retainedReasons,
          calculationDetails,
          bankIban: iban,
          bankBic: bic,
          restitutionDeadlineDays: deadlineDays,
        }),
      })
      if (!res.ok) throw new Error("Envoi email échoué")
      toast.success("Envoyé au locataire")
    } catch (e: any) {
      toast.error(e.message || "Erreur email")
    } finally {
      setSending(false)
    }
  }

  const progress = useMemo(() => (step === 1 ? 33 : step === 2 ? 66 : 100), [step])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Restitution du dépôt de garantie</span>
            <Badge variant="outline">{statusLabel.text}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SummaryItem label="Dépôt initial" value={`${(depositAmount || 0).toFixed(2)} €`} icon={<Euro className="h-4 w-4" />} />
            <SummaryItem label="Sortie du locataire" value={moveOutDate ? new Date(moveOutDate).toLocaleDateString("fr-FR") : "—"} icon={<FileText className="h-4 w-4" />} />
            <SummaryItem label="Date limite légale" value={`${deadlineDays} jours`} icon={<Info className="h-4 w-4" />} />
            <SummaryItem label="Statut" value={statusLabel.text} icon={<Info className="h-4 w-4" />} />
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <div className="font-medium mb-1">Rappels légaux</div>
            <AlertDescription>
              Le bailleur peut retenir une partie du dépôt uniquement pour couvrir des loyers ou charges impayés, des dégradations constatées à l'état des lieux de sortie, ou un solde de régularisation de charges. Toute retenue doit être justifiée par un devis, une facture ou un décompte. <a className="underline" href="https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000006470289" target="_blank" rel="noreferrer">Voir l’article 22 de la loi du 6 juillet 1989</a>.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm"><span>1️⃣ Saisie des retenues</span><span>→</span><span>2️⃣ Validation</span><span>→</span><span>3️⃣ Génération</span></div>
            <Progress value={progress} />
          </div>

          {/* Lines table */}
          <div className="border rounded-md divide-y">
            <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs text-gray-600 bg-gray-50">
              <div className="col-span-3">Catégorie</div>
              <div className="col-span-4">Description</div>
              <div className="col-span-2">Montant (€)</div>
              <div className="col-span-2">Justificatif</div>
              <div className="col-span-1" />
            </div>
            {lines.map((line) => (
              <div key={line.id} className="grid grid-cols-12 gap-2 px-3 py-2 items-center">
                <div className="col-span-3">
                  <Select value={line.category} onValueChange={(v) => updateLine(line.id, { category: v as RetentionCategory })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="degradations">Dégradations</SelectItem>
                      <SelectItem value="unpaid_rent">Loyers impayés</SelectItem>
                      <SelectItem value="charges">Charges</SelectItem>
                      <SelectItem value="provisional_charges">Provision charges</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-4">
                  <Input placeholder="Description" value={line.description} onChange={(e) => updateLine(line.id, { description: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <Input type="number" step="0.01" value={Number.isFinite(line.amount) ? String(line.amount) : ""} onChange={(e) => updateLine(line.id, { amount: parseFloat(e.target.value || "0") })} />
                </div>
                <div className="col-span-2">
                  {line.attachmentUrl ? (
                    <a className="text-blue-600 underline inline-flex items-center gap-1" href={line.attachmentUrl} target="_blank" rel="noreferrer"><Download className="h-4 w-4" />{line.attachmentName || "Justificatif"}</a>
                  ) : (
                    <input onChange={(e) => handleUpload(line.id, e.target.files?.[0] || null)} type="file" accept="image/*,application/pdf" />
                  )}
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button variant="ghost" onClick={() => removeLine(line.id)}><Trash className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
            <div className="px-3 py-2">
              <Button variant="outline" onClick={addLine}><PlusCircle className="h-4 w-4 mr-2" />Ajouter une retenue</Button>
            </div>
          </div>

          {/* Section provision de charges */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="h-4 w-4" />
                Provision de charges (optionnel)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <div className="font-medium mb-1">Provision légale</div>
                <AlertDescription>
                  Le propriétaire peut conserver une provision pour charges jusqu'à l'arrêté annuel des comptes de l'immeuble. 
                  Le montant ne doit pas dépasser <strong>20% du dépôt de garantie</strong> (soit {maxProvisionalAmount.toFixed(2)}€ maximum).
                </AlertDescription>
              </Alert>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="hasProvisionalCharges" 
                  checked={hasProvisionalCharges}
                  onCheckedChange={setHasProvisionalCharges}
                />
                <Label htmlFor="hasProvisionalCharges">Retenir une provision pour charges</Label>
              </div>

              {hasProvisionalCharges && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Montant de la provision (€)</Label>
                    <Input 
                      type="number" 
                      step="0.01"
                      value={provisionalCharges.amount || ""}
                      onChange={(e) => setProvisionalCharges(prev => ({ 
                        ...prev, 
                        amount: parseFloat(e.target.value) || 0 
                      }))}
                      max={maxProvisionalAmount}
                    />
                    <div className="text-xs text-gray-600 mt-1">
                      Maximum: {maxProvisionalAmount.toFixed(2)}€ (20% du dépôt)
                    </div>
                  </div>
                  
                  <div>
                    <Label>Date prévue d'approbation des comptes</Label>
                    <Input 
                      type="date"
                      value={provisionalCharges.expectedFinalizationDate}
                      onChange={(e) => setProvisionalCharges(prev => ({ 
                        ...prev, 
                        expectedFinalizationDate: e.target.value 
                      }))}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label>Justification de la provision</Label>
                    <Input 
                      placeholder="Ex: En attente de l'arrêté des comptes 2024, régularisation prévue en juin 2025"
                      value={provisionalCharges.justificationNotes}
                      onChange={(e) => setProvisionalCharges(prev => ({ 
                        ...prev, 
                        justificationNotes: e.target.value 
                      }))}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bank details and summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Coordonnées bancaires (restitution)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>IBAN</Label>
                  <Input placeholder="FR76 XXXX ..." value={iban} onChange={(e) => setIban(e.target.value)} />
                </div>
                <div>
                  <Label>BIC</Label>
                  <Input placeholder="XXXXXXXX" value={bic} onChange={(e) => setBic(e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm">Résumé</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm"><span>Dépôt initial</span><span className="font-medium">{(depositAmount || 0).toFixed(2)} €</span></div>
                <div className="flex justify-between text-sm"><span>Total des retenues</span><span className="font-medium">{totalRetained.toFixed(2)} €</span></div>
                <div className="flex justify-between text-base"><span>Solde à restituer</span><span className="font-semibold">{toRefund.toFixed(2)} €</span></div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="outline" onClick={saveData} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
            <Button variant="outline" onClick={generatePdf} disabled={loading}><FileText className="h-4 w-4 mr-2" />Générer la lettre de restitution</Button>
            <Button onClick={sendEmail} disabled={sending}><Mail className="h-4 w-4 mr-2" />Envoyer au locataire</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryItem({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="border rounded-md p-3 bg-white">
      <div className="text-xs text-gray-600 flex items-center gap-2">{icon}{label}</div>
      <div className="text-base font-semibold mt-1">{value}</div>
    </div>
  )
}

function labelFor(c: RetentionCategory): string {
  switch (c) {
    case "degradations": return "Dégradations"
    case "unpaid_rent": return "Loyers impayés"
    case "charges": return "Charges"
    case "provisional_charges": return "Provision charges"
    default: return "Autre"
  }
}


