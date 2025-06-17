import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { data: lease, error } = await supabase
      .from("leases")
      .select(`
        *,
        property:properties(*),
        tenant:users!tenant_id(*),
        owner:users!owner_id(*)
      `)
      .eq("id", params.id)
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      lease,
    })
  } catch (error) {
    console.error("Erreur récupération bail:", error)
    return NextResponse.json({ success: false, error: "Bail non trouvé" }, { status: 404 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { status, signed_by_owner, signed_by_tenant, metadata } = body

    const updates: any = {
      updated_at: new Date().toISOString(),
    }

    if (status !== undefined) updates.status = status
    if (signed_by_owner !== undefined) {
      updates.signed_by_owner = signed_by_owner
      if (signed_by_owner) {
        updates.owner_signature_date = new Date().toISOString()
      }
    }
    if (signed_by_tenant !== undefined) {
      updates.signed_by_tenant = signed_by_tenant
      if (signed_by_tenant) {
        updates.tenant_signature_date = new Date().toISOString()
      }
    }
    if (metadata !== undefined) updates.metadata = metadata

    const { data, error } = await supabase.from("leases").update(updates).eq("id", params.id).select().single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      lease: data,
    })
  } catch (error) {
    console.error("Erreur mise à jour bail:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
