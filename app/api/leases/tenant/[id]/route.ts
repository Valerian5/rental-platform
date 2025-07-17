import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tenantId = params.id
    console.log("🔍 [TENANT-LEASES] Récupération baux pour locataire:", tenantId)

    const { data: leases, error } = await supabase
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
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ [TENANT-LEASES] Erreur récupération:", error)
      return NextResponse.json({ success: false, error: "Erreur récupération baux" }, { status: 500 })
    }

    console.log("✅ [TENANT-LEASES] Baux récupérés:", leases?.length || 0)

    return NextResponse.json({
      success: true,
      leases: leases || [],
    })
  } catch (error) {
    console.error("❌ [TENANT-LEASES] Erreur:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
