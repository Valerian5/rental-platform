import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@/lib/supabase"

function daysInMonth(year: number, monthIdx0: number): number {
  return new Date(year, monthIdx0 + 1, 0).getDate()
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const leaseId = params.id
  const supabase = createServerClient()

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

    // Créer une quittance finale (table receipts ou rent_receipts selon installation)
    const monthStr = (monthIdx0 + 1).toString().padStart(2, '0')
    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .insert({
        payment_id: crypto.randomUUID ? crypto.randomUUID() : undefined, // placeholder si contrainte NOT NULL
        lease_id: leaseId,
        reference: `FINAL-${year}-${monthStr}`,
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

    return NextResponse.json({ success: true, receipt, prorata, rentDue, chargesDue, totalDue })
  } catch (error: any) {
    console.error("❌ final-receipt:", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}


