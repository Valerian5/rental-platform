"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { NotificationCenter } from "@/components/notification-center"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  ChevronDown,
  LogOut,
  User,
  Gavel,
  Target,
} from "lucide-react"
import { authService } from "@/lib/auth-service"
import { useToast } from "@/hooks/use-toast"

const navigation = [
  { name: "Vue d'ensemble", href: "/owner/dashboard", icon: Home },
  { name: "Mes annonces", href: "/owner/properties", icon: Building2 },
  { name: "Candidatures", href: "/owner/applications", icon: Users },
  { name: "Visites", href: "/owner/visits", icon: Calendar },
  {
    name: "Locations",
    href: "/owner/rental-management",
    icon: FileText,
    submenu: [
      { name: "Vue d'ensemble", href: "/owner/rental-management" },
      { name: "Quittances", href: "/owner/rental-management/receipts" },
      { name: "Incidents", href: "/owner/rental-management/incidents" },
      { name: "Travaux", href: "/owner/rental-management/maintenance" },
      { name: "Documents", href: "/owner/rental-management/documents" },
      { name: "Révision", href: "/owner/rental-management/revision" },
      { name: "Fiscal", href: "/owner/rental-management/fiscal" },
    ],
  },
  { name: "Baux", href: "/owner/leases", icon: Gavel },
  { name: "Paiements", href: "/owner/payments", icon: CreditCard },
  { name: "Messages", href: "/owner/messaging", icon: MessageSquare },
  { name: "Statistiques", href: "/owner/statistics", icon: BarChart3 },
  { name: "Scoring", href: "/owner/scoring-preferences-simple", icon: Target },
  { name: "Paramètres", href: "/owner/settings", icon: Settings },
]

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [siteSettings, setSiteSettings] = useState<any>({
    title: "PropManager",
    logo: null,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer l'utilisateur actuel
        const user = await authService.getCurrentUser()
        if (user && user.user_type === "owner") {
          setCurrentUser(user)
        } else {
          router.push("/login")
          return
        }

        // Récupérer les paramètres du site
        try {
          const [logoResponse, siteInfoResponse] = await Promise.all([
            fetch("/api/admin/settings?key=logos"),
            fetch("/api/admin/settings?key=site_info"),
          ])

          const logoResult = await logoResponse.json()
          const siteInfoResult = await siteInfoResponse.json()

          setSiteSettings({
            title: siteInfoResult.success ? siteInfoResult.data?.title || "PropManager" : "PropManager",
            logo: logoResult.success ? logoResult.data?.main : null,
          })
        } catch (settingsError) {
          console.error("Erreur récupération paramètres:", settingsError)
        }
      } catch (error) {
        console.error("Erreur récupération utilisateur:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleLogout = async () => {
    try {
      await authService.logout()
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      })
      router.push("/")
    } catch (error) {
      console.error("Erreur déconnexion:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors de la déconnexion",
        variant: "destructive",
      })
    }
  }

  const Sidebar = ({ className }: { className?: string }) => (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/owner/dashboard" className="flex items-center space-x-2">
          {siteSettings.logo ? (
            <img src={siteSettings.logo || "/placeholder.svg"} alt="Logo" className="h-8 w-8 object-contain" />
          ) : (
            <Building2 className="h-6 w-6 text-blue-600" />
          )}
          <span className="text-xl font-bold">{siteSettings.title}</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-4 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.submenu && item.submenu.some((sub) => pathname === sub.href))
          const isExpanded = pathname.startsWith(item.href) && item.submenu

          return (
            <div key={item.name}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
                {item.submenu && (
                  <ChevronDown className={cn("h-4 w-4 ml-auto transition-transform", isExpanded && "rotate-180")} />
                )}
              </Link>

              {item.submenu && isExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.submenu.map((subItem) => (
                    <Link
                      key={subItem.name}
                      href={subItem.href}
                      className={cn(
                        "block rounded-lg px-3 py-2 text-sm transition-colors",
                        pathname === subItem.href
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      {subItem.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!currentUser) {
    return null
  }

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
            <NotificationCenter />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src="/placeholder.svg?height=32&width=32&text=User"
                      alt={`${currentUser.first_name} ${currentUser.last_name}`}
                    />
                    <AvatarFallback>
                      {currentUser.first_name?.[0]}
                      {currentUser.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {currentUser.first_name} {currentUser.last_name}
                    </p>
                    <p className="text-xs text-gray-500">Propriétaire</p>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/owner/settings" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/owner/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Paramètres</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Se déconnecter</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <BreadcrumbNav />
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
