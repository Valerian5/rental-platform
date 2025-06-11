import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    console.log("🏠 API Properties Owner GET")

    // Récupérer l'utilisateur depuis les cookies
    const cookieStore = cookies()
    const userCookie = cookieStore.get("user")

    if (!userCookie) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    let userData
    try {
      userData = JSON.parse(userCookie.value)
    } catch (e) {
      return NextResponse.json({ error: "Cookie invalide" }, { status: 401 })
    }

    const ownerId = userData.id

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
