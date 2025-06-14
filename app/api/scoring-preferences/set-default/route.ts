import { NextResponse, type NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { owner_id, profile_id } = body

    if (!owner_id || !profile_id) {
      return NextResponse.json({ error: "owner_id et profile_id requis" }, { status: 400 })
    }

    // Désactiver tous les profils par défaut pour ce propriétaire
    await supabase.from("scoring_preferences").update({ is_default: false }).eq("owner_id", owner_id)

    // Activer le profil sélectionné comme défaut
    const { data, error } = await supabase
      .from("scoring_preferences")
      .update({ is_default: true })
      .eq("id", profile_id)
      .eq("owner_id", owner_id)
      .select()
      .single()

    if (error) {
      console.error("Erreur mise à jour profil par défaut:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, profile: data })
  } catch (error) {
    console.error("Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
