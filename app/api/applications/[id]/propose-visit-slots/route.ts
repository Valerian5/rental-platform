import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const applicationId = params.id
  const supabase = createClient()

  try {
    const body = await request.json()
    console.log("📝 Body reçu:", body)

    // Récupérer les slot_ids depuis le body
    const { slot_ids, message, status } = body

    if (!slot_ids || !Array.isArray(slot_ids) || slot_ids.length === 0) {
      console.error("❌ Aucun slot_ids fourni:", { slot_ids, body })
      return new NextResponse(
        JSON.stringify({
          error: "Aucun créneau fourni",
          details: "Le paramètre slot_ids est requis et doit être un tableau non vide",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    console.log("🎯 Proposition de créneaux:", {
      applicationId,
      slot_ids,
      message: message?.substring(0, 50) + "...",
      status,
    })

    // Vérifier que l'application existe
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("id, property_id, tenant_id")
      .eq("id", applicationId)
      .single()

    if (appError || !application) {
      console.error("❌ Application non trouvée:", appError)
      return new NextResponse(JSON.stringify({ error: "Candidature non trouvée" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Associer les créneaux à l'application
    const { error: slotsError } = await supabase
      .from("visit_slots")
      .update({ application_id: applicationId })
      .in("id", slot_ids)

    if (slotsError) {
      console.error("❌ Erreur association créneaux:", slotsError)
      return new NextResponse(JSON.stringify({ error: "Erreur lors de l'association des créneaux" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Mettre à jour le statut de la candidature
    const { error: updateError } = await supabase
      .from("applications")
      .update({
        status: status || "visit_proposed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId)

    if (updateError) {
      console.error("❌ Erreur mise à jour statut:", updateError)
      return new NextResponse(JSON.stringify({ error: "Erreur lors de la mise à jour du statut" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    console.log("✅ Créneaux proposés avec succès:", {
      applicationId,
      slotsCount: slot_ids.length,
      newStatus: status || "visit_proposed",
    })

    return new NextResponse(
      JSON.stringify({
        message: `${slot_ids.length} créneau(x) de visite proposé(s) avec succès`,
        slotsCount: slot_ids.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (e) {
    console.error("❌ Erreur inattendue:", e)
    return new NextResponse(
      JSON.stringify({
        error: "Erreur inattendue",
        details: e instanceof Error ? e.message : "Erreur inconnue",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
