import { supabase } from "./supabase"

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  read_at: string | null
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
        query = query.is("read_at", null)
      }

      const { data, error } = await query

      if (error) {
        console.error("❌ Erreur récupération notifications:", error)
        throw new Error(error.message)
      }

      console.log(`✅ ${data.length} notifications récupérées`)
      return data as Notification[]
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
        .is("read_at", null)

      if (error) {
        console.error("❌ Erreur comptage non lues:", error)
        throw new Error(error.message)
      }

      return count || 0
    } catch (error) {
      console.error("❌ Erreur dans getUnreadCount:", error)
      return 0 // En cas d'erreur, on retourne 0 pour éviter de bloquer l'interface
    }
  },

  async createNotification(userId: string, notificationData: Partial<Notification>): Promise<Notification> {
    console.log("🔔 NotificationsService.createNotification", { userId, notificationData })

    try {
      const { data, error } = await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          ...notificationData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error("❌ Erreur création notification:", error)
        throw new Error(error.message)
      }

      console.log("✅ Notification créée:", data)
      return data as Notification
    } catch (error) {
      console.error("❌ Erreur dans createNotification:", error)
      throw error
    }
  },

  async markAsRead(notificationId: string): Promise<void> {
    console.log("🔔 NotificationsService.markAsRead", notificationId)

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", notificationId)

      if (error) {
        console.error("❌ Erreur marquage notification:", error)
        throw new Error(error.message)
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
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", userId)
        .is("read_at", null)

      if (error) {
        console.error("❌ Erreur marquage toutes notifications:", error)
        throw new Error(error.message)
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
        throw new Error(error.message)
      }

      console.log("✅ Notification supprimée")
    } catch (error) {
      console.error("❌ Erreur dans deleteNotification:", error)
      throw error
    }
  },
}
