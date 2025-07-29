"use client"

import { useState, useEffect } from "react"
import { Bell, AlertCircle, MessageSquare, Calendar, CreditCard, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"

interface Notification {
  id: string
  type: "application_received" | "visit_scheduled" | "payment_received" | "message_received" | "document_uploaded"
  title: string
  content: string
  read: boolean
  created_at: string
  action_url?: string | null
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "application_received":
      return <Home className="h-4 w-4 text-blue-600" />
    case "visit_scheduled":
      return <Calendar className="h-4 w-4 text-green-600" />
    case "payment_received":
      return <CreditCard className="h-4 w-4 text-emerald-600" />
    case "message_received":
      return <MessageSquare className="h-4 w-4 text-purple-600" />
    case "document_uploaded":
      return <AlertCircle className="h-4 w-4 text-orange-600" />
    default:
      return <Bell className="h-4 w-4 text-gray-600" />
  }
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return "À l'instant"
  if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`
  if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)} h`
  return `Il y a ${Math.floor(diffInMinutes / 1440)} j`
}

const isFutureVisit = (notification: Notification): boolean => {
  if (notification.type !== "visit_scheduled") return true

  // Essayer plusieurs formats de date pour plus de robustesse
  const dateFormats = [
    // Format "JJ/MM/AAAA à HHhMM"
    /(\d{1,2})\/(\d{1,2})\/(\d{4}) à (\d{1,2})h(\d{0,2})/,
    // Format "JJ-MM-AAAA HH:MM"
    /(\d{1,2})-(\d{1,2})-(\d{4}) (\d{1,2}):(\d{0,2})/,
    // Format "AAAA-MM-JJTHH:MM"
    /(\d{4})-(\d{1,2})-(\d{1,2})T(\d{1,2}):(\d{0,2})/
  ]

  for (const format of dateFormats) {
    const match = notification.content.match(format)
    if (match) {
      const [, day, month, year, hour, minute] = match
      const visitDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute || '0')
      )
      return visitDate >= new Date()
    }
  }

  return false // Si on ne peut pas parser la date, on exclut la notification
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async () => {
    try {
      setError(null)
      const userStr = localStorage.getItem("user")
      if (!userStr) {
        setLoading(false)
        setError("Utilisateur non connecté")
        return
      }

      const user = JSON.parse(userStr)
      if (!user.id) {
        setLoading(false)
        setError("ID utilisateur manquant")
        return
      }

      const response = await fetch(`/api/notifications?user_id=${user.id}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)

      const data = await response.json()
      if (data.success) {
        // Filtrer les notifications pour ne garder que les visites futures et autres notifications
        const filteredNotifications = (data.notifications || []).filter(isFutureVisit)
        
        setNotifications(filteredNotifications)
        setUnreadCount(filteredNotifications.filter(n => !n.read).length)
      } else {
        setError(data.error || "Erreur lors du chargement")
        setNotifications([])
        setUnreadCount(0)
      }
    } catch (error: any) {
      setError(error.message || "Erreur de connexion")
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId, read: true }),
      })

      const result = await response.json()
      if (result.success) {
        setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Erreur marquage notification:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read)
      await Promise.all(
        unreadNotifications.map(n =>
          fetch("/api/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notificationId: n.id, read: true }),
          })
        )
      )
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error("Erreur marquage toutes notifications:", error)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              variant="destructive"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                Tout marquer comme lu
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-96">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p>Chargement...</p>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-600">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">{error}</p>
              <Button variant="ghost" size="sm" onClick={loadNotifications} className="mt-2">
                Réessayer
              </Button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.read ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                  }`}
                  onClick={() => {
                    if (!notification.read) markAsRead(notification.id)
                    setOpen(false)
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h4 className={`text-sm font-medium ${!notification.read ? "text-blue-900" : ""}`}>
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <div className="h-2 w-2 bg-blue-600 rounded-full ml-2 mt-1 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{notification.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">{formatTimeAgo(notification.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button variant="ghost" className="w-full text-sm" onClick={() => setOpen(false)}>
                Voir toutes les notifications
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}