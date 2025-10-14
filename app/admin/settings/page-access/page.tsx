"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Rule = {
  path: string
  module_name: string
  marketingTitle?: string
  marketingDesc?: string
  ctaText?: string
  oneOffPriceId?: string
}

export default function PageAccessSettings() {
  const [rules, setRules] = useState<Rule[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      const res = await fetch("/api/admin/premium/page-access")
      const data = await res.json()
      if (data.success) setRules(data.rules || [])
    })()
  }, [])

  const addRule = () => setRules([...rules, { path: "", module_name: "" } as Rule])

  const save = async () => {
    setSaving(true)
    try {
      await fetch("/api/admin/premium/page-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules }),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Accès par page</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={addRule}>Ajouter une règle</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer"}</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Règles de pages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {rules.map((r, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
              <div className="md:col-span-2">
                <Label>Path</Label>
                <Input placeholder="/owner/leases" value={r.path} onChange={(e) => {
                  const next = [...rules]; next[idx] = { ...next[idx], path: e.target.value }; setRules(next)
                }} />
              </div>
              <div>
                <Label>Module</Label>
                <Input placeholder="leases" value={r.module_name} onChange={(e) => {
                  const next = [...rules]; next[idx] = { ...next[idx], module_name: e.target.value }; setRules(next)
                }} />
              </div>
              <div>
                <Label>Title</Label>
                <Input value={r.marketingTitle || ""} onChange={(e) => {
                  const next = [...rules]; next[idx] = { ...next[idx], marketingTitle: e.target.value }; setRules(next)
                }} />
              </div>
              <div>
                <Label>CTA</Label>
                <Input value={r.ctaText || ""} onChange={(e) => {
                  const next = [...rules]; next[idx] = { ...next[idx], ctaText: e.target.value }; setRules(next)
                }} />
              </div>
              <div>
                <Label>One-off Price ID</Label>
                <Input placeholder="price_..." value={r.oneOffPriceId || ""} onChange={(e) => {
                  const next = [...rules]; next[idx] = { ...next[idx], oneOffPriceId: e.target.value }; setRules(next)
                }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}


