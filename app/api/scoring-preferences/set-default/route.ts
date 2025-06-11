import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { profile_id, owner_id } = body

    if (!profile_id || !owner_id) {
      return NextResponse.json({ error: "profile_id et owner_id requis" }, { status: 400 })
    }

    // Désactiver tous les profils par défaut du propriétaire
    await supabase.from("scoring_preferences").update({ is_default: false }).eq("owner_id", owner_id)

    // Définir le profil sélectionné comme défaut
    const { data, error } = await supabase
      .from("scoring_preferences")
      .update({ is_default: true })
      .eq("id", profile_id)
      .select()
      .single()

    if (error) {
      console.error("Erreur mise à jour profil par défaut:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ preferences: data })
  } catch (error) {
    console.error("Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
