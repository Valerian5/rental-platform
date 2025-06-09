import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    console.log("🔍 Vérification des tables de messagerie")

    // Vérifier si la table conversations existe
    const { data: conversations, error: convError } = await supabase
      .from("conversations")
      .select("count", { count: "exact", head: true })

    // Vérifier si la table messages existe
    const { data: messages, error: msgError } = await supabase
      .from("messages")
      .select("count", { count: "exact", head: true })

    // Vérifier la structure des tables
    const { data: convStructure, error: convStructError } = await supabase.from("conversations").select("*").limit(1)

    const { data: msgStructure, error: msgStructError } = await supabase.from("messages").select("*").limit(1)

    return NextResponse.json({
      conversations: {
        exists: !convError,
        error: convError?.message,
        count: conversations,
        structure: convStructure,
      },
      messages: {
        exists: !msgError,
        error: msgError?.message,
        count: messages,
        structure: msgStructure,
      },
    })
  } catch (error) {
    console.error("❌ Erreur debug tables:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
