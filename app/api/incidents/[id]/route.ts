import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const incidentId = params.id

    // Récupérer l'incident avec toutes les informations liées
    const { data: incident, error } = await supabase
      .from("incidents")
      .select(`
        *,
        property:properties(
          id,
          title,
          address,
          city,
          postal_code,
          type,
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
      .eq("id", incidentId)
      .single()

    if (error) {
      console.error("Erreur récupération incident:", error)
      return NextResponse.json({ success: false, error: "Incident non trouvé" }, { status: 404 })
    }

    // Récupérer les réponses séparément pour éviter l'ambiguïté
    const { data: responses, error: responsesError } = await supabase
      .from("incident_responses")
      .select(`
        id,
        message,
        user_type,
        attachments,
        created_at,
        user_id,
        user:users!incident_responses_user_id_fkey(
          id,
          first_name,
          last_name
        )
      `)
      .eq("incident_id", incidentId)
      .order("created_at", { ascending: true })

    if (responsesError) {
      console.error("Erreur récupération réponses:", responsesError)
    }

    // Combiner les données
    const incidentWithResponses = {
      ...incident,
      responses: responses || [],
    }

    return NextResponse.json({
      success: true,
      incident: incidentWithResponses,
    })
  } catch (error) {
    console.error("Erreur API incident:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const incidentId = params.id
    const body = await request.json()
    const { status, resolution_notes, cost } = body

    const updateData: any = {}

    if (status) updateData.status = status
    if (resolution_notes) updateData.resolution_notes = resolution_notes
    if (cost !== undefined) updateData.cost = cost
    if (status === "resolved") updateData.resolved_date = new Date().toISOString()

    const { data, error } = await supabase.from("incidents").update(updateData).eq("id", incidentId).select().single()

    if (error) {
      console.error("Erreur mise à jour incident:", error)
      return NextResponse.json({ success: false, error: "Erreur lors de la mise à jour" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      incident: data,
    })
  } catch (error) {
    console.error("Erreur API mise à jour incident:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
