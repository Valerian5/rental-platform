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

  useEffect(() => {
    ;(async () => {
      const res = await fetch("/api/admin/premium/plans")
      const data = await res.json()
      if (data.success) setPlans(data.plans)
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


