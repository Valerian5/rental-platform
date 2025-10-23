import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    // Récupérer le token d'authentification depuis les headers
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: "Token d'authentification manquant" }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    
    // Créer un client Supabase avec service_role pour les opérations backend
    const supabase = createServerClient()
    
    // Vérifier l'authentification utilisateur avec le token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Token invalide" }, { status: 401 })
    }

    console.log("🔍 Récupération candidatures pour locataire:", user.id)

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
      .eq("tenant_id", user.id)
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
