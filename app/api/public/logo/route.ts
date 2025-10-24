import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Créer un client Supabase avec service_role pour les opérations backend
    const supabase = createServerClient()
    
    // Récupérer les logos depuis site_settings
    const { data: logosData, error } = await supabase
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", "logos")
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error("❌ Erreur récupération logos:", error)
      return NextResponse.json({ success: false, error: "Erreur lors de la récupération du logo" }, { status: 500 })
    }

    // Extraire le logo principal depuis les logos stockés
    const logos = logosData?.setting_value || {}
    const logoUrl = logos?.main || null

    return NextResponse.json({ 
      success: true, 
      logo_url: logoUrl 
    })
  } catch (error) {
    console.error("❌ Erreur API logo public:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
