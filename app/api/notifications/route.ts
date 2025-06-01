import { type NextRequest, NextResponse } from "next/server"
import { notificationsService } from "@/lib/notifications-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")
    const unreadOnly = searchParams.get("unread_only") === "true"

    if (!userId) {
      return NextResponse.json({ error: "user_id requis" }, { status: 400 })
    }

    const notifications = await notificationsService.getUserNotifications(userId, unreadOnly)
    const unreadCount = await notificationsService.getUnreadCount(userId)

    return NextResponse.json({ notifications, unread_count: unreadCount })
  } catch (error) {
    console.error("Erreur API notifications:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur interne" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, ...notificationData } = body

    if (!user_id) {
      return NextResponse.json({ error: "user_id requis" }, { status: 400 })
    }

    const notification = await notificationsService.createNotification(user_id, notificationData)
    return NextResponse.json({ notification }, { status: 201 })
  } catch (error) {
    console.error("Erreur création notification:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur interne" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { notification_id, action, user_id } = body

    if (action === "mark_read" && notification_id) {
      await notificationsService.markAsRead(notification_id)
      return NextResponse.json({ success: true })
    } else if (action === "mark_all_read" && user_id) {
      await notificationsService.markAllAsRead(user_id)
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Action ou paramètres invalides" }, { status: 400 })
    }
  } catch (error) {
    console.error("Erreur mise à jour notification:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur interne" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get("notification_id")

    if (!notificationId) {
      return NextResponse.json({ error: "notification_id requis" }, { status: 400 })
    }

    await notificationsService.deleteNotification(notificationId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur suppression notification:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur interne" }, { status: 500 })
  }
}
