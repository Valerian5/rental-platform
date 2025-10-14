import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@/lib/supabase-server-client"
import { createClient } from "@/lib/supabase"
import { hasAccessToModule } from "@/lib/feature-gating"

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
    const body = await request.json().catch(() => ({}))
    const previewOnly = !!body?.previewOnly
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

    // Guard premium: exiger module "rent_receipts" actif
    const allowed = await hasAccessToModule(user.id, "rent_receipts")
    if (!allowed) return NextResponse.json({ error: "Fonctionnalité réservée aux plans supérieurs" }, { status: 403 })

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
      reference: `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)} ${year}`,
      receipt_id: null,
      notes: 'Solde prorata départ: paiement généré automatiquement (1er -> jour de départ)'
    } as any

    if (previewOnly) {
      const documentHtml = `
        <div style="font-family: Arial, sans-serif; color:#111; padding:24px; max-width:720px; margin:auto;">
          <h2 style="margin:0 0 12px;">Solde à demander - ${monthName} ${year}</h2>
          <p style="margin:0 0 8px;">Montant dû (prorata): <strong>${totalDue} €</strong></p>
          <p style=\"margin:0 0 8px;\">Détail: Loyer ${rentDue} € + Charges ${chargesDue} € jusqu'au ${dayOfMonth} ${monthName}.</p>
          <p style=\"margin:12px 0 0; font-size:12px; color:#555;\">Ce document informe du solde à régler. La quittance finale sera émise après confirmation du paiement par le propriétaire.</p>
          <p style=\"margin:8px 0 0; font-size:12px; color:#555;\"><em>Les charges du logement que vous quittez étant à payer par provision, le calcul définitif de ce que vous devez pour votre dernière année de location (même si elle est incomplète), ne pourra être fait qu'après la régularisation annuelle des charges.</em></p>
        </div>
      `
      return NextResponse.json({ success: true, preview: { prorata, rentDue, chargesDue, totalDue, month: monthStr, monthName, year, documentHtml } })
    }

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert(paymentInsert)
      .select('*')
      .single()

    if (paymentError || !payment) {
      console.error('❌ create payment stub error:', paymentError)
      return NextResponse.json({ error: 'Erreur création paiement' }, { status: 500 })
    }

    // 2) Notifier le locataire avec le solde à payer (pas de quittance immédiate)
    try {
      const { notificationsService } = await import("@/lib/notifications-service")
      await notificationsService.createNotification(lease.tenant_id, {
        type: 'final_balance_due',
        title: `Solde à régler - ${monthName}`,
        content: `Un solde de ${totalDue} € est à régler pour la période jusqu'au ${dayOfMonth} ${monthName}.`,
        action_url: `/tenant/leases/${leaseId}`,
        metadata: { lease_id: leaseId, payment_id: payment.id, month: monthStr, year }
      })
    } catch (e) {
      console.warn('Notification solde locataire échouée:', e)
    }

    return NextResponse.json({ success: true, payment, prorata, rentDue, chargesDue, totalDue, month: monthStr, monthName, year })
  } catch (error: any) {
    console.error("❌ final-receipt:", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}


