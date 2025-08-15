import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Variables d'environnement Supabase manquantes")
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenant_id")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    if (!tenantId) {
      return NextResponse.json({ error: "ID du locataire requis" }, { status: 400 })
    }

    console.log("🔍 Recherche candidatures pour locataire:", tenantId)

    // Récupérer les candidatures du locataire avec price au lieu de rent
    const { data: applications, error } = await supabase
      .from("applications")
      .select(`
        *,
        property:properties(
          id,
          title,
          address,
          city,
          postal_code,
          price,
          bedrooms,
          bathrooms,
          surface,
          property_images(
            id,
            url,
            is_primary
          )
        )
      `)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("❌ Erreur récupération candidatures:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Pour chaque candidature, récupérer les créneaux de visite associés
    const enrichedApplications = await Promise.all(
      (applications || []).map(async (app) => {
        try {
          // Récupérer les créneaux de visite proposés pour cette propriété
          const { data: visitSlots } = await supabase
            .from("property_visit_slots")
            .select("*")
            .eq("property_id", app.property.id)
            .eq("is_available", true)
            .order("date", { ascending: true })
            .order("start_time", { ascending: true })

          // Récupérer les visites programmées pour cette candidature
          const { data: visits } = await supabase.from("visits").select("*").eq("application_id", app.id)

          return {
            ...app,
            visit_slots: visitSlots || [],
            proposed_visit_slots:
              visitSlots?.filter((slot) => {
                // Filtrer les créneaux futurs et disponibles
                const slotDateTime = new Date(`${slot.date}T${slot.start_time}`)
                return slotDateTime > new Date() && slot.current_bookings < slot.max_capacity
              }) || [],
            visits: visits || [],
          }
        } catch (error) {
          console.error("❌ Erreur enrichissement candidature:", error)
          return {
            ...app,
            visit_slots: [],
            proposed_visit_slots: [],
            visits: [],
          }
        }
      }),
    )

    console.log("✅ Candidatures récupérées:", enrichedApplications.length)

    return NextResponse.json({
      success: true,
      applications: enrichedApplications,
      total: enrichedApplications.length,
    })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
