import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@/lib/supabase-server-client"
import { createClient } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Charger le bail pour restreindre l'accès aux parties prenantes
    const { data: lease, error: leaseError } = await supabase
      .from('leases')
      .select('id, owner_id, tenant_id')
      .eq('id', leaseId)
      .single()
    if (leaseError || !lease) return NextResponse.json({ error: 'Bail introuvable' }, { status: 404 })
    if (user.id !== lease.owner_id && user.id !== lease.tenant_id) return NextResponse.json({ error: 'Accès interdit' }, { status: 403 })

    // Dernier paiement de solde en attente (référence commence par "Solde - ")
    const { data: payment } = await supabase
      .from('payments')
      .select('id, lease_id, month, year, month_name, amount_due, rent_amount, charges_amount, due_date, status, reference, notes, created_at')
      .eq('lease_id', leaseId)
      .eq('status', 'pending')
      .ilike('reference', 'Solde - %')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!payment) return NextResponse.json({ success: true, payment: null })

    const detail = `Calcul prorata: loyer (${payment.rent_amount} €) + charges (${payment.charges_amount} €) pour la période du 1 au ${new Date(payment.due_date).getDate()} ${payment.month_name}.`
    const docHtml = `
      <div style="font-family: Arial, sans-serif; color:#111; padding:24px; max-width:720px; margin:auto;">
        <h2 style="margin:0 0 12px;">Solde à régler - ${payment.month_name} ${payment.year}</h2>
        <p style="margin:0 0 8px;">Référence: ${payment.reference}</p>
        <p style="margin:0 0 8px;">Montant dû: <strong>${payment.amount_due} €</strong></p>
        <p style="margin:0 0 8px;">Détail: Loyer ${payment.rent_amount} € + Charges ${payment.charges_amount} €</p>
        <p style="margin:16px 0 0; font-size:12px; color:#555;">Ce document informe du solde à régler. La quittance finale sera émise après confirmation du paiement par le propriétaire.</p>
      </div>
    `

    return NextResponse.json({ success: true, payment, detail, documentHtml: docHtml })
  } catch (error: any) {
    console.error('❌ final-balance GET:', error)
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 })
  }
}


