import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: applicationId } = params
    const { slot_ids } = await request.json()

    console.log("📅 Proposition créneaux:", { applicationId, slot_ids })

    if (!slot_ids || !Array.isArray(slot_ids) || slot_ids.length === 0) {
      return NextResponse.json({ error: "Aucun créneau sélectionné" }, { status: 400 })
    }

    // Vérifier que la candidature existe et appartient au propriétaire
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select(`
        *,
        property:properties!inner(
          id,
          owner_id,
          title
        )
      `)
      .eq("id", applicationId)
      .single()

    if (appError || !application) {
      console.error("❌ Candidature non trouvée:", appError)
      return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
    }

    console.log("✅ Candidature trouvée:", {
      id: application.id,
      property_id: application.property_id,
      status: application.status,
    })

    // Vérifier que les créneaux existent et appartiennent à la propriété
    const { data: slots, error: slotsError } = await supabase
      .from("property_visit_slots")
      .select("*")
      .eq("property_id", application.property_id)
      .in("id", slot_ids)

    if (slotsError) {
      console.error("❌ Erreur récupération créneaux:", slotsError)
      return NextResponse.json({ error: "Erreur lors de la vérification des créneaux" }, { status: 500 })
    }

    if (!slots || slots.length === 0) {
      console.error("❌ Aucun créneau trouvé pour les IDs:", slot_ids)
      return NextResponse.json({ error: "Aucun créneau trouvé" }, { status: 400 })
    }

    if (slots.length !== slot_ids.length) {
      console.error("❌ Nombre de créneaux incorrect:", {
        demandés: slot_ids.length,
        trouvés: slots.length,
        slot_ids,
        slots_trouvés: slots.map((s) => s.id),
      })
      return NextResponse.json({ error: "Certains créneaux sont invalides" }, { status: 400 })
    }

    console.log("✅ Créneaux validés:", slots.length)

    // Mettre à jour la candidature avec les créneaux proposés
    const { data: updatedApplication, error: updateError } = await supabase
      .from("applications")
      .update({
        status: "visit_proposed",
        proposed_slot_ids: slot_ids,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId)
      .select()
      .single()

    if (updateError) {
      console.error("❌ Erreur mise à jour candidature:", updateError)
      return NextResponse.json({ error: "Erreur lors de la proposition" }, { status: 500 })
    }

    // Créer une notification pour le locataire
    try {
      await supabase.from("notifications").insert({
        user_id: application.tenant_id,
        title: "Créneaux de visite proposés",
        content: `Des créneaux de visite ont été proposés pour ${application.property.title}`,
        type: "visit_proposed",
        action_url: `/tenant/applications/${applicationId}/select-visit-slot`,
      })
      console.log("✅ Notification créée")
    } catch (notifError) {
      console.error("❌ Erreur notification:", notifError)
    }

    console.log("✅ Créneaux proposés avec succès")

    return NextResponse.json({
      success: true,
      application: updatedApplication,
      message: "Créneaux proposés avec succès",
      slots_count: slots.length,
    })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

