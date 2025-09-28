// app/api/notifications/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createApiSupabaseClient } from "@/lib/supabase-server-client"
import { notificationsService } from "@/lib/notifications-service"

export async function GET(request: NextRequest) {
  const supabase = createApiSupabaseClient(request)

  // Récupérer l'utilisateur connecté depuis le token
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ success: false, error: "Utilisateur non authentifié" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const unreadOnly = searchParams.get("unreadOnly") === "true"

  const result = await notificationsService.getUserNotifications(user.id, unreadOnly)

  if (!result.success) {
    return NextResponse.json(result, { status: 500 })
  }

  return NextResponse.json(result)
}

export async function PATCH(request: NextRequest) {
  const supabase = createApiSupabaseClient(request)

  // Récupérer l'utilisateur connecté
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ success: false, error: "Utilisateur non authentifié" }, { status: 401 })
  }

  const { id } = await request.json()

  if (!id) {
    return NextResponse.json({ success: false, error: "ID de notification manquant" }, { status: 400 })
  }

  const result = await notificationsService.markNotificationAsRead(id, user.id)

  if (!result.success) {
    return NextResponse.json(result, { status: 500 })
  }

  return NextResponse.json(result)
}
