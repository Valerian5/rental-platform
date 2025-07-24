import { createServerClient } from "@supabase/ssr"
import type { NextRequest } from "next/server"

export interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  user_type: "tenant" | "owner" | "admin"
  agency_id?: string
  created_at: string
  updated_at: string
}

// Fonction pour récupérer le token depuis les headers Authorization
export async function getCurrentUserFromToken(request: NextRequest): Promise<UserProfile | null> {
  try {
    console.log("🔍 getCurrentUserFromToken - Début")

    // Récupérer le token depuis les headers
    const authHeader = request.headers.get("authorization")
    console.log("🔑 Auth header:", authHeader ? "présent" : "absent")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ Pas de token Bearer dans les headers")
      return null
    }

    const token = authHeader.replace("Bearer ", "")
    console.log("🎫 Token récupéré:", token.substring(0, 20) + "...")

    // Créer un client Supabase avec le token
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get() {
            return undefined
          },
          set() {},
          remove() {},
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      },
    )

    // Récupérer l'utilisateur avec le token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("❌ Erreur auth avec token:", authError)
      return null
    }

    if (!user) {
      console.log("❌ Pas d'utilisateur trouvé avec le token")
      return null
    }

    console.log("👤 Utilisateur trouvé avec token:", user.id)

    // Utiliser le service role pour récupérer le profil
    const serviceSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get() {
            return undefined
          },
          set() {},
          remove() {},
        },
      },
    )

    const { data: profile, error: profileError } = await serviceSupabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("❌ Erreur profil:", profileError)
      return null
    }

    console.log("✅ Profil récupéré avec token:", profile.user_type)
    return profile
  } catch (error) {
    console.error("❌ Erreur dans getCurrentUserFromToken:", error)
    return null
  }
}

// Fonction hybride qui essaie cookies puis token
export async function getCurrentUserFromRequest(request: NextRequest): Promise<UserProfile | null> {
  try {
    console.log("🔍 getCurrentUserFromRequest - Début (hybride)")

    // 1. Essayer avec les cookies d'abord
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = request.cookies.get(name)
            console.log(`🍪 Cookie ${name}:`, cookie?.value ? "trouvé" : "absent")
            return cookie?.value
          },
          set() {},
          remove() {},
        },
      },
    )

    const {
      data: { user: cookieUser },
      error: cookieError,
    } = await supabase.auth.getUser()

    if (!cookieError && cookieUser) {
      console.log("✅ Utilisateur trouvé via cookies:", cookieUser.id)

      // Récupérer le profil avec service role
      const serviceSupabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            get() {
              return undefined
            },
            set() {},
            remove() {},
          },
        },
      )

      const { data: profile, error: profileError } = await serviceSupabase
        .from("users")
        .select("*")
        .eq("id", cookieUser.id)
        .single()

      if (!profileError && profile) {
        console.log("✅ Profil récupéré via cookies:", profile.user_type)
        return profile
      }
    }

    console.log("⚠️ Cookies échoués, essai avec token...")

    // 2. Si les cookies échouent, essayer avec le token
    return await getCurrentUserFromToken(request)
  } catch (error) {
    console.error("❌ Erreur dans getCurrentUserFromRequest:", error)
    return null
  }
}
