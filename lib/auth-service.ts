import { supabase } from "./supabase"

export interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  user_type: "tenant" | "owner" | "admin" | "agency"
  agency_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  userType: "tenant" | "owner"
}

export const authService = {
  async register(userData: RegisterData): Promise<UserProfile> {
    console.log("🔐 Register:", userData.email)

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    })

    if (authError) throw new Error(authError.message)
    if (!authData.user) throw new Error("Erreur création compte")

    const profileData = {
      id: authData.user.id,
      email: userData.email,
      first_name: userData.firstName,
      last_name: userData.lastName,
      phone: userData.phone || null,
      user_type: userData.userType,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: profile, error: profileError } = await supabase.from("users").insert(profileData).select().single()

    if (profileError) {
      await supabase.auth.signOut()
      throw new Error("Erreur création profil: " + profileError.message)
    }

    // Si l'utilisateur n'est pas automatiquement connecté, se connecter manuellement
    if (!authData.session) {
      console.log("🔐 Connexion automatique après inscription...")
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: userData.password,
      })

      if (loginError) {
        console.warn("⚠️ Connexion automatique échouée:", loginError.message)
        // Ne pas faire échouer l'inscription pour autant
      } else {
        console.log("✅ Connexion automatique réussie")
      }
    }

    return profile
  },

  async login(email: string, password: string): Promise<{ user: UserProfile; session: any }> {
    console.log("🔐 Login:", email)

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) throw new Error(authError.message)
    if (!authData.user || !authData.session) throw new Error("Erreur connexion")

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", authData.user.id)
      .single()

    if (profileError) throw new Error("Erreur profil: " + profileError.message)

    console.log("✅ Connexion réussie:", profile.user_type, profile.email)
    return { user: profile, session: authData.session }
  },

  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      console.log("🔐 getCurrentUser - Début")

      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session?.user) {
        console.log("❌ Pas de session active")
        return null
      }

      console.log("✅ Session active pour:", sessionData.session.user.id)

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", sessionData.session.user.id)
        .single()

      if (profileError) {
        console.error("❌ Erreur récupération profil:", profileError)
        return null
      }

      console.log("✅ Profil récupéré:", profile.user_type, profile.email)
      return profile
    } catch (error) {
      console.error("❌ Erreur getCurrentUser:", error)
      return null
    }
  },

  async getAuthToken(): Promise<string | null> {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      return sessionData.session?.access_token || null
    } catch (error) {
      console.error("❌ Erreur getAuthToken:", error)
      return null
    }
  },

  async logout(): Promise<void> {
    console.log("🔐 Logout")
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
  },
}
