import { supabase } from "./supabase"

export interface Notification {
  id: string
  user_id: string
  title: string
  content: string
  type: string
  read: boolean | null
  action_url: string | null
  created_at: string
}

export const notificationsService = {
  async getUserNotifications(userId: string, unreadOnly = false): Promise<Notification[]> {
    console.log("🔔 NotificationsService.getUserNotifications", { userId, unreadOnly })

    try {
      let query = supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (unreadOnly) {
        query = query.or("read.is.null,read.eq.false")
      }

      const { data, error } = await query

      if (error) {
        console.error("❌ Erreur récupération notifications:", error)
        throw new Error(`Erreur base de données: ${error.message}`)
      }

      console.log(`✅ ${data?.length || 0} notifications récupérées pour l'utilisateur ${userId}`)

      // Transformer les données pour s'assurer que read est un boolean
      const transformedData = (data || []).map((notification) => ({
        ...notification,
        read: notification.read === true,
      }))

      return transformedData as Notification[]
    } catch (error) {
      console.error("❌ Erreur dans getUserNotifications:", error)
      throw error
    }
  },

  async getUnreadCount(userId: string): Promise<number> {
    console.log("🔔 NotificationsService.getUnreadCount", userId)

    try {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .or("read.is.null,read.eq.false")

      if (error) {
        console.error("❌ Erreur comptage non lues:", error)
        throw new Error(`Erreur comptage: ${error.message}`)
      }

      console.log(`✅ ${count || 0} notifications non lues pour l'utilisateur ${userId}`)
      return count || 0
    } catch (error) {
      console.error("❌ Erreur dans getUnreadCount:", error)
      return 0
    }
  },

  async createNotification(userId: string, notificationData: Partial<Notification>): Promise<Notification> {
    console.log("🔔 NotificationsService.createNotification", { userId, notificationData })

    try {
      const { data, error } = await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          title: notificationData.title,
          content: notificationData.content,
          type: notificationData.type,
          action_url: notificationData.action_url,
          read: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error("❌ Erreur création notification:", error)
        throw new Error(`Erreur création: ${error.message}`)
      }

      console.log("✅ Notification créée:", data.id)
      return data as Notification
    } catch (error) {
      console.error("❌ Erreur dans createNotification:", error)
      throw error
    }
  },

  async markAsRead(notificationId: string): Promise<void> {
    console.log("🔔 NotificationsService.markAsRead", notificationId)

    try {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", notificationId)

      if (error) {
        console.error("❌ Erreur marquage notification:", error)
        throw new Error(`Erreur marquage: ${error.message}`)
      }

      console.log("✅ Notification marquée comme lue")
    } catch (error) {
      console.error("❌ Erreur dans markAsRead:", error)
      throw error
    }
  },

  async markAllAsRead(userId: string): Promise<void> {
    console.log("🔔 NotificationsService.markAllAsRead", userId)

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", userId)
        .or("read.is.null,read.eq.false")

      if (error) {
        console.error("❌ Erreur marquage toutes notifications:", error)
        throw new Error(`Erreur marquage toutes: ${error.message}`)
      }

      console.log("✅ Toutes les notifications marquées comme lues")
    } catch (error) {
      console.error("❌ Erreur dans markAllAsRead:", error)
      throw error
    }
  },

  async deleteNotification(notificationId: string): Promise<void> {
    console.log("🔔 NotificationsService.deleteNotification", notificationId)

    try {
      const { error } = await supabase.from("notifications").delete().eq("id", notificationId)

      if (error) {
        console.error("❌ Erreur suppression notification:", error)
        throw new Error(`Erreur suppression: ${error.message}`)
      }

      console.log("✅ Notification supprimée")
    } catch (error) {
      console.error("❌ Erreur dans deleteNotification:", error)
      throw error
    }
  },
}
