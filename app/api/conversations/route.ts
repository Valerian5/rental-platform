import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")

    if (!userId) {
      return NextResponse.json({ error: "user_id requis" }, { status: 400 })
    }

    console.log("🔍 Récupération conversations pour utilisateur:", userId)

    // Récupérer les conversations où l'utilisateur est soit locataire soit propriétaire
    const { data: conversations, error } = await supabase
      .from("conversations")
      .select("*")
      .or(`tenant_id.eq.${userId},owner_id.eq.${userId}`)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("❌ Erreur récupération conversations:", error)
      return NextResponse.json({ conversations: [] })
    }

    console.log("✅ Conversations trouvées:", conversations?.length || 0)

    // Pour chaque conversation, récupérer les informations détaillées
    const enrichedConversations = await Promise.all(
      (conversations || []).map(async (conv) => {
        try {
          // Récupérer les informations du tenant
          const { data: tenant } = await supabase
            .from("users")
            .select("id, first_name, last_name, email, phone")
            .eq("id", conv.tenant_id)
            .single()

          // Récupérer les informations du owner
          const { data: owner } = await supabase
            .from("users")
            .select("id, first_name, last_name, email, phone")
            .eq("id", conv.owner_id)
            .single()

          // Récupérer les informations de la propriété si property_id existe
          let property = null
          if (conv.property_id) {
            const { data: propertyData } = await supabase
              .from("properties")
              .select("id, title, address, city, price, images")
              .eq("id", conv.property_id)
              .single()
            property = propertyData
          }

          // Récupérer les messages de la conversation
          const { data: messages } = await supabase
            .from("messages")
            .select("id, content, sender_id, is_read, created_at")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: true })

          return {
            ...conv,
            tenant,
            owner,
            property,
            messages: messages || [],
          }
        } catch (error) {
          console.error("❌ Erreur enrichissement conversation:", conv.id, error)
          return {
            ...conv,
            tenant: null,
            owner: null,
            property: null,
            messages: [],
          }
        }
      }),
    )

    console.log("✅ Conversations enrichies:", enrichedConversations.length)

    return NextResponse.json({
      conversations: enrichedConversations,
    })
  } catch (error) {
    console.error("❌ Erreur API conversations:", error)
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

      // Mettre à jour la date de la conversation
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversation_id)

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
      }

      const { data: existing } = await query.maybeSingle()

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
