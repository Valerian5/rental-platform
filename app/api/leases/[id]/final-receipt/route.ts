import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@/lib/supabase-server-client"
import { createClient } from "@/lib/supabase"

function daysInMonth(year: number, monthIdx0: number): number {
  return new Date(year, monthIdx0 + 1, 0).getDate()
}

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
      .select("id, owner_id, tenant_id, monthly_rent, charges")
      .eq("id", leaseId)
      .single()
    if (leaseError || !lease) return NextResponse.json({ error: "Bail introuvable" }, { status: 404 })
    if (lease.owner_id !== user.id) return NextResponse.json({ error: "Accès interdit" }, { status: 403 })

    // Récupérer le dernier préavis
    const { data: notice } = await supabase
      .from("lease_notices")
      .select("move_out_date, notice_date")
      .eq("lease_id", leaseId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!notice) return NextResponse.json({ error: "Aucun préavis trouvé" }, { status: 400 })

    const moveOut = new Date(notice.move_out_date)

    // Calcul prorata sur le mois de départ
    const year = moveOut.getFullYear()
    const monthIdx0 = moveOut.getMonth()
    const dim = daysInMonth(year, monthIdx0)
    const dayOfMonth = moveOut.getDate() // départ le jour J inclus -> jours dus = J
    const prorata = dayOfMonth / dim

    const rentDue = Math.round((lease.monthly_rent * prorata) * 100) / 100
    const chargesDue = Math.round(((lease.charges || 0) * prorata) * 100) / 100
    const totalDue = Math.round((rentDue + chargesDue) * 100) / 100

    // 1) Créer un paiement minimal (stub) pour respecter la FK
    const dueDate = new Date(year, monthIdx0, dayOfMonth)
    const monthStr = (monthIdx0 + 1).toString().padStart(2, '0')
    const monthName = moveOut.toLocaleString('fr-FR', { month: 'long' })
    const paymentInsert = {
      lease_id: leaseId,
      month: monthStr,
      year,
      month_name: monthName,
      amount_due: totalDue,
      rent_amount: rentDue,
      charges_amount: chargesDue,
      due_date: dueDate.toISOString(),
      payment_date: null,
      status: 'pending',
      payment_method: null,
      reference: `FINAL-${year}-${monthStr}`,
      receipt_id: null,
      notes: 'Paiement généré automatiquement pour quittance finale (prorata)'
    } as any

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert(paymentInsert)
      .select('*')
      .single()

    if (paymentError || !payment) {
      console.error('❌ create payment stub error:', paymentError)
      return NextResponse.json({ error: 'Erreur création paiement' }, { status: 500 })
    }

    // 2) Créer la quittance finale reliée au paiement
    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .insert({
        payment_id: payment.id,
        lease_id: leaseId,
        receipt_number: `FINAL-${year}-${monthStr}`,
        month: monthStr,
        year,
        rent_amount: rentDue,
        charges_amount: chargesDue,
        total_amount: totalDue,
      } as any)
      .select("*")
      .single()

    if (receiptError) {
      return NextResponse.json({ error: "Erreur création quittance finale" }, { status: 500 })
    }

    // 3) Lier le paiement à la quittance (FK payments.receipt_id)
    await supabase
      .from('payments')
      .update({ receipt_id: receipt.id })
      .eq('id', payment.id)

    return NextResponse.json({ success: true, receipt, prorata, rentDue, chargesDue, totalDue })
  } catch (error: any) {
    console.error("❌ final-receipt:", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}


