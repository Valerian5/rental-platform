import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { owner_id, system_preference_id } = body

    if (!owner_id || !system_preference_id) {
      return NextResponse.json({ error: "owner_id et system_preference_id requis" }, { status: 400 })
    }

    console.log("🔄 Application du modèle système:", system_preference_id, "pour:", owner_id)

    // 1. Récupérer le modèle système
    const { data: systemPreference, error: systemError } = await supabase
      .from("scoring_preferences")
      .select("*")
      .eq("model_type", system_preference_id)
      .eq("is_system", true)
      .single()

    if (systemError || !systemPreference) {
      console.error("❌ Modèle système introuvable:", systemError)
      return NextResponse.json({ error: "Modèle système introuvable" }, { status: 404 })
    }

    console.log("✅ Modèle système récupéré:", systemPreference.name)

    // 2. Désactiver les préférences par défaut existantes
    const { error: updateError } = await supabase
      .from("scoring_preferences")
      .update({ is_default: false })
      .eq("owner_id", owner_id)
      .eq("is_system", false)

    if (updateError) {
      console.error("⚠️ Erreur désactivation préférences existantes:", updateError)
    }

    // 3. Créer une nouvelle préférence utilisateur basée sur le modèle système
    const newPreference = {
      owner_id: owner_id,
      name: `${systemPreference.name} (Appliqué)`,
      description: systemPreference.description,
      model_type: systemPreference.model_type,
      is_default: true,
      is_system: false,
      system_preference_id: systemPreference.id,
      criteria: systemPreference.criteria,
      exclusion_rules: systemPreference.exclusion_rules,
    }

    const { data: preference, error: insertError } = await supabase
      .from("scoring_preferences")
      .insert(newPreference)
      .select()
      .single()

    if (insertError) {
      console.error("❌ Erreur création préférence:", insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    console.log("✅ Préférence utilisateur créée:", preference.id)

    return NextResponse.json({
      preference,
      message: `Modèle "${systemPreference.name}" appliqué avec succès`,
    })
  } catch (error) {
    console.error("❌ Erreur API use-system:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
