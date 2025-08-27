import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { sendNewMessageNotificationEmail } from "@/lib/email-service"

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

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const conversationId = params.id
    const body = await request.json()
    const { sender_id, content, attachments } = body

    if (!conversationId || !sender_id || !content) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 })
    }

    console.log("📨 Création message pour conversation:", conversationId)

    // Créer le message
    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id,
        content,
        attachments: attachments || [],
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("❌ Erreur création message:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Récupérer les détails de la conversation pour la notification
    const { data: conversation } = await supabase
      .from("conversations")
      .select(`
        *,
        tenant:users!conversations_tenant_id_fkey(id, first_name, last_name, email),
        owner:users!conversations_owner_id_fkey(id, first_name, last_name, email)
      `)
      .eq("id", conversationId)
      .single()

    if (conversation) {
      try {
        // Déterminer le destinataire (l'autre partie)
        const isSenderTenant = sender_id === conversation.tenant_id
        const recipient = isSenderTenant ? conversation.owner : conversation.tenant
        const sender = isSenderTenant ? conversation.tenant : conversation.owner

        if (recipient && sender) {
          const senderName = `${sender.first_name} ${sender.last_name}`
          
          // Envoyer la notification email
          await sendNewMessageNotificationEmail(
            {
              id: recipient.id,
              name: `${recipient.first_name} ${recipient.last_name}`,
              email: recipient.email
            },
            senderName
          )
          
          console.log(`📧 Notification email envoyée à ${recipient.email}`)
        }
      } catch (emailError) {
        console.error("❌ Erreur envoi notification message:", emailError)
        // Ne pas échouer la requête pour autant
      }
    }

    // Mettre à jour la date de dernière activité de la conversation
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId)

    console.log("✅ Message créé:", message.id)
    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error("❌ Erreur API création message:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur interne" }, { status: 500 })
  }
}
