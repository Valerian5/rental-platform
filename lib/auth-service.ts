import { supabase } from "./supabase"

export interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  user_type: "tenant" | "owner" | "admin" | "agency"
  agency_id?: string
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: profile, error: profileError } = await supabase.from("users").insert(profileData).select().single()

    if (profileError) {
      await supabase.auth.signOut()
      throw new Error("Erreur création profil: " + profileError.message)
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

    return { user: profile, session: authData.session }
  },

  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session?.user) return null

      const { data: profile } = await supabase.from("users").select("*").eq("id", sessionData.session.user.id).single()

      return profile
    } catch (error) {
      console.error("Erreur getCurrentUser:", error)
      return null
    }
  },

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
  },
}
