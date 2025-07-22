import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ownerId = params.id

    // D'abord, récupérer les propriétés du propriétaire
    const { data: properties, error: propertiesError } = await supabase
      .from("properties")
      .select("id, title, address, city")
      .eq("owner_id", ownerId)

    if (propertiesError) {
      console.error("Erreur récupération propriétés:", propertiesError)
      return NextResponse.json({ success: false, error: "Erreur lors du chargement des propriétés" }, { status: 500 })
    }

    if (!properties || properties.length === 0) {
      return NextResponse.json({ success: true, incidents: [] })
    }

    const propertyIds = properties.map((p) => p.id)

    // Récupérer tous les incidents des propriétés du propriétaire
    const { data: incidents, error } = await supabase
      .from("incidents")
      .select(`
        *,
        property:properties(
          id,
          title,
          address,
          city,
          postal_code,
          property_type,
          surface
        ),
        reporter:users!incidents_reported_by_fkey(
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .in("property_id", propertyIds)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erreur récupération incidents propriétaire:", error)
      return NextResponse.json({ success: false, error: "Erreur lors du chargement" }, { status: 500 })
    }

    // Pour chaque incident, récupérer les réponses et les informations du bail
    const incidentsWithDetails = await Promise.all(
      (incidents || []).map(async (incident) => {
        // Récupérer les réponses
        const { data: responses } = await supabase
          .from("incident_responses")
          .select("id, message, user_type, created_at")
          .eq("incident_id", incident.id)
          .order("created_at", { ascending: true })

        // Récupérer les informations du bail si disponible
        let lease = null
        if (incident.lease_id) {
          const { data: leaseData } = await supabase
            .from("leases")
            .select(`
              id,
              tenant:users!leases_tenant_id_fkey(
                id,
                first_name,
                last_name,
                email,
                phone
              )
            `)
            .eq("id", incident.lease_id)
            .single()

          lease = leaseData
        }

        return {
          ...incident,
          responses: responses || [],
          lease: lease,
        }
      }),
    )

    return NextResponse.json({
      success: true,
      incidents: incidentsWithDetails,
    })
  } catch (error) {
    console.error("Erreur API incidents propriétaire:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
