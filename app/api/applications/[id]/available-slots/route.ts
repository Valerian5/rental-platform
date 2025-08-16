import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const applicationId = params.id
    console.log("🔍 Récupération créneaux pour candidature:", applicationId)

    // 1. Récupérer les informations de la candidature
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select(`
        id,
        status,
        property_id,
        tenant_id,
        properties (
          id,
          title,
          address,
          city,
          postal_code,
          owner_id
        )
      `)
      .eq("id", applicationId)
      .single()

    if (appError) {
      console.error("❌ Erreur récupération candidature:", appError)
      return NextResponse.json({ success: false, error: "Candidature non trouvée" }, { status: 404 })
    }

    if (!application) {
      return NextResponse.json({ success: false, error: "Candidature non trouvée" }, { status: 404 })
    }

    console.log("✅ Candidature trouvée:", {
      id: application.id,
      status: application.status,
      property_id: application.property_id,
    })

    // 2. Récupérer les créneaux de visite disponibles pour cette propriété
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
      return NextResponse.json(
        { success: false, error: "Erreur lors de la récupération des créneaux" },
        { status: 500 },
      )
    }

    console.log("✅ Créneaux bruts récupérés:", slots?.length || 0)

    // 3. Filtrer les créneaux qui ont encore de la place
    const availableSlots = (slots || []).filter((slot) => {
      const hasCapacity = slot.current_bookings < slot.max_capacity
      console.log(`🔍 Créneau ${slot.id}: ${slot.current_bookings}/${slot.max_capacity} - Disponible: ${hasCapacity}`)
      return hasCapacity
    })

    console.log("✅ Créneaux disponibles après filtrage:", availableSlots.length)

    // 4. Formater les créneaux pour l'affichage
    const formattedSlots = availableSlots.map((slot) => ({
      id: slot.id,
      date: slot.date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_available: slot.is_available,
      max_capacity: slot.max_capacity,
      current_bookings: slot.current_bookings,
      available_spots: slot.max_capacity - slot.current_bookings,
    }))

    console.log("✅ Créneaux formatés:", formattedSlots.length)
    console.log("🔍 Premier créneau:", formattedSlots[0])

    return NextResponse.json({
      success: true,
      application: {
        id: application.id,
        status: application.status,
        property: application.properties,
      },
      slots: formattedSlots,
    })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur interne" }, { status: 500 })
  }
}
