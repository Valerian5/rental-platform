"use client"

import { useEffect, useState } from "react"
import { PremiumPlanSelector } from "@/components/premium-plan-selector"
import { Button } from "@/components/ui/button"

export default function OwnerSubscriptionPage() {
  const [portalLoading, setPortalLoading] = useState(false)
  const [currentPlanId, setCurrentPlanId] = useState<string | undefined>(undefined)

  const openPortal = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" })
      const data = await res.json()
      if (data?.url) window.location.href = data.url
    } finally {
      setPortalLoading(false)
    }
  }

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/api/subscription/current", { credentials: "include" })
        const data = await res.json()
        if (data?.success) {
          setCurrentPlanId(data.planId || undefined)
        }
      } catch (e) {
        // noop
      }
    })()
  }, [])

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mon abonnement</h1>
        <Button onClick={openPortal} disabled={portalLoading}>
          {portalLoading ? "Ouverture..." : "Gérer via Stripe"}
        </Button>
      </div>

      <PremiumPlanSelector currentPlanId={currentPlanId} onPlanSelect={() => {}} showTrialOption={false} />
    </div>
  )
}


