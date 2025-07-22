import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("🔍 API incidents/[id] - Récupération incident:", params.id)

    // Récupérer l'incident avec les informations du bail, propriété et propriétaire
    const { data: incident, error } = await supabase
      .from("incidents")
      .select(`
        *,
        lease:leases!inner(
          id,
          property:properties(id, title, address, city),
          owner:users!owner_id(id, first_name, last_name, email, phone)
        )
      `)
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("❌ Erreur Supabase:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Incident non trouvé",
        },
        { status: 404 },
      )
    }

    // Récupérer les réponses
    const { data: responses } = await supabase
      .from("incident_responses")
      .select("*")
      .eq("incident_id", params.id)
      .order("created_at", { ascending: true })

    const incidentWithDetails = {
      ...incident,
      property: incident.lease.property,
      owner: incident.lease.owner,
      responses: responses || [],
    }

    console.log("✅ Incident récupéré avec succès")

    return NextResponse.json({
      success: true,
      incident: incidentWithDetails,
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
