import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leaseId = params.id
    const server = createServerClient()

    // Récupérer le bail avec les informations de signature
    const { data: lease, error } = await server
      .from("leases")
      .select(`
        id,
        status,
        signed_by_owner,
        signed_by_tenant,
        owner_signature_date,
        tenant_signature_date,
        signature_method,
        docusign_envelope_id,
        docusign_status
      `)
      .eq("id", leaseId)
      .single()

    if (error || !lease) {
      console.error("❌ Bail non trouvé:", error)
      return NextResponse.json({ error: "Bail non trouvé" }, { status: 404 })
    }

    console.log("🔍 [SIGNATURE-STATUS] Données bail:", {
      id: lease.id,
      status: lease.status,
      signature_method: lease.signature_method,
      docusign_envelope_id: lease.docusign_envelope_id
    })

    return NextResponse.json({
      success: true,
      lease: {
        id: lease.id,
        status: lease.status,
        signed_by_owner: lease.signed_by_owner || false,
        signed_by_tenant: lease.signed_by_tenant || false,
        owner_signature_date: lease.owner_signature_date,
        tenant_signature_date: lease.tenant_signature_date,
        signature_method: lease.signature_method,
        docusign_envelope_id: lease.docusign_envelope_id,
        docusign_status: lease.docusign_status,
      }
    })
  } catch (error) {
    console.error("❌ Erreur récupération statut signature:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
