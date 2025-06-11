import { NextResponse, type NextRequest } from "next/server"
import { supabase } from "@/lib/supabaseClient"

// Ajouter un paramètre pour récupérer uniquement le profil par défaut
// Modifier la fonction GET pour prendre en compte le paramètre default_only

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ownerId = searchParams.get("owner_id")
    const defaultOnly = searchParams.get("default_only") === "true"

    if (!ownerId) {
      return NextResponse.json({ error: "owner_id requis" }, { status: 400 })
    }

    let query = supabase.from("scoring_preferences").select("*").eq("owner_id", ownerId)

    if (defaultOnly) {
      query = query.eq("is_default", true)
    } else {
      query = query.order("is_default", { ascending: false }).order("created_at", { ascending: false })
    }

    const { data, error } = await query

    if (error) {
      console.error("Erreur récupération préférences:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ preferences: data })
  } catch (error) {
    console.error("Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
