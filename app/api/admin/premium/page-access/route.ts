import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// Stocke des règles d'accès par page dans site_settings (key: page_module_access)
// Format: [{ path: string, module_name: string, marketingTitle?: string, marketingDesc?: string, ctaText?: string, oneOffPriceId?: string }]

export async function GET() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", "page_module_access")
      .single()
    if (error && error.code !== "PGRST116") throw error
    return NextResponse.json({ success: true, rules: data?.setting_value || [] })
  } catch (e) {
    console.error("❌ Erreur GET page access:", e)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { rules } = await request.json()
    if (!Array.isArray(rules)) return NextResponse.json({ success: false, error: "rules[] requis" }, { status: 400 })

    const supabase = createServerClient()
    const { error } = await supabase.from("site_settings").upsert({
      setting_key: "page_module_access",
      setting_value: rules,
      updated_at: new Date().toISOString(),
    })
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("❌ Erreur POST page access:", e)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}


