"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Heart, FileText, Calendar, MessageSquare, Bell, Settings, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { authService } from "@/lib/auth-service"
import { notificationsService } from "@/lib/notifications-service"

const navigation = [
  { name: "Tableau de bord", href: "/tenant/dashboard", icon: Home },
  { name: "Rechercher", href: "/tenant/search", icon: Search },
  { name: "Mes recherches", href: "/tenant/searches", icon: Search },
  { name: "Favoris", href: "/tenant/favorites", icon: Heart },
  { name: "Candidatures", href: "/tenant/applications", icon: FileText },
  { name: "Visites", href: "/tenant/visits", icon: Calendar },
  { name: "Messages", href: "/tenant/messaging", icon: MessageSquare },
  { name: "Notifications", href: "/tenant/notifications", icon: Bell },
]

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
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
        }
      } catch (error) {
        console.error("Erreur récupération utilisateur:", error)
      }
    }

    fetchUserData()
  }, [])

  const isActive = (href: string) => {
    if (href === "/tenant/dashboard") {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
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
                                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                  isActive(item.href)
                                    ? "bg-blue-100 text-blue-700"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                }`}
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
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <Home className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">RentalPlatform</span>
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
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
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
              <Link href="/tenant/notifications">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center"
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                </Button>
              </Link>

              {/* Menu utilisateur */}
              <div className="flex items-center space-x-3">
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
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">
                    {currentUser.first_name} {currentUser.last_name}
                  </p>
                  <p className="text-xs text-gray-500">Locataire</p>
                </div>
                <Link href="/tenant/settings">
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
