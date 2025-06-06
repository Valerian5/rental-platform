import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: applicationId } = params
    const { slot_ids } = await request.json()

    console.log("📅 Proposition créneaux:", { applicationId, slot_ids })

    // Vérifier que la candidature existe et appartient au propriétaire
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select(`
        *,
        property:properties!inner(owner_id)
      `)
      .eq("id", applicationId)
      .single()

    if (appError || !application) {
      return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
    }

    // Vérifier que les créneaux appartiennent bien à la propriété
    const { data: slots, error: slotsError } = await supabase
      .from("property_visit_slots")
      .select("*")
      .eq("property_id", application.property_id)
      .in("id", slot_ids)

    if (slotsError || !slots || slots.length !== slot_ids.length) {
      return NextResponse.json({ error: "Créneaux invalides" }, { status: 400 })
    }

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
      const { data: property } = await supabase
        .from("properties")
        .select("title")
        .eq("id", application.property_id)
        .single()

      if (property) {
        await supabase.from("notifications").insert({
          user_id: application.tenant_id,
          title: "Créneaux de visite proposés",
          content: `Des créneaux de visite ont été proposés pour ${property.title}`,
          type: "visit_proposed",
          action_url: "/tenant/applications",
        })
      }
    } catch (notifError) {
      console.error("❌ Erreur notification:", notifError)
    }

    console.log("✅ Créneaux proposés:", updatedApplication)

    return NextResponse.json({
      success: true,
      application: updatedApplication,
      message: "Créneaux proposés avec succès",
    })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
