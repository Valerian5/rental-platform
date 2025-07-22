import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tenantId = params.id

    // D'abord, récupérer les baux du locataire pour obtenir les property_ids
    const { data: leases, error: leasesError } = await supabase
      .from("leases")
      .select("id, property_id, property:properties(id, title, address, city)")
      .eq("tenant_id", tenantId)

    if (leasesError) {
      console.error("Erreur récupération baux:", leasesError)
      return NextResponse.json({ success: false, error: "Erreur lors du chargement des baux" }, { status: 500 })
    }

    if (!leases || leases.length === 0) {
      return NextResponse.json({ success: true, incidents: [] })
    }

    // Récupérer tous les incidents du locataire
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
        )
      `)
      .eq("reported_by", tenantId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erreur récupération incidents locataire:", error)
      return NextResponse.json({ success: false, error: "Erreur lors du chargement" }, { status: 500 })
    }

    // Pour chaque incident, récupérer le nombre de réponses
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

    return NextResponse.json({
      success: true,
      incidents: incidentsWithResponses,
    })
  } catch (error) {
    console.error("Erreur API incidents locataire:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
