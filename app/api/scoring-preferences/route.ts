import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ownerId = searchParams.get("owner_id")

    if (!ownerId) {
      return NextResponse.json({ error: "owner_id requis" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("scoring_preferences")
      .select("*")
      .eq("owner_id", ownerId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erreur récupération préférences:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ preferences: data || [] })
  } catch (error) {
    console.error("Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { owner_id, name, is_default, criteria } = body

    if (!owner_id || !name || !criteria) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 })
    }

    // Si c'est le profil par défaut, désactiver les autres
    if (is_default) {
      await supabase.from("scoring_preferences").update({ is_default: false }).eq("owner_id", owner_id)
    }

    const { data, error } = await supabase
      .from("scoring_preferences")
      .insert({
        owner_id,
        name,
        is_default: is_default || false,
        criteria,
      })
      .select()
      .single()

    if (error) {
      console.error("Erreur création préférences:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ preferences: data })
  } catch (error) {
    console.error("Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
