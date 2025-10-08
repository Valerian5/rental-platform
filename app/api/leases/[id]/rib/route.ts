import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@/lib/supabase-server-client"
import { createClient } from "@/lib/supabase"

// Le locataire envoie son RIB (IBAN/BIC) au bailleur
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
    const { iban = '', bic = '' } = body || {}
    if (!iban) return NextResponse.json({ error: 'IBAN requis' }, { status: 400 })

    const { data: lease } = await supabase
      .from('leases')
      .select('id, tenant_id, owner_id, completed_data')
      .eq('id', leaseId)
      .single()
    if (!lease) return NextResponse.json({ error: 'Bail introuvable' }, { status: 404 })
    if (lease.tenant_id !== user.id) return NextResponse.json({ error: 'Accès interdit' }, { status: 403 })

    const completed = (lease.completed_data || {}) as any
    completed.deposit_refund_bank = { iban, bic, provided_at: new Date().toISOString() }

    const { error: updErr } = await supabase
      .from('leases')
      .update({ completed_data: completed })
      .eq('id', leaseId)
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

    // notifier le propriétaire
    try {
      const { notificationsService } = await import('@/lib/notifications-service')
      await notificationsService.createNotification(lease.owner_id, {
        type: 'tenant_rib',
        title: 'RIB reçu pour restitution du dépôt',
        content: 'Le locataire a transmis son RIB pour la restitution du dépôt.',
        action_url: `/owner/leases/${leaseId}`,
        metadata: { lease_id: leaseId }
      })
    } catch (e) {
      console.warn('Notification owner (RIB) échouée:', e)
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('rib submit error:', e)
    return NextResponse.json({ error: e.message || 'Erreur serveur' }, { status: 500 })
  }
}


