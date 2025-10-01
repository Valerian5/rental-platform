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

    const { data: lease, error: leaseError } = await supabase
      .from('leases')
      .select('id, owner_id, tenant_id')
      .eq('id', leaseId)
      .single()
    if (leaseError || !lease) return NextResponse.json({ error: 'Bail introuvable' }, { status: 404 })
    if (lease.owner_id !== user.id) return NextResponse.json({ error: 'Accès interdit' }, { status: 403 })

    const body = await request.json().catch(() => ({}))
    const { monthName, year, totalDue, rentDue, chargesDue, dayOfMonth, documentHtml } = body || {}
    if (!monthName || !year || typeof totalDue !== 'number' || typeof rentDue !== 'number' || typeof chargesDue !== 'number' || !dayOfMonth) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    try {
      const { notificationsService } = await import("@/lib/notifications-service")
      await notificationsService.createNotification(lease.tenant_id, {
        type: 'final_balance_info',
        title: `Information solde - ${monthName} ${year}`,
        content: `Un solde estimatif de ${totalDue} € est calculé (prorata jusqu'au ${dayOfMonth} ${monthName}).`,
        action_url: `/tenant/leases/${leaseId}`,
        metadata: { lease_id: leaseId, monthName, year, totalDue, rentDue, chargesDue, dayOfMonth, documentHtml }
      })
    } catch (e) {
      console.warn('Notification info solde échouée:', e)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('❌ final-balance/notify:', error)
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 })
  }
}


