import { createClientComponentClient } from "./supabase"
import type { User } from "@/types/user"

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
    const supabase = createClientComponentClient()

    // 1. Créer l'utilisateur dans Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    })

    if (authError) throw authError

    // 2. Ajouter les informations supplémentaires dans la table users
    if (authData.user) {
      const { error: profileError } = await supabase.from("users").insert({
        id: authData.user.id,
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone: userData.phone || null,
        user_type: userData.userType,
        password_hash: "managed-by-auth", // Le vrai hash est géré par Auth
        is_verified: false,
      })

      if (profileError) throw profileError
    }

    return authData
  },

  // Connexion d'un utilisateur
  async login(email: string, password: string) {
    const supabase = createClientComponentClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    return data
  },

  // Déconnexion
  async logout() {
    const supabase = createClientComponentClient()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Récupérer l'utilisateur courant
  async getCurrentUser(): Promise<User | null> {
    const supabase = createClientComponentClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) return null

    // Récupérer les informations complètes de l'utilisateur
    const { data, error } = await supabase.from("users").select("*").eq("id", session.user.id).single()

    if (error || !data) return null

    return data as User
  },
}
