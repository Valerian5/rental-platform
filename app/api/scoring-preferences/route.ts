import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
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

    console.log("🔍 Récupération préférences pour owner:", ownerId, "default_only:", defaultOnly)

    let query = supabase.from("scoring_preferences").select("*").eq("owner_id", ownerId)

    if (defaultOnly) {
      query = query.eq("is_default", true)
    }

    const { data: preferences, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Erreur Supabase:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("✅ Préférences trouvées:", preferences?.length || 0)

    return NextResponse.json({ preferences: preferences || [] })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { owner_id, name, model_type, is_default, criteria, exclusion_rules, system_preference_id } = body

    if (!owner_id) {
      return NextResponse.json({ error: "owner_id requis" }, { status: 400 })
    }

    console.log("💾 Création/mise à jour préférence pour owner:", owner_id)

    // Si c'est une préférence par défaut, désactiver les autres préférences par défaut
    if (is_default) {
      const { error: updateError } = await supabase
        .from("scoring_preferences")
        .update({ is_default: false })
        .eq("owner_id", owner_id)

      if (updateError) {
        console.error("❌ Erreur mise à jour préférences existantes:", updateError)
      }
    }

    // Créer ou mettre à jour la préférence
    const preferenceData = {
      owner_id,
      name: name || "Préférences personnalisées",
      model_type: model_type || "custom",
      is_default: is_default || true,
      criteria: criteria || {},
      exclusion_rules: exclusion_rules || {},
      system_preference_id: system_preference_id || null,
      updated_at: new Date().toISOString(),
    }

    // Vérifier si une préférence existe déjà
    const { data: existing } = await supabase
      .from("scoring_preferences")
      .select("id")
      .eq("owner_id", owner_id)
      .eq("is_default", true)
      .single()

    let result
    if (existing) {
      // Mettre à jour
      const { data, error } = await supabase
        .from("scoring_preferences")
        .update(preferenceData)
        .eq("id", existing.id)
        .select()
        .single()

      result = { data, error }
    } else {
      // Créer
      preferenceData.created_at = new Date().toISOString()
      const { data, error } = await supabase.from("scoring_preferences").insert([preferenceData]).select().single()

      result = { data, error }
    }

    if (result.error) {
      console.error("❌ Erreur Supabase:", result.error)
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    console.log("✅ Préférence sauvegardée:", result.data?.id)

    return NextResponse.json({
      message: "Préférences sauvegardées avec succès",
      preference: result.data,
    })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
