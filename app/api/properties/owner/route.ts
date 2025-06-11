import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    console.log("🏠 API Properties Owner GET")

    const supabase = createServerSupabaseClient()

    // Récupérer l'utilisateur authentifié
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("❌ Erreur authentification:", authError)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const ownerId = user.id
    console.log("👤 Owner ID:", ownerId)

    // Récupérer les propriétés du propriétaire
    const { data: properties, error } = await supabase
      .from("properties")
      .select("id, title, address, city")
      .eq("owner_id", ownerId)
      .order("title", { ascending: true })

    if (error) {
      console.error("❌ Erreur récupération propriétés:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`✅ ${properties?.length || 0} propriétés récupérées`)
    return NextResponse.json({ properties: properties || [] })
  } catch (error) {
    console.error("❌ Erreur API properties owner:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
