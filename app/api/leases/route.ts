import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("🔍 [SERVER] Récupération bail:", params.id)

    const { data: lease, error } = await supabase
      .from("leases")
      .select(`
        *,
        property:properties(*),
        tenant:users!leases_tenant_id_fkey(*),
        owner:users!leases_owner_id_fkey(*)
      `)
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("❌ [SERVER] Erreur récupération bail:", error)
      return NextResponse.json({ success: false, error: "Bail non trouvé" }, { status: 404 })
    }

    console.log("✅ [SERVER] Bail récupéré:", {
      id: lease.id,
      hasGeneratedDocument: !!lease.generated_document,
      documentLength: lease.generated_document?.length || 0,
      documentGeneratedAt: lease.document_generated_at,
    })

    return NextResponse.json({
      success: true,
      lease,
    })
  } catch (error) {
    console.error("❌ [SERVER] Erreur:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
