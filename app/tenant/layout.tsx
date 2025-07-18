"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
  Bell,
  Settings,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  Gavel,
  CreditCard,
  Bookmark,
} from "lucide-react"
import { authService } from "@/lib/auth-service"
import { notificationsService } from "@/lib/notifications-service"
import { useToast } from "@/hooks/use-toast"

const navigation = [
  { name: "Tableau de bord", href: "/tenant/dashboard", icon: Home },
  { name: "Rechercher", href: "/tenant/search", icon: Search },
  { name: "Mes recherches", href: "/tenant/searches", icon: Bookmark },
  { name: "Favoris", href: "/tenant/favorites", icon: Heart },
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
  const [unreadCount, setUnreadCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [siteSettings, setSiteSettings] = useState<any>({
    title: "RentalPlatform",
    logo: null,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer l'utilisateur actuel
        const user = await authService.getCurrentUser()
        if (user && user.user_type === "tenant") {
          setCurrentUser(user)

          // Récupérer le nombre de notifications non lues
          try {
            const count = await notificationsService.getUnreadCount(user.id)
            setUnreadCount(count)
          } catch (error) {
            console.error("Erreur comptage notifications:", error)
            setUnreadCount(0)
          }
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
            title: siteInfoResult.success ? siteInfoResult.data?.title || "RentalPlatform" : "RentalPlatform",
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo et titre */}
            <div className="flex items-center">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold">Navigation</h2>
                      <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                    <nav className="flex-1">
                      <ul className="space-y-2">
                        {navigation.map((item) => {
                          const Icon = item.icon
                          return (
                            <li key={item.name}>
                              <Link
                                href={item.href}
                                className={cn(
                                  "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                  isActive(item.href)
                                    ? "bg-blue-100 text-blue-700"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                                )}
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                <Icon className="h-5 w-5 mr-3" />
                                {item.name}
                                {item.name === "Notifications" && unreadCount > 0 && (
                                  <Badge variant="destructive" className="ml-auto text-xs">
                                    {unreadCount}
                                  </Badge>
                                )}
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>

              <Link href="/tenant/dashboard" className="flex items-center">
                {siteSettings.logo ? (
                  <img
                    src={siteSettings.logo || "/placeholder.svg"}
                    alt="Logo"
                    className="h-8 w-8 object-contain mr-3"
                  />
                ) : (
                  <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                    <Home className="h-5 w-5 text-white" />
                  </div>
                )}
                <span className="text-xl font-bold text-gray-900">{siteSettings.title}</span>
              </Link>
            </div>

            {/* Navigation desktop */}
            <nav className="hidden md:flex space-x-1">
              {navigation.slice(0, 6).map((item) => {
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
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                    {item.name === "Notifications" && unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-2 text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Profil utilisateur */}
            <div className="flex items-center space-x-4">
              {/* Notifications rapides */}
              <NotificationCenter />

              {/* Menu utilisateur */}
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
                      <p className="text-xs text-gray-500">Locataire</p>
                    </div>
                    <ChevronDown className="h-4 w-4" />
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
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
