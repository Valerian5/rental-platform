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
      return NextResponse.json({ error: "ID du locataire manquant" }, { status: 400 })
    }

    console.log("🔍 Récupération candidatures pour locataire:", tenantId)

    // Récupérer les candidatures du locataire (EXCLURE les candidatures retirées)
    const { data: applications, error: appsError } = await supabase
      .from("applications")
      .select(`
        id,
        property_id,
        status,
        created_at,
        updated_at,
        properties (
          id,
          title,
          address,
          price,
          property_type,
          bedrooms,
          bathrooms,
          surface_area,
          images
        )
      `)
      .eq("tenant_id", tenantId)
      .neq("status", "withdrawn") // CORRECTION: Exclure les candidatures retirées
      .order("created_at", { ascending: false })

    if (appsError) {
      console.error("❌ Erreur récupération candidatures:", appsError)
      return NextResponse.json({ error: "Erreur lors de la récupération des candidatures" }, { status: 500 })
    }

    console.log("✅ Candidatures récupérées:", applications?.length || 0)

    // Pour chaque candidature, récupérer les créneaux proposés si le statut est "visit_proposed"
    const applicationsWithSlots = await Promise.all(
      (applications || []).map(async (app) => {
        let proposedSlots = []

        if (app.status === "visit_proposed") {
          // Récupérer les créneaux disponibles pour cette propriété
          const { data: slots, error: slotsError } = await supabase
            .from("property_visit_slots")
            .select("*")
            .eq("property_id", app.property_id)
            .eq("is_available", true)
            .gte("date", new Date().toISOString().split("T")[0]) // Seulement les créneaux futurs
            .order("date", { ascending: true })
            .order("start_time", { ascending: true })

          if (!slotsError && slots) {
            // Filtrer les créneaux avec des places disponibles
            proposedSlots = slots.filter((slot) => slot.current_bookings < slot.max_capacity)
          }
        }

        // Si le statut est "visit_scheduled", récupérer les détails de la visite
        let scheduledVisit = null
        if (app.status === "visit_scheduled") {
          const { data: visit, error: visitError } = await supabase
            .from("visits")
            .select("*")
            .eq("application_id", app.id)
            .single()

          if (!visitError && visit) {
            scheduledVisit = visit
          }
        }

        return {
          ...app,
          proposed_slots: proposedSlots,
          scheduled_visit: scheduledVisit,
        }
      }),
    )

    return NextResponse.json({
      success: true,
      applications: applicationsWithSlots,
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
