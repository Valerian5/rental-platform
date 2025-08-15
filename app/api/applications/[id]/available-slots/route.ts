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
  const applicationId = params.id

  try {
    console.log("🔍 Recherche créneaux disponibles pour candidature:", applicationId)

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

    // Récupérer les créneaux disponibles pour cette propriété
    const { data: availableSlots, error: slotsError } = await supabase
      .from("property_visit_slots")
      .select("*")
      .eq("property_id", application.property_id)
      .eq("is_available", true)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true })

    if (slotsError) {
      console.error("❌ Erreur récupération créneaux:", slotsError)
      return NextResponse.json({ error: "Erreur lors de la récupération des créneaux" }, { status: 500 })
    }

    // Filtrer les créneaux futurs et avec des places disponibles
    const now = new Date()
    const futureAvailableSlots = (availableSlots || []).filter((slot) => {
      const slotDateTime = new Date(`${slot.date}T${slot.start_time}`)
      return slotDateTime > now && slot.current_bookings < slot.max_capacity
    })

    console.log("✅ Créneaux disponibles trouvés:", {
      total: availableSlots?.length || 0,
      futureAvailable: futureAvailableSlots.length,
    })

    return NextResponse.json({
      success: true,
      slots: futureAvailableSlots,
      total: futureAvailableSlots.length,
      application: {
        id: application.id,
        status: application.status,
        property_id: application.property_id,
      },
    })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
