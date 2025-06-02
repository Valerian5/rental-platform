"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, CheckCheck, Trash2, Eye, ExternalLink } from "lucide-react"
import Link from "next/link"
import { authService } from "@/lib/auth-service"
import { notificationsService, type Notification } from "@/lib/notifications-service"
import { toast } from "sonner"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "unread">("all")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (user && user.user_type === "tenant") {
          setCurrentUser(user)
          await loadNotifications(user.id)
        }
      } catch (error) {
        console.error("Erreur chargement utilisateur:", error)
        toast.error("Erreur lors du chargement")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const loadNotifications = async (userId: string) => {
    try {
      const data = await notificationsService.getUserNotifications(userId, filter === "unread")
      setNotifications(data)
    } catch (error) {
      console.error("Erreur chargement notifications:", error)
      toast.error("Erreur lors du chargement des notifications")
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsService.markAsRead(notificationId)
      setNotifications((prev) => prev.map((notif) => (notif.id === notificationId ? { ...notif, read: true } : notif)))
      toast.success("Notification marquée comme lue")
    } catch (error) {
      console.error("Erreur marquage notification:", error)
      toast.error("Erreur lors du marquage")
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!currentUser) return

    try {
      await notificationsService.markAllAsRead(currentUser.id)
      setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))
      toast.success("Toutes les notifications marquées comme lues")
    } catch (error) {
      console.error("Erreur marquage toutes notifications:", error)
      toast.error("Erreur lors du marquage")
    }
  }

  const handleDelete = async (notificationId: string) => {
    try {
      await notificationsService.deleteNotification(notificationId)
      setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId))
      toast.success("Notification supprimée")
    } catch (error) {
      console.error("Erreur suppression notification:", error)
      toast.error("Erreur lors de la suppression")
    }
  }

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "unread") return !notif.read
    return true
  })

  const unreadCount = notifications.filter((notif) => !notif.read).length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "application":
        return "📝"
      case "message":
        return "💬"
      case "visit":
        return "🏠"
      case "property":
        return "🏡"
      case "system":
        return "⚙️"
      default:
        return "🔔"
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "application":
        return "bg-blue-50 border-blue-200"
      case "message":
        return "bg-green-50 border-green-200"
      case "visit":
        return "bg-purple-50 border-purple-200"
      case "property":
        return "bg-orange-50 border-orange-200"
      case "system":
        return "bg-gray-50 border-gray-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Vous devez être connecté pour voir vos notifications</p>
        <Link href="/login">
          <Button className="mt-4">Se connecter</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">
            {unreadCount > 0
              ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`
              : "Toutes vos notifications sont lues"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Tout marquer comme lu
            </Button>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2">
        <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
          Toutes ({notifications.length})
        </Button>
        <Button variant={filter === "unread" ? "default" : "outline"} size="sm" onClick={() => setFilter("unread")}>
          Non lues ({unreadCount})
        </Button>
      </div>

      {/* Liste des notifications */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {filter === "unread" ? "Aucune notification non lue" : "Aucune notification"}
                </h3>
                <p className="text-gray-600">
                  {filter === "unread"
                    ? "Toutes vos notifications sont à jour !"
                    : "Vous recevrez ici les notifications importantes."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-all hover:shadow-md ${
                !notification.read ? "ring-2 ring-blue-100" : ""
              } ${getNotificationColor(notification.type)}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{notification.title}</h3>
                        {!notification.read && (
                          <Badge variant="default" className="text-xs">
                            Nouveau
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-700 text-sm mb-2">{notification.content}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          {new Date(notification.created_at).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {notification.type}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {notification.action_url && (
                      <Link href={notification.action_url}>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}

                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                        title="Marquer comme lu"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(notification.id)}
                      title="Supprimer"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
