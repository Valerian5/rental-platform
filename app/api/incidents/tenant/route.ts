import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// GET /api/incidents/tenant?tenantId=... ou /api/incidents/tenant/[tenantId]
export async function GET(request: NextRequest) {
  try {
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

    // Utiliser service role pour contourner RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Vérifier que l'utilisateur existe et est un locataire
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, user_type")
      .eq("id", tenantId)
      .single()

    if (userError || !user || user.user_type !== "tenant") {
      return NextResponse.json({ error: "Utilisateur non autorisé" }, { status: 403 })
    }

    console.log("🔍 [TENANT INCIDENTS] Recherche incidents pour tenantId:", tenantId)

    // D'abord, vérifier les baux du locataire
    const { data: leases, error: leasesError } = await supabase
      .from("leases")
      .select("id, tenant_id, property_id")
      .eq("tenant_id", tenantId)

    console.log("🔍 [TENANT INCIDENTS] Baux trouvés:", leases?.length || 0, leases)

    if (leasesError) {
      console.error("❌ [TENANT INCIDENTS] Erreur récupération baux:", leasesError)
      return NextResponse.json({ error: "Erreur récupération baux" }, { status: 500 })
    }

    if (!leases || leases.length === 0) {
      console.log("⚠️ [TENANT INCIDENTS] Aucun bail trouvé pour tenantId:", tenantId)
      return NextResponse.json({ 
        success: true, 
        incidents: [] 
      })
    }

    // Récupérer tous les incidents pour ce tenant
    const { data: allIncidents, error: allIncidentsError } = await supabase
      .from("incidents")
      .select("*")
      .in("lease_id", leases.map(l => l.id))

    console.log("🔍 [TENANT INCIDENTS] Tous les incidents trouvés:", allIncidents?.length || 0, allIncidents)

    if (allIncidentsError) {
      console.error("❌ [TENANT INCIDENTS] Erreur récupération incidents:", allIncidentsError)
      return NextResponse.json({ error: "Erreur récupération incidents" }, { status: 500 })
    }

    // Maintenant récupérer avec les relations
    const { data: incidents, error } = await supabase
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
      console.error("❌ [TENANT INCIDENTS] Erreur récupération incidents avec relations:", error)
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


