import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@/lib/supabase"

// GET /api/leases/[id]
// Renvoie un bail + enrichissement rental_file si rental_file_id exposé côté lease
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id
    const server = createServerClient()

    // 1) Récupérer le bail
    const { data: lease, error: leaseErr } = await server
      .from("leases")
      .select("*")
      .eq("id", leaseId)
      .single()

    if (leaseErr || !lease) {
      return NextResponse.json({ error: "Bail introuvable" }, { status: 404 })
    }

    // 2) Déterminer un rental_file_id:
    //    - si stocké sur le bail (ex: colonne rental_file_id), on l'utilise
    //    - sinon fallback: récupérer l'application la plus récente du couple (tenant_id, property_id)
    let rentalFileId: string | null = lease.rental_file_id || null

    if (!rentalFileId && lease.tenant_id && lease.property_id) {
      const { data: appByPair } = await server
        .from("applications")
        .select("id, rental_file_id")
        .eq("tenant_id", lease.tenant_id)
        .eq("property_id", lease.property_id)
        .order("created_at", { ascending: false })
        .limit(1)

      rentalFileId = appByPair?.[0]?.rental_file_id || null
    }

    // 3) Charger le rental_file (guarantors) si disponible
    let rentalFile: any = null

    if (rentalFileId) {
      const { data: rf, error: rfErr } = await server
        .from("rental_files")
        .select("*")
        .eq("id", rentalFileId)
        .single()
      if (!rfErr) rentalFile = rf
    }

    return NextResponse.json({ lease, rental_file: rentalFile })
  } catch (e) {
    console.error("❌ GET /api/leases/[id] erreur:", e)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
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