import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const { data: setting, error } = await supabase
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", "premium_features")
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("❌ Erreur récupération premium features:", error)
      return NextResponse.json({ success: false, error: "Erreur récupération paramètres premium" }, { status: 500 })
    }

    const premiumFeatures = setting?.setting_value || {
      electronic_signature: false,
      advanced_templates: false,
      api_integrations: false,
    }

    return NextResponse.json({
      success: true,
      data: premiumFeatures,
    })
  } catch (error) {
    console.error("❌ Erreur GET premium features:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { features } = await request.json()

    if (!features) {
      return NextResponse.json({ success: false, error: "Paramètres premium manquants" }, { status: 400 })
    }

    const supabase = createServerClient()

    const { error } = await supabase.from("site_settings").upsert({
      setting_key: "premium_features",
      setting_value: features,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error("❌ Erreur sauvegarde premium features:", error)
      return NextResponse.json({ success: false, error: "Erreur sauvegarde paramètres premium" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Paramètres premium sauvegardés",
    })
  } catch (error) {
    console.error("❌ Erreur POST premium features:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
