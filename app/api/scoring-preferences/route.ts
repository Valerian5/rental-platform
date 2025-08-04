import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { scoringPreferencesService } from "@/lib/scoring-preferences-service"

// Créer le client Supabase avec la clé service pour contourner RLS si nécessaire
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Client normal pour les opérations utilisateur
const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ownerId = searchParams.get("owner_id")
    const defaultOnly = searchParams.get("default_only") === "true"

    if (!ownerId) {
      return NextResponse.json({ error: "owner_id requis" }, { status: 400 })
    }

    console.log("🔍 Récupération préférences pour:", ownerId, "default_only:", defaultOnly)

    // Utiliser le client admin pour éviter les problèmes RLS lors de la lecture
    let query = supabaseAdmin
      .from("scoring_preferences")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false })

    if (defaultOnly) {
      query = query.eq("is_default", true).limit(1)
    }

    const { data: preferences, error } = await query

    if (error) {
      console.error("❌ Erreur récupération préférences:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("✅ Préférences récupérées:", preferences?.length || 0)

    return NextResponse.json({ preferences: preferences || [] })
  } catch (error) {
    console.error("❌ Erreur API scoring-preferences GET:", error)
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

    console.log("💾 Création préférence pour:", owner_id, "modèle:", model_type)

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

    // Vérifier que l'utilisateur existe
    const { data: user, error: userError } = await supabaseAdmin.from("users").select("id").eq("id", owner_id).single()

    if (userError || !user) {
      console.error("❌ Utilisateur non trouvé:", owner_id, userError)
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    // Si c'est une préférence par défaut, désactiver les autres
    if (is_default) {
      const { error: updateError } = await supabaseAdmin
        .from("scoring_preferences")
        .update({ is_default: false })
        .eq("owner_id", owner_id)
        .eq("is_system", false)

      if (updateError) {
        console.error("⚠️ Erreur mise à jour préférences existantes:", updateError)
      }
    }

    // Créer la nouvelle préférence avec versioning
    const preferenceData = {
      owner_id,
      name,
      model_type,
      is_default,
      is_system: false, // Toujours false pour les préférences utilisateur
      criteria,
      exclusion_rules: exclusion_rules || {
        incomplete_file: false,
        no_guarantor_when_required: true,
        income_ratio_below_2: false,
        unverified_documents: false,
        manifest_incoherence: true,
      },
      system_preference_id,
      version: 1, // Version initiale
    }

    console.log("📝 Données à insérer:", {
      ...preferenceData,
      criteria: "...", // Ne pas logger les critères complets
      exclusion_rules: "...",
    })

    // Utiliser le client admin pour l'insertion
    const { data: preference, error } = await supabaseAdmin
      .from("scoring_preferences")
      .insert(preferenceData)
      .select()
      .single()

    if (error) {
      console.error("❌ Erreur création préférence:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("✅ Préférence de scoring créée:", preference.id)

    // Invalider le cache pour ce propriétaire
    scoringPreferencesService.invalidatePreferencesCache(owner_id)

    return NextResponse.json({
      preference,
      message: "Préférence de scoring créée avec succès",
    })
  } catch (error) {
    console.error("❌ Erreur API scoring-preferences POST:", error)
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

    console.log("🔄 Mise à jour préférence:", id)

    // Récupérer la préférence actuelle pour obtenir la version
    const { data: currentPreference, error: fetchError } = await supabaseAdmin
      .from("scoring_preferences")
      .select("version, owner_id")
      .eq("id", id)
      .eq("is_system", false)
      .single()

    if (fetchError || !currentPreference) {
      return NextResponse.json({ error: "Préférence non trouvée" }, { status: 404 })
    }

    // Incrémenter la version
    const newVersion = (currentPreference.version || 1) + 1
    const updatedData = { ...updateData, version: newVersion }

    // Si c'est une préférence par défaut, désactiver les autres
    if (updateData.is_default && updateData.owner_id) {
      const { error: updateError } = await supabaseAdmin
        .from("scoring_preferences")
        .update({ is_default: false })
        .eq("owner_id", updateData.owner_id)
        .eq("is_system", false)
        .neq("id", id)

      if (updateError) {
        console.error("⚠️ Erreur mise à jour préférences existantes:", updateError)
      }
    }

    const { data: preference, error } = await supabaseAdmin
      .from("scoring_preferences")
      .update(updatedData)
      .eq("id", id)
      .eq("is_system", false) // Seulement les préférences utilisateur
      .select()
      .single()

    if (error) {
      console.error("❌ Erreur mise à jour préférence:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("✅ Préférence mise à jour:", preference.id, "nouvelle version:", newVersion)

    // Invalider le cache pour ce propriétaire
    scoringPreferencesService.invalidatePreferencesCache(currentPreference.owner_id)

    return NextResponse.json({
      preference,
      message: "Préférence mise à jour avec succès",
    })
  } catch (error) {
    console.error("❌ Erreur API scoring-preferences PUT:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
