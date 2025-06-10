import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")

    if (!userId) {
      return NextResponse.json({ error: "user_id est requis" }, { status: 400 })
    }

    console.log("🔍 Récupération conversations pour utilisateur:", userId)

    // Récupérer les conversations où l'utilisateur est soit tenant soit owner
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
    console.log("📥 Requête POST conversations:", body)

    if (body.type === "send_message") {
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
          content,
          is_read: false,
        })
        .select()
        .single()

      if (error) {
        console.error("❌ Erreur création message:", error)
        return NextResponse.json({ error: "Erreur lors de la création du message" }, { status: 500 })
      }

      // Mettre à jour la date de dernière modification de la conversation
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversation_id)

      console.log("✅ Message créé:", message.id)

      return NextResponse.json({ message })
    } else {
      // Créer une conversation
      const { tenant_id, owner_id, subject, property_id } = body

      if (!tenant_id || !owner_id || !subject) {
        return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
      }

      const { data: conversation, error } = await supabase
        .from("conversations")
        .insert({
          tenant_id,
          owner_id,
          subject,
          property_id: property_id || null,
        })
        .select()
        .single()

      if (error) {
        console.error("❌ Erreur création conversation:", error)
        return NextResponse.json({ error: "Erreur lors de la création de la conversation" }, { status: 500 })
      }

      console.log("✅ Conversation créée:", conversation.id)

      return NextResponse.json({ conversation }, { status: 201 })
    }
  } catch (error) {
    console.error("❌ Erreur API conversations POST:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
