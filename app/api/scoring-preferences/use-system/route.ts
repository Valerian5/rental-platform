import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { owner_id, system_preference_id } = body

    if (!owner_id || !system_preference_id) {
      return NextResponse.json({ error: "owner_id et system_preference_id sont requis" }, { status: 400 })
    }

    // Récupérer le modèle système
    const { data: systemPreference, error: systemError } = await supabase
      .from("scoring_preferences")
      .select("*")
      .eq("model_type", system_preference_id)
      .eq("is_system", true)
      .single()

    if (systemError || !systemPreference) {
      console.error("Erreur récupération modèle système:", systemError)
      return NextResponse.json({ error: "Modèle système introuvable" }, { status: 404 })
    }

    // Désactiver les préférences par défaut existantes
    await supabase
      .from("scoring_preferences")
      .update({ is_default: false })
      .eq("owner_id", owner_id)
      .eq("is_default", true)

    // Créer une nouvelle préférence basée sur le modèle système
    const { data: newPreference, error: insertError } = await supabase
      .from("scoring_preferences")
      .insert({
        owner_id: owner_id,
        name: systemPreference.name,
        description: systemPreference.description,
        model_type: systemPreference.model_type,
        is_default: true,
        is_system: false,
        system_preference_id: systemPreference.id,
        criteria: systemPreference.criteria,
        exclusion_rules: systemPreference.exclusion_rules,
        // Remplir les anciennes colonnes pour compatibilité
        min_income_ratio: systemPreference.criteria?.income_ratio?.thresholds?.minimum || 2.0,
        good_income_ratio: systemPreference.criteria?.income_ratio?.thresholds?.good || 3.0,
        excellent_income_ratio: systemPreference.criteria?.income_ratio?.thresholds?.excellent || 3.5,
        accepted_contracts: ["cdi_confirmed", "cdi_trial", "cdd_long"],
        preferred_contracts: ["cdi_confirmed"],
        min_professional_experience: 0,
        guarantor_required: systemPreference.criteria?.guarantor?.required_if_income_below ? true : false,
        min_guarantor_income_ratio: systemPreference.criteria?.guarantor?.minimum_income_ratio || 3.0,
        accepted_guarantor_types: ["parent", "visale", "garantme"],
        min_file_completion: 80,
        verified_documents_required: systemPreference.criteria?.file_quality?.verified_documents_required || false,
        max_occupants_ratio: 2.0,
        pet_policy: "case_by_case",
        weights: {
          income_ratio: systemPreference.criteria?.income_ratio?.weight || 20,
          guarantor: systemPreference.criteria?.guarantor?.weight || 15,
          professional_stability: systemPreference.criteria?.professional_stability?.weight || 15,
          file_quality: systemPreference.criteria?.file_quality?.weight || 15,
          property_coherence: systemPreference.criteria?.property_coherence?.weight || 15,
          income_distribution: systemPreference.criteria?.income_distribution?.weight || 20,
        },
      })
      .select()
      .single()

    if (insertError) {
      console.error("Erreur insertion préférence:", insertError)
      return NextResponse.json({ error: "Erreur lors de la création de la préférence" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      preference: newPreference,
      message: `Modèle "${systemPreference.name}" appliqué avec succès`,
    })
  } catch (error) {
    console.error("Erreur API use-system:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
