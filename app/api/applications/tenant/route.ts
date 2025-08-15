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

    // Récupérer les candidatures avec les informations de la propriété et les créneaux proposés
    const { data: applications, error } = await supabase
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

    if (error) {
      console.error("❌ Erreur récupération candidatures:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération des candidatures" }, { status: 500 })
    }

    // Pour chaque candidature avec statut "visit_proposed", récupérer les créneaux disponibles
    const applicationsWithSlots = await Promise.all(
      applications.map(async (app) => {
        if (app.status === "visit_proposed") {
          // Récupérer les créneaux disponibles pour cette propriété
          const { data: slots, error: slotsError } = await supabase
            .from("property_visit_slots")
            .select("*")
            .eq("property_id", app.property.id)
            .eq("is_available", true)
            .gte("date", new Date().toISOString().split("T")[0]) // Créneaux futurs seulement
            .order("date", { ascending: true })
            .order("start_time", { ascending: true })

          if (slotsError) {
            console.error("❌ Erreur récupération créneaux:", slotsError)
          }

          return {
            ...app,
            proposed_visit_slots: slots || [],
          }
        }
        return app
      }),
    )

    console.log("✅ Candidatures récupérées:", applicationsWithSlots.length)

    return NextResponse.json({
      success: true,
      applications: applicationsWithSlots,
    })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
