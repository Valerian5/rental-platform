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

    console.log("🔍 [OWNER INCIDENTS] Recherche incidents pour ownerId:", ownerId)

    // Utiliser la même stratégie que l'API payments
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
      .order("created_at", { ascending: false })

    console.log("🔍 [OWNER INCIDENTS] Incidents avec relations:", incidents?.length || 0, incidents)

    if (error) {
      console.error("❌ [OWNER INCIDENTS] Erreur récupération incidents:", error)
      return NextResponse.json({ error: "Erreur base de données" }, { status: 500 })
    }

    console.log("✅ [OWNER INCIDENTS] Retour de", incidents?.length || 0, "incidents")

    return NextResponse.json(incidents || [])
  } catch (error) {
    console.error("Erreur GET /api/incidents/owner:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}


