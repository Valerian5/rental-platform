import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")

    if (!userId) {
      return NextResponse.json({ error: "user_id est requis" }, { status: 400 })
    }

    console.log("🔍 Chargement conversations pour:", userId)

    // Récupérer les conversations où l'utilisateur est soit tenant soit owner
    const { data: conversations, error } = await supabase
      .from("conversations")
      .select(`
        *,
        tenant:tenant_id(*),
        owner:owner_id(*)
      `)
      .or(`tenant_id.eq.${userId},owner_id.eq.${userId}`)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("❌ Erreur récupération conversations:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération des conversations" }, { status: 500 })
    }

    console.log("✅ Conversations trouvées:", conversations?.length || 0)

    // Pour chaque conversation, récupérer les messages
    const conversationsWithMessages = await Promise.all(
      conversations.map(async (conversation) => {
        const { data: messages, error: messagesError } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversation.id)
          .order("created_at", { ascending: true })

        if (messagesError) {
          console.error(`❌ Erreur récupération messages pour conversation ${conversation.id}:`, messagesError)
          return { ...conversation, messages: [] }
        }

        // Si la conversation a un property_id, récupérer les détails de la propriété
        let property = null
        if (conversation.property_id) {
          const { data: propertyData, error: propertyError } = await supabase
            .from("properties")
            .select("*")
            .eq("id", conversation.property_id)
            .single()

          if (!propertyError && propertyData) {
            // Extraire l'image principale
            let mainImage = null
            if (propertyData.images && Array.isArray(propertyData.images)) {
              const primaryImage = propertyData.images.find((img) => img.is_primary === true)
              mainImage = primaryImage?.url || (propertyData.images.length > 0 ? propertyData.images[0].url : null)
            }

            property = {
              id: propertyData.id,
              title: propertyData.title,
              address: propertyData.address,
              city: propertyData.city,
              price: propertyData.price,
              images: propertyData.images,
              mainImage: mainImage,
            }
          }
        }

        return {
          ...conversation,
          messages: messages || [],
          property: property,
        }
      }),
    )

    return NextResponse.json({
      conversations: conversationsWithMessages,
    })
  } catch (error) {
    console.error("❌ Erreur API conversations:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type } = body

    // Gestion des différents types de requêtes
    if (type === "send_message") {
      return await handleSendMessage(body)
    } else {
      return await handleCreateConversation(body)
    }
  } catch (error) {
    console.error("❌ Erreur API conversations POST:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

async function handleSendMessage(data: any) {
  const { conversation_id, sender_id, content } = data

  if (!conversation_id || !sender_id || !content) {
    return NextResponse.json({ error: "conversation_id, sender_id et content sont requis" }, { status: 400 })
  }

  // Insérer le message
  const { data: message, error: messageError } = await supabase
    .from("messages")
    .insert({
      conversation_id,
      sender_id,
      content,
    })
    .select()
    .single()

  if (messageError) {
    console.error("❌ Erreur envoi message:", messageError)
    return NextResponse.json({ error: "Erreur lors de l'envoi du message" }, { status: 500 })
  }

  // Mettre à jour la date de mise à jour de la conversation
  await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversation_id)

  return NextResponse.json({
    message,
  })
}

async function handleCreateConversation(data: any) {
  const { tenant_id, owner_id, subject, property_id } = data

  if (!tenant_id || !owner_id) {
    return NextResponse.json({ error: "tenant_id et owner_id sont requis" }, { status: 400 })
  }

  // Créer la conversation
  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .insert({
      tenant_id,
      owner_id,
      subject: subject || "Nouvelle conversation",
      property_id: property_id || null,
    })
    .select()
    .single()

  if (conversationError) {
    console.error("❌ Erreur création conversation:", conversationError)
    return NextResponse.json({ error: "Erreur lors de la création de la conversation" }, { status: 500 })
  }

  return NextResponse.json({
    conversation,
  })
}
