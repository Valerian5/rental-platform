import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 GET /api/admin/settings")

    const supabase = createServerClient()

    // Vérifier l'authentification admin pour les opérations sensibles
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("❌ Pas d'utilisateur authentifié")
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier si l'utilisateur est admin
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("user_type")
      .eq("id", user.id)
      .single()

    if (profileError || !profile || profile.user_type !== "admin") {
      console.log("❌ Utilisateur non admin tente d'accéder aux paramètres")
      return NextResponse.json({ success: false, error: "Accès non autorisé" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")

    if (key) {
      console.log("📋 Récupération paramètre:", key)
      const { data, error } = await supabase
        .from("site_settings")
        .select("setting_value")
        .eq("setting_key", key)
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("❌ Erreur Supabase:", error)
        return NextResponse.json(
          { success: false, error: "Erreur base de données", details: error.message },
          { status: 500 },
        )
      }

      console.log("✅ Paramètre récupéré:", data)
      return NextResponse.json({
        success: true,
        data: data?.setting_value || null,
      })
    } else {
      console.log("📋 Récupération tous paramètres")
      const { data, error } = await supabase.from("site_settings").select("setting_key, setting_value")

      if (error) {
        console.error("❌ Erreur Supabase:", error)
        return NextResponse.json(
          { success: false, error: "Erreur base de données", details: error.message },
          { status: 500 },
        )
      }

      const settings = {}
      data?.forEach((item) => {
        settings[item.setting_key] = item.setting_value
      })

      console.log("✅ Tous paramètres récupérés:", settings)
      return NextResponse.json({
        success: true,
        data: settings,
      })
    }
  } catch (error) {
    console.error("❌ Erreur récupération paramètres:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Vérifier l'authentification admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("❌ Pas d'utilisateur authentifié")
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier si l'utilisateur est admin
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("user_type")
      .eq("id", user.id)
      .single()

    if (profileError || !profile || profile.user_type !== "admin") {
      console.log("❌ Utilisateur non admin tente de modifier les paramètres")
      return NextResponse.json({ success: false, error: "Accès non autorisé" }, { status: 403 })
    }

    const { key, value } = await request.json()

    if (!key) {
      return NextResponse.json({ success: false, error: "Clé manquante" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("site_settings")
      .upsert({
        setting_key: key,
        setting_value: value,
        updated_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error("❌ Erreur sauvegarde:", error)
      return NextResponse.json({ success: false, error: "Erreur sauvegarde", details: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data[0],
    })
  } catch (error) {
    console.error("Erreur sauvegarde paramètres:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
