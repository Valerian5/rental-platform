import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@/lib/supabase-server-client"
import { createClient } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const leaseId = params.id
  const authHeader = request.headers.get("authorization") || ""
  const hasBearer = authHeader.toLowerCase().startsWith("bearer ")
  const token = hasBearer ? authHeader.slice(7) : null
  const supabase = hasBearer
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      })
    : createServerClient(request)

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const {
      depositAmount = 0,
      retainedAmount = 0,
      retainedReasons = [],
      calculationDetails = '',
      bankIban = '',
      bankBic = '',
      restitutionDeadlineDays = 30,
    } = body || {}

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
    if (user.id !== lease.owner_id) return NextResponse.json({ error: "Accès interdit" }, { status: 403 })

    const { generateDepositLetterPdfBuffer } = await import("@/lib/deposit-letter-generator")
    const pdfBuffer = generateDepositLetterPdfBuffer({
      tenantName: `${lease?.tenant?.first_name || ''} ${lease?.tenant?.last_name || ''}`.trim() || 'Locataire',
      ownerName: `${lease?.owner?.first_name || ''} ${lease?.owner?.last_name || ''}`.trim() || 'Propriétaire',
      propertyAddress: lease?.properties?.address || 'Votre logement',
      depositAmount,
      retainedAmount,
      retainedReasons,
      calculationDetails,
      bankIban,
      bankBic,
      restitutionDeadlineDays,
    })

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="depot-${leaseId}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error("❌ deposit-letter:", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}


