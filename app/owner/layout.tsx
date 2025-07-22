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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Home,
  Building2,
  Calendar,
  MessageSquare,
  Settings,
  Menu,
  ChevronDown,
  LogOut,
  User,
  Gavel,
  CreditCard,
  BarChart3,
  Target,
  ChevronRight,
  Receipt,
  AlertTriangle,
  Wrench,
  FolderOpen,
  TrendingUp,
  Calculator,
  Users,
} from "lucide-react"
import { authService } from "@/lib/auth-service"
import { useToast } from "@/hooks/use-toast"

const navigation = [
  { name: "Tableau de bord", href: "/owner/dashboard", icon: Home },
  { name: "Mes annonces", href: "/owner/properties", icon: Building2 },
  { name: "Candidatures", href: "/owner/applications", icon: Users },
  { name: "Visites", href: "/owner/visits", icon: Calendar },
  {
    name: "Gestion locative",
    href: "/owner/rental-management",
    icon: CreditCard,
    children: [
      { name: "Vue d'ensemble", href: "/owner/rental-management/overview", icon: Home },
      { name: "Quittances", href: "/owner/rental-management/receipts", icon: Receipt },
      { name: "Incidents", href: "/owner/rental-management/incidents", icon: AlertTriangle },
      { name: "Maintenance", href: "/owner/rental-management/maintenance", icon: Wrench },
      { name: "Documents", href: "/owner/rental-management/documents", icon: FolderOpen },
      { name: "Révisions", href: "/owner/rental-management/revision", icon: TrendingUp },
      { name: "Fiscal", href: "/owner/rental-management/fiscal", icon: Calculator },
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
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
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
        if (user && user.user_type === "owner") {
          setCurrentUser(user)
          // Stocker dans localStorage pour NotificationCenter
          localStorage.setItem("user", JSON.stringify(user))
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
    if (href === "/owner/dashboard") {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const toggleExpanded = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName) ? prev.filter((item) => item !== itemName) : [...prev, itemName],
    )
  }

  const renderNavigationItem = (item: any, isMobile = false) => {
    const Icon = item.icon
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.name)
    const isItemActive = isActive(item.href)

    if (hasChildren) {
      return (
        <Collapsible key={item.name} open={isExpanded} onOpenChange={() => toggleExpanded(item.name)}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-between text-left font-medium px-3 py-2 h-auto",
                isItemActive ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
              )}
            >
              <div className="flex items-center">
                <Icon className="h-4 w-4 mr-3" />
                {item.name}
              </div>
              <ChevronRight className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-90")} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 ml-6">
            {item.children.map((child: any) => {
              const ChildIcon = child.icon
              return (
                <Link
                  key={child.name}
                  href={child.href}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive(child.href)
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                  )}
                  onClick={() => isMobile && setMobileMenuOpen(false)}
                >
                  <ChildIcon className="h-4 w-4 mr-3" />
                  {child.name}
                </Link>
              )
            })}
          </CollapsibleContent>
        </Collapsible>
      )
    }

    return (
      <Link
        key={item.name}
        href={item.href}
        className={cn(
          "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
          isItemActive ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
        )}
        onClick={() => isMobile && setMobileMenuOpen(false)}
      >
        <Icon className="h-4 w-4 mr-3" />
        {item.name}
      </Link>
    )
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
        <nav className="flex-1 space-y-1 px-4 py-4 overflow-y-auto">
          {navigation.map((item) => renderNavigationItem(item))}
        </nav>
      </div>

      {/* Sidebar Mobile */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <div className="flex flex-col h-full">
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
            <nav className="flex-1 space-y-1 px-4 py-4 overflow-y-auto">
              {navigation.map((item) => renderNavigationItem(item, true))}
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
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
            <div className="lg:hidden flex items-center space-x-2">
              {siteSettings.logo ? (
                <img src={siteSettings.logo || "/placeholder.svg"} alt="Logo" className="h-8 w-8 object-contain" />
              ) : (
                <Building2 className="h-6 w-6 text-blue-600" />
              )}
              <span className="text-xl font-bold">{siteSettings.title}</span>
            </div>
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
                  <Link href="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Mon profil</span>
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

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
