import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function verifyAdminAuth() {
  try {
    const server = createServerClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await server.auth.getUser()
    
    if (authError || !user) {
      return { error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }), user: null }
    }

    // Vérifier que l'utilisateur est admin
    const { data: profile, error: profileError } = await server
      .from("users")
      .select("user_type")
      .eq("id", user.id)
      .single()

    if (profileError || !profile || profile.user_type !== "admin") {
      return { error: NextResponse.json({ error: "Accès refusé - Admin requis" }, { status: 403 }), user: null }
    }

    return { error: null, user, server }
  } catch (error) {
    console.error("Erreur vérification admin:", error)
    return { error: NextResponse.json({ error: "Erreur serveur" }, { status: 500 }), user: null }
  }
}
