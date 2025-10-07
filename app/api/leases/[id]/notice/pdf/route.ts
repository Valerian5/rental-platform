import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@/lib/supabase-server-client"
import { createClient } from "@/lib/supabase"
import { generateNoticePDFServer } from "@/lib/notice-pdf-server-generator"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const leaseId = params.id
  const authHeader = request.headers.get("authorization") || ""
  const hasBearer = authHeader.toLowerCase().startsWith("bearer ")
  const token = hasBearer ? authHeader.slice(7) : null
  const url = new URL(request.url)
  const tokenFromQuery = url.searchParams.get("token")
  const effectiveToken = token || tokenFromQuery || null

  const supabase = effectiveToken
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        global: { headers: { Authorization: `Bearer ${effectiveToken}` } },
      })
    : createServerClient(request)

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

    const { data: lease } = await supabase
      .from("leases")
      .select(`
        id,
        owner_id,
        tenant_id,
        properties:properties(address),
        tenant:users!leases_tenant_id_fkey(first_name,last_name),
        owner:users!leases_owner_id_fkey(first_name,last_name)
      `)
      .eq("id", leaseId)
      .single()
    if (!lease) return NextResponse.json({ error: "Bail introuvable" }, { status: 404 })
    if (user.id !== lease.owner_id && user.id !== lease.tenant_id)
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 })

    const { data: notice } = await supabase
      .from("lease_notices")
      .select(`notice_date, move_out_date, notice_period_months, metadata`)
      .eq("lease_id", leaseId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!notice) return NextResponse.json({ error: "Aucun préavis" }, { status: 404 })

    // ✅ Générer via template dédié (une page) sans parser le HTML
    const { generateNoticeTemplatePdfBuffer } = await import("@/lib/notice-template-generator")
    const pdfBuffer = generateNoticeTemplatePdfBuffer({
      tenantName: `${lease?.tenant?.first_name || ""} ${lease?.tenant?.last_name || ""}`.trim() || "Locataire",
      ownerName: `${lease?.owner?.first_name || ""} ${lease?.owner?.last_name || ""}`.trim() || "Propriétaire",
      propertyAddress: lease?.properties?.address || "Votre logement",
      noticeDate: notice.notice_date || new Date().toISOString(),
      moveOutDate: notice.move_out_date || new Date().toISOString(),
      noticeMonths: notice.notice_period_months || 1,
      signatureDataUrl: notice.metadata?.signatureDataUrl || null,
    })

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="preavis-${leaseId}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error("❌ notice/pdf:", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}
