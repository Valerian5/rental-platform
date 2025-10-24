import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Récupérer le token d'authentification depuis les headers
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: "Token d'authentification manquant" }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    
    // Créer un client Supabase avec service_role pour les opérations backend
    const supabase = createServerClient()
    
    // Vérifier l'authentification utilisateur avec le token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Token invalide" }, { status: 401 })
    }

    // Récupérer les paramètres de l'application
    const { data: settings, error } = await supabase
      .from("app_settings")
      .select("logo_url")
      .eq("key", "logo")
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error("❌ Erreur récupération logo:", error)
      return NextResponse.json({ success: false, error: "Erreur lors de la récupération du logo" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      logo_url: settings?.logo_url || null 
    })
  } catch (error) {
    console.error("❌ Erreur API logo:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
