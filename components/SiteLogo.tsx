import React from "react"

export function SiteLogo({ logoUrl, title, size = 32 }: { logoUrl?: string | null, title?: string, size?: number }) {
  return logoUrl ? (
    <img src={logoUrl} alt={title || "Logo"} className={`object-contain`} style={{height: size, width: size}} />
  ) : (
    <span className="text-xl font-bold">{title || "Plateforme"}</span>
  )
}