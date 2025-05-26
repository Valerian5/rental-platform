import { type NextRequest, NextResponse } from "next/server"

// Simulation d'une base de données pour les notifications
const notifications: any[] = [
  {
    id: 1,
    userId: 1,
    type: "application_received",
    title: "Nouvelle candidature reçue",
    message: "Jean Dupont a postulé pour votre appartement moderne au centre-ville",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    data: {
      applicationId: 1,
      propertyId: 1,
      tenantName: "Jean Dupont",
    },
  },
  {
    id: 2,
    userId: 1,
    type: "visit_scheduled",
    title: "Visite programmée",
    message: "Une visite a été programmée pour demain à 14h30",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    data: {
      visitId: 1,
      propertyId: 1,
      date: "2024-01-16",
      time: "14:30",
    },
  },
  {
    id: 3,
    userId: 1,
    type: "payment_received",
    title: "Paiement reçu",
    message: "Le loyer de janvier a été reçu (1350€)",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    data: {
      paymentId: 1,
      amount: 1350,
      propertyId: 1,
    },
  },
]

// GET - Récupérer les notifications d'un utilisateur
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")
    const unreadOnly = searchParams.get("unread_only") === "true"

    if (!userId) {
      return NextResponse.json({ error: "user_id requis" }, { status: 400 })
    }

    let userNotifications = notifications.filter((n) => n.userId === Number.parseInt(userId))

    if (unreadOnly) {
      userNotifications = userNotifications.filter((n) => !n.read)
    }

    // Trier par date de création (plus récent en premier)
    userNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({
      notifications: userNotifications,
      unreadCount: userNotifications.filter((n) => !n.read).length,
    })
  } catch (error) {
    console.error("Erreur lors de la récupération des notifications:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

// POST - Créer une nouvelle notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, title, message, data } = body

    // Validation des données
    if (!userId || !type || !title || !message) {
      return NextResponse.json({ error: "Informations manquantes" }, { status: 400 })
    }

    const newNotification = {
      id: notifications.length + 1,
      userId,
      type,
      title,
      message,
      read: false,
      createdAt: new Date().toISOString(),
      data: data || {},
    }

    notifications.push(newNotification)

    return NextResponse.json(
      {
        message: "Notification créée avec succès",
        notification: newNotification,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Erreur lors de la création de la notification:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

// PATCH - Marquer une notification comme lue
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificationId, read = true } = body

    if (!notificationId) {
      return NextResponse.json({ error: "notificationId requis" }, { status: 400 })
    }

    const notificationIndex = notifications.findIndex((n) => n.id === notificationId)

    if (notificationIndex === -1) {
      return NextResponse.json({ error: "Notification non trouvée" }, { status: 404 })
    }

    notifications[notificationIndex].read = read

    return NextResponse.json({
      message: "Notification mise à jour avec succès",
      notification: notifications[notificationIndex],
    })
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la notification:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
