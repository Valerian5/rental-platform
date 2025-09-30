import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
export const dynamic = "force-dynamic"

// Expose property documents (uploaded by owner) as lease annexes for tenants
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id
    if (!leaseId) {
      return NextResponse.json({ error: "ID de bail requis" }, { status: 400 })
    }

    const server = createServerClient()

    // Fetch lease to get the related property_id
    const { data: lease, error: leaseError } = await server
      .from("leases")
      .select("id, property_id")
      .eq("id", leaseId)
      .single()

    if (leaseError || !lease) {
      return NextResponse.json({ error: "Bail introuvable" }, { status: 404 })
    }

    // Fetch property documents uploaded by the owner
    const { data: docs, error: docsError } = await server
      .from("property_documents")
      .select("id, document_type, document_name, file_url, file_size, uploaded_at")
      .eq("property_id", lease.property_id)
      .order("uploaded_at", { ascending: false })

    if (docsError) {
      return NextResponse.json({ error: "Erreur récupération documents" }, { status: 500 })
    }

    // Map property document types to tenant annex types when needed
    const typeMapping: Record<string, string> = {
      // Harmonisation des clés entre owner et tenant
      insurance: "assurance_pno",
      energy_audit: "audit_energetique",
      electrical_safety: "diagnostic_electricite",
      gas_safety: "diagnostic_gaz",
      asbestos: "diagnostic_amiante",
      lead: "diagnostic_plomb",
      dpe: "dpe",
      erp: "erp",
      // Ces catégories agrégées peuvent ne pas correspondre 1:1 aux annexes
      copropriety_docs: "charges_copropriete",
      other: "autres",
    }

    const annexes = (docs || []).map((d) => ({
      id: d.id,
      annex_type: typeMapping[d.document_type as string] || (d.document_type as string) || "autres",
      file_name: d.document_name,
      file_url: d.file_url,
      file_size: d.file_size ?? 0,
      uploaded_at: d.uploaded_at,
    }))

    return NextResponse.json({ annexes })
  } catch (error) {
    console.error("Erreur /api/leases/[id]/annexes:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

