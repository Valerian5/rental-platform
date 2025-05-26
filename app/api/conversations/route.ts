import { type NextRequest, NextResponse } from "next/server"
import { messageService } from "@/lib/message-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")

    if (!userId) {
      return NextResponse.json({ error: "user_id requis" }, { status: 400 })
    }

    const conversations = await messageService.getUserConversations(userId)
    return NextResponse.json({ conversations })
  } catch (error) {
    console.error("Erreur API conversations:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur interne" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type } = body

    if (type === "send_message") {
      const { conversation_id, sender_id, content } = body
      const message = await messageService.sendMessage({
        conversation_id,
        sender_id,
        content,
      })
      return NextResponse.json({ message }, { status: 201 })
    } else {
      const conversation = await messageService.getOrCreateConversation(body)
      return NextResponse.json({ conversation }, { status: 201 })
    }
  } catch (error) {
    console.error("Erreur API conversation:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur interne" }, { status: 500 })
  }
}
