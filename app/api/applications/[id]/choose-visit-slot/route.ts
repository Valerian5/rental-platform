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

    // Marquer les autres créneaux comme indisponibles
    const { error: updateOthersError } = await supabase
      .from("visit_slots")
      .update({ is_available: false })
      .eq("application_id", applicationId)
      .neq("id", slot_id)

    if (updateOthersError) {
      console.error("❌ Erreur mise à jour autres créneaux:", updateOthersError)
    }

    // Créer une visite confirmée
    const { data: visit, error: visitError } = await supabase
      .from("visits")
      .insert({
        property_id: application.property_id,
        tenant_id: application.tenant_id,
        application_id: applicationId,
        visit_date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        status: "scheduled",
        visitor_name: "Locataire", // À améliorer avec les vraies données
        visitor_email: "tenant@example.com", // À améliorer
        visitor_phone: "0000000000", // À améliorer
        created_at: new Date().toISOString(),
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

    console.log("✅ Créneau sélectionné avec succès:", visit)

    return NextResponse.json({
      success: true,
      message: "Créneau sélectionné avec succès",
      visit,
    })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
