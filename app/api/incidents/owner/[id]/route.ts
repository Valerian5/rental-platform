import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ownerId = params.id

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
        lease:leases(
          id,
          tenant:users!leases_tenant_id_fkey(
            id,
            first_name,
            last_name,
            email,
            phone
          ),
          owner:users!leases_owner_id_fkey(
            id,
            first_name,
            last_name,
            email,
            phone
          )
        )
      `)
      .eq("lease.owner_id", ownerId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erreur récupération incidents propriétaire:", error)
      return NextResponse.json({ success: false, error: "Erreur lors du chargement" }, { status: 500 })
    }

    // Pour chaque incident, récupérer le nombre de réponses
    const incidentsWithResponses = await Promise.all(
      incidents.map(async (incident) => {
        const { data: responses } = await supabase
          .from("incident_responses")
          .select("id")
          .eq("incident_id", incident.id)

        return {
          ...incident,
          responses: responses || [],
        }
      }),
    )

    return NextResponse.json({
      success: true,
      incidents: incidentsWithResponses,
    })
  } catch (error) {
    console.error("Erreur API incidents propriétaire:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
