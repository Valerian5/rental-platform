import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// GET /api/incidents/tenant?tenantId=... ou /api/incidents/tenant/[tenantId]
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { searchParams, pathname } = new URL(request.url)
    
    // Extraire tenantId depuis query param ou pathname
    let tenantId = searchParams.get("tenantId")
    if (!tenantId) {
      // Essayer d'extraire depuis le pathname /api/incidents/tenant/[tenantId]
      const pathParts = pathname.split('/')
      tenantId = pathParts[pathParts.length - 1]
    }

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID requis" }, { status: 400 })
    }

    console.log("🔍 [TENANT INCIDENTS] Recherche incidents pour tenantId:", tenantId)

    // Aligner avec paiements: inclure (a) incidents reportés par le tenant OU (b) incidents liés à un bail où il est tenant
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
        lease:leases!inner(
          id,
          tenant_id,
          owner_id
        )
      `)
      .or(`reported_by.eq.${tenantId},leases.tenant_id.eq.${tenantId}`)
      .order("created_at", { ascending: false })

    console.log("🔍 [TENANT INCIDENTS] Incidents trouvés:", incidents?.length || 0, incidents)

    if (error) {
      console.error("❌ [TENANT INCIDENTS] Erreur récupération incidents:", error)
      return NextResponse.json({ error: "Erreur base de données" }, { status: 500 })
    }

    // Pour chaque incident, récupérer les réponses
    const incidentsWithResponses = await Promise.all(
      (incidents || []).map(async (incident) => {
        const { data: responses } = await supabase
          .from("incident_responses")
          .select("id, message, user_type, created_at")
          .eq("incident_id", incident.id)
          .order("created_at", { ascending: true })

        return {
          ...incident,
          responses: responses || [],
        }
      }),
    )

    console.log("✅ [TENANT INCIDENTS] Retour de", incidentsWithResponses?.length || 0, "incidents avec réponses")

    return NextResponse.json({ 
      success: true, 
      incidents: incidentsWithResponses || [] 
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error("Erreur GET /api/incidents/tenant:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}


