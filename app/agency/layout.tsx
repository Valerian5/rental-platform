"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import {
  Building2,
  Home,
  Users,
  Calendar,
  FileText,
  MessageSquare,
  BarChart3,
  Settings,
  Menu,
  X,
  Bell,
  Search,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/lib/auth-service"

interface Agency {
  id: string
  name: string
  logo_url?: string
  primary_color: string
  secondary_color: string
  accent_color: string
}

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  agency_id: string
  roles: { id: string; name: string }[]
}

const navigation = [
  { name: "Dashboard", href: "/agency/dashboard", icon: Building2 },
  { name: "Properties", href: "/agency/properties", icon: Home },
  { name: "Applications", href: "/agency/applications", icon: Users },
  { name: "Visits", href: "/agency/visits", icon: Calendar },
  { name: "Leases", href: "/agency/leases", icon: FileText },
  { name: "Messages", href: "/agency/messages", icon: MessageSquare },
  { name: "Analytics", href: "/agency/analytics", icon: BarChart3 },
  { name: "Settings", href: "/agency/settings", icon: Settings },
]

export default function AgencyLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [agency, setAgency] = useState<Agency | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const currentUser = await authService.getCurrentUser()

      if (!currentUser) {
        router.push("/login")
        return
      }

      if (currentUser.user_type !== "agency" || !currentUser.agency_id) {
        toast({
          title: "Access denied",
          description: "You don't have agency access",
          variant: "destructive",
        })
        router.push("/")
        return
      }

      setUser(currentUser as User)

      // Fetch agency details
      const agencyResponse = await fetch(`/api/agencies/${currentUser.agency_id}`)
      const agencyResult = await agencyResponse.json()

      if (agencyResult.success) {
        setAgency(agencyResult.agency)
      }
    } catch (error) {
      console.error("Error checking auth:", error)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await authService.logout()
      router.push("/login")
    } catch (error) {
      console.error("Error logging out:", error)
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || !agency) {
    return null
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <div
          className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
        >
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <div className="flex items-center gap-2">
              {agency.logo_url ? (
                <img
                  src={agency.logo_url || "/placeholder.svg"}
                  alt={agency.name}
                  className="h-8 w-8 object-contain rounded"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg?height=32&width=32&text=A"
                  }}
                />
              ) : (
                <div
                  className="h-8 w-8 rounded flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: agency.primary_color }}
                >
                  {agency.name.charAt(0)}
                </div>
              )}
              <span className="font-semibold text-gray-900 truncate">{agency.name}</span>
            </div>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="mt-4 px-2">
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive ? "text-white" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                    style={isActive ? { backgroundColor: agency.primary_color } : {}}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 ${isActive ? "text-white" : "text-gray-400 group-hover:text-gray-500"}`}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback style={{ backgroundColor: agency.primary_color, color: "white" }}>
                  {user.first_name[0]}
                  {user.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.roles?.[0]?.name || "Agency User"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <header className="bg-white shadow-sm border-b">
            <div className="flex items-center justify-between h-16 px-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                  <Menu className="h-5 w-5" />
                </Button>

                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input placeholder="Search..." className="pl-10 w-64 bg-gray-50 border-gray-200" />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback style={{ backgroundColor: agency.primary_color, color: "white" }}>
                          {user.first_name[0]}
                          {user.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/agency/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>

        {/* Sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </Suspense>
  )
}
