import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenant_id")
    const ownerId = searchParams.get("owner_id")

    console.log("📋 API Applications GET", { tenantId, ownerId })

    if (tenantId) {
      // Récupérer les candidatures pour un locataire
      const { data: applications, error } = await supabase
        .from("applications")
        .select(`
          *,
          property:properties(*),
          visits(*)
        `)
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Erreur récupération candidatures locataire:", error)
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      // Pour chaque candidature avec des créneaux proposés, récupérer les détails
      const enrichedApplications = await Promise.all(
        applications.map(async (app) => {
          if (app.proposed_slot_ids && app.proposed_slot_ids.length > 0) {
            const { data: proposedSlots } = await supabase
              .from("property_visit_slots")
              .select("*")
              .in("id", app.proposed_slot_ids)
              .order("date", { ascending: true })

            return {
              ...app,
              proposed_visit_slots: proposedSlots || [],
            }
          }
          return app
        }),
      )

      console.log(`✅ ${enrichedApplications.length} candidatures récupérées pour le locataire`)
      return NextResponse.json({ applications: enrichedApplications })
    }

    if (ownerId) {
      // Récupérer les candidatures pour un propriétaire
      const { data: properties, error: propError } = await supabase
        .from("properties")
        .select("id")
        .eq("owner_id", ownerId)

      if (propError) {
        console.error("❌ Erreur récupération propriétés:", propError)
        return NextResponse.json({ error: propError.message }, { status: 400 })
      }

      if (!properties || properties.length === 0) {
        return NextResponse.json({ applications: [] })
      }

      const propertyIds = properties.map((p) => p.id)

      const { data: applications, error } = await supabase
        .from("applications")
        .select(`
          *,
          property:properties(*),
          tenant:users(*),
          visits(*)
        `)
        .in("property_id", propertyIds)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Erreur récupération candidatures propriétaire:", error)
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      console.log(`✅ ${applications.length} candidatures récupérées pour le propriétaire`)
      return NextResponse.json({ applications })
    }

    return NextResponse.json({ error: "tenant_id ou owner_id requis" }, { status: 400 })
  } catch (error) {
    console.error("❌ Erreur API applications:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("📋 API Applications POST", body)

    const { data, error } = await supabase.from("applications").insert(body).select().single()

    if (error) {
      console.error("❌ Erreur création candidature:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ application: data })
  } catch (error) {
    console.error("❌ Erreur API applications POST:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
