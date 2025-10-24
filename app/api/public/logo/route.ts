import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Créer un client Supabase avec service_role pour les opérations backend
    const supabase = createServerClient()
    
    // Récupérer les paramètres de l'application (API publique)
    const { data: settings, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "logo")
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error("❌ Erreur récupération logo:", error)
      return NextResponse.json({ success: false, error: "Erreur lors de la récupération du logo" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      logo_url: settings?.value || null 
    })
  } catch (error) {
    console.error("❌ Erreur API logo public:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
