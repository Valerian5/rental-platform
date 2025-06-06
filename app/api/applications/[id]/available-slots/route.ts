import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const applicationId = params.id

    console.log("🔍 Récupération créneaux disponibles pour candidature:", applicationId)

    // Vérifier que la candidature existe et est au bon statut
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select(`
        id,
        status,
        property_id,
        property:properties (
          id,
          title,
          address,
          city,
          price,
          property_images (id, url, is_primary),
          owner:users!properties_owner_id_fkey (first_name, last_name)
        )
      `)
      .eq("id", applicationId)
      .single()

    if (appError || !application) {
      console.error("❌ Candidature introuvable:", appError)
      return NextResponse.json({ error: "Candidature introuvable" }, { status: 404 })
    }

    if (application.status !== "visit_proposed") {
      console.error("❌ Statut incorrect:", application.status)
      return NextResponse.json(
        { error: "Cette candidature n'est pas au stade de sélection de créneaux" },
        { status: 400 },
      )
    }

    // Récupérer les créneaux de visite pour cette propriété
    const { data: slots, error: slotsError } = await supabase
      .from("property_visit_slots")
      .select("*")
      .eq("property_id", application.property_id)
      .eq("is_available", true)
      .gte("date", new Date().toISOString().split("T")[0]) // Seulement les dates futures
      .order("date", { ascending: true })
      .order("start_time", { ascending: true })

    if (slotsError) {
      console.error("❌ Erreur récupération créneaux:", slotsError)
      return NextResponse.json({ error: "Erreur lors de la récupération des créneaux" }, { status: 500 })
    }

    // Filtrer les créneaux qui ont encore de la place
    const availableSlots = (slots || []).filter((slot) => slot.current_bookings < slot.max_capacity)

    console.log("✅ Créneaux disponibles trouvés:", availableSlots.length)

    return NextResponse.json({
      application,
      slots: availableSlots,
    })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
