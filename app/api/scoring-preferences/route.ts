import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ownerId = searchParams.get("owner_id")
    const defaultOnly = searchParams.get("default_only") === "true"

    if (!ownerId) {
      return NextResponse.json({ error: "owner_id is required" }, { status: 400 })
    }

    let query = supabase.from("scoring_preferences").select("*").eq("owner_id", ownerId)

    if (defaultOnly) {
      query = query.eq("is_default", true)
    }

    const { data: preferences, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Erreur Supabase:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error("Erreur API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { owner_id, name, model_type, criteria, exclusion_rules, is_default = true, system_preference_id } = body

    if (!owner_id) {
      return NextResponse.json({ error: "owner_id is required" }, { status: 400 })
    }

    // Si c'est une préférence par défaut, désactiver les autres préférences par défaut
    if (is_default) {
      await supabase.from("scoring_preferences").update({ is_default: false }).eq("owner_id", owner_id)
    }

    // Insérer la nouvelle préférence
    const { data: preference, error } = await supabase
      .from("scoring_preferences")
      .insert({
        owner_id,
        name,
        model_type,
        criteria,
        exclusion_rules,
        is_default,
        system_preference_id,
        version: 1,
      })
      .select()
      .single()

    if (error) {
      console.error("Erreur insertion Supabase:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ preference })
  } catch (error) {
    console.error("Erreur API POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
