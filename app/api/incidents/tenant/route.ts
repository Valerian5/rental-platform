import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// GET /api/incidents/tenant?tenantId=... ou /api/incidents/tenant/[tenantId]
export async function GET(request: NextRequest) {
  try {
    const server = createServerClient()
    const { searchParams, pathname } = new URL(request.url)
    
    // Extraire tenantId depuis query param ou pathname
    let tenantId = searchParams.get("tenantId")
    if (!tenantId) {
      // Essayer d'extraire depuis le pathname /api/incidents/tenant/[tenantId]
      const pathParts = pathname.split('/')
      tenantId = pathParts[pathParts.length - 1]
    }

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID requis" }, { status: 400 })
    }

    // Vérifier l'authentification
    const { data: { user } } = await server.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    console.log("🔍 [TENANT INCIDENTS] Recherche incidents pour tenantId:", tenantId)

    // Utiliser la même stratégie que l'API payments
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
      .order("created_at", { ascending: false })

    console.log("🔍 [TENANT INCIDENTS] Incidents avec relations:", incidents?.length || 0, incidents)

    if (error) {
      console.error("❌ [TENANT INCIDENTS] Erreur récupération incidents:", error)
      return NextResponse.json({ error: "Erreur base de données" }, { status: 500 })
    }

    console.log("✅ [TENANT INCIDENTS] Retour de", incidents?.length || 0, "incidents")

    return NextResponse.json({ 
      success: true, 
      incidents: incidents || [] 
    })
  } catch (error) {
    console.error("Erreur GET /api/incidents/tenant:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}


