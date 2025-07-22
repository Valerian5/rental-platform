import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("🔍 API incidents/tenant/[id] - Récupération incidents locataire:", params.id)

    // Récupérer tous les incidents du locataire via ses baux
    const { data: incidents, error } = await supabase
      .from("incidents")
      .select(`
        *,
        lease:leases!inner(
          id,
          property:properties(id, title, address, city),
          tenant:users!tenant_id(id, first_name, last_name)
        )
      `)
      .eq("lease.tenant_id", params.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Erreur Supabase:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de la récupération des incidents",
        },
        { status: 500 },
      )
    }

    // Récupérer les réponses pour chaque incident
    const incidentsWithResponses = await Promise.all(
      (incidents || []).map(async (incident) => {
        const { data: responses } = await supabase
          .from("incident_responses")
          .select("*")
          .eq("incident_id", incident.id)
          .order("created_at", { ascending: true })

        return {
          ...incident,
          property: incident.lease.property,
          responses: responses || [],
        }
      }),
    )

    console.log("✅ Incidents récupérés avec succès:", incidentsWithResponses.length)

    return NextResponse.json({
      success: true,
      incidents: incidentsWithResponses,
    })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erreur interne du serveur",
      },
      { status: 500 },
    )
  }
}
