import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Variables d'environnement Supabase manquantes")
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const dynamic = "force-dynamic"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const applicationId = params.id

    console.log("🔍 Récupération créneaux pour candidature:", applicationId)

    // Récupérer l'application pour obtenir l'ID de la propriété
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("id, property_id, status")
      .eq("id", applicationId)
      .single()

    if (appError || !application) {
      console.error("❌ Application non trouvée:", appError)
      return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
    }

    if (application.status !== "visit_proposed") {
      return NextResponse.json({ error: "Aucun créneau de visite proposé pour cette candidature" }, { status: 400 })
    }

    // Récupérer les créneaux disponibles pour cette propriété
    const today = new Date().toISOString().split("T")[0]

    const { data: slots, error: slotsError } = await supabase
      .from("property_visit_slots")
      .select("*")
      .eq("property_id", application.property_id)
      .eq("is_available", true)
      .gte("date", today) // Créneaux futurs seulement
      .order("date", { ascending: true })
      .order("start_time", { ascending: true })

    if (slotsError) {
      console.error("❌ Erreur récupération créneaux:", slotsError)
      return NextResponse.json({ error: "Erreur lors de la récupération des créneaux" }, { status: 500 })
    }

    // Filtrer les créneaux avec des places disponibles
    const availableSlots = (slots || []).filter((slot) => slot.current_bookings < slot.max_capacity)

    console.log("✅ Créneaux disponibles:", availableSlots.length)

    return NextResponse.json({
      success: true,
      slots: availableSlots,
    })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
