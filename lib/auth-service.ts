import { supabase } from "./supabase"

export interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  user_type: "tenant" | "owner" | "admin"
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
  // Inscription avec création du profil
  async register(userData: RegisterData): Promise<UserProfile> {
    console.log("🔐 AuthService.register", userData)

    try {
      // 1. Créer le compte Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      })

      if (authError) {
        console.error("❌ Erreur création compte:", authError)
        throw new Error(authError.message)
      }

      if (!authData.user) {
        throw new Error("Erreur lors de la création du compte")
      }

      // 2. Créer le profil utilisateur
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
        console.error("❌ Erreur création profil:", profileError)
        // Supprimer le compte auth si la création du profil échoue
        await supabase.auth.signOut()
        throw new Error("Erreur lors de la création du profil: " + profileError.message)
      }

      // 3. Si c'est un locataire, initialiser le dossier de location
      if (userData.userType === "tenant") {
        try {
          await supabase.from("rental_files").insert({
            tenant_id: authData.user.id,
            completion_percentage: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        } catch (rentalFileError) {
          console.warn("⚠️ Erreur initialisation dossier location:", rentalFileError)
          // Ne pas faire échouer l'inscription pour ça
        }
      }

      console.log("✅ Inscription réussie:", profile)
      return profile
    } catch (error) {
      console.error("❌ Erreur dans register:", error)
      throw error
    }
  },

  // Connexion
  async login(email: string, password: string): Promise<UserProfile> {
    console.log("🔐 AuthService.login", email)

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        console.error("❌ Erreur connexion:", authError)
        throw new Error(authError.message)
      }

      if (!authData.user) {
        throw new Error("Erreur lors de la connexion")
      }

      // Récupérer le profil utilisateur
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single()

      if (profileError) {
        console.error("❌ Erreur récupération profil:", profileError)
        throw new Error("Erreur lors de la récupération du profil")
      }

      console.log("✅ Connexion réussie:", profile)
      return profile
    } catch (error) {
      console.error("❌ Erreur dans login:", error)
      throw error
    }
  },

  // Récupérer l'utilisateur actuel
  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      console.log("🔍 AuthService.getCurrentUser - Début")

      // 1. Vérifier la session Supabase
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      console.log("📋 Session:", { sessionData, sessionError })

      if (sessionError) {
        console.error("❌ Erreur session:", sessionError)
        return null
      }

      if (!sessionData.session || !sessionData.session.user) {
        console.log("❌ Pas de session active")
        return null
      }

      const userId = sessionData.session.user.id
      console.log("👤 User ID:", userId)

      // 2. Récupérer le profil utilisateur
      const { data: profile, error: profileError } = await supabase.from("users").select("*").eq("id", userId).single()

      console.log("📊 Profil:", { profile, profileError })

      if (profileError) {
        console.error("❌ Erreur profil:", profileError)

        // Si le profil n'existe pas, créer un profil basique
        if (profileError.code === "PGRST116") {
          console.log("🔧 Création profil manquant...")
          const basicProfile = {
            id: userId,
            email: sessionData.session.user.email || "",
            first_name: sessionData.session.user.user_metadata?.first_name || "",
            last_name: sessionData.session.user.user_metadata?.last_name || "",
            user_type: sessionData.session.user.user_metadata?.user_type || "tenant",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          const { data: newProfile, error: createError } = await supabase
            .from("users")
            .insert(basicProfile)
            .select()
            .single()

          if (createError) {
            console.error("❌ Erreur création profil:", createError)
            return null
          }

          console.log("✅ Profil créé:", newProfile)
          return newProfile
        }

        return null
      }

      console.log("✅ Profil récupéré:", profile)
      return profile
    } catch (error) {
      console.error("❌ Erreur dans getCurrentUser:", error)
      return null
    }
  },

  // Déconnexion
  async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("❌ Erreur déconnexion:", error)
        throw new Error(error.message)
      }
      console.log("✅ Déconnexion réussie")
    } catch (error) {
      console.error("❌ Erreur dans logout:", error)
      throw error
    }
  },

  // Mettre à jour le profil
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    console.log("🔄 AuthService.updateProfile", userId, updates)

    try {
      const { data, error } = await supabase
        .from("users")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single()

      if (error) {
        console.error("❌ Erreur mise à jour profil:", error)
        throw new Error(error.message)
      }

      console.log("✅ Profil mis à jour:", data)
      return data
    } catch (error) {
      console.error("❌ Erreur dans updateProfile:", error)
      throw error
    }
  },
}
