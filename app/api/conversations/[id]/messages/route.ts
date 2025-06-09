import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const conversationId = params.id

    if (!conversationId) {
      return NextResponse.json({ error: "ID de conversation requis" }, { status: 400 })
    }

    console.log("🔍 Récupération messages pour conversation:", conversationId)

    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("❌ Erreur récupération messages:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("✅ Messages récupérés:", messages.length)
    return NextResponse.json({ messages })
  } catch (error) {
    console.error("❌ Erreur API messages:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur interne" }, { status: 500 })
  }
}
