import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { name, is_default, criteria } = body

    // Si on définit comme défaut, désactiver les autres
    if (is_default) {
      const { data: current } = await supabase.from("scoring_preferences").select("owner_id").eq("id", id).single()

      if (current) {
        await supabase.from("scoring_preferences").update({ is_default: false }).eq("owner_id", current.owner_id)
      }
    }

    const { data, error } = await supabase
      .from("scoring_preferences")
      .update({
        name,
        is_default: is_default || false,
        criteria,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Erreur mise à jour préférences:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ preferences: data })
  } catch (error) {
    console.error("Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const { error } = await supabase.from("scoring_preferences").delete().eq("id", id)

    if (error) {
      console.error("Erreur suppression préférences:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
