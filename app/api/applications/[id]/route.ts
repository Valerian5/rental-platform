import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    console.log("🔍 Recherche candidature ID:", id)

    // Récupérer la candidature avec les informations du tenant et de la propriété
    const { data: application, error } = await supabase
      .from("applications")
      .select(`
        *,
        property:properties(*),
        tenant:users(*)
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("❌ Erreur récupération candidature:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("✅ Candidature trouvée:", application?.id)
    return NextResponse.json({ application })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { status, notes } = body

    console.log("🔄 Mise à jour candidature:", id, "nouveau statut:", status)

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (notes) {
      updateData.notes = notes
    }

    const { data, error } = await supabase.from("applications").update(updateData).eq("id", id).select().single()

    if (error) {
      console.error("❌ Erreur mise à jour candidature:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("✅ Candidature mise à jour:", data?.id)
    return NextResponse.json({ application: data })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
