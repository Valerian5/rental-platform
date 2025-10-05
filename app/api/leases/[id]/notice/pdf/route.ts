import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@/lib/supabase-server-client"
import { createClient } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const leaseId = params.id
  const authHeader = request.headers.get("authorization") || ""
  const hasBearer = authHeader.toLowerCase().startsWith("bearer ")
  const token = hasBearer ? authHeader.slice(7) : null
  const url = new URL(request.url)
  const tokenFromQuery = url.searchParams.get('token')
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
      .from('leases')
      .select('id, owner_id, tenant_id')
      .eq('id', leaseId)
      .single()
    if (!lease) return NextResponse.json({ error: 'Bail introuvable' }, { status: 404 })
    if (user.id !== lease.owner_id && user.id !== lease.tenant_id) return NextResponse.json({ error: 'Accès interdit' }, { status: 403 })

    const { data: notice } = await supabase
      .from('lease_notices')
      .select('letter_html')
      .eq('lease_id', leaseId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!notice) return NextResponse.json({ error: 'Aucun préavis' }, { status: 404 })

    const { generateNoticePDF } = await import('@/lib/notice-pdf-generator')
    const pdf = generateNoticePDF(notice.letter_html || '')
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="preavis-${leaseId}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('❌ notice/pdf:', error)
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 })
  }
}