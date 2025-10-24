import { supabase } from "./supabase"

export interface UserProfile {
  id: string
  email: string
  password_hash?: string
  first_name: string
  last_name: string
  phone?: string
  user_type: "tenant" | "owner" | "admin" | "agency"
  avatar_url?: string
  is_verified: boolean
  created_at: string
  updated_at: string
  agency_id?: string
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
  async register(userData: RegisterData): Promise<{ user: UserProfile; needsVerification: boolean }> {
    console.log("🔐 Register:", userData.email)

    // Créer le compte SANS confirmation d'email automatique de Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?user_type=${userData.userType}`,
        data: {
          user_type: userData.userType,
          first_name: userData.firstName,
          last_name: userData.lastName
        }
      }
    })

    if (authError) throw new Error(authError.message)
    if (!authData.user) throw new Error("Erreur création compte")

    // Créer le profil utilisateur dans la table users
    const profileData = {
      id: authData.user.id,
      email: userData.email,
      first_name: userData.firstName,
      last_name: userData.lastName,
      phone: userData.phone || null,
      user_type: userData.userType,
      is_verified: false, // L'utilisateur doit confirmer son email
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Créer le profil utilisateur avec gestion des erreurs RLS
    let profile
    try {
      const { data, error: profileError } = await supabase.from("users").insert(profileData).select().single()
      
      if (profileError) {
        // Nettoyer le compte auth si la création du profil échoue
        await supabase.auth.signOut()
        throw new Error("Erreur création profil: " + profileError.message)
      }
      
      profile = data
    } catch (error: any) {
      // Si erreur RLS, essayer avec le service role
      if (error.message.includes('infinite recursion') || error.message.includes('policy')) {
        console.warn("⚠️ Erreur RLS détectée, tentative avec service role...")
        
        // Créer un client avec le service role pour contourner RLS
        const { createClient } = await import('@supabase/supabase-js')
        const serviceClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        )
        
        const { data: serviceData, error: serviceError } = await serviceClient
          .from("users")
          .insert(profileData)
          .select()
          .single()
        
        if (serviceError) {
          await supabase.auth.signOut()
          throw new Error("Erreur création profil (service role): " + serviceError.message)
        }
        
        profile = serviceData
      } else {
        throw error
      }
    }

    // Envoyer l'email de bienvenue personnalisé
    try {
      await this.sendWelcomeEmail(profile, userData.userType)
    } catch (emailError) {
      console.warn("⚠️ Erreur envoi email de bienvenue:", emailError)
      // Ne pas faire échouer l'inscription pour autant
    }

    // Envoyer l'email de vérification personnalisé
    try {
      await this.sendCustomVerificationEmail(userData.email, userData.userType, authData.user.id)
    } catch (emailError) {
      console.warn("⚠️ Erreur envoi email de vérification:", emailError)
      // Ne pas faire échouer l'inscription pour autant
    }

    return {
      user: profile,
      needsVerification: true // Toujours nécessiter la vérification
    }
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

  async sendWelcomeEmail(user: UserProfile, userType: "tenant" | "owner"): Promise<void> {
    console.log("📧 Envoi email de bienvenue à:", user.email)
    
    try {
      const response = await fetch('/api/emails/welcome', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            user_type: user.user_type
          },
          userType
        })
      })

      if (!response.ok) {
        throw new Error(`Erreur envoi email: ${response.statusText}`)
      }

      console.log("✅ Email de bienvenue envoyé")
    } catch (error) {
      console.error("❌ Erreur envoi email de bienvenue:", error)
      throw error
    }
  },

  async sendCustomVerificationEmail(email: string, userType: string, userId: string): Promise<void> {
    console.log("📧 Envoi email de vérification personnalisé à:", email)
    
    try {
      // Générer un token de vérification
      const { data: tokenData, error: tokenError } = await supabase.auth.admin.generateLink({
        type: 'signup',
        email: email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?user_type=${userType}`
        }
      })

      if (tokenError) throw tokenError

      // Extraire le token de l'URL générée
      const url = new URL(tokenData.properties.action_link)
      const token = url.searchParams.get('token')

      if (!token) {
        throw new Error("Impossible de générer le token de vérification")
      }

      // Envoyer l'email personnalisé
      const response = await fetch('/api/emails/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          userType,
          token
        })
      })

      if (!response.ok) {
        throw new Error(`Erreur envoi email: ${response.statusText}`)
      }

      console.log("✅ Email de vérification personnalisé envoyé")
    } catch (error) {
      console.error("❌ Erreur envoi email de vérification personnalisé:", error)
      throw error
    }
  },

  async resendVerificationEmail(email: string, userType?: string): Promise<void> {
    console.log("📧 Renvoi email de vérification à:", email)
    
    try {
      // Utiliser notre système d'email personnalisé
      const response = await fetch('/api/emails/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          userType: userType || 'tenant'
        })
      })

      if (!response.ok) {
        throw new Error(`Erreur envoi email: ${response.statusText}`)
      }

      console.log("✅ Email de vérification personnalisé renvoyé")
    } catch (error) {
      console.error("❌ Erreur renvoi email de vérification:", error)
      throw error
    }
  },

  async verifyEmail(token: string, type: string): Promise<void> {
    console.log("🔐 Vérification email avec token:", token)
    
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type as any
      })

      if (error) throw error

      // Mettre à jour le statut de vérification dans la table users
      if (data.user) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ is_verified: true, updated_at: new Date().toISOString() })
          .eq('id', data.user.id)

        if (updateError) {
          console.warn("⚠️ Erreur mise à jour statut vérification:", updateError)
        }
      }

      console.log("✅ Email vérifié avec succès")
    } catch (error) {
      console.error("❌ Erreur vérification email:", error)
      throw error
    }
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
