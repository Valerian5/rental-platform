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
    const body = await request.json()
    const { slot_id } = body

    if (!slot_id) {
      return NextResponse.json({ error: "ID du créneau requis" }, { status: 400 })
    }

    console.log("🎯 Sélection créneau:", { applicationId, slot_id })

    // Vérifier que l'application existe
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("id, property_id, tenant_id")
      .eq("id", applicationId)
      .single()

    if (appError || !application) {
      console.error("❌ Application non trouvée:", appError)
      return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
    }

    // Vérifier que le créneau existe et est disponible
    const { data: slot, error: slotError } = await supabase
      .from("property_visit_slots")
      .select("*")
      .eq("id", slot_id)
      .eq("property_id", application.property_id)
      .eq("is_available", true)
      .single()

    if (slotError || !slot) {
      console.error("❌ Créneau non trouvé ou indisponible:", slotError)
      return NextResponse.json({ error: "Créneau non trouvé ou indisponible" }, { status: 404 })
    }

    // Vérifier que le créneau est dans le futur
    const slotDateTime = new Date(`${slot.date}T${slot.start_time}`)
    if (slotDateTime <= new Date()) {
      return NextResponse.json({ error: "Ce créneau est déjà passé" }, { status: 400 })
    }

    // Incrémenter le nombre de réservations pour ce créneau
    const { error: updateSlotError } = await supabase
      .from("property_visit_slots")
      .update({
        current_bookings: slot.current_bookings + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", slot_id)

    if (updateSlotError) {
      console.error("❌ Erreur mise à jour créneau:", updateSlotError)
      return NextResponse.json({ error: "Erreur lors de la mise à jour du créneau" }, { status: 500 })
    }

    // Récupérer les informations du locataire pour la visite
    const { data: tenant, error: tenantError } = await supabase
      .from("users")
      .select("first_name, last_name, email, phone")
      .eq("id", application.tenant_id)
      .single()

    if (tenantError) {
      console.error("❌ Erreur récupération locataire:", tenantError)
    }

    // Créer une visite programmée
    const { data: visit, error: visitError } = await supabase
      .from("visits")
      .insert({
        application_id: applicationId,
        property_id: application.property_id,
        tenant_id: application.tenant_id,
        visit_date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        status: "scheduled",
        visitor_name: tenant ? `${tenant.first_name} ${tenant.last_name}` : "Candidat",
        visitor_email: tenant?.email || "candidat@example.com",
        visitor_phone: tenant?.phone || "0000000000",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (visitError) {
      console.error("❌ Erreur création visite:", visitError)
      return NextResponse.json({ error: "Erreur lors de la création de la visite" }, { status: 500 })
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

    console.log("✅ Visite programmée avec succès:", visit?.id)

    return NextResponse.json({
      success: true,
      message: "Créneau sélectionné et visite programmée avec succès",
      visit,
    })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
