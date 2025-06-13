import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase"

// Créer un client Supabase avec les variables d'environnement
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    console.log("🏠 API Properties Owner GET")

    // Récupérer le owner_id depuis les paramètres de requête
    const { searchParams } = new URL(request.url)
    const ownerId = searchParams.get("owner_id")

    if (!ownerId) {
      return NextResponse.json({ error: "owner_id requis" }, { status: 400 })
    }

    console.log("👤 Owner ID:", ownerId)

    // Récupérer les propriétés du propriétaire directement avec Supabase
    const { data: properties, error } = await supabase
      .from("properties")
      .select("id, title, address, city, type, surface, price")
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
