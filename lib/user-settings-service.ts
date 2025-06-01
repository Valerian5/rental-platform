import { supabase } from "./supabase"

export interface UserSettings {
  id?: string
  user_id: string
  notifications_new_properties: boolean
  notifications_price_drops: boolean
  notifications_visit_reminders: boolean
  notifications_messages: boolean
  notifications_application_updates: boolean
  notifications_email_digest: boolean
  notifications_sms: boolean
  privacy_profile_visibility: string
  privacy_show_contact_info: boolean
  privacy_data_sharing: boolean
  privacy_analytics_tracking: boolean
  language: string
  currency: string
  timezone: string
  theme: string
  created_at?: string
  updated_at?: string
}

export const userSettingsService = {
  // Récupérer les paramètres d'un utilisateur
  async getUserSettings(userId: string): Promise<UserSettings> {
    console.log("⚙️ UserSettingsService.getUserSettings", userId)

    try {
      const { data, error } = await supabase.from("user_settings").select("*").eq("user_id", userId).single()

      if (error && error.code === "PGRST116") {
        // Aucun paramètre trouvé, créer des paramètres par défaut
        return await this.createDefaultSettings(userId)
      }

      if (error) {
        console.error("❌ Erreur récupération paramètres:", error)
        throw new Error(error.message)
      }

      console.log("✅ Paramètres récupérés:", data)
      return data
    } catch (error) {
      console.error("❌ Erreur dans getUserSettings:", error)
      throw error
    }
  },

  // Créer des paramètres par défaut
  async createDefaultSettings(userId: string): Promise<UserSettings> {
    console.log("🆕 UserSettingsService.createDefaultSettings", userId)

    const defaultSettings: Omit<UserSettings, "id" | "created_at" | "updated_at"> = {
      user_id: userId,
      notifications_new_properties: true,
      notifications_price_drops: true,
      notifications_visit_reminders: true,
      notifications_messages: true,
      notifications_application_updates: true,
      notifications_email_digest: false,
      notifications_sms: false,
      privacy_profile_visibility: "landlords",
      privacy_show_contact_info: false,
      privacy_data_sharing: false,
      privacy_analytics_tracking: true,
      language: "fr",
      currency: "EUR",
      timezone: "Europe/Paris",
      theme: "light",
    }

    try {
      const { data, error } = await supabase.from("user_settings").insert(defaultSettings).select().single()

      if (error) {
        console.error("❌ Erreur création paramètres:", error)
        throw new Error(error.message)
      }

      console.log("✅ Paramètres par défaut créés:", data)
      return data
    } catch (error) {
      console.error("❌ Erreur dans createDefaultSettings:", error)
      throw error
    }
  },

  // Mettre à jour les paramètres
  async updateUserSettings(userId: string, updates: Partial<UserSettings>): Promise<UserSettings> {
    console.log("🔄 UserSettingsService.updateUserSettings", { userId, updates })

    try {
      const { data, error } = await supabase
        .from("user_settings")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .select()
        .single()

      if (error) {
        console.error("❌ Erreur mise à jour paramètres:", error)
        throw new Error(error.message)
      }

      console.log("✅ Paramètres mis à jour:", data)
      return data
    } catch (error) {
      console.error("❌ Erreur dans updateUserSettings:", error)
      throw error
    }
  },

  // Mettre à jour les paramètres de notification
  async updateNotificationSettings(userId: string, notifications: Partial<UserSettings>): Promise<void> {
    console.log("🔔 UserSettingsService.updateNotificationSettings", { userId, notifications })

    const notificationUpdates = Object.keys(notifications)
      .filter((key) => key.startsWith("notifications_"))
      .reduce((obj, key) => {
        obj[key] = notifications[key as keyof UserSettings]
        return obj
      }, {} as any)

    await this.updateUserSettings(userId, notificationUpdates)
  },

  // Mettre à jour les paramètres de confidentialité
  async updatePrivacySettings(userId: string, privacy: Partial<UserSettings>): Promise<void> {
    console.log("🔒 UserSettingsService.updatePrivacySettings", { userId, privacy })

    const privacyUpdates = Object.keys(privacy)
      .filter((key) => key.startsWith("privacy_"))
      .reduce((obj, key) => {
        obj[key] = privacy[key as keyof UserSettings]
        return obj
      }, {} as any)

    await this.updateUserSettings(userId, privacyUpdates)
  },
}
