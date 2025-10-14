import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// Stocke des paramètres de facturation globaux dans site_settings (key: billing_settings)
// Exemple: { signature_one_off_price_id: "price_..." }

export async function GET() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", "billing_settings")
      .single()
    if (error && error.code !== "PGRST116") throw error
    return NextResponse.json({ success: true, data: data?.setting_value || {} })
  } catch (e) {
    console.error("❌ GET billing settings:", e)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createServerClient()
    const { error } = await supabase.from("site_settings").upsert({
      setting_key: "billing_settings",
      setting_value: body || {},
      updated_at: new Date().toISOString(),
    })
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("❌ POST billing settings:", e)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}


