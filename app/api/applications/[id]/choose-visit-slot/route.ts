import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: applicationId } = params
    const { slot_id } = await request.json()

    console.log("📅 Choix créneau:", { applicationId, slot_id })

    // Récupérer la candidature avec les créneaux proposés
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select(`
        *,
        property:properties(*),
        tenant:users(*)
      `)
      .eq("id", applicationId)
      .single()

    if (appError || !application) {
      return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
    }

    // Vérifier que le créneau fait partie des créneaux proposés
    if (!application.proposed_slot_ids || !application.proposed_slot_ids.includes(slot_id)) {
      return NextResponse.json({ error: "Créneau non proposé" }, { status: 400 })
    }

    // Récupérer les détails du créneau choisi
    const { data: slot, error: slotError } = await supabase
      .from("property_visit_slots")
      .select("*")
      .eq("id", slot_id)
      .single()

    if (slotError || !slot) {
      return NextResponse.json({ error: "Créneau non trouvé" }, { status: 404 })
    }

    // Créer la visite réelle
    const { data: visit, error: visitError } = await supabase
      .from("visits")
      .insert({
        property_id: application.property_id,
        tenant_id: application.tenant_id,
        visitor_name: `${application.tenant?.first_name || ""} ${application.tenant?.last_name || ""}`.trim(),
        visitor_email: application.tenant?.email || "",
        visitor_phone: application.tenant?.phone || "",
        visit_date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        status: "scheduled",
        notes: `Visite programmée suite à la candidature ${applicationId}`,
      })
      .select()
      .single()

    if (visitError) {
      console.error("❌ Erreur création visite:", visitError)
      return NextResponse.json({ error: "Erreur lors de la création de la visite" }, { status: 500 })
    }

    // Mettre à jour le statut de la candidature
    const { error: updateError } = await supabase
      .from("applications")
      .update({
        status: "visit_scheduled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId)

    if (updateError) {
      console.error("❌ Erreur mise à jour candidature:", updateError)
      return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 })
    }

    // Mettre à jour le créneau pour indiquer qu'il est réservé
    await supabase
      .from("property_visit_slots")
      .update({
        current_bookings: (slot.current_bookings || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", slot_id)

    // Créer une notification pour le propriétaire
    try {
      await supabase.from("notifications").insert({
        user_id: application.property.owner_id,
        title: "Visite confirmée",
        content: `${application.tenant?.first_name} ${application.tenant?.last_name} a confirmé une visite pour ${application.property.title}`,
        type: "visit_confirmed",
        action_url: "/owner/visits",
      })
    } catch (notifError) {
      console.error("❌ Erreur notification:", notifError)
    }

    console.log("✅ Visite programmée:", visit.id)

    return NextResponse.json({
      success: true,
      visit: visit,
      message: "Créneau de visite confirmé avec succès",
    })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
