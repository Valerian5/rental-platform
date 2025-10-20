import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// GET /api/incidents/owner?ownerId=...
export async function GET(request: NextRequest) {
  try {
    const server = createServerClient()
    const { searchParams } = new URL(request.url)
    const ownerId = searchParams.get("ownerId")

    if (!ownerId) {
      return NextResponse.json({ error: "Owner ID requis" }, { status: 400 })
    }

    // Auth
    const { data: { user } } = await server.auth.getUser()
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    // Incidents liés aux baux du propriétaire
    const { data: incidents, error } = await server
      .from("incidents")
      .select(`
        *,
        property:properties(id,title,address),
        lease:leases!inner(
          id,
          owner_id,
          tenant:users!leases_tenant_id_fkey(id,first_name,last_name,email)
        )
      `)
      .eq("leases.owner_id", ownerId)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Erreur récupération incidents owner:", error)
      return NextResponse.json({ error: "Erreur base de données" }, { status: 500 })
    }

    return NextResponse.json(incidents || [])
  } catch (error) {
    console.error("Erreur GET /api/incidents/owner:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}


