import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Créer un client Supabase avec service_role pour les opérations backend
    const supabase = createServerClient()
    
    // Lire les variantes éventuelles depuis la query (?page=login&position=left)
    const { searchParams } = new URL(request.url)
    const page = (searchParams.get("page") || "").toLowerCase()
    const position = (searchParams.get("position") || "").toLowerCase()

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

    // Extraire le logo depuis les logos stockés avec variantes
    const logos = logosData?.setting_value || {}

    const candidates: string[] = []
    if (page && position) candidates.push(`${page}_${position}`)
    if (page) candidates.push(page)
    if (position) candidates.push(position)
    candidates.push("main")

    let resolvedKey: string | null = null
    let logoUrl: string | null = null
    for (const key of candidates) {
      const val = logos?.[key]
      if (typeof val === "string" && val.length > 0) {
        resolvedKey = key
        logoUrl = val
        break
      }
    }
    if (!logoUrl) {
      resolvedKey = null
      logoUrl = null
    }

    return NextResponse.json({ 
      success: true, 
      logo_url: logoUrl,
      resolved_key: resolvedKey,
      candidates
    })
  } catch (error) {
    console.error("❌ Erreur API logo public:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
