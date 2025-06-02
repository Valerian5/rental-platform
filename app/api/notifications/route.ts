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

    return NextResponse.json({ notifications })
  } catch (error: any) {
    console.error("❌ Erreur API notifications:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, title, content, type, action_url } = body

    if (!user_id || !title || !content || !type) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 })
    }

    const notification = await notificationsService.createNotification(user_id, {
      title,
      content,
      type,
      action_url,
    })

    return NextResponse.json({ notification })
  } catch (error: any) {
    console.error("❌ Erreur création notification:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
