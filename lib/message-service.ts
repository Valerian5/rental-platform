import { supabase } from "./supabase"

export interface ConversationData {
  property_id?: string
  tenant_id: string
  owner_id: string
  subject: string
}

export interface MessageData {
  conversation_id: string
  sender_id: string
  content: string
}

export const messageService = {
  // Créer ou récupérer une conversation
  async getOrCreateConversation(conversationData: ConversationData) {
    console.log("💬 MessageService.getOrCreateConversation", conversationData)

    try {
      // Chercher une conversation existante
      let query = supabase
        .from("conversations")
        .select("*")
        .eq("tenant_id", conversationData.tenant_id)
        .eq("owner_id", conversationData.owner_id)

      if (conversationData.property_id) {
        query = query.eq("property_id", conversationData.property_id)
      }

      const { data: existing } = await query.single()

      if (existing) {
        console.log("✅ Conversation existante trouvée:", existing)
        return existing
      }

      // Créer une nouvelle conversation
      const { data, error } = await supabase.from("conversations").insert(conversationData).select().single()

      if (error) {
        console.error("❌ Erreur création conversation:", error)
        throw new Error(error.message)
      }

      console.log("✅ Nouvelle conversation créée:", data)
      return data
    } catch (error) {
      console.error("❌ Erreur dans getOrCreateConversation:", error)
      throw error
    }
  },

  // Récupérer les conversations d'un utilisateur
  async getUserConversations(userId: string) {
    console.log("📋 MessageService.getUserConversations", userId)

    try {
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          property:properties(id, title, address, city),
          tenant:users!conversations_tenant_id_fkey(id, first_name, last_name),
          owner:users!conversations_owner_id_fkey(id, first_name, last_name),
          messages(
            id, content, sender_id, is_read, created_at
          )
        `)
        .or(`tenant_id.eq.${userId},owner_id.eq.${userId}`)
        .order("updated_at", { ascending: false })

      if (error) {
        console.error("❌ Erreur récupération conversations:", error)
        throw new Error(error.message)
      }

      // Trier les messages par date pour chaque conversation
      const conversationsWithSortedMessages =
        data?.map((conv) => ({
          ...conv,
          messages:
            conv.messages?.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) || [],
        })) || []

      console.log("✅ Conversations récupérées:", conversationsWithSortedMessages.length)
      return conversationsWithSortedMessages
    } catch (error) {
      console.error("❌ Erreur dans getUserConversations:", error)
      throw error
    }
  },

  // Envoyer un message
  async sendMessage(messageData: MessageData) {
    console.log("📤 MessageService.sendMessage", messageData)

    try {
      const { data, error } = await supabase.from("messages").insert(messageData).select().single()

      if (error) {
        console.error("❌ Erreur envoi message:", error)
        throw new Error(error.message)
      }

      // Mettre à jour la date de dernière activité de la conversation
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", messageData.conversation_id)

      console.log("✅ Message envoyé:", data)
      return data
    } catch (error) {
      console.error("❌ Erreur dans sendMessage:", error)
      throw error
    }
  },

  // Marquer les messages comme lus
  async markMessagesAsRead(conversationId: string, userId: string) {
    console.log("👁️ MessageService.markMessagesAsRead", conversationId, userId)

    try {
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", userId)
        .eq("is_read", false)

      if (error) {
        console.error("❌ Erreur marquage messages lus:", error)
        throw new Error(error.message)
      }

      console.log("✅ Messages marqués comme lus")
    } catch (error) {
      console.error("❌ Erreur dans markMessagesAsRead:", error)
      throw error
    }
  },
}
