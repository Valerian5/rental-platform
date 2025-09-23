import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    console.log("🔐 API Login - Tentative de connexion:", email)

    // Validation des données
    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 })
    }

    // Utiliser Supabase pour l'authentification
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      console.error("❌ Erreur authentification Supabase:", authError)
      return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 })
    }

    if (!authData.user || !authData.session) {
      return NextResponse.json({ error: "Erreur lors de la connexion" }, { status: 401 })
    }

    console.log("✅ Authentification réussie pour:", authData.user.id)

    // Récupérer le profil utilisateur
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", authData.user.id)
      .single()

    if (profileError) {
      console.error("❌ Erreur récupération profil:", profileError)
      return NextResponse.json({ error: "Erreur lors de la récupération du profil" }, { status: 500 })
    }

    // Retourner l'utilisateur et les informations de session
    const response = NextResponse.json({
      message: "Connexion réussie !",
      user: profile,
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at,
      },
    })

    console.log("✅ API Login - Connexion réussie pour:", profile.email)
    return response
  } catch (error) {
    console.error("❌ Erreur lors de la connexion API:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
