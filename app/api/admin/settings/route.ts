import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    console.log("📤 GET /api/admin/settings")

    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")

    const supabase = createServerClient()

    if (key) {
      // Récupérer un paramètre spécifique
      const { data: setting, error } = await supabase
        .from("site_settings")
        .select("setting_value")
        .eq("setting_key", key)
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("❌ Erreur récupération setting:", error)
        return NextResponse.json(
          {
            success: false,
            error: "Erreur récupération paramètre",
            details: error.message,
          },
          { status: 500 },
        )
      }

      console.log(`✅ Paramètre ${key} récupéré:`, setting?.setting_value)

      return NextResponse.json({
        success: true,
        data: setting?.setting_value || null,
      })
    }

    // Récupérer tous les paramètres
    const { data: settings, error } = await supabase.from("site_settings").select("*")

    if (error) {
      console.error("❌ Erreur récupération settings:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Erreur récupération paramètres",
          details: error.message,
        },
        { status: 500 },
      )
    }

    // Organiser les paramètres par clé
    const organizedSettings = {}
    settings?.forEach((setting) => {
      organizedSettings[setting.setting_key] = setting.setting_value
    })

    console.log("✅ Paramètres récupérés:", Object.keys(organizedSettings))

    return NextResponse.json({
      success: true,
      data: organizedSettings,
    })
  } catch (error) {
    console.error("❌ Erreur GET settings:", error)
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
    console.log("📤 POST /api/admin/settings")

    const { key, value } = await request.json()

    if (!key) {
      return NextResponse.json(
        {
          success: false,
          error: "Clé manquante",
        },
        { status: 400 },
      )
    }

    const supabase = createServerClient()

    // Vérifier si la table site_settings existe
    const { data: tableCheck, error: tableError } = await supabase.from("site_settings").select("setting_key").limit(1)

    if (tableError) {
      console.warn("⚠️ Table site_settings non accessible:", tableError.message)
      return NextResponse.json(
        {
          success: false,
          error: "Table site_settings non accessible",
          details: "Veuillez exécuter le script scripts/create-site-settings-table.sql",
        },
        { status: 500 },
      )
    }

    // Upsert le paramètre
    const { error: upsertError } = await supabase.from("site_settings").upsert({
      setting_key: key,
      setting_value: value,
      updated_at: new Date().toISOString(),
    })

    if (upsertError) {
      console.error("❌ Erreur upsert setting:", upsertError)
      return NextResponse.json(
        {
          success: false,
          error: "Erreur sauvegarde paramètre",
          details: upsertError.message,
        },
        { status: 500 },
      )
    }

    console.log("✅ Paramètre sauvegardé:", key)

    return NextResponse.json({
      success: true,
      message: `Paramètre ${key} sauvegardé`,
    })
  } catch (error) {
    console.error("❌ Erreur POST settings:", error)
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
