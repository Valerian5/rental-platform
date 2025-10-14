"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function BillingSettingsPage() {
  const [signaturePriceId, setSignaturePriceId] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      const res = await fetch("/api/admin/settings/billing")
      const data = await res.json()
      if (data.success && data.data) {
        setSignaturePriceId(data.data.signature_one_off_price_id || "")
      }
    })()
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await fetch("/api/admin/settings/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature_one_off_price_id: signaturePriceId }),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Paramètres de facturation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Price ID signature électronique (one-off)</Label>
            <Input placeholder="price_..." value={signaturePriceId} onChange={(e) => setSignaturePriceId(e.target.value)} />
          </div>
          <div className="flex justify-end">
            <Button onClick={save} disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer"}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


