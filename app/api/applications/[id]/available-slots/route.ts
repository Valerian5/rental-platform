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
    console.log("🔍 Récupération des créneaux disponibles pour candidature:", applicationId)

    // Récupérer la candidature et la propriété associée
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select(`
        id,
        property_id,
        status,
        properties (
          id,
          title,
          address
        )
      `)
      .eq("id", applicationId)
      .single()

    if (appError || !application) {
      console.error("❌ Candidature non trouvée:", appError)
      return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
    }

    console.log("✅ Candidature trouvée:", application.id, "pour propriété:", application.property_id)

    // Récupérer tous les créneaux de visite pour cette propriété
    const { data: allSlots, error: slotsError } = await supabase
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

    console.log("📅 Créneaux récupérés:", allSlots?.length || 0)

    // Filtrer les créneaux disponibles (futurs et avec places disponibles)
    const now = new Date()
    const today = now.toISOString().split("T")[0] // Format YYYY-MM-DD

    const availableSlots = (allSlots || []).filter((slot) => {
      // Vérifier que la date est future ou aujourd'hui
      const slotDate = slot.date
      if (slotDate < today) {
        return false
      }

      // Si c'est aujourd'hui, vérifier que l'heure n'est pas passée
      if (slotDate === today) {
        const slotDateTime = new Date(`${slot.date}T${slot.start_time}`)
        if (slotDateTime <= now) {
          return false
        }
      }

      // Vérifier qu'il y a des places disponibles
      // CORRECTION: Utiliser une comparaison JavaScript au lieu de .raw()
      return slot.current_bookings < slot.max_capacity
    })

    console.log("✅ Créneaux disponibles filtrés:", availableSlots.length)

    // Formater les créneaux pour l'affichage
    const formattedSlots = availableSlots.map((slot) => ({
      id: slot.id,
      date: slot.date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      max_capacity: slot.max_capacity,
      current_bookings: slot.current_bookings,
      is_group_visit: slot.is_group_visit,
      available_spots: slot.max_capacity - slot.current_bookings,
    }))

    return NextResponse.json({
      success: true,
      application: {
        id: application.id,
        property_id: application.property_id,
        status: application.status,
        property: application.properties,
      },
      slots: formattedSlots,
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
