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

export async function getCurrentUserFromRequest(request: NextRequest): Promise<UserProfile | null> {
  try {
    console.log("🔍 getCurrentUserFromRequest - Début")

    // Récupérer le token d'authentification depuis les headers
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ Pas de token Bearer dans les headers")
      return null
    }

    const token = authHeader.substring(7) // Enlever "Bearer "
    console.log("🔑 Token trouvé:", token.substring(0, 20) + "...")

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

    // Vérifier le token et récupérer l'utilisateur
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.log("❌ Token invalide:", authError?.message)
      return null
    }

    console.log("✅ Utilisateur authentifié:", user.id)

    // Récupérer le profil utilisateur depuis la base de données
    const { data: profile, error: profileError } = await supabase.from("users").select("*").eq("id", user.id).single()

    if (profileError) {
      console.error("❌ Erreur récupération profil:", profileError)
      return null
    }

    console.log("✅ Profil récupéré:", profile.user_type)
    return profile
  } catch (error) {
    console.error("❌ Erreur dans getCurrentUserFromRequest:", error)
    return null
  }
}
