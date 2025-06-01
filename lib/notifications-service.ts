import { supabase } from "./supabase"

export interface NotificationData {
  title: string
  message: string
  type: string
  action_url?: string
}

export interface Notification extends NotificationData {
  id: string
  user_id: string
  read_at?: string
  created_at: string
}

export const notificationsService = {
  // Créer une notification
  async createNotification(userId: string, notificationData: NotificationData): Promise<Notification> {
    console.log("🔔 NotificationsService.createNotification", { userId, notificationData })

    try {
      const { data, error } = await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          ...notificationData,
        })
        .select()
        .single()

      if (error) {
        console.error("❌ Erreur création notification:", error)
        throw new Error(error.message)
      }

      console.log("✅ Notification créée:", data)
      return data
    } catch (error) {
      console.error("❌ Erreur dans createNotification:", error)
      throw error
    }
  },

  // Récupérer les notifications d'un utilisateur
  async getUserNotifications(userId: string, unreadOnly = false): Promise<Notification[]> {
    console.log("📋 NotificationsService.getUserNotifications", { userId, unreadOnly })

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

      console.log("✅ Notifications récupérées:", data?.length || 0)
      return data || []
    } catch (error) {
      console.error("❌ Erreur dans getUserNotifications:", error)
      throw error
    }
  },

  // Marquer une notification comme lue
  async markAsRead(notificationId: string): Promise<void> {
    console.log("👁️ NotificationsService.markAsRead", notificationId)

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", notificationId)

      if (error) {
        console.error("❌ Erreur marquage lu:", error)
        throw new Error(error.message)
      }

      console.log("✅ Notification marquée comme lue")
    } catch (error) {
      console.error("❌ Erreur dans markAsRead:", error)
      throw error
    }
  },

  // Marquer toutes les notifications comme lues
  async markAllAsRead(userId: string): Promise<void> {
    console.log("👁️ NotificationsService.markAllAsRead", userId)

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", userId)
        .is("read_at", null)

      if (error) {
        console.error("❌ Erreur marquage toutes lues:", error)
        throw new Error(error.message)
      }

      console.log("✅ Toutes les notifications marquées comme lues")
    } catch (error) {
      console.error("❌ Erreur dans markAllAsRead:", error)
      throw error
    }
  },

  // Supprimer une notification
  async deleteNotification(notificationId: string): Promise<void> {
    console.log("🗑️ NotificationsService.deleteNotification", notificationId)

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

  // Compter les notifications non lues
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .is("read_at", null)

      if (error) {
        console.error("❌ Erreur comptage non lues:", error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error("❌ Erreur dans getUnreadCount:", error)
      return 0
    }
  },
}
