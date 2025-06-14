import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 GET /api/admin/settings")

    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")

    if (key) {
      console.log("📋 Récupération paramètre:", key)
      // Récupérer un paramètre spécifique
      const { data, error } = await supabase
        .from("site_settings")
        .select("setting_value")
        .eq("setting_key", key)
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("❌ Erreur Supabase:", error)
        throw error
      }

      console.log("✅ Paramètre récupéré:", data)
      return NextResponse.json({
        success: true,
        data: data?.setting_value || null,
      })
    } else {
      console.log("📋 Récupération tous paramètres")
      // Récupérer tous les paramètres
      const { data, error } = await supabase.from("site_settings").select("setting_key, setting_value")

      if (error) {
        console.error("❌ Erreur Supabase:", error)
        throw error
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

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data[0],
    })
  } catch (error) {
    console.error("Erreur sauvegarde paramètres:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
