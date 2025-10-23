"use client"

import { useEffect, useState } from "react"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PageAccessOverlayProps {
  userId: string
  moduleName: string
  marketingTitle?: string
  marketingDesc?: string
  ctaText?: string
  onUpgrade?: () => void
  // Pour les modules achetables à l'acte (ex: signature électronique)
  oneOffPriceId?: string
  // Condition d'affichage (ex: seulement sur un onglet spécifique)
  showCondition?: boolean
}

export function PageAccessOverlay(props: PageAccessOverlayProps) {
  const {
    userId,
    moduleName,
    marketingTitle,
    marketingDesc,
    ctaText = "Je découvre les offres",
    onUpgrade,
    oneOffPriceId,
    showCondition = true,
  } = props
  const defaultTitle = "Débloquez cette fonctionnalité avec l'une de nos offres"
  const defaultDesc =
    "Accédez à tous les outils de gestion locative dès 9,90 € HT/mois et simplifiez la gestion de vos biens en toute autonomie.\n\nFaites des économies, gagnez du temps, et gardez le contrôle sur votre bien !\n\nJusqu’à 7 × moins cher qu’une agence, soit plus de 600 € économisés chaque année."
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const { supabase } = await import("@/lib/supabase")
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData.session?.access_token
        const headers: Record<string, string> = { "Content-Type": "application/json" }
        if (token) headers["Authorization"] = `Bearer ${token}`
        const res = await fetch("/api/premium/access", {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify({ module_name: moduleName }),
        })
        if (res.ok) {
          const data = await res.json()
          setAllowed(!!data.allowed)
          return
        }
        // Si l'API retourne une erreur, on considère que l'accès est refusé
        setAllowed(false)
        return
      } catch (error) {
        console.error("Erreur vérification accès:", error)
        // En cas d'erreur, on considère que l'accès est refusé
        setAllowed(false)
      }
    })()
  }, [userId, moduleName])

  if (allowed == null) return null
  if (allowed) return null
  if (!showCondition) return null

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

  // Ne pas afficher l'overlay si la condition n'est pas remplie
  if (!showCondition) {
    return null
  }

  return (
    <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-20 pointer-events-auto">
      <div className="max-w-md text-center p-6 bg-background/60 rounded-lg border">
        <div className="flex items-center justify-center gap-2 text-lg font-semibold mb-2">
          <Lock className="h-4 w-4" />
          {marketingTitle || defaultTitle}
        </div>
        <div className="text-sm text-muted-foreground mb-4" style={{ whiteSpace: "pre-line" }}>
          {marketingDesc || defaultDesc}
        </div>
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


