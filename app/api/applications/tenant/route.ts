import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Variables d'environnement Supabase manquantes")
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenant_id")

    if (!tenantId) {
      return NextResponse.json({ error: "ID du locataire requis" }, { status: 400 })
    }

    console.log("🔍 Récupération candidatures pour locataire:", tenantId)

    // Récupérer les candidatures avec les informations de la propriété
    const { data: applications, error: applicationsError } = await supabase
      .from("applications")
      .select(`
        id,
        status,
        created_at,
        updated_at,
        presentation,
        property:properties!inner (
          id,
          title,
          address,
          city,
          postal_code,
          price,
          bedrooms,
          bathrooms,
          surface,
          property_images (
            id,
            url,
            is_primary
          )
        )
      `)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })

    if (applicationsError) {
      console.error("❌ Erreur récupération candidatures:", applicationsError)
      return NextResponse.json({ error: "Erreur lors de la récupération des candidatures" }, { status: 500 })
    }

    console.log("✅ Candidatures récupérées:", applications?.length || 0)

    // Pour chaque candidature avec statut visit_proposed, récupérer les créneaux disponibles
    const applicationsWithSlots = await Promise.all(
      (applications || []).map(async (app) => {
        if (app.status === "visit_proposed") {
          // Récupérer les créneaux disponibles pour cette propriété
          const { data: visitSlots, error: slotsError } = await supabase
            .from("property_visit_slots")
            .select("*")
            .eq("property_id", app.property.id)
            .eq("is_available", true)
            .order("date", { ascending: true })
            .order("start_time", { ascending: true })

          if (!slotsError && visitSlots) {
            // Filtrer les créneaux futurs et avec des places disponibles
            const now = new Date()
            const futureAvailableSlots = visitSlots.filter((slot) => {
              const slotDateTime = new Date(`${slot.date}T${slot.start_time}`)
              return slotDateTime > now && slot.current_bookings < slot.max_capacity
            })

            return {
              ...app,
              proposed_visit_slots: futureAvailableSlots,
            }
          }
        }
        return app
      }),
    )

    return NextResponse.json({
      success: true,
      applications: applicationsWithSlots,
      total: applicationsWithSlots.length,
    })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
