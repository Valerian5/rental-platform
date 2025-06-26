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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("🔄 [SERVER] Mise à jour bail:", params.id)

    const body = await request.json()
    const { status, signed_by_owner, signed_by_tenant, metadata } = body

    console.log("📝 [SERVER] Données à mettre à jour:", {
      status,
      signed_by_owner,
      signed_by_tenant,
      hasMetadata: !!metadata,
    })

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

    console.log("💾 [SERVER] Mise à jour avec:", updates)

    const { data, error } = await supabase.from("leases").update(updates).eq("id", params.id).select().single()

    if (error) {
      console.error("❌ [SERVER] Erreur mise à jour bail:", error)
      return NextResponse.json({ success: false, error: "Erreur lors de la mise à jour" }, { status: 500 })
    }

    console.log("✅ [SERVER] Bail mis à jour avec succès")

    return NextResponse.json({
      success: true,
      lease: data,
    })
  } catch (error) {
    console.error("❌ [SERVER] Erreur mise à jour:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("🗑️ [SERVER] Suppression bail:", params.id)

    // Vérifier que le bail existe
    const { data: existingLease, error: checkError } = await supabase
      .from("leases")
      .select("id, status")
      .eq("id", params.id)
      .single()

    if (checkError) {
      console.error("❌ [SERVER] Bail non trouvé:", checkError)
      return NextResponse.json({ success: false, error: "Bail non trouvé" }, { status: 404 })
    }

    // Vérifier que le bail peut être supprimé (pas signé)
    if (existingLease.status === "signed") {
      console.log("❌ [SERVER] Tentative de suppression d'un bail signé")
      return NextResponse.json({ success: false, error: "Impossible de supprimer un bail signé" }, { status: 400 })
    }

    // Supprimer le bail
    const { error: deleteError } = await supabase.from("leases").delete().eq("id", params.id)

    if (deleteError) {
      console.error("❌ [SERVER] Erreur suppression bail:", deleteError)
      return NextResponse.json({ success: false, error: "Erreur lors de la suppression" }, { status: 500 })
    }

    console.log("✅ [SERVER] Bail supprimé avec succès")

    return NextResponse.json({
      success: true,
      message: "Bail supprimé avec succès",
    })
  } catch (error) {
    console.error("❌ [SERVER] Erreur suppression:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
