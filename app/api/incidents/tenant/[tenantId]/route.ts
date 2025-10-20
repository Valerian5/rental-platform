import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// GET /api/incidents/tenant/[tenantId]
export async function GET(request: NextRequest, { params }: { params: { tenantId: string } }) {
  try {
    const tenantId = params.tenantId

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

    // Incidents liés aux baux du locataire
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

    if (error) {
      console.error("Erreur récupération incidents tenant:", error)
      return NextResponse.json({ error: "Erreur base de données" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      incidents: incidents || [] 
    })
  } catch (error) {
    console.error("Erreur GET /api/incidents/tenant/[tenantId]:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
