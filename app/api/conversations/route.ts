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
      .select("*")
      .or(`tenant_id.eq.${userId},owner_id.eq.${userId}`)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("❌ Erreur récupération conversations:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération des conversations" }, { status: 500 })
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
            console.log("🏠 Récupération propriété:", conv.property_id)

            const { data: propertyData, error: propertyError } = await supabase
              .from("properties")
              .select("id, title, address, city, price")
              .eq("id", conv.property_id)
              .single()

            if (!propertyError && propertyData) {
              // Récupérer les images de la propriété depuis property_images
              const { data: images, error: imagesError } = await supabase
                .from("property_images")
                .select("url, is_primary")
                .eq("property_id", conv.property_id)
                .order("is_primary", { ascending: false })

              if (imagesError) {
                console.error("❌ Erreur récupération images propriété:", imagesError)
              }

              // Extraire l'image principale
              let mainImage = null
              if (images && images.length > 0) {
                const primaryImage = images.find((img) => img.is_primary === true)
                mainImage = primaryImage?.url || images[0]?.url
              }

              property = {
                id: propertyData.id,
                title: propertyData.title,
                address: propertyData.address,
                city: propertyData.city,
                price: propertyData.price,
                images: images || [],
                mainImage: mainImage,
              }

              console.log("✅ Propriété enrichie:", property.title, "avec", images?.length || 0, "images")
            }
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
    console.log("📋 Conversations avec propriétés:", enrichedConversations.filter((c) => c.property).length)

    return NextResponse.json({
      conversations: enrichedConversations,
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
    } else if (type === "find_or_create") {
      // Trouver ou créer une conversation avec gestion intelligente des propriétés
      const { tenant_id, owner_id, property_id, subject } = body

      if (!tenant_id || !owner_id) {
        return NextResponse.json({ error: "tenant_id et owner_id requis" }, { status: 400 })
      }

      console.log("🔍 Recherche conversation intelligente:", { tenant_id, owner_id, property_id })

      const existingConversation = null

      if (property_id) {
        // Si on a un property_id, chercher d'abord une conversation avec cette propriété spécifique
        const { data: specificConv } = await supabase
          .from("conversations")
          .select("*")
          .eq("tenant_id", tenant_id)
          .eq("owner_id", owner_id)
          .eq("property_id", property_id)
          .maybeSingle()

        if (specificConv) {
          console.log("✅ Conversation trouvée avec propriété spécifique:", specificConv.id)
          return NextResponse.json({ conversation: specificConv })
        }

        // Si pas trouvé avec propriété spécifique, chercher une conversation générale (sans propriété)
        const { data: generalConv } = await supabase
          .from("conversations")
          .select("*")
          .eq("tenant_id", tenant_id)
          .eq("owner_id", owner_id)
          .is("property_id", null)
          .maybeSingle()

        if (generalConv) {
          console.log("✅ Conversation générale trouvée, mise à jour avec propriété:", generalConv.id)
          // Mettre à jour la conversation existante avec le property_id
          const { data: updatedConv, error: updateError } = await supabase
            .from("conversations")
            .update({ property_id: property_id })
            .eq("id", generalConv.id)
            .select()
            .single()

          if (updateError) {
            console.error("❌ Erreur mise à jour conversation:", updateError)
          } else {
            return NextResponse.json({ conversation: updatedConv })
          }
        }
      } else {
        // Si pas de property_id, chercher une conversation générale
        const { data: generalConv } = await supabase
          .from("conversations")
          .select("*")
          .eq("tenant_id", tenant_id)
          .eq("owner_id", owner_id)
          .is("property_id", null)
          .maybeSingle()

        if (generalConv) {
          console.log("✅ Conversation générale trouvée:", generalConv.id)
          return NextResponse.json({ conversation: generalConv })
        }
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
    } else {
      // Ancienne méthode pour compatibilité
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
