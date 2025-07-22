"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { NotificationCenter } from "@/components/notification-center"
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
  Search,
  Heart,
  FileText,
  Calendar,
  MessageSquare,
  Settings,
  Menu,
  ChevronDown,
  LogOut,
  User,
  Gavel,
  CreditCard,
  Bookmark,
  Bell,
} from "lucide-react"
import { authService } from "@/lib/auth-service"
import { useToast } from "@/hooks/use-toast"

const headerNavigation = [
  { name: "Tableau de bord", href: "/tenant/dashboard", icon: Home },
  { name: "Rechercher", href: "/tenant/search", icon: Search },
  { name: "Mes recherches", href: "/tenant/searches", icon: Bookmark },
  { name: "Favoris", href: "/tenant/favorites", icon: Heart },
]

const sidebarNavigation = [
  { name: "Accueil", href: "/tenant/dashboard", icon: Home },
  { name: "Candidatures", href: "/tenant/applications", icon: FileText },
  { name: "Visites", href: "/tenant/visits", icon: Calendar },
  { name: "Baux", href: "/tenant/leases", icon: Gavel },
  { name: "Location", href: "/tenant/rental-management", icon: CreditCard },
  { name: "Messages", href: "/tenant/messaging", icon: MessageSquare },
  { name: "Notifications", href: "/tenant/notifications", icon: Bell },
  { name: "Paramètres", href: "/tenant/settings", icon: Settings },
]

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer l'utilisateur actuel
        const user = await authService.getCurrentUser()
        if (user && user.user_type === "tenant") {
          setCurrentUser(user)
          // Stocker dans localStorage pour NotificationCenter
          localStorage.setItem("user", JSON.stringify(user))
        } else {
          router.push("/login")
          return
        }

        // Récupérer le logo
        try {
          console.log("🔍 Tenant Layout - Récupération logo...")
          const logoResponse = await fetch("/api/admin/settings?key=logos")
          const logoResult = await logoResponse.json()
          console.log("📋 Tenant Layout - Résultat logos:", logoResult)

          if (logoResult.success && logoResult.data) {
            let logoUrl = null
            if (typeof logoResult.data === "object" && logoResult.data.main) {
              logoUrl = logoResult.data.main
            } else if (typeof logoResult.data === "string") {
              logoUrl = logoResult.data
            }
            console.log("✅ Tenant Layout - Logo défini:", logoUrl)
            setLogoUrl(logoUrl)
          }
        } catch (settingsError) {
          console.error("❌ Tenant Layout - Erreur récupération logo:", settingsError)
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
      localStorage.removeItem("user")
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

  const isActive = (href: string) => {
    if (href === "/tenant/dashboard") {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

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
      {/* Sidebar Desktop */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-white">
        <div className="flex h-16 items-center justify-center border-b px-6">
          <Link href="/tenant/dashboard" className="flex items-center">
            {logoUrl ? (
              <img
                src={logoUrl || "/placeholder.svg"}
                alt="Logo"
                className="h-10 w-auto object-contain max-w-[200px]"
                onError={(e) => {
                  console.error("❌ Erreur chargement logo tenant:", logoUrl)
                  setLogoUrl(null)
                }}
              />
            ) : (
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Home className="h-5 w-5 text-white" />
              </div>
            )}
          </Link>
        </div>
        <nav className="flex-1 space-y-1 px-4 py-4 overflow-y-auto">
          {sidebarNavigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                )}
              >
                <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex justify-between items-center h-16 px-4 lg:px-6">
            {/* Logo et navigation principale */}
            <div className="flex items-center space-x-4 lg:space-x-6 min-w-0">
              <div className="flex items-center space-x-4">
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="lg:hidden">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 p-0">
                    <div className="flex flex-col h-full">
                      <div className="flex h-16 items-center justify-center border-b px-6">
                        <Link href="/tenant/dashboard" className="flex items-center">
                          {logoUrl ? (
                            <img
                              src={logoUrl || "/placeholder.svg"}
                              alt="Logo"
                              className="h-10 w-auto object-contain max-w-[200px]"
                              onError={(e) => {
                                console.error("❌ Erreur chargement logo tenant mobile:", logoUrl)
                                setLogoUrl(null)
                              }}
                            />
                          ) : (
                            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                              <Home className="h-5 w-5 text-white" />
                            </div>
                          )}
                        </Link>
                      </div>
                      <nav className="flex-1 space-y-1 px-4 py-4 overflow-y-auto">
                        {/* Navigation header en mobile */}
                        <div className="pb-4 border-b mb-4">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            Navigation rapide
                          </h3>
                          {headerNavigation.map((item) => {
                            const Icon = item.icon
                            return (
                              <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                  "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                  isActive(item.href)
                                    ? "bg-blue-100 text-blue-700"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                                )}
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
                                <span className="truncate">{item.name}</span>
                              </Link>
                            )
                          })}
                        </div>
                        {/* Navigation sidebar */}
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            Menu principal
                          </h3>
                          {sidebarNavigation.map((item) => {
                            const Icon = item.icon
                            return (
                              <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                  "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                  isActive(item.href)
                                    ? "bg-blue-100 text-blue-700"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                                )}
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
                                <span className="truncate">{item.name}</span>
                              </Link>
                            )
                          })}
                        </div>
                      </nav>
                    </div>
                  </SheetContent>
                </Sheet>

                <Link href="/tenant/dashboard" className="flex items-center">
                  {logoUrl ? (
                    <img
                      src={logoUrl || "/placeholder.svg"}
                      alt="Logo"
                      className="h-8 w-auto object-contain max-w-[150px]"
                      onError={(e) => {
                        console.error("❌ Erreur chargement logo tenant header:", logoUrl)
                        setLogoUrl(null)
                      }}
                    />
                  ) : (
                    <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Home className="h-5 w-5 text-white" />
                    </div>
                  )}
                </Link>
              </div>

              {/* Navigation header desktop */}
              <nav className="hidden xl:flex space-x-1 overflow-x-auto">
                {headerNavigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                        isActive(item.href)
                          ? "bg-blue-100 text-blue-700"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                      )}
                    >
                      <Icon className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="hidden 2xl:inline">{item.name}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* Profil utilisateur */}
            <div className="flex items-center space-x-2 lg:space-x-4">
              <NotificationCenter />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 px-2 lg:px-3">
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
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                        {currentUser.first_name} {currentUser.last_name}
                      </p>
                      <p className="text-xs text-gray-500">Locataire</p>
                    </div>
                    <ChevronDown className="h-4 w-4 hidden sm:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/tenant/profile/rental-file" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Mon dossier</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/tenant/settings" className="flex items-center">
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
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-full overflow-x-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
