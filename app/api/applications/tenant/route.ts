import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenant_id")

    if (!tenantId) {
      return NextResponse.json({ success: false, error: "ID locataire requis" }, { status: 400 })
    }

    console.log("🔍 Chargement candidatures pour locataire:", tenantId)

    // Récupérer toutes les candidatures du locataire avec les détails de la propriété
    const { data: applications, error } = await supabase
      .from("applications")
      .select(`
        id,
        status,
        created_at,
        updated_at,
        presentation,
        tenant_id,
        property_id,
        users!applications_tenant_id_fkey (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        properties (
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
      .neq("status", "withdrawn") // Exclure les candidatures retirées
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Erreur récupération candidatures:", error)
      return NextResponse.json(
        { success: false, error: "Erreur lors de la récupération des candidatures" },
        { status: 500 },
      )
    }

    console.log("✅ Applications brutes:", applications?.length || 0)

    if (!applications || applications.length === 0) {
      return NextResponse.json({
        success: true,
        applications: [],
      })
    }

    // Formater les données pour le frontend
    const formattedApplications = await Promise.all(
      applications.map(async (app) => {
        let proposedVisitSlots = []

        // Si la candidature a le statut "visit_proposed", charger les créneaux proposés
        if (app.status === "visit_proposed") {
          const { data: slots } = await supabase
            .from("property_visit_slots")
            .select("*")
            .eq("property_id", app.property_id)
            .eq("is_available", true)
            .gte("date", new Date().toISOString().split("T")[0])
            .order("date", { ascending: true })
            .order("start_time", { ascending: true })

          proposedVisitSlots = slots || []
        }

        return {
          id: app.id,
          status: app.status,
          created_at: app.created_at,
          updated_at: app.updated_at,
          presentation: app.presentation,
          tenant: {
            id: app.users.id,
            first_name: app.users.first_name,
            last_name: app.users.last_name,
            email: app.users.email,
            phone: app.users.phone,
          },
          property: {
            id: app.properties.id,
            title: app.properties.title,
            address: app.properties.address,
            city: app.properties.city,
            postal_code: app.properties.postal_code,
            price: app.properties.price,
            bedrooms: app.properties.bedrooms,
            bathrooms: app.properties.bathrooms,
            surface: app.properties.surface,
            property_images: app.properties.property_images || [],
          },
          proposed_visit_slots: proposedVisitSlots,
        }
      }),
    )

    console.log("✅ Candidatures locataire formatées:", formattedApplications.length)
    console.log("🔍 Première candidature formatée:", formattedApplications[0])

    return NextResponse.json({
      success: true,
      applications: formattedApplications,
    })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur interne" }, { status: 500 })
  }
}
