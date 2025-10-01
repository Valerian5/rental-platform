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

    // Vérifier que l'appelant est le propriétaire du bail
    const { data: lease, error: leaseError } = await supabase
      .from("leases")
      .select("id, owner_id")
      .eq("id", leaseId)
      .single()
    if (leaseError || !lease) return NextResponse.json({ error: "Bail introuvable" }, { status: 404 })
    if (lease.owner_id !== user.id) return NextResponse.json({ error: "Accès interdit" }, { status: 403 })

    const body = await request.json().catch(() => ({}))
    const { paymentId } = body || {}
    if (!paymentId) return NextResponse.json({ error: "paymentId requis" }, { status: 400 })

    // Marquer le paiement comme payé
    const { data: payment, error: upErr } = await supabase
      .from('payments')
      .update({ status: 'paid', payment_date: new Date().toISOString() })
      .eq('id', paymentId)
      .select('*')
      .single()
    if (upErr || !payment) return NextResponse.json({ error: "Erreur validation paiement" }, { status: 500 })

    // Générer la quittance liée au paiement
    const monthStr = (payment.month || '').toString().padStart(2, '0')
    const receiptNumber = `FINAL-${payment.year}-${monthStr}`
    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .insert({
        payment_id: payment.id,
        lease_id: leaseId,
        receipt_number: receiptNumber,
        month: payment.month,
        year: payment.year,
        rent_amount: payment.rent_amount,
        charges_amount: payment.charges_amount,
        total_amount: payment.amount_due,
      } as any)
      .select("*")
      .single()
    if (receiptError) return NextResponse.json({ error: "Erreur création quittance" }, { status: 500 })

    // Lier la quittance au paiement
    await supabase
      .from('payments')
      .update({ receipt_id: receipt.id })
      .eq('id', payment.id)

    // Notifier le locataire: quittance disponible
    try {
      const { notificationsService } = await import("@/lib/notifications-service")
      await notificationsService.createNotification(payment.tenant_id || '', {
        type: 'final_receipt_created',
        title: 'Quittance finale disponible',
        content: `Votre paiement de solde a été confirmé par le propriétaire. La quittance finale est disponible.`,
        action_url: `/tenant/leases/${leaseId}`,
        metadata: { lease_id: leaseId, receipt_id: receipt.id, payment_id: payment.id }
      })
    } catch {}

    return NextResponse.json({ success: true, receipt })
  } catch (error: any) {
    console.error("❌ final-receipt/confirm:", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}


