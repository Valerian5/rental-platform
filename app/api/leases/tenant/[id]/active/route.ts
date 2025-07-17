import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tenantId = params.id
    console.log("🔍 [ACTIVE-LEASE] Récupération bail actif pour locataire:", tenantId)

    const { data: lease, error } = await supabase
      .from("leases")
      .select(`
        *,
        property:properties(
          id,
          title,
          address,
          city,
          price
        ),
        owner:users!leases_owner_id_fkey(
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq("tenant_id", tenantId)
      .in("status", ["active", "signed"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("❌ [ACTIVE-LEASE] Erreur récupération:", error)
      return NextResponse.json({ success: false, error: "Erreur récupération bail" }, { status: 500 })
    }

    if (!lease) {
      console.log("ℹ️ [ACTIVE-LEASE] Aucun bail actif trouvé")
      return NextResponse.json({ success: true, lease: null })
    }

    console.log("✅ [ACTIVE-LEASE] Bail actif récupéré:", lease.id)

    return NextResponse.json({
      success: true,
      lease,
    })
  } catch (error) {
    console.error("❌ [ACTIVE-LEASE] Erreur:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
