import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { scoringPreferencesService } from "@/lib/scoring-preferences-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { owner_id, system_preference_id } = body

    if (!owner_id || !system_preference_id) {
      return NextResponse.json({ error: "owner_id et system_preference_id requis" }, { status: 400 })
    }

    console.log("🔄 Application du modèle système:", system_preference_id, "pour:", owner_id)

    // 1. Récupérer le modèle système depuis le service
    let systemModel
    switch (system_preference_id) {
      case "strict":
        systemModel = scoringPreferencesService.getStrictModel()
        break
      case "standard":
        systemModel = scoringPreferencesService.getStandardModel()
        break
      case "flexible":
        systemModel = scoringPreferencesService.getFlexibleModel()
        break
      default:
        return NextResponse.json({ error: "Modèle système non reconnu" }, { status: 400 })
    }

    console.log("✅ Modèle système récupéré:", systemModel.name)

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
      name: `${systemModel.name} (Appliqué)`,
      description: systemModel.description,
      model_type: systemModel.id,
      is_default: true,
      is_system: false,
      system_preference_id: systemModel.id,
      criteria: systemModel.criteria,
      exclusion_rules: systemModel.exclusion_rules,
      version: 1, // Version initiale
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

    // 4. Invalider le cache pour ce propriétaire
    scoringPreferencesService.invalidatePreferencesCache(owner_id)

    return NextResponse.json({
      preference,
      message: `Modèle "${systemModel.name}" appliqué avec succès`,
    })
  } catch (error) {
    console.error("❌ Erreur API use-system:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
