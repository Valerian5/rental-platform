import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    console.log("📤 GET /api/admin/settings")

    const supabase = createServerClient()

    // Vérifier si la table site_settings existe
    const { data: tableCheck, error: tableError } = await supabase.from("site_settings").select("setting_key").limit(1)

    if (tableError) {
      console.warn("⚠️ Table site_settings non accessible:", tableError.message)

      // Retourner des paramètres par défaut
      return NextResponse.json({
        success: true,
        data: {
          logos: {},
          colors: {
            primary: "#0066FF",
            secondary: "#FF6B00",
            accent: "#00C48C",
          },
          site_info: {
            title: "Louer Ici",
            description: "Plateforme de gestion locative intelligente",
          },
        },
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
