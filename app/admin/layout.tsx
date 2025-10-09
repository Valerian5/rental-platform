"use client"

import type React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { authService } from "@/lib/auth-service"
import { Button } from "@/components/ui/button"
import { Menu, X, LayoutDashboard, Building2, Settings, FileText, Layers, Boxes, LineChart, Wrench, Wand2, Shield } from "lucide-react"

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/agencies", label: "Agences", icon: Building2 },
  { href: "/admin/analytics", label: "Analytics", icon: LineChart },
  { href: "/admin/etat-des-lieux-templates", label: "État des lieux", icon: FileText },
  { href: "/admin/irl-management", label: "IRL", icon: Wand2 },
  { href: "/admin/lease-clauses", label: "Clauses bail", icon: Boxes },
  { href: "/admin/lease-templates", label: "Modèles de bail", icon: Layers },
  { href: "/admin/surety-bond-templates", label: "Modèles de caution", icon: Shield },
  { href: "/admin/migrate", label: "Migration", icon: Wrench },
  { href: "/admin/cms-pages", label: "Pages CMS", icon: FileText },
  { href: "/admin/page-builder", label: "Page Builder", icon: Wand2 },
  { href: "/admin/settings", label: "Paramètres", icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const check = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user) return router.push("/login")
        if (user.user_type !== "admin") return router.push("/")
      } finally {
        setChecking(false)
      }
    }
    check()
  }, [router])

  if (checking) return <div className="p-6">Chargement…</div>

  return (
    <div className="min-h-screen h-screen w-full flex bg-background text-foreground">
      {/* Sidebar */}
      <aside className={`z-30 flex-shrink-0 border-r bg-card transition-transform duration-200 ease-in-out w-72 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="h-16 flex items-center px-4 border-b">
          <div className="font-semibold">Admin</div>
        </div>
        <nav className="p-2 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
          {adminNav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href} className={`flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors ${active ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`} onClick={() => setSidebarOpen(false)}>
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between border-b px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen((v) => !v)}>
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="font-medium">Panneau d'administration</div>
          </div>
          <div className="text-sm text-muted-foreground">{pathname}</div>
        </header>

        {/* Content */}
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}


