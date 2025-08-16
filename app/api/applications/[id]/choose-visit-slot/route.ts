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
  const applicationId = params.id

  try {
    const body = await request.json()
    const { slot_id } = body

    console.log("🎯 Sélection créneau:", { applicationId, slot_id })

    if (!slot_id) {
      return NextResponse.json({ error: "ID du créneau manquant" }, { status: 400 })
    }

    // Récupérer la candidature
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select(`
        id,
        tenant_id,
        property_id,
        status,
        users!applications_tenant_id_fkey (
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
      console.error("❌ Candidature non trouvée:", appError)
      return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
    }

    // Vérifier que la candidature est dans le bon statut
    if (application.status !== "visit_proposed") {
      console.error("❌ Statut candidature invalide:", application.status)
      return NextResponse.json({ error: "Cette candidature ne permet pas de sélectionner un créneau" }, { status: 400 })
    }

    // Récupérer et vérifier le créneau
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

    // Vérifications de disponibilité
    const now = new Date()
    const slotDateTime = new Date(`${slot.date}T${slot.start_time}`)

    if (slotDateTime <= now) {
      return NextResponse.json({ error: "Ce créneau est dans le passé" }, { status: 400 })
    }

    if (!slot.is_available) {
      return NextResponse.json({ error: "Ce créneau n'est plus disponible" }, { status: 400 })
    }

    if (slot.current_bookings >= slot.max_capacity) {
      return NextResponse.json({ error: "Ce créneau est complet" }, { status: 400 })
    }

    // Vérifier qu'il n'y a pas déjà une visite programmée pour cette candidature
    const { data: existingVisit, error: visitCheckError } = await supabase
      .from("visits")
      .select("id")
      .eq("application_id", applicationId)
      .single()

    if (existingVisit) {
      return NextResponse.json({ error: "Une visite est déjà programmée pour cette candidature" }, { status: 400 })
    }

    // Créer la visite avec les bonnes colonnes selon la structure de la table
    const visitDate = new Date(`${slot.date}T${slot.start_time}`)

    const { data: visit, error: visitError } = await supabase
      .from("visits")
      .insert({
        application_id: applicationId,
        property_id: application.property_id,
        tenant_id: application.tenant_id,
        visit_date: visitDate.toISOString(), // timestamp with time zone
        start_time: slot.start_time, // time without time zone
        end_time: slot.end_time, // time without time zone
        status: "scheduled",
        visitor_name: `${application.users.first_name} ${application.users.last_name}`,
        tenant_email: application.users.email,
        visitor_phone: application.users.phone,
        notes: `Créneau sélectionné: ${slot.id}`, // IMPORTANT: Stocker l'ID du créneau pour pouvoir le libérer plus tard
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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
      // Supprimer la visite créée en cas d'erreur
      await supabase.from("visits").delete().eq("id", visit.id)
      return NextResponse.json({ error: "Erreur lors de la réservation du créneau" }, { status: 500 })
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
      message: "Créneau de visite sélectionné avec succès",
      visit: {
        id: visit.id,
        date: slot.date,
        start_time: visit.start_time,
        end_time: visit.end_time,
        status: visit.status,
      },
    })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json(
      {
        error: "Erreur serveur",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    )
  }
}

