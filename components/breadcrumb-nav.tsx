"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"

interface BreadcrumbItem {
  label: string
  href?: string
}

const pathMappings: Record<string, BreadcrumbItem[]> = {
  "/owner/dashboard": [{ label: "Tableau de bord" }],
  "/owner/properties": [{ label: "Mes annonces" }],
  "/owner/applications": [{ label: "Candidatures" }],
  "/owner/visits": [{ label: "Visites" }],
  "/owner/rental-management": [{ label: "Locations", href: "/owner/rental-management" }, { label: "Vue d'ensemble" }],
  "/owner/rental-management/receipts": [
    { label: "Locations", href: "/owner/rental-management" },
    { label: "Quittances" },
  ],
  "/owner/rental-management/incidents": [
    { label: "Locations", href: "/owner/rental-management" },
    { label: "Incidents" },
  ],
  "/owner/rental-management/maintenance": [
    { label: "Locations", href: "/owner/rental-management" },
    { label: "Travaux" },
  ],
  "/owner/rental-management/documents": [
    { label: "Locations", href: "/owner/rental-management" },
    { label: "Documents" },
  ],
  "/owner/rental-management/revision": [
    { label: "Locations", href: "/owner/rental-management" },
    { label: "Révision" },
  ],
  "/owner/rental-management/fiscal": [{ label: "Locations", href: "/owner/rental-management" }, { label: "Fiscal" }],
  "/owner/payments": [{ label: "Paiements" }],
  "/owner/statistics": [{ label: "Statistiques" }],
  "/owner/settings": [{ label: "Paramètres" }],
}

export function BreadcrumbNav() {
  const pathname = usePathname()
  const breadcrumbs = pathMappings[pathname] || []

  if (breadcrumbs.length === 0) return null

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
      <Link href="/owner/dashboard" className="flex items-center hover:text-gray-900">
        <Home className="h-4 w-4" />
      </Link>

      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4" />
          {item.href ? (
            <Link href={item.href} className="hover:text-gray-900">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-gray-900">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}
