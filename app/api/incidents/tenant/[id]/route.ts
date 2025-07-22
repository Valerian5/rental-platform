import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tenantId = params.id

    // Récupérer tous les incidents du locataire avec les informations des propriétés
    const { data: incidents, error } = await supabase
      .from("incidents")
      .select(`
        *,
        property:properties(
          id,
          title,
          address,
          city,
          postal_code
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
        ),
        responses:incident_responses(
          id,
          message,
          user_type,
          attachments,
          created_at,
          user:users(
            id,
            first_name,
            last_name
          )
        )
      `)
      .eq("reported_by", tenantId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erreur récupération incidents:", error)
      return NextResponse.json(
        { success: false, error: "Erreur lors de la récupération des incidents" },
        { status: 500 },
      )
    }

    // Trier les réponses par date
    const incidentsWithSortedResponses =
      incidents?.map((incident) => ({
        ...incident,
        responses:
          incident.responses?.sort(
            (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
          ) || [],
      })) || []

    return NextResponse.json({
      success: true,
      incidents: incidentsWithSortedResponses,
    })
  } catch (error) {
    console.error("Erreur API incidents tenant:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
