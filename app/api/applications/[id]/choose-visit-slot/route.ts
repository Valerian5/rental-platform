import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Variables d'environnement Supabase manquantes")
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const dynamic = "force-dynamic"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const applicationId = params.id
    const { slot_id } = await request.json()

    console.log("🎯 Sélection créneau:", { applicationId, slot_id })

    if (!slot_id) {
      return NextResponse.json({ error: "ID du créneau requis" }, { status: 400 })
    }

    // Récupérer l'application avec les informations du locataire
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select(`
        id,
        property_id,
        tenant_id,
        status,
        tenant:users!applications_tenant_id_fkey (
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq("id", applicationId)
      .single()

    if (appError || !application) {
      console.error("❌ Application non trouvée:", appError)
      return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
    }

    if (application.status !== "visit_proposed") {
      return NextResponse.json({ error: "Cette candidature n'a pas de créneaux de visite proposés" }, { status: 400 })
    }

    // Récupérer le créneau sélectionné
    const { data: slot, error: slotError } = await supabase
      .from("property_visit_slots")
      .select("*")
      .eq("id", slot_id)
      .eq("property_id", application.property_id)
      .single()

    if (slotError || !slot) {
      console.error("❌ Créneau non trouvé:", slotError)
      return NextResponse.json({ error: "Créneau non trouvé" }, { status: 404 })
    }

    // Vérifier que le créneau est disponible
    if (!slot.is_available || slot.current_bookings >= slot.max_capacity) {
      return NextResponse.json({ error: "Ce créneau n'est plus disponible" }, { status: 400 })
    }

    // Vérifier que le créneau est dans le futur
    const slotDateTime = new Date(`${slot.date}T${slot.start_time}`)
    if (slotDateTime <= new Date()) {
      return NextResponse.json({ error: "Ce créneau est dans le passé" }, { status: 400 })
    }

    // Vérifier qu'il n'y a pas déjà une visite programmée pour cette candidature
    const { data: existingVisit, error: visitCheckError } = await supabase
      .from("visits")
      .select("id")
      .eq("application_id", applicationId)
      .eq("status", "scheduled")
      .single()

    if (existingVisit) {
      return NextResponse.json({ error: "Une visite est déjà programmée pour cette candidature" }, { status: 400 })
    }

    // Créer la visite
    const visitDate = new Date(`${slot.date}T${slot.start_time}`)
    const tenant = application.tenant

    const { data: visit, error: visitError } = await supabase
      .from("visits")
      .insert({
        application_id: applicationId,
        property_id: application.property_id,
        tenant_id: application.tenant_id,
        visit_date: visitDate.toISOString(),
        start_time: slot.start_time,
        end_time: slot.end_time,
        status: "scheduled",
        visitor_name: `${tenant.first_name} ${tenant.last_name}`,
        visitor_email: tenant.email,
        visitor_phone: tenant.phone,
        notes: `Visite programmée via le créneau ${slot_id}`,
      })
      .select()
      .single()

    if (visitError) {
      console.error("❌ Erreur création visite:", visitError)
      return NextResponse.json({ error: "Erreur lors de la création de la visite" }, { status: 500 })
    }

    // Incrémenter le nombre de réservations du créneau
    const { error: updateSlotError } = await supabase
      .from("property_visit_slots")
      .update({
        current_bookings: slot.current_bookings + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", slot_id)

    if (updateSlotError) {
      console.error("❌ Erreur mise à jour créneau:", updateSlotError)
      // Ne pas faire échouer la requête, juste logger l'erreur
    }

    // Mettre à jour le statut de la candidature
    const { error: updateAppError } = await supabase
      .from("applications")
      .update({
        status: "visit_scheduled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId)

    if (updateAppError) {
      console.error("❌ Erreur mise à jour candidature:", updateAppError)
      return NextResponse.json({ error: "Erreur lors de la mise à jour de la candidature" }, { status: 500 })
    }

    console.log("✅ Visite programmée avec succès:", visit.id)

    return NextResponse.json({
      success: true,
      message: "Créneau de visite confirmé avec succès !",
      visit: visit,
    })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
