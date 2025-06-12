import { NextResponse, type NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ownerId = searchParams.get("owner_id")
    const defaultOnly = searchParams.get("default_only") === "true"

    if (!ownerId) {
      return NextResponse.json({ error: "owner_id requis" }, { status: 400 })
    }

    console.log("🎯 Récupération préférences scoring:", { ownerId, defaultOnly })

    let query = supabase.from("scoring_preferences").select("*").eq("owner_id", ownerId)

    if (defaultOnly) {
      query = query.eq("is_default", true)
    } else {
      query = query.order("is_default", { ascending: false }).order("created_at", { ascending: false })
    }

    const { data, error } = await query

    if (error) {
      console.error("Erreur récupération préférences:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("📊 Préférences trouvées:", data?.length || 0)

    // Si aucune préférence personnalisée trouvée, récupérer le modèle système par défaut
    if (!data || data.length === 0) {
      console.log("🔍 Recherche modèle système par défaut...")

      const { data: systemData, error: systemError } = await supabase
        .from("scoring_preferences")
        .select("*")
        .eq("is_system", true)
        .eq("is_default", true)
        .single()

      if (systemError) {
        console.error("Erreur récupération modèle système:", systemError)
        return NextResponse.json({ preferences: [] })
      }

      console.log("✅ Modèle système trouvé:", systemData?.name)
      return NextResponse.json({ preferences: [systemData] })
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
    const { owner_id, is_default, ...preferenceData } = body

    console.log("💾 Création nouvelle préférence:", { owner_id, is_default, name: preferenceData.name })

    // Si c'est une préférence par défaut, désactiver les autres préférences par défaut de ce propriétaire
    if (is_default) {
      console.log("🔄 Désactivation des autres préférences par défaut...")
      const { error: updateError } = await supabase
        .from("scoring_preferences")
        .update({ is_default: false })
        .eq("owner_id", owner_id)
        .eq("is_system", false) // Ne pas toucher aux préférences système

      if (updateError) {
        console.error("Erreur désactivation préférences:", updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    }

    // Créer la nouvelle préférence
    const { data, error } = await supabase
      .from("scoring_preferences")
      .insert({
        owner_id,
        is_default,
        is_system: false, // Les préférences utilisateur ne sont jamais système
        ...preferenceData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Erreur création préférence:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("✅ Préférence créée:", data.id)
    return NextResponse.json({ preference: data })
  } catch (error) {
    console.error("Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
