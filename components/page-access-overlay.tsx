"use client"

import { useEffect, useState } from "react"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { hasAccessToModule } from "@/lib/feature-gating"

interface PageAccessOverlayProps {
  userId: string
  moduleName: string
  marketingTitle?: string
  marketingDesc?: string
  ctaText?: string
  onUpgrade?: () => void
  // Pour les modules achetables à l'acte (ex: signature électronique)
  oneOffPriceId?: string
}

export function PageAccessOverlay(props: PageAccessOverlayProps) {
  const { userId, moduleName, marketingTitle, marketingDesc, ctaText = "Voir les plans", onUpgrade, oneOffPriceId } = props
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    ;(async () => {
      const ok = await hasAccessToModule(userId, moduleName)
      setAllowed(ok)
    })()
  }, [userId, moduleName])

  if (allowed == null) return null
  if (allowed) return null

  const buyOneOff = async () => {
    if (!oneOffPriceId) return
    setBusy(true)
    try {
      const res = await fetch("/api/billing/one-off", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: oneOffPriceId, module_name: moduleName }),
      })
      const data = await res.json()
      if (data?.url) window.location.href = data.url
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-20">
      <div className="max-w-md text-center p-6 bg-background/60 rounded-lg border">
        <div className="flex items-center justify-center gap-2 text-lg font-semibold mb-2">
          <Lock className="h-4 w-4" />
          {marketingTitle || "Fonctionnalité réservée"}
        </div>
        {marketingDesc && <div className="text-sm text-muted-foreground mb-4">{marketingDesc}</div>}
        <div className="flex items-center justify-center gap-2">
          <Button size="sm" onClick={onUpgrade || (() => (window.location.href = "/owner/subscription"))}>{ctaText}</Button>
          {oneOffPriceId && (
            <Button size="sm" variant="outline" onClick={buyOneOff} disabled={busy}>
              {busy ? "Redirection..." : "Acheter à l'acte"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}


