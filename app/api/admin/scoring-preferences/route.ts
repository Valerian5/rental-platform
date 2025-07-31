import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Récupérer les modèles système prédéfinis
    const { data: preferences, error } = await supabase
      .from("scoring_preferences")
      .select("*")
      .eq("owner_id", "00000000-0000-0000-0000-000000000000") // ID système
      .order("model_type")

    if (error) {
      console.error("Erreur récupération modèles système:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Si aucun modèle système n'existe, les créer
    if (!preferences || preferences.length === 0) {
      console.log("Aucun modèle système trouvé, création des modèles par défaut...")

      const defaultModels = [
        {
          id: "strict-model-default",
          owner_id: "00000000-0000-0000-0000-000000000000",
          name: "Strict (GLI)",
          model_type: "strict",
          description:
            "Critères stricts inspirés des assurances GLI. Revenus ≥ 3,5x, CDI privilégié, garant obligatoire, documents vérifiés requis.",
          is_default: false,
          criteria: {
            income_ratio: {
              weight: 20,
              thresholds: { excellent: 4.0, good: 3.5, acceptable: 3.0, minimum: 2.5 },
              per_person_check: true,
            },
            guarantor: {
              weight: 20,
              required_if_income_below: 3.5,
              types_accepted: { parent: true, visale: true, garantme: true, other_physical: true, company: true },
              minimum_income_ratio: 3.0,
              verification_required: true,
            },
            professional_stability: {
              weight: 20,
              contract_scoring: {
                cdi_confirmed: 20,
                cdi_trial: 10,
                cdd_long: 15,
                cdd_short: 8,
                freelance: 5,
                student: 3,
                unemployed: 0,
                retired: 18,
                civil_servant: 20,
              },
              seniority_bonus: { enabled: true, min_months: 12, bonus_points: 3 },
              trial_period_penalty: 5,
            },
            file_quality: {
              weight: 20,
              complete_documents_required: true,
              verified_documents_required: true,
              presentation_quality_weight: 5,
              coherence_check_weight: 10,
            },
            property_coherence: {
              weight: 10,
              household_size_vs_property: true,
              colocation_structure_check: true,
              location_relevance_check: true,
              family_situation_coherence: true,
            },
            income_distribution: {
              weight: 10,
              balance_check: true,
              compensation_allowed: false,
            },
          },
          exclusion_rules: {
            incomplete_file: true,
            no_guarantor_when_required: true,
            income_ratio_below_2: true,
            unverified_documents: true,
            manifest_incoherence: true,
          },
          system_preference_id: "strict",
        },
        {
          id: "standard-model-default",
          owner_id: "00000000-0000-0000-0000-000000000000",
          name: "Standard (Agence)",
          model_type: "standard",
          description:
            "Pratiques standards d'agence. Revenus ≥ 3x, CDI/CDD acceptés, garant requis si revenus < 3x, approche équilibrée.",
          is_default: false,
          criteria: {
            income_ratio: {
              weight: 18,
              thresholds: { excellent: 3.5, good: 3.0, acceptable: 2.5, minimum: 2.0 },
              per_person_check: true,
            },
            guarantor: {
              weight: 17,
              required_if_income_below: 3.0,
              types_accepted: { parent: true, visale: true, garantme: true, other_physical: true, company: true },
              minimum_income_ratio: 3.0,
              verification_required: true,
            },
            professional_stability: {
              weight: 17,
              contract_scoring: {
                cdi_confirmed: 17,
                cdi_trial: 12,
                cdd_long: 14,
                cdd_short: 10,
                freelance: 8,
                student: 6,
                unemployed: 0,
                retired: 15,
                civil_servant: 17,
              },
              seniority_bonus: { enabled: true, min_months: 6, bonus_points: 2 },
              trial_period_penalty: 3,
            },
            file_quality: {
              weight: 16,
              complete_documents_required: true,
              verified_documents_required: false,
              presentation_quality_weight: 6,
              coherence_check_weight: 8,
            },
            property_coherence: {
              weight: 16,
              household_size_vs_property: true,
              colocation_structure_check: true,
              location_relevance_check: false,
              family_situation_coherence: true,
            },
            income_distribution: {
              weight: 16,
              balance_check: true,
              compensation_allowed: true,
            },
          },
          exclusion_rules: {
            incomplete_file: false,
            no_guarantor_when_required: true,
            income_ratio_below_2: false,
            unverified_documents: false,
            manifest_incoherence: true,
          },
          system_preference_id: "standard",
        },
        {
          id: "flexible-model-default",
          owner_id: "00000000-0000-0000-0000-000000000000",
          name: "Souple (Particulier)",
          model_type: "flexible",
          description:
            "Approche humaine et flexible. Revenus ≥ 2,5x, étudiants/freelances acceptés, garant recommandé, priorité à l'équilibre global.",
          is_default: false,
          criteria: {
            income_ratio: {
              weight: 15,
              thresholds: { excellent: 3.0, good: 2.5, acceptable: 2.0, minimum: 1.8 },
              per_person_check: false,
            },
            guarantor: {
              weight: 15,
              required_if_income_below: 2.5,
              types_accepted: { parent: true, visale: true, garantme: true, other_physical: true, company: false },
              minimum_income_ratio: 2.5,
              verification_required: false,
            },
            professional_stability: {
              weight: 15,
              contract_scoring: {
                cdi_confirmed: 15,
                cdi_trial: 13,
                cdd_long: 12,
                cdd_short: 10,
                freelance: 12,
                student: 10,
                unemployed: 3,
                retired: 13,
                civil_servant: 15,
              },
              seniority_bonus: { enabled: false, min_months: 0, bonus_points: 0 },
              trial_period_penalty: 1,
            },
            file_quality: {
              weight: 15,
              complete_documents_required: false,
              verified_documents_required: false,
              presentation_quality_weight: 8,
              coherence_check_weight: 5,
            },
            property_coherence: {
              weight: 20,
              household_size_vs_property: false,
              colocation_structure_check: false,
              location_relevance_check: false,
              family_situation_coherence: true,
            },
            income_distribution: {
              weight: 20,
              balance_check: false,
              compensation_allowed: true,
            },
          },
          exclusion_rules: {
            incomplete_file: false,
            no_guarantor_when_required: false,
            income_ratio_below_2: false,
            unverified_documents: false,
            manifest_incoherence: false,
          },
          system_preference_id: "flexible",
        },
      ]

      return NextResponse.json({ preferences: defaultModels })
    }

    return NextResponse.json({ preferences: preferences || [] })
  } catch (error) {
    console.error("Erreur API admin/scoring-preferences GET:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
