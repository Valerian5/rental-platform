import { NextResponse, type NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { owner_id, system_preference_id } = body

    console.log("🔄 Application du modèle système:", { owner_id, system_preference_id })

    if (!owner_id || !system_preference_id) {
      return NextResponse.json({ error: "owner_id et system_preference_id requis" }, { status: 400 })
    }

    // Récupérer le modèle système
    const { data: systemModel, error: systemError } = await supabase
      .from("scoring_preferences")
      .select("*")
      .eq("id", system_preference_id)
      .eq("is_system", true)
      .single()

    if (systemError || !systemModel) {
      console.error("Erreur récupération modèle système:", systemError)
      return NextResponse.json({ error: "Modèle système introuvable" }, { status: 404 })
    }

    // Désactiver les autres préférences par défaut de ce propriétaire
    await supabase
      .from("scoring_preferences")
      .update({ is_default: false })
      .eq("owner_id", owner_id)
      .eq("is_system", false)

    // Créer une nouvelle préférence basée sur le modèle système
    const { data, error } = await supabase
      .from("scoring_preferences")
      .insert({
        owner_id,
        name: `${systemModel.name} (personnalisé)`,
        is_default: true,
        is_system: false,
        criteria: systemModel.criteria,
        system_preference_id: system_preference_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Erreur création préférence utilisateur:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("✅ Préférence utilisateur créée basée sur le modèle système:", data.id)
    return NextResponse.json({ preference: data })
  } catch (error) {
    console.error("Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
