import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user_id } = await request.json()
    const conversationId = params.id

    if (!user_id || !conversationId) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
    }

    // Marquer tous les messages de cette conversation comme lus pour cet utilisateur
    // (sauf ceux qu'il a envoyés lui-même)
    const { error } = await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", user_id)
      .eq("is_read", false)

    if (error) {
      console.error("❌ Erreur marquage messages lus:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("✅ Messages marqués comme lus pour conversation:", conversationId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Erreur API mark-read:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur interne" }, { status: 500 })
  }
}
