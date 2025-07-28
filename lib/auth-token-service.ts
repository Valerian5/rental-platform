import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

// Create a Supabase client with service role for server-side operations
const supabaseAdmin = createServerClient(
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

export interface AuthUser {
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

export async function getCurrentUserFromRequest(request: NextRequest): Promise<AuthUser | null> {
  try {
    console.log("🔐 getCurrentUserFromRequest - Début")

    // Get the authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ Pas de token d'autorisation")
      return null
    }

    const token = authHeader.substring(7) // Remove "Bearer " prefix
    console.log("🎫 Token reçu:", token.substring(0, 20) + "...")

    // Verify the JWT token with Supabase
    const { data: tokenData, error: tokenError } = await supabaseAdmin.auth.getUser(token)

    if (tokenError || !tokenData.user) {
      console.log("❌ Token invalide:", tokenError?.message)
      return null
    }

    console.log("✅ Token valide pour utilisateur:", tokenData.user.id)

    // Get the user profile from our users table
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", tokenData.user.id)
      .single()

    if (profileError || !userProfile) {
      console.log("❌ Profil utilisateur non trouvé:", profileError?.message)
      return null
    }

    console.log("✅ Profil utilisateur récupéré:", userProfile.user_type, userProfile.email)
    return userProfile as AuthUser
  } catch (error) {
    console.error("❌ Erreur dans getCurrentUserFromRequest:", error)
    return null
  }
}

export async function getCurrentUserFromCookies(): Promise<AuthUser | null> {
  try {
    console.log("🔐 getCurrentUserFromCookies - Début")

    // This would be used for server-side rendering with cookies
    // For now, we'll return null as we're using token-based auth
    return null
  } catch (error) {
    console.error("❌ Erreur dans getCurrentUserFromCookies:", error)
    return null
  }
}
