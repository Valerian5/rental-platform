import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")

    if (!userId) {
      return NextResponse.json({ error: "user_id requis" }, { status: 400 })
    }

    console.log("🔍 Récupération conversations pour:", userId)

    // Récupérer les conversations où l'utilisateur est soit locataire soit propriétaire
    const { data: conversations, error } = await supabase
      .from("conversations")
      .select(`
        *,
        tenant:users!conversations_tenant_id_fkey(id, first_name, last_name, email, phone),
        owner:users!conversations_owner_id_fkey(id, first_name, last_name, email, phone),
        property:properties(id, title, address, city),
        messages(
          id, content, sender_id, is_read, created_at
        )
      `)
      .or(`tenant_id.eq.${userId},owner_id.eq.${userId}`)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("❌ Erreur récupération conversations:", error)
      return NextResponse.json({ conversations: [] })
    }

    // Trier les messages par date pour chaque conversation
    const conversationsWithSortedMessages =
      conversations?.map((conv) => ({
        ...conv,
        messages:
          conv.messages?.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) || [],
      })) || []

    console.log("✅ Conversations récupérées:", conversationsWithSortedMessages.length)
    return NextResponse.json({ conversations: conversationsWithSortedMessages })
  } catch (error) {
    console.error("❌ Erreur API conversations GET:", error)
    return NextResponse.json({ conversations: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type } = body

    console.log("📤 API conversations POST:", { type, body })

    if (type === "send_message") {
      // Envoyer un message
      const { conversation_id, sender_id, content } = body

      if (!conversation_id || !sender_id || !content) {
        return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
      }

      const { data: message, error } = await supabase
        .from("messages")
        .insert({
          conversation_id,
          sender_id,
          content: content.trim(),
        })
        .select()
        .single()

      if (error) {
        console.error("❌ Erreur envoi message:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      console.log("✅ Message envoyé:", message.id)
      return NextResponse.json({ message }, { status: 201 })
    } else {
      // Créer ou récupérer une conversation
      const { tenant_id, owner_id, property_id, subject } = body

      if (!tenant_id || !owner_id) {
        return NextResponse.json({ error: "tenant_id et owner_id requis" }, { status: 400 })
      }

      console.log("🔍 Recherche conversation existante:", { tenant_id, owner_id, property_id })

      // Chercher une conversation existante
      let query = supabase.from("conversations").select("*").eq("tenant_id", tenant_id).eq("owner_id", owner_id)

      if (property_id) {
        query = query.eq("property_id", property_id)
      } else {
        query = query.is("property_id", null)
      }

      const { data: existing } = await query.single()

      if (existing) {
        console.log("✅ Conversation existante trouvée:", existing.id)
        return NextResponse.json({ conversation: existing })
      }

      // Créer une nouvelle conversation
      console.log("🆕 Création nouvelle conversation")
      const { data: conversation, error } = await supabase
        .from("conversations")
        .insert({
          tenant_id,
          owner_id,
          property_id: property_id || null,
          subject: subject || "Nouvelle conversation",
        })
        .select()
        .single()

      if (error) {
        console.error("❌ Erreur création conversation:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      console.log("✅ Conversation créée:", conversation.id)
      return NextResponse.json({ conversation }, { status: 201 })
    }
  } catch (error) {
    console.error("❌ Erreur API conversations POST:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur interne" }, { status: 500 })
  }
}
