import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { searchParams } = new URL(request.url)
    const ownerId = searchParams.get("ownerId")
    if (!ownerId) {
      return NextResponse.json({ error: "Owner ID requis" }, { status: 400 })
    }

    console.log("🔍 [OWNER INCIDENTS] Recherche incidents pour ownerId:", ownerId)

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

    const propertyIds = properties.map(p => p.id)

    // Incidents sur les propriétés
    const { data: propertyIncidents, error: propertyError } = await supabase
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

    if (propertyError) {
      console.error("❌ [OWNER INCIDENTS] Erreur incidents propriétés:", propertyError)
      return NextResponse.json({ error: "Erreur base de données" }, { status: 500 })
    }

    // Incidents via baux
    const { data: leaseIncidents, error: leaseError } = await supabase
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
        lease:leases!inner(
          id,
          owner_id,
          tenant_id
        ),
        reporter:users!incidents_reported_by_fkey(
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq("lease.owner_id", ownerId)
      .order("created_at", { ascending: false })

    if (leaseError) {
      console.error("❌ [OWNER INCIDENTS] Erreur incidents baux:", leaseError)
      return NextResponse.json({ error: "Erreur base de données" }, { status: 500 })
    }

    const allIncidents = [...(propertyIncidents || []), ...(leaseIncidents || [])]
    const uniqueIncidents = allIncidents.filter((incident, index, self) =>
      index === self.findIndex(i => i.id === incident.id)
    )

    console.log("🔍 [OWNER INCIDENTS] Incidents trouvés:", uniqueIncidents.length, uniqueIncidents)

    const incidentsWithDetails = await Promise.all(
      uniqueIncidents.map(async (incident) => {
        const { data: responses } = await supabase
          .from("incident_responses")
          .select("id, message, user_type, created_at")
          .eq("incident_id", incident.id)
          .order("created_at", { ascending: true })

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
      })
    )

    console.log("✅ [OWNER INCIDENTS] Retour de", incidentsWithDetails.length, "incidents")

    return NextResponse.json(
      { success: true, incidents: incidentsWithDetails },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (error) {
    console.error("Erreur GET /api/incidents/owner:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
