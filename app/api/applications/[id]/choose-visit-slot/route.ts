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
      return NextResponse.json({ error: "ID du créneau requis" }, { status: 400 })
    }

    // Vérifier que l'application existe
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("id, property_id, tenant_id, status")
      .eq("id", applicationId)
      .single()

    if (appError || !application) {
      console.error("❌ Application non trouvée:", appError)
      return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
    }

    // Vérifier que le créneau existe et est disponible
    const { data: slot, error: slotError } = await supabase
      .from("visit_slots")
      .select("*")
      .eq("id", slot_id)
      .eq("application_id", applicationId)
      .eq("is_available", true)
      .single()

    if (slotError || !slot) {
      console.error("❌ Créneau non trouvé ou indisponible:", slotError)
      return NextResponse.json({ error: "Créneau non trouvé ou indisponible" }, { status: 404 })
    }

    // Créer une visite programmée
    const { data: visit, error: visitError } = await supabase
      .from("visits")
      .insert({
        tenant_id: application.tenant_id,
        property_id: application.property_id,
        application_id: applicationId,
        visit_slot_id: slot_id,
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        status: "scheduled",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (visitError) {
      console.error("❌ Erreur création visite:", visitError)
      return NextResponse.json({ error: "Erreur lors de la création de la visite" }, { status: 500 })
    }

    // Marquer le créneau comme réservé
    const { error: updateSlotError } = await supabase
      .from("visit_slots")
      .update({
        is_available: false,
        current_bookings: (slot.current_bookings || 0) + 1,
      })
      .eq("id", slot_id)

    if (updateSlotError) {
      console.error("❌ Erreur mise à jour créneau:", updateSlotError)
      // On continue même si la mise à jour du créneau échoue
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

    console.log("✅ Créneau sélectionné avec succès:", visit?.id)

    return NextResponse.json({
      success: true,
      message: "Créneau de visite sélectionné avec succès",
      visit: visit,
    })
  } catch (e) {
    console.error("❌ Erreur inattendue:", e)
    return NextResponse.json(
      {
        error: "Erreur inattendue",
        details: e instanceof Error ? e.message : "Erreur inconnue",
      },
      { status: 500 },
    )
  }
}
