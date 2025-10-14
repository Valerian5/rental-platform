"use client"

import { useEffect, useState } from "react"
import type { PricingPlan } from "@/lib/premium-service"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [modules, setModules] = useState<any[]>([])

  useEffect(() => {
    ;(async () => {
      const [resPlans, resModules] = await Promise.all([
        fetch("/api/admin/premium/plans"),
        fetch("/api/admin/premium/modules"),
      ])
      const dataPlans = await resPlans.json()
      const dataModules = await resModules.json()
      if (dataPlans.success) setPlans(dataPlans.plans)
      if (dataModules.success) setModules(dataModules.modules)
      setLoading(false)
    })()
  }, [])

  const updatePlan = async (id: string, patch: Partial<PricingPlan & any>) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  const savePlan = async (plan: PricingPlan & any) => {
    setSavingId(plan.id)
    try {
      await fetch(`/api/admin/premium/plans/${plan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: plan.display_name,
          description: plan.description,
          price_monthly: plan.price_monthly,
          price_yearly: plan.price_yearly,
          stripe_product_id: plan.stripe_product_id || "",
          stripe_price_monthly_id: plan.stripe_price_monthly_id || "",
          stripe_price_yearly_id: plan.stripe_price_yearly_id || "",
          is_free: plan.is_free,
          is_popular: plan.is_popular,
          max_properties: plan.max_properties,
          max_tenants: plan.max_tenants,
          max_storage_gb: plan.max_storage_gb,
          sort_order: (plan as any).sort_order || 0,
        }),
      })

      // Sauvegarder modules inclus/quotas
      const selected = (plan._modules || [])
        .map((mid: string) => modules.find((m) => m.id === mid))
        .filter(Boolean)
        .map((m) => ({ id: m.id, is_included: true, usage_limit: m._usage_limit ?? null }))
      await fetch(`/api/admin/premium/plans/${plan.id}/modules`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modules: selected }),
      })
    } finally {
      setSavingId(null)
    }
  }

  if (loading) return <div className="p-6">Chargement...</div>

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      {plans.map((plan: any) => (
        <Card key={plan.id}>
          <CardHeader>
            <CardTitle>{plan.display_name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prix mensuel (€)</Label>
                <Input
                  type="number"
                  value={plan.price_monthly || 0}
                  onChange={(e) => updatePlan(plan.id, { price_monthly: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Prix annuel (€)</Label>
                <Input
                  type="number"
                  value={plan.price_yearly || 0}
                  onChange={(e) => updatePlan(plan.id, { price_yearly: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Nom du plan</Label>
                <Input
                  value={plan.display_name || ""}
                  onChange={(e) => updatePlan(plan.id, { display_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Biens maximum</Label>
                <Input
                  type="number"
                  value={plan.max_properties ?? ""}
                  onChange={(e) =>
                    updatePlan(plan.id, {
                      max_properties: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </div>
              <div className="col-span-2">
                <Label>Stripe Product ID</Label>
                <Input
                  placeholder="prod_..."
                  value={plan.stripe_product_id || ""}
                  onChange={(e) => updatePlan(plan.id, { stripe_product_id: e.target.value })}
                />
              </div>
              <div>
                <Label>Stripe Price Mensuel</Label>
                <Input
                  placeholder="price_..."
                  value={plan.stripe_price_monthly_id || ""}
                  onChange={(e) => updatePlan(plan.id, { stripe_price_monthly_id: e.target.value })}
                />
              </div>
              <div>
                <Label>Stripe Price Annuel</Label>
                <Input
                  placeholder="price_..."
                  value={plan.stripe_price_yearly_id || ""}
                  onChange={(e) => updatePlan(plan.id, { stripe_price_yearly_id: e.target.value })}
                />
              </div>
            </div>

            {/* Modules inclus + quotas */}
            <div className="space-y-2">
              <div className="font-medium mt-2">Fonctionnalités incluses</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {modules.map((m) => {
                  const checked = (plan._modules || []).includes(m.id)
                  const usage = (m._usage_limit ?? "") as any
                  return (
                    <div key={m.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const set = new Set(plan._modules || [])
                          e.target.checked ? set.add(m.id) : set.delete(m.id)
                          updatePlan(plan.id, { _modules: Array.from(set) })
                        }}
                      />
                      <span className="text-sm flex-1">{m.display_name}</span>
                      <Input
                        placeholder="quota"
                        value={usage}
                        onChange={(e) => {
                          const value = e.target.value ? Number(e.target.value) : ""
                          const next = modules.map((x) => (x.id === m.id ? { ...x, _usage_limit: value } : x))
                          setModules(next)
                        }}
                        className="w-24"
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex justify-end">
              <Button disabled={savingId === plan.id} onClick={() => savePlan(plan)}>
                {savingId === plan.id ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}


