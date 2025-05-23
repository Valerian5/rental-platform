import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

// Simulation d'une base de données pour les messages
const messages: any[] = []
const conversations: any[] = []

function verifyToken(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value || request.headers.get("authorization")?.replace("Bearer ", "")

  if (!token) {
    return null
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
  } catch {
    return null
  }
}

// GET - Récupérer les conversations de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const user = verifyToken(request)

    if (!user) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get("conversationId")

    if (conversationId) {
      // Récupérer les messages d'une conversation spécifique
      const conversation = conversations.find(
        (c) => c.id === conversationId && c.participants.includes((user as any).userId),
      )

      if (!conversation) {
        return NextResponse.json({ error: "Conversation non trouvée" }, { status: 404 })
      }

      const conversationMessages = messages.filter((m) => m.conversationId === conversationId)

      return NextResponse.json({
        conversation,
        messages: conversationMessages,
      })
    } else {
      // Récupérer toutes les conversations de l'utilisateur
      const userConversations = conversations.filter((c) => c.participants.includes((user as any).userId))

      return NextResponse.json({
        conversations: userConversations,
      })
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des messages:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

// POST - Envoyer un nouveau message
export async function POST(request: NextRequest) {
  try {
    const user = verifyToken(request)

    if (!user) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 })
    }

    const body = await request.json()
    const { conversationId, recipientId, content, subject } = body

    // Validation des données
    if (!content || (!conversationId && !recipientId)) {
      return NextResponse.json({ error: "Informations manquantes" }, { status: 400 })
    }

    let targetConversationId = conversationId

    // Si pas de conversation existante, en créer une nouvelle
    if (!conversationId && recipientId) {
      // Vérifier si une conversation existe déjà entre ces utilisateurs
      const existingConversation = conversations.find(
        (c) => c.participants.includes((user as any).userId) && c.participants.includes(recipientId),
      )

      if (existingConversation) {
        targetConversationId = existingConversation.id
      } else {
        // Créer une nouvelle conversation
        const newConversation = {
          id: Date.now().toString(),
          participants: [(user as any).userId, recipientId],
          subject: subject || "Nouvelle conversation",
          createdAt: new Date().toISOString(),
          lastMessageAt: new Date().toISOString(),
        }
        conversations.push(newConversation)
        targetConversationId = newConversation.id
      }
    }

    // Créer le nouveau message
    const newMessage = {
      id: Date.now().toString(),
      conversationId: targetConversationId,
      senderId: (user as any).userId,
      content,
      createdAt: new Date().toISOString(),
      read: false,
    }

    messages.push(newMessage)

    // Mettre à jour la date du dernier message de la conversation
    const conversation = conversations.find((c) => c.id === targetConversationId)
    if (conversation) {
      conversation.lastMessageAt = new Date().toISOString()
    }

    return NextResponse.json(
      {
        message: "Message envoyé avec succès",
        messageData: newMessage,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Erreur lors de l'envoi du message:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
