"use client"

import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react"

interface FeatureLockProps {
  title: string
  description?: string
  cta?: string
  onUpgrade?: () => void
}

export function FeatureLock({ title, description, cta = "Passer au plan", onUpgrade }: FeatureLockProps) {
  return (
    <div className="border rounded-lg p-6 bg-muted/40 text-muted-foreground flex flex-col items-start gap-3">
      <div className="flex items-center gap-2">
        <Lock className="h-4 w-4" />
        <div className="font-medium">{title}</div>
      </div>
      {description && <div className="text-sm">{description}</div>}
      <Button size="sm" onClick={onUpgrade}>{cta}</Button>
    </div>
  )
}


