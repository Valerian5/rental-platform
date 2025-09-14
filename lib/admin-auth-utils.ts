import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function verifyAdminAuth() {
  try {
    // Utiliser la clé de service pour l'authentification admin
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Variables d'environnement Supabase manquantes")
      return { error: NextResponse.json({ error: "Configuration Supabase manquante" }, { status: 500 }), user: null }
    }

    const server = createClient(supabaseUrl, supabaseServiceKey)

    // Récupérer l'utilisateur depuis les cookies de la requête
    const { data: { user }, error: authError } = await server.auth.getUser()
    
    if (authError || !user) {
      console.error("❌ Erreur auth:", authError)
      return { error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }), user: null }
    }

    console.log("✅ Utilisateur authentifié:", user.email)

    // Vérifier que l'utilisateur est admin
    const { data: profile, error: profileError } = await server
      .from("users")
      .select("user_type")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("❌ Erreur profil:", profileError)
      return { error: NextResponse.json({ error: "Erreur récupération profil" }, { status: 500 }), user: null }
    }

    if (!profile || profile.user_type !== "admin") {
      console.error("❌ Utilisateur non admin:", profile?.user_type)
      return { error: NextResponse.json({ error: "Accès refusé - Admin requis" }, { status: 403 }), user: null }
    }

    console.log("✅ Utilisateur admin confirmé:", user.email)
    return { error: null, user, server }
  } catch (error) {
    console.error("❌ Erreur vérification admin:", error)
    return { error: NextResponse.json({ error: "Erreur serveur" }, { status: 500 }), user: null }
  }
}
