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
      const resPlans = await fetch("/api/admin/premium/plans")
      const dataPlans = await resPlans.json()
      if (dataPlans.success) setPlans(dataPlans.plans)
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

      // Sauvegarder fonctionnalités incluses/quotas
      await fetch(`/api/admin/premium/plans/${plan.id}/features`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          features: plan._features || [], 
          quotas: plan._quotas || {} 
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

            {/* Fonctionnalités par page */}
            <div className="space-y-2">
              <div className="font-medium mt-2">Pages incluses</div>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { key: "applications", label: "Candidatures", quota: true },
                  { key: "property_management", label: "Gestion locative", quota: false },
                  { key: "leases", label: "Baux", quota: false },
                  { key: "payments", label: "Paiements", quota: false },
                  { key: "scoring_customization", label: "Assistant configuration scoring", quota: false },
                  { key: "electronic_signature", label: "Signature électronique", quota: false },
                ].map((feature) => {
                  const checked = (plan._features || []).includes(feature.key)
                  const quotaValue = (plan._quotas || {})[feature.key] || ""
                  return (
                    <div key={feature.key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const set = new Set(plan._features || [])
                          e.target.checked ? set.add(feature.key) : set.delete(feature.key)
                          updatePlan(plan.id, { _features: Array.from(set) })
                        }}
                      />
                      <span className="text-sm flex-1">{feature.label}</span>
                      {feature.quota && (
                        <Input
                          placeholder="quota"
                          value={quotaValue}
                          onChange={(e) => {
                            const value = e.target.value ? Number(e.target.value) : ""
                            const quotas = { ...(plan._quotas || {}), [feature.key]: value }
                            updatePlan(plan.id, { _quotas: quotas })
                          }}
                          className="w-24"
                        />
                      )}
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


