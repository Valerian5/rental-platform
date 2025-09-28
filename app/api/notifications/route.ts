import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedUserFromToken } from "@/lib/supabase-server-client"
import { notificationsService } from "@/lib/notifications-service"

/**
 * GET /api/notifications?unreadOnly=true|false
 * Récupère les notifications de l'utilisateur connecté
 */
export async function GET(request: NextRequest) {
  try {
    // Récupérer l'utilisateur authentifié depuis l'Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: "Token d'authentification requis" },
        { status: 401 }
      )
    }

    const user = await getAuthenticatedUserFromToken(authHeader)
    
    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    console.log("🔔 API Notifications GET", { userId: user.id, unreadOnly })

    // Récupérer les notifications
    const notifications = await notificationsService.getUserNotifications(user.id, unreadOnly)
    const unreadCount = await notificationsService.getUnreadCount(user.id)

    console.log(`✅ ${notifications.length} notifications récupérées, ${unreadCount} non lues`)

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    })
  } catch (error: any) {
    console.error("❌ Erreur API notifications GET:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erreur interne du serveur",
        notifications: [],
        unreadCount: 0,
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/notifications
 * Marque une notification comme lue
 * Body: { notificationId: string }
 */
export async function PATCH(request: NextRequest) {
  try {
    // Récupérer l'utilisateur authentifié
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: "Token d'authentification requis" },
        { status: 401 }
      )
    }

    const user = await getAuthenticatedUserFromToken(authHeader)
    
    // Récupérer les données de la requête
    const body = await request.json()
    const { notificationId } = body

    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: "notificationId requis" },
        { status: 400 }
      )
    }

    console.log("🔔 API Notifications PATCH", { userId: user.id, notificationId })

    // Récupérer le token pour l'utiliser avec le service
    const token = authHeader.replace('Bearer ', '')
    
    // Marquer la notification comme lue
    const result = await notificationsService.markAsRead(notificationId, user.id, token)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    console.log("✅ Notification marquée comme lue")

    return NextResponse.json({
      success: true,
      message: "Notification marquée comme lue",
    })
  } catch (error: any) {
    console.error("❌ Erreur API notifications PATCH:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erreur interne du serveur",
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/notifications
 * Création de notification côté backend (service_role)
 * Body: { user_id, title, content, type, action_url? }
 */
export async function POST(request: NextRequest) {
  try {
    // Récupérer l'utilisateur authentifié (pour vérifier les permissions)
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: "Token d'authentification requis" },
        { status: 401 }
      )
    }

    const user = await getAuthenticatedUserFromToken(authHeader)
    
    // Récupérer les données de la requête
    const body = await request.json()
    const { user_id, title, content, type, action_url } = body

    // Validation des données
    if (!user_id || !title || !content || !type) {
      return NextResponse.json(
        { success: false, error: "user_id, title, content et type requis" },
        { status: 400 }
      )
    }

    console.log("🔔 API Notifications POST", { 
      requesterId: user.id, 
      targetUserId: user_id, 
      type 
    })

    // Créer la notification (utilise service_role)
    const notification = await notificationsService.createNotificationServer(
      user_id,
      title,
      content,
      type,
      action_url
    )

    console.log("✅ Notification créée:", notification.id)

    return NextResponse.json({
      success: true,
      notification,
      message: "Notification créée avec succès",
    })
  } catch (error: any) {
    console.error("❌ Erreur API notifications POST:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erreur interne du serveur",
      },
      { status: 500 }
    )
  }
}