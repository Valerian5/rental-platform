import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  try {
    const { data: application, error } = await supabase
      .from("applications")
      .select(
        `
        *,
        property:properties(*, owner:users(*)),
        tenant:users(*),
        rental_file:rental_file_id(*)
      `,
      )
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("Erreur récupération application:", error)
      return NextResponse.json({ success: false, error: "Application non trouvée" }, { status: 404 })
    }

    return NextResponse.json({ success: true, application })
  } catch (error) {
    console.error("Erreur serveur:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
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