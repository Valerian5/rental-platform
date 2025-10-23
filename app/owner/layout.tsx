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
import { PageAccessOverlay } from "@/components/page-access-overlay"

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
      { name: "Paiements", href: "/owner/rental-management/payments", icon: CreditCard },
      { name: "Incidents", href: "/owner/rental-management/incidents", icon: AlertTriangle },
      { name: "Travaux", href: "/owner/rental-management/maintenance", icon: Wrench },
      { name: "Documents", href: "/owner/rental-management/documents", icon: FolderOpen },
      { name: "Révision loyer", href: "/owner/rental-management/rent-revision", icon: TrendingUp },
      { name: "Révision Charges", href: "/owner/rental-management/revision", icon: Calculator },
      { name: "Bilan Fiscal", href: "/owner/rental-management/fiscal", icon: Calculator },
    ],
  },
  { name: "Baux", href: "/owner/leases", icon: Gavel },
  { name: "Paiements", href: "/owner/rental-management/payments", icon: CreditCard },
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
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
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

        // Récupérer le logo
        try {
          console.log("🔍 Owner Layout - Récupération logo...")
          const logoResponse = await fetch("/api/admin/settings?key=logos")
          const logoResult = await logoResponse.json()
          console.log("📋 Owner Layout - Résultat logos:", logoResult)

          if (logoResult.success && logoResult.data) {
            let logoUrl = null
            if (typeof logoResult.data === "object" && logoResult.data.main) {
              logoUrl = logoResult.data.main
            } else if (typeof logoResult.data === "string") {
              logoUrl = logoResult.data
            }
            console.log("✅ Owner Layout - Logo défini:", logoUrl)
            setLogoUrl(logoUrl)
          }
        } catch (settingsError) {
          console.error("❌ Owner Layout - Erreur récupération logo:", settingsError)
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
                <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </div>
              <ChevronRight className={cn("h-4 w-4 transition-transform flex-shrink-0", isExpanded && "rotate-90")} />
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
                  <ChildIcon className="h-4 w-4 mr-3 flex-shrink-0" />
                  <span className="truncate">{child.name}</span>
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
        <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
        <span className="truncate">{item.name}</span>
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
        <div className="flex h-16 items-center justify-center border-b px-6">
          <Link href="/owner/dashboard" className="flex items-center">
            {logoUrl ? (
              <img
                src={logoUrl || "/placeholder.svg"}
                alt="Logo"
                className="h-10 w-auto object-contain max-w-[200px]"
                onError={(e) => {
                  console.error("❌ Erreur chargement logo owner:", logoUrl)
                  setLogoUrl(null)
                }}
              />
            ) : (
              <Building2 className="h-8 w-8 text-blue-600" />
            )}
          </Link>
        </div>
        <nav className="flex-1 space-y-1 px-4 py-4 overflow-y-auto">
          {navigation.map((item) => renderNavigationItem(item))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 lg:px-6">
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
                    <Link href="/owner/dashboard" className="flex items-center">
                      {logoUrl ? (
                        <img
                          src={logoUrl || "/placeholder.svg"}
                          alt="Logo"
                          className="h-10 w-auto object-contain max-w-[200px]"
                          onError={(e) => {
                            console.error("❌ Erreur chargement logo owner mobile:", logoUrl)
                            setLogoUrl(null)
                          }}
                        />
                      ) : (
                        <Building2 className="h-8 w-8 text-blue-600" />
                      )}
                    </Link>
                  </div>
                  <nav className="flex-1 space-y-1 px-4 py-4 overflow-y-auto">
                    {navigation.map((item) => renderNavigationItem(item, true))}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>

            <div className="lg:hidden flex items-center">
              {logoUrl ? (
                <img
                  src={logoUrl || "/placeholder.svg"}
                  alt="Logo"
                  className="h-8 w-auto object-contain max-w-[150px]"
                  onError={(e) => {
                    console.error("❌ Erreur chargement logo owner header:", logoUrl)
                    setLogoUrl(null)
                  }}
                />
              ) : (
                <Building2 className="h-6 w-6 text-blue-600" />
              )}
            </div>
          </div>

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
                    <p className="text-xs text-gray-500">Propriétaire</p>
                  </div>
                  <ChevronDown className="h-4 w-4 hidden sm:block" />
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
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 relative">
          <div className="max-w-full overflow-x-auto relative">{children}
            {(() => {
              if (!currentUser?.id || !pathname) return null
              // Fetch rule for this path and render overlay if rule exists and access denied
              return <DynamicPageOverlay userId={currentUser.id} path={pathname} />
            })()}
          </div>
        </main>
      </div>
    </div>
  )
}

function DynamicPageOverlay({ userId, path }: { userId: string; path: string }) {
  const [rule, setRule] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/premium/page-access?path=${encodeURIComponent(path)}`)
        const data = await res.json()
        if (!cancelled && data?.success) {
          setRule(data.rule || null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [path])

  if (loading) return null
  const moduleName = (rule?.module_name as string | undefined) || fallbackModuleFor(path)
  if (!moduleName) return null

  // Ne pas afficher l'overlay global sur la page scoring (géré manuellement)
  if (path === "/owner/scoring-preferences-simple") return null

  return (
    <PageAccessOverlay
      userId={userId}
      moduleName={moduleName}
      marketingTitle={rule?.marketing_title || "Fonctionnalité réservée"}
      marketingDesc={rule?.marketing_text || undefined}
      ctaText={rule?.cta_text || "Voir les plans"}
      oneOffPriceId={rule?.one_off_price_id || undefined}
    />
  )
}

function fallbackModuleFor(path: string): string | undefined {
  const map: Record<string, string> = {
    "/owner/rental-management": "property_management",
    "/owner/rental-management/incidents": "rental_management_incidents",
    "/owner/rental-management/maintenance": "rental_management_maintenance",
    "/owner/rental-management/documents": "rental_management_documents",
    "/owner/rental-management/rent-revision": "rental_management_rent_revision",
    "/owner/rental-management/revision": "rental_management_revision",
    "/owner/rental-management/fiscal": "rental_management_fiscal",
    "/owner/rental-management/overview": "rental_management_overview",
    "/owner/leases": "leases",
    "/owner/visits": "visits",
    "/owner/applications": "applications",
    "/owner/rental-management/payments": "payments",
    "/owner/scoring-preferences-simple": "scoring_customization",
  }
  // Chercher la correspondance la plus spécifique par préfixe
  const keys = Object.keys(map).filter((k) => path.startsWith(k)).sort((a, b) => b.length - a.length)
  return keys[0] ? map[keys[0]] : undefined
}
