import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ownerId = searchParams.get("owner_id")
    const defaultOnly = searchParams.get("default_only") === "true"

    if (!ownerId) {
      return NextResponse.json({ error: "owner_id requis" }, { status: 400 })
    }

    let query = supabase
      .from("scoring_preferences")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false })

    if (defaultOnly) {
      query = query.eq("is_default", true).limit(1)
    }

    const { data: preferences, error } = await query

    if (error) {
      console.error("Erreur récupération préférences:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ preferences: preferences || [] })
  } catch (error) {
    console.error("Erreur API scoring-preferences GET:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      owner_id,
      name,
      model_type = "custom",
      is_default = true,
      criteria,
      exclusion_rules,
      system_preference_id,
    } = body

    if (!owner_id || !name || !criteria) {
      return NextResponse.json({ error: "owner_id, name et criteria sont requis" }, { status: 400 })
    }

    // Valider la structure des critères
    const requiredCriteria = [
      "income_ratio",
      "guarantor",
      "professional_stability",
      "file_quality",
      "property_coherence",
      "income_distribution",
    ]

    for (const criterion of requiredCriteria) {
      if (!criteria[criterion] || typeof criteria[criterion].weight !== "number") {
        return NextResponse.json({ error: `Critère ${criterion} manquant ou invalide` }, { status: 400 })
      }
    }

    // Vérifier que le total des poids ne dépasse pas 100
    const totalWeight = Object.values(criteria).reduce((sum: number, criterion: any) => {
      return sum + (criterion.weight || 0)
    }, 0)

    if (totalWeight > 100) {
      return NextResponse.json(
        { error: `Le total des poids ne peut pas dépasser 100 (actuellement: ${totalWeight})` },
        { status: 400 },
      )
    }

    // Si c'est une préférence par défaut, désactiver les autres
    if (is_default) {
      const { error: updateError } = await supabase
        .from("scoring_preferences")
        .update({ is_default: false })
        .eq("owner_id", owner_id)

      if (updateError) {
        console.error("Erreur mise à jour préférences existantes:", updateError)
      }
    }

    // Créer la nouvelle préférence
    const preferenceData = {
      owner_id,
      name,
      model_type,
      is_default,
      criteria,
      exclusion_rules: exclusion_rules || {
        incomplete_file: false,
        no_guarantor_when_required: true,
        income_ratio_below_2: false,
        unverified_documents: false,
        manifest_incoherence: true,
      },
      system_preference_id,
    }

    const { data: preference, error } = await supabase
      .from("scoring_preferences")
      .insert(preferenceData)
      .select()
      .single()

    if (error) {
      console.error("Erreur création préférence:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("✅ Préférence de scoring créée:", preference.id)

    return NextResponse.json({
      preference,
      message: "Préférence de scoring créée avec succès",
    })
  } catch (error) {
    console.error("Erreur API scoring-preferences POST:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 })
    }

    // Si c'est une préférence par défaut, désactiver les autres
    if (updateData.is_default) {
      const { error: updateError } = await supabase
        .from("scoring_preferences")
        .update({ is_default: false })
        .eq("owner_id", updateData.owner_id)
        .neq("id", id)

      if (updateError) {
        console.error("Erreur mise à jour préférences existantes:", updateError)
      }
    }

    const { data: preference, error } = await supabase
      .from("scoring_preferences")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Erreur mise à jour préférence:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      preference,
      message: "Préférence mise à jour avec succès",
    })
  } catch (error) {
    console.error("Erreur API scoring-preferences PUT:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
