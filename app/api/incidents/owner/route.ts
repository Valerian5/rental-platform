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

    // D'abord, vérifier les baux du propriétaire
    const { data: leases, error: leasesError } = await server
      .from("leases")
      .select("id, owner_id, property_id")
      .eq("owner_id", ownerId)

    console.log("🔍 [OWNER INCIDENTS] Baux trouvés:", leases?.length || 0, leases)

    if (leasesError) {
      console.error("❌ [OWNER INCIDENTS] Erreur récupération baux:", leasesError)
      return NextResponse.json({ error: "Erreur récupération baux" }, { status: 500 })
    }

    if (!leases || leases.length === 0) {
      console.log("⚠️ [OWNER INCIDENTS] Aucun bail trouvé pour ownerId:", ownerId)
      return NextResponse.json({ 
        success: true, 
        incidents: [] 
      })
    }

    // Récupérer tous les incidents pour ce propriétaire (par lease_id)
    const { data: allIncidents, error: allIncidentsError } = await server
      .from("incidents")
      .select("*")
      .in("lease_id", leases.map(l => l.id))

    console.log("🔍 [OWNER INCIDENTS] Tous les incidents par lease_id:", allIncidents?.length || 0, allIncidents)

    // Récupérer TOUS les incidents de la base pour comparaison
    const { data: allIncidentsInDB, error: allIncidentsInDBError } = await server
      .from("incidents")
      .select("*")

    console.log("🔍 [OWNER INCIDENTS] TOUS les incidents en base:", allIncidentsInDB?.length || 0, allIncidentsInDB)

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

    console.log("🔍 [OWNER INCIDENTS] Incidents avec relations:", incidents?.length || 0, incidents)

    if (error) {
      console.error("❌ [OWNER INCIDENTS] Erreur récupération incidents avec relations:", error)
      return NextResponse.json({ error: "Erreur base de données" }, { status: 500 })
    }

    console.log("✅ [OWNER INCIDENTS] Retour de", incidents?.length || 0, "incidents")

    return NextResponse.json(incidents || [])
  } catch (error) {
    console.error("Erreur GET /api/incidents/owner:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}


