import { type NextRequest, NextResponse } from "next/server"
import { notificationsService } from "@/lib/notifications-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")
    const unreadOnly = searchParams.get("unread_only") === "true"

    console.log("🔔 API Notifications GET - userId:", userId, "unreadOnly:", unreadOnly)

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "user_id requis",
        },
        { status: 400 },
      )
    }

    // Récupérer les notifications
    const notifications = await notificationsService.getUserNotifications(userId, unreadOnly)

    // Récupérer le nombre de notifications non lues
    const unreadCount = await notificationsService.getUnreadCount(userId)

    console.log("✅ API Notifications - Récupérées:", notifications.length, "notifications, non lues:", unreadCount)

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    })
  } catch (error: any) {
    console.error("❌ Erreur API notifications:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erreur interne du serveur",
        notifications: [],
        unreadCount: 0,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, title, content, type, action_url } = body

    console.log("🔔 API Notifications POST - Création notification:", { user_id, title, type })

    if (!user_id || !title || !content || !type) {
      return NextResponse.json(
        {
          success: false,
          error: "Données manquantes (user_id, title, content, type requis)",
        },
        { status: 400 },
      )
    }

    const notification = await notificationsService.createNotification(user_id, {
      title,
      content,
      type,
      action_url,
    })

    console.log("✅ API Notifications - Notification créée:", notification.id)

    return NextResponse.json({
      success: true,
      notification,
    })
  } catch (error: any) {
    console.error("❌ Erreur création notification:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erreur lors de la création",
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificationId, read } = body

    console.log("🔔 API Notifications PATCH - Marquage notification:", notificationId, "read:", read)

    if (!notificationId) {
      return NextResponse.json(
        {
          success: false,
          error: "notificationId requis",
        },
        { status: 400 },
      )
    }

    await notificationsService.markAsRead(notificationId)

    console.log("✅ API Notifications - Notification marquée comme lue")

    return NextResponse.json({
      success: true,
      message: "Notification marquée comme lue",
    })
  } catch (error: any) {
    console.error("❌ Erreur marquage notification:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erreur lors du marquage",
      },
      { status: 500 },
    )
  }
}