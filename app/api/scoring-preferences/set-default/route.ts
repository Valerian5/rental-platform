import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { owner_id, profile_id } = body

    if (!owner_id || !profile_id) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 })
    }

    // Désactiver tous les profils par défaut du propriétaire
    const { error: updateError } = await supabase
      .from("scoring_preferences")
      .update({ is_default: false })
      .eq("owner_id", owner_id)

    if (updateError) {
      console.error("Erreur désactivation profils par défaut:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Définir le profil sélectionné comme défaut
    const { error: setDefaultError } = await supabase
      .from("scoring_preferences")
      .update({ is_default: true })
      .eq("id", profile_id)
      .eq("owner_id", owner_id)

    if (setDefaultError) {
      console.error("Erreur définition profil par défaut:", setDefaultError)
      return NextResponse.json({ error: setDefaultError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
