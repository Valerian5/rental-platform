import { NextResponse, type NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    console.log("🎯 Récupération des modèles système de scoring")

    // Récupérer tous les modèles système
    const { data, error } = await supabase
      .from("scoring_preferences")
      .select("*")
      .eq("is_system", true)
      .order("is_default", { ascending: false })
      .order("name", { ascending: true })

    if (error) {
      console.error("Erreur récupération modèles système:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("📊 Modèles système trouvés:", data?.length || 0)

    // Si aucun modèle système n'existe, créer les modèles par défaut
    if (!data || data.length === 0) {
      console.log("🔧 Création des modèles système par défaut...")

      const defaultModels = [
        {
          name: "Modèle équilibré",
          description: "Critères équilibrés pour la plupart des situations",
          is_system: true,
          is_default: true,
          owner_id: "system",
          criteria: {
            income_ratio: {
              weight: 35,
              thresholds: { excellent: 3.5, good: 3.0, acceptable: 2.5, minimum: 2.0 },
              points: { excellent: 100, good: 75, acceptable: 50, insufficient: 0 },
            },
            professional_stability: {
              weight: 30,
              contract_types: { cdi: 100, cdd: 75, freelance: 50, student: 25, unemployed: 0, retired: 80 },
              seniority_bonus: { enabled: true, min_months: 12, bonus_points: 10 },
              trial_period_penalty: { enabled: true, penalty_points: 15 },
            },
            guarantor: {
              weight: 25,
              presence_points: 100,
              income_ratio_bonus: { enabled: true, threshold: 3.0, bonus_points: 20 },
              multiple_guarantors_bonus: { enabled: true, bonus_per_additional: 10 },
            },
            application_quality: {
              weight: 10,
              presentation_length: { excellent: 200, good: 100, basic: 50 },
              completeness_bonus: { enabled: true, bonus_points: 15 },
            },
          },
        },
        {
          name: "Modèle strict",
          description: "Critères stricts pour des biens de standing",
          is_system: true,
          is_default: false,
          owner_id: "system",
          criteria: {
            income_ratio: {
              weight: 45,
              thresholds: { excellent: 4.0, good: 3.5, acceptable: 3.0, minimum: 2.5 },
              points: { excellent: 100, good: 75, acceptable: 50, insufficient: 0 },
            },
            professional_stability: {
              weight: 30,
              contract_types: { cdi: 100, cdd: 60, freelance: 30, student: 10, unemployed: 0, retired: 85 },
              seniority_bonus: { enabled: true, min_months: 18, bonus_points: 15 },
              trial_period_penalty: { enabled: true, penalty_points: 25 },
            },
            guarantor: {
              weight: 20,
              presence_points: 100,
              income_ratio_bonus: { enabled: true, threshold: 3.5, bonus_points: 25 },
              multiple_guarantors_bonus: { enabled: true, bonus_per_additional: 15 },
            },
            application_quality: {
              weight: 5,
              presentation_length: { excellent: 300, good: 150, basic: 75 },
              completeness_bonus: { enabled: true, bonus_points: 20 },
            },
          },
        },
        {
          name: "Modèle flexible",
          description: "Critères souples pour favoriser l'accessibilité",
          is_system: true,
          is_default: false,
          owner_id: "system",
          criteria: {
            income_ratio: {
              weight: 25,
              thresholds: { excellent: 3.0, good: 2.5, acceptable: 2.0, minimum: 1.8 },
              points: { excellent: 100, good: 80, acceptable: 60, insufficient: 20 },
            },
            professional_stability: {
              weight: 25,
              contract_types: { cdi: 100, cdd: 85, freelance: 70, student: 50, unemployed: 10, retired: 75 },
              seniority_bonus: { enabled: true, min_months: 6, bonus_points: 10 },
              trial_period_penalty: { enabled: false, penalty_points: 0 },
            },
            guarantor: {
              weight: 30,
              presence_points: 100,
              income_ratio_bonus: { enabled: true, threshold: 2.5, bonus_points: 15 },
              multiple_guarantors_bonus: { enabled: true, bonus_per_additional: 10 },
            },
            application_quality: {
              weight: 20,
              presentation_length: { excellent: 150, good: 75, basic: 25 },
              completeness_bonus: { enabled: true, bonus_points: 25 },
            },
          },
        },
      ]

      // Insérer les modèles par défaut
      const { data: insertedData, error: insertError } = await supabase
        .from("scoring_preferences")
        .insert(defaultModels)
        .select()

      if (insertError) {
        console.error("Erreur création modèles système:", insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      console.log("✅ Modèles système créés:", insertedData?.length || 0)
      return NextResponse.json({ preferences: insertedData })
    }

    return NextResponse.json({ preferences: data })
  } catch (error) {
    console.error("Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, criteria } = body

    console.log("💾 Création nouveau modèle système:", { name, description })

    if (!name || !criteria) {
      return NextResponse.json({ error: "Nom et critères requis" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("scoring_preferences")
      .insert({
        name,
        description: description || "",
        is_system: true,
        is_default: false,
        owner_id: "system",
        criteria,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Erreur création modèle système:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("✅ Modèle système créé:", data.id)
    return NextResponse.json({ preference: data })
  } catch (error) {
    console.error("Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
