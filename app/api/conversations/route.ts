import { type NextRequest, NextResponse } from "next/server"
import { messageService } from "@/lib/message-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")

    if (!userId) {
      return NextResponse.json({ error: "user_id requis" }, { status: 400 })
    }

    console.log("🔍 Récupération conversations pour:", userId)

    // Vérifier si le service existe et a la méthode
    if (!messageService || typeof messageService.getUserConversations !== "function") {
      console.log("⚠️ Service de messagerie non disponible")
      return NextResponse.json({ conversations: [] })
    }

    const conversations = await messageService.getUserConversations(userId)
    console.log("✅ Conversations trouvées:", conversations?.length || 0)

    return NextResponse.json({ conversations: conversations || [] })
  } catch (error) {
    console.error("❌ Erreur API conversations:", error)
    // Retourner un tableau vide au lieu d'une erreur pour éviter de casser l'interface
    return NextResponse.json({ conversations: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type } = body

    if (type === "send_message") {
      const { conversation_id, sender_id, content } = body

      if (!messageService || typeof messageService.sendMessage !== "function") {
        return NextResponse.json({ error: "Service de messagerie non disponible" }, { status: 503 })
      }

      const message = await messageService.sendMessage({
        conversation_id,
        sender_id,
        content,
      })
      return NextResponse.json({ message }, { status: 201 })
    } else {
      if (!messageService || typeof messageService.getOrCreateConversation !== "function") {
        return NextResponse.json({ error: "Service de messagerie non disponible" }, { status: 503 })
      }

      const conversation = await messageService.getOrCreateConversation(body)
      return NextResponse.json({ conversation }, { status: 201 })
    }
  } catch (error) {
    console.error("❌ Erreur API conversation POST:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur interne" }, { status: 500 })
  }
}
