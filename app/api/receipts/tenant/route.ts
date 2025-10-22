import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// GET /api/receipts/tenant
// Retourne la liste des paiements/quittances pour le locataire connecté
export async function GET(request: NextRequest) {
  try {
    const server = createServerClient()

    // Support Bearer token (depuis le client) OU cookies
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization")
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined

    const { data: { user }, error: userError } = token
      ? await server.auth.getUser(token)
      : await server.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    }

    // Récupérer les paiements liés aux baux du locataire
    const { data: payments, error } = await server
      .from("payments")
      .select(`
        id,
        lease_id,
        month,
        month_name,
        year,
        amount_due,
        rent_amount,
        charges_amount,
        due_date,
        payment_date,
        status,
        receipt_id,
        created_at,
        leases!inner(
          id,
          tenant_id
        )
      `)
      .eq("leases.tenant_id", user.id)
      .order("due_date", { ascending: false })

    if (error) {
      console.error("❌ [TENANT RECEIPTS] Erreur récupération paiements:", error)
      return NextResponse.json({ success: false, error: "Erreur lors de la récupération des paiements" }, { status: 500 })
    }

    const mapped = (payments || []).map((p: any) => ({
      id: p.id,
      receipt_id: p.receipt_id,
      month: p.month_name || p.month,
      year: p.year,
      amount: Number(p.rent_amount) || 0,
      charges: Number(p.charges_amount) || 0,
      status: p.status,
      due_date: p.due_date,
      paid_date: p.payment_date || null,
      created_at: p.created_at,
      file_url: p.status === "paid" && p.receipt_id ? `/api/receipts/${p.receipt_id}/download` : null,
    }))

    return NextResponse.json({ success: true, receipts: mapped }, { headers: { "Cache-Control": "no-store" } })
  } catch (err) {
    console.error("❌ [TENANT RECEIPTS] Erreur:", err)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}


