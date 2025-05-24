import { supabase } from "./supabase"

export const authService = {
  // Inscription d'un nouvel utilisateur
  async register(userData: {
    email: string
    password: string
    firstName: string
    lastName: string
    phone?: string
    userType: "owner" | "tenant" | "admin"
  }) {
    try {
      // 1. Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      })

      if (authError) {
        throw new Error(authError.message)
      }

      if (!authData.user) {
        throw new Error("Erreur lors de la création du compte")
      }

      // 2. Ajouter les informations supplémentaires dans la table users
      const { error: profileError } = await supabase.from("users").insert({
        id: authData.user.id,
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone: userData.phone || null,
        user_type: userData.userType,
        password_hash: "managed-by-auth", // Le hash est géré par Supabase Auth
        is_verified: false,
      })

      if (profileError) {
        throw new Error(profileError.message)
      }

      return { user: authData.user, session: authData.session }
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error)
      throw error
    }
  },

  // Connexion d'un utilisateur
  async login(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw new Error(error.message)
      }

      return data
    } catch (error) {
      console.error("Erreur lors de la connexion:", error)
      throw error
    }
  },

  // Déconnexion
  async logout() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw new Error(error.message)
      }
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error)
      throw error
    }
  },

  // Récupérer l'utilisateur courant avec ses informations complètes
  async getCurrentUser() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) return null

      // Récupérer les informations complètes de l'utilisateur
      const { data, error } = await supabase.from("users").select("*").eq("id", session.user.id).single()

      if (error || !data) {
        console.error("Erreur lors de la récupération de l'utilisateur:", error)
        return null
      }

      return { ...data, session }
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisateur:", error)
      return null
    }
  },

  // Réinitialiser le mot de passe
  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        throw new Error(error.message)
      }
    } catch (error) {
      console.error("Erreur lors de la réinitialisation:", error)
      throw error
    }
  },
}
