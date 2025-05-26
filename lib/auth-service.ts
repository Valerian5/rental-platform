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
      console.log("Tentative d'inscription pour:", userData.email)

      // 1. Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            user_type: userData.userType,
          },
        },
      })

      console.log("Résultat auth:", { authData, authError })

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
        is_verified: authData.user.email_confirmed_at ? true : false,
      })

      console.log("Résultat insertion profile:", profileError)

      if (profileError) {
        console.error("Erreur profile:", profileError)
        // Ne pas faire échouer l'inscription si l'utilisateur Auth est créé
        // throw new Error(profileError.message)
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
      console.log("Tentative de connexion pour:", email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log("Résultat connexion:", { data, error })

      if (error) {
        console.error("Erreur de connexion:", error)
        throw new Error(error.message)
      }

      if (!data.user || !data.session) {
        throw new Error("Aucune session créée")
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

      console.log("Session actuelle:", session)

      if (!session) return null

      // Récupérer les informations complètes de l'utilisateur
      const { data, error } = await supabase.from("users").select("*").eq("id", session.user.id).single()

      console.log("Données utilisateur:", { data, error })

      if (error) {
        console.error("Erreur lors de la récupération de l'utilisateur:", error)
        // Retourner les données de base si pas de profil dans la table users
        return {
          id: session.user.id,
          email: session.user.email,
          first_name: session.user.user_metadata?.first_name || "",
          last_name: session.user.user_metadata?.last_name || "",
          user_type: session.user.user_metadata?.user_type || "tenant",
          session,
        }
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

  // Vérifier la configuration Supabase
  async testConnection() {
    try {
      const { data, error } = await supabase.from("users").select("count").limit(1)
      console.log("Test de connexion Supabase:", { data, error })
      return !error
    } catch (error) {
      console.error("Erreur de connexion Supabase:", error)
      return false
    }
  },
}