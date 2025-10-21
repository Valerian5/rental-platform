import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Pour forcer non cache
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { searchParams, pathname } = new URL(request.url)

    let tenantId = searchParams.get("tenantId")
    if (!tenantId) {
      const pathParts = pathname.split('/')
      tenantId = pathParts[pathParts.length - 1]
    }
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID requis" }, { status: 400 })
    }

    console.log("🔍 [TENANT INCIDENTS] Recherche incidents pour tenantId:", tenantId)

    // 1. incidents reportés par le tenant
    const { data: reportedIncidents, error: reportedError } = await supabase
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
        )
      `)
      .eq("reported_by", tenantId)
      .order("created_at", { ascending: false })

    if (reportedError) {
      console.error("❌ [TENANT INCIDENTS] Erreur incidents reportés:", reportedError)
      return NextResponse.json({ error: "Erreur base de données" }, { status: 500 })
    }

    // 2. incidents liés aux baux
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
          tenant_id,
          owner_id
        )
      `)
      .eq("lease.tenant_id", tenantId)
      .order("created_at", { ascending: false })

    if (leaseError) {
      console.error("❌ [TENANT INCIDENTS] Erreur incidents baux:", leaseError)
      return NextResponse.json({ error: "Erreur base de données" }, { status: 500 })
    }

    const allIncidents = [...(reportedIncidents || []), ...(leaseIncidents || [])]
    const uniqueIncidents = allIncidents.filter((incident, index, self) =>
      index === self.findIndex(i => i.id === incident.id)
    )

    console.log("🔍 [TENANT INCIDENTS] Incidents trouvés:", uniqueIncidents.length, uniqueIncidents)

    const incidentsWithResponses = await Promise.all(
      uniqueIncidents.map(async (incident) => {
        const { data: responses } = await supabase
          .from("incident_responses")
          .select("id, message, user_type, created_at")
          .eq("incident_id", incident.id)
          .order("created_at", { ascending: true })

        return {
          ...incident,
          responses: responses || [],
        }
      })
    )

    console.log("✅ [TENANT INCIDENTS] Retour de", incidentsWithResponses.length, "incidents avec réponses")

    return NextResponse.json(
      {
        success: true,
        incidents: incidentsWithResponses,
      },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (error) {
    console.error("Erreur GET /api/incidents/tenant:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
