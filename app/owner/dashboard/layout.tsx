"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Home,
  Building2,
  Users,
  Calendar,
  FileText,
  CreditCard,
  MessageSquare,
  BarChart3,
  Settings,
  Menu,
  Bell,
} from "lucide-react"

const [isLoading, setIsLoading] = useState(true)

useEffect(() => {
  const verifySession = async () => {
    try {
      const res = await fetch('/api/auth/check')
      if (!res.ok) throw new Error()
      setIsLoading(false)
    } catch (error) {
      router.replace('/login')
    }
  }
  
  verifySession()
}, [router])

if (isLoading) {
  return <div>Chargement...</div>
}

const navigation = [
  { name: "Vue d'ensemble", href: "/owner/dashboard", icon: Home },
  { name: "Mes annonces", href: "/owner/properties", icon: Building2 },
  { name: "Candidatures", href: "/owner/applications", icon: Users },
  { name: "Visites", href: "/owner/visits", icon: Calendar },
  { name: "Locations", href: "/owner/rental-management", icon: FileText },
  { name: "Paiements", href: "/owner/payments", icon: CreditCard },
  { name: "Messages", href: "/messaging", icon: MessageSquare },
  { name: "Statistiques", href: "/owner/statistics", icon: BarChart3 },
  { name: "Paramètres", href: "/owner/settings", icon: Settings },
]

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const Sidebar = ({ className }: { className?: string }) => (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/owner/dashboard" className="flex items-center space-x-2">
          <Building2 className="h-6 w-6 text-blue-600" />
          <span className="text-xl font-bold">PropManager</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-4 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar desktop */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-white">
        <Sidebar />
      </div>

      {/* Sidebar mobile */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-6">
          <div className="flex items-center space-x-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </Sheet>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-sm font-medium text-white">P</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
