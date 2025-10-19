import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// GET /api/incidents/tenant?tenantId=...
export async function GET(request: NextRequest) {
  try {
    const server = createServerClient()
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId")

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID requis" }, { status: 400 })
    }

    // Auth
    const { data: { user } } = await server.auth.getUser()
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    // Incidents liés aux baux du locataire
    const { data: incidents, error } = await server
      .from("incidents")
      .select(`
        *,
        property:properties(id,title,address),
        lease:leases!inner(
          id,
          tenant_id,
          owner:users!leases_owner_id_fkey(id,first_name,last_name,email)
        )
      `)
      .eq("leases.tenant_id", tenantId)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Erreur récupération incidents tenant:", error)
      return NextResponse.json({ error: "Erreur base de données" }, { status: 500 })
    }

    return NextResponse.json(incidents || [])
  } catch (error) {
    console.error("Erreur GET /api/incidents/tenant:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}


