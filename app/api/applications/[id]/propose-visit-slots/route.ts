import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const applicationId = params.id
  const supabase = createClient()

  try {
    const { slots } = await request.json()

    if (!slots || !Array.isArray(slots) || slots.length === 0) {
      return new NextResponse(JSON.stringify({ message: "Aucun créneau fourni" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Filtrer les créneaux futurs uniquement
    const now = new Date()
    const futureSlots = slots.filter((slot) => new Date(slot.start_time) > now)

    if (futureSlots.length === 0) {
      return new NextResponse(JSON.stringify({ message: "Aucun créneau futur fourni" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Insérer les créneaux de visite
    const { error } = await supabase.from("visit_slots").insert(
      futureSlots.map((slot: any) => ({
        application_id: applicationId,
        start_time: slot.start_time,
        end_time: slot.end_time,
        is_available: true,
        created_at: new Date().toISOString(),
      })),
    )

    if (error) {
      console.error("Erreur insertion créneaux:", error)
      return new NextResponse(JSON.stringify({ message: "Erreur lors de l'insertion des créneaux" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Mettre à jour le statut de la candidature
    const { error: updateError } = await supabase
      .from("applications")
      .update({
        status: "visit_proposed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId)

    if (updateError) {
      console.error("Erreur mise à jour statut:", updateError)
      return new NextResponse(JSON.stringify({ message: "Erreur lors de la mise à jour du statut" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    return new NextResponse(
      JSON.stringify({
        message: "Créneaux de visite proposés avec succès",
        slotsCount: futureSlots.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (e) {
    console.error("Erreur inattendue:", e)
    return new NextResponse(JSON.stringify({ message: "Erreur inattendue" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
