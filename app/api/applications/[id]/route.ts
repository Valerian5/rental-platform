import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Variables d'environnement Supabase manquantes")
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

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
    return NextResponse.json({ success: true, application: data })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    console.log("🗑️ Suppression candidature:", id)

    // Vérifier que la candidature existe
    const { data: application, error: checkError } = await supabase
      .from("applications")
      .select("id, status, tenant_id")
      .eq("id", id)
      .single()

    if (checkError || !application) {
      console.error("❌ Candidature non trouvée:", checkError)
      return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
    }

    // Vérifier que la candidature peut être supprimée
    if (application.status === "accepted") {
      return NextResponse.json({ error: "Impossible de supprimer une candidature acceptée" }, { status: 400 })
    }

    // Supprimer les créneaux de visite associés
    const { error: slotsError } = await supabase.from("visit_slots").delete().eq("application_id", id)

    if (slotsError) {
      console.error("❌ Erreur suppression créneaux:", slotsError)
      // On continue même si la suppression des créneaux échoue
    }

    // Marquer la candidature comme retirée au lieu de la supprimer
    const { data, error } = await supabase
      .from("applications")
      .update({
        status: "withdrawn",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("❌ Erreur retrait candidature:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("✅ Candidature retirée:", data?.id)
    return NextResponse.json({ success: true, message: "Candidature retirée avec succès" })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
