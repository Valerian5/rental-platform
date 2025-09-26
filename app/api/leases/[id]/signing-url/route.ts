import { NextRequest, NextResponse } from "next/server"
import { docuSignService } from "@/lib/docusign-service"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id
    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role") // "owner" ou "tenant"

    const { data: lease, error } = await supabase
      .from("leases")
      .select(`
        id,
        docusign_envelope_id,
        owner:users!owner_id(first_name, last_name, email),
        tenant:users!tenant_id(first_name, last_name, email)
      `)
      .eq("id", leaseId)
      .single()

    if (error || !lease?.docusign_envelope_id) {
      return NextResponse.json({ error: "Enveloppe non trouvée" }, { status: 404 })
    }

    let url
    if (role === "owner") {
      url = await docuSignService.createEmbeddedSigningView(
        lease.docusign_envelope_id,
        lease.owner.email,
        `${lease.owner.first_name} ${lease.owner.last_name}`,
        `${process.env.NEXT_PUBLIC_SITE_URL}/leases/${leaseId}?signed=true`
      )
    } else if (role === "tenant") {
      url = await docuSignService.createEmbeddedSigningView(
        lease.docusign_envelope_id,
        lease.tenant.email,
        `${lease.tenant.first_name} ${lease.tenant.last_name}`,
        `${process.env.NEXT_PUBLIC_SITE_URL}/leases/${leaseId}?signed=true`
      )
    } else {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 })
    }

    return NextResponse.json({ url })
  } catch (error) {
    console.error("❌ Erreur génération signing URL:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
